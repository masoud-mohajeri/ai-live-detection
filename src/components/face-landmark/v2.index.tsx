import { DrawingUtils, FaceLandmarker, FaceLandmarkerResult } from '@mediapipe/tasks-vision'
import { type FC, useRef, useEffect, useState } from 'react'
import styles from './index.module.scss'
import { videoHeight, videoWidth } from './constants'
import useVideoLandmark from '../../hooks/useVideoLandmark'

const FaceLandmark: FC = () => {
  const video = useRef<HTMLVideoElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const frameRate = useRef<number>(30)
  const [isVideoElementReady, setIsVideoElementReady] = useState(false)
  const [isStreamReady, setIsStreamReady] = useState(false)

  // const [audioClassifier, setAudioClassifier] = useState<AudioClassifier>()

  const { predictWebcam, isVideoAnalyzerReady } = useVideoLandmark(drawResults)

  // const audioDetectionFactory = async () => {
  //   try {
  //     const audio = await AudioFilesetResolver.forAudioTasks('https://cdn.jsdelivr.net/npm/@mediapipe/tasks-audio/wasm')
  //     const audioClassifierInstance = await AudioClassifier.createFromOptions(audio, {
  //       baseOptions: {
  //         // TODO: is it really necessary ?
  //         modelAssetPath: 'https://tfhub.dev/google/lite-model/yamnet/classification/tflite/1?lite-format=tflite',
  //         delegate: 'GPU',
  //       },
  //       maxResults: 3,
  //       scoreThreshold: 0.2,
  //     })
  //     setAudioClassifier(audioClassifierInstance)
  //   } catch (error) {
  //     console.error('audio model error:', error)
  //   }
  // }

  // useEffect(() => {
  // faceLandmarkFactory()
  // console.log('audioDetectionFactory')
  // audioDetectionFactory()
  // setInterval(() => {
  //   countFrameRate()
  // }, 3000)
  // }, [])

  useEffect(() => {
    startCamera()
  }, [isVideoElementReady])

  // const processAudio = async (stream: MediaStream) => {
  //   // if (!audioCtx) {
  //   // TODO: audioCtx should be in upper scop for suspending it in future features
  //   // } else if (audioCtx.state === 'running') {
  //   //   await audioCtx.suspend()
  //   //   streamingBt.firstElementChild.innerHTML = 'START CLASSIFYING'
  //   //   return
  //   // }

  //   // const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
  //   const audioCtx = new AudioContext({ sampleRate: 16000 })

  //   const source = audioCtx.createMediaStreamSource(stream)
  //   const scriptNode = audioCtx.createScriptProcessor(16384, 1, 1)
  //   console.log('process audio 3')
  //   scriptNode.onaudioprocess = function (audioProcessingEvent) {
  //     console.log('scriptNode.onaudioprocess')

  //     const inputBuffer = audioProcessingEvent.inputBuffer
  //     let inputData = inputBuffer.getChannelData(0)

  //     // Classify the audio
  //     if (!audioClassifier) return
  //     const result = audioClassifier.classify(inputData)
  //     const categories = result[0].classifications[0].categories
  //     console.log('categories', categories)
  //   }
  // }

  const analyzeVideo = () => {
    if (!video?.current) return
    predictWebcam(video.current)
    requestAnimationFrame(analyzeVideo)
  }

  useEffect(() => {
    if (isVideoAnalyzerReady && isStreamReady) {
      analyzeVideo()
    }
  }, [isVideoAnalyzerReady, isStreamReady])

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
          },
          { once: true },
        )
      })
      .catch((error) => {
        console.log('error in getting user media', error)
      })
  }

  // const startAudio = () => {
  //   const constraints = {
  //     audio: true,
  //   }
  //   navigator.mediaDevices.getUserMedia(constraints).then((stream) => {
  //     processAudio(stream)
  //   })
  // }
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
