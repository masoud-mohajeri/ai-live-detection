import { type MutableRefObject, useEffect, useRef, useState } from 'react'
import { FaceLandmarker, FilesetResolver } from '@mediapipe/tasks-vision'
import type { FaceLandmarkerResult, NormalizedLandmark } from '@mediapipe/tasks-vision'

import {
  calculatePolygonArea,
  calculateStandardDivision,
  calculateFrameAnalyzeRate,
  FacePartsPolygonIndexes,
} from '../utils'

type FacePartsCoordinates = {
  facePolygon: NormalizedLandmark[]
  rightEyePolygon: NormalizedLandmark[]
  leftEyePolygon: NormalizedLandmark[]
  lipsPolygon: NormalizedLandmark[]
}

export type FaceRatios = {
  leftEyeToFace: number
  rightEyeToFace: number
  lipsToFace: number
}
export type Blendshapes = {
  eyeBlinkLeft: number
  eyeBlinkRight: number
  mouthFunnel: number
}

interface AcceptableResult {
  FrameAnalyzeStatus: 'ACCEPTABLE'
  blendshapes: Blendshapes
  facePartsRatios: FaceRatios
}
interface UnacceptableResult {
  FrameAnalyzeStatus: 'UNACCEPTABLE'
  rejectionReason: 'moreThanOneFaceDetected' | 'noFaceDetected'
}
export type FrameAnalyzeResult = AcceptableResult | UnacceptableResult

enum StatisticsAnalyzeMethods {
  StandardDeviation = 'StandardDeviation',
}
type AnalyzeResults = `${AnalyzeParameters}${StatisticsAnalyzeMethods.StandardDeviation}`

export type VideoAnalyzeResult = {
  analyzeReport: Record<AnalyzeResults, number>
  unacceptableFramesStatistics: {
    moreThanOneFaceDetectedFramePercent: number
    noFaceDetectedFramePercent: number
  }
}
type AnalyzeParameters =
  | 'leftEyeRatio'
  | 'rightEyeToFace'
  | 'lipsToFace'
  | 'eyeBlinkLeft'
  | 'eyeBlinkRight'
  | 'mouthFunnel'

const reportUsefulKeys = ['eyeBlinkLeft', 'eyeBlinkRight', 'mouthFunnel']

type VideoLandmarkParameters = {
  onResult?: (arg: { faceLandmarkerResult: FaceLandmarkerResult; analyzeResults: FrameAnalyzeResult }) => void
  videoElement: MutableRefObject<HTMLVideoElement | null>
}

export const useVideoLandmark = ({ videoElement, onResult }: VideoLandmarkParameters) => {
  let faceLandmarker = useRef<FaceLandmarker | null>(null)
  const [isVideoAnalyzerReady, setIsVideoAnalyzerReady] = useState<boolean>(false)
  const isProcessActive = useRef<boolean>(false)

  const [frameAnalyzeResults, setFrameAnalyzeResults] = useState<FrameAnalyzeResult[]>([])

  const { shouldAnalyzeCurrentFrame } = calculateFrameAnalyzeRate({
    // each blink takes ~100ms and 10 fps so 10 is a appropriate number
    samplingRate: 10,
  })

  function analyzeVideo() {
    if (!isProcessActive.current) return
    analyzeFrame()

    videoElement?.current?.requestVideoFrameCallback(analyzeVideo)
  }

  const faceLandmarkFactory = async () => {
    setIsVideoAnalyzerReady(false)
    try {
      const vision = await FilesetResolver.forVisionTasks(
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm',
      )
      const faceLandmarkerInstance = await FaceLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: `https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task`,
          delegate: 'GPU',
        },
        outputFaceBlendshapes: true,
        runningMode: 'VIDEO',
        numFaces: 4,
        minFacePresenceConfidence: 0.5,
        minFaceDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5,
      })

      faceLandmarker.current = faceLandmarkerInstance
      setIsVideoAnalyzerReady(true)
    } catch (error) {
      console.error('landmark model error', error)
    }
  }

  useEffect(() => {
    faceLandmarkFactory()
  }, [])

  const analyzeFrame = async () => {
    const currentFrameTime = Date.now()
    if (faceLandmarker.current && videoElement.current && shouldAnalyzeCurrentFrame()) {
      const results = faceLandmarker.current?.detectForVideo(videoElement.current, currentFrameTime)
      if (results && Array.isArray(results.faceLandmarks)) {
        let frameAnalyzeResult: FrameAnalyzeResult
        if (results.faceLandmarks.length === 0) {
          frameAnalyzeResult = {
            FrameAnalyzeStatus: 'UNACCEPTABLE',
            rejectionReason: 'noFaceDetected',
          }
        } else if (results.faceLandmarks.length > 1) {
          frameAnalyzeResult = {
            FrameAnalyzeStatus: 'UNACCEPTABLE',
            rejectionReason: 'moreThanOneFaceDetected',
          }
        } else {
          const usefulData = extractUsefulData(results)
          frameAnalyzeResult = {
            FrameAnalyzeStatus: 'ACCEPTABLE',
            blendshapes: usefulData.blendShapes,
            facePartsRatios: usefulData.facePartsAreaRatiosPercentage,
          }
        }

        setFrameAnalyzeResults((prev) => [...prev, frameAnalyzeResult])
        onResult && onResult({ analyzeResults: frameAnalyzeResult, faceLandmarkerResult: results })
      }
    } else {
      // log reason or report it to somewhere
    }
  }

  const pickPolygonPointsFromGivenIndexes = (
    polygon: NormalizedLandmark[],
    demandedIndexes: number[],
  ): NormalizedLandmark[] => {
    const results = []
    for (const index of demandedIndexes) {
      results.push(polygon[index])
    }
    return results
  }

  const extractPolygonsCoordinates = (results: NormalizedLandmark[]): FacePartsCoordinates => {
    const facePolygon = pickPolygonPointsFromGivenIndexes(results, FacePartsPolygonIndexes.faceOval)
    const leftEyePolygon = pickPolygonPointsFromGivenIndexes(results, FacePartsPolygonIndexes.leftEye)
    const rightEyePolygon = pickPolygonPointsFromGivenIndexes(results, FacePartsPolygonIndexes.rightEye)
    const lipsPolygon = pickPolygonPointsFromGivenIndexes(results, FacePartsPolygonIndexes.lips)

    return { facePolygon, rightEyePolygon, leftEyePolygon, lipsPolygon }
  }

  const facePartsAreaRatio = (faceLandmarks: NormalizedLandmark[]) => {
    const coordinates = extractPolygonsCoordinates(faceLandmarks)
    const areaRatiosPercentage = calculateAreaRatios(coordinates)

    return areaRatiosPercentage
  }

  const extractUsefulData = (results: FaceLandmarkerResult) => {
    const usefulBlendShapesList = results?.faceBlendshapes?.[0]?.categories?.filter((item) =>
      reportUsefulKeys.some((rep) => rep === item?.categoryName),
    )
    const usefulBlendShapes: Blendshapes = {
      eyeBlinkLeft: 0,
      eyeBlinkRight: 0,
      mouthFunnel: 0,
    }

    for (const item of usefulBlendShapesList) {
      usefulBlendShapes[item.categoryName as keyof Blendshapes] = +item.score.toFixed(3)
    }

    const facePartsAreaRatiosPercentage = facePartsAreaRatio(results.faceLandmarks[0])

    return { blendShapes: usefulBlendShapes, facePartsAreaRatiosPercentage }
  }

  const calculateAreaRatios = (coordinates: FacePartsCoordinates): FaceRatios => {
    const faceArea = calculatePolygonArea(coordinates.facePolygon)
    const leftEyeArea = calculatePolygonArea(coordinates.leftEyePolygon)
    const rightEyeArea = calculatePolygonArea(coordinates.rightEyePolygon)
    const lipsArea = calculatePolygonArea(coordinates.lipsPolygon)
    return {
      leftEyeToFace: leftEyeArea / faceArea,
      rightEyeToFace: rightEyeArea / faceArea,
      lipsToFace: lipsArea / faceArea,
    }
  }

  const generateReport = () => {
    const numberOfResults = frameAnalyzeResults.length
    const arrayOfParameters: Record<AnalyzeParameters, number[]> = {
      leftEyeRatio: [],
      rightEyeToFace: [],
      lipsToFace: [],
      eyeBlinkLeft: [],
      eyeBlinkRight: [],
      mouthFunnel: [],
    }
    const unacceptableFramesStatistics = {
      moreThanOneFaceDetectedFramePercent: 0,
      noFaceDetectedFramePercent: 0,
    }
    for (let index = 0; index < numberOfResults; index++) {
      const data = frameAnalyzeResults[index]
      if (data.FrameAnalyzeStatus === 'ACCEPTABLE') {
        arrayOfParameters.leftEyeRatio.push(data.facePartsRatios.leftEyeToFace)
        arrayOfParameters.rightEyeToFace.push(data.facePartsRatios.rightEyeToFace)
        arrayOfParameters.lipsToFace.push(data.facePartsRatios.lipsToFace)
        arrayOfParameters.mouthFunnel.push(data.blendshapes.mouthFunnel)
        arrayOfParameters.eyeBlinkLeft.push(data.blendshapes.eyeBlinkLeft)
        arrayOfParameters.eyeBlinkRight.push(data.blendshapes.eyeBlinkRight)
      } else {
        if (data.rejectionReason === 'moreThanOneFaceDetected') {
          // instead of summing numbers and then dividing them to calculate the percentage I just
          // added their percent share with "100 / numberOfResults"
          unacceptableFramesStatistics.moreThanOneFaceDetectedFramePercent =
            unacceptableFramesStatistics.moreThanOneFaceDetectedFramePercent + 100 / numberOfResults
        }
        if (data.rejectionReason === 'noFaceDetected') {
          unacceptableFramesStatistics.noFaceDetectedFramePercent =
            unacceptableFramesStatistics.noFaceDetectedFramePercent + 100 / numberOfResults
        }
      }
    }
    const analyzeReport: Record<AnalyzeResults, number> = {
      leftEyeRatioStandardDeviation: 0,
      rightEyeToFaceStandardDeviation: 0,
      lipsToFaceStandardDeviation: 0,
      eyeBlinkLeftStandardDeviation: 0,
      eyeBlinkRightStandardDeviation: 0,
      mouthFunnelStandardDeviation: 0,
    }
    for (const key in arrayOfParameters) {
      // Standard deviation shows us changes in values, so we are using it to detect
      // changes in users eyes and lips to validate video in further steps
      analyzeReport[`${key}${StatisticsAnalyzeMethods.StandardDeviation}` as AnalyzeResults] =
        calculateStandardDivision(arrayOfParameters[key as AnalyzeParameters])
    }

    return { analyzeReport, unacceptableFramesStatistics }
  }

  const startProcess = () => {
    isProcessActive.current = true
    setFrameAnalyzeResults([])
    analyzeVideo()
  }

  const stopProcess = () => {
    isProcessActive.current = false
    return generateReport()
  }

  return { isVideoAnalyzerReady, startProcess, stopProcess }
}
