import {
  DrawingUtils,
  FaceLandmarker,
  FaceLandmarkerResult,
  FilesetResolver,
} from '@mediapipe/tasks-vision';
import { type FC, useRef, useEffect, useState } from 'react';
import styles from './index.module.scss';

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

// requestAnimationFrame in chrome 60fps and safari ~30fps
const ProcessFrameRate = 1;

const FaceLandmark: FC = () => {
  const video = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const frameRate = useRef<number>(30);
  const frameCounter = useRef<number[]>([]);
  const unprocessedFramesCounter = useRef<number>(0);
  const [webcamRunning, setWebcamRunning] = useState(false);
  const [faceLandmarker, setFaceLandmarker] = useState<FaceLandmarker>();
  const [faceBlendshapes, setFaceBlendshapes] = useState<
    Record<string, number>[]
  >([]);

  const shouldProcessCurrentFrame = () => {
    if (
      unprocessedFramesCounter.current >=
      frameRate.current / ProcessFrameRate
    ) {
      unprocessedFramesCounter.current = 0;
      return true;
    } else {
      unprocessedFramesCounter.current++;
      return false;
    }
  };

  const countFrameRate = () => {
    if (
      frameCounter?.current &&
      frameCounter?.current?.[frameCounter.current?.length - 1] -
        frameCounter.current?.[0] >
        1000
    ) {
      console.log(
        'number of frames in last second:',
        frameCounter?.current.length
      );
      frameCounter.current = [];
    } else {
      frameCounter?.current.push(Date.now());
      requestAnimationFrame(countFrameRate);
    }
  };

  const faceLandmarkFactory = async () => {
    // TODO: Add loading
    const filesetResolver = await FilesetResolver.forVisionTasks(
      'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm'
    );
    const faceLandmarkerInstance = await FaceLandmarker.createFromOptions(
      filesetResolver,
      {
        baseOptions: {
          modelAssetPath: `https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task`,
          // it is deligated for cpu but the error in console is just an info and
          // not a bad practice <- python community
          // things get really slow when it is on cpu
          delegate: 'GPU',
        },
        outputFaceBlendshapes: true,
        runningMode: 'VIDEO',
        // parameters
        numFaces: 1,
        minFacePresenceConfidence: 0.5,
        minFaceDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5,
      }
    );
    setFaceLandmarker(faceLandmarkerInstance);
  };

  useEffect(() => {
    faceLandmarkFactory();
    setTimeout(() => {
      countFrameRate();
    }, 3000);
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
    if (
      lastVideoTime !== video.current.currentTime &&
      shouldProcessCurrentFrame()
    ) {
      lastVideoTime = video.current.currentTime;
      results = faceLandmarker?.detectForVideo(video?.current, startTimeMs);

      if (results) {
        drawEwsults(results);
        extractUsefulDataFromResults(results);
      }
    }

    if (webcamRunning === true) {
      window.requestAnimationFrame(predictWebcam);
    }
  }

  const extractUsefulDataFromResults = (results: FaceLandmarkerResult) => {
    const usefulResults = results?.faceBlendshapes?.[0]?.categories?.filter(
      (item) => reportUsefulKeys.some((rep) => rep === item?.categoryName)
    );
    const formatedResults: Record<string, number> = {};

    usefulResults?.forEach((item) => {
      formatedResults[item.categoryName] = +item.score.toFixed(3);
    });

    setFaceBlendshapes((prev) => [...prev, formatedResults]);
  };

  const startCamera = () => {
    const constraints = {
      video: { width: 640, height: 370 },

      // facingMode: { exact: 'user' },
      // frameRate: { ideal: 4, max: 5 },
    };
    navigator.mediaDevices.getUserMedia(constraints).then((stream) => {
      if (!video?.current) return;
      video.current.srcObject = stream;
      const currentStream = video.current?.srcObject?.getVideoTracks()?.[0];
      // currentStream
      //   .applyConstraints({ facingMode: { exact: 'user' } })
      //   .catch((error) => {
      //     console.log('video set constraint error:', error);
      //   });
      console.log('current stream info', {
        getSettings: currentStream.getSettings(),
        getCapabilities: currentStream.getCapabilities(),
        getConstraints: currentStream.getConstraints(),
        kind: currentStream.kind,
        label: currentStream.label,
      });

      video.current?.addEventListener(
        'loadeddata',
        () => {
          predictWebcam();
          if (!video?.current) return;
          video.current.play();

          console.log(
            'streaming video frame rate:',
            currentStream.getSettings().frameRate,
            'fps'
          );
          frameRate.current = currentStream?.getSettings()?.frameRate || 30;
          // this is not working :(
          // video.current.requestVideoFrameCallback(() => {
          //   console.log('requestVideoFrameCallback');
          // });
        },
        { once: true }
      );
    });
  };

  const drawEwsults = (faceLandmarkerResult: FaceLandmarkerResult) => {
    if (!canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;
    ctx?.clearRect(0, 0, 640, 370);
    const drawingUtils = new DrawingUtils(ctx);
    for (const landmarks of faceLandmarkerResult.faceLandmarks) {
      console.log(
        'FaceLandmarker.FACE_LANDMARKS_FACE_OVAL',
        FaceLandmarker.FACE_LANDMARKS_FACE_OVAL
      );
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
    <div className={styles.contatiner}>
      <video
        className={styles.video}
        ref={(element) => {
          video.current = element;
          setWebcamRunning(true);
        }}
        width={640}
        height={370}
      />
      <canvas
        className={styles.canvas}
        ref={canvasRef}
        width={640}
        height={370}
        style={{ border: '1px solid black' }}
      />
      <pre>{JSON.stringify(faceBlendshapes, null, 2)}</pre>
    </div>
  );
};

export default FaceLandmark;
