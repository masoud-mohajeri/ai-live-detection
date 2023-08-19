import { AudioClassifier, FilesetResolver } from '@mediapipe/tasks-audio'
import { useEffect, type FC } from 'react'

const AudioClassification: FC = () => {
  const audioDetectionFactory = async () => {
    try {
      const audio = await FilesetResolver.forAudioTasks('https://cdn.jsdelivr.net/npm/@mediapipe/tasks-audio/wasm')
      const audioClassifierInstance = await AudioClassifier.createFromOptions(audio, {
        baseOptions: {
          // TODO: is it really necessary ?
          modelAssetPath: 'https://tfhub.dev/google/lite-model/yamnet/classification/tflite/1?lite-format=tflite',
          delegate: 'GPU',
        },
        maxResults: 3,
        scoreThreshold: 0.2,
      })
      // setAudioClassifier(audioClassifierInstance)
      processAudio(audioClassifierInstance)
    } catch (error) {
      console.error('audio model error:', error)
    }
  }

  const processAudio = async (classify: AudioClassifier) => {
    // if (!audioCtx) {
    // TODO: audioCtx should be in upper scop for suspending it in future features
    // } else if (audioCtx.state === 'running') {
    //   await audioCtx.suspend()
    //   streamingBt.firstElementChild.innerHTML = 'START CLASSIFYING'
    //   return
    // }

    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    const audioCtx = new AudioContext({ sampleRate: 16000 })

    const source = audioCtx.createMediaStreamSource(stream)
    console.log('process audio 3')

    const analyser = audioCtx.createAnalyser()
    analyser.fftSize = 2048

    const bufferLength = analyser.frequencyBinCount
    const dataArray = new Uint8Array(bufferLength)
    analyser.getByteTimeDomainData(dataArray)

    source.connect(analyser)
    // const scriptNode = audioCtx.createScriptProcessor(16384, 1, 1)
    // scriptNode.onaudioprocess = function (audioProcessingEvent) {
    //   console.log('scriptNode.onaudioprocess')

    //   const inputBuffer = audioProcessingEvent.inputBuffer
    //   let inputData = inputBuffer.getChannelData(0)

    //   // Classify the audio
    //   const result = classify.classify(inputData)
    //   const categories = result[0].classifications[0].categories
    //   console.log('categories', categories)
    // }
  }

  useEffect(() => {
    audioDetectionFactory()
  }, [])
  return <div></div>
}

export default AudioClassification
