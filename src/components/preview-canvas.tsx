import { useRef, useEffect, useState } from "react";
import { LiftConfig, getNotrufLochbild } from "@/lib/lift-config";
import { jsPDF } from "jspdf";

interface PreviewCanvasProps {
  config: LiftConfig;
  getSketchDataUrl?: () => string | null;
}

// Compute layout positions used by both 2D and 3D
export interface LayoutPositions {
  // All in mm, origin at top-left of front panel (x→right, y→down)
  buttonSizeMM: number;
  buttons: { x: number; y: number; idx: number }[]; // top-left
  bottomItems: { id: string; x: number; y: number; w: number; h: number }[]; // top-left
  keySwitches: { x: number; y: number; r: number }[]; // center
  display?: { x: number; y: number; w: number; h: number };
  notlicht: { x: number; y: number; size: number };
  lochbild?: { x: number; y: number; w: number; h: number };
}

export function computeLayout(config: LiftConfig): LayoutPositions {
  const W = config.width;
  const H = config.height;
  const buttonSizeMM = config.grossflaechenTaster ? 54 : 42;

  let yCursor = 24;

  let display: LayoutPositions["display"] | undefined;
  if (config.display !== "Kein Display") {
    const is7 = config.display === "Leo 7 Zoll";
    const dw = is7 ? 170 : 130;
    const dh = is7 ? 110 : 85;
    display = { x: (W - dw) / 2, y: yCursor, w: dw, h: dh };
    yCursor += dh + 20;
  } else {
    yCursor += 6;
  }

  const nsize = 96;
  const notlicht = { x: (W - nsize) / 2, y: yCursor, size: nsize };
  yCursor += nsize + 14;

  let lochbild: LayoutPositions["lochbild"] | undefined;
  const lb = getNotrufLochbild(config.notrufSystem);
  if (lb) {
    const lw = Math.min(W * 0.6, 140);
    const lh = 36;
    lochbild = { x: (W - lw) / 2, y: yCursor, w: lw, h: lh };
    yCursor += lh + 18;
  }

  // Buttons bottom-up
  const BOTTOM_ZONE = 240;
  const btnBottomEdgeFromTop = H - BOTTOM_ZONE;
  const buttons: LayoutPositions["buttons"] = [];
  const bw = buttonSizeMM, bh = buttonSizeMM;
  const n = config.buttons.length;
  if (n > 0) {
    const cols = config.twoRow && n > 1 ? 2 : 1;
    const rows = Math.ceil(n / cols);
    const gapAvail = (btnBottomEdgeFromTop - yCursor - rows * bh) / Math.max(rows - 1, 1);
    const gap = Math.max(6, Math.min(14, gapAvail));
    for (let idx = 0; idx < n; idx++) {
      const col = config.twoRow ? idx % 2 : 0;
      const rowFromBottom = config.twoRow ? Math.floor(idx / 2) : idx;
      const yCenter = btnBottomEdgeFromTop - bh / 2 - rowFromBottom * (bh + gap);
      let xLeft: number;
      if (config.twoRow && n > 1) {
        xLeft = col === 0 ? W / 2 - bw - 5 : W / 2 + 5;
      } else {
        xLeft = W / 2 - bw / 2;
      }
      buttons.push({ x: xLeft, y: yCenter - bh / 2, idx });
    }
  }

  // Bottom items (alarm row, door row, key row) — distances from BOTTOM (in mm)
  const fnSide = 40;
  const margin = 22;
  const usable = W - 2 * margin;
  const xSlot = (slot: number, total: number) => {
    if (total <= 1) return W / 2;
    return margin + (usable / (total + 1)) * (slot + 1);
  };

  const bottomItems: LayoutPositions["bottomItems"] = [];
  // alarm row: 200mm from bottom (center y)
  const alarmCyTop = H - 200;
  const alarmItems = [config.notHalt, config.notrufAlarm].filter(Boolean).length;
  let aSlot = 0;
  if (config.notHalt) {
    const cx = xSlot(aSlot++, alarmItems);
    bottomItems.push({ id: "notHalt", x: cx - fnSide / 2, y: alarmCyTop - fnSide / 2, w: fnSide, h: fnSide });
  }
  if (config.notrufAlarm) {
    const cx = xSlot(aSlot++, alarmItems);
    bottomItems.push({ id: "notrufAlarm", x: cx - fnSide / 2, y: alarmCyTop - fnSide / 2, w: fnSide, h: fnSide });
  }
  // door row: 138mm from bottom
  const doorCyTop = H - 138;
  const doorItems = [config.doorClose, config.doorOpen, config.ladenTaster, config.luefterTaster].filter(Boolean).length;
  let dSlot = 0;
  if (config.doorClose) bottomItems.push({ id: "doorClose", x: xSlot(dSlot++, doorItems) - fnSide / 2, y: doorCyTop - fnSide / 2, w: fnSide, h: fnSide });
  if (config.doorOpen)  bottomItems.push({ id: "doorOpen",  x: xSlot(dSlot++, doorItems) - fnSide / 2, y: doorCyTop - fnSide / 2, w: fnSide, h: fnSide });
  if (config.ladenTaster) bottomItems.push({ id: "laden",  x: xSlot(dSlot++, doorItems) - fnSide / 2, y: doorCyTop - fnSide / 2, w: fnSide, h: fnSide });
  if (config.luefterTaster) bottomItems.push({ id: "luefter", x: xSlot(dSlot++, doorItems) - fnSide / 2, y: doorCyTop - fnSide / 2, w: fnSide, h: fnSide });

  // Key switches: 58mm from bottom
  const keyCyTop = H - 58;
  const keySwitches: LayoutPositions["keySwitches"] = [];
  if (config.keySwitchCount > 0) {
    const kr = 14;
    const centers: number[] = [];
    if (config.keySwitchCount === 1) centers.push(W / 2);
    else if (config.keySwitchCount === 2) { centers.push(W / 2 - 28); centers.push(W / 2 + 28); }
    else { centers.push(W / 2 - 38); centers.push(W / 2); centers.push(W / 2 + 38); }
    centers.forEach(cx => keySwitches.push({ x: cx, y: keyCyTop, r: kr }));
  }

  return { buttonSizeMM, buttons, bottomItems, keySwitches, display, notlicht, lochbild };
}

// Fan icon drawing: modern fan with curved blades
function drawFan(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, color: string) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.fillStyle = color;
  ctx.strokeStyle = color;
  ctx.lineWidth = Math.max(1, r * 0.08);
  for (let i = 0; i < 3; i++) {
    ctx.rotate((Math.PI * 2) / 3);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(r * 0.7, -r * 0.15, r * 0.95, r * 0.25);
    ctx.quadraticCurveTo(r * 0.5, r * 0.25, 0, 0);
    ctx.fill();
  }
  ctx.restore();
  // Hub
  ctx.fillStyle = "#0c4a6e";
  ctx.beginPath();
  ctx.arc(cx, cy, r * 0.18, 0, Math.PI * 2);
  ctx.fill();
}

export default function PreviewCanvas({ config, getSketchDataUrl }: PreviewCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const observer = new ResizeObserver((entries) => {
      if (entries[0]) {
        const { width, height } = entries[0].contentRect;
        setSize({ width, height });
      }
    });
    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const canvasWidth = size.width;
    const canvasHeight = size.height;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = canvasWidth * dpr;
    canvas.height = canvasHeight * dpr;
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);
    if (canvasWidth === 0 || canvasHeight === 0) return;

    const W = config.width;
    const H = config.height;
    const usableW = canvasWidth - 110 - 280;
    const usableH = canvasHeight - 80 - 70;
    if (usableW <= 0 || usableH <= 0) return;

    const scale = Math.max(Math.min(usableH / H, usableW / W) * 0.92, 0.08);
    const Wpx = W * scale;
    const Hpx = H * scale;
    const cx0 = 110 + (canvasWidth - 110 - 280 - Wpx) / 2;
    const cy_mid = canvasHeight / 2 - 70 / 4;
    const top_y = cy_mid - Hpx / 2;
    const oy = cy_mid + Hpx / 2;
    const ox = cx0;
    const m = (mm: number) => mm * scale;

    // Panel body
    ctx.save();
    ctx.beginPath();
    ctx.roundRect(ox, top_y, Wpx, Hpx, m(3));
    ctx.clip();
    ctx.fillStyle = "#9aa3af";
    ctx.fillRect(ox, top_y, Wpx, Hpx);
    const stripes = ["#8f96a1", "#9aa2ad", "#a3aab5", "#959ca7"];
    for (let x = 0; x < Wpx; x += 3) {
      ctx.fillStyle = stripes[Math.floor(x / 3) % stripes.length];
      ctx.fillRect(ox + x, top_y, 3, Hpx);
    }
    ctx.restore();
    ctx.strokeStyle = "#1e293b";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(ox, top_y, Wpx, Hpx, m(3));
    ctx.stroke();

    // Hinterwandkasten dashed rectangle (15mm inset)
    if (config.hinterwandkasten) {
      ctx.save();
      ctx.strokeStyle = "#E66124";
      ctx.lineWidth = 1.5;
      ctx.setLineDash([m(4), m(3)]);
      const inset = m(15);
      ctx.strokeRect(ox + inset, top_y + inset, Wpx - 2 * inset, Hpx - 2 * inset);
      ctx.setLineDash([]);
      ctx.fillStyle = "#E66124";
      ctx.font = `${Math.max(8, m(8))}px sans-serif`;
      ctx.textAlign = "left";
      ctx.textBaseline = "top";
      ctx.fillText("Hinterwandkasten", ox + inset + 3, top_y + inset + 3);
      ctx.restore();
    }

    // Mounting holes
    const numPairs = config.befestigungspunkte / 2;
    if (numPairs > 0) {
      ctx.fillStyle = "#475569";
      ctx.strokeStyle = "#1e293b";
      ctx.lineWidth = 1;
      const verticalMargin = m(30);
      const availableHeight = Hpx - 2 * verticalMargin;
      const holeRadius = m(4);
      const holeMarginX = m(12);
      for (let i = 0; i < numPairs; i++) {
        const holeY = numPairs === 1 ? top_y + Hpx / 2 : top_y + verticalMargin + (availableHeight / (numPairs - 1)) * i;
        ctx.beginPath(); ctx.arc(ox + holeMarginX, holeY, holeRadius, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        ctx.beginPath(); ctx.arc(ox + Wpx - holeMarginX, holeY, holeRadius, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      }
    }

    // Side profile
    const px = ox + Wpx + 70;
    const depthPx = m(config.depth);
    const plateThickness = m(2);
    ctx.save();
    ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.font = "bold 11px sans-serif";
    ctx.fillStyle = "#94a3b8";
    ctx.fillText("Seite", px + (config.bauweise === "Flachmaterial" ? 4 : depthPx / 2), top_y - 14);
    if (config.bauweise === "Flachmaterial") {
      const fw = Math.max(4, plateThickness);
      ctx.fillStyle = "#b0b8c8"; ctx.strokeStyle = "#475569"; ctx.lineWidth = 1;
      ctx.fillRect(px - fw / 2, top_y, fw, Hpx); ctx.strokeRect(px - fw / 2, top_y, fw, Hpx);
    } else if (config.bauweise === "Abgekantet") {
      ctx.strokeStyle = "#475569"; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(px, top_y); ctx.lineTo(px, oy); ctx.stroke();
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(px, top_y); ctx.lineTo(px + depthPx, top_y); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(px, oy); ctx.lineTo(px + depthPx, oy); ctx.stroke();
      ctx.setLineDash([5, 4]); ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(px + depthPx, top_y); ctx.lineTo(px + depthPx, oy); ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = "#94a3b8"; ctx.font = "10px sans-serif"; ctx.textAlign = "center";
      ctx.fillText(`T = ${config.depth} mm`, px + depthPx / 2, oy + 18);
    } else {
      ctx.fillStyle = "rgba(100,116,139,0.12)"; ctx.fillRect(px, top_y, depthPx, Hpx);
      ctx.strokeStyle = "#475569"; ctx.lineWidth = 2; ctx.strokeRect(px, top_y, depthPx, Hpx);
      ctx.fillStyle = "#94a3b8"; ctx.font = "10px sans-serif"; ctx.textAlign = "center";
      ctx.fillText(`T = ${config.depth} mm`, px + depthPx / 2, oy + 18);
    }
    ctx.restore();

    // Dimension arrows
    ctx.save();
    ctx.strokeStyle = "#E66124"; ctx.fillStyle = "#E66124"; ctx.lineWidth = 1.5;
    ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.font = "bold 11px sans-serif";
    const arrowX = ox - 40;
    ctx.beginPath(); ctx.moveTo(arrowX, oy); ctx.lineTo(arrowX, top_y); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(arrowX, top_y); ctx.lineTo(arrowX - 5, top_y + 10); ctx.lineTo(arrowX + 5, top_y + 10); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(arrowX, oy); ctx.lineTo(arrowX - 5, oy - 10); ctx.lineTo(arrowX + 5, oy - 10); ctx.closePath(); ctx.fill();
    ctx.save(); ctx.translate(arrowX - 14, cy_mid); ctx.rotate(-Math.PI / 2); ctx.fillText(`${Math.round(H)} mm`, 0, 0); ctx.restore();
    const arrowY = oy + 28;
    ctx.beginPath(); ctx.moveTo(ox, arrowY); ctx.lineTo(ox + Wpx, arrowY); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(ox, arrowY); ctx.lineTo(ox + 10, arrowY - 5); ctx.lineTo(ox + 10, arrowY + 5); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(ox + Wpx, arrowY); ctx.lineTo(ox + Wpx - 10, arrowY - 5); ctx.lineTo(ox + Wpx - 10, arrowY + 5); ctx.closePath(); ctx.fill();
    ctx.fillText(`${Math.round(W)} mm`, ox + Wpx / 2, arrowY + 14);
    ctx.restore();

    // Layout (in mm) → convert to canvas
    const L = computeLayout(config);
    const toCanvas = (x: number, y: number) => ({ X: ox + m(x), Y: top_y + m(y) });

    // Display
    if (L.display) {
      const { X, Y } = toCanvas(L.display.x, L.display.y);
      const dw = m(L.display.w), dh = m(L.display.h);
      ctx.fillStyle = "#000000";
      ctx.beginPath(); ctx.roundRect(X, Y, dw, dh, m(4)); ctx.fill();
      ctx.fillStyle = "#38bdf8";
      ctx.font = `bold ${m(L.display.h * 0.55)}px sans-serif`;
      ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.fillText(config.display === "Leo 7 Zoll" ? "7" : "5", X + dw / 2, Y + dh / 2);
    }

    // Notlichtschild
    {
      const { X, Y } = toCanvas(L.notlicht.x, L.notlicht.y);
      const nsize = m(L.notlicht.size);
      ctx.fillStyle = "#f8fafc"; ctx.strokeStyle = "#1e293b"; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.rect(X, Y, nsize, nsize); ctx.fill(); ctx.stroke();
      ctx.strokeStyle = "#94a3b8"; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.rect(X + m(3), Y + m(3), nsize - m(6), nsize - m(6)); ctx.stroke();
      const ncx = X + nsize / 2;
      ctx.textAlign = "center"; ctx.textBaseline = "top"; ctx.fillStyle = "#111827";
      ctx.font = `bold ${Math.max(5, m(9))}px sans-serif`;
      ctx.fillText(config.notlicht.tragkraft || "—", ncx, Y + m(8));
      ctx.font = `${Math.max(4, m(6))}px sans-serif`;
      const bj = config.notlicht.baujahr ? `Baujahr: ${config.notlicht.baujahr}` : "";
      const fn_ = config.notlicht.fabrNr ? `Fabr.Nr. ${config.notlicht.fabrNr}` : "";
      const combined = bj && fn_ ? `${bj}  ${fn_}` : bj || fn_;
      if (combined) ctx.fillText(combined, ncx, Y + m(22));
      if (config.notlicht.umbaujahr) ctx.fillText(`Umbaujahr: ${config.notlicht.umbaujahr}`, ncx, Y + m(32));
      if (config.notlicht.hersteller) ctx.fillText(`Hersteller: ${config.notlicht.hersteller}`, ncx, Y + m(42));
      ctx.fillStyle = "#dc2626"; ctx.font = `bold ${Math.max(4, m(8))}px sans-serif`;
      ctx.fillText("Aufzug im Brandfall", ncx, Y + m(65));
      ctx.fillText("nicht benutzen", ncx, Y + m(77));
    }

    // Lochbild (per system)
    const lb = getNotrufLochbild(config.notrufSystem);
    if (lb && L.lochbild) {
      const { X, Y } = toCanvas(L.lochbild.x, L.lochbild.y);
      const lw = m(L.lochbild.w), lh = m(L.lochbild.h);
      ctx.strokeStyle = "#475569"; ctx.lineWidth = 1; ctx.setLineDash([4, 4]);
      ctx.strokeRect(X, Y, lw, lh); ctx.setLineDash([]);
      ctx.fillStyle = "#334155"; ctx.font = `bold ${Math.max(7, m(7))}px sans-serif`;
      ctx.textAlign = "center"; ctx.textBaseline = "top";
      ctx.fillText(config.notrufSystem, X + lw / 2, Y + m(3));
      // Draw holes scaled to fit
      const sx = lw / lb.width, sy = lh / lb.height;
      lb.holes.forEach(h => {
        const hx = X + h.x * sx, hy = Y + h.y * sy;
        ctx.fillStyle = "#1e293b";
        ctx.beginPath(); ctx.arc(hx, hy, Math.max(1.5, h.r * sx), 0, Math.PI * 2); ctx.fill();
        if (h.label) {
          ctx.fillStyle = "#f8fafc";
          ctx.font = `bold ${Math.max(4, m(4))}px sans-serif`;
          ctx.textAlign = "center"; ctx.textBaseline = "middle";
          ctx.fillText(h.label, hx, hy);
        }
      });
    }

    // Buttons
    const isRound = config.buttonShape === "Rund";
    L.buttons.forEach((b) => {
      const btn = config.buttons[b.idx];
      const { X, Y } = toCanvas(b.x, b.y);
      const bw = m(L.buttonSizeMM), bh = m(L.buttonSizeMM);
      const bxCenter = X + bw / 2, byCenter = Y + bh / 2, r = bw / 2;
      ctx.fillStyle = "#aeb6bf"; ctx.strokeStyle = "#1f2937"; ctx.lineWidth = 1;
      ctx.beginPath();
      if (isRound) ctx.arc(bxCenter, byCenter, r, 0, Math.PI * 2);
      else ctx.roundRect(X, Y, bw, bh, m(4));
      ctx.fill(); ctx.stroke();
      const innerR = r - m(3);
      ctx.fillStyle = "#e8eaed"; ctx.strokeStyle = "#64748b"; ctx.lineWidth = 0.5;
      ctx.beginPath();
      if (isRound) ctx.arc(bxCenter, byCenter, innerR, 0, Math.PI * 2);
      else ctx.roundRect(X + m(3), Y + m(3), bw - m(6), bh - m(6) - m(7), m(2));
      ctx.fill(); ctx.stroke();
      let qColor = "#2563eb";
      if (config.quittierungsfarbe === "Rot") qColor = "#dc2626";
      if (config.quittierungsfarbe === "Grün") qColor = "#16a34a";
      ctx.fillStyle = qColor;
      if (isRound) { ctx.beginPath(); ctx.arc(bxCenter, byCenter + innerR * 0.55, innerR * 0.35, 0, Math.PI * 2); ctx.fill(); }
      else { ctx.beginPath(); ctx.roundRect(X + m(3), Y + bh - m(11), bw - m(6), m(8), m(1.5)); ctx.fill(); }
      ctx.fillStyle = "#1e293b";
      ctx.font = `bold ${Math.max(7, m(13))}px sans-serif`;
      ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.fillText(btn.engraving, bxCenter, isRound ? byCenter - innerR * 0.15 : Y + (bh - m(9)) / 2);
      if (btn.id === config.mainFloorId) {
        ctx.strokeStyle = "#16a34a"; ctx.lineWidth = Math.max(1.5, m(2));
        ctx.beginPath();
        if (isRound) ctx.arc(bxCenter, byCenter, r + m(4), 0, Math.PI * 2);
        else ctx.roundRect(X - m(4), Y - m(4), bw + m(8), bh + m(8), m(7));
        ctx.stroke();
      }
      if (btn.hasKey) {
        const kx = X - m(16);
        ctx.fillStyle = "#d1d5db"; ctx.strokeStyle = "#374151"; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.arc(kx, byCenter, m(9), 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        ctx.fillStyle = "#374151"; ctx.fillRect(kx - m(2), byCenter - m(4), m(4), m(8));
      }
      if (btn.hasLabel) {
        const lw2 = m(63), lh2 = m(33);
        const lx2 = config.twoRow && (b.idx % 2 === 0) ? X - lw2 - m(8) : X + bw + m(8);
        const ly2 = byCenter - lh2 / 2;
        ctx.fillStyle = "#f8fafc"; ctx.strokeStyle = "#94a3b8"; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.rect(lx2, ly2, lw2, lh2); ctx.fill(); ctx.stroke();
        if (btn.labelText) {
          ctx.fillStyle = "#1e293b"; ctx.font = `${Math.max(6, m(8))}px sans-serif`;
          ctx.textAlign = "center"; ctx.textBaseline = "middle";
          ctx.fillText(btn.labelText, lx2 + lw2 / 2, byCenter);
        }
      }
    });

    // Bottom items
    L.bottomItems.forEach(item => {
      const { X, Y } = toCanvas(item.x, item.y);
      const w = m(item.w), h = m(item.h);
      const cx = X + w / 2, cy = Y + h / 2;
      const half = w / 2;
      if (item.id === "notHalt") {
        ctx.fillStyle = "#dc2626"; ctx.strokeStyle = "#7f1d1d"; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(cx, cy, half, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        ctx.strokeStyle = "#f8fafc"; ctx.lineWidth = Math.max(2, m(3));
        ctx.beginPath(); ctx.moveTo(cx - half * 0.4, cy); ctx.lineTo(cx + half * 0.4, cy); ctx.stroke();
      } else if (item.id === "notrufAlarm") {
        ctx.fillStyle = "#eab308"; ctx.strokeStyle = "#a16207"; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.roundRect(X, Y, w, h, m(4)); ctx.fill(); ctx.stroke();
        ctx.strokeStyle = "#422006"; ctx.lineWidth = Math.max(2, m(2.5));
        ctx.beginPath(); ctx.arc(cx, cy - half * 0.1, half * 0.45, Math.PI * 0.15, Math.PI * 0.85); ctx.stroke();
        ctx.fillStyle = "#422006"; ctx.fillRect(cx - m(3), cy + half * 0.1, m(6), m(6));
      } else if (item.id === "doorClose") {
        ctx.fillStyle = "#15803d"; ctx.strokeStyle = "#14532d"; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.roundRect(X, Y, w, h, m(4)); ctx.fill(); ctx.stroke();
        ctx.strokeStyle = "#ecfdf5"; ctx.lineWidth = Math.max(1, m(2));
        const dg = half * 0.1, dw2 = half * 0.28;
        ctx.strokeRect(cx - dg - dw2, cy - half * 0.5, dw2, half);
        ctx.strokeRect(cx + dg, cy - half * 0.5, dw2, half);
      } else if (item.id === "doorOpen") {
        ctx.fillStyle = "#2563eb"; ctx.strokeStyle = "#1e3a8a"; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.roundRect(X, Y, w, h, m(4)); ctx.fill(); ctx.stroke();
        ctx.strokeStyle = "#eff6ff"; ctx.lineWidth = Math.max(1, m(2));
        const dg2 = half * 0.2, dw3 = half * 0.22;
        ctx.strokeRect(cx - dg2 - dw3, cy - half * 0.5, dw3, half);
        ctx.strokeRect(cx + dg2, cy - half * 0.5, dw3, half);
      } else if (item.id === "laden") {
        ctx.fillStyle = "#7c3aed"; ctx.strokeStyle = "#5b21b6"; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.roundRect(X, Y, w, h, m(4)); ctx.fill(); ctx.stroke();
        ctx.strokeStyle = "#f5f3ff"; ctx.lineWidth = Math.max(2, m(2.5));
        ctx.beginPath();
        ctx.moveTo(cx - half * 0.3, cy - half * 0.4);
        ctx.lineTo(cx - half * 0.3, cy + half * 0.4);
        ctx.lineTo(cx + half * 0.3, cy + half * 0.4);
        ctx.stroke();
      } else if (item.id === "luefter") {
        ctx.fillStyle = "#0891b2"; ctx.strokeStyle = "#155e75"; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.roundRect(X, Y, w, h, m(4)); ctx.fill(); ctx.stroke();
        drawFan(ctx, cx, cy, half * 0.7, "#ecfeff");
      }
    });

    // Key switches
    L.keySwitches.forEach((k, idx) => {
      const { X, Y } = toCanvas(k.x, k.y);
      const kr = m(k.r);
      ctx.fillStyle = "#c8d0da"; ctx.strokeStyle = "#374151"; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.arc(X, Y, kr, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.fillStyle = "#4b5563";
      ctx.beginPath(); ctx.arc(X, Y, kr * 0.5, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "#111827";
      ctx.fillRect(X - m(1.5), Y - m(1), m(3), kr * 0.6);
      const keyConfig = config.keySwitches[idx];
      if (keyConfig?.funktion) {
        ctx.fillStyle = "#64748b";
        ctx.font = `${Math.max(6, m(6))}px sans-serif`;
        ctx.textAlign = "center"; ctx.textBaseline = "top";
        ctx.fillText(keyConfig.funktion, X, Y + kr + m(3));
      }
    });

  }, [config, size]);

  // === DXF Export ===
  const handleExportDXF = () => {
    try {
      const W = config.width;
      const H = config.height;
      const L = computeLayout(config);
      // In DXF we put origin at bottom-left; convert (x,y from top-left in mm) → (x, H - y)
      const ty = (y: number) => H - y;
      const lines: string[] = [];
      const e = (code: number | string, value: string | number) => {
        lines.push(String(code));
        lines.push(String(value));
      };

      // Header
      e(0, "SECTION"); e(2, "HEADER");
      e(9, "$ACADVER"); e(1, "AC1009");
      e(9, "$INSBASE"); e(10, 0); e(20, 0); e(30, 0);
      e(9, "$EXTMIN"); e(10, 0); e(20, 0); e(30, 0);
      e(9, "$EXTMAX"); e(10, W); e(20, H); e(30, 0);
      e(0, "ENDSEC");

      // Tables (LAYER)
      e(0, "SECTION"); e(2, "TABLES");
      e(0, "TABLE"); e(2, "LAYER"); e(70, 4);
      const addLayer = (name: string, color: number) => {
        e(0, "LAYER"); e(2, name); e(70, 0); e(62, color); e(6, "CONTINUOUS");
      };
      addLayer("0", 7);
      addLayer("PANEL", 7);
      addLayer("HOLES", 1);
      addLayer("HINTERWAND", 6);
      addLayer("BUTTONS", 3);
      addLayer("TEXT", 2);
      e(0, "ENDTAB");
      e(0, "ENDSEC");

      // Blocks
      e(0, "SECTION"); e(2, "BLOCKS"); e(0, "ENDSEC");

      // Entities
      e(0, "SECTION"); e(2, "ENTITIES");

      const polyline = (layer: string, pts: [number, number][], closed = true) => {
        e(0, "POLYLINE"); e(8, layer); e(66, 1); e(70, closed ? 1 : 0);
        e(10, 0); e(20, 0); e(30, 0);
        for (const [x, y] of pts) {
          e(0, "VERTEX"); e(8, layer); e(10, x); e(20, y); e(30, 0);
        }
        e(0, "SEQEND");
      };
      const circle = (layer: string, cx: number, cy: number, r: number) => {
        e(0, "CIRCLE"); e(8, layer); e(10, cx); e(20, cy); e(30, 0); e(40, r);
      };
      const dashedRect = (layer: string, x: number, y: number, w: number, h: number) => {
        // Approximate dashed look as multiple short LINE entities
        const dash = 6, gap = 3;
        const drawDashed = (x1: number, y1: number, x2: number, y2: number) => {
          const dx = x2 - x1, dy = y2 - y1;
          const len = Math.hypot(dx, dy);
          const ux = dx / len, uy = dy / len;
          let d = 0;
          while (d < len) {
            const end = Math.min(d + dash, len);
            e(0, "LINE"); e(8, layer);
            e(10, x1 + ux * d); e(20, y1 + uy * d); e(30, 0);
            e(11, x1 + ux * end); e(21, y1 + uy * end); e(31, 0);
            d = end + gap;
          }
        };
        drawDashed(x, y, x + w, y);
        drawDashed(x + w, y, x + w, y + h);
        drawDashed(x + w, y + h, x, y + h);
        drawDashed(x, y + h, x, y);
      };

      // Panel outline
      polyline("PANEL", [[0, 0], [W, 0], [W, H], [0, H]]);

      // Hinterwandkasten
      if (config.hinterwandkasten) {
        dashedRect("HINTERWAND", 15, 15, W - 30, H - 30);
      }

      // Mounting holes
      const numPairs = config.befestigungspunkte / 2;
      if (numPairs > 0) {
        const verticalMargin = 30;
        const availableHeight = H - 2 * verticalMargin;
        const r = 4, marginX = 12;
        for (let i = 0; i < numPairs; i++) {
          const yTop = numPairs === 1 ? H / 2 : verticalMargin + (availableHeight / (numPairs - 1)) * i;
          const yDXF = ty(yTop);
          circle("HOLES", marginX, yDXF, r);
          circle("HOLES", W - marginX, yDXF, r);
        }
      }

      // Buttons
      L.buttons.forEach(b => {
        const s = L.buttonSizeMM;
        const x1 = b.x, y1 = ty(b.y + s), x2 = b.x + s, y2 = ty(b.y);
        if (config.buttonShape === "Rund") {
          circle("BUTTONS", b.x + s / 2, ty(b.y + s / 2), s / 2);
        } else {
          polyline("BUTTONS", [[x1, y1], [x2, y1], [x2, y2], [x1, y2]]);
        }
      });

      // Bottom items
      L.bottomItems.forEach(it => {
        const x1 = it.x, y1 = ty(it.y + it.h), x2 = it.x + it.w, y2 = ty(it.y);
        if (it.id === "notHalt") {
          circle("BUTTONS", it.x + it.w / 2, ty(it.y + it.h / 2), it.w / 2);
        } else {
          polyline("BUTTONS", [[x1, y1], [x2, y1], [x2, y2], [x1, y2]]);
        }
      });

      // Key switches
      L.keySwitches.forEach(k => circle("BUTTONS", k.x, ty(k.y), k.r));

      // Display rect
      if (L.display) {
        const d = L.display;
        polyline("PANEL", [[d.x, ty(d.y + d.h)], [d.x + d.w, ty(d.y + d.h)], [d.x + d.w, ty(d.y)], [d.x, ty(d.y)]]);
      }

      // Notlichtschild rect
      {
        const n = L.notlicht;
        polyline("PANEL", [[n.x, ty(n.y + n.size)], [n.x + n.size, ty(n.y + n.size)], [n.x + n.size, ty(n.y)], [n.x, ty(n.y)]]);
      }

      // Lochbild holes
      const lb = getNotrufLochbild(config.notrufSystem);
      if (lb && L.lochbild) {
        const sx = L.lochbild.w / lb.width, sy = L.lochbild.h / lb.height;
        const s = Math.min(sx, sy);
        lb.holes.forEach(h => {
          const cx = L.lochbild!.x + h.x * sx;
          const cy = ty(L.lochbild!.y + h.y * sy);
          circle("HOLES", cx, cy, h.r * s);
        });
      }

      e(0, "ENDSEC");
      e(0, "EOF");

      const dxf = lines.join("\r\n") + "\r\n";
      const blob = new Blob([dxf], { type: "application/dxf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = "lift-tableau.dxf";
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("DXF export error:", err);
    }
  };

  const handleExportPDF = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    try {
      const pdf = new jsPDF("p", "pt", "a4");
      const pdfW = pdf.internal.pageSize.getWidth();
      const pdfH = pdf.internal.pageSize.getHeight();
      const canvasImg = canvas.toDataURL("image/png");
      const aspect = (canvas.clientWidth || canvas.width) / (canvas.clientHeight || canvas.height);
      const boxH = Math.min(pdfH * 0.5, 380);
      const boxW = Math.min(pdfW - 60, boxH * aspect);
      const actualH = boxW / aspect;
      pdf.addImage(canvasImg, "PNG", (pdfW - boxW) / 2, 20, boxW, actualH);
      let ty = 20 + actualH + 22;
      pdf.setFontSize(14);
      pdf.text("Lift-Designer Pro — Spezifikation", 40, ty); ty += 18;
      pdf.setFontSize(10);
      const lines = [
        `Datum: ${new Date().toLocaleDateString("de-DE")}`,
        `Bauweise: ${config.bauweise}`,
        `Maße: ${config.height} x ${config.width} x ${config.depth} mm (H x B x T)`,
        `Hinterwandkasten: ${config.hinterwandkasten ? "Ja" : "Nein"}`,
        `Display: ${config.display}`,
        `Notruf-Lochbild: ${config.notrufSystem}`,
        `Taster: ${config.buttonCount}${config.twoRow ? " (zweireihig)" : ""}`,
        `Gravuren: ${config.buttons.map(b => b.engraving).join(", ")}`,
        `Quittierung: ${config.quittierungsfarbe}`,
        `Sondertaster: ${[
          config.notHalt && "Not-Halt",
          config.notrufAlarm && "Alarm",
          config.doorOpen && "Tür auf",
          config.doorClose && "Tür zu",
          config.ladenTaster && "Laden",
          config.luefterTaster && "Lüfter",
        ].filter(Boolean).join(", ") || "—"}`,
        `Schlüsselschalter: ${config.keySwitchCount}`,
        `Kommentare: ${config.comments || "(keine)"}`,
      ];
      lines.forEach(line => {
        if (ty > pdfH - 80) { pdf.addPage(); ty = 40; }
        pdf.text(line, 40, ty); ty += 14;
      });
      const sketchUrl = getSketchDataUrl?.();
      if (sketchUrl) {
        if (ty > pdfH - 180) { pdf.addPage(); ty = 40; }
        pdf.text("Skizze:", 40, ty); ty += 10;
        const skW = Math.min(pdfW - 80, 360), skH = skW * 0.4;
        pdf.addImage(sketchUrl, "PNG", 40, ty, skW, skH);
      }
      pdf.save("lift-spezifikation.pdf");
    } catch (err) {
      console.error("PDF export error:", err);
    }
  };

  return (
    <div ref={containerRef} className="relative w-full h-full bg-gradient-to-br from-background via-background to-card grid-pattern">
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
      <div className="absolute bottom-4 right-4 flex gap-2">
        <button
          onClick={handleExportDXF}
          className="px-4 py-2 bg-secondary text-secondary-foreground rounded-lg font-medium text-sm hover:bg-secondary/80 transition-colors shadow-lg border border-border"
        >
          DXF Export
        </button>
        <button
          onClick={handleExportPDF}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium text-sm hover:bg-primary/90 transition-colors shadow-lg"
        >
          PDF Export
        </button>
      </div>
    </div>
  );
}
