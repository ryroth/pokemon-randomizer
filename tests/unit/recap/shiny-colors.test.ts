import { describe, expect, it } from "vitest";
import { colorSlotsFromGlb, imageNameForMaterial, pairShinyColors, type ColorSlot } from "@/lib/recap/shinyColors";

function slot(materialName: string, imageName: string, bytes: number[]): ColorSlot {
  return { materialName, imageName, bytes: Uint8Array.from(bytes), mimeType: "image/webp" };
}

describe("pairShinyColors", () => {
  it("pairs materials whose names match after separators are removed", () => {
    const paints = pairShinyColors(
      [
        { materialName: "BodyA", imageName: "" },
        { materialName: "BodyB", imageName: "" },
      ],
      [slot("body_a", "a", [1]), slot("body_b", "b", [2])],
    );
    expect(paints?.map((paint) => [...paint.bytes])).toEqual([[1], [2]]);
  });

  it("pairs body and eye roles when the shiny file uses different material names", () => {
    const paints = pairShinyColors(
      [
        { materialName: "001Eye1", imageName: "Image_2" },
        { materialName: "001BodyB1", imageName: "Image_1" },
        { materialName: "001BodyA1", imageName: "Image_0" },
      ],
      [
        slot("Material #10", "pm0001_00_BodyA1", [10]),
        slot("Material #11", "pm0001_00_Eye1", [11]),
        slot("Material #12", "pm0001_00_BodyB1", [12]),
        slot("Material #13", "pm0001_00_Iris1", [13]),
      ],
    );
    expect(paints?.map((paint) => paint.materialName)).toEqual(["001Eye1", "001BodyB1", "001BodyA1"]);
    expect(paints?.map((paint) => [...paint.bytes])).toEqual([[11], [12], [10]]);
  });

  it("leaves the regular textures alone when the materials cannot be paired", () => {
    expect(
      pairShinyColors(
        [{ materialName: "Material_12", imageName: "Image_0" }],
        [slot("body_a", "", [1]), slot("body_b", "", [2])],
      ),
    ).toBeNull();
    expect(
      pairShinyColors(
        [
          { materialName: "001Eye1", imageName: "" },
          { materialName: "fire", imageName: "" },
        ],
        [slot("Material #11", "Eye1", [11])],
      ),
    ).toBeNull();
  });
});

describe("colorSlotsFromGlb", () => {
  it("reads WebP base-color images stored with EXT_texture_webp", () => {
    const png = Uint8Array.from([9, 8, 7, 6]);
    const webp = Uint8Array.from([1, 2, 3, 4, 5]);
    const bin = new Uint8Array(png.length + webp.length);
    bin.set(png, 0);
    bin.set(webp, png.length);
    const glb = makeGlb(
      {
        materials: [
          { name: "001BodyA1", pbrMetallicRoughness: { baseColorTexture: { index: 0 } } },
          { name: "unused" },
        ],
        textures: [{ extensions: { EXT_texture_webp: { source: 1 } } }],
        images: [
          { name: "ignored", mimeType: "image/png", bufferView: 0 },
          { name: "pm0001_00_BodyA1", mimeType: "image/webp", bufferView: 1 },
        ],
        bufferViews: [
          { byteOffset: 0, byteLength: png.length },
          { byteOffset: png.length, byteLength: webp.length },
        ],
      },
      bin,
    );

    expect(colorSlotsFromGlb(glb)).toEqual([
      {
        materialName: "001BodyA1",
        imageName: "pm0001_00_BodyA1",
        bytes: webp,
        mimeType: "image/webp",
      },
    ]);
    expect(imageNameForMaterial(JSON.parse(jsonText(glb)), 0)).toBe("pm0001_00_BodyA1");
    expect(colorSlotsFromGlb(new ArrayBuffer(8))).toEqual([]);
  });
});

function makeGlb(json: object, bin: Uint8Array): ArrayBuffer {
  const jsonBytes = new TextEncoder().encode(JSON.stringify(json));
  const jsonPad = (4 - (jsonBytes.length % 4)) % 4;
  const binPad = (4 - (bin.length % 4)) % 4;
  const total = 12 + 8 + jsonBytes.length + jsonPad + 8 + bin.length + binPad;
  const buffer = new ArrayBuffer(total);
  const view = new DataView(buffer);
  const bytes = new Uint8Array(buffer);
  view.setUint32(0, 0x46546c67, true);
  view.setUint32(4, 2, true);
  view.setUint32(8, total, true);
  let offset = 12;
  view.setUint32(offset, jsonBytes.length + jsonPad, true);
  view.setUint32(offset + 4, 0x4e4f534a, true);
  bytes.set(jsonBytes, offset + 8);
  bytes.fill(0x20, offset + 8 + jsonBytes.length, offset + 8 + jsonBytes.length + jsonPad);
  offset += 8 + jsonBytes.length + jsonPad;
  view.setUint32(offset, bin.length + binPad, true);
  view.setUint32(offset + 4, 0x004e4942, true);
  bytes.set(bin, offset + 8);
  return buffer;
}

function jsonText(glb: ArrayBuffer): string {
  const view = new DataView(glb);
  const length = view.getUint32(12, true);
  return new TextDecoder().decode(new Uint8Array(glb, 20, length)).trim();
}
