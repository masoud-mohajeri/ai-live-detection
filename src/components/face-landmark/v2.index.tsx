import { DrawingUtils, FaceLandmarker, FaceLandmarkerResult } from '@mediapipe/tasks-vision'
import { type FC, useRef, useEffect, useState } from 'react'
import styles from './index.module.scss'
import { videoHeight, videoWidth } from './constants'
// import useAudioClassifier from '../../hooks/useAudioClassifier'
import useVideoLandmark from '../../hooks/useVideoLandmark'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

const FaceLandmark: FC = () => {
  const video = useRef<HTMLVideoElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [isVideoElementReady, setIsVideoElementReady] = useState(false)
  const [isStreamReady, setIsStreamReady] = useState(false)
  const { isVideoAnalyzerReady, setVideoStreamFrameRate, startProcess, stopProcess, result } = useVideoLandmark({
    drawLandmarks: drawResults,
    videoElement: video,
    canvasElement: canvasRef,
  })

  useEffect(() => {
    startCamera()
  }, [isVideoElementReady])

  useEffect(() => {
    if (isVideoAnalyzerReady && isStreamReady) {
      startProcess()
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

      const currentStream = video.current?.srcObject?.getVideoTracks()?.[0]

      video.current?.addEventListener(
        'loadeddata',
        () => {
          if (!video?.current) return
          video.current.play()
          setVideoStreamFrameRate(currentStream?.getSettings()?.frameRate || 30)
          setIsStreamReady(true)
        },
        { once: true },
      )
    } catch (error) {
      console.log('error in getting user media', error)
    }
  }

  // useed only in dev
  function drawResults(faceLandmarkerResult: FaceLandmarkerResult) {
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
          setIsVideoElementReady(true)
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
      <button onClick={startProcess}>startProcess</button>
      <button onClick={stopProcess}>stopProcess</button>
      {/* <pre>{JSON.stringify(extractedData, null, 2)}</pre> */}
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          width={500}
          height={300}
          // @ts-ignore
          data={result.map((item, index) => ({ ...item.modelOut, index }))}
          margin={{
            top: 5,
            right: 30,
            left: 20,
            bottom: 5,
          }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="index" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Line isAnimationActive={false} type="monotone" dataKey="mouthPucker" stroke="#8884d8" activeDot={{ r: 8 }} />
          <Line isAnimationActive={false} type="monotone" dataKey="mouthShrugLower" stroke="#82ca9d" />
          <Line isAnimationActive={false} type="monotone" dataKey="mouthFunnel" stroke="#BB2525" />
        </LineChart>
      </ResponsiveContainer>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          width={500}
          height={300}
          // @ts-ignore
          data={result.map((item, index) => ({ ...item.modelOut, index }))}
          margin={{
            top: 5,
            right: 30,
            left: 20,
            bottom: 5,
          }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="index" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Line
            isAnimationActive={false}
            type="monotone"
            dataKey="eyeBlinkLeft"
            stroke="#8884d8"
            activeDot={{ r: 8 }}
          />
          <Line isAnimationActive={false} type="monotone" dataKey="eyeBlinkRight" stroke="#82ca9d" />
        </LineChart>
      </ResponsiveContainer>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          width={500}
          height={300}
          // @ts-ignore
          data={result.map((item, index) => ({ ...item.areaRatiosPercentage, index }))}
          margin={{
            top: 5,
            right: 30,
            left: 20,
            bottom: 5,
          }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="index" />
          <YAxis />
          <Tooltip />
          <Legend />

          <Line isAnimationActive={false} type="monotone" dataKey="leftEyeToFace" stroke="#8884d8" />
          <Line isAnimationActive={false} type="monotone" dataKey="leftEyeToFace" stroke="#8884d8" />
          <Line isAnimationActive={false} type="monotone" dataKey="lipsArea" stroke="#9A3B3B" />
          {/* <Line isAnimationActive={false} type="monotone" dataKey="lipsToFace" stroke="#FAF1E4" /> */}
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

export default FaceLandmark
