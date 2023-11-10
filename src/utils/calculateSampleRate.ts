// Essential to know Hz is times/sec
type SampleRateOptions = {
  samplingRate: number // in Hz
}

export const calculateFrameAnalyzeRate = ({ samplingRate }: SampleRateOptions) => {
  const samplingIntervalInMillisecond = 1000 / samplingRate
  let lastProcessedFrameTime = 0

  const shouldAnalyzeCurrentFrame = () => {
    const now = Date.now()
    if (now - lastProcessedFrameTime > samplingIntervalInMillisecond) {
      lastProcessedFrameTime = now
      return true
    }
    return false
  }

  return { shouldAnalyzeCurrentFrame }
}
