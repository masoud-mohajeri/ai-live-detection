import { useEffect, type FC } from 'react'

declare global {
  interface Window {
    SpeechRecognition: any // 👈️ turn off type checking
    webkitSpeechRecognition: any // 👈️ turn off type checking
  }
}

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition

const speechRecognitionEvents = [
  'onaudioend',
  'onaudiostart',
  'onend',
  'onerror',
  'onnomatch',
  'onresult',
  'onsoundend',
  'onsoundstart',
  'onspeechend',
  'onspeechstart',
  'onstart',
]

const WebAudioApi: FC = () => {
  const audioTest = () => {
    //@ts-ignore
    const recognition = new SpeechRecognition()
    recognition.lang = 'en-US'
    recognition.interimResults = false
    recognition.maxAlternatives = 5
    recognition.start()

    recognition.onresult = function (event: any) {
      console.log('You said: ', event.results[0][0].transcript)
    }

    recognition.continuous = true
    recognition.interimResults = true

    speechRecognitionEvents.forEach((event: string) => {
      recognition[event] = (spEvent: any) => {
        console.log(event, spEvent)
      }
    })

    console.log('recognition', recognition)
  }

  useEffect(() => {
    audioTest()
  }, [])

  return <div>web-audio-api.tsx</div>
}

export default WebAudioApi
/**
  false
  grammars
  interimResults
  lang
  maxAlternatives
  onaudioend
  onaudiostart
  onend
  onerror
  onnomatch
  onresult
  onsoundend
  onsoundstart
  onspeechend
  onspeechstart
  onstart
 */
