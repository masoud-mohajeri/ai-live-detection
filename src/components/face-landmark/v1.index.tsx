//https://codepen.io/mediapipe-preview/pen/OJBVQJm
import { FC, useEffect, useRef, useState } from 'react';
import { FaceLandmarker, FilesetResolver } from '@mediapipe/tasks-vision';

// import './index.scss';

const FaceLandmark: FC = () => {
  const [inputVideoReady, setInputVideoReady] = useState(false);
  const inputVideoRef = useRef<HTMLVideoElement | null>(null);

  const createFaceLandmarker = async () => {
    try {
      const filesetResolver = await FilesetResolver.forVisionTasks(
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm'
      );
      const faceLandmarker = await FaceLandmarker.createFromOptions(
        filesetResolver,
        {
          baseOptions: {
            modelAssetPath: `https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task`,
            delegate: 'CPU',
          },
          outputFaceBlendshapes: true,
          runningMode: 'VIDEO',
          numFaces: 1,
        }
      );

      return faceLandmarker;
    } catch (error) {
      console.log('error in createFaceLandmarker', error);
    }
  };
  let lastVideoTime = -1;
  let results: any;

  async function predictWebcam() {
    const video = inputVideoRef.current;

    const faceLandmarker = await createFaceLandmarker();
    if (!faceLandmarker) return;
    if (!video) return;
    // Now let's start detecting the stream.
    let startTimeMs = performance.now();
    if (lastVideoTime !== video.currentTime) {
      lastVideoTime = video.currentTime;
      results = faceLandmarker.detectForVideo(video, startTimeMs);
    }

    console.log('results.faceBlendshapes', { results, FaceLandmarker });
    // requestAnimationFrame(predictWebcam);
  }
  const makeCameraReady = () => {
    const constraints = {
      video: true,
    };

    navigator.mediaDevices
      .getUserMedia(constraints)
      .then((stream) => {
        if (!inputVideoRef.current) return;
        console.log('camera is ready', stream);
        inputVideoRef.current.srcObject = stream;
        inputVideoRef.current.addEventListener('loadeddata', () => {
          console.log('play video from camera', stream);

          inputVideoRef.current?.play();
          predictWebcam();
        });
      })
      .catch((error) => {
        console.log('error in video play', error);
      });
  };

  useEffect(() => {
    if (inputVideoReady) {
      makeCameraReady();
    }
  }, [inputVideoReady]);

  return (
    <div className='hands-container'>
      <video
        style={{
          width: 500,
          height: 500,
        }}
        autoPlay
        ref={(el) => {
          inputVideoRef.current = el;
          setInputVideoReady(!!el);
        }}
      />
      {/* <canvas ref={canvasRef} width={1280} height={720} /> */}
    </div>
  );
};

export default FaceLandmark;
