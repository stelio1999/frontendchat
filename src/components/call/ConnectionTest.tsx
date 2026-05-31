import React, { useState } from 'react'
import webrtcService from '../../services/webrtc.service'
import socket from '../../services/socket'

export default function ConnectionTest() {
  const [testResult, setTestResult] = useState<string>('')

  const testWebRTC = async () => {
    try {
      setTestResult('Testando conexão WebRTC...')
      
      // Test local stream
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true })
      console.log('Local stream OK:', stream.getTracks().length)
      stream.getTracks().forEach(t => t.stop())
      
      setTestResult('✅ WebRTC funcionando! Microfone e câmera OK')
    } catch (error) {
      setTestResult(`❌ Erro: ${error}`)
      console.error(error)
    }
  }

  const testSocket = () => {
    const connected = socket.isConnected()
    setTestResult(`Socket conectado: ${connected ? '✅ Sim' : '❌ Não'}`)
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 bg-black/80 text-white p-2 rounded text-xs">
      <button onClick={testWebRTC} className="mr-2 px-2 py-1 bg-blue-500 rounded">Test WebRTC</button>
      <button onClick={testSocket} className="px-2 py-1 bg-green-500 rounded">Test Socket</button>
      {testResult && <div className="mt-1">{testResult}</div>}
    </div>
  )
}