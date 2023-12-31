import { type FC, useRef, useEffect, useState } from 'react'
import { DrawingUtils, FaceLandmarker, FaceLandmarkerResult } from '@mediapipe/tasks-vision'

import styles from './index.module.scss'
import { videoHeight, videoWidth } from './constants'
import { Blendshapes, FaceRatios, FrameAnalyzeResult, useVideoLandmark } from '../../hooks'
import { LinerChartFactory } from '../liner-chart'

type LandmarksDataToPresent = FaceRatios & Blendshapes

const LineChart = LinerChartFactory<LandmarksDataToPresent>()

export const FaceLandmark: FC = () => {
  const video = useRef<HTMLVideoElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [isVideoElementReady, setIsVideoElementReady] = useState(false)
  const [isStreamReady, setIsStreamReady] = useState(false)
  // const [canAnalyze, setCanAnalyze] = useState(false)
  const [result, setResult] = useState<LandmarksDataToPresent[]>([])
  const [pageState, setPageState] = useState<'idle' | 'processing' | 'loading'>('loading')

  const { isVideoAnalyzerReady, startProcess, stopProcess } = useVideoLandmark({
    onResult: ({ analyzeResults, faceLandmarkerResult }) => {
      drawCharts(analyzeResults)
      drawFaceLandmarks(faceLandmarkerResult)
    },
    videoElement: video,
  })

  useEffect(() => {
    startCamera()
  }, [isVideoElementReady])

  useEffect(() => {
    if (isVideoAnalyzerReady && isStreamReady) {
      setPageState('idle')
    }
  }, [isVideoAnalyzerReady, isStreamReady])

  // can all this function become a giant promise ?
  const startCamera = async () => {
    const constraints = {
      video: { width: videoWidth, height: videoHeight },
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia(constraints)
      if (!video?.current) return
      video.current.srcObject = stream
    } catch (error) {
      console.log('error in getting user media', error)
    }
  }

  useEffect(() => {
    video.current?.addEventListener(
      'loadeddata',
      () => {
        // if (!video?.current) return
        video?.current?.play()
        setIsStreamReady(true)
      },
      { once: true },
    )
  }, [])

  function drawCharts(analyzeResults: FrameAnalyzeResult) {
    if (analyzeResults.FrameAnalyzeStatus === 'UNACCEPTABLE') return
    setResult((prev) => {
      if (prev.length > 50) {
        prev.shift()
        return [...prev, { ...analyzeResults.blendshapes, ...analyzeResults.facePartsRatios }]
      }
      return [...prev, { ...analyzeResults.blendshapes, ...analyzeResults.facePartsRatios }]
    })
  }

  const clearCanvas = () => {
    if (!canvasRef.current) return
    const ctx = canvasRef.current.getContext('2d')
    if (!ctx) return
    ctx?.clearRect(0, 0, videoWidth, videoHeight)
  }

  function drawFaceLandmarks(faceLandmarkerResult: FaceLandmarkerResult) {
    if (!canvasRef.current) return
    const ctx = canvasRef.current.getContext('2d')
    if (!ctx) return
    ctx?.clearRect(0, 0, videoWidth, videoHeight)
    const drawingUtils = new DrawingUtils(ctx)

    for (const landmarks of faceLandmarkerResult?.faceLandmarks) {
      drawingUtils.drawConnectors(landmarks, FaceLandmarker.FACE_LANDMARKS_RIGHT_EYE, { color: '#E0E0E0' })
      drawingUtils.drawConnectors(landmarks, FaceLandmarker.FACE_LANDMARKS_LEFT_EYE, { color: '#E0E0E0' })
      drawingUtils.drawConnectors(landmarks, FaceLandmarker.FACE_LANDMARKS_FACE_OVAL, { color: '#E0E0E0' })
      drawingUtils.drawConnectors(landmarks, FaceLandmarker.FACE_LANDMARKS_LIPS, { color: '#E0E0E0' })
    }
  }

  const onStopProcess = () => {
    setPageState('idle')
    stopProcess()
    clearCanvas()
  }

  const onStartProcess = () => {
    if (pageState !== 'idle') return
    setPageState('processing')
    startProcess()
  }

  return (
    <div className={styles.container}>
      <video
        className={styles.video}
        ref={(element) => {
          video.current = element
          setIsVideoElementReady(true)
        }}
        width={videoWidth}
        height={videoHeight}
      />
      <canvas className={styles.canvas} ref={canvasRef} width={videoWidth} height={videoHeight} />
      <button onClick={onStartProcess}>startProcess</button>
      <button onClick={onStopProcess}>stopProcess</button>
      <LineChart data={result} keysToPresent={['mouthFunnel', 'lipsToFace']} title="Mouth" />
      <LineChart data={result} keysToPresent={['eyeBlinkLeft', 'eyeBlinkRight']} title="Eyes - blendshape" />
      <LineChart data={result} keysToPresent={['leftEyeToFace', 'rightEyeToFace']} title="Eyes - Areas" />
    </div>
  )
}
