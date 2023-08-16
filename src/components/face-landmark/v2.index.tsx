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
// import { calculatePolygonArea } from './utils'

let lastVideoTime = -1

/**
 * TODO
 * make list of points for current polygons
 * calculate area
 *
 * add a debounce for starting to process -> 100ms
 *
 * separate different parts and make it more scalable
 * add audio
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
const ProcessFrameRate = 10

const FaceLandmark: FC = () => {
  const video = useRef<HTMLVideoElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const frameRate = useRef<number>(30)
  const frameCounter = useRef<number[]>([])
  const unprocessedFramesCounter = useRef<number>(0)
  const [webcamRunning, setWebcamRunning] = useState(false)
  const [faceLandmarker, setFaceLandmarker] = useState<FaceLandmarker>()
  const [extractedData, setExtractedData] = useState<{}[]>([])

  const shouldProcessCurrentFrame = () => {
    if (unprocessedFramesCounter.current >= ProcessFrameRate) {
      console.log('frame processed')
      unprocessedFramesCounter.current = 0
      return true
    } else {
      console.log('frame passed')
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
    setInterval(() => {
      countFrameRate()
    }, 3000)
  }, [])

  useEffect(() => {
    // change to a ref and an state???
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
          extractUsefulData(results)
        }
        drawResults(results)
      }
    }

    if (webcamRunning === true) {
      window.requestAnimationFrame(predictWebcam)
    }
  }

  const pickPolygonPoints = (polygon: NormalizedLandmark[], demandedIndexes: number[]) => {
    const results = []
    for (let key of demandedIndexes) {
      results.push(polygon[key])
    }
    return results
  }

  const extractUsefulData = (results: FaceLandmarkerResult) => {
    const usefulResults = results?.faceBlendshapes?.[0]?.categories?.filter((item) =>
      reportUsefulKeys.some((rep) => rep === item?.categoryName),
    )
    const formattedResults: Record<string, number> = {}

    usefulResults?.forEach((item) => {
      formattedResults[item.categoryName] = +item.score.toFixed(3)
    })
    const coordinates = extractPolygonsCoordinates(results.faceLandmarks[0])

    setExtractedData((prev) => [...prev, { coordinates, formattedResults }])
  }

  const extractPolygonsCoordinates = (results: NormalizedLandmark[]) => {
    // console.log('results', results)
    const faceCoordinates = pickPolygonPoints(results, FacePartsPolygon.faceOval)
    const leftEyeCoordinates = pickPolygonPoints(results, FacePartsPolygon.leftEye)
    const rightEyeCoordinates = pickPolygonPoints(results, FacePartsPolygon.rightEye)
    const lipsCoordinates = pickPolygonPoints(results, FacePartsPolygon.lips)
    return { faceCoordinates, rightEyeCoordinates, leftEyeCoordinates, lipsCoordinates }
    // console.log('FaceLandmarker.FACE_LANDMARKS_FACE_OVAL', FaceLandmarker.FACE_LANDMARKS_FACE_OVAL)
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
          if (!video?.current) return
          video.current.play()

          console.log('streaming video frame rate:', currentStream.getSettings().frameRate, 'fps')
          frameRate.current = currentStream?.getSettings()?.frameRate || 30
          // this is not working :(
          // video.current.requestVideoFrameCallback(() => {
          //   console.log('requestVideoFrameCallback');
          // });
          predictWebcam()
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
      {/* <pre>{JSON.stringify(extractedData, null, 2)}</pre> */}
    </div>
  )
}

export default FaceLandmark
