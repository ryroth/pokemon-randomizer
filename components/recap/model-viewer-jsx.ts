/* eslint-disable @typescript-eslint/no-namespace -- JSX element types are declared as namespaces */
import type { DetailedHTMLProps, HTMLAttributes } from "react";
import type { ModelViewerElement } from "@google/model-viewer";

type ModelViewerProps = DetailedHTMLProps<HTMLAttributes<ModelViewerElement>, ModelViewerElement> & {
  src?: string;
  alt?: string;
  autoplay?: boolean;
  "animation-name"?: string;
  "camera-controls"?: boolean;
  "disable-pan"?: boolean;
  "interaction-prompt"?: "auto" | "none" | "when-focused";
  "environment-image"?: string;
  "shadow-intensity"?: string;
  exposure?: string;
};

declare module "react" {
  namespace JSX {
    interface IntrinsicElements {
      "model-viewer": ModelViewerProps;
    }
  }
}

declare global {
  namespace JSX {
    interface IntrinsicElements {
      "model-viewer": ModelViewerProps;
    }
  }
}

export type { ModelViewerElement };
