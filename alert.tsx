"use client";

import React, { useRef, useState, useEffect, forwardRef, useImperativeHandle } from "react";
import { Button } from "@/components/ui/button";

export interface SketchCanvasHandle {
  getDataUrl: () => string | null;
}

const SketchCanvas = forwardRef<SketchCanvasHandle>(function SketchCanvas(_, ref) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState("#000000");
  const [lineWidth, setLineWidth] = useState(2);

  const colors = ["#000000", "#16a34a", "#eab308", "#dc2626", "#2563eb", "#E66124"];
  const widths = [2, 5, 9];

  useImperativeHandle(ref, () => ({
    getDataUrl: () => canvasRef.current?.toDataURL("image/png") ?? null,
  }));

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }, []);

  const getPos = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    let clientX = 0, clientY = 0;
    if ("touches" in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = (e as React.MouseEvent).clientX;
      clientY = (e as React.MouseEvent).clientY;
    }
    return { x: clientX - rect.left, y: clientY - rect.top };
  };

  const start = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDrawing(true);
    const { x, y } = getPos(e);
    const ctx = canvasRef.current?.getContext("2d");
    if (ctx) { ctx.beginPath(); ctx.moveTo(x, y); }
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    const { x, y } = getPos(e);
    const ctx = canvasRef.current?.getContext("2d");
    if (ctx) {
      ctx.strokeStyle = color;
      ctx.lineWidth = lineWidth;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.lineTo(x, y);
      ctx.stroke();
    }
  };

  const stop = () => setIsDrawing(false);

  const clear = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (canvas && ctx) {
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
  };

  return (
    <div className="border-b border-sidebar-border bg-card/50">
      <div className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-sidebar-foreground">Skizze</span>
          <Button variant="ghost" size="sm" className="h-7 text-xs hover:bg-destructive/10 hover:text-destructive" onClick={clear}>
            Loeschen
          </Button>
        </div>
        <canvas
          ref={canvasRef}
          width={300}
          height={160}
          className="w-full h-[160px] border border-border rounded-lg cursor-crosshair touch-none bg-white"
          onMouseDown={start}
          onMouseMove={draw}
          onMouseUp={stop}
          onMouseOut={stop}
          onTouchStart={start}
          onTouchMove={draw}
          onTouchEnd={stop}
        />
        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            {colors.map(c => (
              <button
                key={c}
                className={`w-6 h-6 rounded-full transition-all ${color === c ? "ring-2 ring-offset-2 ring-primary ring-offset-card scale-110" : "hover:scale-105"}`}
                style={{ backgroundColor: c }}
                onClick={() => setColor(c)}
              />
            ))}
          </div>
          <div className="flex gap-1 bg-secondary rounded-lg p-1">
            {widths.map(w => (
              <button
                key={w}
                className={`px-2 py-1 text-xs rounded-md transition-colors ${lineWidth === w ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground hover:bg-secondary"}`}
                onClick={() => setLineWidth(w)}
              >
                {w}px
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
});

export default SketchCanvas;
