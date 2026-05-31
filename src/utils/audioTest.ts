export const testAudioDevices = async () => {
  try {
    const devices = await navigator.mediaDevices.enumerateDevices()
    const audioInputs = devices.filter(device => device.kind === 'audioinput')
    const audioOutputs = devices.filter(device => device.kind === 'audiooutput')
    
    console.log('🎤 Audio Input devices:', audioInputs.map(d => d.label))
    console.log('🔊 Audio Output devices:', audioOutputs.map(d => d.label))
    
    return { audioInputs, audioOutputs }
  } catch (error) {
    console.error('Error enumerating devices:', error)
    return null
  }
}

export const testMicrophone = async () => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    console.log('✅ Microphone access granted!')
    console.log('Audio tracks:', stream.getAudioTracks().map(t => `${t.label} (${t.enabled})`))
    
    // Create audio context to visualize
    const audioContext = new AudioContext()
    const source = audioContext.createMediaStreamSource(stream)
    const analyser = audioContext.createAnalyser()
    source.connect(analyser)
    
    console.log('Microphone is working!')
    return stream
  } catch (error) {
    console.error('❌ Microphone access denied or error:', error)
    return null
  }
}