import "server-only";
import { cacheLife } from "next/cache";
import { project } from "./project";

export async function repositoryStars(): Promise<number | null> {
  "use cache";
  cacheLife("hours");
  try {
    const response = await fetch(
      `https://api.github.com/repos/${project.repository}`,
      {
        headers: {
          Accept: "application/vnd.github+json",
          "User-Agent": "my-tesla",
        },
        signal: AbortSignal.timeout(3000),
      },
    );
    if (!response.ok) return null;
    const body = (await response.json()) as { stargazers_count?: unknown };
    return typeof body.stargazers_count === "number"
      ? body.stargazers_count
      : null;
  } catch {
    return null;
  }
}
