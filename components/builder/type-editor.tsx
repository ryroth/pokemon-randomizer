"use client";

import { useState } from "react";
import { TypeBadge } from "@/components/recap/type-badge";
import { POKEMON_TYPES, TYPE_LABELS, type PokemonType } from "@/lib/types/pokemon-type";

/**
 * One or two battle types for this set. Empty secondary means a single type.
 * The species typing is restored by clearing the override.
 */
export function TypeEditor({
  speciesTypes,
  customTypes,
  onChange,
  namePrefix = "type",
  changing = true,
  onChanging,
}: {
  speciesTypes: readonly PokemonType[];
  customTypes: readonly PokemonType[] | undefined;
  onChange: (types: PokemonType[] | undefined) => void;
  namePrefix?: string;
  /** When `onChanging` is set, the type picker stays hidden until `changing` is on. */
  changing?: boolean;
  onChanging?: (enabled: boolean) => void;
}) {
  const active = customTypes ?? speciesTypes;
  const primary = active[0];
  const secondary = customTypes ? customTypes[1] : speciesTypes[1];
  const duplicateMessage =
    "A Pokémon cannot have the same type twice. Pick a different second type, or leave it empty.";
  const [notice, setNotice] = useState<string | null>(null);
  const pickerOpen = onChanging ? changing : true;
  const speciesLine = `Using ${speciesTypes.map((type) => TYPE_LABELS[type]).join(" / ")}, this Pokémon's usual typing.`;

  function choosePrimary(type: PokemonType) {
    const nextSecondary = secondary && secondary !== type ? secondary : undefined;
    setNotice(null);
    onChange(nextSecondary ? [type, nextSecondary] : [type]);
  }

  function chooseSecondary(type: PokemonType | undefined) {
    if (!primary) {
      return;
    }
    if (type && type === primary) {
      setNotice(duplicateMessage);
      return;
    }
    setNotice(null);
    onChange(type ? [primary, type] : [primary]);
  }

  return (
    <section id={`${namePrefix}-typing`} tabIndex={-1} className="scroll-mt-24 space-y-3 outline-none">
      <h2 className="text-lg font-medium">Typing</h2>
      {onChanging ? (
        <label className="flex items-center gap-2 text-sm font-medium">
          <input
            type="checkbox"
            checked={changing}
            onChange={(event) => onChanging(event.target.checked)}
          />
          Change this Pokémon&apos;s typing
        </label>
      ) : null}
      {pickerOpen ? (
        <>
          <p className="text-sm text-muted-foreground">
            {customTypes
              ? "This set uses the types you pick. The species entry stays the same."
              : speciesLine}
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="rounded-lg border border-border px-3 py-2 text-sm hover:bg-muted focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              onClick={() => onChange(undefined)}
            >
              Use species typing
            </button>
          </div>
          <fieldset className="space-y-2">
            <legend className="text-sm font-medium">Primary type</legend>
            <div className="flex flex-wrap gap-2">
              {POKEMON_TYPES.map((type) => (
                <label key={type} className="relative cursor-pointer rounded-full focus-within:ring-3 focus-within:ring-ring/50">
                  <input
                    className="absolute inset-0 cursor-pointer opacity-0"
                    type="radio"
                    name={`${namePrefix}-primary-type`}
                    checked={primary === type && customTypes !== undefined}
                    onChange={() => choosePrimary(type)}
                  />
                  <span className={primary === type && customTypes ? "inline-flex rounded-full ring-2 ring-ring ring-offset-2" : "inline-flex rounded-full"}>
                    <TypeBadge type={type} />
                  </span>
                </label>
              ))}
            </div>
          </fieldset>
          <fieldset className="space-y-2">
            <legend className="text-sm font-medium">Second type</legend>
            <div className="flex flex-wrap gap-2">
              <label className="relative cursor-pointer text-sm">
                <input
                  className="absolute inset-0 cursor-pointer opacity-0"
                  type="radio"
                  name={`${namePrefix}-secondary-type`}
                  checked={customTypes !== undefined && secondary === undefined}
                  onChange={() => chooseSecondary(undefined)}
                />
                <span className="inline-flex rounded-full border border-border px-2.5 py-0.5">None</span>
              </label>
              {POKEMON_TYPES.map((type) => (
                <label key={type} className="relative cursor-pointer rounded-full focus-within:ring-3 focus-within:ring-ring/50">
                  <input
                    className="absolute inset-0 cursor-pointer opacity-0"
                    type="radio"
                    name={`${namePrefix}-secondary-type`}
                    checked={customTypes !== undefined && secondary === type}
                    onChange={() => chooseSecondary(type)}
                  />
                  <span className={secondary === type && customTypes ? "inline-flex rounded-full ring-2 ring-ring ring-offset-2" : "inline-flex rounded-full opacity-90"}>
                    <TypeBadge type={type} />
                  </span>
                </label>
              ))}
            </div>
          </fieldset>
          {notice ? (
            <p role="alert" className="text-sm text-destructive">
              {notice}
            </p>
          ) : null}
        </>
      ) : (
        <p className="text-sm text-muted-foreground">{speciesLine}</p>
      )}
    </section>
  );
}
