'use client'

import * as React from "react"
import { Waves } from "@/components/ui/wave-background"

export function WavesDemo() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen w-full bg-transparent">
      {/* Centered content with aspect ratio */}
      <div className="w-full flex flex-col items-center relative z-10">
        {/* Top border - thin white/purple line */}
        <div className="w-full h-[1px] bg-white/20"></div>
        
        {/* 16:9 container that's full width */}
        <div className="w-full aspect-video relative">
          <Waves className="h-full w-full opacity-60" />
        </div>
        
        {/* Bottom border - thin white/purple line */}
        <div className="w-full h-[1px] bg-white/20"></div>
      </div>
    </div>
  )
}
