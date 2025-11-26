import { useEffect, useRef, useState } from 'react';
import * as tf from '@tensorflow/tfjs';
import '@tensorflow/tfjs-backend-webgl';
import { pipeline, env } from '@huggingface/transformers';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Camera, Users, Eye } from 'lucide-react';

// Configure transformers.js
env.allowLocalModels = false;
env.useBrowserCache = true;

interface WebcamMonitorProps {
  isActive: boolean;
  onViolation: (type: 'multiple_people' | 'no_face' | 'looking_away', details?: any) => void;
  onStatusUpdate: (status: { peopleCount: number; faceDirection: string; isLookingAway: boolean }) => void;
}

interface Detection {
  timestamp: number;
  type: 'multiple_people' | 'no_face' | 'looking_away';
  details?: any;
}

const WebcamMonitor = ({ isActive, onViolation, onStatusUpdate }: WebcamMonitorProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [detectionModel, setDetectionModel] = useState<any>(null);
  const [peopleCount, setPeopleCount] = useState(1);
  const [faceDirection, setFaceDirection] = useState('Forward');
  const [violations, setViolations] = useState<Detection[]>([]);
  const monitoringIntervalRef = useRef<number | null>(null);

  // Initialize TensorFlow.js
  useEffect(() => {
    const initTensorFlow = async () => {
      try {
        await tf.ready();
        console.log('TensorFlow.js initialized');
        
        // Load COCO-SSD model for object detection
        const model = await pipeline('object-detection', 'Xenova/detr-resnet-50', {
          device: 'webgpu',
        });
        setDetectionModel(model);
        setIsInitialized(true);
      } catch (err) {
        console.error('Error initializing TensorFlow:', err);
        setError('Failed to initialize AI models');
      }
    };

    initTensorFlow();
  }, []);

  // Setup webcam when active
  useEffect(() => {
    if (!isActive || !isInitialized) {
      stopWebcam();
      return;
    }

    startWebcam();

    return () => {
      stopWebcam();
    };
  }, [isActive, isInitialized]);

  const startWebcam = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user'
        },
        audio: false
      });

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        setStream(mediaStream);
        
        videoRef.current.onloadedmetadata = () => {
          startMonitoring();
        };
      }
    } catch (err) {
      console.error('Error accessing webcam:', err);
      setError('Webcam access denied. Please enable webcam to continue the test.');
    }
  };

  const stopWebcam = () => {
    if (monitoringIntervalRef.current) {
      clearInterval(monitoringIntervalRef.current);
      monitoringIntervalRef.current = null;
    }

    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  const startMonitoring = () => {
    if (monitoringIntervalRef.current) {
      clearInterval(monitoringIntervalRef.current);
    }

    // Monitor every 3 seconds
    monitoringIntervalRef.current = window.setInterval(async () => {
      await analyzeFrame();
    }, 3000);
  };

  const analyzeFrame = async () => {
    if (!videoRef.current || !canvasRef.current || !detectionModel) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    if (!ctx) return;

    // Set canvas dimensions to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw current video frame to canvas
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    try {
      // Convert canvas to image data for analysis
      const imageData = canvas.toDataURL('image/jpeg', 0.8);
      
      // Detect objects in the frame
      const detections = await detectionModel(imageData);
      
      let peopleDetected = 0;
      let faceDetected = false;

      // Count people and faces
      detections.forEach((detection: any) => {
        if (detection.label === 'person' && detection.score > 0.5) {
          peopleDetected++;
        }
        // Additional face detection logic can be added here
      });

      // Update people count
      setPeopleCount(peopleDetected);

      // Check for violations
      const currentTime = Date.now();

      // Multiple people violation
      if (peopleDetected > 1) {
        const violation: Detection = {
          timestamp: currentTime,
          type: 'multiple_people',
          details: { count: peopleDetected }
        };
        setViolations(prev => [...prev, violation]);
        onViolation('multiple_people', { count: peopleDetected });
      }

      // No person detected violation
      if (peopleDetected === 0) {
        const violation: Detection = {
          timestamp: currentTime,
          type: 'no_face',
          details: {}
        };
        setViolations(prev => [...prev, violation]);
        onViolation('no_face');
      }

      // Update status
      onStatusUpdate({
        peopleCount: peopleDetected,
        faceDirection,
        isLookingAway: false // This would need more sophisticated pose estimation
      });

    } catch (err) {
      console.error('Error analyzing frame:', err);
    }
  };

  const getViolationColor = (count: number) => {
    if (count === 0) return 'text-green-500';
    if (count <= 2) return 'text-yellow-500';
    if (count <= 5) return 'text-orange-500';
    return 'text-destructive';
  };

  if (error) {
    return (
      <Alert variant="destructive" className="mb-4">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (!isInitialized) {
    return (
      <Alert className="mb-4">
        <Camera className="h-4 w-4" />
        <AlertDescription>Initializing AI monitoring system...</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-4">
      {/* Hidden video and canvas elements */}
      <video
        ref={videoRef}
        autoPlay
        muted
        playsInline
        className="hidden"
      />
      <canvas ref={canvasRef} className="hidden" />

      {/* Monitoring status */}
      {isActive && (
        <div className="flex items-center gap-4 p-3 bg-card/50 rounded-lg border">
          <div className="flex items-center gap-2">
            <Camera className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">AI Monitoring Active</span>
          </div>

          <div className="flex items-center gap-2">
            <Users className="h-3 w-3" />
            <span className={`text-sm ${getViolationColor(peopleCount > 1 ? 1 : 0)}`}>
              {peopleCount} {peopleCount === 1 ? 'person' : 'people'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Eye className="h-3 w-3" />
            <span className="text-sm">Looking {faceDirection}</span>
          </div>

          {violations.length > 0 && (
            <Badge variant="destructive" className="ml-auto">
              {violations.length} violations detected
            </Badge>
          )}
        </div>
      )}

      {/* Recent violations */}
      {violations.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Recent Violations:</h4>
          {violations.slice(-3).map((violation, index) => (
            <Alert key={index} variant="destructive" className="py-2">
              <AlertTriangle className="h-3 w-3" />
              <AlertDescription className="text-xs">
                {violation.type === 'multiple_people' && 
                  `Multiple people detected (${violation.details?.count})`}
                {violation.type === 'no_face' && 'No person detected in frame'}
                {violation.type === 'looking_away' && 'Looking away from screen'}
                <span className="ml-2 text-muted-foreground">
                  {new Date(violation.timestamp).toLocaleTimeString()}
                </span>
              </AlertDescription>
            </Alert>
          ))}
        </div>
      )}
    </div>
  );
};

export default WebcamMonitor;