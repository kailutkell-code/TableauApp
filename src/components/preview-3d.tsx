import React, { useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Environment, RoundedBox, Text, ContactShadows } from "@react-three/drei";
import { LiftConfig, getNotrufLochbild } from "@/lib/lift-config";
import { computeLayout } from "./preview-canvas";
import * as THREE from "three";

interface Preview3DProps { config: LiftConfig; }

type SpecialId = "notHalt" | "notrufAlarm" | "doorClose" | "doorOpen" | "laden" | "luefter";

function SpecialButton3D({ id, w, h, label }: { id: SpecialId; w: number; h: number; label: string }) {
  const isRound = id === "notHalt" || id === "notrufAlarm" || id === "doorClose" || id === "doorOpen" || id === "laden" || id === "luefter";
  const faceColor = id === "notHalt" ? "#dc2626" : "#f8fafc";
  const iconColor = id === "notHalt" ? "#ffffff" : id === "notrufAlarm" ? "#dc2626" : "#111827";
  const accent = id === "notrufAlarm" ? "#dc2626" : id === "doorOpen" || id === "doorClose" ? "#2563eb" : id === "laden" ? "#111827" : id === "luefter" ? "#0891b2" : "#ffffff";

  return (
    <group>
      {isRound ? (
        <>
          <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
            <cylinderGeometry args={[Math.max(w, h) / 2 * 0.66, Math.max(w, h) / 2 * 0.76, 0.018, 48]} />
            <meshStandardMaterial color="#d9dde3" metalness={0.85} roughness={0.18} />
          </mesh>
          <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0.012]}>
            <cylinderGeometry args={[Math.max(w, h) / 2 * 0.50, Math.max(w, h) / 2 * 0.54, 0.014, 48]} />
            <meshStandardMaterial color={faceColor} metalness={id === "notHalt" ? 0.25 : 0.55} roughness={0.28} />
          </mesh>
          <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0.022]}>
            <torusGeometry args={[Math.max(w, h) / 2 * 0.58, Math.max(w, h) / 2 * 0.035, 12, 48]} />
            <meshStandardMaterial color="#f1f5f9" metalness={0.9} roughness={0.16} />
          </mesh>
        </>
      ) : (
        <>
          <RoundedBox args={[w, h, 0.018]} radius={0.006} smoothness={4}>
            <meshStandardMaterial color="#d9dde3" metalness={0.75} roughness={0.2} />
          </RoundedBox>
          <RoundedBox args={[w * 0.78, h * 0.78, 0.012]} position={[0, 0, 0.014]} radius={0.006} smoothness={4}>
            <meshStandardMaterial color={faceColor} metalness={0.45} roughness={0.28} />
          </RoundedBox>
        </>
      )}

      {id === "luefter" ? (
        <group position={[0, 0, 0.035]}>
          {[0, 1, 2].map((i) => (
            <mesh key={i} rotation={[0, 0, (Math.PI * 2 * i) / 3]} position={[0, 0, 0]}>
              <shapeGeometry args={[new THREE.Shape().moveTo(0, 0).quadraticCurveTo(w * 0.22, -h * 0.08, w * 0.3, h * 0.1).quadraticCurveTo(w * 0.12, h * 0.14, 0, 0)]} />
              <meshStandardMaterial color={accent} side={THREE.DoubleSide} />
            </mesh>
          ))}
          <mesh><circleGeometry args={[w * 0.07, 24]} /><meshStandardMaterial color={accent} /></mesh>
        </group>
      ) : (
        <Text position={[0, 0, 0.038]} fontSize={Math.min(w, h) * 0.38} color={iconColor} anchorX="center" anchorY="middle" fontWeight="bold">
          {label}
        </Text>
      )}
    </group>
  );
}

function NotrufLochbild3D({ config, scale, frontZ, tx, ty, L }: { config: LiftConfig; scale: number; frontZ: number; tx: (x: number, w?: number) => number; ty: (y: number, h?: number) => number; L: ReturnType<typeof computeLayout>; }) {
  const lb = getNotrufLochbild(config.notrufSystem);
  if (!lb || !L.lochbild) return null;
  const sx = L.lochbild.w / lb.width;
  const sy = L.lochbild.h / lb.height;
  return (
    <group position={[tx(L.lochbild.x, L.lochbild.w), ty(L.lochbild.y, L.lochbild.h), frontZ + 0.01]}>
      {lb.holes.map((hole, idx) => {
        const x = (hole.x - lb.width / 2) * sx * scale;
        const y = -(hole.y - lb.height / 2) * sy * scale;
        const r = Math.max(hole.r * Math.min(sx, sy) * scale, 0.008);
        const isSpeaker = hole.label === "speaker";
        return (
          <mesh key={idx} position={[x, y, 0]}>
            <circleGeometry args={[r, isSpeaker ? 18 : 28]} />
            <meshStandardMaterial color={isSpeaker ? "#111827" : "#020617"} metalness={0.05} roughness={0.5} side={THREE.DoubleSide} />
          </mesh>
        );
      })}
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
  const frontZ = (config.bauweise === "Aufputz" ? D / 2 : T / 2) + 0.005;

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

          {/* Rückseite mit rechteckigem Ausschnitt: umlaufend 35 mm Rand */}
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
            <meshStandardMaterial color="#111827" transparent opacity={0.38} side={THREE.DoubleSide} />
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

          {/* Kabel-/Befestigungslöcher oben und unten, je 15 mm von links/rechts */}
          {[-1, 1].map((sideY) => (
            <group key={sideY} position={[0, sideY * (H / 2 + 0.001), 0]} rotation={[Math.PI / 2, 0, 0]}>
              {[-1, 1].map((sideX) => (
                <mesh key={sideX} position={[sideX * (W / 2 - 15 * scale), 0, sideY > 0 ? -0.001 : 0.001]}>
                  <circleGeometry args={[4 * scale, 32]} />
                  <meshStandardMaterial color="#0f172a" side={THREE.DoubleSide} />
                </mesh>
              ))}
            </group>
          ))}
        </group>
      )}

      {config.hinterwandkasten && (
        <group position={[0, 0, frontZ - T - 0.005]}>
          <lineSegments>
            <edgesGeometry args={[new THREE.BoxGeometry(W - 30 * scale, H - 30 * scale, 0.001)]} />
            <lineBasicMaterial color="#E66124" />
          </lineSegments>
        </group>
      )}

      {L.display && (
        <group position={[tx(L.display.x, L.display.w), ty(L.display.y, L.display.h), frontZ]}>
          <RoundedBox args={[L.display.w * scale, L.display.h * scale, 0.02]} radius={0.01} smoothness={4}>
            <meshStandardMaterial color="#0f172a" metalness={0.2} roughness={0.4} />
          </RoundedBox>
          <Text position={[0, 0, 0.015]} fontSize={L.display.h * scale * 0.5} color="#38bdf8" anchorX="center" anchorY="middle">
            {config.display === "Leo 7 Zoll" ? "7" : "5"}
          </Text>
        </group>
      )}

      <group position={[tx(L.notlicht.x, L.notlicht.size), ty(L.notlicht.y, L.notlicht.size), frontZ]}>
        <RoundedBox args={[L.notlicht.size * scale, L.notlicht.size * scale, 0.01]} radius={0.005} smoothness={4}>
          <meshStandardMaterial color="#f8fafc" metalness={0.1} roughness={0.5} />
        </RoundedBox>
        {(() => {
          const s = L.notlicht.size * scale;
          const els: React.ReactNode[] = [];
          els.push(<Text key="t" position={[0, s * 0.34, 0.014]} fontSize={s * 0.082} color="#111827" anchorX="center" anchorY="middle" maxWidth={s * 0.86} textAlign="center" fontWeight="bold">{config.notlicht.tragkraft || "—"}</Text>);
          const bj = config.notlicht.baujahr ? `Baujahr: ${config.notlicht.baujahr}` : "";
          const fn = config.notlicht.fabrNr ? `Fabr.Nr. ${config.notlicht.fabrNr}` : "";
          const combo = [bj, fn].filter(Boolean).join("  ");
          if (combo) els.push(<Text key="bj" position={[0, s * 0.18, 0.014]} fontSize={s * 0.058} color="#1e293b" anchorX="center" anchorY="middle" maxWidth={s * 0.86} textAlign="center">{combo}</Text>);
          if (config.notlicht.umbaujahr) els.push(<Text key="um" position={[0, s * 0.07, 0.014]} fontSize={s * 0.058} color="#1e293b" anchorX="center" anchorY="middle" maxWidth={s * 0.86} textAlign="center">{`Umbau: ${config.notlicht.umbaujahr}`}</Text>);
          if (config.notlicht.hersteller) els.push(<Text key="he" position={[0, -s * 0.04, 0.014]} fontSize={s * 0.058} color="#1e293b" anchorX="center" anchorY="middle" maxWidth={s * 0.86} textAlign="center">{config.notlicht.hersteller}</Text>);
          els.push(<Text key="b1" position={[0, -s * 0.22, 0.014]} fontSize={s * 0.073} color="#dc2626" anchorX="center" anchorY="middle" maxWidth={s * 0.88} textAlign="center" fontWeight="bold">AUFZUG IM BRANDFALL</Text>);
          els.push(<Text key="b2" position={[0, -s * 0.34, 0.014]} fontSize={s * 0.073} color="#dc2626" anchorX="center" anchorY="middle" maxWidth={s * 0.88} textAlign="center" fontWeight="bold">NICHT BENUTZEN</Text>);
          return els;
        })()}
      </group>

      <NotrufLochbild3D config={config} scale={scale} frontZ={frontZ} tx={tx} ty={ty} L={L} />

      {L.buttons.map((b) => {
        const btn = config.buttons[b.idx];
        const isMain = btn.id === config.mainFloorId;
        const isRound = config.buttonShape === "Rund";
        return (
          <group key={btn.id} position={[tx(b.x, L.buttonSizeMM), ty(b.y, L.buttonSizeMM), frontZ]}>
            {isRound ? (
              <>
                <mesh rotation={[Math.PI / 2, 0, 0]}>
                  <cylinderGeometry args={[buttonSize / 2, buttonSize / 2, 0.025, 48]} />
                  <meshStandardMaterial color="#d1d5db" metalness={0.68} roughness={0.22} />
                </mesh>
                <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0.016]}>
                  <torusGeometry args={[buttonSize / 2 * 0.82, buttonSize * 0.035, 12, 48]} />
                  <meshStandardMaterial color="#f8fafc" metalness={0.85} roughness={0.16} />
                </mesh>
              </>
            ) : (
              <RoundedBox args={[buttonSize, buttonSize, 0.025]} radius={0.006} smoothness={4}>
                <meshStandardMaterial color="#d1d5db" metalness={0.62} roughness={0.24} />
              </RoundedBox>
            )}
            <Text position={[0, 0, 0.023]} fontSize={buttonSize * 0.35} color="#1e293b" anchorX="center" anchorY="middle" fontWeight="bold">
              {btn.engraving}
            </Text>
            <mesh position={[0, -buttonSize * 0.32, 0.024]}>
              <planeGeometry args={[buttonSize * 0.7, buttonSize * 0.12]} />
              <meshStandardMaterial color={getQ()} emissive={getQ()} emissiveIntensity={0.6} />
            </mesh>
            {isMain && (
              <group position={[0, 0, 0.031]}>
                {isRound ? (
                  <mesh>
                    <ringGeometry args={[buttonSize / 2 + 0.006, buttonSize / 2 + 0.018, 48]} />
                    <meshStandardMaterial color="#16a34a" emissive="#16a34a" emissiveIntensity={0.22} side={THREE.DoubleSide} />
                  </mesh>
                ) : (
                  <lineSegments>
                    <edgesGeometry args={[new THREE.BoxGeometry(buttonSize + 0.035, buttonSize + 0.035, 0.001)]} />
                    <lineBasicMaterial color="#16a34a" linewidth={2} />
                  </lineSegments>
                )}
                <Text position={[0, -buttonSize * 0.72, 0.003]} fontSize={buttonSize * 0.16} color="#16a34a" anchorX="center" anchorY="middle" fontWeight="bold">
                  HAUPTHALTESTELLE
                </Text>
              </group>
            )}
          </group>
        );
      })}

      {L.bottomItems.map(it => {
        const wU = it.w * scale, hU = it.h * scale;
        const labelMap: Record<string, string> = { notHalt: "STOP", notrufAlarm: "☎", doorClose: "◀▶", doorOpen: "▶◀", laden: "L", luefter: "" };
        return (
          <group key={it.id} position={[tx(it.x, it.w), ty(it.y, it.h), frontZ]}>
            <SpecialButton3D id={it.id as SpecialId} w={wU} h={hU} label={labelMap[it.id] || ""} />
          </group>
        );
      })}

      {L.keySwitches.map((k, i) => (
        <group key={i} position={[tx(k.x), ty(k.y), frontZ]}>
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[k.r * scale, k.r * scale, 0.018, 32]} />
            <meshStandardMaterial color="#c8d0da" metalness={0.5} roughness={0.3} />
          </mesh>
          <mesh position={[0, 0, 0.01]}>
            <boxGeometry args={[0.006, 0.018, 0.004]} />
            <meshStandardMaterial color="#374151" metalness={0.4} roughness={0.4} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

export default function Preview3D({ config }: Preview3DProps) {
  return (
    <div className="w-full h-full bg-gradient-to-br from-background via-background to-card">
      <Canvas camera={{ position: [0, 0, 12], fov: 35 }} gl={{ antialias: true, alpha: true }}>
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
