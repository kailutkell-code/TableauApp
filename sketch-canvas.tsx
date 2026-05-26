import React, { useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Environment, RoundedBox, Text, ContactShadows } from "@react-three/drei";
import { LiftConfig, getNotrufLochbild } from "@/lib/lift-config";
import { computeLayout } from "./preview-canvas";
import * as THREE from "three";

interface Preview3DProps { config: LiftConfig; }

type SpecialId = "notHalt" | "notrufAlarm" | "doorClose" | "doorOpen" | "laden" | "luefter";

function FrontCylinder({ radius, depth, z, color, metalness = 0.55, roughness = 0.28, segments = 64 }: { radius: number; depth: number; z: number; color: string; metalness?: number; roughness?: number; segments?: number }) {
  return (
    <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, z + depth / 2]}>
      <cylinderGeometry args={[radius, radius, depth, segments]} />
      <meshStandardMaterial color={color} metalness={metalness} roughness={roughness} />
    </mesh>
  );
}

function BrailleDots3D({ size, z }: { size: number; z: number }) {
  const r = size * 0.026;
  const xs = [-size * 0.09, 0, size * 0.09];
  const ys = [-size * 0.28, -size * 0.20];
  return (
    <group>
      {ys.flatMap((y, yi) => xs.map((x, xi) => (
        <mesh key={`${yi}-${xi}`} position={[x, y, z]}>
          <circleGeometry args={[r, 18]} />
          <meshStandardMaterial color="#111827" side={THREE.DoubleSide} />
        </mesh>
      )))}
    </group>
  );
}

function SpeakerIcon3D({ size, z }: { size: number; z: number }) {
  return (
    <group position={[0, 0, z]}>
      <mesh position={[-size * 0.05, 0, 0]}><boxGeometry args={[size * 0.06, size * 0.12, 0.004]} /><meshStandardMaterial color="#22c55e" /></mesh>
      <mesh position={[size * 0.015, 0, 0]} rotation={[0, 0, Math.PI / 2]}><coneGeometry args={[size * 0.075, size * 0.13, 3]} /><meshStandardMaterial color="#22c55e" side={THREE.DoubleSide} /></mesh>
      {[0.09, 0.135].map((rad, i) => (
        <mesh key={i} position={[size * 0.075, 0, 0.001]} rotation={[0, 0, -Math.PI / 2]}>
          <torusGeometry args={[size * rad, size * 0.007, 8, 32, Math.PI]} />
          <meshStandardMaterial color="#22c55e" />
        </mesh>
      ))}
    </group>
  );
}

function ElevatorButton3D({ size, label, isMain, shape, qColor, frontZ, braille }: { size: number; label: string; isMain: boolean; shape: "Rund" | "Eckig"; qColor: string; frontZ: number; braille: boolean }) {
  const baseDepth = 0.026;
  const textZ = baseDepth + 0.016;
  return (
    <group position={[0, 0, frontZ]}>
      {shape === "Rund" ? (
        <>
          <FrontCylinder radius={size / 2} depth={baseDepth} z={0} color="#d1d5db" />
          <FrontCylinder radius={size * 0.38} depth={0.010} z={baseDepth * 0.80} color="#f8fafc" metalness={0.35} roughness={0.28} />
        </>
      ) : (
        <>
          <RoundedBox args={[size, size, baseDepth]} position={[0, 0, baseDepth / 2]} radius={0.006} smoothness={4}>
            <meshStandardMaterial color="#d1d5db" metalness={0.5} roughness={0.3} />
          </RoundedBox>
          <RoundedBox args={[size * 0.74, size * 0.74, 0.010]} position={[0, 0, baseDepth + 0.005]} radius={0.006} smoothness={4}>
            <meshStandardMaterial color="#f8fafc" metalness={0.28} roughness={0.28} />
          </RoundedBox>
        </>
      )}
      <Text position={[0, 0, textZ]} fontSize={size * 0.35} color="#1e293b" anchorX="center" anchorY="middle" fontWeight="bold">
        {label}
      </Text>
      <mesh position={[0, -size * 0.32, textZ - 0.001]}>
        <planeGeometry args={[size * 0.70, size * 0.12]} />
        <meshStandardMaterial color={qColor} emissive={qColor} emissiveIntensity={0.55} side={THREE.DoubleSide} />
      </mesh>
      {braille && <BrailleDots3D size={size} z={textZ + 0.002} />}
      {isMain && (
        <mesh position={[0, 0, textZ - 0.002]}>
          {shape === "Rund" ? <ringGeometry args={[size / 2 + 0.006, size / 2 + 0.014, 56]} /> : <ringGeometry args={[size * 0.58, size * 0.64, 4]} />}
          <meshStandardMaterial color="#22c55e" emissive="#22c55e" emissiveIntensity={0.28} side={THREE.DoubleSide} />
        </mesh>
      )}
    </group>
  );
}

function ArrowTriangle({ direction, x, size, z }: { direction: "left" | "right"; x: number; size: number; z: number }) {
  const shape = new THREE.Shape();
  const s = size * 0.11;
  if (direction === "left") { shape.moveTo(-s, 0); shape.lineTo(s, s); shape.lineTo(s, -s); }
  else { shape.moveTo(s, 0); shape.lineTo(-s, s); shape.lineTo(-s, -s); }
  shape.closePath();
  return <mesh position={[x, 0, z]}><shapeGeometry args={[shape]} /><meshStandardMaterial color="#0f172a" side={THREE.DoubleSide} /></mesh>;
}

function DoorArrowSymbol({ type, size, z }: { type: "open" | "close"; size: number; z: number }) {
  const gap = size * 0.075;
  return (
    <group>
      {type === "open" ? <><ArrowTriangle direction="left" x={-gap} size={size} z={z} /><ArrowTriangle direction="right" x={gap} size={size} z={z} /></> : <><ArrowTriangle direction="right" x={-gap} size={size} z={z} /><ArrowTriangle direction="left" x={gap} size={size} z={z} /></>}
    </group>
  );
}

function BellIcon3D({ size, z }: { size: number; z: number }) {
  return (
    <group position={[0, 0, z]}>
      <mesh position={[0, size * 0.03, 0]}><circleGeometry args={[size * 0.18, 32]} /><meshStandardMaterial color="#dc2626" side={THREE.DoubleSide} /></mesh>
      <mesh position={[0, -size * 0.09, 0]}><boxGeometry args={[size * 0.42, size * 0.09, 0.004]} /><meshStandardMaterial color="#dc2626" /></mesh>
      <mesh position={[0, -size * 0.20, 0]}><circleGeometry args={[size * 0.055, 24]} /><meshStandardMaterial color="#dc2626" side={THREE.DoubleSide} /></mesh>
      <mesh position={[0, size * 0.23, 0]}><torusGeometry args={[size * 0.09, size * 0.018, 10, 28, Math.PI]} /><meshStandardMaterial color="#dc2626" /></mesh>
    </group>
  );
}

function LoadIcon3D({ size, z }: { size: number; z: number }) {
  return (
    <group position={[0, 0, z]}>
      <mesh position={[-size * 0.02, -size * 0.02, 0]}><boxGeometry args={[size * 0.34, size * 0.23, 0.004]} /><meshStandardMaterial color="#0f172a" /></mesh>
      <mesh position={[size * 0.19, -size * 0.02, 0]}><boxGeometry args={[size * 0.07, size * 0.11, 0.004]} /><meshStandardMaterial color="#0f172a" /></mesh>
      <mesh position={[-size * 0.10, size * 0.15, 0]}><boxGeometry args={[size * 0.035, size * 0.13, 0.004]} /><meshStandardMaterial color="#0f172a" /></mesh>
      <mesh position={[size * 0.02, size * 0.15, 0]}><boxGeometry args={[size * 0.035, size * 0.13, 0.004]} /><meshStandardMaterial color="#0f172a" /></mesh>
      <mesh position={[-size * 0.02, -size * 0.02, 0.002]}><boxGeometry args={[size * 0.11, size * 0.06, 0.004]} /><meshStandardMaterial color="#22c55e" /></mesh>
    </group>
  );
}

function FanIcon3D({ size, z }: { size: number; z: number }) {
  const shape = new THREE.Shape();
  shape.moveTo(0, 0);
  shape.quadraticCurveTo(size * 0.22, -size * 0.08, size * 0.32, size * 0.08);
  shape.quadraticCurveTo(size * 0.17, size * 0.16, 0, 0);
  return (
    <group position={[0, 0, z]}>
      {[0, 1, 2].map((i) => <mesh key={i} rotation={[0, 0, (Math.PI * 2 * i) / 3]}><shapeGeometry args={[shape]} /><meshStandardMaterial color="#0369a1" side={THREE.DoubleSide} /></mesh>)}
      <mesh><circleGeometry args={[size * 0.07, 24]} /><meshStandardMaterial color="#0f172a" /></mesh>
    </group>
  );
}

function SpecialButton3D({ id, w, h, frontZ }: { id: SpecialId; w: number; h: number; frontZ: number }) {
  const size = Math.max(w, h);
  const baseZ = 0;
  const topZ = 0.041;

  if (id === "notHalt") {
    return (
      <group position={[0, 0, frontZ]}>
        <FrontCylinder radius={size * 0.52} depth={0.024} z={baseZ} color="#cfd6df" metalness={0.65} roughness={0.24} />
        <FrontCylinder radius={size * 0.38} depth={0.034} z={0.019} color="#dc2626" metalness={0.25} roughness={0.32} />
        <Text position={[0, 0, 0.060]} fontSize={size * 0.20} color="#ffffff" anchorX="center" anchorY="middle" fontWeight="bold">STOP</Text>
      </group>
    );
  }

  if (id === "notrufAlarm") {
    return (
      <group position={[0, 0, frontZ]}>
        <RoundedBox args={[size, size, 0.024]} position={[0, 0, 0.012]} radius={0.006} smoothness={4}><meshStandardMaterial color="#d1d5db" metalness={0.5} roughness={0.3} /></RoundedBox>
        <RoundedBox args={[size * 0.76, size * 0.76, 0.014]} position={[0, 0, 0.031]} radius={0.006} smoothness={4}><meshStandardMaterial color="#fff7ed" metalness={0.18} roughness={0.28} /></RoundedBox>
        <BellIcon3D size={size} z={topZ} />
      </group>
    );
  }

  return (
    <group position={[0, 0, frontZ]}>
      <RoundedBox args={[w, h, 0.022]} position={[0, 0, 0.011]} radius={0.006} smoothness={4}><meshStandardMaterial color="#d1d5db" metalness={0.48} roughness={0.30} /></RoundedBox>
      <RoundedBox args={[w * 0.78, h * 0.78, 0.012]} position={[0, 0, 0.028]} radius={0.006} smoothness={4}><meshStandardMaterial color="#f8fafc" metalness={0.20} roughness={0.30} /></RoundedBox>
      {id === "doorOpen" && <DoorArrowSymbol type="open" size={size} z={0.041} />}
      {id === "doorClose" && <DoorArrowSymbol type="close" size={size} z={0.041} />}
      {id === "laden" && <LoadIcon3D size={size} z={0.041} />}
      {id === "luefter" && <FanIcon3D size={size} z={0.041} />}
    </group>
  );
}

function KeySwitch3D({ r, frontZ }: { r: number; frontZ: number }) {
  return (
    <group position={[0, 0, frontZ]}>
      <FrontCylinder radius={r} depth={0.020} z={0} color="#c8d0da" />
      <FrontCylinder radius={r * 0.64} depth={0.014} z={0.017} color="#eef2f7" metalness={0.35} roughness={0.25} />
      <mesh position={[0, 0, 0.041]} rotation={[0, 0, -0.16]}><boxGeometry args={[r * 1.20, r * 0.16, 0.006]} /><meshStandardMaterial color="#374151" metalness={0.4} roughness={0.4} /></mesh>
      <mesh position={[r * 0.32, -r * 0.05, 0.044]}><boxGeometry args={[r * 0.20, r * 0.42, 0.006]} /><meshStandardMaterial color="#374151" metalness={0.4} roughness={0.4} /></mesh>
    </group>
  );
}

function NotrufLochbild3D({ config, scale, frontZ, tx, ty, L }: { config: LiftConfig; scale: number; frontZ: number; tx: (x: number, w?: number) => number; ty: (y: number, h?: number) => number; L: ReturnType<typeof computeLayout>; }) {
  const lb = getNotrufLochbild(config.notrufSystem);
  if (!lb || !L.lochbild) return null;
  const sx = L.lochbild.w / lb.width;
  const sy = L.lochbild.h / lb.height;
  return (
    <group position={[tx(L.lochbild.x, L.lochbild.w), ty(L.lochbild.y, L.lochbild.h), frontZ + 0.010]}>
      {lb.holes.map((hole, idx) => {
        const x = (hole.x - lb.width / 2) * sx * scale;
        const y = -(hole.y - lb.height / 2) * sy * scale;
        const r = Math.max(hole.r * Math.min(sx, sy) * scale, 0.008);
        const color = hole.label === "led" ? "#16a34a" : "#111827";
        return <mesh key={idx} position={[x, y, 0.002]}><circleGeometry args={[r, 32]} /><meshStandardMaterial color={color} side={THREE.DoubleSide} /></mesh>;
      })}
    </group>
  );
}

function MountingPoints3D({ W, H, D, scale, count, bauweise, frontZ }: { W: number; H: number; D: number; scale: number; count: number; bauweise: LiftConfig["bauweise"]; frontZ: number }) {
  const holeR = 3.8 * scale;
  const ringR = 5.3 * scale;
  const pairs = Math.max(1, Math.ceil(count / 2));

  if (bauweise === "Aufputz") {
    const z = -D / 2 - 0.004;
    const xPositions = [-W / 2 + 15 * scale, W / 2 - 15 * scale];
    const yTop = H / 2 - 15 * scale;
    const yBottom = -H / 2 + 15 * scale;
    const yPositions = pairs === 1 ? [yTop] : Array.from({ length: pairs }, (_, i) => yTop - ((yTop - yBottom) * i) / (pairs - 1));
    return (
      <group>
        {yPositions.map((y, row) => xPositions.map((x, col) => {
          const idx = row * 2 + col;
          if (idx >= count) return null;
          return (
            <group key={`${row}-${col}`} position={[x, y, z]}>
              <mesh><circleGeometry args={[holeR, 36]} /><meshStandardMaterial color="#020617" side={THREE.DoubleSide} /></mesh>
              <mesh position={[0, 0, -0.001]}><ringGeometry args={[ringR, ringR + 0.008, 36]} /><meshStandardMaterial color="#e2e8f0" side={THREE.DoubleSide} /></mesh>
            </group>
          );
        }))}
      </group>
    );
  }

  const xPositions = [-W / 2 + 12 * scale, W / 2 - 12 * scale];
  const yTop = H / 2 - 30 * scale;
  const yBottom = -H / 2 + 30 * scale;
  const yPositions = pairs === 1 ? [0] : Array.from({ length: pairs }, (_, i) => yTop - ((yTop - yBottom) * i) / (pairs - 1));
  return (
    <group>
      {yPositions.map((y, row) => xPositions.map((x, col) => {
        const idx = row * 2 + col;
        if (idx >= count) return null;
        return (
          <group key={`${row}-${col}`} position={[x, y, frontZ + 0.010]}>
            <mesh><circleGeometry args={[holeR, 32]} /><meshStandardMaterial color="#1e293b" side={THREE.DoubleSide} /></mesh>
            <mesh position={[0, 0, 0.001]}><ringGeometry args={[ringR, ringR + 0.006, 32]} /><meshStandardMaterial color="#cbd5e1" side={THREE.DoubleSide} /></mesh>
          </group>
        );
      }))}
    </group>
  );
}

function LiftPanel({ config }: { config: LiftConfig }) {
  const groupRef = useRef<THREE.Group>(null);
  const scale = 0.01;
  const W = config.width * scale;
  const H = config.height * scale;
  const D = Math.max(config.depth, 2) * scale;
  const T = 2 * scale;
  const tx = (xMm: number, wMm = 0) => (xMm + wMm / 2) * scale - W / 2;
  const ty = (yMm: number, hMm = 0) => H / 2 - (yMm + hMm / 2) * scale;
  const frontZ = (config.bauweise === "Aufputz" ? D / 2 : T / 2) + 0.005;

  useFrame((state) => { if (groupRef.current) groupRef.current.position.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.02; });

  const getQ = () => config.quittierungsfarbe === "Rot" ? "#ef4444" : config.quittierungsfarbe === "Grün" ? "#22c55e" : "#3b82f6";
  const L = computeLayout(config);
  const buttonSize = L.buttonSizeMM * scale;
  const cutInset = 35 * scale;
  const backZ = -D / 2 + T / 2;
  const cutW = Math.max(W - cutInset * 2, T * 3);
  const cutH = Math.max(H - cutInset * 2, T * 3);

  return (
    <group ref={groupRef}>
      {config.bauweise === "Flachmaterial" && <RoundedBox args={[W, H, T]} radius={0.02} smoothness={4}><meshStandardMaterial color="#94a3b8" metalness={0.7} roughness={0.3} /></RoundedBox>}
      {config.bauweise === "Abgekantet" && (
        <group>
          <RoundedBox args={[W, H, T]} radius={0.015} smoothness={4}><meshStandardMaterial color="#94a3b8" metalness={0.7} roughness={0.3} /></RoundedBox>
          <RoundedBox args={[T, H, D]} position={[-W / 2 + T / 2, 0, -D / 2]} radius={0.005} smoothness={4}><meshStandardMaterial color="#8a9aab" metalness={0.7} roughness={0.35} /></RoundedBox>
          <RoundedBox args={[T, H, D]} position={[W / 2 - T / 2, 0, -D / 2]} radius={0.005} smoothness={4}><meshStandardMaterial color="#8a9aab" metalness={0.7} roughness={0.35} /></RoundedBox>
        </group>
      )}
      {config.bauweise === "Aufputz" && (
        <group>
          <RoundedBox args={[W, H, T]} position={[0, 0, D / 2 - T / 2]} radius={0.02} smoothness={4}><meshStandardMaterial color="#94a3b8" metalness={0.7} roughness={0.3} /></RoundedBox>
          <RoundedBox args={[W - T * 2, cutInset, T]} position={[0, H / 2 - cutInset / 2, backZ]} radius={0.006} smoothness={4}><meshStandardMaterial color="#7a8a9b" metalness={0.6} roughness={0.4} /></RoundedBox>
          <RoundedBox args={[W - T * 2, cutInset, T]} position={[0, -H / 2 + cutInset / 2, backZ]} radius={0.006} smoothness={4}><meshStandardMaterial color="#7a8a9b" metalness={0.6} roughness={0.4} /></RoundedBox>
          <RoundedBox args={[cutInset, cutH, T]} position={[-W / 2 + cutInset / 2, 0, backZ]} radius={0.006} smoothness={4}><meshStandardMaterial color="#7a8a9b" metalness={0.6} roughness={0.4} /></RoundedBox>
          <RoundedBox args={[cutInset, cutH, T]} position={[W / 2 - cutInset / 2, 0, backZ]} radius={0.006} smoothness={4}><meshStandardMaterial color="#7a8a9b" metalness={0.6} roughness={0.4} /></RoundedBox>
          <mesh position={[0, 0, backZ + 0.011]}><planeGeometry args={[cutW, cutH]} /><meshStandardMaterial color="#111827" transparent opacity={0.34} side={THREE.DoubleSide} /></mesh>
          <RoundedBox args={[T, H, D]} position={[-W / 2 + T / 2, 0, 0]} radius={0.005} smoothness={4}><meshStandardMaterial color="#8a9aab" metalness={0.7} roughness={0.35} /></RoundedBox>
          <RoundedBox args={[T, H, D]} position={[W / 2 - T / 2, 0, 0]} radius={0.005} smoothness={4}><meshStandardMaterial color="#8a9aab" metalness={0.7} roughness={0.35} /></RoundedBox>
          <RoundedBox args={[W, T, D]} position={[0, H / 2 - T / 2, 0]} radius={0.005} smoothness={4}><meshStandardMaterial color="#8a9aab" metalness={0.7} roughness={0.35} /></RoundedBox>
          <RoundedBox args={[W, T, D]} position={[0, -H / 2 + T / 2, 0]} radius={0.005} smoothness={4}><meshStandardMaterial color="#8a9aab" metalness={0.7} roughness={0.35} /></RoundedBox>
        </group>
      )}

      <MountingPoints3D W={W} H={H} D={D} scale={scale} count={config.befestigungspunkte} bauweise={config.bauweise} frontZ={frontZ} />

      {config.hinterwandkasten && config.bauweise !== "Aufputz" && (
        <group position={[0, 0, frontZ - T - 0.005]}><lineSegments><edgesGeometry args={[new THREE.BoxGeometry(W - 30 * scale, H - 30 * scale, 0.001)]} /><lineBasicMaterial color="#E66124" /></lineSegments></group>
      )}

      {L.display && (
        <group position={[tx(L.display.x, L.display.w), ty(L.display.y, L.display.h), frontZ]}>
          <RoundedBox args={[L.display.w * scale, L.display.h * scale, 0.02]} radius={0.01} smoothness={4}><meshStandardMaterial color="#0f172a" metalness={0.2} roughness={0.4} /></RoundedBox>
          <Text position={[0, 0, 0.015]} fontSize={L.display.h * scale * 0.5} color="#38bdf8" anchorX="center" anchorY="middle">{config.display === "Leo 7 Zoll" ? "7" : "5"}</Text>
          {config.sprachansagen && <group position={[L.display.w * scale * 0.36, L.display.h * scale * 0.32, 0.022]}><SpeakerIcon3D size={L.display.h * scale * 0.22} z={0} /></group>}
        </group>
      )}

      <group position={[tx(L.notlicht.x, L.notlicht.size), ty(L.notlicht.y, L.notlicht.size), frontZ]}>
        <RoundedBox args={[L.notlicht.size * scale, L.notlicht.size * scale, 0.01]} radius={0.005} smoothness={4}><meshStandardMaterial color="#f8fafc" metalness={0.1} roughness={0.5} /></RoundedBox>
        {(() => {
          const s = L.notlicht.size * scale;
          const els: React.ReactNode[] = [];
          els.push(<Text key="t" position={[0, s * 0.35, 0.011]} fontSize={s * 0.09} color="#111827" anchorX="center" anchorY="middle" maxWidth={s * 0.9} textAlign="center" fontWeight="bold">{config.notlicht.tragkraft || "—"}</Text>);
          const combo = [`Baujahr: ${config.notlicht.baujahr || ""}`, config.notlicht.fabrNr ? `Fabr.Nr. ${config.notlicht.fabrNr}` : ""].filter(Boolean).join("  ");
          if (combo) els.push(<Text key="bj" position={[0, s * 0.18, 0.011]} fontSize={s * 0.065} color="#1e293b" anchorX="center" anchorY="middle" maxWidth={s * 0.9} textAlign="center">{combo}</Text>);
          if (config.notlicht.umbaujahr) els.push(<Text key="um" position={[0, s * 0.08, 0.011]} fontSize={s * 0.065} color="#1e293b" anchorX="center" anchorY="middle" maxWidth={s * 0.9} textAlign="center">{`Umbau: ${config.notlicht.umbaujahr}`}</Text>);
          if (config.notlicht.hersteller) els.push(<Text key="he" position={[0, -s * 0.02, 0.011]} fontSize={s * 0.065} color="#1e293b" anchorX="center" anchorY="middle" maxWidth={s * 0.9} textAlign="center">{config.notlicht.hersteller}</Text>);
          els.push(<Text key="b1" position={[0, -s * 0.2, 0.011]} fontSize={s * 0.08} color="#dc2626" anchorX="center" anchorY="middle" fontWeight="bold">AUFZUG IM BRANDFALL</Text>);
          els.push(<Text key="b2" position={[0, -s * 0.32, 0.011]} fontSize={s * 0.08} color="#dc2626" anchorX="center" anchorY="middle" fontWeight="bold">NICHT BENUTZEN</Text>);
          return els;
        })()}
      </group>

      <NotrufLochbild3D config={config} scale={scale} frontZ={frontZ} tx={tx} ty={ty} L={L} />

      {L.buttons.map((b) => {
        const btn = config.buttons[b.idx];
        return <group key={btn.id} position={[tx(b.x, L.buttonSizeMM), ty(b.y, L.buttonSizeMM), 0]}><ElevatorButton3D size={buttonSize} label={btn.engraving} isMain={btn.id === config.mainFloorId} shape={config.buttonShape} qColor={getQ()} frontZ={frontZ} braille={config.brailleSchrift} /></group>;
      })}

      {L.bottomItems.map(it => <group key={it.id} position={[tx(it.x, it.w), ty(it.y, it.h), 0]}><SpecialButton3D id={it.id as SpecialId} w={it.w * scale} h={it.h * scale} frontZ={frontZ} /></group>)}

      {L.keySwitches.map((k, i) => <group key={i} position={[tx(k.x), ty(k.y), 0]}><KeySwitch3D r={k.r * scale} frontZ={frontZ} /></group>)}
    </group>
  );
}

export default function Preview3D({ config }: Preview3DProps) {
  return (
    <div className="w-full h-full bg-gradient-to-br from-background via-background to-card">
      <Canvas camera={{ position: [0.8, 0.35, 12], fov: 35 }} gl={{ antialias: true, alpha: true }}>
        <ambientLight intensity={0.4} />
        <directionalLight position={[5, 5, 5]} intensity={1} castShadow />
        <directionalLight position={[-5, 3, 3]} intensity={0.4} />
        <pointLight position={[0, 5, 5]} intensity={0.3} />
        <LiftPanel config={config} />
        <ContactShadows position={[0, -4.5, 0]} opacity={0.4} scale={15} blur={2.5} far={5} />
        <Environment preset="studio" />
        <OrbitControls enablePan enableZoom enableRotate minDistance={5} maxDistance={25} minPolarAngle={Math.PI / 6} maxPolarAngle={Math.PI - Math.PI / 6} />
      </Canvas>
    </div>
  );
}
