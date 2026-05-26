import React from "react";
import { LiftConfig } from "@/lib/lift-config";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { FileText, MessageSquare, Ruler, Cpu, Settings, AlertTriangle } from "lucide-react";

interface Props {
  config: LiftConfig;
  onChange: React.Dispatch<React.SetStateAction<LiftConfig>>;
}

export default function InfoPanel({ config, onChange }: Props) {
  return (
    <div className="flex-1 flex flex-col bg-sidebar">
      <div className="px-5 py-4 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
            <FileText className="w-4 h-4 text-primary" />
          </div>
          <div>
            <h2 className="font-semibold text-sidebar-foreground tracking-tight">Spezifikation</h2>
            <p className="text-xs text-muted-foreground">Zusammenfassung</p>
          </div>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-5 pb-8">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Ruler className="w-4 h-4 text-muted-foreground" />
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Abmessungen</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="p-3 bg-card/50 rounded-lg border border-border text-center">
                <div className="text-lg font-semibold text-foreground">{config.height}</div>
                <div className="text-[10px] text-muted-foreground uppercase">Höhe mm</div>
              </div>
              <div className="p-3 bg-card/50 rounded-lg border border-border text-center">
                <div className="text-lg font-semibold text-foreground">{config.width}</div>
                <div className="text-[10px] text-muted-foreground uppercase">Breite mm</div>
              </div>
              <div className="p-3 bg-card/50 rounded-lg border border-border text-center">
                <div className="text-lg font-semibold text-foreground">{config.depth}</div>
                <div className="text-[10px] text-muted-foreground uppercase">Tiefe mm</div>
              </div>
            </div>
            <div className="flex items-center justify-between p-2 bg-secondary/30 rounded-md">
              <span className="text-xs text-muted-foreground">Bauweise</span>
              <Badge variant="secondary" className="text-xs">{config.bauweise}</Badge>
            </div>
            {config.hinterwandkasten && (
              <div className="flex items-center justify-between p-2 bg-secondary/30 rounded-md">
                <span className="text-xs text-muted-foreground">Hinterwandkasten</span>
                <Badge variant="outline" className="text-xs">Aktiv</Badge>
              </div>
            )}
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Cpu className="w-4 h-4 text-muted-foreground" />
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Taster</span>
            </div>
            <div className="p-3 bg-card/50 rounded-lg border border-border space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Anzahl</span>
                <span className="text-sm font-medium">{config.buttonCount}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Form</span>
                <span className="text-sm font-medium">{config.buttonShape}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Quittierung</span>
                <span className="text-sm font-medium">{config.quittierungsfarbe}</span>
              </div>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {config.buttons.map((btn) => (
                <Badge
                  key={btn.id}
                  variant={btn.id === config.mainFloorId ? "default" : "outline"}
                  className="text-xs"
                >
                  {btn.engraving}{btn.hasKey && " (S)"}
                </Badge>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Settings className="w-4 h-4 text-muted-foreground" />
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Komponenten</span>
            </div>
            <div className="p-3 bg-card/50 rounded-lg border border-border space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Display</span>
                <Badge variant="secondary" className="text-xs">{config.display}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Notruf-Lochbild</span>
                <Badge variant="secondary" className="text-xs">{config.notrufSystem}</Badge>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-warning" />
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Notlichtschild</span>
            </div>
            <div className="p-3 bg-card/50 rounded-lg border border-border space-y-1.5 text-xs">
              {config.notlicht.tragkraft && (<div className="flex justify-between"><span className="text-muted-foreground">Tragkraft</span><span className="font-medium">{config.notlicht.tragkraft}</span></div>)}
              {config.notlicht.baujahr && (<div className="flex justify-between"><span className="text-muted-foreground">Baujahr</span><span className="font-medium">{config.notlicht.baujahr}</span></div>)}
              {config.notlicht.fabrNr && (<div className="flex justify-between"><span className="text-muted-foreground">Fabr.-Nr.</span><span className="font-medium">{config.notlicht.fabrNr}</span></div>)}
              {config.notlicht.hersteller && (<div className="flex justify-between"><span className="text-muted-foreground">Hersteller</span><span className="font-medium">{config.notlicht.hersteller}</span></div>)}
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-muted-foreground" />
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Kommentare</span>
            </div>
            <Textarea
              className="min-h-[100px] bg-card/50 border-border text-sm resize-none"
              placeholder="Besondere Hinweise für die Fertigung..."
              value={config.comments}
              onChange={e => onChange(prev => ({ ...prev, comments: e.target.value }))}
            />
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}
