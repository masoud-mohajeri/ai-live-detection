import {
  DrawingUtils,
  FaceLandmarker,
  FaceLandmarkerResult,
  FilesetResolver,
  NormalizedLandmark,
} from '@mediapipe/tasks-vision'
import { useEffect, useRef, useState } from 'react'
import { FacePartsPolygon, videoHeight, videoWidth } from '../components/face-landmark/constants'
import { calculateSampleRate } from './calculateSampleRate'
import { calculatePolygonArea } from '../components/face-landmark/utils'

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

type VideoLandmarkParamerters = {
  onResult?: (arg: FaceLandmarkerResult) => void
  videoElement: HTMLVideoElement | null
  canvasElement: HTMLCanvasElement | null
}
// pass element or ref ??????
const useVideoLandmark = ({ canvasElement, videoElement, onResult }: VideoLandmarkParamerters) => {
  const [faceLandmarker, setFaceLandmarker] = useState<FaceLandmarker>()
  const [isVideoAnalyzerReady, setIsVideoAnalyzerReady] = useState<boolean>(false)
  const [videoStreamframeRate, setVideoStreamFrameRate] = useState(30)
  // const [isProcessActive , setIsProcessActive] = useState({ value: false })
  const isProcessActive = useRef<boolean>(false)

  const { shouldProcessCurrentFrame } = calculateSampleRate({
    // each blink takes ~100ms and 10 fps is a appropriate number
    samplingFrameRate: 1,
    videoStreamframeRate: videoStreamframeRate,
  })

  function analyzeVideo() {
    // console.log('analyzeVideo isProcessActive', isProcessActive)
    // check to continue or not
    if (!isProcessActive.current) return
    if (!videoElement) return
    predictWebcam()

    if ('requestVideoFrameCallback' in HTMLVideoElement.prototype) {
      videoElement.requestVideoFrameCallback(analyzeVideo)
    } else {
      // no polyfill yet
      // requestAnimationFrame(analyzeVideo)
    }
  }

  useEffect(() => {
    if (isProcessActive) {
      analyzeVideo()
    }
  }, [isProcessActive])

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

  const checkBrightness = () => {
    if (!canvasElement || !videoElement) return
    const context = canvasElement.getContext('2d')
    if (!videoElement || !context) return

    context.drawImage(videoElement, 0, 0, videoWidth, videoHeight)
    const imageData = context.getImageData(0, 0, videoWidth, videoHeight)
    const data = imageData.data

    let sum = 0
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i]
      const g = data[i + 1]
      const b = data[i + 2]
      // Calculate brightness using average pixel value (simple approach)
      const brightness = (r + g + b) / 3
      sum += brightness
    }
    const lightAverage = sum / (videoHeight * videoWidth)
    return lightAverage
  }

  // because of forward ref
  async function predictWebcam() {
    let startTimeMs = performance.now()
    if (faceLandmarker && videoElement && lastVideoTime !== videoElement.currentTime && shouldProcessCurrentFrame()) {
      // TODO: what the hell is this ?
      lastVideoTime = videoElement.currentTime
      let results = faceLandmarker?.detectForVideo(videoElement, startTimeMs)

      if (results) {
        if (results.faceLandmarks.length === 0) {
          console.log('no face detected')
          return
        }

        if (results.faceLandmarks.length > 1) {
          // console.log('there are more that 1 person in video')
        }

        if (results.faceLandmarks.length === 1) {
          // console.log('there is only 1 person in video')
        }
        const lightAverage = checkBrightness()
        const usefulData = extractUsefulData(results)
        console.log('results', { ...usefulData, lightAverage, numberOfFaces: results?.faceLandmarks?.length })
        onResult && onResult(results)
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

    const areaRatiosPercentage = calculateAreaRatios(coordinates)

    return { coordinates, formattedResults, areaRatiosPercentage }
  }

  const calculateAreaRatios = (coordinates: {
    faceCoordinates: NormalizedLandmark[]
    rightEyeCoordinates: NormalizedLandmark[]
    leftEyeCoordinates: NormalizedLandmark[]
    lipsCoordinates: NormalizedLandmark[]
  }) => {
    const faceArea = calculatePolygonArea(coordinates.faceCoordinates)
    const leftEyeArea = calculatePolygonArea(coordinates.leftEyeCoordinates)
    const rightEyeArea = calculatePolygonArea(coordinates.rightEyeCoordinates)
    const lipsArea = calculatePolygonArea(coordinates.lipsCoordinates)
    return {
      leftEyeToFace: leftEyeArea / faceArea,
      rightEyeToFace: rightEyeArea / faceArea,
      lipsToFace: lipsArea / faceArea,
      faceArea,
      leftEyeArea,
      rightEyeArea,
      lipsArea,
    }
  }

  const startProcess = () => {
    isProcessActive.current = true
    analyzeVideo()
  }
  const stopProcess = () => {
    isProcessActive.current = false
  }

  return { isVideoAnalyzerReady, setVideoStreamFrameRate, startProcess, stopProcess }
}

export default useVideoLandmark
