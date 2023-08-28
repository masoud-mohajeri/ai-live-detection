import { useEffect, type FC } from 'react'

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
  }

  useEffect(() => {
    audioTest()
  }, [])

  return <div>web-audio-api.tsx</div>
}

export default WebAudioApi
