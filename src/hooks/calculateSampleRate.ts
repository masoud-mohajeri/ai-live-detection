type SampleRateOptions = {
  videoStreamframeRate: number
  samplingFrameRate: number
}

//return type ???

export const calculateSampleRate = ({ videoStreamframeRate, samplingFrameRate }: SampleRateOptions) => {
  let unprocessedFramesCounter = 0

  const shouldProcessCurrentFrame = () => {
    if (unprocessedFramesCounter >= videoStreamframeRate / samplingFrameRate) {
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
