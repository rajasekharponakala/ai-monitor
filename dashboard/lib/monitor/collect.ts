import { loadConfig } from "./config";
import { upsert } from "./db";
import { collect as openai } from "./providers/openai";
import { collect as anthropic } from "./providers/anthropic";
import { collect as openrouter } from "./providers/openrouter";
import { collect as opencode } from "./providers/opencode_local";
import { collect as claudecode } from "./providers/claude_local";

const COLLECTORS: Record<string, (account: string, token: string) => Promise<import("./types").Row[]>> = {
  openai, anthropic, openrouter, opencode, claudecode,
};

export async function runOnce(): Promise<Record<string, number | string>> {
  const cfg = loadConfig();
  const out: Record<string, number | string> = {};
  for (const acct of cfg.accounts) {
    const fn = COLLECTORS[acct.provider];
    if (!fn) {
      out[`${acct.provider}/${acct.name}`] = "unknown provider";
      continue;
    }
    try {
      const rows = await fn(acct.name, acct.token);
      upsert(rows);
      out[`${acct.provider}/${acct.name}`] = rows.length;
    } catch (e) {
      out[`${acct.provider}/${acct.name}`] = `ERROR ${String(e).slice(0, 200)}`;
    }
  }
  return out;
}
