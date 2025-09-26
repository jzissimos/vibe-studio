import type { NextApiRequest, NextApiResponse } from "next";
import { readdirSync } from "node:fs";
import { join } from "node:path";

export default function handler(_req: NextApiRequest, res: NextApiResponse) {
  const cwd = process.cwd();
  let appApi: any = null;
  try {
    const dir = join(cwd, "app", "api");
    appApi = readdirSync(dir, { withFileTypes: true }).map(e => ({ name: e.name, dir: e.isDirectory() }));
  } catch (e: any) {
    appApi = { error: e?.message || String(e) };
  }
  res.status(200).json({ cwd, appApi });
}
