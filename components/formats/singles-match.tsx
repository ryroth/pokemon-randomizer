"use client";

import { useState } from "react";
import { useTeams } from "@/components/teams/team-provider";
import { Button } from "@/components/ui/button";
import { prepareBattle, validateTeamAgainstFormat, type StagedPokemon } from "@/lib/battle/prepare";
import {
  clearSinglesChoice,
  createSinglesBattle,
  sideMustAct,
  submitSinglesChoice,
  type SinglesBattle,
  type SinglesChoice,
  type SinglesFighter,
  type SinglesFighterInput,
  type SinglesSide,
} from "@/lib/battle/singles";
import type { BattleFormat } from "@/lib/formats/schema";
import { effectiveBaseStats, effectiveTypes } from "@/lib/pokemon/customAttributes";
import { createSeed } from "@/lib/randomizer/randomUtils";
import type { Nature } from "@/lib/types/catalog-entities";
import type { PokemonType } from "@/lib/types/pokemon-type";
import type { PokemonSet } from "@/lib/types/session";
import type { StatId, StatSpread } from "@/lib/types/stats";

const fieldClass =
  "h-9 w-full rounded-lg border border-input bg-background px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

const ABILITY_OPTIONS = [
  { id: "", name: "No ability applied" },
  { id: "levitate", name: "Levitate" },
  { id: "hugepower", name: "Huge Power" },
  { id: "purepower", name: "Pure Power" },
] as const;

const ITEM_OPTIONS = [
  { id: "", name: "No item" },
  { id: "choiceband", name: "Choice Band" },
  { id: "choicespecs", name: "Choice Specs" },
  { id: "choicescarf", name: "Choice Scarf" },
  { id: "lifeorb", name: "Life Orb" },
] as const;

interface CatalogSpecies {
  id: string;
  displayName: string;
  speciesId: string;
  types: PokemonType[];
  baseStats: StatSpread;
}

interface CatalogMove {
  id: string;
  name: string;
  type: PokemonType;
  category: "physical" | "special";
  power: number;
  pp?: number;
}

export interface StagedBattleSide {
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

export function SinglesMatch({
  format,
  attacker,
  defender,
  species,
  moves,
  statusMoves,
  abilities,
  items,
  natures,
}: {
  format: BattleFormat;
  attacker: StagedBattleSide;
  defender: StagedBattleSide;
  species: readonly CatalogSpecies[];
  moves: readonly CatalogMove[];
  statusMoves: readonly { id: string; name: string }[];
  abilities: readonly { id: string; name: string }[];
  items: readonly { id: string; name: string }[];
  natures: readonly Nature[];
}) {
  const { box } = useTeams();
  const [source, setSource] = useState<"staged" | "teams">("staged");
  const [leftTeamId, setLeftTeamId] = useState("");
  const [rightTeamId, setRightTeamId] = useState("");
  const [leftAbility, setLeftAbility] = useState("");
  const [rightAbility, setRightAbility] = useState("");
  const [leftItem, setLeftItem] = useState("");
  const [rightItem, setRightItem] = useState("");
  const [battle, setBattle] = useState<SinglesBattle | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [notice, setNotice] = useState<string | null>(null);

  const leftTeam = leftTeamId || box.teams[0]?.id || "";
  const rightTeam = rightTeamId || box.teams[1]?.id || box.teams[0]?.id || "";

  function start() {
    setNotice(null);
    if (source === "teams") {
      const left = box.teams.find((team) => team.id === leftTeam);
      const right = box.teams.find((team) => team.id === rightTeam);
      if (!left || !right) {
        setErrors(["Save two teams, then pick one for each side."]);
        setBattle(null);
        return;
      }
      const leftBuilt = teamFighters(left.sets, species, moves, statusMoves, abilities, items, natures);
      const rightBuilt = teamFighters(right.sets, species, moves, statusMoves, abilities, items, natures);
      const issues = [
        ...validateTeamAgainstFormat(left.sets, format, speciesIdFor(species)).map((issue) => issue.message),
        ...validateTeamAgainstFormat(right.sets, format, speciesIdFor(species)).map((issue) => issue.message),
        ...leftBuilt.errors,
        ...rightBuilt.errors,
      ];
      if (issues.length > 0) {
        setErrors(issues);
        setBattle(null);
        return;
      }
      begin(left.name, leftBuilt.fighters, right.name, rightBuilt.fighters, [...leftBuilt.notes, ...rightBuilt.notes]);
      return;
    }

    const leftStaged = stagedPokemon(attacker, species);
    const rightStaged = stagedPokemon(defender, species);
    if (!leftStaged || !rightStaged || !attacker.moveId || !defender.moveId) {
      setErrors(["Pick a Pokémon and a damaging move for both sides."]);
      setBattle(null);
      return;
    }
    const checked = prepareBattle({
      battleId: "singles-check",
      format,
      attacker: leftStaged,
      defender: rightStaged,
    });
    if (!checked.ok) {
      setErrors(checked.errors.map((error) => error.message));
      setBattle(null);
      return;
    }
    const leftMove = moves.find((move) => move.id === attacker.moveId);
    const rightMove = moves.find((move) => move.id === defender.moveId);
    if (!leftMove || !rightMove) {
      setErrors(["Pick a damaging move for both sides."]);
      setBattle(null);
      return;
    }
    begin(
      "Attacker",
      [fighterFromStaged(leftStaged, leftMove, leftAbility, leftItem)],
      "Defender",
      [fighterFromStaged(rightStaged, rightMove, rightAbility, rightItem)],
      checked.warnings,
    );
  }

  function begin(
    leftName: string,
    leftFighters: SinglesFighterInput[],
    rightName: string,
    rightFighters: SinglesFighterInput[],
    notes: string[],
  ) {
    const started = createSinglesBattle({
      battleId: createSeed(),
      format,
      seed: createSeed(),
      notes,
      sides: [
        { name: leftName, fighters: leftFighters },
        { name: rightName, fighters: rightFighters },
      ],
    });
    if (!started.ok) {
      setErrors(started.errors.map((error) => error.message));
      setBattle(null);
      return;
    }
    setErrors([]);
    setBattle(started.battle);
  }

  function choose(side: 0 | 1, choice: SinglesChoice) {
    if (!battle) {
      return;
    }
    const result = submitSinglesChoice(battle, side, choice);
    if (!result.ok) {
      setNotice(result.message);
      return;
    }
    setNotice(null);
    setBattle(result.battle);
  }

  return (
    <section aria-labelledby="singles-heading" className="space-y-4">
      <h2 id="singles-heading" className="text-xl font-medium">
        Play a singles battle
      </h2>
      <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
        Both players choose on this screen. There is no computer opponent. The battle copies each
        Pokémon, so custom types and base stats stay inside it. Levitate, Huge Power, Pure Power,
        Choice Band, Choice Specs, Choice Scarf, and Life Orb change the battle. A critical hit is
        1 in 24. Other abilities, items, weather, status moves, and higher critical-hit rates do not.
      </p>
      <fieldset className="space-y-2">
        <legend className="text-sm font-medium">Who is fighting</legend>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="radio"
            name="battle-source"
            checked={source === "staged"}
            onChange={() => setSource("staged")}
          />
          The two Pokémon above
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="radio"
            name="battle-source"
            checked={source === "teams"}
            onChange={() => setSource("teams")}
          />
          Saved teams
        </label>
      </fieldset>
      {source === "staged" ? (
        <div className="grid gap-4 lg:grid-cols-2">
          <HeldControls title="Attacker" ability={leftAbility} item={leftItem} onAbility={setLeftAbility} onItem={setLeftItem} />
          <HeldControls title="Defender" ability={rightAbility} item={rightItem} onAbility={setRightAbility} onItem={setRightItem} />
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          <TeamSelect label="First team" teams={box.teams} value={leftTeam} onChange={setLeftTeamId} />
          <TeamSelect label="Second team" teams={box.teams} value={rightTeam} onChange={setRightTeamId} />
        </div>
      )}
      <Button type="button" onClick={start}>
        Start the battle
      </Button>
      {errors.length > 0 ? (
        <ul role="alert" className="list-disc space-y-1 rounded-xl border border-destructive/40 bg-card px-6 py-3 text-sm">
          {errors.map((error) => (
            <li key={error}>{error}</li>
          ))}
        </ul>
      ) : null}
      {notice ? (
        <p role="status" className="text-sm">
          {notice}
        </p>
      ) : null}
      {battle ? (
        <BattleBoard battle={battle} onChoose={choose} onClear={(side) => setBattle(clearSinglesChoice(battle, side))} />
      ) : null}
    </section>
  );
}

function HeldControls({
  title,
  ability,
  item,
  onAbility,
  onItem,
}: {
  title: string;
  ability: string;
  item: string;
  onAbility: (id: string) => void;
  onItem: (id: string) => void;
}) {
  return (
    <div className="space-y-3 rounded-xl border border-border bg-card/90 p-4">
      <h3 className="font-medium">{title}</h3>
      <label className="block space-y-1.5 text-sm font-medium">
        {title} ability
        <select className={fieldClass} value={ability} onChange={(event) => onAbility(event.target.value)}>
          {ABILITY_OPTIONS.map((option) => (
            <option key={option.id || "none"} value={option.id}>
              {option.name}
            </option>
          ))}
        </select>
      </label>
      <label className="block space-y-1.5 text-sm font-medium">
        {title} item
        <select className={fieldClass} value={item} onChange={(event) => onItem(event.target.value)}>
          {ITEM_OPTIONS.map((option) => (
            <option key={option.id || "none"} value={option.id}>
              {option.name}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}

function TeamSelect({
  label,
  teams,
  value,
  onChange,
}: {
  label: string;
  teams: readonly { id: string; name: string }[];
  value: string;
  onChange: (id: string) => void;
}) {
  return (
    <label className="block space-y-1.5 text-sm font-medium">
      {label}
      <select className={fieldClass} value={value} onChange={(event) => onChange(event.target.value)}>
        {teams.length === 0 ? <option value="">No saved teams</option> : null}
        {teams.map((team) => (
          <option key={team.id} value={team.id}>
            {team.name}
          </option>
        ))}
      </select>
    </label>
  );
}

function BattleBoard({
  battle,
  onChoose,
  onClear,
}: {
  battle: SinglesBattle;
  onChoose: (side: 0 | 1, choice: SinglesChoice) => void;
  onClear: (side: 0 | 1) => void;
}) {
  return (
    <div className="space-y-4">
      <p className="text-sm font-medium">
        {battle.phase === "end"
          ? battle.winner === null
            ? "The battle is a draw."
            : `${battle.sides[battle.winner].name} wins.`
          : `Turn ${battle.turn}.`}
      </p>
      <div className="grid gap-4 lg:grid-cols-2">
        {battle.sides.map((side, index) => (
          <SidePanel
            key={index}
            side={side}
            sideIndex={index as 0 | 1}
            battle={battle}
            onChoose={onChoose}
            onClear={onClear}
          />
        ))}
      </div>
      <div className="rounded-xl border border-border bg-card/90 p-4">
        <h3 className="font-medium">Battle log</h3>
        <ul className="mt-2 max-h-64 space-y-1 overflow-y-auto text-sm" aria-live="polite">
          {battle.log.map((line, index) => (
            <li key={`${index}-${line}`}>{line}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function SidePanel({
  side,
  sideIndex,
  battle,
  onChoose,
  onClear,
}: {
  side: SinglesSide;
  sideIndex: 0 | 1;
  battle: SinglesBattle;
  onChoose: (side: 0 | 1, choice: SinglesChoice) => void;
  onClear: (side: 0 | 1) => void;
}) {
  const fighter = side.fighters[side.active];
  const choice = battle.choices[sideIndex];
  const acting = sideMustAct(battle, sideIndex);
  if (!fighter) {
    return null;
  }
  return (
    <div className="space-y-3 rounded-xl border border-border bg-card/90 p-4">
      <h3 className="font-medium">{side.name}</h3>
      <p className="text-sm">
        {fighter.speciesName}
        {fighter.fainted ? " fainted" : ` — HP ${fighter.hp} / ${fighter.maxHp}`}
      </p>
      <div className="h-2 overflow-hidden rounded-full bg-muted" aria-hidden="true">
        <div
          className="h-full bg-primary"
          style={{ width: `${fighter.maxHp === 0 ? 0 : (fighter.hp / fighter.maxHp) * 100}%` }}
        />
      </div>
      {acting && battle.phase !== "end" ? (
        choice ? (
          <div className="space-y-2">
            <p className="text-sm">Choice locked in.</p>
            <Button type="button" variant="outline" onClick={() => onClear(sideIndex)}>
              Change {side.name}&apos;s choice
            </Button>
          </div>
        ) : battle.phase === "switch" ? (
          <SwitchList side={side} onSwitch={(index) => onChoose(sideIndex, { kind: "switch", index })} />
        ) : (
          <MoveList fighter={fighter} side={side} onChoose={(next) => onChoose(sideIndex, next)} />
        )
      ) : (
        <p className="text-sm text-muted-foreground">{battle.phase === "end" ? "Finished." : "Waiting."}</p>
      )}
    </div>
  );
}

function MoveList({
  fighter,
  side,
  onChoose,
}: {
  fighter: SinglesFighter;
  side: SinglesSide;
  onChoose: (choice: SinglesChoice) => void;
}) {
  const usable = fighter.moves.filter((move) => move.pp > 0);
  return (
    <div className="flex flex-wrap gap-2">
      {usable.length > 0 ? (
        fighter.moves.map((move, index) => (
          <Button key={move.id} type="button" variant="outline" disabled={move.pp < 1} onClick={() => onChoose({ kind: "move", index })}>
            {move.name}, {move.pp} PP
          </Button>
        ))
      ) : (
        <Button type="button" variant="outline" onClick={() => onChoose({ kind: "struggle" })}>
          Struggle
        </Button>
      )}
      {side.fighters.some((entry, index) => index !== side.active && !entry.fainted) ? (
        <SwitchList side={side} onSwitch={(index) => onChoose({ kind: "switch", index })} />
      ) : null}
    </div>
  );
}

function SwitchList({ side, onSwitch }: { side: SinglesSide; onSwitch: (index: number) => void }) {
  return (
    <>
      {side.fighters.map((fighter, index) =>
        index === side.active || fighter.fainted ? null : (
          <Button key={`${fighter.speciesId}-${index}`} type="button" variant="outline" onClick={() => onSwitch(index)}>
            Switch to {fighter.speciesName}
          </Button>
        ),
      )}
    </>
  );
}

function speciesIdFor(species: readonly CatalogSpecies[]) {
  return (pokemonId: string) => species.find((entry) => entry.id === pokemonId)?.speciesId;
}

function stagedPokemon(side: StagedBattleSide, species: readonly CatalogSpecies[]): StagedPokemon | null {
  const form = species.find((entry) => entry.id === side.speciesId);
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

function fighterFromStaged(
  staged: StagedPokemon,
  move: CatalogMove,
  abilityId: string,
  itemId: string,
): SinglesFighterInput {
  const ability = ABILITY_OPTIONS.find((option) => option.id === abilityId);
  const item = ITEM_OPTIONS.find((option) => option.id === itemId);
  return {
    speciesId: staged.speciesId,
    speciesName: staged.speciesName,
    types: effectiveTypes(staged.speciesTypes, staged.customTypes),
    baseStats: effectiveBaseStats(staged.speciesBase, staged.customBaseStats),
    level: staged.level,
    ivs: staged.ivs,
    evs: staged.evs,
    plusStat: staged.plusStat,
    minusStat: staged.minusStat,
    abilityId,
    abilityName: ability?.name ?? "",
    itemId: itemId || null,
    itemName: itemId ? (item?.name ?? null) : null,
    moves: [
      {
        id: move.id,
        name: move.name,
        type: move.type,
        category: move.category,
        power: move.power,
        pp: move.pp && move.pp > 0 ? move.pp : 1,
      },
    ],
  };
}

function teamFighters(
  sets: readonly PokemonSet[],
  species: readonly CatalogSpecies[],
  moves: readonly CatalogMove[],
  statusMoves: readonly { id: string; name: string }[],
  abilities: readonly { id: string; name: string }[],
  items: readonly { id: string; name: string }[],
  natures: readonly Nature[],
): { fighters: SinglesFighterInput[]; notes: string[]; errors: string[] } {
  const fighters: SinglesFighterInput[] = [];
  const notes: string[] = [];
  const errors: string[] = [];
  const moveById = new Map(moves.map((move) => [move.id, move]));
  const statusById = new Map(statusMoves.map((move) => [move.id, move.name]));
  for (const set of sets) {
    const form = species.find((entry) => entry.id === set.pokemonId);
    if (!form) {
      errors.push("A Pokémon on this team is missing from the catalog.");
      continue;
    }
    const nature = natures.find((entry) => entry.id === set.natureId);
    const battleMoves: Array<SinglesFighterInput["moves"][number]> = [];
    for (const moveId of set.moveIds) {
      const move = moveById.get(moveId);
      if (!move) {
        notes.push(`${statusById.get(moveId) ?? "A move"} on ${form.displayName} is not used in this battle.`);
        continue;
      }
      battleMoves.push({
        id: move.id,
        name: move.name,
        type: move.type,
        category: move.category,
        power: move.power,
        pp: move.pp && move.pp > 0 ? move.pp : 1,
      });
    }
    if (battleMoves.length === 0) {
      notes.push(`${form.displayName} has no damaging moves here, so it uses Struggle.`);
    }
    const ability = abilities.find((entry) => entry.id === set.abilityId);
    const item = set.itemId ? items.find((entry) => entry.id === set.itemId) : undefined;
    fighters.push({
      speciesId: form.speciesId,
      speciesName: set.nickname?.trim() || form.displayName,
      types: effectiveTypes(form.types, set.customTypes),
      baseStats: effectiveBaseStats(form.baseStats, set.customBaseStats),
      level: set.level,
      ivs: set.ivs,
      evs: set.evs,
      plusStat: nature?.plusStat ?? null,
      minusStat: nature?.minusStat ?? null,
      abilityId: set.abilityId,
      abilityName: ability?.name ?? set.abilityId,
      itemId: set.itemId,
      itemName: item?.name ?? set.itemId,
      moves: battleMoves,
    });
  }
  return { fighters, notes, errors };
}
