import { useEffect, useRef, useState } from 'react';
import { FaceLandmarker, FilesetResolver, FaceLandmarkerResult } from '@mediapipe/tasks-vision';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Camera, Users, Eye } from 'lucide-react';

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
  const [faceLandmarker, setFaceLandmarker] = useState<FaceLandmarker | null>(null);
  const [peopleCount, setPeopleCount] = useState(1);
  const [faceDirection, setFaceDirection] = useState('Forward');
  const [violations, setViolations] = useState<Detection[]>([]);
  const monitoringIntervalRef = useRef<number | null>(null);
  const lastDetectionRef = useRef<{ faces: number; direction: string; timestamp: number }>({
    faces: 1,
    direction: 'Forward',
    timestamp: Date.now()
  });

  // Initialize MediaPipe Face Landmarker
  useEffect(() => {
    const initFaceLandmarker = async () => {
      try {
        const vision = await FilesetResolver.forVisionTasks(
          'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
        );
        
        const landmarker = await FaceLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task',
            delegate: 'GPU'
          },
          outputFaceBlendshapes: false,
          outputFacialTransformationMatrixes: true,
          runningMode: 'VIDEO',
          numFaces: 2
        });
        
        setFaceLandmarker(landmarker);
        setIsInitialized(true);
        console.log('MediaPipe Face Landmarker initialized');
      } catch (err) {
        console.error('Error initializing Face Landmarker:', err);
        setError('Failed to initialize AI models');
      }
    };

    initFaceLandmarker();

    return () => {
      faceLandmarker?.close();
    };
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

    // Monitor every 2 seconds for more responsive detection
    monitoringIntervalRef.current = window.setInterval(async () => {
      await analyzeFrame();
    }, 2000);
  };

  const calculateHeadPose = (result: FaceLandmarkerResult): string => {
    if (!result.facialTransformationMatrixes || result.facialTransformationMatrixes.length === 0) {
      return 'Forward';
    }

    const matrix = result.facialTransformationMatrixes[0].data;
    
    // Extract rotation angles from transformation matrix
    // Using simplified Euler angle extraction
    const rotationY = Math.atan2(matrix[8], matrix[10]);
    const rotationYDegrees = rotationY * (180 / Math.PI);

    // Determine direction based on Y-axis rotation
    if (rotationYDegrees < -20) {
      return 'Left';
    } else if (rotationYDegrees > 20) {
      return 'Right';
    } else {
      return 'Forward';
    }
  };

  const analyzeFrame = async () => {
    if (!videoRef.current || !faceLandmarker) return;

    const video = videoRef.current;
    
    // Check if video is ready
    if (video.readyState !== video.HAVE_ENOUGH_DATA) return;

    try {
      const startTimeMs = performance.now();
      const result = faceLandmarker.detectForVideo(video, startTimeMs);

      const currentTime = Date.now();
      const facesDetected = result.faceLandmarks.length;

      // Update people count
      setPeopleCount(facesDetected);

      // Determine face direction for the first detected face
      let direction = 'Forward';
      let isLookingAway = false;

      if (facesDetected > 0) {
        direction = calculateHeadPose(result);
        isLookingAway = direction !== 'Forward';
        setFaceDirection(direction);
      }

      // Check for violations with debouncing (only trigger if consistent for 2 checks)
      const timeSinceLastCheck = currentTime - lastDetectionRef.current.timestamp;
      
      // Multiple people violation
      if (facesDetected > 1 && lastDetectionRef.current.faces > 1) {
        const violation: Detection = {
          timestamp: currentTime,
          type: 'multiple_people',
          details: { count: facesDetected }
        };
        setViolations(prev => [...prev, violation]);
        onViolation('multiple_people', { count: facesDetected });
      }

      // No face detected violation
      if (facesDetected === 0 && lastDetectionRef.current.faces === 0) {
        const violation: Detection = {
          timestamp: currentTime,
          type: 'no_face',
          details: {}
        };
        setViolations(prev => [...prev, violation]);
        onViolation('no_face');
      }

      // Looking away violation
      if (facesDetected === 1 && isLookingAway && 
          lastDetectionRef.current.direction !== 'Forward' && 
          timeSinceLastCheck > 1000) {
        const violation: Detection = {
          timestamp: currentTime,
          type: 'looking_away',
          details: { direction }
        };
        setViolations(prev => [...prev, violation]);
        onViolation('looking_away', { direction });
      }

      // Update last detection
      lastDetectionRef.current = {
        faces: facesDetected,
        direction,
        timestamp: currentTime
      };

      // Update status
      onStatusUpdate({
        peopleCount: facesDetected,
        faceDirection: direction,
        isLookingAway
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