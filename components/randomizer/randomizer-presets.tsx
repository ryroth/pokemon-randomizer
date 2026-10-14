"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  deleteRandomizerPreset,
  parseStoredPresets,
  PRESET_STORAGE_KEY,
  saveRandomizerPreset,
  type RandomizerPreset,
} from "@/lib/randomizer/presets";
import type { RandomizerConfig } from "@/lib/types/randomizer";

const nameClass =
  "h-9 min-w-0 flex-1 rounded-lg border border-input bg-background px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

/**
 * Saved randomizer setups. A new randomization starts from the defaults; a preset puts a saved
 * setup back without setting every filter again.
 */
export function RandomizerPresets({
  config,
  onApply,
  onReset,
}: {
  config: RandomizerConfig;
  onApply: (config: RandomizerConfig) => void;
  onReset: () => void;
}) {
  const [presets, setPresets] = useState<RandomizerPreset[]>([]);
  const [ready, setReady] = useState(false);
  const [name, setName] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const raw = window.localStorage.getItem(PRESET_STORAGE_KEY);
    // localStorage is unavailable during SSR. Hydrate once after mount.
    /* eslint-disable react-hooks/set-state-in-effect -- one-time client hydrate */
    setPresets(raw ? parseStoredPresets(raw) : []);
    setReady(true);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  useEffect(() => {
    if (!ready) {
      return;
    }
    window.localStorage.setItem(PRESET_STORAGE_KEY, JSON.stringify(presets));
  }, [presets, ready]);

  function save() {
    const result = saveRandomizerPreset(presets, name, config);
    if (!result.ok) {
      setMessage(null);
      setError(result.message);
      return;
    }
    setPresets(result.presets);
    setName("");
    setError(null);
    setMessage(`Saved preset ${result.preset.name}.`);
  }

  return (
    <section aria-labelledby="randomizer-presets-heading" className="space-y-3 rounded-2xl border border-border bg-card p-4">
      <div className="space-y-1">
        <h2 id="randomizer-presets-heading" className="text-lg font-semibold">
          Presets
        </h2>
        <p className="text-sm leading-6 text-muted-foreground">
          A new randomization starts from the defaults. Save the randomizers and filters you use
          often, then load that preset instead of setting them again.
        </p>
      </div>
      <div className="flex flex-col gap-2 sm:flex-row">
        <label className="flex min-w-0 flex-1 flex-col gap-1 text-sm font-medium">
          Preset name
          <input
            className={nameClass}
            value={name}
            maxLength={24}
            onChange={(event) => setName(event.target.value)}
          />
        </label>
        <div className="flex flex-wrap items-end gap-2">
          <Button type="button" onClick={save} disabled={!ready}>
            Save preset
          </Button>
          <Button type="button" variant="outline" onClick={onReset}>
            Reset to defaults
          </Button>
        </div>
      </div>
      {ready && presets.length > 0 ? (
        <ul aria-label="Saved presets" className="flex flex-col gap-2">
          {presets.map((preset) => (
            <li key={preset.id} className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-sm font-medium">{preset.name}</span>
              <span className="flex gap-2">
                <Button type="button" size="sm" variant="outline" onClick={() => onApply(preset.config)}>
                  Use {preset.name}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setPresets(deleteRandomizerPreset(presets, preset.id));
                    setError(null);
                    setMessage(`Deleted preset ${preset.name}.`);
                  }}
                >
                  Delete {preset.name}
                </Button>
              </span>
            </li>
          ))}
        </ul>
      ) : null}
      {message ? (
        <p role="status" className="text-sm">
          {message}
        </p>
      ) : null}
      {error ? (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}
    </section>
  );
}
