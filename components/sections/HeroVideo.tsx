"use client";

import { useEffect, useRef } from "react";

export default function HeroVideo() {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Defer video loading until after the page is interactive
    const startVideo = () => {
      video.preload = "auto";
      video.load();
      video.play().catch(() => {
        // Autoplay may be blocked; poster remains visible
      });
    };

    // Use requestIdleCallback to avoid blocking main thread during load
    if ("requestIdleCallback" in window) {
      const id = requestIdleCallback(startVideo, { timeout: 3000 });
      return () => cancelIdleCallback(id);
    } else {
      const timer = setTimeout(startVideo, 2000);
      return () => clearTimeout(timer);
    }
  }, []);

  return (
    <video
      ref={videoRef}
      className="absolute inset-0 z-0 h-full w-full object-cover"
      muted
      loop
      playsInline
      preload="none"
      aria-hidden="true"
    >
      <source
        src="/output-mobile.av1.webm"
        type='video/webm; codecs="av01.0.05M.08"'
        media="(max-width: 767px)"
      />
      <source
        src="/output-mobile.mp4"
        type="video/mp4"
        media="(max-width: 767px)"
      />
      <source
        src="/output.av1.webm"
        type='video/webm; codecs="av01.0.05M.08"'
        media="(min-width: 768px)"
      />
      <source src="/output.mp4" type="video/mp4" media="(min-width: 768px)" />
    </video>
  );
}
