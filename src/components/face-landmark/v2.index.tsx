import {
  DrawingUtils,
  FaceLandmarker,
  FilesetResolver,
} from '@mediapipe/tasks-vision';
import { type FC, useRef, useEffect, useState } from 'react';
let lastVideoTime = -1;

const reportUsefulKeys = [
  'eyeBlinkLeft',
  'eyeBlinkRight',
  // baaaaank
  'jawOpen',
  // bluuuuuu
  'mouthPucker',
  'mouthFunnel',
  // mmman
  'mouthShrugLower',
  'mouthRollUpper',
  'mouthRollLower',
];

const FaceLandmark: FC = () => {
  const video = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [webcamRunning, setWebcamRunning] = useState(false);
  const [faceLandmarker, setFaceLandmarker] = useState<FaceLandmarker>();
  const [faceBlendshapes, setFaceBlendshapes] = useState<any>([]);

  const faceLandmarkFactory = async () => {
    const filesetResolver = await FilesetResolver.forVisionTasks(
      'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm'
    );
    const faceLandmarkerInstance = await FaceLandmarker.createFromOptions(
      filesetResolver,
      {
        baseOptions: {
          modelAssetPath: `https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task`,
          delegate: 'GPU',
        },
        outputFaceBlendshapes: true,
        runningMode: 'VIDEO',
        numFaces: 1,
      }
    );
    setFaceLandmarker(faceLandmarkerInstance);
  };

  useEffect(() => {
    faceLandmarkFactory();
  }, []);

  useEffect(() => {
    if (webcamRunning && faceLandmarker) {
      startCamera();
    }
  }, [faceLandmarker, webcamRunning]);

  async function predictWebcam() {
    let results;

    let startTimeMs = performance.now();
    if (!video?.current) return;
    if (lastVideoTime !== video.current.currentTime) {
      lastVideoTime = video.current.currentTime;

      results = faceLandmarker?.detectForVideo(video?.current, startTimeMs);
      drawEwsults(results);
      setFaceBlendshapes(
        results?.faceBlendshapes?.[0]?.categories?.filter((item) =>
          reportUsefulKeys.some((rep) => rep === item?.categoryName)
        )
      );
    }

    if (webcamRunning === true) {
      window.requestAnimationFrame(predictWebcam);
    }
  }

  const startCamera = () => {
    const constraints = {
      video: true,
    };
    navigator.mediaDevices.getUserMedia(constraints).then((stream) => {
      if (!video?.current) return;
      video.current.srcObject = stream;
      video.current?.addEventListener('loadeddata', () => {
        predictWebcam();
        if (!video?.current) return;
        video.current.play();
      });
    });
  };

  const drawEwsults = (faceLandmarkerResult: any) => {
    if (!canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;
    ctx?.clearRect(0, 0, 500, 500);
    const drawingUtils = new DrawingUtils(ctx);
    for (const landmarks of faceLandmarkerResult.faceLandmarks) {
      drawingUtils.drawConnectors(
        landmarks,
        FaceLandmarker.FACE_LANDMARKS_RIGHT_EYE,
        { color: '#FF3030' }
      );
      drawingUtils.drawConnectors(
        landmarks,
        FaceLandmarker.FACE_LANDMARKS_LEFT_EYE,
        { color: '#30FF30' }
      );
      drawingUtils.drawConnectors(
        landmarks,
        FaceLandmarker.FACE_LANDMARKS_FACE_OVAL,
        { color: '#E0E0E0' }
      );
      drawingUtils.drawConnectors(
        landmarks,
        FaceLandmarker.FACE_LANDMARKS_LIPS,
        { color: '#E0E0E0' }
      );
    }
  };

  return (
    <div>
      <video
        ref={(element) => {
          video.current = element;
          setWebcamRunning(true);
        }}
        width={500}
        height={500}
      />
      <canvas
        ref={canvasRef}
        width={500}
        height={500}
        style={{ border: '1px solid black' }}
      />
      <pre>{JSON.stringify(faceBlendshapes, null, 2)}</pre>
    </div>
  );
};

export default FaceLandmark;
