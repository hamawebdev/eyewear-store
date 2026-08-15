"use client";

import { useEffect, useRef, useState } from "react";

const MOBILE_QUERY = "(max-width: 767px)";

const VARIANTS = {
  mobile: {
    av1: "/eyewear-mobile-hero.av1.webm",
    mp4: "/eyewear-mobile-hero.mp4",
  },
  desktop: {
    av1: "/eyewear-desktop-hero.av1.webm",
    mp4: "/eyewear-desktop-hero.mp4",
  },
} as const;

type Variant = keyof typeof VARIANTS;

export default function HeroVideo() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [variant, setVariant] = useState<Variant | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  // Pick the breakpoint variant on the client. `media` on <source> is only
  // dependable inside <picture>, so the switch is driven by matchMedia instead.
  useEffect(() => {
    const query = window.matchMedia(MOBILE_QUERY);
    const sync = () => setVariant(query.matches ? "mobile" : "desktop");

    sync();
    query.addEventListener("change", sync);
    return () => query.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !variant) return;

    setIsPlaying(false);

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
  }, [variant]);

  const sources = variant ? VARIANTS[variant] : null;

  return (
    <video
      ref={videoRef}
      className={`absolute inset-0 z-0 h-full w-full object-cover transition-opacity duration-700 ${
        isPlaying ? "opacity-100" : "opacity-0"
      }`}
      muted
      loop
      playsInline
      preload="none"
      aria-hidden="true"
      onPlaying={() => setIsPlaying(true)}
    >
      {sources ? (
        <>
          <source
            src={sources.av1}
            type='video/webm; codecs="av01.0.05M.08"'
          />
          <source src={sources.mp4} type="video/mp4" />
        </>
      ) : null}
    </video>
  );
}
