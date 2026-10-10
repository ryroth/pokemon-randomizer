import { TypeBadge } from "@/components/recap/type-badge";
import { TERA_TYPES, TYPE_LABELS, type TeraType } from "@/lib/types/pokemon-type";

/**
 * Tera type chooser as a dropdown. Eighteen chips took a lot of room for one choice, so the list
 * stays closed and the chosen type shows beside it as a colored badge with its name.
 */
export function TeraTypePicker({
  value,
  onChange,
}: {
  value: TeraType | undefined;
  onChange: (type: TeraType | undefined) => void;
}) {
  return (
    <div className="space-y-1.5">
      <label className="block max-w-xs space-y-1.5 text-sm font-medium">
        Tera type
        <select
          className="h-9 w-full rounded-lg border border-input bg-background px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          value={value ?? ""}
          onChange={(event) => {
            const next = event.target.value;
            onChange(TERA_TYPES.find((type) => type === next));
          }}
        >
          <option value="">Choose a Tera type</option>
          {TERA_TYPES.map((type) => (
            <option key={type} value={type}>
              {TYPE_LABELS[type]}
            </option>
          ))}
        </select>
      </label>
      <p className="flex items-center gap-2 text-sm text-muted-foreground">
        {value ? (
          <>
            Tera type: <TypeBadge type={value} />
          </>
        ) : (
          "No Tera type chosen yet."
        )}
      </p>
    </div>
  );
}
