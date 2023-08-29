type SampleRateOptions = {
  videoStreamFrameRate: number
  samplingFrameRate: number
}

//return type ???

export const calculateSampleRate = ({ videoStreamFrameRate, samplingFrameRate }: SampleRateOptions) => {
  let unprocessedFramesCounter = 0

  const shouldProcessCurrentFrame = () => {
    if (unprocessedFramesCounter >= videoStreamFrameRate / samplingFrameRate) {
      // console.log('frame processed')
      unprocessedFramesCounter = 0
      return true
    } else {
      // console.log('frame passed')
      unprocessedFramesCounter++
      return false
    }
  }

  return { shouldProcessCurrentFrame }
}
