import { FaceLandmarker, FaceLandmarkerResult, FilesetResolver, NormalizedLandmark } from '@mediapipe/tasks-vision'
import { MutableRefObject, useEffect, useRef, useState } from 'react'
import { FacePartsPolygon, videoHeight, videoWidth } from '../components/face-landmark/constants'
import { calculateSampleRate } from './calculateSampleRate'
import { calculatePolygonArea } from '../components/face-landmark/utils'

/**
 * TODO
 * add a debounce for starting to process -> 100ms
 * add audio
 */

type FaceLandmarkPartsCoordinates = {
  faceCoordinates: NormalizedLandmark[]
  rightEyeCoordinates: NormalizedLandmark[]
  leftEyeCoordinates: NormalizedLandmark[]
  lipsCoordinates: NormalizedLandmark[]
}

type FaceRatios = {
  leftEyeToFace: number
  rightEyeToFace: number
  lipsToFace: number
}

type FrameAnalyzeResult = {
  analyzeTime: number
  result:
    | {
        frameAnalyzeHealth: true
        data: {
          blendshapes: Record<string, number>
          facePartsRatios: FaceRatios
          lightAverage: number
        }
      }
    | {
        frameAnalyzeHealth: false
        // moreThenOneFace: boolean
        // noFaceDetected: boolean
        reason: 'moreThenOneFace' | 'noFace'
        // change to sth better
        // errorInCode: any
      }
}

// let lastVideoTime = -1
const reportUsefulKeys = ['eyeBlinkLeft', 'eyeBlinkRight', 'mouthFunnel']

type VideoLandmarkParameters = {
  drawLandmarks?: (arg: FaceLandmarkerResult) => void
  videoElement: MutableRefObject<HTMLVideoElement | null>
  canvasElement: MutableRefObject<HTMLCanvasElement | null>
}
// pass element or ref ??????
const useVideoLandmark = ({ canvasElement, videoElement, drawLandmarks }: VideoLandmarkParameters) => {
  const [faceLandmarker, setFaceLandmarker] = useState<FaceLandmarker>()
  const [isVideoAnalyzerReady, setIsVideoAnalyzerReady] = useState<boolean>(false)
  const [videoStreamFrameRate, setVideoStreamFrameRate] = useState(30)
  // const [isProcessActive , setIsProcessActive] = useState({ value: false })
  const isProcessActive = useRef<boolean>(false)
  const [result, setResult] = useState<FrameAnalyzeResult[]>([])

  const { shouldProcessCurrentFrame } = calculateSampleRate({
    // each blink takes ~100ms and 10 fps is a appropriate number
    samplingFrameRate: 12,
    videoStreamFrameRate,
  })

  function analyzeVideo() {
    // console.log('analyzeVideo isProcessActive', isProcessActive)
    // check to continue or not
    if (!isProcessActive.current) return
    if (!videoElement.current) return
    analyzeVideoFrame()

    if ('requestVideoFrameCallback' in HTMLVideoElement.prototype) {
      videoElement.current.requestVideoFrameCallback(analyzeVideo)
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
        numFaces: 2, // there are more that 1 person in video
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
    // Calculate brightness using average pixel value
    if (!canvasElement.current || !videoElement.current) return
    const context = canvasElement.current.getContext('2d')
    if (!videoElement || !context) return

    context.drawImage(videoElement.current, 0, 0, videoWidth, videoHeight)
    const imageData = context.getImageData(0, 0, videoWidth, videoHeight)
    const data = imageData.data

    let sum = 0
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i]
      const g = data[i + 1]
      const b = data[i + 2]
      const brightness = (r + g + b) / 3
      sum += brightness
    }
    const lightAverage = sum / (videoHeight * videoWidth)
    return lightAverage
  }

  const analyzeVideoFrame = async () => {
    let currentFrameTime = Date.now()
    if (faceLandmarker && videoElement.current && shouldProcessCurrentFrame()) {
      let results = faceLandmarker?.detectForVideo(videoElement.current, currentFrameTime)
      if (results) {
        if (results.faceLandmarks.length === 0) {
          console.log('no face detected')
          const frameAnalyzeResult: FrameAnalyzeResult = {
            analyzeTime: currentFrameTime,
            result: {
              frameAnalyzeHealth: false,
              reason: 'noFace',
            },
          }
          setResult((prev) => [...prev, frameAnalyzeResult])
          return
        }

        if (results.faceLandmarks.length > 1) {
          // console.log('there are more that 1 person in video')
          const frameAnalyzeResult: FrameAnalyzeResult = {
            analyzeTime: currentFrameTime,
            result: {
              frameAnalyzeHealth: false,
              reason: 'moreThenOneFace',
            },
          }
          setResult((prev) => [...prev, frameAnalyzeResult])
        }

        if (results.faceLandmarks.length === 1) {
          drawLandmarks && drawLandmarks(results)
          // console.log('there is only 1 person in video')
          const lightAverage = checkBrightness() || 0
          const usefulData = extractUsefulData(results)

          const frameAnalyzeResult: FrameAnalyzeResult = {
            analyzeTime: currentFrameTime,
            result: {
              frameAnalyzeHealth: true,
              data: {
                blendshapes: usefulData?.formattedResults,
                lightAverage,
                facePartsRatios: usefulData.areaRatiosPercentage,
              },
            },
          }
          setResult((prev) => [...prev, frameAnalyzeResult])
        }
      }
    } else {
      // add no result to Result list + reason
    }
  }

  const pickPolygonPoints = (polygon: NormalizedLandmark[], demandedIndexes: number[]): NormalizedLandmark[] => {
    const results = []
    // it is possible to achieve same result with filter method too but for loop has the best performance
    for (let key of demandedIndexes) {
      results.push(polygon[key])
    }
    return results
  }

  const extractPolygonsCoordinates = (results: NormalizedLandmark[]): FaceLandmarkPartsCoordinates => {
    const faceCoordinates = pickPolygonPoints(results, FacePartsPolygon.faceOval)
    const leftEyeCoordinates = pickPolygonPoints(results, FacePartsPolygon.leftEye)
    const rightEyeCoordinates = pickPolygonPoints(results, FacePartsPolygon.rightEye)
    const lipsCoordinates = pickPolygonPoints(results, FacePartsPolygon.lips)

    return { faceCoordinates, rightEyeCoordinates, leftEyeCoordinates, lipsCoordinates }
  }

  const extractUsefulData = (results: FaceLandmarkerResult) => {
    const usefulBlendShapes = results?.faceBlendshapes?.[0]?.categories?.filter((item) =>
      reportUsefulKeys.some((rep) => rep === item?.categoryName),
    )
    const formattedResults: Record<string, number> = {}

    for (let item of usefulBlendShapes) {
      formattedResults[item.categoryName] = +item.score.toFixed(3)
    }

    const facePartsAreaRatiosPercentage = facePartsAreaRatio(results.faceLandmarks[0])
    return { formattedResults, areaRatiosPercentage: facePartsAreaRatiosPercentage }
  }

  const facePartsAreaRatio = (faceLandmarks: NormalizedLandmark[]) => {
    const coordinates = extractPolygonsCoordinates(faceLandmarks)

    const areaRatiosPercentage = calculateAreaRatios(coordinates)
    return areaRatiosPercentage
  }

  const calculateAreaRatios = (coordinates: FaceLandmarkPartsCoordinates): FaceRatios => {
    const faceArea = calculatePolygonArea(coordinates.faceCoordinates)
    const leftEyeArea = calculatePolygonArea(coordinates.leftEyeCoordinates)
    const rightEyeArea = calculatePolygonArea(coordinates.rightEyeCoordinates)
    const lipsArea = calculatePolygonArea(coordinates.lipsCoordinates)
    return {
      leftEyeToFace: leftEyeArea / faceArea,
      rightEyeToFace: rightEyeArea / faceArea,
      lipsToFace: lipsArea / faceArea,
    }
  }

  const startProcess = () => {
    isProcessActive.current = true
    analyzeVideo()
  }
  const stopProcess = () => {
    isProcessActive.current = false
  }

  return { isVideoAnalyzerReady, setVideoStreamFrameRate, startProcess, stopProcess, result }
}

export default useVideoLandmark

/**
 * existance of both eyes
 * change in eye
 * change in mouth
 * check blink
 * check number of mouth
 * depth ????
 */
