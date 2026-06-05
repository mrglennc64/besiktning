import { describe, expect, it } from "vitest";
import { sectionForCategory } from "./sectionForCategory";

describe("sectionForCategory", () => {
  it("routes MARK to mark_och_dranering", () => {
    expect(sectionForCategory("MARK")).toBe("mark_och_dranering");
  });

  it("routes DRÄNERING to mark_och_dranering", () => {
    expect(sectionForCategory("DRÄNERING")).toBe("mark_och_dranering");
  });

  it("routes GRUNDLÄGGNING to grundlaggning", () => {
    expect(sectionForCategory("GRUNDLÄGGNING")).toBe("grundlaggning");
  });

  it("routes the long GRUNDLÄGGNING BETONGPLATTA variant to grundlaggning", () => {
    expect(sectionForCategory("GRUNDLÄGGNING BETONGPLATTA ELLER SULOR")).toBe("grundlaggning");
  });

  it("routes STOMME/YTTERVÄGGAR to stomme", () => {
    expect(sectionForCategory("STOMME/YTTERVÄGGAR")).toBe("stomme");
  });

  it("routes MELLANBJÄLKLAG to stomme", () => {
    expect(sectionForCategory("MELLANBJÄLKLAG")).toBe("stomme");
  });

  it("routes FASAD to fasad_fonster_dorrar", () => {
    expect(sectionForCategory("FASAD")).toBe("fasad_fonster_dorrar");
  });

  it("routes FÖNSTER to fasad_fonster_dorrar", () => {
    expect(sectionForCategory("FÖNSTER")).toBe("fasad_fonster_dorrar");
  });

  it("routes BALKONG and Altan to fasad_fonster_dorrar", () => {
    expect(sectionForCategory("BALKONG")).toBe("fasad_fonster_dorrar");
    expect(sectionForCategory("Altan")).toBe("fasad_fonster_dorrar");
  });

  it("routes YTTERTAK to yttertak", () => {
    expect(sectionForCategory("YTTERTAK")).toBe("yttertak");
  });

  it("routes VÅTUTRYMMEN to vatrum", () => {
    expect(sectionForCategory("VÅTUTRYMMEN")).toBe("vatrum");
  });

  it("routes VIND to vind", () => {
    expect(sectionForCategory("VIND")).toBe("vind");
  });

  it("routes VENTILATION and EL FRASER to installationer", () => {
    expect(sectionForCategory("VENTILATION")).toBe("installationer");
    expect(sectionForCategory("EL FRASER")).toBe("installationer");
  });

  it("is case-insensitive", () => {
    expect(sectionForCategory("yttertak")).toBe("yttertak");
    expect(sectionForCategory("fasad")).toBe("fasad_fonster_dorrar");
  });

  it("falls back to grundlaggning for unknown categories", () => {
    expect(sectionForCategory("ZZZ")).toBe("grundlaggning");
  });
});
