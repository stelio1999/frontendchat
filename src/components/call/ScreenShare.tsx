import React, { useEffect, useRef } from 'react'

interface ScreenShareProps {
  stream: MediaStream | null
}

export default function ScreenShare({ stream }: ScreenShareProps) {
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream
    }
  }, [stream])

  if (!stream) return null

  return (
    <div className="fixed inset-0 z-40 bg-black/90">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        className="w-full h-full object-contain"
      />
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-red-500 text-white px-3 py-1 rounded-full text-sm">
        A partilhar ecrã
      </div>
    </div>
  )
}