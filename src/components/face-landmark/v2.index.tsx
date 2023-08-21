import { DrawingUtils, FaceLandmarker, FaceLandmarkerResult } from '@mediapipe/tasks-vision'
import { type FC, useRef, useEffect, useState } from 'react'
import styles from './index.module.scss'
import { videoHeight, videoWidth } from './constants'
import useAudioClassifier from '../../hooks/useAudioClassifier'
import useVideoLandmark from '../../hooks/useVideoLandmark'

// https://stackoverflow.com/questions/74087777/how-to-use-2-mediapipe-models-using-react

const FaceLandmark: FC = () => {
  const video = useRef<HTMLVideoElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const frameRate = useRef<number>(30)
  const [isVideoElementReady, setIsVideoElementReady] = useState(false)
  const [isStreamReady, setIsStreamReady] = useState(false)

  // const [audioClassifier, setAudioClassifier] = useState<AudioClassifier>()

  // const { predictWebcam, isVideoAnalyzerReady } = useVideoLandmark(drawResults)
  const { processAudio, isAudioClassifierReady } = useAudioClassifier()

  // useEffect(() => {
  //   startCamera()
  // }, [isVideoElementReady])

  // const analyzeVideo = () => {
  //   // check to continue or not
  //   if (!video?.current) return
  //   predictWebcam(video.current)
  //   requestAnimationFrame(analyzeVideo)
  // }

  // useEffect(() => {
  //   if (isVideoAnalyzerReady && isStreamReady) {
  //     analyzeVideo()
  //   }
  // }, [isVideoAnalyzerReady, isStreamReady])
  useEffect(() => {
    if (isAudioClassifierReady) {
      // startCamera()
    }
  }, [isAudioClassifierReady])

  // useEffect(() => {
  //   if (isStreamReady && isAudioClassifierReady && video?.current?.srcObject) {
  //     //  lib.dom.d.ts
  //     // type MediaProvider = MediaStream | MediaSource | Blob;
  //     console.log('calling processAudio')
  //     processAudio(video.current.srcObject as MediaStream)
  //   }
  // }, [isAudioClassifierReady, isStreamReady])

  // can all this function become a giant promise ?
  const startCamera = () => {
    const constraints = {
      video: { width: videoWidth, height: videoHeight },
      audio: true,
    }
    // TODO: convert it to async/await
    navigator.mediaDevices
      .getUserMedia(constraints)
      .then((stream) => {
        if (!video?.current) return
        video.current.srcObject = stream

        const currentStream = video.current?.srcObject?.getVideoTracks()?.[0]

        video.current?.addEventListener(
          'loadeddata',
          () => {
            if (!video?.current) return
            video.current.play()
            frameRate.current = currentStream?.getSettings()?.frameRate || 30
            setIsStreamReady(true)
            processAudio(stream)
          },
          { once: true },
        )
      })
      .catch((error) => {
        console.log('error in getting user media', error)
      })
  }

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
      {/* <pre>{JSON.stringify(extractedData, null, 2)}</pre> */}
    </div>
  )
}

export default FaceLandmark
