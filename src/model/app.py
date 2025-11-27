import base64
import os
import cv2
import numpy as np
import matplotlib.pyplot as plt
from flask import Flask, request, jsonify
import tensorflow as tf
import tensorflow_hub as hub

from mark_detector import MarkDetector
from pose_estimator import PoseEstimator

app = Flask(__name__)

# Load detector once
multiple_people_detector = hub.load("https://tfhub.dev/tensorflow/efficientdet/d0/1")


def readb64(uri: str) -> np.ndarray:
    """Decode data URL base64 to RGB image."""
    if "," in uri:
        encoded_data = uri.split(",")[1]
    else:
        encoded_data = uri
    nparr = np.frombuffer(base64.b64decode(encoded_data), np.uint8)
    img_bgr = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    if img_bgr is None:
        raise ValueError("Invalid image data")
    img_rgb = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2RGB)
    return img_rgb


def classify_direction(yaw_deg: float, yaw_threshold: float = 15.0) -> str:
    """
    Classify head direction by yaw angle (in degrees).
    - yaw < -threshold => Left
    - yaw > threshold  => Right
    - otherwise        => Straight
    """
    if yaw_deg < -yaw_threshold:
        return "Left"
    if yaw_deg > yaw_threshold:
        return "Right"
    return "Straight"


@app.route("/predict_pose", methods=["POST"])
def predict_pose():
    """
    Input JSON: { "img": "data:image/jpeg;base64,..." }
    Output JSON: {
      "status": "ok" | "no_face",
      "direction": "Left" | "Right" | "Straight",
      "angles": { "yaw": float, "pitch": float, "roll": float }
    }
    """
    data = request.get_json(force=True)
    image = readb64(str(data["img"]))

    # H, W from NumPy shape
    height, width = image.shape[0], image.shape[1]

    pose_estimator = PoseEstimator(img_size=(height, width))
    mark_detector = MarkDetector()

    facebox = mark_detector.extract_cnn_facebox(image)
    if facebox is None:
        return jsonify({"status": "no_face", "message": "Face not found"})

    x1, y1, x2, y2 = facebox
    face_img = image[y1:y2, x1:x2]

    marks = mark_detector.detect_marks(face_img)
    # Map back to full-image coordinates
    marks *= (x2 - x1)
    marks[:, 0] += x1
    marks[:, 1] += y1

    # Solve pose returns (rvec, tvec)
    rvec, tvec = pose_estimator.solve_pose_by_68_points(marks)

    # Convert rotation vector to yaw/pitch/roll (in degrees)
    # Using Rodrigues to rotation matrix, then extract angles
    R, _ = cv2.Rodrigues(rvec)
    sy = np.sqrt(R[0, 0] * R[0, 0] + R[1, 0] * R[1, 0])
    singular = sy < 1e-6
    if not singular:
        pitch = np.arctan2(R[2, 1], R[2, 2])
        yaw = np.arctan2(-R[2, 0], sy)
        roll = np.arctan2(R[1, 0], R[0, 0])
    else:
        pitch = np.arctan2(-R[1, 2], R[1, 1])
        yaw = np.arctan2(-R[2, 0], sy)
        roll = 0.0

    # Convert to degrees
    pitch_deg = float(np.degrees(pitch))
    yaw_deg = float(np.degrees(yaw))
    roll_deg = float(np.degrees(roll))

    direction = classify_direction(yaw_deg, yaw_threshold=15.0)

    # Optional: draw annotation for visualization (not returned)
    _img_vis, _ = pose_estimator.draw_annotation_box(
        image.copy(), rvec, tvec, color=(0, 255, 0)
    )

    return jsonify(
        {
            "status": "ok",
            "direction": direction,
            "angles": {"yaw": yaw_deg, "pitch": pitch_deg, "roll": roll_deg},
        }
    )


@app.route("/predict_people", methods=["POST"])
def predict_people():
    """
    Input JSON: { "img": "data:image/jpeg;base64,..." }
    Output JSON: { "people": int }
    """
    data = request.get_json(force=True)
    image = readb64(str(data["img"]))

    # Model expects float32 [0,1] tensor (batch, h, w, 3)
    img_tensor = tf.convert_to_tensor(image, dtype=tf.float32) / 255.0
    img_tensor = tf.expand_dims(img_tensor, axis=0)

    det = multiple_people_detector(img_tensor)
    boxes = det["detection_boxes"].numpy()[0]        # [N, 4] ymin, xmin, ymax, xmax (normalized)
    classes = det["detection_classes"].numpy()[0]    # [N]
    scores = det["detection_scores"].numpy()[0]      # [N]
    num = int(det["num_detections"].numpy()[0])

    threshold = 0.5
    people = sum(1 for i in range(num) if int(classes[i]) == 1 and scores[i] > threshold)

    return jsonify({"people": int(people)})


@app.route("/save_img", methods=["POST"])
def save_img():
    """
    Input JSON: { "img": "data:image/jpeg;base64,...", "user": "email_or_name" }
    Output JSON: { "path": "/abs/path/to/file.jpg" }
    """
    data = request.get_json(force=True)
    image = readb64(str(data["img"]))
    user = str(data.get("user", "unknown"))

    base_dir = os.getcwd()
    images_dir = os.path.join(base_dir, "images")
    os.makedirs(images_dir, exist_ok=True)

    safe_name = user.replace("/", "_").replace("\\", "_")
    filename = f"{safe_name}.jpg"
    path = os.path.join(images_dir, filename)

    # Save image (note: imsave(path, image))
    plt.imsave(path, image)
    return jsonify({"path": path})


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8080)