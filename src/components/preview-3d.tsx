import React, { useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Environment, RoundedBox, Text, ContactShadows } from "@react-three/drei";
import { LiftConfig, getNotrufLochbild } from "@/lib/lift-config";
import { computeLayout } from "./preview-canvas";
import * as THREE from "three";

interface Preview3DProps { config: LiftConfig; }

type SpecialId = "notHalt" | "notrufAlarm" | "doorClose" | "doorOpen" | "laden" | "luefter";

function material(color: string, metalness = 0.5, roughness = 0.25) {
  return <meshStandardMaterial color={color} metalness={metalness} roughness={roughness} />;
}

function FrontCylinder({ radius, depth, z, color, metalness = 0.65, roughness = 0.22, segments = 64 }: { radius: number; depth: number; z: number; color: string; metalness?: number; roughness?: number; segments?: number }) {
  return (
    <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, z + depth / 2]}>
      <cylinderGeometry args={[radius, radius, depth, segments]} />
      <meshStandardMaterial color={color} metalness={metalness} roughness={roughness} />
    </mesh>
  );
}

function ElevatorButton3D({ size, label, isMain, shape, qColor, surfaceZ }: { size: number; label: string; isMain: boolean; shape: "Rund" | "Eckig"; qColor: string; surfaceZ: number }) {
  const baseDepth = 0.028;
  const capDepth = 0.014;
  const z0 = surfaceZ + 0.004;
  const frontTextZ = z0 + baseDepth + capDepth + 0.006;
  if (shape === "Rund") {
    return (
      <group>
        <FrontCylinder radius={size * 0.54} depth={baseDepth} z={z0} color="#cfd6df" metalness={0.78} roughness={0.18} />
        <FrontCylinder radius={size * 0.42} depth={capDepth} z={z0 + baseDepth * 0.72} color="#eef2f7" metalness={0.55} roughness={0.22} />
        <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, z0 + baseDepth + 0.01]}>
          <torusGeometry args={[size * 0.46, size * 0.025, 14, 72]} />
          <meshStandardMaterial color="#ffffff" metalness={0.85} roughness={0.14} />
        </mesh>
        <mesh position={[0, -size * 0.34, frontTextZ - 0.003]}>
          <planeGeometry args={[size * 0.64, size * 0.105]} />
          <meshStandardMaterial color={qColor} emissive={qColor} emissiveIntensity={0.45} />
        </mesh>
        {!isMain && (
          <Text position={[0, 0.003, frontTextZ]} fontSize={size * 0.34} color="#111827" anchorX="center" anchorY="middle" maxWidth={size * 0.82} textAlign="center">
            {label}
          </Text>
        )}
        {isMain && (
          <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, frontTextZ - 0.002]}>
            <torusGeometry args={[size * 0.62, size * 0.035, 16, 96]} />
            <meshStandardMaterial color="#16a34a" emissive="#16a34a" emissiveIntensity={0.28} metalness={0.2} roughness={0.25} />
          </mesh>
        )}
      </group>
    );
  }
  return (
    <group>
      <RoundedBox args={[size * 1.04, size * 1.04, baseDepth]} position={[0, 0, z0 + baseDepth / 2]} radius={size * 0.10} smoothness={8}>
        <meshStandardMaterial color="#cfd6df" metalness={0.75} roughness={0.18} />
      </RoundedBox>
      <RoundedBox args={[size * 0.78, size * 0.78, capDepth]} position={[0, 0, z0 + baseDepth + capDepth / 2]} radius={size * 0.08} smoothness={8}>
        <meshStandardMaterial color="#f8fafc" metalness={0.45} roughness={0.24} />
      </RoundedBox>
      <mesh position={[0, -size * 0.35, frontTextZ - 0.003]}>
        <planeGeometry args={[size * 0.62, size * 0.10]} />
        <meshStandardMaterial color={qColor} emissive={qColor} emissiveIntensity={0.42} />
      </mesh>
      {!isMain && (
        <Text position={[0, 0.002, frontTextZ]} fontSize={size * 0.34} color="#111827" anchorX="center" anchorY="middle" maxWidth={size * 0.78} textAlign="center">
          {label}
        </Text>
      )}
      {isMain && (
        <group position={[0, 0, frontTextZ - 0.004]}>
          <lineSegments>
            <edgesGeometry args={[new THREE.BoxGeometry(size * 1.24, size * 1.24, 0.004)]} />
            <lineBasicMaterial color="#16a34a" />
          </lineSegments>
          <RoundedBox args={[size * 1.24, size * 1.24, 0.003]} radius={size * 0.13} smoothness={8}>
            <meshStandardMaterial color="#16a34a" transparent opacity={0.16} emissive="#16a34a" emissiveIntensity={0.16} />
          </RoundedBox>
        </group>
      )}
    </group>
  );
}

function ArrowSymbol({ type, size, z }: { type: "open" | "close"; size: number; z: number }) {
  const txt = type === "open" ? "◀  ▶" : "▶  ◀";
  return <Text position={[0, 0.001, z]} fontSize={size * 0.24} color="#0f172a" anchorX="center" anchorY="middle">{txt}</Text>;
}

function FanIcon3D({ size, z }: { size: number; z: number }) {
  const shape = new THREE.Shape();
  shape.moveTo(0, 0);
  shape.quadraticCurveTo(size * 0.22, -size * 0.08, size * 0.32, size * 0.08);
  shape.quadraticCurveTo(size * 0.17, size * 0.16, 0, 0);
  return (
    <group position={[0, 0, z]}>
      {[0, 1, 2].map((i) => (
        <mesh key={i} rotation={[0, 0, (Math.PI * 2 * i) / 3]}>
          <shapeGeometry args={[shape]} />
          <meshStandardMaterial color="#0369a1" side={THREE.DoubleSide} />
        </mesh>
      ))}
      <mesh>
        <circleGeometry args={[size * 0.075, 28]} />
        <meshStandardMaterial color="#0f172a" />
      </mesh>
    </group>
  );
}

function SpecialButton3D({ id, w, h, surfaceZ }: { id: SpecialId; w: number; h: number; surfaceZ: number }) {
  const size = Math.max(w, h);
  const z0 = surfaceZ + 0.006;
  const topZ = z0 + 0.058;
  const isDoor = id === "doorClose" || id === "doorOpen";

  if (id === "notHalt") {
    return (
      <group>
        <FrontCylinder radius={size * 0.52} depth={0.025} z={z0} color="#d7dde5" metalness={0.82} roughness={0.18} />
        <FrontCylinder radius={size * 0.39} depth={0.040} z={z0 + 0.019} color="#dc2626" metalness={0.25} roughness={0.30} />
        <Text position={[0, 0, topZ + 0.012]} fontSize={size * 0.21} color="#ffffff" anchorX="center" anchorY="middle">STOP</Text>
      </group>
    );
  }

  if (id === "notrufAlarm") {
    return (
      <group>
        <FrontCylinder radius={size * 0.52} depth={0.022} z={z0} color="#d7dde5" metalness={0.82} roughness={0.18} />
        <FrontCylinder radius={size * 0.40} depth={0.026} z={z0 + 0.018} color="#ffffff" metalness={0.35} roughness={0.25} />
        <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, topZ]}>
          <torusGeometry args={[size * 0.26, size * 0.025, 12, 64]} />
          <meshStandardMaterial color="#dc2626" emissive="#dc2626" emissiveIntensity={0.18} />
        </mesh>
        <Text position={[0, -size * 0.01, topZ + 0.01]} fontSize={size * 0.26} color="#dc2626" anchorX="center" anchorY="middle">☎</Text>
      </group>
    );
  }

  if (isDoor || id === "laden" || id === "luefter") {
    const face = id === "laden" ? "#f8fafc" : id === "luefter" ? "#e0f2fe" : "#f8fafc";
    const accent = isDoor ? "#2563eb" : id === "laden" ? "#111827" : "#0369a1";
    return (
      <group>
        <RoundedBox args={[w * 1.12, h * 1.12, 0.024]} position={[0, 0, z0 + 0.012]} radius={size * 0.10} smoothness={8}>
          <meshStandardMaterial color="#cfd6df" metalness={0.76} roughness={0.19} />
        </RoundedBox>
        <RoundedBox args={[w * 0.82, h * 0.82, 0.025]} position={[0, 0, z0 + 0.037]} radius={size * 0.08} smoothness={8}>
          <meshStandardMaterial color={face} metalness={0.36} roughness={0.24} />
        </RoundedBox>
        {id === "doorOpen" && <ArrowSymbol type="open" size={size} z={topZ + 0.006} />}
        {id === "doorClose" && <ArrowSymbol type="close" size={size} z={topZ + 0.006} />}
        {id === "laden" && <Text position={[0, 0, topZ + 0.006]} fontSize={size * 0.25} color={accent} anchorX="center" anchorY="middle">LAD</Text>}
        {id === "luefter" && <FanIcon3D size={size} z={topZ + 0.006} />}
      </group>
    );
  }

  return null;
}

function KeySwitch3D({ r, surfaceZ }: { r: number; surfaceZ: number }) {
  const z0 = surfaceZ + 0.006;
  return (
    <group>
      <FrontCylinder radius={r * 1.18} depth={0.024} z={z0} color="#cfd6df" metalness={0.85} roughness={0.18} segments={64} />
      <FrontCylinder radius={r * 0.72} depth={0.022} z={z0 + 0.018} color="#eef2f7" metalness={0.55} roughness={0.22} segments={64} />
      <mesh position={[0, 0, z0 + 0.054]} rotation={[0, 0, -0.12]}>
        <boxGeometry args={[r * 1.08, r * 0.17, 0.006]} />
        <meshStandardMaterial color="#111827" metalness={0.4} roughness={0.35} />
      </mesh>
      <mesh position={[r * 0.33, -r * 0.05, z0 + 0.058]}>
        <boxGeometry args={[r * 0.20, r * 0.42, 0.006]} />
        <meshStandardMaterial color="#111827" metalness={0.4} roughness={0.35} />
      </mesh>
    </group>
  );
}

function NotrufLochbild3D({ config, scale, surfaceZ, tx, ty, L }: { config: LiftConfig; scale: number; surfaceZ: number; tx: (x: number, w?: number) => number; ty: (y: number, h?: number) => number; L: ReturnType<typeof computeLayout>; }) {
  const lb = getNotrufLochbild(config.notrufSystem);
  if (!lb || !L.lochbild) return null;
  const sx = L.lochbild.w / lb.width;
  const sy = L.lochbild.h / lb.height;
  const z = surfaceZ + 0.012;
  return (
    <group position={[tx(L.lochbild.x, L.lochbild.w), ty(L.lochbild.y, L.lochbild.h), z]}>
      <RoundedBox args={[L.lochbild.w * scale + 0.08, L.lochbild.h * scale + 0.055, 0.010]} radius={0.012} smoothness={6}>
        <meshStandardMaterial color="#aeb8c4" metalness={0.65} roughness={0.30} transparent opacity={0.55} />
      </RoundedBox>
      {lb.holes.map((hole, idx) => {
        const x = (hole.x - lb.width / 2) * sx * scale;
        const y = -(hole.y - lb.height / 2) * sy * scale;
        const r = Math.max(hole.r * Math.min(sx, sy) * scale, 0.009);
        const col = hole.label === "led" ? "#16a34a" : hole.label === "fix" ? "#020617" : "#111827";
        return (
          <group key={idx} position={[x, y, 0.009]}>
            <mesh>
              <circleGeometry args={[r, hole.label === "speaker" ? 20 : 32]} />
              <meshStandardMaterial color={col} side={THREE.DoubleSide} />
            </mesh>
            {hole.label === "fix" && (
              <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0.002]}>
                <torusGeometry args={[r * 1.35, r * 0.18, 8, 28]} />
                <meshStandardMaterial color="#64748b" metalness={0.7} roughness={0.2} />
              </mesh>
            )}
          </group>
        );
      })}
    </group>
  );
}

function BackMountingHoles({ W, H, D, scale }: { W: number; H: number; D: number; scale: number }) {
  const backOutsideZ = -D / 2 - 0.004;
  const xPositions = [-W / 2 + 15 * scale, W / 2 - 15 * scale];
  const yPositions = [H / 2 - 17.5 * scale, -H / 2 + 17.5 * scale];
  return (
    <group>
      {yPositions.map((y, row) => xPositions.map((x, col) => (
        <group key={`${row}-${col}`} position={[x, y, backOutsideZ]}>
          <mesh>
            <circleGeometry args={[4.2 * scale, 36]} />
            <meshStandardMaterial color="#020617" side={THREE.DoubleSide} />
          </mesh>
          <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, -0.002]}>
            <torusGeometry args={[5.2 * scale, 0.7 * scale, 8, 36]} />
            <meshStandardMaterial color="#cbd5e1" metalness={0.8} roughness={0.22} />
          </mesh>
        </group>
      )))}
    </group>
  );
}

function LiftPanel({ config }: { config: LiftConfig }) {
  const groupRef = useRef<THREE.Group>(null);
  const scale = 0.01; // 1mm = 0.01 units
  const W = config.width * scale;
  const H = config.height * scale;
  const D = Math.max(config.depth, 2) * scale;
  const T = 2 * scale;

  const tx = (xMm: number, wMm = 0) => (xMm + wMm / 2) * scale - W / 2;
  const ty = (yMm: number, hMm = 0) => H / 2 - (yMm + hMm / 2) * scale;
  const surfaceZ = config.bauweise === "Aufputz" ? D / 2 : T / 2;

  useFrame((state) => {
    if (groupRef.current) groupRef.current.position.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.02;
  });

  const getQ = () => {
    switch (config.quittierungsfarbe) {
      case "Rot": return "#ef4444";
      case "Grün": return "#22c55e";
      default: return "#3b82f6";
    }
  };

  const L = computeLayout(config);
  const buttonSize = L.buttonSizeMM * scale;
  const backCutInset = 35 * scale;
  const cutW = Math.max(W - backCutInset * 2, T * 4);
  const cutH = Math.max(H - backCutInset * 2, T * 4);
  const backZ = -D / 2 + T / 2;

  return (
    <group ref={groupRef}>
      {config.bauweise === "Flachmaterial" && (
        <RoundedBox args={[W, H, T]} radius={0.02} smoothness={4}>
          <meshStandardMaterial color="#94a3b8" metalness={0.7} roughness={0.3} />
        </RoundedBox>
      )}
      {config.bauweise === "Abgekantet" && (
        <group>
          <RoundedBox args={[W, H, T]} radius={0.015} smoothness={4}>
            <meshStandardMaterial color="#94a3b8" metalness={0.7} roughness={0.3} />
          </RoundedBox>
          <RoundedBox args={[T, H, D]} position={[-W / 2 + T / 2, 0, -D / 2]} radius={0.005} smoothness={4}>
            <meshStandardMaterial color="#8a9aab" metalness={0.7} roughness={0.35} />
          </RoundedBox>
          <RoundedBox args={[T, H, D]} position={[W / 2 - T / 2, 0, -D / 2]} radius={0.005} smoothness={4}>
            <meshStandardMaterial color="#8a9aab" metalness={0.7} roughness={0.35} />
          </RoundedBox>
        </group>
      )}
      {config.bauweise === "Aufputz" && (
        <group>
          <RoundedBox args={[W, H, T]} position={[0, 0, D / 2 - T / 2]} radius={0.02} smoothness={4}>
            <meshStandardMaterial color="#94a3b8" metalness={0.7} roughness={0.3} />
          </RoundedBox>

          <RoundedBox args={[W - T * 2, backCutInset, T]} position={[0, H / 2 - backCutInset / 2, backZ]} radius={0.006} smoothness={4}>
            <meshStandardMaterial color="#7a8a9b" metalness={0.62} roughness={0.42} />
          </RoundedBox>
          <RoundedBox args={[W - T * 2, backCutInset, T]} position={[0, -H / 2 + backCutInset / 2, backZ]} radius={0.006} smoothness={4}>
            <meshStandardMaterial color="#7a8a9b" metalness={0.62} roughness={0.42} />
          </RoundedBox>
          <RoundedBox args={[backCutInset, cutH, T]} position={[-W / 2 + backCutInset / 2, 0, backZ]} radius={0.006} smoothness={4}>
            <meshStandardMaterial color="#7a8a9b" metalness={0.62} roughness={0.42} />
          </RoundedBox>
          <RoundedBox args={[backCutInset, cutH, T]} position={[W / 2 - backCutInset / 2, 0, backZ]} radius={0.006} smoothness={4}>
            <meshStandardMaterial color="#7a8a9b" metalness={0.62} roughness={0.42} />
          </RoundedBox>
          <mesh position={[0, 0, backZ + 0.011]}>
            <planeGeometry args={[cutW, cutH]} />
            <meshStandardMaterial color="#111827" transparent opacity={0.32} side={THREE.DoubleSide} />
          </mesh>

          <RoundedBox args={[T, H, D]} position={[-W / 2 + T / 2, 0, 0]} radius={0.005} smoothness={4}>
            <meshStandardMaterial color="#8a9aab" metalness={0.7} roughness={0.35} />
          </RoundedBox>
          <RoundedBox args={[T, H, D]} position={[W / 2 - T / 2, 0, 0]} radius={0.005} smoothness={4}>
            <meshStandardMaterial color="#8a9aab" metalness={0.7} roughness={0.35} />
          </RoundedBox>
          <RoundedBox args={[W, T, D]} position={[0, H / 2 - T / 2, 0]} radius={0.005} smoothness={4}>
            <meshStandardMaterial color="#8a9aab" metalness={0.7} roughness={0.35} />
          </RoundedBox>
          <RoundedBox args={[W, T, D]} position={[0, -H / 2 + T / 2, 0]} radius={0.005} smoothness={4}>
            <meshStandardMaterial color="#8a9aab" metalness={0.7} roughness={0.35} />
          </RoundedBox>

          <BackMountingHoles W={W} H={H} D={D} scale={scale} />
        </group>
      )}

      {config.hinterwandkasten && (
        <group position={[0, 0, surfaceZ + 0.002]}>
          <lineSegments>
            <edgesGeometry args={[new THREE.BoxGeometry(W - 30 * scale, H - 30 * scale, 0.001)]} />
            <lineBasicMaterial color="#E66124" />
          </lineSegments>
        </group>
      )}

      {L.display && (
        <group position={[tx(L.display.x, L.display.w), ty(L.display.y, L.display.h), surfaceZ + 0.012]}>
          <RoundedBox args={[L.display.w * scale, L.display.h * scale, 0.024]} radius={0.01} smoothness={4}>
            <meshStandardMaterial color="#0f172a" metalness={0.2} roughness={0.4} />
          </RoundedBox>
          <Text position={[0, 0, 0.020]} fontSize={L.display.h * scale * 0.5} color="#38bdf8" anchorX="center" anchorY="middle">
            {config.display === "Leo 7 Zoll" ? "7" : "5"}
          </Text>
        </group>
      )}

      <group position={[tx(L.notlicht.x, L.notlicht.size), ty(L.notlicht.y, L.notlicht.size), surfaceZ + 0.010]}>
        <RoundedBox args={[L.notlicht.size * scale, L.notlicht.size * scale, 0.014]} radius={0.005} smoothness={4}>
          <meshStandardMaterial color="#f8fafc" metalness={0.1} roughness={0.5} />
        </RoundedBox>
        {(() => {
          const s = L.notlicht.size * scale;
          const els: React.ReactNode[] = [];
          els.push(<Text key="t" position={[0, s * 0.34, 0.017]} fontSize={s * 0.082} color="#111827" anchorX="center" anchorY="middle" maxWidth={s * 0.86} textAlign="center">{config.notlicht.tragkraft || "—"}</Text>);
          const bj = config.notlicht.baujahr ? `Baujahr: ${config.notlicht.baujahr}` : "";
          const fn = config.notlicht.fabrNr ? `Fabr.Nr. ${config.notlicht.fabrNr}` : "";
          const combo = [bj, fn].filter(Boolean).join("  ");
          if (combo) els.push(<Text key="bj" position={[0, s * 0.18, 0.017]} fontSize={s * 0.058} color="#1e293b" anchorX="center" anchorY="middle" maxWidth={s * 0.86} textAlign="center">{combo}</Text>);
          if (config.notlicht.umbaujahr) els.push(<Text key="um" position={[0, s * 0.07, 0.017]} fontSize={s * 0.058} color="#1e293b" anchorX="center" anchorY="middle" maxWidth={s * 0.86} textAlign="center">{`Umbau: ${config.notlicht.umbaujahr}`}</Text>);
          if (config.notlicht.hersteller) els.push(<Text key="he" position={[0, -s * 0.04, 0.017]} fontSize={s * 0.058} color="#1e293b" anchorX="center" anchorY="middle" maxWidth={s * 0.86} textAlign="center">{config.notlicht.hersteller}</Text>);
          els.push(<Text key="b1" position={[0, -s * 0.22, 0.017]} fontSize={s * 0.073} color="#dc2626" anchorX="center" anchorY="middle" maxWidth={s * 0.88} textAlign="center">AUFZUG IM BRANDFALL</Text>);
          els.push(<Text key="b2" position={[0, -s * 0.34, 0.017]} fontSize={s * 0.073} color="#dc2626" anchorX="center" anchorY="middle" maxWidth={s * 0.88} textAlign="center">NICHT BENUTZEN</Text>);
          return els;
        })()}
      </group>

      <NotrufLochbild3D config={config} scale={scale} surfaceZ={surfaceZ} tx={tx} ty={ty} L={L} />

      {L.buttons.map((b) => {
        const btn = config.buttons[b.idx];
        const isMain = btn.id === config.mainFloorId;
        return (
          <group key={btn.id} position={[tx(b.x, L.buttonSizeMM), ty(b.y, L.buttonSizeMM), 0]}>
            <ElevatorButton3D size={buttonSize} label={btn.engraving} isMain={isMain} shape={config.buttonShape} qColor={getQ()} surfaceZ={surfaceZ} />
          </group>
        );
      })}

      {L.bottomItems.map(it => {
        const wU = it.w * scale, hU = it.h * scale;
        return (
          <group key={it.id} position={[tx(it.x, it.w), ty(it.y, it.h), 0]}>
            <SpecialButton3D id={it.id as SpecialId} w={wU} h={hU} surfaceZ={surfaceZ} />
          </group>
        );
      })}

      {L.keySwitches.map((k, i) => (
        <group key={i} position={[tx(k.x), ty(k.y), 0]}>
          <KeySwitch3D r={k.r * scale} surfaceZ={surfaceZ} />
        </group>
      ))}
    </group>
  );
}

export default function Preview3D({ config }: Preview3DProps) {
  return (
    <div className="w-full h-full bg-gradient-to-br from-background via-background to-card">
      <Canvas camera={{ position: [0.8, 0.35, 12], fov: 35 }} gl={{ antialias: true, alpha: true }}>
        <ambientLight intensity={0.42} />
        <directionalLight position={[5, 5, 5]} intensity={1} castShadow />
        <directionalLight position={[-5, 3, 3]} intensity={0.45} />
        <pointLight position={[0, 5, 5]} intensity={0.3} />
        <LiftPanel config={config} />
        <ContactShadows position={[0, -4.5, 0]} opacity={0.4} scale={15} blur={2.5} far={5} />
        <Environment preset="studio" />
        <OrbitControls enablePan enableZoom enableRotate minDistance={5} maxDistance={25} minPolarAngle={Math.PI / 6} maxPolarAngle={Math.PI - Math.PI / 6} />
      </Canvas>
    </div>
  );
}
