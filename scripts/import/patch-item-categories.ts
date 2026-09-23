import { Dex } from "@pkmn/dex";
import { loadGeneratedCatalog } from "../../lib/data/loadCatalog";
import { itemKind, itemTeambuilderCategory } from "./showdown";
import { writeCatalog } from "./writeCatalog";

async function main() {
  const catalog = loadGeneratedCatalog();
  const items = catalog.items.map((item) => {
    const showdownItem = Dex.items.get(item.id);
    if (!showdownItem.exists) {
      throw new Error(`Showdown has no item for catalog id ${item.id}`);
    }
    return {
      ...item,
      kind: itemKind(showdownItem),
      category: itemTeambuilderCategory(showdownItem),
    };
  });

  const counts = {
    popular: 0,
    items: 0,
    "pokemon-specific": 0,
    "usually-useless": 0,
    useless: 0,
  };
  for (const item of items) {
    counts[item.category] += 1;
  }

  await writeCatalog({
    ...catalog,
    version: "2.2.0",
    generatedAt: new Date().toISOString(),
    items,
  });

  console.log(
    `Wrote Showdown teambuilder categories for ${items.length} items: ` +
      `popular ${counts.popular}, items ${counts.items}, ` +
      `pokemon-specific ${counts["pokemon-specific"]}, ` +
      `usually-useless ${counts["usually-useless"]}, useless ${counts.useless}.`,
  );
}

main().catch((error: unknown) => {
  if (error instanceof Error) {
    console.error(error.stack ?? error.message);
  } else {
    console.error("Unknown item-category patch error");
  }
  process.exitCode = 1;
});
