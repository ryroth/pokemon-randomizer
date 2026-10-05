import { writeFileSync } from "node:fs";
import path from "node:path";

/**
 * Snapshots optimized GLB paths from Pokemon-3D-api/assets.
 * The recap plays these models in the browser. It does not call the API at runtime.
 */

const REPOSITORY = "Pokemon-3D-api/assets";
const USER_AGENT = "pokemon-randomizer";

interface GitTreeResponse {
  sha: string;
  truncated: boolean;
  tree: Array<{ path: string; type: string }>;
}

interface GitCommitResponse {
  sha: string;
}

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url, {
    headers: {
      Accept: "application/vnd.github+json",
      "User-Agent": USER_AGENT,
    },
    signal: AbortSignal.timeout(60_000),
  });
  if (!response.ok) {
    throw new Error(`GitHub ${response.status} for ${url}`);
  }
  return (await response.json()) as T;
}

async function main() {
  const commit = await fetchJson<GitCommitResponse>(
    `https://api.github.com/repos/${REPOSITORY}/commits/main`,
  );
  const tree = await fetchJson<GitTreeResponse>(
    `https://api.github.com/repos/${REPOSITORY}/git/trees/${commit.sha}?recursive=1`,
  );
  if (tree.truncated) {
    throw new Error("GitHub truncated the model tree. Refusing to write a partial index.");
  }

  const paths = tree.tree
    .filter((entry) => entry.type === "blob" && entry.path.startsWith("models/opt/") && entry.path.endsWith(".glb"))
    .map((entry) => entry.path.slice("models/opt/".length))
    .sort((left, right) => left.localeCompare(right, "en"));

  if (paths.length < 1000) {
    throw new Error(`Expected at least 1000 model files and found ${paths.length}.`);
  }

  const output = {
    repository: REPOSITORY,
    commit: commit.sha,
    paths,
  };
  const filePath = path.join(process.cwd(), "data", "generated", "pokemon-model-index.json");
  writeFileSync(filePath, `${JSON.stringify(output, null, 2)}\n`);
  console.log(`Wrote ${paths.length} model paths at ${commit.sha.slice(0, 12)} to ${filePath}`);
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : "Model index import failed.";
  console.error(message);
  process.exitCode = 1;
});
