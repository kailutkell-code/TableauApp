import React from "react";
import { LiftConfig, Bauweise, Quittierungsfarbe, DisplayType, NotrufSystem } from "@/lib/lift-config";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, Settings2, Cpu, LayoutGrid, CircleDot } from "lucide-react";
import { toast } from "sonner";

interface Props {
  config: LiftConfig;
  onChange: React.Dispatch<React.SetStateAction<LiftConfig>>;
}

const checkboxClass =
  "size-5 rounded-[4px] border-2 border-sidebar-foreground/40 bg-background data-[state=checked]:bg-primary data-[state=checked]:border-primary data-[state=checked]:text-primary-foreground shadow-sm";

export default function ConfigSidebar({ config, onChange }: Props) {
  const [openSections, setOpenSections] = React.useState({
    bauweise: true,
    taster: true,
    komponenten: true,
  });

  const toggleSection = (section: keyof typeof openSections) => {
    setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const update = (key: keyof LiftConfig, value: unknown) => {
    onChange(prev => {
      const next: LiftConfig = { ...prev, [key]: value } as LiftConfig;

      if (key === "bauweise") {
        if (value === "Flachmaterial") next.depth = 2;
        if (value === "Aufputz") {
          next.hinterwandkasten = false;
          if (next.depth < 30) {
            next.depth = 30;
            toast.info("Mindesttiefe bei Aufputz ist 30 mm. Tiefe wurde automatisch angepasst.");
          }
        }
      }

      if (key === "hinterwandkasten" && next.bauweise === "Aufputz") {
        next.hinterwandkasten = false;
        toast.info("Bei Aufputz kann kein Hinterwandkasten ausgewählt werden.");
      }

      if (key === "depth") {
        const v = typeof value === "number" ? value : parseInt(String(value)) || 0;
        if (next.bauweise === "Aufputz" && v < 30) {
          next.depth = 30;
          toast.warning("Mindesttiefe bei Aufputz: 30 mm.");
        } else {
          next.depth = v;
        }
      }

      if (key === "buttonCount") {
        let count = parseInt(String(value)) || 0;
        count = Math.max(0, Math.min(25, count));
        next.buttonCount = count;
        const newBtns = [];
        for (let i = 0; i < count; i++) {
          if (i < prev.buttons.length) newBtns.push(prev.buttons[i]);
          else newBtns.push({ id: `btn-${i}`, engraving: i === 0 ? "EG" : `${i}`, hasLabel: false, labelText: "", hasKey: false });
        }
        next.buttons = newBtns;
        if (!newBtns.find(b => b.id === next.mainFloorId)) next.mainFloorId = newBtns[0]?.id || "";
      }

      if (key === "keySwitchCount") {
        const count = parseInt(String(value)) || 0;
        next.keySwitchCount = count;
        const newKeys = [];
        for (let i = 0; i < count; i++) {
          if (i < prev.keySwitches.length) newKeys.push(prev.keySwitches[i]);
          else newKeys.push({ id: `key-${i}`, funktion: "" });
        }
        next.keySwitches = newKeys;
      }

      return next;
    });
  };

  const updateButton = (idx: number, updates: Partial<LiftConfig["buttons"][0]>) => {
    onChange(prev => {
      const next = { ...prev, buttons: [...prev.buttons] };
      next.buttons[idx] = { ...next.buttons[idx], ...updates };
      return next;
    });
  };

  return (
    <aside className="w-80 bg-sidebar border-r border-sidebar-border flex flex-col h-screen">
      <div className="px-5 py-4 border-b border-sidebar-border bg-sidebar">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-sidebar-primary/20 flex items-center justify-center">
            <Settings2 className="w-4 h-4 text-sidebar-primary" />
          </div>
          <div>
            <h1 className="font-semibold text-sidebar-foreground tracking-tight">Lift-Designer Pro</h1>
            <p className="text-xs text-sidebar-foreground/60">Konfigurator</p>
          </div>
        </div>
      </div>

      <ScrollArea className="flex-1 overflow-y-auto">
        <div className="p-4 space-y-2 pb-8">

          <Collapsible open={openSections.bauweise} onOpenChange={() => toggleSection("bauweise")}>
            <CollapsibleTrigger className="flex items-center justify-between w-full p-3 rounded-lg bg-sidebar-accent/50 hover:bg-sidebar-accent transition-colors">
              <div className="flex items-center gap-2">
                <LayoutGrid className="w-4 h-4 text-sidebar-primary" />
                <span className="text-sm font-medium text-sidebar-foreground">Bauweise & Maße</span>
              </div>
              <ChevronDown className={`w-4 h-4 text-sidebar-foreground/60 transition-transform ${openSections.bauweise ? 'rotate-180' : ''}`} />
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-3 px-1 space-y-4">
              <div className="space-y-2">
                <Label className="text-xs text-sidebar-foreground/70 uppercase tracking-wide">Art</Label>
                <Select value={config.bauweise} onValueChange={(v: Bauweise) => update("bauweise", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Flachmaterial">Flachmaterial</SelectItem>
                    <SelectItem value="Abgekantet">Abgekantet</SelectItem>
                    <SelectItem value="Aufputz">Aufputz</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label className="text-xs text-sidebar-foreground/70 uppercase tracking-wide">Höhe (mm)</Label>
                  <Input type="number" value={config.height} onChange={e => update("height", parseInt(e.target.value) || 0)} />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-sidebar-foreground/70 uppercase tracking-wide">Breite (mm)</Label>
                  <Input type="number" value={config.width} onChange={e => update("width", parseInt(e.target.value) || 0)} />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs text-sidebar-foreground/70 uppercase tracking-wide">Tiefe (mm)</Label>
                <Input
                  type="number"
                  value={config.depth}
                  onChange={e => update("depth", parseInt(e.target.value) || 0)}
                  onBlur={e => {
                    const v = parseInt(e.target.value) || 0;
                    if (config.bauweise === "Aufputz" && v < 30) update("depth", 30);
                  }}
                  disabled={config.bauweise === "Flachmaterial"}
                  min={config.bauweise === "Aufputz" ? 30 : undefined}
                />
                <p className="text-[10px] text-sidebar-foreground/50">
                  Blechstärke: 2mm{config.bauweise === "Aufputz" ? " · Aufputz: min. 30 mm" : ""}
                </p>
              </div>

              <label className={`flex items-center gap-3 py-1 ${config.bauweise === "Aufputz" ? "cursor-not-allowed opacity-45" : "cursor-pointer"}`}>
                <Checkbox className={checkboxClass} checked={config.bauweise === "Aufputz" ? false : config.hinterwandkasten} disabled={config.bauweise === "Aufputz"} onCheckedChange={c => update("hinterwandkasten", !!c)} />
                <span className="text-sm text-sidebar-foreground">Hinterwandkasten</span>
              </label>
              {config.bauweise === "Aufputz" && (
                <p className="text-[10px] text-sidebar-foreground/50 -mt-2">Bei Aufputz deaktiviert, da der Rückwandausschnitt dargestellt wird.</p>
              )}

              <div className="space-y-2">
                <Label className="text-xs text-sidebar-foreground/70 uppercase tracking-wide">Befestigungspunkte</Label>
                <Select value={config.befestigungspunkte.toString()} onValueChange={v => update("befestigungspunkte", parseInt(v))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {[2,4,6,8,10].map(n => <SelectItem key={n} value={String(n)}>{n} ({n/2} Paare)</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </CollapsibleContent>
          </Collapsible>

          <Separator className="bg-sidebar-border" />

          <Collapsible open={openSections.taster} onOpenChange={() => toggleSection("taster")}>
            <CollapsibleTrigger className="flex items-center justify-between w-full p-3 rounded-lg bg-sidebar-accent/50 hover:bg-sidebar-accent transition-colors">
              <div className="flex items-center gap-2">
                <Cpu className="w-4 h-4 text-sidebar-primary" />
                <span className="text-sm font-medium text-sidebar-foreground">Taster & Gravur</span>
              </div>
              <ChevronDown className={`w-4 h-4 text-sidebar-foreground/60 transition-transform ${openSections.taster ? 'rotate-180' : ''}`} />
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-3 px-1 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label className="text-xs text-sidebar-foreground/70 uppercase tracking-wide">Anzahl</Label>
                  <Input type="number" value={config.buttonCount} onChange={e => update("buttonCount", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-sidebar-foreground/70 uppercase tracking-wide">Quittierung</Label>
                  <Select value={config.quittierungsfarbe} onValueChange={(v: Quittierungsfarbe) => update("quittierungsfarbe", v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Rot">Rot</SelectItem>
                      <SelectItem value="Blau">Blau</SelectItem>
                      <SelectItem value="Grün">Grün</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <label className="flex items-center gap-3 py-1 cursor-pointer">
                <Checkbox className={checkboxClass} checked={config.twoRow} onCheckedChange={c => update("twoRow", !!c)} />
                <span className="text-sm text-sidebar-foreground">Zweireihig anordnen</span>
              </label>
              <label className="flex items-center gap-3 py-1 cursor-pointer">
                <Checkbox className={checkboxClass} checked={config.grossflaechenTaster} onCheckedChange={c => update("grossflaechenTaster", !!c)} />
                <span className="text-sm text-sidebar-foreground">Großflächen-Taster (54mm)</span>
              </label>
              <label className="flex items-center gap-3 py-1 cursor-pointer">
                <Checkbox className={checkboxClass} checked={config.brailleSchrift} onCheckedChange={c => update("brailleSchrift", !!c)} />
                <span className="text-sm text-sidebar-foreground">Braille-Schrift</span>
              </label>

              <div className="space-y-2">
                <Label className="text-xs text-sidebar-foreground/70 uppercase tracking-wide">Haupthaltestelle</Label>
                <Select value={config.mainFloorId} onValueChange={v => update("mainFloorId", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {config.buttons.map((b, i) => (
                      <SelectItem key={b.id} value={b.id}>Taster {i+1} ({b.engraving})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2 pt-2">
                {config.buttons.map((btn, idx) => (
                  <div key={btn.id} className="p-3 bg-sidebar-accent/30 border border-sidebar-border rounded-lg space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-sidebar-foreground/70">Taster {idx + 1}</span>
                      {btn.id === config.mainFloorId && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-success/20 text-success font-medium">Hauptetage</span>
                      )}
                    </div>
                    <Input className="h-8" placeholder="Gravur" value={btn.engraving} onChange={e => updateButton(idx, { engraving: e.target.value })} />
                    <div className="flex gap-4">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <Checkbox className={checkboxClass} checked={btn.hasKey} onCheckedChange={c => updateButton(idx, { hasKey: !!c })} />
                        <span className="text-xs text-sidebar-foreground">Schlüssel</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <Checkbox className={checkboxClass} checked={btn.hasLabel} onCheckedChange={c => updateButton(idx, { hasLabel: !!c })} />
                        <span className="text-xs text-sidebar-foreground">Beschriftung</span>
                      </label>
                    </div>
                    {btn.hasLabel && (
                      <Input className="h-7 text-xs" placeholder="Beschriftungstext..." value={btn.labelText} onChange={e => updateButton(idx, { labelText: e.target.value })} />
                    )}
                  </div>
                ))}
              </div>
            </CollapsibleContent>
          </Collapsible>

          <Separator className="bg-sidebar-border" />

          <Collapsible open={openSections.komponenten} onOpenChange={() => toggleSection("komponenten")}>
            <CollapsibleTrigger className="flex items-center justify-between w-full p-3 rounded-lg bg-sidebar-accent/50 hover:bg-sidebar-accent transition-colors">
              <div className="flex items-center gap-2">
                <CircleDot className="w-4 h-4 text-sidebar-primary" />
                <span className="text-sm font-medium text-sidebar-foreground">Komponenten</span>
              </div>
              <ChevronDown className={`w-4 h-4 text-sidebar-foreground/60 transition-transform ${openSections.komponenten ? 'rotate-180' : ''}`} />
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-3 px-1 space-y-4">
              <div className="space-y-2">
                <Label className="text-xs text-sidebar-foreground/70 uppercase tracking-wide">Display</Label>
                <Select value={config.display} onValueChange={(v: DisplayType) => update("display", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Leo 7 Zoll">Leo 7 Zoll</SelectItem>
                    <SelectItem value="Leo 5 Zoll">Leo 5 Zoll</SelectItem>
                    <SelectItem value="Kein Display">Kein Display</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-xs text-sidebar-foreground/70 uppercase tracking-wide">Notruf-Lochbild</Label>
                <Select value={config.notrufSystem} onValueChange={(v: NotrufSystem) => update("notrufSystem", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Keins">Keins</SelectItem>
                    <SelectItem value="MX3">MX3</SelectItem>
                    <SelectItem value="EDNL">EDNL</SelectItem>
                    <SelectItem value="FWG09">FWG09</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <label className="flex items-center gap-3 py-1 cursor-pointer">
                <Checkbox className={checkboxClass} checked={config.sprachansagen} onCheckedChange={c => update("sprachansagen", !!c)} />
                <span className="text-sm text-sidebar-foreground">Sprachansagen</span>
              </label>

              <div className="space-y-2 pt-2">
                <Label className="text-xs text-sidebar-foreground/70 uppercase tracking-wide">Sondertaster</Label>
                {[
                  { id: "nothalt", label: "Not-Halt (Pilz)", key: "notHalt" as const },
                  { id: "alarm", label: "Notruf / Alarm", key: "notrufAlarm" as const },
                  { id: "doorc", label: "Tür zu", key: "doorClose" as const },
                  { id: "dooro", label: "Tür auf", key: "doorOpen" as const },
                  { id: "laden", label: "Laden (Türen offen halten)", key: "ladenTaster" as const },
                  { id: "luefter", label: "Lüfter", key: "luefterTaster" as const },
                ].map(item => (
                  <label key={item.id} className="flex items-center justify-between py-2 border-b border-sidebar-border/50 cursor-pointer">
                    <span className="text-sm text-sidebar-foreground">{item.label}</span>
                    <Checkbox className={checkboxClass} checked={config[item.key] as boolean} onCheckedChange={c => update(item.key, !!c)} />
                  </label>
                ))}
              </div>

              <div className="space-y-2 pt-2">
                <Label className="text-xs text-sidebar-foreground/70 uppercase tracking-wide">Schlüsselschalter (Unten)</Label>
                <Select value={config.keySwitchCount.toString()} onValueChange={v => update("keySwitchCount", parseInt(v))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {[0,1,2,3].map(n => <SelectItem key={n} value={String(n)}>{n}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </CollapsibleContent>
          </Collapsible>
        </div>
      </ScrollArea>
    </aside>
  );
}
