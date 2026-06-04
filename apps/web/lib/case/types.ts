// TypeScript mirror of packages/schemas/overlatelse.json. Hand-maintained.

export interface Finding {
  notering_id: string;
  qualifier?: string;
  photo_refs?: string[];
  ai_match_confidence?: number;
  validated_by_user?: boolean;
}

export interface Section4 {
  besiktningsmannens_text?: string;
  findings: Finding[];
  ej_besiktigat?: boolean;
}

export interface RiskItem {
  rubrik: string;
  findings: Finding[];
}

export type SkickBedomning = "under_normalt" | "normalt" | "over_normalt";

export interface CaseDoc {
  parter_och_uppdrag: {
    fastighet_namn?: string;
    adress?: string;
    uppdragsgivare?: string;
    distribution?: string;
    narvarande?: string;
    besiktningsforetag?: string;
    besiktningsman?: string;
    besiktningsdag?: string;
    vaderlek?: string;
    uppdrag_beskrivning?: string;
    forutsattningar?: string;
  };
  handlingar_och_upplysningar: {
    tillhandahallna_handlingar: string[];
    muntliga_uppgifter: {
      allmant: string[];
      vatten_och_avlopp: string[];
      el_och_installationer: string[];
    };
  };
  fastighetsuppgifter: {
    byggnadsar?: string;
    vaningar?: string;
    stomme?: string;
    bjalklag?: string;
    grund?: string;
    fasad?: string;
    yttertak?: string;
    varme?: string;
    ventilation?: string;
    va?: string;
  };
  okular_besiktning: {
    mark_och_dranering: Section4;
    grundlaggning: Section4;
    stomme: Section4;
    fasad_fonster_dorrar: Section4;
    yttertak: Section4;
    vind: Section4;
    invandiga_ytor: Record<string, Section4>;
    installationer: Section4;
    vatrum: Section4;
  };
  riskanalys: RiskItem[];
  fortsatt_teknisk_utredning: { motiverat?: boolean; beskrivning?: string };
  sammanfattning: {
    text?: string;
    sarskilt_att_beakta: string[];
    skick_bedomning?: SkickBedomning;
  };
  bilagor: string[];
  ansvar: { ansvarstid_ar: number; signatur_ort?: string; signatur_datum?: string };
}

/** The fixed section_4 keys under okular_besiktning (excludes invandiga_ytor rooms). */
export const OKULAR_SECTIONS = [
  "mark_och_dranering",
  "grundlaggning",
  "stomme",
  "fasad_fonster_dorrar",
  "yttertak",
  "vind",
  "installationer",
  "vatrum",
] as const;
export type OkularSection = (typeof OKULAR_SECTIONS)[number];

/** A `section` argument: a fixed okulär key, or "invandiga_ytor.<room>". */
export type SectionRef = string;

export type Edit =
  | { op: "set_fact"; path: string; value: string }
  | { op: "add_finding"; section: SectionRef; notering_id: string; qualifier?: string; photo_refs?: string[]; ai_match_confidence?: number; validated_by_user?: boolean }
  | { op: "add_risk"; notering_id: string; rubrik?: string }
  | { op: "remove_item"; section: SectionRef; index: number }
  | { op: "set_summary"; text?: string; bullets?: string[] }
  | { op: "set_skick"; value: SkickBedomning }
  | { op: "set_ftu"; motiverat: boolean; beskrivning?: string };

/** Result of applying one edit. */
export type ApplyResult =
  | { ok: true; doc: CaseDoc; summary: string }
  | { ok: false; error: string; suggestions?: { id: string; title: string }[] };
