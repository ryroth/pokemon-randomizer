import { describe, expect, it } from "vitest";
import { phoneSheetFrame } from "@/components/builder/phone-sheet";

describe("phoneSheetFrame", () => {
  it("fills the visible screen when the keyboard is closed", () => {
    expect(phoneSheetFrame({ height: 844, offsetTop: 0 })).toEqual({ top: 0, height: 844 });
  });

  it("sits in the visible area above the keyboard", () => {
    expect(phoneSheetFrame({ height: 360.4, offsetTop: 12.2 })).toEqual({ top: 12, height: 360 });
  });

  it("never places the sheet above the screen", () => {
    expect(phoneSheetFrame({ height: 400, offsetTop: -8 })).toEqual({ top: 0, height: 400 });
  });
});
