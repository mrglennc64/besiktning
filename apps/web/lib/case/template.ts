import type { CaseDoc, Section4 } from "./types";

function emptySection4(): Section4 {
  return { besiktningsmannens_text: "", findings: [], ej_besiktigat: false };
}

/** Build a fresh, empty overlatelse case with all 8 sections present. */
export function emptyCase(): CaseDoc {
  return {
    parter_och_uppdrag: {},
    handlingar_och_upplysningar: {
      tillhandahallna_handlingar: [],
      muntliga_uppgifter: { allmant: [], vatten_och_avlopp: [], el_och_installationer: [] },
    },
    fastighetsuppgifter: {},
    okular_besiktning: {
      mark_och_dranering: emptySection4(),
      grundlaggning: emptySection4(),
      stomme: emptySection4(),
      fasad_fonster_dorrar: emptySection4(),
      yttertak: emptySection4(),
      vind: emptySection4(),
      invandiga_ytor: {},
      installationer: emptySection4(),
      vatrum: emptySection4(),
    },
    riskanalys: [],
    fortsatt_teknisk_utredning: { motiverat: false },
    sammanfattning: { sarskilt_att_beakta: [] },
    bilagor: ["Teknisk livslängd", "SBR:s villkor", "GDPR"],
    ansvar: { ansvarstid_ar: 2 },
  };
}
