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
    // MX3: kompakteres, realistischeres Lochbild mit Befestigung und Sprech-/Statusöffnungen
    const w = 76, h = 48;
    return {
      width: w,
      height: h,
      holes: [
        { x: 10, y: 10, r: 2.4, label: "fix" },
        { x: 66, y: 10, r: 2.4, label: "fix" },
        { x: 10, y: 38, r: 2.4, label: "fix" },
        { x: 66, y: 38, r: 2.4, label: "fix" },
        { x: 30, y: 16, r: 1.7, label: "speaker" },
        { x: 38, y: 16, r: 1.7, label: "speaker" },
        { x: 46, y: 16, r: 1.7, label: "speaker" },
        { x: 26, y: 24, r: 1.7, label: "speaker" },
        { x: 34, y: 24, r: 1.7, label: "speaker" },
        { x: 42, y: 24, r: 1.7, label: "speaker" },
        { x: 50, y: 24, r: 1.7, label: "speaker" },
        { x: 30, y: 32, r: 1.7, label: "speaker" },
        { x: 38, y: 32, r: 1.7, label: "speaker" },
        { x: 46, y: 32, r: 1.7, label: "speaker" },
        { x: 22, y: 38, r: 1.4, label: "led" },
        { x: 38, y: 38, r: 1.4, label: "led" },
        { x: 54, y: 38, r: 1.4, label: "led" },
      ],
    };
  }

  if (system === "EDNL") {
    // EDNL: vertikales Lochbild mit Sprechöffnung, Status-LEDs und Befestigung
    const w = 58, h = 72;
    return {
      width: w,
      height: h,
      holes: [
        { x: 10, y: 10, r: 2.4, label: "fix" },
        { x: 48, y: 10, r: 2.4, label: "fix" },
        { x: 10, y: 62, r: 2.4, label: "fix" },
        { x: 48, y: 62, r: 2.4, label: "fix" },
        { x: 22, y: 24, r: 1.6, label: "speaker" },
        { x: 29, y: 24, r: 1.6, label: "speaker" },
        { x: 36, y: 24, r: 1.6, label: "speaker" },
        { x: 22, y: 31, r: 1.6, label: "speaker" },
        { x: 29, y: 31, r: 1.6, label: "speaker" },
        { x: 36, y: 31, r: 1.6, label: "speaker" },
        { x: 22, y: 38, r: 1.6, label: "speaker" },
        { x: 29, y: 38, r: 1.6, label: "speaker" },
        { x: 36, y: 38, r: 1.6, label: "speaker" },
        { x: 22, y: 52, r: 1.5, label: "led" },
        { x: 29, y: 52, r: 1.5, label: "led" },
        { x: 36, y: 52, r: 1.5, label: "led" },
      ],
    };
  }

  if (system === "FWG09") {
    // FWG09: 9-Loch-Raster mit zusätzlichen Befestigungsbohrungen
    const w = 68, h = 68;
    const holes: { x: number; y: number; r: number; label?: string }[] = [
      { x: 8, y: 8, r: 2.3, label: "fix" },
      { x: 60, y: 8, r: 2.3, label: "fix" },
      { x: 8, y: 60, r: 2.3, label: "fix" },
      { x: 60, y: 60, r: 2.3, label: "fix" },
    ];
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 3; col++) {
        holes.push({ x: 22 + col * 12, y: 22 + row * 12, r: 2.2, label: "speaker" });
      }
    }
    return { width: w, height: h, holes };
  }

  return null;
}
