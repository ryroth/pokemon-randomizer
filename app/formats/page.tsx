import type { Metadata } from "next";
import { FormatExplorer } from "@/components/formats/format-explorer";

export const metadata: Metadata = {
  title: "Formats",
};

export default function FormatsPage() {
  return <FormatExplorer />;
}
