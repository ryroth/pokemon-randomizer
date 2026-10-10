import type { Page } from "@playwright/test";

export interface ContrastFailure {
  text: string;
  ratio: number;
  needed: number;
  color: string;
  background: string;
  path: string;
}

/**
 * Walks every visible piece of text on the page and checks WCAG AA contrast (4.5:1, or 3:1 for
 * large text) against the color actually painted behind it. Text over gradients and images is
 * skipped, because there is no single background to measure. Disabled controls are exempt.
 */
export async function findContrastFailures(page: Page, scope = "body"): Promise<ContrastFailure[]> {
  return page.evaluate((scopeSelector) => {
    const canvas = document.createElement("canvas");
    canvas.width = 1;
    canvas.height = 1;
    const context = canvas.getContext("2d", { willReadFrequently: true });
    if (!context) {
      throw new Error("No canvas context for color conversion.");
    }

    type Rgba = [number, number, number, number];

    function toRgba(value: string): Rgba {
      context!.clearRect(0, 0, 1, 1);
      context!.fillStyle = "#000";
      context!.fillStyle = value;
      context!.fillRect(0, 0, 1, 1);
      const data = context!.getImageData(0, 0, 1, 1).data;
      return [data[0] ?? 0, data[1] ?? 0, data[2] ?? 0, (data[3] ?? 0) / 255];
    }

    function over(top: Rgba, bottom: Rgba): Rgba {
      const alpha = top[3] + bottom[3] * (1 - top[3]);
      if (alpha === 0) {
        return [0, 0, 0, 0];
      }
      const mix = (a: number, b: number) => (a * top[3] + b * bottom[3] * (1 - top[3])) / alpha;
      return [mix(top[0], bottom[0]), mix(top[1], bottom[1]), mix(top[2], bottom[2]), alpha];
    }

    function luminance([red, green, blue]: Rgba): number {
      const channel = (value: number) => {
        const scaled = value / 255;
        return scaled <= 0.04045 ? scaled / 12.92 : ((scaled + 0.055) / 1.055) ** 2.4;
      };
      return 0.2126 * channel(red) + 0.7152 * channel(green) + 0.0722 * channel(blue);
    }

    function ratio(a: Rgba, b: Rgba): number {
      const first = luminance(a);
      const second = luminance(b);
      return (Math.max(first, second) + 0.05) / (Math.min(first, second) + 0.05);
    }

    /** The painted background behind an element, or null when an image or gradient is in the way. */
    function backgroundBehind(element: Element): Rgba | null {
      const layers: Rgba[] = [];
      for (let node: Element | null = element; node; node = node.parentElement) {
        const style = getComputedStyle(node);
        if (style.backgroundImage !== "none") {
          return null;
        }
        const color = toRgba(style.backgroundColor);
        if (color[3] > 0) {
          layers.push(color);
          if (color[3] === 1) {
            break;
          }
        }
      }
      let result: Rgba = toRgba(getComputedStyle(document.documentElement).backgroundColor);
      if (result[3] === 0) {
        result = [255, 255, 255, 1];
      }
      for (const layer of layers.reverse()) {
        result = over(layer, result);
      }
      return result;
    }

    function describe(element: Element): string {
      const parts: string[] = [];
      for (let node: Element | null = element; node && parts.length < 3; node = node.parentElement) {
        const label = node.getAttribute("aria-label") ?? node.id;
        parts.unshift(`${node.tagName.toLowerCase()}${label ? `[${label}]` : ""}`);
      }
      return parts.join(" > ");
    }

    const failures: ContrastFailure[] = [];
    const root = document.querySelector(scopeSelector) ?? document.body;
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    const seen = new Set<Element>();

    for (let node = walker.nextNode(); node; node = walker.nextNode()) {
      const element = node.parentElement;
      if (!element || seen.has(element) || !node.textContent?.trim()) {
        continue;
      }
      seen.add(element);
      if (["SCRIPT", "STYLE", "NOSCRIPT"].includes(element.tagName)) {
        continue;
      }
      const style = getComputedStyle(element);
      const box = element.getBoundingClientRect();
      if (
        style.visibility === "hidden" ||
        style.display === "none" ||
        Number(style.opacity) === 0 ||
        box.width < 2 ||
        box.height < 2 ||
        element.closest("[disabled], [aria-disabled='true'], [inert], .sr-only")
      ) {
        continue;
      }
      // Clipped one-pixel text (sr-only) is not visible either.
      if (box.width <= 1 || box.height <= 1) {
        continue;
      }

      const background = backgroundBehind(element);
      if (!background) {
        continue;
      }
      const foreground = over(toRgba(style.color), background);
      const size = Number.parseFloat(style.fontSize);
      const bold = Number.parseInt(style.fontWeight, 10) >= 700;
      const large = size >= 24 || (bold && size >= 18.66);
      const needed = large ? 3 : 4.5;
      let measured = ratio(foreground, background);
      // Outlined lettering (the logo-style page titles): the outline is what separates the letters from
      // the page on a light background, and the fill does it on a dark one. Either one may carry the contrast.
      const outline = style.getPropertyValue("-webkit-text-stroke-width");
      if (Number.parseFloat(outline) > 0) {
        const stroke = over(toRgba(style.getPropertyValue("-webkit-text-stroke-color")), background);
        measured = Math.max(measured, ratio(stroke, background));
      }
      if (measured < needed) {
        failures.push({
          text: (node.textContent ?? "").trim().slice(0, 50),
          ratio: Math.round(measured * 100) / 100,
          needed,
          color: style.color,
          background: `rgb(${background.slice(0, 3).map(Math.round).join(", ")})`,
          path: describe(element),
        });
      }
    }
    return failures;
  }, scope);
}

export interface FocusFailure {
  step: number;
  element: string;
  reason: string;
}

/**
 * Presses Tab through the page and reports every stop that has no visible focus indicator
 * (an outline or a ring), plus any step where focus drops back to the page body.
 */
export async function auditFocusRings(page: Page, maxStops = 160): Promise<{ stops: number; failures: FocusFailure[] }> {
  const failures: FocusFailure[] = [];
  let stops = 0;
  let first: string | null = null;

  for (let step = 1; step <= maxStops; step += 1) {
    await page.keyboard.press("Tab");
    const result = await page.evaluate(() => {
      const element = document.activeElement;
      if (!element || element === document.body) {
        return { kind: "body" as const };
      }
      // The Next.js dev overlay is not part of the app and does not exist in a production build.
      if (element.tagName === "NEXTJS-PORTAL") {
        return { kind: "skip" as const };
      }
      const hasIndicator = (node: Element): boolean => {
        const style = getComputedStyle(node);
        const outline = style.outlineStyle !== "none" && Number.parseFloat(style.outlineWidth) > 0;
        const ring = style.boxShadow !== "none" && style.boxShadow !== "";
        return outline || ring;
      };
      // A visually hidden control (a checkbox inside a chip) shows focus on the label that wraps it.
      let indicated = hasIndicator(element);
      for (let node: Element | null = element.parentElement, depth = 0; !indicated && node && depth < 2; node = node.parentElement, depth += 1) {
        if (node.tagName === "LABEL" || node.tagName === "SUMMARY" || node.hasAttribute("data-focus-host")) {
          indicated = hasIndicator(node);
        }
      }
      const label = element.getAttribute("aria-label") ?? element.textContent?.trim().slice(0, 40) ?? "";
      return { kind: "element" as const, indicated, name: `${element.tagName.toLowerCase()} "${label}"` };
    });

    if (result.kind === "skip") {
      continue;
    }
    if (result.kind === "body") {
      // Tabbing past the last stop wraps to the browser UI. That ends the page's tab order.
      break;
    }
    if (first === null) {
      first = result.name;
    } else if (result.name === first && step > 2) {
      break;
    }
    stops += 1;
    if (!result.indicated) {
      failures.push({ step, element: result.name, reason: "No outline or ring when focused." });
    }
  }
  return { stops, failures };
}
