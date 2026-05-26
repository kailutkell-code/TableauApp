import { createFileRoute } from "@tanstack/react-router";
import React, { useState, useRef, Suspense, lazy } from "react";
import { LiftConfig, defaultConfig } from "@/lib/lift-config";
import ConfigSidebar from "@/components/config-sidebar";
import InfoPanel from "@/components/info-panel";
import PreviewCanvas from "@/components/preview-canvas";
import SketchCanvas, { SketchCanvasHandle } from "@/components/sketch-canvas";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RotateCcw, Box, Layers } from "lucide-react";
import { Toaster } from "@/components/ui/sonner";

const Preview3D = lazy(() => import("@/components/preview-3d"));

export const Route = createFileRoute("/")({
  component: DesignerPage,
  ssr: false,
});

function DesignerPage() {
  const [config, setConfig] = useState<LiftConfig>(defaultConfig);
  const [viewMode, setViewMode] = useState<"3d" | "2d">("2d");
  const sketchRef = useRef<SketchCanvasHandle>(null);
  const getSketchDataUrl = () => sketchRef.current?.getDataUrl() ?? null;

  return (
    <div className="dark flex h-screen w-full overflow-hidden bg-background">
      <ConfigSidebar config={config} onChange={setConfig} />
      <main className="flex-1 min-w-0 flex flex-col relative">
        <div className="h-14 border-b border-border bg-card/50 backdrop-blur-sm flex items-center justify-between px-4">
          <div className="flex items-center gap-4">
            <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as "3d" | "2d")}>
              <TabsList className="h-9">
                <TabsTrigger value="2d" className="gap-2 px-3"><Layers className="w-4 h-4" /><span className="hidden sm:inline">2D-Ansicht</span></TabsTrigger>
                <TabsTrigger value="3d" className="gap-2 px-3"><Box className="w-4 h-4" /><span className="hidden sm:inline">3D-Ansicht</span></TabsTrigger>
              </TabsList>
            </Tabs>
            <Badge variant="outline" className="hidden md:flex gap-1.5 text-xs">
              <span className="w-2 h-2 bg-success rounded-full animate-pulse" />Live-Vorschau
            </Badge>
          </div>
          <Button variant="ghost" size="sm" onClick={() => setConfig(defaultConfig)} className="gap-2">
            <RotateCcw className="w-4 h-4" /><span className="hidden sm:inline">Zurücksetzen</span>
          </Button>
        </div>
        <div className="flex-1 relative">
          {viewMode === "3d" ? (
            <Suspense fallback={<div className="w-full h-full flex items-center justify-center"><div className="w-12 h-12 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>}>
              <Preview3D config={config} />
            </Suspense>
          ) : (
            <PreviewCanvas config={config} getSketchDataUrl={getSketchDataUrl} />
          )}
        </div>
      </main>
      <aside className="w-80 bg-sidebar border-l border-sidebar-border flex flex-col h-screen overflow-hidden">
        <SketchCanvas ref={sketchRef} />
        <div className="flex-1 overflow-auto">
          <InfoPanel config={config} onChange={setConfig} />
        </div>
      </aside>
      <Toaster richColors position="top-right" />
    </div>
  );
}
