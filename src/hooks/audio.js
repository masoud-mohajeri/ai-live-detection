class MyAudioProcessor extends AudioWorkletProcessor {
  constructor() {
    super()
  }

  process(inputList, outputList, parameters) {
    // Using the inputs (or not, as needed),
    // write the output into each of the outputs
    // …

    const numberOfInputs = inputList.length
    const firstInput = inputList[0]

    const firstInputChannelCount = firstInput.length
    const firstInputFirstChannel = firstInput[0] // (or inputList[0][0])

    const firstChannelByteCount = firstInputFirstChannel.length
    const firstByteOfFirstChannel = firstInputFirstChannel[0] // (or inputList[0][0][0])
    console.log('process')
    return true
  }
}

registerProcessor('my-audio-processor', MyAudioProcessor)
