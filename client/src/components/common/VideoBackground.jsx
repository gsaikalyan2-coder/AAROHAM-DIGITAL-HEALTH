import React from 'react';

export default function VideoBackground({ videoSrc = '/bg-video.mp4', overlayOpacity = '' }) {
  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden" aria-hidden="true">
      <video
        autoPlay
        loop
        muted
        playsInline
        className="w-full h-full object-cover"
      >
        <source src={videoSrc} type="video/mp4" />
        Your browser does not support the video tag.
      </video>

      {/* Soft dark navy-slate gradient overlay (~rgba(15,23,41,0.5)) */}
      <div className={`absolute inset-0 bg-gradient-to-b from-[#0f1729]/60 via-[#0f1729]/50 to-[#0b1120]/70 transition-colors ${overlayOpacity}`} />

      {/* Subtle clinical EKG waveform texture at ~12% opacity with soft stroke & blur */}
      <svg
        className="absolute inset-0 w-full h-full opacity-[0.12] blur-[0.4px] pointer-events-none"
        viewBox="0 0 1200 400"
        preserveAspectRatio="none"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M0,200 L320,200 L345,185 L365,225 L385,130 L405,260 L425,190 L445,210 L470,200 L1200,200"
          stroke="#8FB8DE"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}
