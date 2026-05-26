export type Bauweise = "Flachmaterial" | "Abgekantet" | "Aufputz";
export type Quittierungsfarbe = "Rot" | "Blau" | "Grün";
export type NotlichtShape = "Eckig" | "Rund";
export type DisplayType = "Leo 7 Zoll" | "Leo 5 Zoll" | "Kein Display";
export type NotrufSystem = "Keins" | "MX3" | "EDNL" | "FWG09";
export type ButtonShape = "Eckig" | "Rund";

export interface ButtonConfig {
  id: string;
  engraving: string;
  hasLabel: boolean;
  labelText: string;
  hasKey: boolean;
}

export interface KeySwitchConfig {
  id: string;
  funktion: string;
}

export interface LiftConfig {
  bauweise: Bauweise;
  height: number;
  width: number;
  depth: number;
  hinterwandkasten: boolean;
  befestigungspunkte: number;
  buttonCount: number;
  twoRow: boolean;
  buttonShape: ButtonShape;
  grossflaechenTaster: boolean;
  brailleSchrift: boolean;
  quittierungsfarbe: Quittierungsfarbe;
  buttons: ButtonConfig[];
  mainFloorId: string;
  display: DisplayType;
  notrufSystem: NotrufSystem;
  notHalt: boolean;
  notrufAlarm: boolean;
  doorClose: boolean;
  doorOpen: boolean;
  ladenTaster: boolean;
  luefterTaster: boolean;
  sprachansagen: boolean;
  keySwitchCount: number;
  keySwitches: KeySwitchConfig[];
  notlicht: {
    shape: NotlichtShape;
    tragkraft: string;
    baujahr: string;
    fabrNr: string;
    umbaujahr: string;
    hersteller: string;
  };
  comments: string;
}

export const defaultConfig: LiftConfig = {
  bauweise: "Abgekantet",
  height: 800,
  width: 220,
  depth: 25,
  hinterwandkasten: false,
  befestigungspunkte: 4,
  buttonCount: 4,
  twoRow: false,
  buttonShape: "Eckig",
  grossflaechenTaster: false,
  brailleSchrift: false,
  quittierungsfarbe: "Blau",
  buttons: [
    { id: "btn-0", engraving: "EG", hasLabel: false, labelText: "", hasKey: false },
    { id: "btn-1", engraving: "1", hasLabel: false, labelText: "", hasKey: false },
    { id: "btn-2", engraving: "2", hasLabel: false, labelText: "", hasKey: false },
    { id: "btn-3", engraving: "3", hasLabel: false, labelText: "", hasKey: false },
  ],
  mainFloorId: "btn-0",
  display: "Leo 5 Zoll",
  notrufSystem: "MX3",
  notHalt: false,
  notrufAlarm: true,
  doorClose: false,
  doorOpen: true,
  ladenTaster: false,
  luefterTaster: false,
  sprachansagen: false,
  keySwitchCount: 1,
  keySwitches: [{ id: "key-0", funktion: "" }],
  notlicht: {
    shape: "Eckig",
    tragkraft: "1000 kg / 13 Personen",
    baujahr: "2024",
    fabrNr: "123456",
    umbaujahr: "",
    hersteller: "Butz-Liftparts",
  },
  comments: "",
};

// Returns hole positions (in mm, relative to lochbild origin top-left) for the given notruf system
export function getNotrufLochbild(system: NotrufSystem): {
  width: number;
  height: number;
  holes: { x: number; y: number; r: number; label?: string }[];
} | null {
  if (system === "Keins") return null;
  if (system === "MX3") {
    // MX3: 7 holes in a circle
    const w = 60, h = 60;
    const cx = w / 2, cy = h / 2, ring = 18, r = 3;
    const holes = [];
    for (let i = 0; i < 7; i++) {
      const a = (i / 7) * Math.PI * 2 - Math.PI / 2;
      holes.push({ x: cx + Math.cos(a) * ring, y: cy + Math.sin(a) * ring, r, label: String(i + 1) });
    }
    return { width: w, height: h, holes };
  }
  if (system === "EDNL") {
    // EDNL: 4 holes in a vertical line + 1 small status
    const w = 36, h = 80;
    return {
      width: w,
      height: h,
      holes: [
        { x: w / 2, y: 12, r: 3.5 },
        { x: w / 2, y: 30, r: 3.5 },
        { x: w / 2, y: 50, r: 3.5 },
        { x: w / 2, y: 68, r: 3.5 },
      ],
    };
  }
  if (system === "FWG09") {
    // FWG09: 3x3 grid
    const w = 60, h = 60;
    const holes = [];
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 3; col++) {
        holes.push({ x: 12 + col * 18, y: 12 + row * 18, r: 3 });
      }
    }
    return { width: w, height: h, holes };
  }
  return null;
}
