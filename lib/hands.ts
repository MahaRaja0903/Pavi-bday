import { FilesetResolver, HandLandmarker } from "@mediapipe/tasks-vision";

const WASM_PATH =
  "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm";

export async function createHandLandmarker(): Promise<HandLandmarker> {
  const fileset = await FilesetResolver.forVisionTasks(WASM_PATH);

  return HandLandmarker.createFromOptions(fileset, {
    baseOptions: {
      // Self-hosted so Vercel serves it — CDN model fetches are unreliable.
      modelAssetPath: "/models/hand_landmarker.task",
      delegate: "GPU",
    },
    runningMode: "VIDEO",
    numHands: 2,
    minHandDetectionConfidence: 0.5,
    minHandPresenceConfidence: 0.5,
    minTrackingConfidence: 0.5,
  });
}

/** MediaPipe landmark indices. */
export const INDEX_TIP = 8;
export const WRIST = 0;

type Landmark = { x: number; y: number; z: number };

// [tip, pip] pairs for index, middle, ring, pinky.
const FINGERS: [number, number][] = [
  [8, 6],
  [12, 10],
  [16, 14],
  [20, 18],
];

/** Open palm: all four non-thumb fingers clearly extended above their joints. */
export function isOpenHand(lm: Landmark[]): boolean {
  return FINGERS.every(([tip, pip]) => lm[tip].y < lm[pip].y - 0.04);
}

/** Pointing: index up, the other three curled. This is the drawing pose. */
export function isPointing(lm: Landmark[]): boolean {
  const indexUp = lm[8].y < lm[6].y - 0.03;
  const othersDown =
    lm[12].y > lm[10].y && lm[16].y > lm[14].y && lm[20].y > lm[18].y;
  return indexUp && othersDown;
}
