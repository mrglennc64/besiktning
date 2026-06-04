import { describe, it, expect } from "vitest";
import { emptyCase } from "./template";

describe("emptyCase", () => {
  it("has all 8 sections present with empty collections", () => {
    const c = emptyCase();
    expect(c.okular_besiktning.grundlaggning.findings).toEqual([]);
    expect(c.riskanalys).toEqual([]);
    expect(c.bilagor).toEqual(["Teknisk livslängd", "SBR:s villkor", "GDPR"]);
    expect(c.ansvar.ansvarstid_ar).toBe(2);
    expect(c.sammanfattning.sarskilt_att_beakta).toEqual([]);
  });
});
