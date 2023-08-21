import {
  DrawingUtils,
  FaceLandmarker,
  FaceLandmarkerResult,
  FilesetResolver,
  NormalizedLandmark,
} from '@mediapipe/tasks-vision'
import { useEffect, useRef, useState } from 'react'
import { FacePartsPolygon } from '../components/face-landmark/constants'

/**
 * TODO
 * add a debounce for starting to process -> 100ms
 * add audio
 */

// requestAnimationFrame in chrome 60fps and safari ~30fps

let lastVideoTime = -1
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
const ProcessFrameRate = 1

const useVideoLandmark = (onResult: (arg: FaceLandmarkerResult) => void) => {
  const [faceLandmarker, setFaceLandmarker] = useState<FaceLandmarker>()
  const [isVideoAnalyzerReady, setIsVideoAnalyzerReady] = useState<boolean>(false)
  const unprocessedFramesCounter = useRef<number>(0)
  const [videoStreamframeRate, setVideoStreamFrameRate] = useState(ProcessFrameRate * ProcessFrameRate)

  const faceLandmarkFactory = async () => {
    console.log('faceLandmarkFactory')
    try {
      // TODO: Add loading
      const vision = await FilesetResolver.forVisionTasks(
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm',
      )
      const faceLandmarkerInstance = await FaceLandmarker.createFromOptions(vision, {
        baseOptions: {
          // TODO: is it really necessary ?
          modelAssetPath: `https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task`,
          // modelAssetPath: `/src/assets/blendshapes.task`,
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
      setIsVideoAnalyzerReady(true)
    } catch (error) {
      console.error('landmark model error', error)
    }
  }

  useEffect(() => {
    faceLandmarkFactory()
  }, [])

  const shouldProcessCurrentFrame = () => {
    if (unprocessedFramesCounter.current >= videoStreamframeRate / ProcessFrameRate) {
      // console.log('frame processed')
      unprocessedFramesCounter.current = 0
      return true
    } else {
      // console.log('frame passed')
      unprocessedFramesCounter.current++
      return false
    }
  }
  // because of forward ref
  async function predictWebcam(video: HTMLVideoElement) {
    let startTimeMs = performance.now()
    if (faceLandmarker && video && lastVideoTime !== video.currentTime && shouldProcessCurrentFrame()) {
      lastVideoTime = video.currentTime
      let results = faceLandmarker?.detectForVideo(video, startTimeMs)

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
        onResult(results)
      }
    } else {
      // console.log('predictWebcam else block', {
      //   video: !!video,
      //   currentTime: video?.currentTime,
      //   shouldProcessCurrentFrame: shouldProcessCurrentFrame(),
      //   condition: video && lastVideoTime !== video.currentTime && shouldProcessCurrentFrame(),
      // })
    }

    // if (isCameraReady === true) {
    //   window.requestAnimationFrame(predictWebcam)
    // }
  }

  const pickPolygonPoints = (polygon: NormalizedLandmark[], demandedIndexes: number[]) => {
    const results = []
    for (let key of demandedIndexes) {
      results.push(polygon[key])
    }
    return results
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
  const extractUsefulData = (results: FaceLandmarkerResult) => {
    const usefulResults = results?.faceBlendshapes?.[0]?.categories?.filter((item) =>
      reportUsefulKeys.some((rep) => rep === item?.categoryName),
    )
    const formattedResults: Record<string, number> = {}

    usefulResults?.forEach((item) => {
      formattedResults[item.categoryName] = +item.score.toFixed(3)
    })

    const coordinates = extractPolygonsCoordinates(results.faceLandmarks[0])
    // console.log('coordinates', coordinates)

    // setExtractedData((prev) => [...prev, { coordinates, formattedResults }])
  }

  return { predictWebcam, isVideoAnalyzerReady, setVideoStreamFrameRate }
}

export default useVideoLandmark
