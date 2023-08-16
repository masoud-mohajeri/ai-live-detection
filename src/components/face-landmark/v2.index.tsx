import {
  DrawingUtils,
  FaceLandmarker,
  FaceLandmarkerResult,
  FilesetResolver,
  NormalizedLandmark,
} from '@mediapipe/tasks-vision'
import { type FC, useRef, useEffect, useState } from 'react'
import styles from './index.module.scss'
import { FacePartsPolygon, videoHeight, videoWidth } from './constants'
import { calculatePolygonArea } from './utils'

let lastVideoTime = -1

/**
 * TODO
 * make list of points for current polygons
 * calculate area
 */

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
]

// requestAnimationFrame in chrome 60fps and safari ~30fps
const ProcessFrameRate = 6

const FaceLandmark: FC = () => {
  const video = useRef<HTMLVideoElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const frameRate = useRef<number>(30)
  const frameCounter = useRef<number[]>([])
  const unprocessedFramesCounter = useRef<number>(0)
  const [webcamRunning, setWebcamRunning] = useState(false)
  const [faceLandmarker, setFaceLandmarker] = useState<FaceLandmarker>()
  const [faceBlendshapes, setFaceBlendshapes] = useState<Record<string, number>[]>([])

  const shouldProcessCurrentFrame = () => {
    if (unprocessedFramesCounter.current >= frameRate.current / ProcessFrameRate) {
      unprocessedFramesCounter.current = 0
      return true
    } else {
      unprocessedFramesCounter.current++
      return false
    }
  }

  const countFrameRate = () => {
    if (
      frameCounter?.current &&
      frameCounter?.current?.[frameCounter.current?.length - 1] - frameCounter.current?.[0] > 1000
    ) {
      console.log('number of frames in last second:', frameCounter?.current.length)
      frameCounter.current = []
    } else {
      frameCounter?.current.push(Date.now())
      requestAnimationFrame(countFrameRate)
    }
  }

  const faceLandmarkFactory = async () => {
    // TODO: Add loading
    const filesetResolver = await FilesetResolver.forVisionTasks(
      'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm',
    )
    const faceLandmarkerInstance = await FaceLandmarker.createFromOptions(filesetResolver, {
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
      numFaces: 3, // there are more that 1 person in video
      minFacePresenceConfidence: 0.5,
      minFaceDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5,
    })
    setFaceLandmarker(faceLandmarkerInstance)
  }

  useEffect(() => {
    faceLandmarkFactory()
    countFrameRate()
  }, [])

  useEffect(() => {
    if (webcamRunning && faceLandmarker) {
      startCamera()
    }
  }, [faceLandmarker, webcamRunning])

  async function predictWebcam() {
    let results

    let startTimeMs = performance.now()
    if (!video?.current) return
    if (lastVideoTime !== video.current.currentTime && shouldProcessCurrentFrame()) {
      lastVideoTime = video.current.currentTime
      results = faceLandmarker?.detectForVideo(video?.current, startTimeMs)

      if (results) {
        if (results.faceLandmarks.length === 0) {
          console.log('no face detected')
        }

        if (results.faceLandmarks.length > 1) {
          console.log('there are more that 1 person in video')
        }

        if (results.faceLandmarks.length === 1) {
          console.log('there is only 1 person in video')
          calculateAreas(results.faceLandmarks[0])
          extractFaceBlendshapeData(results)
        }
        drawResults(results)
      }
    }

    if (webcamRunning === true) {
      window.requestAnimationFrame(predictWebcam)
    }
  }

  const calculateAreas = (results: NormalizedLandmark[]) => {
    // console.log('results', results)
    const faceArea = calculatePolygonArea(pickPolygonPoints(results, FacePartsPolygon.faceOval))
    const leftEyeArea = calculatePolygonArea(pickPolygonPoints(results, FacePartsPolygon.leftEye))
    const rightEyeArea = calculatePolygonArea(pickPolygonPoints(results, FacePartsPolygon.rightEye))
    const lipsArea = calculatePolygonArea(pickPolygonPoints(results, FacePartsPolygon.lips))
    console.log('Areas', { faceArea, rightEyeArea, leftEyeArea, lipsArea })
    // console.log('FaceLandmarker.FACE_LANDMARKS_FACE_OVAL', FaceLandmarker.FACE_LANDMARKS_FACE_OVAL)
  }

  const pickPolygonPoints = (polygon: NormalizedLandmark[], demandedIndexes: number[]) => {
    const results = []
    for (let key of demandedIndexes) {
      results.push(polygon[key])
    }
    return results
  }

  const extractFaceBlendshapeData = (results: FaceLandmarkerResult) => {
    const usefulResults = results?.faceBlendshapes?.[0]?.categories?.filter((item) =>
      reportUsefulKeys.some((rep) => rep === item?.categoryName),
    )
    const formattedResults: Record<string, number> = {}

    usefulResults?.forEach((item) => {
      formattedResults[item.categoryName] = +item.score.toFixed(3)
    })

    setFaceBlendshapes((prev) => [...prev, formattedResults])
  }

  const startCamera = () => {
    const constraints = {
      video: { width: videoWidth, height: videoHeight },

      // facingMode: { exact: 'user' },
      // frameRate: { ideal: 4, max: 5 },
    }
    navigator.mediaDevices.getUserMedia(constraints).then((stream) => {
      if (!video?.current) return
      video.current.srcObject = stream
      const currentStream = video.current?.srcObject?.getVideoTracks()?.[0]
      // currentStream
      //   .applyConstraints({ facingMode: { exact: 'user' } })
      //   .catch((error) => {
      //     console.log('video set constraint error:', error);
      //   });
      // console.log('current stream info', {
      //   getSettings: currentStream.getSettings(),
      //   getCapabilities: currentStream.getCapabilities(),
      //   getConstraints: currentStream.getConstraints(),
      //   kind: currentStream.kind,
      //   label: currentStream.label,
      // });

      video.current?.addEventListener(
        'loadeddata',
        () => {
          predictWebcam()
          if (!video?.current) return
          video.current.play()

          console.log('streaming video frame rate:', currentStream.getSettings().frameRate, 'fps')
          frameRate.current = currentStream?.getSettings()?.frameRate || 30
          // this is not working :(
          // video.current.requestVideoFrameCallback(() => {
          //   console.log('requestVideoFrameCallback');
          // });
        },
        { once: true },
      )
    })
  }

  const drawResults = (faceLandmarkerResult: FaceLandmarkerResult) => {
    if (!canvasRef.current) return
    const ctx = canvasRef.current.getContext('2d')
    if (!ctx) return
    ctx?.clearRect(0, 0, videoWidth, videoHeight)
    const drawingUtils = new DrawingUtils(ctx)

    for (const landmarks of faceLandmarkerResult.faceLandmarks) {
      drawingUtils.drawConnectors(landmarks, FaceLandmarker.FACE_LANDMARKS_RIGHT_EYE, { color: '#FF3030' })
      drawingUtils.drawConnectors(landmarks, FaceLandmarker.FACE_LANDMARKS_LEFT_EYE, { color: '#30FF30' })
      drawingUtils.drawConnectors(landmarks, FaceLandmarker.FACE_LANDMARKS_FACE_OVAL, { color: '#E0E0E0' })
      drawingUtils.drawConnectors(landmarks, FaceLandmarker.FACE_LANDMARKS_LIPS, { color: '#E0E0E0' })
    }
  }

  return (
    <div className={styles.contatiner}>
      <video
        className={styles.video}
        ref={(element) => {
          video.current = element
          setWebcamRunning(true)
        }}
        width={videoWidth}
        height={videoHeight}
      />
      <canvas
        className={styles.canvas}
        ref={canvasRef}
        width={videoWidth}
        height={videoHeight}
        style={{ border: '1px solid black' }}
      />
      <pre>{JSON.stringify(faceBlendshapes, null, 2)}</pre>
    </div>
  )
}

export default FaceLandmark
