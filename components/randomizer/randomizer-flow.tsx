"use client";

import { GripVertical } from "lucide-react";
import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { TYPICAL_RANDOMIZER_ORDER } from "@/lib/randomizer/defaults";
import {
  isImplementedRandomizerTab,
  moveRandomizerStep,
  normalizeRandomizerOrder,
  reorderRandomizerSteps,
} from "@/lib/randomizer/flow";
import type { RandomizerConfig, RandomizerTab } from "@/lib/types/randomizer";
import { cn } from "@/lib/utils";

const STEP_LABELS: Record<RandomizerTab, string> = {
  pokemon: "Pokémon randomizer",
  ability: "Ability randomizer",
  move: "Move randomizer",
  item: "Item randomizer",
};

const POINTER_DRAG_THRESHOLD_PX = 8;

interface RandomizerFlowListProps {
  config: RandomizerConfig;
  onChange: (config: RandomizerConfig) => void;
}

interface PointerReorderState {
  pointerId: number;
  tab: RandomizerTab;
  startY: number;
  dragging: boolean;
}

function isCheckboxTarget(target: EventTarget | null): boolean {
  return target instanceof HTMLElement && Boolean(target.closest("input"));
}

function dropIndexFromClientY(list: HTMLOListElement, clientY: number): number {
  const items = [...list.querySelectorAll<HTMLLIElement>("[data-randomizer-step]")];
  let target = 0;
  for (const [index, item] of items.entries()) {
    const rect = item.getBoundingClientRect();
    if (clientY >= rect.top + rect.height / 2) {
      target = index;
    }
  }
  return target;
}

export function RandomizerFlowList({ config, onChange }: RandomizerFlowListProps) {
  const order = normalizeRandomizerOrder(config.randomizerOrder);
  const typical =
    order.length === TYPICAL_RANDOMIZER_ORDER.length &&
    order.every((tab, index) => tab === TYPICAL_RANDOMIZER_ORDER[index]);
  const hintId = useId();
  const listRef = useRef<HTMLOListElement | null>(null);
  const configRef = useRef(config);
  const onChangeRef = useRef(onChange);
  const orderRef = useRef(order);
  const snapshotRef = useRef<RandomizerTab[] | null>(null);
  const pointerRef = useRef<PointerReorderState | null>(null);
  const draggingTabRef = useRef<RandomizerTab | null>(null);
  const liftedTabRef = useRef<RandomizerTab | null>(null);
  const [draggingTab, setDraggingTab] = useState<RandomizerTab | null>(null);
  const [liftedTab, setLiftedTab] = useState<RandomizerTab | null>(null);
  const [status, setStatus] = useState("");

  useLayoutEffect(() => {
    configRef.current = config;
    onChangeRef.current = onChange;
    orderRef.current = order;
    draggingTabRef.current = draggingTab;
    liftedTabRef.current = liftedTab;
  });

  function setOrder(nextOrder: RandomizerTab[]) {
    orderRef.current = nextOrder;
    onChangeRef.current({ ...configRef.current, randomizerOrder: nextOrder });
  }

  function setEnabled(tab: Exclude<RandomizerTab, "pokemon">, enabled: boolean) {
    if (tab === "ability") {
      onChange({ ...config, randomizeAbilities: enabled });
      return;
    }
    if (tab === "move") {
      onChange({ ...config, randomizeMoves: enabled });
      return;
    }
    onChange({ ...config, randomizeItems: enabled });
  }

  function beginTrackedReorder() {
    if (snapshotRef.current == null) {
      snapshotRef.current = [...orderRef.current];
    }
  }

  function finishTrackedReorder() {
    snapshotRef.current = null;
    draggingTabRef.current = null;
    liftedTabRef.current = null;
    setDraggingTab(null);
    setLiftedTab(null);
  }

  function cancelReorder() {
    const snapshot = snapshotRef.current;
    const activeTab = draggingTabRef.current ?? liftedTabRef.current;
    if (snapshot) {
      setOrder([...snapshot]);
    }
    finishTrackedReorder();
    pointerRef.current = null;
    if (activeTab) {
      setStatus(`Cancelled reordering ${STEP_LABELS[activeTab]}.`);
    }
  }

  function moveTabToIndex(tab: RandomizerTab, toIndex: number) {
    const currentOrder = orderRef.current;
    const fromIndex = currentOrder.indexOf(tab);
    if (fromIndex === -1 || fromIndex === toIndex) {
      return currentOrder;
    }
    const nextOrder = reorderRandomizerSteps(currentOrder, fromIndex, toIndex);
    setOrder(nextOrder);
    return nextOrder;
  }

  function dropTab(tab: RandomizerTab, nextOrder: RandomizerTab[] = orderRef.current) {
    const position = nextOrder.indexOf(tab) + 1;
    finishTrackedReorder();
    setStatus(`Dropped ${STEP_LABELS[tab]} at position ${position} of ${nextOrder.length}.`);
  }

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape") {
        return;
      }
      if (snapshotRef.current == null && draggingTabRef.current == null && liftedTabRef.current == null) {
        return;
      }
      event.preventDefault();
      cancelReorder();
    }

    function onPointerMove(event: PointerEvent) {
      const state = pointerRef.current;
      const list = listRef.current;
      if (!state || state.pointerId !== event.pointerId || !list) {
        return;
      }
      if (!state.dragging) {
        if (Math.abs(event.clientY - state.startY) < POINTER_DRAG_THRESHOLD_PX) {
          return;
        }
        state.dragging = true;
        beginTrackedReorder();
        draggingTabRef.current = state.tab;
        liftedTabRef.current = null;
        setDraggingTab(state.tab);
        setLiftedTab(null);
      }
      event.preventDefault();
      const toIndex = dropIndexFromClientY(list, event.clientY);
      moveTabToIndex(state.tab, toIndex);
    }

    function onPointerUp(event: PointerEvent) {
      const state = pointerRef.current;
      if (!state || state.pointerId !== event.pointerId) {
        return;
      }
      pointerRef.current = null;
      if (!state.dragging) {
        return;
      }
      event.preventDefault();
      dropTab(state.tab);
    }

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    window.addEventListener("pointercancel", onPointerUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("pointercancel", onPointerUp);
    };
    // Window listeners must stay attached for the whole drag. They read latest
    // order and config through refs updated in useLayoutEffect.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function onTilePointerDown(event: React.PointerEvent<HTMLLIElement>, tab: RandomizerTab) {
    if (event.button !== 0 || isCheckboxTarget(event.target)) {
      return;
    }
    pointerRef.current = {
      pointerId: event.pointerId,
      tab,
      startY: event.clientY,
      dragging: false,
    };
  }

  function toggleLift(tab: RandomizerTab) {
    if (liftedTab === tab) {
      dropTab(tab);
      return;
    }
    beginTrackedReorder();
    liftedTabRef.current = tab;
    draggingTabRef.current = null;
    setLiftedTab(tab);
    setDraggingTab(null);
    const position = order.indexOf(tab) + 1;
    setStatus(
      `Picked up ${STEP_LABELS[tab]} at position ${position} of ${order.length}. Press Up or Down to move, Space to drop, Escape to cancel.`,
    );
  }

  function moveLiftedTab(direction: -1 | 1) {
    if (liftedTab == null) {
      return;
    }
    const nextOrder = moveRandomizerStep(order, liftedTab, direction);
    setOrder(nextOrder);
    const position = nextOrder.indexOf(liftedTab) + 1;
    setStatus(`${STEP_LABELS[liftedTab]} is now position ${position} of ${nextOrder.length}.`);
  }

  return (
    <section className="space-y-4" aria-labelledby="randomizer-order-heading">
      <div className="space-y-1">
        <h2 id="randomizer-order-heading" className="text-lg font-semibold tracking-tight">
          Randomizer order
        </h2>
        <p className="text-sm leading-6 text-muted-foreground">
          Typical order is Pokémon, then Ability, then Moves, then Items. Drag a tile to change the
          order, or skip extras that are off. If an extra runs before Pokémon, you apply those extras
          to the Pokémon you choose.
        </p>
        <p id={hintId} className="sr-only">
          To reorder with a keyboard, focus a step&apos;s handle, press Space to pick it up, then Up
          or Down to move it, then Space to drop. Press Escape to cancel.
        </p>
      </div>
      <ol
        ref={listRef}
        aria-describedby={hintId}
        aria-label="Randomizer steps"
        className={cn("space-y-2", draggingTab ? "select-none" : null)}
        onDragOver={(event) => {
          if (draggingTabRef.current == null) {
            return;
          }
          event.preventDefault();
          event.dataTransfer.dropEffect = "move";
          const list = listRef.current;
          if (!list) {
            return;
          }
          moveTabToIndex(draggingTabRef.current, dropIndexFromClientY(list, event.clientY));
        }}
        onDrop={(event) => {
          event.preventDefault();
          const activeTab = draggingTabRef.current;
          if (activeTab) {
            dropTab(activeTab);
          }
        }}
      >
        {order.map((tab, index) => {
          const implemented = isImplementedRandomizerTab(tab);
          const optional = tab !== "pokemon";
          const enabled =
            tab === "pokemon" ||
            (tab === "ability" && config.randomizeAbilities) ||
            (tab === "move" && config.randomizeMoves) ||
            (tab === "item" && config.randomizeItems);
          const active = draggingTab === tab || liftedTab === tab;

          return (
            <li
              key={tab}
              data-randomizer-step={tab}
              draggable
              onPointerDown={(event) => onTilePointerDown(event, tab)}
              onDragStart={(event) => {
                if (isCheckboxTarget(event.target)) {
                  event.preventDefault();
                  return;
                }
                pointerRef.current = null;
                event.dataTransfer.effectAllowed = "move";
                event.dataTransfer.setData("text/plain", tab);
                beginTrackedReorder();
                draggingTabRef.current = tab;
                liftedTabRef.current = null;
                setDraggingTab(tab);
                setLiftedTab(null);
              }}
              onDragEnd={() => {
                const activeTab = draggingTabRef.current;
                if (activeTab) {
                  dropTab(activeTab);
                }
              }}
              className={cn(
                "flex cursor-grab items-center gap-3 rounded-xl border border-border bg-card p-3 touch-none",
                active ? "cursor-grabbing border-ring ring-3 ring-ring/50" : null,
              )}
            >
              <span
                role="button"
                tabIndex={0}
                aria-describedby={hintId}
                aria-label={`Reorder ${STEP_LABELS[tab]}`}
                aria-pressed={liftedTab === tab}
                className="inline-flex size-8 shrink-0 cursor-grab items-center justify-center rounded-lg text-muted-foreground outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
                onClick={(event) => {
                  event.preventDefault();
                }}
                onBlur={() => {
                  if (liftedTab === tab) {
                    dropTab(tab);
                  }
                }}
                onKeyDown={(event) => {
                  if (event.key === " " || event.key === "Space" || event.key === "Enter") {
                    event.preventDefault();
                    toggleLift(tab);
                    return;
                  }
                  if (liftedTab !== tab) {
                    return;
                  }
                  if (event.key === "ArrowUp") {
                    event.preventDefault();
                    moveLiftedTab(-1);
                    return;
                  }
                  if (event.key === "ArrowDown") {
                    event.preventDefault();
                    moveLiftedTab(1);
                  }
                }}
              >
                <GripVertical aria-hidden="true" />
              </span>
              <span className="w-6 shrink-0 text-sm font-medium text-muted-foreground">
                {index + 1}.
              </span>
              {optional ? (
                <label className="flex min-w-0 items-start gap-2 text-sm">
                  <input
                    type="checkbox"
                    className="mt-0.5"
                    checked={enabled}
                    disabled={!implemented}
                    onChange={() => setEnabled(tab, !enabled)}
                  />
                  <span>
                    {STEP_LABELS[tab]}
                    {!implemented ? (
                      <span className="block text-muted-foreground">Not available yet</span>
                    ) : null}
                  </span>
                </label>
              ) : (
                <p className="text-sm font-medium">{STEP_LABELS[tab]}</p>
              )}
            </li>
          );
        })}
      </ol>
      <p className="sr-only" aria-live="polite">
        {status}
      </p>
      <Button
        type="button"
        variant="outline"
        className="w-fit"
        disabled={typical}
        onClick={() => setOrder([...TYPICAL_RANDOMIZER_ORDER])}
      >
        Use typical order
      </Button>
    </section>
  );
}
