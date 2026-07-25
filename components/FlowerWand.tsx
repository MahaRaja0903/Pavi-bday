"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { HandLandmarker } from "@mediapipe/tasks-vision";
import { burst, plant, step, type Flower } from "@/lib/garden";
import { createHandLandmarker, INDEX_TIP, isOpenHand, isPointing, WRIST } from "@/lib/hands";
import { loadFlowers } from "@/lib/loadFlowers";

/** Frames of open palm required before a burst fires — kills flicker-explosions. */
const BURST_FRAMES = 4;
/** Cooldown after a burst so one gesture doesn't chain-detonate. */
const BURST_COOLDOWN_MS = 800;

type Point = { x: number; y: number };

export default function FlowerWand() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const gardenRef = useRef<Flower[]>([]);
  const imagesRef = useRef<HTMLImageElement[]>([]);
  const landmarkerRef = useRef<HandLandmarker | null>(null);
  const rafRef = useRef<number>(0);
  const lastVideoTimeRef = useRef(-1);
  const lastPointsRef = useRef<(Point | null)[]>([null, null]);
  const openFramesRef = useRef(0);
  const lastBurstRef = useRef(0);

  const [running, setRunning] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");

  /** Map a normalized landmark to mirrored, object-fit:cover screen coords. */
  const toScreen = useCallback((nx: number, ny: number): Point => {
    const video = videoRef.current!;
    const canvas = canvasRef.current!;
    const cw = canvas.clientWidth;
    const ch = canvas.clientHeight;
    const vw = video.videoWidth || cw;
    const vh = video.videoHeight || ch;

    const scale = Math.max(cw / vw, ch / vh);
    const drawW = vw * scale;
    const drawH = vh * scale;
    const offsetX = (cw - drawW) / 2;
    const offsetY = (ch - drawH) / 2;

    return {
      x: offsetX + (1 - nx) * drawW, // 1 - nx mirrors it to match the video
      y: offsetY + ny * drawH,
    };
  }, []);

  const resizeCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = canvas.clientWidth * dpr;
    canvas.height = canvas.clientHeight * dpr;
    const ctx = canvas.getContext("2d");
    ctx?.setTransform(dpr, 0, 0, dpr, 0, 0);
  }, []);

  const loop = useCallback(() => {
    rafRef.current = requestAnimationFrame(loop);

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const landmarker = landmarkerRef.current;
    if (!video || !canvas || !landmarker || video.readyState < 2) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const now = performance.now();

    // Only re-detect when there's actually a new camera frame.
    if (video.currentTime !== lastVideoTimeRef.current) {
      lastVideoTimeRef.current = video.currentTime;
      const result = landmarker.detectForVideo(video, now);
      const hands = result.landmarks ?? [];

      const anyOpen = hands.some((lm) => isOpenHand(lm));
      openFramesRef.current = anyOpen ? openFramesRef.current + 1 : 0;

      const cooling = now - lastBurstRef.current < BURST_COOLDOWN_MS;

      if (openFramesRef.current >= BURST_FRAMES && !cooling) {
        const openHand = hands.find((lm) => isOpenHand(lm))!;
        const origin = toScreen(openHand[WRIST].x, openHand[WRIST].y);
        burst(gardenRef.current, origin.x, origin.y);
        lastBurstRef.current = now;
        lastPointsRef.current = [null, null];
      } else if (!anyOpen) {
        // Plant from each pointing hand independently.
        hands.forEach((lm, i) => {
          if (i > 1) return;
          if (!isPointing(lm)) {
            lastPointsRef.current[i] = null;
            return;
          }
          const tip = toScreen(lm[INDEX_TIP].x, lm[INDEX_TIP].y);
          lastPointsRef.current[i] = plant(
            gardenRef.current,
            tip.x,
            tip.y,
            imagesRef.current,
            lastPointsRef.current[i]
          );
        });
        // Forget stale hands so a returning hand starts a fresh stroke.
        for (let i = hands.length; i < 2; i++) lastPointsRef.current[i] = null;
      }
    }

    ctx.clearRect(0, 0, canvas.clientWidth, canvas.clientHeight);
    step(gardenRef.current, ctx, now);
  }, [toScreen]);

  const start = useCallback(async () => {
    setError("");
    try {
      setStatus("Loading flowers…");
      imagesRef.current = await loadFlowers();
      if (imagesRef.current.length === 0) {
        throw new Error("No flower PNGs found. Add some to /public/flowers first.");
      }

      setStatus("Loading hand tracking…");
      landmarkerRef.current = await createHandLandmarker();

      setStatus("Starting camera…");
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });

      const video = videoRef.current!;
      video.srcObject = stream;
      await video.play();

      setRunning(true);
      setStatus("");
      resizeCanvas();
      rafRef.current = requestAnimationFrame(loop);
    } catch (err) {
      setStatus("");
      setError(err instanceof Error ? err.message : "Something went wrong.");
    }
  }, [loop, resizeCanvas]);

  useEffect(() => {
    window.addEventListener("resize", resizeCanvas);
    return () => {
      window.removeEventListener("resize", resizeCanvas);
      cancelAnimationFrame(rafRef.current);
      landmarkerRef.current?.close();
      const stream = videoRef.current?.srcObject as MediaStream | null;
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, [resizeCanvas]);

  return (
    <main className="stage">
      <video ref={videoRef} playsInline muted />
      <canvas ref={canvasRef} />

      {!running && (
        <div className="start">
          <h1>Flower Wand</h1>
          <p>
            Point your index finger to grow flowers. Open your hand to scatter them.
          </p>
          {error && <p className="error">{error}</p>}
          <button onClick={start} disabled={status !== ""}>
            {status || "Turn on camera"}
          </button>
        </div>
      )}

      {running && <div className="hud">Point to plant · Open your hand to scatter</div>}
    </main>
  );
}
