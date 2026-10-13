import { useState, type CSSProperties, type MouseEvent } from "react";

export type Position = "front" | "back" | "top" | "bottom" | "left" | "right";
export type FaceTexts = Record<Position, string>;
export type FaceColors = Record<Position, string | null>;

export type FaceUpdate = string | { text?: string; color?: string | null };

export type RotateContext = {
  direction: "left" | "right";
  step: number;
  clickCount: number;
  current: FaceTexts;
  currentColors: FaceColors;
};

type CubeProps = {
  size?: number;
  initialFaces?: Partial<Record<Position, FaceUpdate>>;
  liveFaces?: Partial<Record<Position, FaceUpdate>>;
  onRotate?: (ctx: RotateContext) => Partial<Record<Position, FaceUpdate>> | void;
  /** Default look of every face (background, text color...). */
  faceClassName?: string;
  idleTilt?: number;
  hoverTilt?: number;
  yaw?: number;
  className?: string;
};

const RING: Position[] = ["top", "right", "bottom", "left"];
const mod = (n: number, m: number) => ((n % m) + m) % m;

type PhysicalKey = "front" | "back" | "p0" | "p1" | "p2" | "p3";
const PHYSICAL_KEYS: PhysicalKey[] = ["front", "back", "p0", "p1", "p2", "p3"];

type PhysicalFace = { text: string; color: string | null };
type PhysicalFaces = Record<PhysicalKey, PhysicalFace>;

const positionOf = (key: PhysicalKey, step: number): Position =>
  key === "front" || key === "back" ? key : RING[mod(Number(key[1]) - step, 4)];

const physicalAt = (position: Position, step: number): PhysicalKey => {
  if (position === "front" || position === "back") return position;
  return `p${mod(RING.indexOf(position) + step, 4)}` as PhysicalKey;
};

const localTransform = (key: PhysicalKey, half: number) => {
  switch (key) {
    case "front": return `translateZ(${half}px)`;
    case "back": return `rotateY(180deg) translateZ(${half}px)`;
    case "p0": return `rotateX(90deg) translateZ(${half}px)`;   // started on top
    case "p1": return `rotateY(90deg) translateZ(${half}px)`;   // started on right
    case "p2": return `rotateX(-90deg) translateZ(${half}px)`;  // started on bottom
    case "p3": return `rotateY(-90deg) translateZ(${half}px)`;  // started on left
  }
};

const applyUpdate = (face: PhysicalFace, update: FaceUpdate): PhysicalFace => {
  if (typeof update === "string") return { ...face, text: update };
  return {
    text: update.text ?? face.text,
    color: update.color === undefined ? face.color : update.color,
  };
};

export default function Cube({
  size = 160,
  initialFaces,
  liveFaces,
  onRotate,
  faceClassName = "bg-indigo-500 text-white",
  idleTilt = 8,
  hoverTilt = 50,
  yaw = -18,
  className = "",
}: CubeProps) {
  const [hovered, setHovered] = useState(false);
  const [step, setStep] = useState(0);
  const [clicks, setClicks] = useState(0);

  const [faces, setFaces] = useState<PhysicalFaces>(() => {
    const faces: PhysicalFaces = {
      front: { text: "", color: null }, // Front
      back: { text: "", color: null }, // Back
      p0: { text: "", color: null }, // Top
      p1: { text: "", color: null }, // Right
      p2: { text: "", color: null }, // Bottom
      p3: { text: "", color: null }, // Left
    };
    (Object.entries(initialFaces ?? {}) as [Position, FaceUpdate][]).forEach(
      ([pos, update]) => {
        const key = physicalAt(pos, 0);
        faces[key] = applyUpdate(faces[key], update);
      }
    );
    return faces;
  });

  const half = size / 2;
  const zRot = -step * 90;

  const handleClick = (e: MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickedRight = e.clientX - rect.left > rect.width / 2;
    const newStep = step + (clickedRight ? 1 : -1);

    const current = {} as FaceTexts;
    const currentColors = {} as FaceColors;
    PHYSICAL_KEYS.forEach((k) => {
      const pos = positionOf(k, newStep);
      current[pos] = faces[k].text;
      currentColors[pos] = faces[k].color;
    });

    const changes =
      onRotate?.({
        direction: clickedRight ? "right" : "left",
        step: newStep,
        clickCount: clicks + 1,
        current,
        currentColors,
      }) ?? {};

    const next = { ...faces };
    (Object.entries(changes) as [Position, FaceUpdate | undefined][]).forEach(
      ([pos, update]) => {
        if (update === undefined) return;
        const key = physicalAt(pos, newStep);
        next[key] = applyUpdate(next[key], update);
      }
    );

    setFaces(next);
    setStep(newStep);
    setClicks((c) => c + 1);
  };

  const tilt = hovered ? hoverTilt : idleTilt;

  const cubeStyle: CSSProperties = {
    width: size,
    height: size,
    transform: `rotateX(${-tilt}deg) rotateY(${yaw}deg) rotateZ(${zRot}deg)`,
    transformStyle: "preserve-3d",
  };

  return (
    <div
      className={`inline-block cursor-pointer select-none p-8 ${className}`}
      style={{ perspective: size * 5 }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={handleClick}
    >
      <div className="relative transition-transform duration-500 ease-out" style={cubeStyle}>
        {PHYSICAL_KEYS.map((key) => {
          const isRing = key.startsWith("p");
          const textRot = isRing
            ? Number(key[1]) * 90
            : key === "back" ? zRot : -zRot;
          const livePos = positionOf(key, step);
          const live = liveFaces?.[livePos];
          const { text, color } = live !== undefined ? applyUpdate(faces[key], live) : faces[key];

          return (
            <div
              key={key}
              className={`absolute inset-0 flex items-center justify-center border border-white/30 transition-colors duration-500 backface-hidden ${faceClassName}`}
              style={{
                transform: localTransform(key, half),
                ...(color ? { backgroundColor: color } : {}),
              }}
            >
              <span
                className={`px-2 text-center text-lg font-semibold ${
                  isRing ? "" : "transition-transform duration-500 ease-out"
                }`}
                style={{ transform: `rotate(${textRot}deg)` }}
              >
                {text}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}