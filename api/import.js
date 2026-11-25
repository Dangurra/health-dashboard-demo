// Recipe import for the demo: fetches a public recipe page and reads its schema.org Recipe data.
// No secrets, no storage. Private and internal addresses are blocked.
import { lookup } from "node:dns/promises";
import net from "node:net";

// ---------- recipe import (schema.org Recipe JSON-LD) ----------
function privateIP(ip) {
  if (net.isIPv4(ip)) {
    const [a, b] = ip.split(".").map(Number);
    return a === 0 || a === 10 || a === 127 || a >= 224 || (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) || (a === 100 && b >= 64 && b <= 127);
  }
  const l = ip.toLowerCase();
  if (l.startsWith("::ffff:")) return privateIP(l.slice(7));
  return l === "::" || l === "::1" || /^f[cd]|^fe[89ab]|^ff/.test(l);
}
async function publicHost(host) {
  try { const r = await lookup(host, { all: true }); return r.length && r.every(x => !privateIP(x.address)); }
  catch { return false; }
}
const decode = s => s.replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
  .replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'").replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(+n))
  .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)));
const text = s => decode(String(s ?? "").replace(/<[^>]+>/g, " ")).trim();
const num = v => { const m = String(v ?? "").match(/[\d.]+/); return m ? Math.round(parseFloat(m[0])) : null; };
const minutes = iso => { const m = String(iso || "").match(/P(?:(\d+)D)?T?(?:(\d+)H)?(?:(\d+)M)?/); return m ? (+m[1] || 0) * 1440 + (+m[2] || 0) * 60 + (+m[3] || 0) : 0; };
function findRecipe(o) {
  if (Array.isArray(o)) { for (const x of o) { const r = findRecipe(x); if (r) return r; } }
  else if (o && typeof o === "object") {
    const t = o["@type"];
    if (t === "Recipe" || (Array.isArray(t) && t.includes("Recipe"))) return o;
    for (const k of ["@graph", "mainEntity"]) if (k in o) { const r = findRecipe(o[k]); if (r) return r; }
  }
  return null;
}
function steps(ins) {
  if (typeof ins === "string") return text(ins).split(/\n+|(?<=\.)\s{2,}/).map(s => s.trim()).filter(Boolean);
  let out = [];
  for (const s of ins || []) {
    if (typeof s === "string") out.push(text(s));
    else if (s && typeof s === "object") s["@type"] === "HowToSection" ? (out = out.concat(steps(s.itemListElement))) : out.push(text(s.text || s.name));
  }
  return out.filter(Boolean);
}
async function importRecipe(url) {
  let u; try { u = new URL(url); } catch { throw new Error("Enter a full http(s) link"); }
  if (!/^https?:$/.test(u.protocol)) throw new Error("Enter a full http(s) link");
  let r;
  for (let hop = 0; ; hop++) {
    if (!(await publicHost(u.hostname))) throw new Error(hop ? "redirect to a non-public address blocked" : "That address isn't a public website");
    r = await fetch(u, { redirect: "manual", signal: AbortSignal.timeout(12000),
      headers: { "User-Agent": "Mozilla/5.0 (Macintosh) HealthDashboard-recipe-import/1.0", Accept: "text/html" } });
    if (r.status >= 300 && r.status < 400 && r.headers.get("location") && hop < 5) {
      u = new URL(r.headers.get("location"), u);
      if (!/^https?:$/.test(u.protocol)) throw new Error("redirect to a non-public address blocked");
      continue;
    }
    break;
  }
  const page = (await r.text()).slice(0, 4_000_000);
  let recipe = null;
  for (const m of page.matchAll(/<script[^>]+application\/ld\+json[^>]*>([\s\S]*?)<\/script>/gi)) {
    try { recipe = findRecipe(JSON.parse(m[1].trim())); } catch { continue; }
    if (recipe) break;
  }
  if (!recipe) throw new Error("Couldn't find recipe data on that page. You can still type it in.");
  const nut = recipe.nutrition || {};
  let y = recipe.recipeYield; if (Array.isArray(y)) y = y[0];
  let img = recipe.image; if (Array.isArray(img)) img = img[0]; img = img || "";
  if (typeof img === "object") img = img.url || "";
  return {
    name: text(recipe.name).slice(0, 120), blurb: text(recipe.description).slice(0, 240),
    servings: num(y) || 4,
    mins: minutes(recipe.totalTime) || minutes(recipe.prepTime) + minutes(recipe.cookTime),
    kcal: num(nut.calories), p: num(nut.proteinContent), c: num(nut.carbohydrateContent), f: num(nut.fatContent),
    ingredients: (recipe.recipeIngredient || []).map(text).slice(0, 60),
    steps: steps(recipe.recipeInstructions).slice(0, 40),
    image: String(img).slice(0, 500), url, site: new URL(url).hostname.replace("www.", ""),
  };
}

export default async function handler(req, res) {
  const url = new URL(req.url, "http://x");
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  try {
    const r = await importRecipe((url.searchParams.get("url") || "").trim());
    res.statusCode = 200; res.end(JSON.stringify(r));
  } catch (e) {
    res.statusCode = 400; res.end(JSON.stringify({ error: String(e.message).slice(0, 200) }));
  }
}
