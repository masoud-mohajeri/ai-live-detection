import { FaceLandmarker, FilesetResolver } from '@mediapipe/tasks-vision';
import { type FC, useRef, useEffect, useState } from 'react';
let lastVideoTime = -1;

const FaceLandmark: FC = () => {
  const video = useRef<HTMLVideoElement | null>(null);
  const [webcamRunning, setWebcamRunning] = useState(false);
  const [faceLandmarker, setFaceLandmarker] = useState<FaceLandmarker>();

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
    }

    // Call this function again to keep predicting when the browser is ready.
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
      video.current.play();
      video.current?.addEventListener('loadeddata', () => {
        // predictWebcam();
      });
    });
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
    </div>
  );
};

export default FaceLandmark;
