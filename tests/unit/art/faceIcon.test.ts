import { describe, expect, it } from "vitest";
import {
  ICON_SIZE,
  alphaBounds,
  analyseFace,
  buildFaceIcon,
  drawFace,
  fitFace,
  fitStillPicture,
  paintOut,
  type Mask,
  type RgbaImage,
} from "@/lib/art/faceIcon";

const SIZE = 128;

interface HeadOptions {
  color?: [number, number, number];
  features?: boolean;
  radius?: number;
}

/** A round head with two dark eyes and a dark mouth, on a transparent background. */
function head({ color = [240, 200, 60], features = true, radius = 40 }: HeadOptions = {}): RgbaImage {
  const data = new Uint8ClampedArray(SIZE * SIZE * 4);
  const set = (x: number, y: number, rgb: readonly number[]) => {
    const index = (y * SIZE + x) * 4;
    data[index] = rgb[0];
    data[index + 1] = rgb[1];
    data[index + 2] = rgb[2];
    data[index + 3] = 255;
  };
  for (let y = 0; y < SIZE; y += 1) {
    for (let x = 0; x < SIZE; x += 1) {
      if (Math.hypot(x - 64, y - 64) <= radius) {
        set(x, y, color);
      }
    }
  }
  if (features) {
    for (let y = 0; y < SIZE; y += 1) {
      for (let x = 0; x < SIZE; x += 1) {
        const eye = Math.min(Math.hypot(x - 50, y - 56), Math.hypot(x - 78, y - 56)) <= 4;
        const mouth = x >= 54 && x <= 74 && y >= 76 && y <= 77;
        if (eye || mouth) {
          set(x, y, [20, 15, 25]);
        }
      }
    }
  }
  return { data, width: SIZE, height: SIZE };
}

function pixelAt(data: ArrayLike<number>, x: number, y: number, width = SIZE) {
  const index = (Math.floor(y) * width + Math.floor(x)) * 4;
  return { r: data[index], g: data[index + 1], b: data[index + 2], a: data[index + 3] };
}

function box(x0: number, y0: number, x1: number, y1: number): Mask {
  const mask = new Float32Array(ICON_SIZE * ICON_SIZE);
  for (let y = y0; y < y1; y += 1) {
    for (let x = x0; x < x1; x += 1) {
      mask[y * ICON_SIZE + x] = 1;
    }
  }
  return mask;
}

describe("finding the face", () => {
  it("finds a pair of eyes and the mouth, and marks them to be painted out", () => {
    const analysis = analyseFace(head({ radius: 60 }), "head");
    expect(analysis.found).toBe("pair");
    expect(analysis.face.x).toBeCloseTo(64, 0);
    expect(analysis.face.y).toBeCloseTo(56, 0);
    expect(analysis.erase[56 * SIZE + 50]).toBe(1);
    expect(analysis.erase[56 * SIZE + 78]).toBe(1);
    expect(analysis.erase[76 * SIZE + 64]).toBe(1);
    // A close-up of the head, not the whole picture.
    expect(analysis.crop.size).toBeLessThan(110);
    expect(analysis.crop.cx).toBeCloseTo(64, 0);
  });

  it("keeps the whole Pokémon when asked, and still finds the eyes", () => {
    const analysis = analyseFace(head(), "whole");
    expect(analysis.found).toBe("pair");
    expect(analysis.crop.size).toBeGreaterThan(75);
  });

  it("guesses where the head is and cuts a close-up there when no eyes can be found", () => {
    const image = head({ features: false });
    const whole = analyseFace(image, "whole");
    const analysis = analyseFace(image, "head");
    expect(analysis.found).toBe("none");
    expect(analysis.crop.size).toBeLessThan(whole.crop.size);
    expect(analysis.face.y).toBeLessThan(64);
    expect(analysis.erase.some((flag) => flag === 1)).toBe(true);
  });

  it("ignores dark spots low on the body, which are not eyes", () => {
    const image = head({ features: false });
    for (const x of [48, 80]) {
      for (let y = 90; y < 96; y += 1) {
        for (let dx = 0; dx < 6; dx += 1) {
          const index = (y * SIZE + x + dx) * 4;
          image.data = image.data as Uint8ClampedArray;
          (image.data as Uint8ClampedArray)[index] = 20;
          (image.data as Uint8ClampedArray)[index + 1] = 15;
          (image.data as Uint8ClampedArray)[index + 2] = 25;
        }
      }
    }
    expect(analyseFace(image, "head").found).toBe("none");
  });
});

describe("painting out the Pokémon's own face", () => {
  it("fills the eyes and mouth with the color around them", () => {
    const image = head();
    const analysis = analyseFace(image, "head");
    const clean = paintOut(image, analysis.erase);
    for (const [x, y] of [
      [50, 56],
      [78, 56],
      [64, 76],
    ]) {
      const { r, g, b } = pixelAt(clean, x, y);
      expect(Math.abs(r - 240)).toBeLessThan(14);
      expect(Math.abs(g - 200)).toBeLessThan(14);
      expect(Math.abs(b - 60)).toBeLessThan(14);
    }
  });

  it("leaves the picture alone when there is nothing to paint out", () => {
    const image = head({ features: false });
    const clean = paintOut(image, new Uint8Array(SIZE * SIZE));
    expect(Array.from(clean)).toEqual(Array.from(image.data));
  });
});

describe("face icon", () => {
  it("is a rounded close-up with an outline, and the Pokémon's own face still there", () => {
    const icon = buildFaceIcon(head(), "head");
    expect(icon.rgba).toHaveLength(ICON_SIZE * ICON_SIZE * 4);
    expect(pixelAt(icon.rgba, 32, 32, ICON_SIZE).a).toBe(255);
    expect(pixelAt(icon.rgba, 0, 0, ICON_SIZE).a).toBe(0);

    // An outline surrounds the picture: solid dark pixels sit just beyond the body.
    let outline = 0;
    let darkInside = 0;
    for (let y = 0; y < ICON_SIZE; y += 1) {
      for (let x = 0; x < ICON_SIZE; x += 1) {
        const pixel = pixelAt(icon.rgba, x, y, ICON_SIZE);
        const body = icon.body[y * ICON_SIZE + x];
        if (body === 0 && pixel.a > 200 && pixel.r < 80) {
          outline += 1;
        }
        if (body >= 0.99 && pixel.r < 80) {
          darkInside += 1;
        }
      }
    }
    expect(outline).toBeGreaterThan(40);
    expect(darkInside).toBeGreaterThan(0);
  });

  it("can paint the Pokémon's own face out when asked, for the still Ditto icon", () => {
    const kept = buildFaceIcon(head(), "head");
    const erased = buildFaceIcon(head(), "head", { eraseFace: true });
    let darkKept = 0;
    let darkErased = 0;
    for (let y = 0; y < ICON_SIZE; y += 1) {
      for (let x = 0; x < ICON_SIZE; x += 1) {
        if (kept.body[y * ICON_SIZE + x] < 0.99) {
          continue;
        }
        if (pixelAt(kept.rgba, x, y, ICON_SIZE).r < 80) {
          darkKept += 1;
        }
        if (pixelAt(erased.rgba, x, y, ICON_SIZE).r < 80) {
          darkErased += 1;
        }
      }
    }
    expect(darkKept).toBeGreaterThan(0);
    expect(darkErased).toBe(0);
  });

  it("puts the face on the picture, with room for both eyes and the mouth", () => {
    const icon = buildFaceIcon(head(), "head");
    const { face } = icon;
    expect(icon.body[Math.floor(face.y) * ICON_SIZE + Math.floor(face.x)]).toBeGreaterThanOrEqual(0.5);
    expect(face.scale).toBe(1);
  });

  it("draws Ditto's dot eyes and flat mouth over the icon", () => {
    const icon = buildFaceIcon(head(), "head");
    const pixels = new Uint8ClampedArray(icon.rgba);
    drawFace(pixels, icon.face, icon.faceColor);
    const eye = pixelAt(pixels, icon.face.x - 7.2, icon.face.y, ICON_SIZE);
    const otherEye = pixelAt(pixels, icon.face.x + 7.2, icon.face.y, ICON_SIZE);
    const mouth = pixelAt(pixels, icon.face.x, icon.face.y + 6.6, ICON_SIZE);
    for (const dark of [eye, otherEye, mouth]) {
      expect(dark.a).toBe(255);
      expect(dark.r).toBeLessThan(90);
    }
  });

  it("uses light features on a dark Pokémon so the face can be seen", () => {
    const icon = buildFaceIcon(head({ color: [30, 28, 40], features: false }), "head");
    expect(icon.faceColor[0]).toBeGreaterThan(200);
    const bright = buildFaceIcon(head({ color: [240, 200, 60], features: false }), "head");
    expect(bright.faceColor[0]).toBeLessThan(80);
  });

  it("never keeps the whole Pokémon in a head icon, even when no eyes are found", () => {
    const image = head({ features: false });
    expect(analyseFace(image, "head").crop.size).toBeLessThan(analyseFace(image, "whole").crop.size);
    expect(buildFaceIcon(image, "head").face.scale).toBeGreaterThan(0);
  });

  it("keeps the whole silhouette for Ditto", () => {
    const icon = buildFaceIcon(head(), "whole");
    const bounds = alphaBounds(icon.rgba, ICON_SIZE, ICON_SIZE);
    expect(bounds && bounds.width).toBeGreaterThan(50);
    expect(bounds && bounds.height).toBeGreaterThan(50);
  });
});

describe("fitting still artwork", () => {
  it("keeps the whole picture, including parts a head crop would drop", () => {
    const data = new Uint8ClampedArray(SIZE * SIZE * 4);
    for (let y = 0; y < SIZE; y += 1) {
      for (let x = 0; x < SIZE; x += 1) {
        const index = (y * SIZE + x) * 4;
        if (Math.hypot(x - 64, y - 28) <= 16) {
          data.set([240, 200, 60, 255], index);
        } else if (Math.hypot(x - 64, y - 96) <= 18) {
          data.set([40, 120, 220, 255], index);
        }
      }
    }
    const image = { data, width: SIZE, height: SIZE };
    const artwork = fitStillPicture(image);
    const closeUp = buildFaceIcon(image, "head");
    const bottomArtwork = pixelAt(artwork.rgba, 32, 52, ICON_SIZE);
    const bottomCloseUp = pixelAt(closeUp.rgba, 32, 52, ICON_SIZE);
    expect(bottomArtwork.b).toBeGreaterThan(150);
    expect(bottomArtwork.a).toBeGreaterThan(200);
    expect(bottomCloseUp.b).toBeLessThan(100);
  });

  it("does not add the badge outline", () => {
    const icon = fitStillPicture(head({ features: false, radius: 60 }));
    let outline = 0;
    for (let y = 0; y < ICON_SIZE; y += 1) {
      for (let x = 0; x < ICON_SIZE; x += 1) {
        const pixel = pixelAt(icon.rgba, x, y, ICON_SIZE);
        if (icon.body[y * ICON_SIZE + x] === 0 && pixel.a > 200 && pixel.r < 80) {
          outline += 1;
        }
      }
    }
    expect(outline).toBe(0);
  });
});

describe("fitting the face", () => {
  it("shrinks the face on a narrow shape so both eyes stay on the body", () => {
    const narrow = box(26, 4, 38, 60);
    const face = fitFace(narrow, { x: 32, y: 20 });
    expect(face.scale).toBeLessThan(1);
    expect(narrow[Math.floor(face.y) * ICON_SIZE + Math.floor(face.x - 7.2 * face.scale)]).toBe(1);
    expect(narrow[Math.floor(face.y) * ICON_SIZE + Math.floor(face.x + 7.2 * face.scale)]).toBe(1);
  });

  it("keeps the full-size face on a wide shape", () => {
    expect(fitFace(box(4, 4, 60, 60), { x: 32, y: 28 }).scale).toBe(1);
  });

  it("never goes above the largest size it is given", () => {
    expect(fitFace(box(4, 4, 60, 60), { x: 32, y: 28 }, 0.5).scale).toBe(0.5);
  });
});

describe("reading pictures", () => {
  it("finds the box around the visible pixels", () => {
    const rgba = new Uint8ClampedArray(10 * 10 * 4);
    for (const [x, y] of [
      [2, 3],
      [6, 7],
    ]) {
      rgba[(y * 10 + x) * 4 + 3] = 255;
    }
    expect(alphaBounds(rgba, 10, 10)).toEqual({ x: 2, y: 3, width: 5, height: 5 });
    expect(alphaBounds(new Uint8ClampedArray(400), 10, 10)).toBeNull();
  });
});
