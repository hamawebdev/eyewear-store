"use client";

import { useEffect, useRef, useState } from "react";

const MOBILE_QUERY = "(max-width: 767px)";
const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

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

const AV1_WEBM_TYPE = 'video/webm; codecs="av01.0.05M.08"';

type Variant = keyof typeof VARIANTS;

type NetworkInformation = {
  effectiveType?: string;
  saveData?: boolean;
};

/**
 * The hero footage is 400KB-1MB and is pure decoration — the poster underneath
 * already carries the design. Downloading it anyway is the single largest item
 * on the homepage, so it is skipped for anyone who has told us not to: Save-Data,
 * a 2g-class connection, or a reduced-motion preference.
 */
const shouldSkipVideo = () => {
  if (window.matchMedia(REDUCED_MOTION_QUERY).matches) {
    return true;
  }

  const connection = (navigator as Navigator & { connection?: NetworkInformation }).connection;

  if (!connection) {
    return false;
  }

  return (
    connection.saveData === true ||
    connection.effectiveType === "2g" ||
    connection.effectiveType === "slow-2g"
  );
};

/**
 * Resolves to a single URL instead of rendering <source> children. Appending
 * sources to a <video> starts the browser's resource selection, and the
 * `load()` call that followed then aborted and restarted it — which fetched the
 * footage twice (one cancelled request plus the real one). Setting `src`
 * directly gives exactly one request; `onError` keeps the mp4 fallback.
 */
const canPlayAv1Webm = () => {
  const probe = document.createElement("video");
  return probe.canPlayType(AV1_WEBM_TYPE) !== "";
};

export default function HeroVideo() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [variant, setVariant] = useState<Variant | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [useMp4Fallback, setUseMp4Fallback] = useState(false);

  // Pick the breakpoint variant on the client. `media` on <source> is only
  // dependable inside <picture>, so the switch is driven by matchMedia instead.
  useEffect(() => {
    if (shouldSkipVideo()) {
      return;
    }

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

    const sources = VARIANTS[variant];
    const src = useMp4Fallback || !canPlayAv1Webm() ? sources.mp4 : sources.av1;

    // Defer video loading until after the page is interactive
    const startVideo = () => {
      video.preload = "auto";
      video.src = src;
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
  }, [variant, useMp4Fallback]);

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
      onError={() => {
        // canPlayType said "maybe" but decoding failed — retry once on mp4.
        if (!useMp4Fallback) {
          setUseMp4Fallback(true);
        }
      }}
    />
  );
}
