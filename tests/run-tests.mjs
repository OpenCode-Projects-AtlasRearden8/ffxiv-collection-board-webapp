#!/usr/bin/env node
/**
 * Dependency-free test suite for the FFXIV Long-Haul Board.
 * Extracts the app's <script> from index.html and runs it in a sandbox
 * (no DOM, no localStorage), then asserts on the exported pure logic.
 *
 * Run with: node tests/run-tests.mjs
 */
import { readFile } from "node:fs/promises";
import vm from "node:vm";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

let passed = 0;
let failed = 0;
const failures = [];

function test(name, fn) {
  try {
    fn();
    passed++;
    console.log("ok  - " + name);
  } catch (err) {
    failed++;
    failures.push({ name, err });
    console.log("FAIL- " + name + "\n      " + (err && err.message ? err.message : err));
  }
}

function eq(actual, expected, label) {
  const a = JSON.stringify(actual);
  const b = JSON.stringify(expected);
  if (a !== b) throw new Error((label || "value") + " expected " + b + " got " + a);
}

function ok(cond, label) {
  if (!cond) throw new Error(label || "expected truthy");
}

/* ---- Load app script into sandbox ---- */
const html = await readFile(path.join(ROOT, "index.html"), "utf8");
const scriptMatches = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)];
ok(scriptMatches.length === 1, "single inline <script> block");
const sandbox = { module: { exports: {} }, console, setTimeout: () => {} };
vm.createContext(sandbox);
vm.runInContext(scriptMatches[0][1], sandbox);
const api = sandbox.module.exports;
for (const key of [
  "STORAGE_KEY", "STATUS_FLOW", "METHOD_LABELS", "BOARDS",
  "normalizeStatus", "nextStatus", "computeProgress", "computeBoardProgresses",
  "weekKeyOf", "pickFocus", "makeLogEntry", "validateState", "freshState", "seedItems"
]) {
  ok(typeof api[key] !== "undefined", "exports " + key);
}

/* ---- Status logic ---- */
test("normalizeStatus keeps valid statuses", () => {
  eq(api.normalizeStatus("todo"), "todo", "todo");
  eq(api.normalizeStatus("working"), "working", "working");
  eq(api.normalizeStatus("done"), "done", "done");
});
test("normalizeStatus falls back to 'todo' for junk", () => {
  eq(api.normalizeStatus("banana"), "todo");
  eq(api.normalizeStatus(undefined), "todo");
});
test("nextStatus cycles todo -> working -> done -> todo", () => {
  eq(api.nextStatus("todo"), "working");
  eq(api.nextStatus("working"), "done");
  eq(api.nextStatus("done"), "todo");
  eq(api.nextStatus("junk"), "working");
});

/* ---- Progress math ---- */
test("computeProgress handles empty boards", () => {
  eq(api.computeProgress([]), { total: 0, done: 0, working: 0, pct: 0 });
});
function item(board, status) { return { id: "x", board, name: "n", method: "vendor", status }; }
test("computeProgress counts done/working and rounds percent", () => {
  eq(api.computeProgress([item("mounts", "done"), item("mounts", "done"), item("mounts", "working"), item("mounts", "todo")]),
    { total: 4, done: 2, working: 1, pct: 50 });
  eq(api.computeProgress([item("mounts", "done"), item("mounts", "todo"), item("mounts", "todo")]).pct, 33);
});
test("computeProgress ignores jumbled boards and normalizes", () => {
  const p = api.computeProgress([
    { board: "minions", name: "x", method: "vendor", status: "done" },
    { board: "mounts", name: "y", method: "duty", status: "weird" }
  ]);
  eq(p.total, 2);
  eq(p.done, 1);
});
test("computeBoardProgresses splits by board", () => {
  const items = [
    item("mounts", "done"), item("minions", "working"), item("barding", "todo"), item("relics", "done")
  ];
  const bpp = api.computeBoardProgresses(items);
  eq(bpp.mounts, { total: 1, done: 1, working: 0, pct: 100 });
  eq(bpp.minions.pct, 0);
  eq(bpp.barding.total, 1);
  eq(bpp.relics.pct, 100);
});

/* ---- Week key (ISO weeks) ---- */
test("weekKeyOf matches ISO week anchors", () => {
  eq(api.weekKeyOf(new Date(2021, 0, 4)), "2021-W01");   // Mon 4 Jan 2021
  eq(api.weekKeyOf(new Date(2024, 0, 1)), "2024-W01");   // Mon 1 Jan 2024
  eq(api.weekKeyOf(new Date(2025, 5, 3)), "2025-W23");   // Tue 3 Jun 2025
  eq(api.weekKeyOf(new Date(2023, 0, 1)), "2022-W52");   // Sun 1 Jan 2023 -> ISO 2022-W52
  eq(api.weekKeyOf(new Date(2024, 11, 30)), "2025-W01"); // Mon 30 Dec 2024 -> ISO 2025-W01
});
test("weekKeyOf is stable across the same week", () => {
  eq(api.weekKeyOf(new Date(2026, 9, 26)), api.weekKeyOf(new Date(2026, 9, 28)));
});

/* ---- Focus picking ---- */
test("pickFocus only picks un-collected items", () => {
  const items = [
    { id: "1", board: "mounts", name: "A", method: "duty", status: "done" },
    { id: "2", board: "mounts", name: "B", method: "duty", status: "todo" },
    { id: "3", board: "mounts", name: "C", method: "vendor", status: "working" }
  ];
  for (let i = 0; i < 20; i++) {
    const f = api.pickFocus(items, () => i / 20);
    ok(f && f.status !== "done", "never pick done");
  }
});
test("pickFocus returns null when everything is collected", () => {
  eq(api.pickFocus([item("mounts", "done"), item("mounts", "done")]), null);
  eq(api.pickFocus([]), null);
});
test("pickFocus respects provided rng", () => {
  const items = [
    { id: "a", board: "mounts", name: "A", method: "duty", status: "todo" },
    { id: "b", board: "mounts", name: "B", method: "duty", status: "todo" },
    { id: "c", board: "mounts", name: "C", method: "duty", status: "todo" }
  ];
  eq(api.pickFocus(items, () => 0).id, "a");
  eq(api.pickFocus(items, () => 0.999).id, "c");
});

/* ---- Log entries ---- */
test("makeLogEntry snapshots item details with a timestamp", () => {
  const e = api.makeLogEntry({ id: "i9", name: "Firebird", board: "mounts", method: "duty" }, "2026-10-29T00:00:00.000Z");
  eq(e, { id: "i9", name: "Firebird", board: "mounts", method: "duty", date: "2026-10-29T00:00:00.000Z" });
  eq(api.makeLogEntry({ id: "i1", name: "x", board: "minions", method: "vendor" }).date.length > 0, true);
});

/* ---- Import validation ---- */
test("validateState accepts well-formed state", () => {
  const s = api.freshState();
  ok(api.validateState(s));
  ok(api.validateState({ items: [], log: [] }));
});
test("validateState rejects malformed imports of many shapes", () => {
  ok(!api.validateState(null));
  ok(!api.validateState("nope"));
  ok(!api.validateState({ items: "all", log: [] }));
  ok(!api.validateState({ items: [{ id: "i" }], log: [] }));             // missing name
  ok(!api.validateState({ items: [{ id: "i", name: "n", board: "nope" }], log: [] })); // bad board
  ok(!api.validateState({ items: [], log: {}, focusState: 42 }));         // bad focusState
});

/* ---- Seed data sanity ---- */
test("starter checklists cover all four boards with valid tags", () => {
  const items = api.seedItems();
  ok(items.length >= 20, "at least 20 seeded items");
  const boards = new Set(items.map(it => it.board));
  for (const b of api.BOARDS) ok(boards.has(b), "board seeded: " + b);
  for (const it of items) {
    ok(typeof it.id === "string" && it.id.length > 0, "seed id");
    ok(api.METHOD_LABELS[it.method], "valid method for " + it.name);
    eq(api.normalizeStatus(it.status), "todo");
    ok(it.detail && it.detail.length > 0, "seed detail for " + it.name);
  }
  const ids = new Set(items.map(it => it.id));
  eq(ids.size, items.length, "unique seed ids");
});

/* ---- Static HTML hygiene ---- */
test("HTML has no external dependencies or remote assets", () => {
  ok(!/<script\s+src=/i.test(html), "no external scripts");
  ok(!/<link\s[^>]*href=["']?https?:/i.test(html), "no remote stylesheets");
  ok(!/https?:\/\/|\/\/cdn|unpkg|jsdelivr/i.test(html.replace(/\s*<!--[\s\S]*?-->/g, "")), "no remote asset references");
});
test("HTML declares language, meta charset, and storage key", () => {
  ok(html.indexOf("<html lang=") !== -1, "lang attr");
  ok(html.includes('charset="UTF-8"'), "charset");
  ok(html.includes('localStorage.setItem(api.STORAGE_KEY') === false && html.includes('STORAGE_KEY'), "storage key present");
});
test("HTML contains no obvious secrets or personal data", () => {
  ok(!/(api[_-]?key|secret|password|token)\s*[:=]\s*["'][^"']+["']/i.test(html), "no embedded credentials");
});

process.exitCode = failed === 0 ? 0 : 1;
console.log("\n" + passed + " passed, " + failed + " failed");
if (failed > 0) {
  for (const f of failures) console.log("  - " + f.name + ": " + (f.err && f.err.message));
}
