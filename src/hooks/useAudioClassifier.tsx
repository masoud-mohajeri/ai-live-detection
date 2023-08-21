import { AudioClassifier, FilesetResolver } from '@mediapipe/tasks-audio'
import { useEffect, useState } from 'react'
// https://stackoverflow.com/questions/74087777/how-to-use-2-mediapipe-models-using-react

const useAudioClassifier = () => {
  const [audioClassifier, setAudioClassifier] = useState<AudioClassifier>()
  const [isAudioClassifierReady, setIsAudioClassifierReady] = useState(false)

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
      setAudioClassifier(audioClassifierInstance)
      setIsAudioClassifierReady(true)
    } catch (error) {
      console.error('audio model error:', error)
    }
  }

  useEffect(() => {
    audioDetectionFactory()
  }, [])

  const processAudio = async (stream: MediaStream) => {
    // if (!audioCtx) {
    // TODO: audioCtx should be in upper scop for suspending it in future features
    // } else if (audioCtx.state === 'running') {
    //   await audioCtx.suspend()
    //   streamingBt.firstElementChild.innerHTML = 'START CLASSIFYING'
    //   return
    // }
    try {
      console.log('stream', stream)
      // const audioCtx = new AudioContext({ sampleRate: 16000 })

      // const source = audioCtx.createMediaStreamSource(stream)
      //[depricated]
      // const scriptNode = audioCtx.createScriptProcessor(16384, 1, 1)
      // console.log('process audio 3')
      // scriptNode.onaudioprocess = function (audioProcessingEvent) {
      //   console.log('scriptNode.onaudioprocess')

      //   const inputBuffer = audioProcessingEvent.inputBuffer
      //   let inputData = inputBuffer.getChannelData(0)

      //   // Classify the audio
      //   if (!audioClassifier) return
      //   const result = audioClassifier.classify(inputData)
      //   const categories = result[0].classifications[0].categories
      //   console.log('categories', categories)
      // }

      const audioContext = new AudioContext()
      const source = audioContext.createMediaStreamSource(stream)
      await audioContext.resume()
      await audioContext.audioWorklet.addModule('./audio.js')
    } catch (error) {
      console.log('error in processing audio ', error)
    }
  }

  return { processAudio, isAudioClassifierReady }
}

export default useAudioClassifier
