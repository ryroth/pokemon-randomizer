"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { BaseStatEditor } from "@/components/builder/base-stat-editor";
import { NumberInput } from "@/components/builder/number-input";
import { TypeEditor } from "@/components/builder/type-editor";
import { SinglesMatch } from "@/components/formats/singles-match";
import { useFormatLibrary } from "@/components/formats/use-format-library";
import { PageFrame } from "@/components/layout/page-frame";
import { RouteNotice } from "@/components/layout/route-notice";
import { TypeBadge } from "@/components/recap/type-badge";
import { useTeams } from "@/components/teams/team-provider";
import { Button, buttonVariants } from "@/components/ui/button";
import { battleStatLine, strikeDamage, type StrikeResult } from "@/lib/battle/damage";
import { prepareBattle, validateTeamAgainstFormat, type StagedPokemon } from "@/lib/battle/prepare";
import {
  blankFormat,
  customizeFormat,
  findFormat,
  formatChanges,
  parentDrift,
  resetFormatField,
  resetFormatToParent,
  saveFormat,
  type EditableFormatField,
} from "@/lib/formats/library";
import {
  LAST_FORMAT_STORAGE_KEY,
  MAX_FORMAT_TEAM_SIZE,
  MIN_FORMAT_TEAM_SIZE,
  rulesThisAppChecks,
  type BattleFormat,
} from "@/lib/formats/schema";
import type { Nature } from "@/lib/types/catalog-entities";
import type { PokemonType } from "@/lib/types/pokemon-type";
import type { PokemonSet } from "@/lib/types/session";
import { EMPTY_EVS, PERFECT_IVS, STAT_LABELS, type StatId, type StatSpread } from "@/lib/types/stats";
import { DEFAULT_LEVEL, MAX_LEVEL, MIN_LEVEL } from "@/lib/validation/details";
import { cn } from "@/lib/utils";

const fieldClass =
  "h-9 w-full rounded-lg border border-input bg-background px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

export interface BattleSpeciesOption {
  id: string;
  displayName: string;
  speciesId: string;
  types: PokemonType[];
  baseStats: StatSpread;
}

export interface BattleMoveOption {
  id: string;
  name: string;
  type: PokemonType;
  category: "physical" | "special";
  power: number;
  pp?: number;
}

interface SideState {
  speciesId: string;
  customTypes?: PokemonType[];
  customBaseStats?: StatSpread;
  level: number;
  ivs: StatSpread;
  evs: StatSpread;
  plusStat: StatId | null;
  minusStat: StatId | null;
  moveId: string;
}

export function BattleLab({
  initialFormatId,
  customize,
  species,
  moves,
  statusMoves,
  abilities,
  items,
  natures,
}: {
  initialFormatId: string;
  customize: boolean;
  species: readonly BattleSpeciesOption[];
  moves: readonly BattleMoveOption[];
  statusMoves: readonly { id: string; name: string }[];
  abilities: readonly { id: string; name: string }[];
  items: readonly { id: string; name: string }[];
  natures: readonly Nature[];
}) {
  const { library, ready, commit } = useFormatLibrary();
  const { box } = useTeams();
  const booted = useRef(false);
  const [draft, setDraft] = useState<BattleFormat | null>(null);
  const [selectedId, setSelectedId] = useState(initialFormatId || "open-lab");
  const [attacker, setAttacker] = useState<SideState>(emptySide);
  const [defender, setDefender] = useState<SideState>(emptySide);
  const [result, setResult] = useState<StrikeResult | null>(null);
  const [battleId, setBattleId] = useState<string | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [teamNote, setTeamNote] = useState<string | null>(null);
  const [savedNote, setSavedNote] = useState<string | null>(null);

  useEffect(() => {
    if (!ready || booted.current) {
      return;
    }
    booted.current = true;
    /* eslint-disable react-hooks/set-state-in-effect -- apply the format from the URL once storage is loaded */
    if (customize) {
      const parent = initialFormatId ? findFormat(library, initialFormatId) : undefined;
      setDraft(parent ? customizeFormat(parent) : blankFormat());
      return;
    }
    const requested = initialFormatId ? findFormat(library, initialFormatId) : undefined;
    if (requested) {
      setSelectedId(requested.id);
      return;
    }
    const last = window.localStorage.getItem(LAST_FORMAT_STORAGE_KEY);
    if (last && findFormat(library, last)) {
      setSelectedId(last);
    }
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [ready, library, customize, initialFormatId]);

  const active = draft ?? findFormat(library, selectedId) ?? findFormat(library, "open-lab");
  const parent = active?.parentId ? findFormat(library, active.parentId) : undefined;
  const changes = active && parent ? formatChanges(active, parent) : [];

  const speciesById = useMemo(() => new Map(species.map((form) => [form.id, form])), [species]);

  if (!ready || !active) {
    return <RouteNotice title="Battle Lab" message="Loading formats…" live />;
  }

  function stage(side: SideState): StagedPokemon | null {
    const form = speciesById.get(side.speciesId);
    if (!form) {
      return null;
    }
    return {
      speciesId: form.speciesId,
      speciesName: form.displayName,
      speciesTypes: form.types,
      speciesBase: form.baseStats,
      customTypes: side.customTypes,
      customBaseStats: side.customBaseStats,
      level: side.level,
      ivs: side.ivs,
      evs: side.evs,
      plusStat: side.plusStat,
      minusStat: side.minusStat,
    };
  }

  function runCheck() {
    setResult(null);
    setBattleId(null);
    const left = stage(attacker);
    const right = stage(defender);
    const move = moves.find((entry) => entry.id === attacker.moveId);
    if (!left || !right) {
      setErrors(["Choose an attacking Pokémon and a defending Pokémon."]);
      setWarnings([]);
      return;
    }
    if (!move) {
      setErrors(["Choose a damaging move."]);
      setWarnings([]);
      return;
    }
    const prepared = prepareBattle({
      battleId: createBattleId(),
      format: active!,
      attacker: left,
      defender: right,
    });
    if (!prepared.ok) {
      setErrors(prepared.errors.map((error) => error.message));
      setWarnings([]);
      return;
    }
    const strike = strikeDamage(prepared.snapshot, move);
    if ("error" in strike) {
      setErrors([strike.error]);
      setWarnings(prepared.warnings);
      return;
    }
    setErrors([]);
    setWarnings(prepared.warnings);
    setResult(strike);
    setBattleId(prepared.snapshot.battleId);
    if (active!.id) {
      window.localStorage.setItem(LAST_FORMAT_STORAGE_KEY, active!.id);
    }
  }

  function checkTeam() {
    const team = box.teams.find((entry) => entry.id === box.activeTeamId) ?? null;
    if (!team || team.sets.length === 0) {
      setTeamNote("Save a team first, then check it against this format.");
      return;
    }
    const issues = validateTeamAgainstFormat(team.sets, active!, (pokemonId) => speciesById.get(pokemonId)?.speciesId);
    setTeamNote(issues.length === 0 ? `${team.name} matches the rules this app checks.` : issues.map((issue) => issue.message).join(" "));
  }

  function useActiveTeam() {
    const team = box.teams.find((entry) => entry.id === box.activeTeamId) ?? null;
    if (!team || team.sets.length < 2) {
      setTeamNote("The damage check needs two Pokémon. Save at least two on the active team, or pick them below.");
      return;
    }
    setAttacker(sideFromSet(team.sets[0]!, natures));
    setDefender(sideFromSet(team.sets[1]!, natures));
    setTeamNote(`Using the first two Pokémon from ${team.name}.`);
  }

  function saveDraft() {
    if (!draft) {
      return;
    }
    const saved = saveFormat(library, draft);
    if (!saved.ok) {
      setErrors(saved.errors.map((error) => error.message));
      return;
    }
    commit(saved.library);
    setDraft(saved.format);
    setSelectedId(saved.format.id);
    setErrors([]);
    setSavedNote(`Saved ${saved.format.name}. The original preset was not changed.`);
  }

  return (
    <PageFrame width="wide" className="gap-8">
      <header className="hero-panel max-w-3xl space-y-3">
        <p className="text-sm font-medium uppercase tracking-[0.18em] text-primary">Battle</p>
        <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">Battle Lab</h1>
        <p className="text-lg leading-8 text-muted-foreground">
          Pick a format, change a copy of it, then preview one hit or play singles. Custom types and
          base stats are copied onto that fight only. The species list is not edited.
        </p>
        <div className="flex flex-wrap gap-2">
          <Link href="/formats" className={cn(buttonVariants({ variant: "outline" }))}>
            Browse formats
          </Link>
          <Button type="button" variant="outline" onClick={() => setDraft(customizeFormat(active))}>
            Customize this format
          </Button>
          <Button type="button" variant="outline" onClick={() => setDraft(blankFormat())}>
            Start from scratch
          </Button>
        </div>
      </header>

      <section aria-labelledby="format-pick-heading" className="space-y-3">
        <h2 id="format-pick-heading" className="text-xl font-medium">
          Format
        </h2>
        {draft ? (
          <FormatDraftEditor
            draft={draft}
            parent={parent}
            changes={changes}
            drift={parentDrift(draft, library)}
            onChange={setDraft}
            onResetField={(field) => {
              if (parent) {
                setDraft(resetFormatField(draft, parent, field));
              }
            }}
            onResetAll={() => {
              if (parent) {
                setDraft(resetFormatToParent(draft, parent));
              }
            }}
            onSave={saveDraft}
            onDiscard={() => setDraft(null)}
          />
        ) : (
          <label className="block max-w-md space-y-1.5 text-sm font-medium">
            Selected format
            <select
              className={fieldClass}
              value={active.id}
              onChange={(event) => {
                setSelectedId(event.target.value);
                setResult(null);
              }}
            >
              <optgroup label="Built in">
                {findBuiltIn().map((format) => (
                  <option key={format.id} value={format.id}>
                    {format.name}
                  </option>
                ))}
              </optgroup>
              {library.records.length > 0 ? (
                <optgroup label="Yours">
                  {library.records.map((record) => (
                    <option key={record.current.id} value={record.current.id}>
                      {record.current.name}
                    </option>
                  ))}
                </optgroup>
              ) : null}
            </select>
          </label>
        )}
        {savedNote ? (
          <p role="status" className="text-sm">
            {savedNote}
          </p>
        ) : null}
        <div className="rounded-xl border border-border bg-card/90 p-4 text-sm">
          <p className="font-medium">{active.name || "Unnamed format"}</p>
          <ul className="mt-2 list-disc space-y-1 pl-4 text-muted-foreground">
            {rulesThisAppChecks(active).map((rule) => (
              <li key={rule}>{rule}</li>
            ))}
          </ul>
        </div>
      </section>

      <section aria-labelledby="team-check-heading" className="space-y-3">
        <h2 id="team-check-heading" className="text-xl font-medium">
          Team
        </h2>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" onClick={checkTeam}>
            Check the active team
          </Button>
          <Button type="button" variant="outline" onClick={useActiveTeam}>
            Use the first two Pokémon
          </Button>
        </div>
        {teamNote ? <p role="status" className="text-sm">{teamNote}</p> : null}
      </section>

      <section aria-labelledby="damage-heading" className="space-y-4">
        <h2 id="damage-heading" className="text-xl font-medium">
          Damage check
        </h2>
        <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
          One single-target hit with generation 9 math. Same-type bonus and type matchups use the
          types on this check. The defender&apos;s move is only for the singles battle below. Abilities,
          items, weather, and critical hits are left out of this preview.
        </p>
        <div className="grid gap-4 lg:grid-cols-2">
          <SideEditor
            title="Attacker"
            side={attacker}
            species={species}
            moves={moves}
            natures={natures}
            format={active}
            showMove
            onChange={setAttacker}
          />
          <SideEditor
            title="Defender"
            side={defender}
            species={species}
            moves={moves}
            natures={natures}
            format={active}
            showMove
            onChange={setDefender}
          />
        </div>
        <Button type="button" onClick={runCheck}>
          Preview this hit
        </Button>
        {errors.length > 0 ? (
          <ul role="alert" className="list-disc space-y-1 rounded-xl border border-destructive/40 bg-card px-6 py-3 text-sm">
            {errors.map((error) => (
              <li key={error}>{error}</li>
            ))}
          </ul>
        ) : null}
        {warnings.map((warning) => (
          <p key={warning} className="text-sm">
            {warning}
          </p>
        ))}
        {result && battleId ? <DamageReport result={result} battleId={battleId} attacker={attacker} defender={defender} speciesById={speciesById} /> : null}
      </section>

      <SinglesMatch
        format={active}
        attacker={attacker}
        defender={defender}
        species={species}
        moves={moves}
        statusMoves={statusMoves}
        abilities={abilities}
        items={items}
        natures={natures}
      />
    </PageFrame>
  );
}

function FormatDraftEditor({
  draft,
  parent,
  changes,
  drift,
  onChange,
  onResetField,
  onResetAll,
  onSave,
  onDiscard,
}: {
  draft: BattleFormat;
  parent: BattleFormat | undefined;
  changes: ReturnType<typeof formatChanges>;
  drift: string | null;
  onChange: (format: BattleFormat) => void;
  onResetField: (field: EditableFormatField) => void;
  onResetAll: () => void;
  onSave: () => void;
  onDiscard: () => void;
}) {
  return (
    <form
      className="space-y-4 rounded-xl border border-border bg-card/90 p-4"
      onSubmit={(event) => {
        event.preventDefault();
        onSave();
      }}
    >
      <p className="text-sm text-muted-foreground">
        {parent
          ? `You are editing a copy of ${parent.name}. Saving writes a new format.`
          : "You are writing a format from scratch. Saving does not change any preset."}
      </p>
      {drift ? <p className="text-sm">{drift}</p> : null}
      <label className="block space-y-1.5 text-sm font-medium">
        Name
        <input
          className={fieldClass}
          value={draft.name}
          onChange={(event) => onChange({ ...draft, name: event.target.value })}
        />
      </label>
      <label className="block space-y-1.5 text-sm font-medium">
        Description
        <textarea
          className="min-h-20 w-full rounded-lg border border-input bg-background px-2.5 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          value={draft.description}
          onChange={(event) => onChange({ ...draft, description: event.target.value })}
        />
      </label>
      <fieldset className="space-y-2">
        <legend className="text-sm font-medium">Shiny Pokémon</legend>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="radio"
            name="shiny-policy"
            checked={draft.shinyPolicy === "allowed"}
            onChange={() => onChange({ ...draft, shinyPolicy: "allowed" })}
          />
          Allowed
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="radio"
            name="shiny-policy"
            checked={draft.shinyPolicy === "forbidden"}
            onChange={() => onChange({ ...draft, shinyPolicy: "forbidden" })}
          />
          Not allowed
        </label>
      </fieldset>
      <fieldset className="space-y-2">
        <legend className="text-sm font-medium">Typing</legend>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="radio"
            name="type-policy"
            checked={draft.typePolicy === "species"}
            onChange={() => onChange({ ...draft, typePolicy: "species" })}
          />
          Species typing
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="radio"
            name="type-policy"
            checked={draft.typePolicy === "custom"}
            onChange={() => onChange({ ...draft, typePolicy: "custom" })}
          />
          Custom typing
        </label>
      </fieldset>
      <fieldset className="space-y-2">
        <legend className="text-sm font-medium">Base stats</legend>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="radio"
            name="stat-policy"
            checked={draft.statPolicy === "species"}
            onChange={() => onChange({ ...draft, statPolicy: "species", statBudget: null })}
          />
          Species base stats
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="radio"
            name="stat-policy"
            checked={draft.statPolicy === "custom"}
            onChange={() => onChange({ ...draft, statPolicy: "custom" })}
          />
          Custom base stats
        </label>
      </fieldset>
      <details className="space-y-3">
        <summary className="cursor-pointer text-sm font-medium">More rules</summary>
        <div className="space-y-3 pt-3">
          <fieldset className="space-y-2">
            <legend className="text-sm font-medium">Structure</legend>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                name="structure"
                checked={draft.structure === "singles"}
                onChange={() => onChange({ ...draft, structure: "singles" })}
              />
              Singles
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                name="structure"
                checked={draft.structure === "doubles"}
                onChange={() => onChange({ ...draft, structure: "doubles" })}
              />
              Doubles
            </label>
          </fieldset>
          <label className="block max-w-40 space-y-1.5 text-sm font-medium">
            Team size
            <NumberInput
              aria-label="Team size"
              className={fieldClass}
              min={MIN_FORMAT_TEAM_SIZE}
              max={MAX_FORMAT_TEAM_SIZE}
              value={draft.teamSize}
              onCommit={(value) => onChange({ ...draft, teamSize: value })}
            />
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={draft.speciesClause}
              onChange={(event) => onChange({ ...draft, speciesClause: event.target.checked })}
            />
            Species Clause
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={draft.itemClause}
              onChange={(event) => onChange({ ...draft, itemClause: event.target.checked })}
            />
            Item Clause
          </label>
          {draft.statPolicy === "custom" ? (
            <div className="grid gap-3 sm:grid-cols-3">
              <label className="space-y-1 text-sm font-medium">
                Minimum stat
                <NumberInput
                  aria-label="Minimum base stat"
                  className={fieldClass}
                  min={1}
                  max={255}
                  value={draft.statMin}
                  onCommit={(value) => onChange({ ...draft, statMin: value })}
                />
              </label>
              <label className="space-y-1 text-sm font-medium">
                Maximum stat
                <NumberInput
                  aria-label="Maximum base stat"
                  className={fieldClass}
                  min={1}
                  max={255}
                  value={draft.statMax}
                  onCommit={(value) => onChange({ ...draft, statMax: value })}
                />
              </label>
              <label className="space-y-1 text-sm font-medium">
                Total budget
                <input
                  aria-label="Base stat budget"
                  className={fieldClass}
                  inputMode="numeric"
                  value={draft.statBudget ?? ""}
                  placeholder="No budget"
                  onChange={(event) => {
                    const raw = event.target.value.trim();
                    onChange({ ...draft, statBudget: raw === "" ? null : Number(raw) });
                  }}
                />
              </label>
            </div>
          ) : null}
          {parent ? (
            <div>
              <h3 className="text-sm font-medium">Inherited, not edited</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Generation {parent.generation}, mod {parent.mod}. Clauses: {parent.clauses.join(", ") || "none"}.
                Banlist entries stay on the card and are not checked.
              </p>
            </div>
          ) : null}
        </div>
      </details>
      <div>
        <h3 className="text-sm font-medium">Changes from the preset</h3>
        {changes.length === 0 ? (
          <p className="mt-1 text-sm text-muted-foreground">No rule changes yet.</p>
        ) : (
          <ul className="mt-2 space-y-1 text-sm">
            {changes.map((change) => (
              <li key={change.field} className="flex flex-wrap items-center gap-2">
                <span>
                  {change.label}: {change.from} → {change.to}
                </span>
                {parent ? (
                  <button
                    type="button"
                    className="underline underline-offset-2"
                    onClick={() => onResetField(change.field as EditableFormatField)}
                  >
                    Reset
                  </button>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        <Button type="submit">Save format</Button>
        {parent ? (
          <Button type="button" variant="outline" onClick={onResetAll}>
            Reset all changes
          </Button>
        ) : null}
        <Button type="button" variant="outline" onClick={onDiscard}>
          Discard this draft
        </Button>
      </div>
    </form>
  );
}

function SideEditor({
  title,
  side,
  species,
  moves,
  natures,
  format,
  showMove,
  onChange,
}: {
  title: string;
  side: SideState;
  species: readonly BattleSpeciesOption[];
  moves: readonly BattleMoveOption[];
  natures: readonly Nature[];
  format: BattleFormat;
  showMove: boolean;
  onChange: (side: SideState) => void;
}) {
  const form = species.find((entry) => entry.id === side.speciesId);
  return (
    <div className="space-y-3 rounded-xl border border-border bg-card/90 p-4">
      <h3 className="text-lg font-medium">{title}</h3>
      <SpeciesSearch
        label={`${title} Pokémon`}
        species={species}
        selectedId={side.speciesId}
        onSelect={(speciesId) =>
          onChange({
            ...emptySide(),
            speciesId,
            level: side.level,
          })
        }
      />
      {form ? (
        <>
          <p className="flex flex-wrap gap-1.5">
            {(side.customTypes ?? form.types).map((type) => (
              <TypeBadge key={type} type={type} />
            ))}
          </p>
          <label className="block max-w-32 space-y-1 text-sm font-medium">
            Level
            <NumberInput
              aria-label={`${title} level`}
              className={fieldClass}
              min={MIN_LEVEL}
              max={MAX_LEVEL}
              value={side.level}
              onCommit={(level) => onChange({ ...side, level })}
            />
          </label>
          <label className="block space-y-1 text-sm font-medium">
            Nature
            <select
              className={fieldClass}
              value={natures.find((nature) => nature.plusStat === side.plusStat && nature.minusStat === side.minusStat)?.id ?? ""}
              onChange={(event) => {
                const nature = natures.find((entry) => entry.id === event.target.value);
                onChange({
                  ...side,
                  plusStat: nature?.plusStat ?? null,
                  minusStat: nature?.minusStat ?? null,
                });
              }}
            >
              <option value="">Neutral</option>
              {natures
                .filter((nature) => nature.plusStat && nature.minusStat)
                .map((nature) => (
                  <option key={nature.id} value={nature.id}>
                    {nature.name}
                  </option>
                ))}
            </select>
          </label>
          {format.typePolicy === "custom" ? (
            <TypeEditor
              namePrefix={title}
              speciesTypes={form.types}
              customTypes={side.customTypes}
              onChange={(customTypes) => onChange({ ...side, customTypes })}
            />
          ) : (
            <p className="text-sm text-muted-foreground">This format uses species typing.</p>
          )}
          {format.statPolicy === "custom" ? (
            <BaseStatEditor
              idPrefix={title}
              species={form.baseStats}
              custom={side.customBaseStats}
              onChange={(stat, value) => {
                const next = { ...(side.customBaseStats ?? form.baseStats), [stat]: value };
                const matches = (Object.keys(form.baseStats) as StatId[]).every((key) => next[key] === form.baseStats[key]);
                onChange({ ...side, customBaseStats: matches ? undefined : next });
              }}
              onReset={() => onChange({ ...side, customBaseStats: undefined })}
            />
          ) : (
            <p className="text-sm text-muted-foreground">
              Species base stats: {STAT_LABELS.hp} {form.baseStats.hp}, {STAT_LABELS.atk} {form.baseStats.atk},{" "}
              {STAT_LABELS.def} {form.baseStats.def}, {STAT_LABELS.spa} {form.baseStats.spa}, {STAT_LABELS.spd}{" "}
              {form.baseStats.spd}, {STAT_LABELS.spe} {form.baseStats.spe}.
            </p>
          )}
          {showMove ? (
            <MoveSearch
              label={`${title} move`}
              moves={moves}
              selectedId={side.moveId}
              onSelect={(moveId) => onChange({ ...side, moveId })}
            />
          ) : null}
        </>
      ) : (
        <p className="text-sm text-muted-foreground">Search for a Pokémon.</p>
      )}
    </div>
  );
}

function SpeciesSearch({
  label,
  species,
  selectedId,
  onSelect,
}: {
  label: string;
  species: readonly BattleSpeciesOption[];
  selectedId: string;
  onSelect: (id: string) => void;
}) {
  const [query, setQuery] = useState("");
  const selected = species.find((entry) => entry.id === selectedId);
  const needle = query.trim().toLowerCase();
  const matches = needle
    ? species.filter((entry) => entry.displayName.toLowerCase().includes(needle)).slice(0, 8)
    : [];
  return (
    <div className="space-y-2">
      <label className="block space-y-1.5 text-sm font-medium">
        {label}
        <input
          className={fieldClass}
          value={query}
          placeholder={selected ? selected.displayName : "Type a name"}
          onChange={(event) => setQuery(event.target.value)}
        />
      </label>
      {selected ? <p className="text-sm">Selected {selected.displayName}.</p> : null}
      {matches.length > 0 ? (
        <ul className="max-h-48 overflow-auto rounded-lg border border-border">
          {matches.map((entry) => (
            <li key={entry.id}>
              <button
                type="button"
                className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm hover:bg-muted focus-visible:bg-muted"
                onClick={() => {
                  onSelect(entry.id);
                  setQuery("");
                }}
              >
                {entry.displayName}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

function MoveSearch({
  label,
  moves,
  selectedId,
  onSelect,
}: {
  label: string;
  moves: readonly BattleMoveOption[];
  selectedId: string;
  onSelect: (id: string) => void;
}) {
  const [query, setQuery] = useState("");
  const selected = moves.find((move) => move.id === selectedId);
  const needle = query.trim().toLowerCase();
  const matches = needle
    ? moves.filter((move) => move.name.toLowerCase().includes(needle)).slice(0, 8)
    : [];
  return (
    <div className="space-y-2">
      <label className="block space-y-1.5 text-sm font-medium">
        {label}
        <input
          className={fieldClass}
          value={query}
          placeholder={selected ? selected.name : "Type a move"}
          onChange={(event) => setQuery(event.target.value)}
        />
      </label>
      {selected ? (
        <p className="text-sm">
          {selected.name}, power {selected.power}. Any catalog move can be used here, not only a learnset.
        </p>
      ) : null}
      {matches.length > 0 ? (
        <ul className="max-h-48 overflow-auto rounded-lg border border-border">
          {matches.map((move) => (
            <li key={move.id}>
              <button
                type="button"
                className="flex w-full px-3 py-2 text-left text-sm hover:bg-muted focus-visible:bg-muted"
                onClick={() => {
                  onSelect(move.id);
                  setQuery("");
                }}
              >
                {move.name}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

function DamageReport({
  result,
  battleId,
  attacker,
  defender,
  speciesById,
}: {
  result: StrikeResult;
  battleId: string;
  attacker: SideState;
  defender: SideState;
  speciesById: Map<string, BattleSpeciesOption>;
}) {
  const left = speciesById.get(attacker.speciesId);
  const right = speciesById.get(defender.speciesId);
  const leftStats = left
    ? battleStatLine({
        speciesId: left.speciesId,
        speciesName: left.displayName,
        types: attacker.customTypes ?? [...left.types],
        baseStats: attacker.customBaseStats ?? { ...left.baseStats },
        level: attacker.level,
        ivs: attacker.ivs,
        evs: attacker.evs,
        plusStat: attacker.plusStat,
        minusStat: attacker.minusStat,
      })
    : [];
  return (
    <div role="status" className="space-y-2 rounded-xl border border-border bg-card/90 p-4">
      <h3 className="text-lg font-medium">{result.immune ? "No damage" : `${result.minDamage}–${result.maxDamage} damage`}</h3>
      <p className="text-sm">{result.note}</p>
      <p className="text-sm">
        {result.stab ? "Same-type bonus applies." : "No same-type bonus."} Effectiveness {result.effectiveness}×.
        Attack stat {result.attackStat}, defense stat {result.defenseStat}.
      </p>
      {left && right ? (
        <p className="text-sm text-muted-foreground">
          {left.displayName} into {right.displayName}. This check is battle {battleId} and does not change any other battle.
        </p>
      ) : null}
      {leftStats.length > 0 ? (
        <p className="font-mono text-sm tabular-nums">
          Attacker battle stats: {leftStats.map((stat) => `${STAT_LABELS[stat.stat]} ${stat.value}`).join(", ")}
        </p>
      ) : null}
    </div>
  );
}

function emptySide(): SideState {
  return {
    speciesId: "",
    level: DEFAULT_LEVEL,
    ivs: { ...PERFECT_IVS },
    evs: { ...EMPTY_EVS },
    plusStat: null,
    minusStat: null,
    moveId: "",
  };
}

function sideFromSet(set: PokemonSet, natures: readonly Nature[]): SideState {
  const nature = natures.find((entry) => entry.id === set.natureId);
  return {
    speciesId: set.pokemonId,
    customTypes: set.customTypes ? [...set.customTypes] : undefined,
    customBaseStats: set.customBaseStats ? { ...set.customBaseStats } : undefined,
    level: set.level,
    ivs: { ...set.ivs },
    evs: { ...set.evs },
    plusStat: nature?.plusStat ?? null,
    minusStat: nature?.minusStat ?? null,
    moveId: set.moveIds[0] ?? "",
  };
}

function findBuiltIn(): BattleFormat[] {
  return ["gen9ou", "gen9ubers", "gen9monotype", "gen9anythinggoes", "gen9doublesou", "gen9nationaldex", "gen9randombattle", "gen9customgame", "open-lab"].flatMap(
    (id) => {
      const format = findFormat({ records: [], preserved: [] }, id);
      return format ? [format] : [];
    },
  );
}

function createBattleId(): string {
  const cryptoApi = globalThis.crypto;
  if (cryptoApi && typeof cryptoApi.randomUUID === "function") {
    return cryptoApi.randomUUID();
  }
  return `battle-${Date.now().toString(36)}`;
}
