type SampleRateOptions = {
  videoStreamFrameRate: number
  samplingFrameRate: number
}

export const calculateSampleRate = ({ videoStreamFrameRate, samplingFrameRate }: SampleRateOptions) => {
  let unprocessedFramesCounter = 0

  const shouldProcessCurrentFrame = () => {
    if (unprocessedFramesCounter >= videoStreamFrameRate / samplingFrameRate) {
      unprocessedFramesCounter = 0
      return true
    } else {
      unprocessedFramesCounter++
      return false
    }
  }

  return { shouldProcessCurrentFrame }
}
