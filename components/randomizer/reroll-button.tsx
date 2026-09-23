"use client";

import { Shuffle } from "lucide-react";
import { Button } from "@/components/ui/button";

export function RerollButton({
  name,
  onClick,
}: {
  name: string;
  onClick: () => void;
}) {
  return (
    <div className="border-t border-border px-6 py-3">
      <Button
        type="button"
        variant="outline"
        size="sm"
        aria-label={`Re-roll ${name}`}
        onClick={onClick}
      >
        <Shuffle />
        Re-roll
      </Button>
    </div>
  );
}
