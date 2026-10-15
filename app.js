/* Zero-to-Pro Data Engineering hub: app logic. Content lives in content.js. */

/* ---------------- Utilities ---------------- */
const $ = s => document.querySelector(s);
const esc = s => String(s == null ? "" : s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const pad = n => String(n).padStart(2, "0");
const fmt = d => d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate());
const today = () => fmt(new Date());
const addDays = (s, n) => { const [y, m, d] = s.split("-").map(Number); return fmt(new Date(y, m - 1, d + n)); };
const daysBetween = (a, b) => { const p = s => { const [y, m, d] = s.split("-").map(Number); return Date.UTC(y, m - 1, d); }; return Math.round((p(b) - p(a)) / 86400000); };
const INTERVALS = [1, 3, 7, 14, 30];
const NEW_CARDS_PER_DAY = 20;

function toast(t) { const el = $("#toast"); el.textContent = t; el.classList.add("show"); clearTimeout(toast.t); toast.t = setTimeout(() => el.classList.remove("show"), 2000); }

/* ---------------- State ---------------- */
const KEY = "de-zero-to-pro-v2";
function blank() {
  return { v: 2, start: today(), done: {}, ex: {}, prac: {}, cards: {}, newToday: { date: "", n: 0 }, gaps: [], notes: {}, lnotes: {}, steps: {}, days: {}, updated: 0 };
}
let S = blank();
try { const raw = localStorage.getItem(KEY); if (raw) S = Object.assign(blank(), JSON.parse(raw)); } catch (e) {}
let saveTimer = null;
function save() {
  S.updated = Date.now();
  S.days[today()] = true;
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { toast("Couldn't save: browser storage is blocked"); } }, 250);
  if ((typeof Sync !== "undefined")) Sync.schedule();
}
window.addEventListener("pagehide", () => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} });

/* ---------------- Course helpers ---------------- */
const lessonById = id => LESSONS.find(l => l.id === id);
const lessonIndex = id => LESSONS.findIndex(l => l.id === id);
const exById = {};
LESSONS.forEach(l => l.ex.forEach(x => { exById[x.id] = { ...x, lesson: l.id, topic: l.topic }; }));
const cardList = [];
LESSONS.forEach(l => l.cards.forEach((c, i) => cardList.push({ id: l.id + "#" + i, lesson: l.id, topic: l.topic, front: c[0], back: c[1] })));

function doneCount() { return LESSONS.filter(l => S.done[l.id]).length; }
function nextLesson() { return LESSONS.find(l => !S.done[l.id]) || null; }
function lastDoneLesson() {
  let best = null, bestDate = "";
  for (const l of LESSONS) if (S.done[l.id] && S.done[l.id] >= bestDate) { best = l; bestDate = S.done[l.id]; }
  return best;
}
function calendarWeek() { return Math.max(1, Math.min(16, Math.floor(daysBetween(S.start, today()) / 7) + 1)); }
function expectedDone() { const w = calendarWeek(); return LESSONS.filter(l => l.week < w).length; }
function isResolved(exId) { const r = S.ex[exId]; return !!(r && r.status); }

function dueCards() {
  const t = today(); const out = [];
  let budget = S.newToday.date === t ? NEW_CARDS_PER_DAY - S.newToday.n : NEW_CARDS_PER_DAY;
  for (const c of cardList) {
    if (!S.done[c.lesson]) continue;
    const st = S.cards[c.id];
    if (st) { if (st.due <= t) out.push(c); }
    else if (budget > 0) { out.push(c); budget--; }
  }
  return out;
}
function openGaps() { return S.gaps.filter(g => !g.fixed); }
function gapTopics() { const m = {}; for (const g of openGaps()) m[g.topic] = (m[g.topic] || 0) + 1; return Object.entries(m).sort((a, b) => b[1] - a[1]); }
function addGap(topic, text, ref) {
  if (ref && S.gaps.some(g => g.ref === ref && !g.fixed)) return;
  S.gaps.unshift({ id: "g" + Date.now() + Math.random().toString(36).slice(2, 6), date: today(), topic, text, ref: ref || null, fixed: false });
}

/* ---------------- Engines: SQL (sql.js) and Python (Pyodide) ---------------- */
let sqlPromise = null;
function getSQL() {
  if (!sqlPromise) {
    sqlPromise = initSqlJs({ locateFile: f => "https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.8.0/" + f });
    sqlPromise.catch(() => { sqlPromise = null; });
  }
  return sqlPromise;
}
async function runSQL(code) {
  const SQL = await getSQL();
  const db = new SQL.Database();
  try {
    db.exec(SEED_SQL);
    const res = db.exec(code);
    return { result: res.length ? res[res.length - 1] : null, ran: true };
  } catch (e) {
    return { error: String(e.message || e) };
  } finally { db.close(); }
}

let pyPromise = null;
function loadScript(src) {
  return new Promise((res, rej) => { const s = document.createElement("script"); s.src = src; s.onload = res; s.onerror = () => rej(new Error("Could not download " + src)); document.head.appendChild(s); });
}
function getPy() {
  if (!pyPromise) {
    pyPromise = (async () => {
      if (!window.loadPyodide) await loadScript("https://cdn.jsdelivr.net/pyodide/v0.26.4/full/pyodide.js");
      return await loadPyodide({ indexURL: "https://cdn.jsdelivr.net/pyodide/v0.26.4/full/" });
    })();
    pyPromise.catch(() => { pyPromise = null; });
  }
  return pyPromise;
}
let pyQueue = Promise.resolve();
function runPy(code) {
  const job = pyQueue.then(async () => {
    const py = await getPy();
    const out = [], warn = [];
    py.setStdout({ batched: s => out.push(s) });
    py.setStderr({ batched: s => warn.push(s) });
    try {
      await py.loadPackagesFromImports(code, { messageCallback: () => {}, errorCallback: () => {} });
      const g = py.globals.get("dict")();
      try { await py.runPythonAsync(code, { globals: g }); } finally { g.destroy(); }
      return { out: out.join("\n"), warn: warn.join("\n") };
    } catch (e) {
      return { out: out.join("\n"), warn: warn.join("\n"), error: shortPyError(String(e.message || e)) };
    }
  });
  pyQueue = job.catch(() => {});
  return job;
}
function shortPyError(msg) {
  const lines = msg.trim().split("\n");
  const i = lines.findIndex(l => l.includes('File "<exec>"'));
  return (i >= 0 ? lines.slice(i) : lines.slice(-4)).join("\n").replace(/File "<exec>", /g, "");
}

/* ---------------- Checking ---------------- */
function normCell(v) {
  if (v === null || v === undefined) return null;
  if (typeof v === "number") return Math.round(v * 100) / 100;
  return String(v);
}
function compareSQL(mine, exp, ordered) {
  if (!mine && !exp) return { ok: true };
  if (!mine) return { ok: false, msg: "Your query didn't return a table. Make sure the last statement is a SELECT." };
  if (!exp) return { ok: false, msg: "The answer returns no rows, but yours returns " + mine.values.length + ". Check your WHERE conditions." };
  if (mine.columns.length !== exp.columns.length) return { ok: false, msg: `Your result has ${mine.columns.length} column${mine.columns.length === 1 ? "" : "s"}; the answer has ${exp.columns.length}. Check what you SELECT.` };
  if (mine.values.length !== exp.values.length) return { ok: false, msg: `Your result has ${mine.values.length} row${mine.values.length === 1 ? "" : "s"}; the answer has ${exp.values.length}. Check your filters, joins and grouping.` };
  const a = mine.values.map(r => JSON.stringify(r.map(normCell)));
  const b = exp.values.map(r => JSON.stringify(r.map(normCell)));
  const same = (x, y) => x.every((v, i) => v === y[i]);
  if (ordered) {
    if (same(a, b)) return { ok: true };
    if (same([...a].sort(), [...b].sort())) return { ok: false, msg: "Right rows, wrong order. Check your ORDER BY." };
  } else if (same([...a].sort(), [...b].sort())) return { ok: true };
  // Column order may differ
  const sortCols = rows => rows.map(r => JSON.stringify(r.map(normCell).map(x => JSON.stringify(x)).sort())).sort();
  if (same(sortCols(mine.values), sortCols(exp.values))) return { ok: false, msg: "Right values, but the columns are in a different order. Match the order in the question." };
  return { ok: false, msg: "Same number of rows and columns, but some values differ. Compare your rows with what the question asks." };
}
function normOut(s) { return String(s || "").split("\n").map(l => l.replace(/\s+$/, "")).join("\n").replace(/\n+$/, "").trim(); }

/* ---------------- Exercise component ---------------- */
const UI = {}; // key → { hints, fails, shown, code, outHTML, verdict, expected }
function uiFor(key, ex, ctx) {
  if (!UI[key]) {
    const saved = ctx === "l" ? S.ex[ex.id] : null;
    UI[key] = { hints: saved ? saved.hints || 0 : 0, fails: 0, shown: saved ? saved.status === "shown" || saved.status === "self-got" || saved.status === "self-miss" : false, code: saved && saved.code != null ? saved.code : (ex.starter || ""), outHTML: "", verdict: null, expected: null };
    if (saved && saved.status === "passed") UI[key].verdict = { ok: true, msg: "You solved this one." };
  }
  return UI[key];
}
function exHTML(ex, ctx, num, total) {
  const key = ctx + ":" + ex.id;
  const u = uiFor(key, ex, ctx);
  const runnable = ex.kind === "sql" || ex.kind === "py";
  const rec = ctx === "l" ? S.ex[ex.id] : S.prac[ex.id];
  const canShow = !u.shown && (u.hints >= 3 || u.fails >= 2 || (ex.kind === "text" && u.code.trim().length >= 20) || (u.verdict && u.verdict.ok));
  const label = ex.kind === "sql" ? "SQL" : ex.kind === "py" ? "Python" : "Written answer";
  const passed = u.verdict && u.verdict.ok;
  let unlockNote = "";
  if (!u.shown && !canShow) unlockNote = ex.kind === "text" ? "Write your answer to unlock the model answer." : "Answer unlocks after 2 checks or 3 hints.";
  return `<div class="ex ${passed ? "passed" : ""}" id="ex-${esc(key.replace(":", "-"))}" data-key="${esc(key)}">
    <div class="ex-head"><span class="eyebrow">${ctx === "p" ? `Problem ${num} of ${total}` : `Exercise ${num} of ${total}`} · ${label}${ctx === "p" && u.shown ? " · " + esc(ex.topic) : ""}</span>
      ${passed ? `<span class="chip good">Solved</span>` : rec && rec.status === "shown" ? `<span class="chip mark">Answer viewed</span>` : rec && rec.r === "miss" ? `<span class="chip bad">Missed last time</span>` : ""}</div>
    <div class="ex-q">${esc(ex.q)}</div>
    <textarea class="code ${ex.kind === "text" ? "prose" : ""}" id="code-${esc(key.replace(":", "-"))}" data-code="${esc(key)}" spellcheck="false" autocapitalize="off" autocomplete="off" placeholder="${ex.kind === "sql" ? "Write your SQL here…" : ex.kind === "py" ? "Write your Python here…" : "Write your answer here…"}" rows="${Math.max(4, Math.min(16, (u.code.match(/\n/g) || []).length + 2))}">${esc(u.code)}</textarea>
    <div class="row">
      ${runnable ? `<button class="btn" data-act="run">Run</button><button class="btn primary" data-act="check">Check</button>` : ""}
      <button class="btn ghost" data-act="hint" ${u.hints >= 3 || u.shown ? "disabled" : ""}>Hint ${Math.min(u.hints + 1, 3)} of 3</button>
      <button class="btn ghost" data-act="show" ${canShow ? "" : "disabled"}>${ex.kind === "text" ? "Show model answer" : "Show answer"}</button>
      ${unlockNote ? `<span class="small muted">${unlockNote}</span>` : ""}
    </div>
    ${ex.hints.slice(0, u.hints).map((h, i) => `<div class="hint"><b>Hint ${i + 1}.</b> ${esc(h)}</div>`).join("")}
    ${u.verdict ? `<div class="verdict ${u.verdict.ok ? "ok" : "no"}">${u.verdict.ok ? "✓ " : ""}${esc(u.verdict.msg)}</div>` : ""}
    ${u.expected != null ? `<div class="out"><div class="small muted">Expected output</div><pre>${esc(u.expected)}</pre></div>` : ""}
    ${u.outHTML ? `<div class="out">${u.outHTML}</div>` : ""}
    ${u.shown ? `<div class="answer"><div class="small"><b>${ex.kind === "text" ? "Model answer" : "Answer"}</b></div><pre>${esc(ex.sol)}</pre>
      ${ex.kind === "text" && !u.graded && !(ctx === "l" && rec && (rec.status === "self-got" || rec.status === "self-miss")) ? `<div class="row"><span class="small">Compare with your answer. How did you do?</span><button class="btn good" data-act="self-got">I got it</button><button class="btn bad" data-act="self-miss">I missed parts — add to Gaps</button></div>` : ""}
      ${ex.kind !== "text" && ctx === "l" ? `<div class="small muted">Read it, close it, then retype it from memory and press Check. It comes back in Practice.</div>` : ""}</div>` : ""}
  </div>`;
}
function tableHTML(res) {
  if (!res) return `<div class="small muted">The statement ran. No table to show (the last statement wasn't a SELECT, or it returned no rows).</div>`;
  const rows = res.values.slice(0, 60);
  return `<div class="small muted">${res.values.length} row${res.values.length === 1 ? "" : "s"}</div><div class="scroll"><table class="result"><thead><tr>${res.columns.map(c => `<th>${esc(c)}</th>`).join("")}</tr></thead><tbody>${rows.map(r => `<tr>${r.map(v => `<td>${v === null ? '<span class="null">NULL</span>' : esc(typeof v === "number" ? +v.toFixed(4) : v)}</td>`).join("")}</tr>`).join("")}</tbody></table></div>${res.values.length > 60 ? `<div class="small muted">Showing the first 60 rows.</div>` : ""}`;
}
function rerenderEx(key) {
  const [ctx, id] = key.split(":");
  const el = document.querySelector(`.ex[data-key="${CSS.escape(key)}"]`);
  if (!el) return;
  const list = ctx === "l" ? lessonById(exById[id].lesson).ex.map(x => exById[x.id]) : practiceSet.map(p => exById[p]);
  const i = list.findIndex(x => x.id === id);
  el.outerHTML = exHTML(exById[id], ctx, i + 1, list.length);
  if (ctx === "l") updateLessonFooter();
}
function busy(key, text) { const u = UI[key]; u.outHTML = `<div class="small muted loading">${esc(text)}</div>`; rerenderEx(key); }

async function exAction(key, act) {
  const [ctx, id] = key.split(":");
  const ex = exById[id];
  const u = UI[key];
  const code = u.code;
  const lessonRec = () => (S.ex[id] = Object.assign({ hints: 0 }, S.ex[id]));
  if (act === "hint") { u.hints = Math.min(3, u.hints + 1); if (ctx === "l") lessonRec().hints = u.hints; save(); rerenderEx(key); return; }
  if (act === "show") {
    u.shown = true;
    if (!(u.verdict && u.verdict.ok) && ex.kind !== "text") {
      if (ctx === "l") { const r = lessonRec(); if (!r.status) r.status = "shown"; addGap(ex.topic, "Needed the answer: " + ex.q.slice(0, 150), "ex:" + id); }
      else { S.prac[id] = { r: "miss", d: today() }; addGap(ex.topic, "Practice, needed the answer: " + ex.q.slice(0, 150), "ex:" + id); }
    }
    save(); rerenderEx(key); updateBadges(); return;
  }
  if (act === "self-got" || act === "self-miss") {
    const ok = act === "self-got";
    if (ctx === "l") lessonRec().status = ok ? "self-got" : "self-miss";
    else S.prac[id] = { r: ok ? "pass" : "miss", d: today() };
    if (!ok) addGap(ex.topic, ex.q.slice(0, 160), "ex:" + id);
    else if (ctx === "p") resolveGapSilently("ex:" + id);
    u.graded = true;
    save(); toast(ok ? "Nice. Logged." : "Added to Gaps"); rerenderEx(key); updateBadges(); return;
  }
  if (!code.trim()) { u.verdict = { ok: false, msg: "Write something first. A wrong attempt teaches you more than no attempt." }; rerenderEx(key); return; }
  if (ex.kind === "sql") {
    busy(key, sqlPromise ? "Running…" : "Starting the database (first run only)…");
    let mine;
    try { mine = await runSQL(code); } catch (e) { u.outHTML = `<div class="err">Couldn't load the SQL engine. Check your internet connection and try again.</div>`; rerenderEx(key); return; }
    if (mine.error) { u.outHTML = `<div class="err"><b>Error:</b> ${esc(mine.error)}</div>`; if (act === "check") { u.fails++; u.verdict = { ok: false, msg: "Your query has an error. Read the message: it usually names the problem (a typo, a missing comma, a wrong column name)." }; } rerenderEx(key); return; }
    u.outHTML = tableHTML(mine.result);
    if (act === "check") {
      const exp = await runSQL(ex.sol);
      const v = compareSQL(mine.result, exp.result, ex.ordered);
      markCheck(key, ctx, id, v);
    } else rerenderEx(key);
    return;
  }
  if (ex.kind === "py") {
    busy(key, pyPromise ? "Running…" : "Starting Python (about 10 MB, first run only; pandas adds a few seconds)…");
    let mine;
    try { mine = await runPy(code); } catch (e) { u.outHTML = `<div class="err">Couldn't load Python. Check your internet connection and try again.</div>`; rerenderEx(key); return; }
    u.outHTML = (mine.out ? `<pre>${esc(mine.out)}</pre>` : "") + (mine.warn && !mine.error ? `<details class="small muted"><summary>Warnings (not an error)</summary><pre>${esc(mine.warn)}</pre></details>` : "") + (mine.error ? `<div class="err"><b>Error:</b><pre>${esc(mine.error)}</pre></div>` : "") + (!mine.out && !mine.error ? `<div class="small muted">Ran with no output. Did you forget print()?</div>` : "");
    if (act === "check") {
      if (mine.error) { u.fails++; u.verdict = { ok: false, msg: "Your code raised an error. The last line of the error usually says what went wrong." }; rerenderEx(key); return; }
      const exp = await runPy(ex.sol);
      const ok = normOut(mine.out) === normOut(exp.out);
      if (!ok && u.fails >= 0) u.expected = normOut(exp.out);
      markCheck(key, ctx, id, ok ? { ok: true } : { ok: false, msg: "Your output doesn't match yet. Compare it with the expected output below, line by line." });
    } else rerenderEx(key);
  }
}
function markCheck(key, ctx, id, v) {
  const u = UI[key]; const ex = exById[id];
  if (v.ok) {
    u.verdict = { ok: true, msg: u.shown ? "Correct — from memory this time." : u.hints ? "Correct. Next time, try with fewer hints." : "Correct on your own. That one will stick." };
    u.expected = null;
    if (ctx === "l") { S.ex[id] = Object.assign({ hints: u.hints }, S.ex[id], { status: "passed" }); }
    else { S.prac[id] = { r: u.hints || u.shown ? "miss" : "pass", d: today() }; if (!u.hints && !u.shown) resolveGap("ex:" + id); }
    toast("Correct");
  } else {
    u.fails++;
    u.verdict = v;
    if (u.fails === 2 && ctx === "p") addGap(ex.topic, "Practice: " + ex.q.slice(0, 150), "ex:" + id);
  }
  save(); rerenderEx(key); updateBadges();
}
function resolveGap(ref) { const g = S.gaps.find(x => x.ref === ref && !x.fixed); if (g) { g.fixed = true; toast("Correct — and a gap closed"); } }

/* ---------------- Routing ---------------- */
let route = { tab: "today", lesson: null };
function parseHash() {
  const h = (location.hash || "").slice(1);
  if (h.startsWith("lesson-") && lessonById(h.slice(7))) return { tab: "lesson", lesson: h.slice(7) };
  if (["today", "path", "review", "practice", "gaps", "progress", "play"].includes(h)) return { tab: h, lesson: null };
  return { tab: "today", lesson: null };
}
function go(hash) { if (location.hash === "#" + hash) render(); else location.hash = hash; }
window.addEventListener("hashchange", () => { route = parseHash(); render(); window.scrollTo({ top: 0 }); });

/* ---------------- Views ---------------- */
function render() {
  document.querySelectorAll("#tabs button").forEach(b => b.setAttribute("aria-selected", b.dataset.tab === route.tab || (route.tab === "lesson" && b.dataset.tab === "path") ? "true" : "false"));
  const views = { today: viewToday, path: viewPath, lesson: viewLesson, review: viewReview, practice: viewPractice, gaps: viewGaps, progress: viewProgress, play: viewPlay };
  $("#view").innerHTML = views[route.tab]();
  if (route.tab === "review") bindReview();
  if (route.tab === "lesson") updateLessonFooter();
  if (route.tab === "progress") renderAccount();
  updateBadges();
}
function updateBadges() {
  const d = dueCards().length, g = openGaps().length;
  const dc = $("#dueCount"), gc = $("#gapCount");
  dc.textContent = d; dc.hidden = d === 0; gc.textContent = g; gc.hidden = g === 0;
}

function viewToday() {
  const done = doneCount();
  const next = nextLesson();
  const t = today();
  const steps = S.steps[t] || {};
  if (done === 0) {
    return `<section class="hero">
      <p class="eyebrow">Day 1 · Zero to pro in 16 weeks</p>
      <h2 class="big">You don't need to know anything yet.</h2>
      <p>This course takes you from "what is data?" to passing data engineering interviews: SQL, Python, pipelines, data modeling, Spark, Airflow, Docker, the cloud and your portfolio. Every lesson runs in this page, so there's nothing to install for the first two months.</p>
      <p>It's built on the methods in <i>Psychology of Intelligence: Learn Anything So Fast It's Almost Unfair</i>: you'll guess before you're taught, recall instead of re-reading, review on a schedule and explain things in your own words. It will feel harder than watching tutorials. That's the point.</p>
      <div class="row"><button class="btn primary big" data-go="lesson-b1">Start lesson 1: How to learn with this hub</button></div>
      <p class="small muted">About 2 hours on weekdays and 4–5 on weekends. Your progress saves in this browser.</p>
    </section>
    ${pathPreview()}`;
  }
  const behind = expectedDone() - done;
  const due = dueCards().length;
  const last = lastDoneLesson();
  const top = gapTopics();
  const doneToday = next ? S.done[next.id] === t : false;
  const lessonsToday = LESSONS.filter(l => S.done[l.id] === t).length;
  const weekend = [0, 6].includes(new Date().getDay());
  const pracCount = Object.values(S.prac).filter(p => p.d === t).length;
  const stepRow = (k, title, desc, action, auto) => {
    const on = auto || steps[k];
    return `<li class="${on ? "done" : ""}"><input type="checkbox" id="step-${k}" data-step="${k}" ${on ? "checked" : ""} ${auto ? "disabled" : ""} aria-label="${esc(title)} done">
      <div><div class="t">${title}</div><div class="d">${desc}</div></div><div>${action || ""}</div></li>`;
  };
  const n = S.notes[t] || {};
  return `<section class="sheet">
    <p class="eyebrow">Week ${calendarWeek()} of 16 · ${weekend ? "Weekend: 4–5 hours, two lessons" : "Weekday: about 2 hours"}</p>
    <h2>${next ? `Next up: ${esc(next.title)}` : "You've finished every lesson"}</h2>
    <div class="row">
      <span class="chip">${done}/${LESSONS.length} lessons</span>
      <span class="chip ${due ? "mark" : "good"}">${due} card${due === 1 ? "" : "s"} to review</span>
      ${top.length ? `<span class="chip bad">Weakest: ${esc(top[0][0])} (${top[0][1]})</span>` : `<span class="chip good">No open gaps</span>`}
      ${behind > 1 ? `<span class="chip bad">${behind} lessons behind schedule</span>` : behind < -1 ? `<span class="chip good">${-behind} lessons ahead</span>` : `<span class="chip good">On schedule</span>`}
    </div>
    ${behind > 3 ? `<p class="small muted" style="margin-top:10px">Behind is fine. Don't skip review to catch up: reviewing is what makes earlier lessons stick. Add one extra lesson on the weekend, or <button class="linkbtn" data-act="reset-start">restart the schedule from today</button>.</p>` : ""}
  </section>
  <section class="sheet">
    <h2>Today's session</h2>
    <ol class="steps">
      ${stepRow("review", "1 · Review flashcards", due ? `${due} card${due === 1 ? "" : "s"} due. Type each answer before you reveal it.` : "Nothing due right now.", due ? `<button class="btn" data-go="review">Review</button>` : "", due === 0)}
      ${stepRow("recall", "2 · Blank-page recall", last ? `Without looking, write everything you remember from <b>${esc(last.title)}</b>. Then open the lesson and check what you missed.` : "Write what you remember from your last lesson.", last ? `<button class="btn ghost" data-go="lesson-${last.id}">Check</button>` : "")}
      ${stepRow("practice", "3 · Mixed practice", `Two or three problems from earlier lessons, mixed together.${top.length ? ` Weak topics come up more: <b>${esc(top[0][0])}</b>.` : ""}`, `<button class="btn" data-go="practice">Practice</button>`, pracCount >= 2)}
      ${stepRow("lesson", "4 · New lesson", next ? `<b>${esc(next.title)}</b> · about ${next.minutes} min. Predict, learn, try, check yourself, explain, connect.` : "Keep reviewing and doing mixed practice to stay sharp.", next ? `<button class="btn primary" data-go="lesson-${next.id}">Start</button>` : "", lessonsToday > 0 || doneToday)}
    </ol>
  </section>
  <section class="sheet">
    <h2>Blank-page recall</h2>
    <p class="muted small">No peeking. Definitions, syntax, examples: whatever comes. Struggling to remember is what makes it stick.</p>
    <textarea class="prose" id="note-recall" data-note="recall" rows="6" placeholder="What I remember…">${esc(n.recall || "")}</textarea>
    <div class="row" style="margin-top:8px">
      <select id="quick-gap-topic" aria-label="Gap topic">${TOPICS.map(x => `<option ${last && last.topic === x ? "selected" : ""}>${esc(x)}</option>`).join("")}</select>
      <input type="text" id="quick-gap-text" placeholder="Something I forgot or got wrong" class="grow">
      <button class="btn" data-act="quick-gap">Add to Gaps</button>
    </div>
  </section>
  ${pathPreview()}`;
}
function pathPreview() {
  return `<section class="sheet"><h2>The path</h2><div class="phasegrid">${PHASES.map(p => {
    const ls = LESSONS.filter(l => l.phase === p.id); const d = ls.filter(l => S.done[l.id]).length;
    return `<button class="phase" data-go="path"><span class="eyebrow">${esc(p.level)} · ${esc(p.weeks)}</span><b>${esc(p.name)}</b><span class="bar"><i style="width:${Math.round(d / ls.length * 100)}%"></i></span><span class="small muted">${d}/${ls.length} lessons</span></button>`;
  }).join("")}</div></section>`;
}

function viewPath() {
  const next = nextLesson();
  return `<section class="sheet">
    <h2>Zero to pro: 16 weeks, ${LESSONS.length} lessons</h2>
    <p>Go in order: each lesson builds on the ones before. You can open any lesson to peek, but the method works best if you predict first and don't skip ahead.</p>
  </section>
  ${PHASES.map(p => {
    const ls = LESSONS.filter(l => l.phase === p.id); const d = ls.filter(l => S.done[l.id]).length;
    return `<section class="sheet">
      <div class="phase-head"><div><p class="eyebrow">${esc(p.level)} · ${esc(p.weeks)}</p><h2>${esc(p.name)}</h2></div><span class="chip ${d === ls.length ? "good" : ""}">${d}/${ls.length}</span></div>
      <ol class="lessons">${ls.map(l => {
        const st = S.done[l.id] ? "done" : next && next.id === l.id ? "next" : "";
        return `<li class="${st}"><button data-go="lesson-${l.id}"><span class="dot" aria-hidden="true">${st === "done" ? "✓" : st === "next" ? "→" : ""}</span><span class="lt">${esc(l.title)}</span><span class="small muted">Wk ${l.week} · ${l.minutes} min${l.ex.some(x => x.kind !== "text") ? " · runs in page" : ""}</span></button></li>`;
      }).join("")}</ol></section>`;
  }).join("")}`;
}

function viewLesson() {
  const l = lessonById(route.lesson);
  const i = lessonIndex(l.id);
  const phase = PHASES.find(p => p.id === l.phase);
  const ln = S.lnotes[l.id] || {};
  const predicted = (ln.predict || "").trim().length > 0;
  const revealed = !!ln.revealed;
  const prev = LESSONS[i - 1], next = LESSONS[i + 1];
  return `<article class="lesson">
  <nav class="crumbs small"><button class="linkbtn" data-go="path">${esc(phase.name)}</button> · Lesson ${i + 1} of ${LESSONS.length} · Week ${l.week} · about ${l.minutes} min</nav>
  <h1 class="ltitle">${esc(l.title)}</h1>
  ${S.done[l.id] ? `<p class="chip good">Completed ${esc(S.done[l.id])}</p>` : ""}

  <section class="sheet step">
    <p class="eyebrow">Step 1 · Predict first</p>
    <p class="lead">${esc(l.predict.q)}</p>
    <p class="small muted">Guess before you learn. Being wrong now makes the right answer stick better later.</p>
    <textarea class="prose" id="predict-${l.id}" data-lnote="predict" rows="3" placeholder="My guess…">${esc(ln.predict || "")}</textarea>
    <div class="row"><button class="btn" data-act="reveal-predict" ${predicted && !revealed ? "" : "disabled"}>${revealed ? "Answer shown" : "Show the answer"}</button>${!predicted ? `<span class="small muted">Write a guess first. Any guess.</span>` : ""}</div>
    ${revealed ? `<div class="answer">${esc(l.predict.a)}</div>` : ""}
  </section>

  <section class="sheet step body">
    <p class="eyebrow">Step 2 · Learn</p>
    ${l.body}
  </section>

  <section class="sheet step">
    <p class="eyebrow">Step 3 · Try it</p>
    ${l.ex.some(x => x.kind === "sql") ? `<p class="small muted">Tables you can use: ${SCHEMA.map(s => `<code>${s[0]}</code>`).join(" ")} — details in the <button class="linkbtn" data-go="play">Playground</button>. Ctrl/Cmd + Enter runs your code.</p>` : ""}
    ${l.ex.map((x, k) => exHTML(exById[x.id], "l", k + 1, l.ex.length)).join("")}
  </section>

  <section class="sheet step">
    <p class="eyebrow">Step 4 · Check yourself</p>
    <p class="small muted">Answer from memory, then reveal. These become your flashcards when you finish the lesson.</p>
    ${l.cards.map((c, k) => { const cid = l.id + "#" + k; const st = (ln.quiz || {})[k]; return `<div class="quiz" data-q="${k}">
      <div class="qf">${esc(c[0])}</div>
      ${st ? `<div class="answer small">${esc(c[1])}</div><div class="small ${st === "got" ? "goodtxt" : "badtxt"}">${st === "got" ? "✓ You knew it" : "✗ Added to Gaps — it'll come back"}</div>` : `<input type="text" class="grow" id="quiz-${esc(cid.replace("#", "-"))}" placeholder="Your answer" data-quiz-input="${k}"><div class="row"><button class="btn ghost" data-act="quiz-reveal" data-q="${k}">Reveal</button></div><div class="qreveal" hidden><div class="answer small">${esc(c[1])}</div><div class="row"><button class="btn good" data-act="quiz-got" data-q="${k}">I knew it</button><button class="btn bad" data-act="quiz-miss" data-q="${k}">I didn't</button></div></div>`}
    </div>`; }).join("")}
  </section>

  <section class="sheet step">
    <p class="eyebrow">Step 5 · Explain it simply</p>
    <p class="lead">${esc(l.feynman)}</p>
    <p class="small muted">Short sentences, no jargon, one example. Then ask yourself "why?" about each sentence. Where you get stuck is a gap: add it.</p>
    <textarea class="prose" id="feynman-${l.id}" data-lnote="feynman" rows="5" placeholder="In plain words…">${esc(ln.feynman || "")}</textarea>
    <p class="eyebrow" style="margin-top:18px">Step 6 · Connect it</p>
    <p class="lead">${esc(l.connect)}</p>
    <textarea class="prose" id="connect-${l.id}" data-lnote="connect" rows="3" placeholder="My answer…">${esc(ln.connect || "")}</textarea>
  </section>

  <section class="sheet step" id="lesson-footer"></section>
  <nav class="row between">${prev ? `<button class="btn ghost" data-go="lesson-${prev.id}">← ${esc(prev.title)}</button>` : "<span></span>"}${next ? `<button class="btn ghost" data-go="lesson-${next.id}">${esc(next.title)} →</button>` : ""}</nav>
  </article>`;
}
function updateLessonFooter() {
  const el = $("#lesson-footer"); if (!el || route.tab !== "lesson") return;
  const l = lessonById(route.lesson);
  const left = l.ex.filter(x => !isResolved(x.id)).length;
  const ln = S.lnotes[l.id] || {};
  const quizLeft = l.cards.length - Object.keys(ln.quiz || {}).length;
  const feyn = (ln.feynman || "").trim().length >= 30;
  const next = LESSONS[lessonIndex(l.id) + 1];
  if (S.done[l.id]) {
    el.innerHTML = `<h2>Lesson complete</h2><p>Its ${l.cards.length} flashcards are in your review schedule. ${next ? "Ready for the next one, or done for today?" : "That was the last lesson."}</p><div class="row">${next ? `<button class="btn primary" data-go="lesson-${next.id}">Next lesson</button>` : ""}<button class="btn ghost" data-go="today">Back to today</button></div>`;
    return;
  }
  const todo = [];
  if (left) todo.push(`${left} exercise${left === 1 ? "" : "s"} to solve (or view the answer)`);
  if (quizLeft) todo.push(`${quizLeft} check-yourself question${quizLeft === 1 ? "" : "s"}`);
  if (!feyn) todo.push("a plain-words explanation (a few sentences)");
  el.innerHTML = `<h2>Finish the lesson</h2>
    ${todo.length ? `<p>Still to do: ${todo.join("; ")}.</p>` : `<p>Everything's done. Finishing adds this lesson's ${l.cards.length} flashcards to your review schedule.</p>`}
    <div class="row"><button class="btn primary" data-act="complete" ${todo.length ? "disabled" : ""}>Mark lesson complete</button>
    ${todo.length ? `<button class="linkbtn small" data-act="complete-anyway">Finish anyway (unfinished parts go to Gaps)</button>` : ""}</div>`;
}
function completeLesson(force) {
  const l = lessonById(route.lesson);
  const t = today();
  if (force) {
    l.ex.filter(x => !isResolved(x.id)).forEach(x => addGap(l.topic, "Skipped exercise: " + x.q.slice(0, 140), "ex:" + x.id));
    const ln = S.lnotes[l.id] || {};
    l.cards.forEach((c, k) => { if (!(ln.quiz || {})[k]) addGap(l.topic, "Skipped: " + c[0], "card:" + l.id + "#" + k); });
  }
  S.done[l.id] = t;
  l.cards.forEach((c, k) => { const id = l.id + "#" + k; if (!S.cards[id]) S.cards[id] = { box: 0, due: addDays(t, 1), last: "new" }; });
  save(); toast("Lesson complete"); render();
  const f = $("#lesson-footer"); if (f) f.scrollIntoView({ block: "center" });
}

/* Review (spaced repetition) */
let rq = null, ri = 0, rRevealed = false, rStats = { got: 0, miss: 0 }, rAttempt = "";
function viewReview() {
  if (!rq) { rq = dueCards().map(c => c.id); ri = 0; rRevealed = false; rStats = { got: 0, miss: 0 }; rAttempt = ""; }
  const boxes = [0, 0, 0, 0, 0];
  let total = 0;
  for (const c of cardList) { if (!S.done[c.lesson]) continue; total++; const st = S.cards[c.id]; if (st) boxes[st.box]++; }
  const head = `<section class="sheet"><h2>Review</h2>
    <p>Cards from finished lessons come back after 1, 3, 7, 14, then 30 days. Get one wrong and it starts again at 1 day. Mixed topics, on purpose.</p>
    <div class="boxes">${INTERVALS.map((d, i) => `<div><b>${boxes[i]}</b>${d}-day</div>`).join("")}</div>
    <p class="small muted" style="margin-top:8px">${total} cards unlocked from ${doneCount()} finished lesson${doneCount() === 1 ? "" : "s"}.</p></section>`;
  if (!total) return head + `<section class="card"><div class="front">No cards yet.</div><p>Finish your first lesson and its flashcards appear here the next day.</p><div class="row"><button class="btn primary" data-go="lesson-${(nextLesson() || LESSONS[0]).id}">Go to the next lesson</button></div></section>`;
  if (ri >= rq.length) {
    return head + `<section class="card"><div class="front">${rq.length ? "Done for today." : "Nothing due right now."}</div>
      ${rq.length ? `<div class="stats"><span><b>${rStats.got}</b> knew it</span><span><b>${rStats.miss}</b> missed (back tomorrow, and in Gaps)</span></div>` : ""}
      <p class="muted">Come back tomorrow. ${nextDueText()}</p><div class="row"><button class="btn" data-go="practice">Do mixed practice</button><button class="btn ghost" data-go="today">Back to today</button></div></section>`;
  }
  const c = cardList.find(x => x.id === rq[ri]);
  return head + `<section class="card">
    <div class="stats"><span>Card <b>${ri + 1}</b> of ${rq.length}</span><span class="chip">${esc(c.topic)}</span></div>
    <div class="front">${esc(c.front)}</div>
    <textarea class="prose" id="review-attempt" rows="3" placeholder="Type your answer from memory first…">${esc(rAttempt)}</textarea>
    ${rRevealed ? `<div class="back"><p class="eyebrow">Answer</p><p>${esc(c.back)}</p>
      <div class="row"><button class="btn good" data-act="card-got">I knew it</button><button class="btn bad" data-act="card-miss">I didn't</button></div></div>`
      : `<div class="row"><button class="btn primary" data-act="card-show" id="card-show" ${rAttempt.trim().length < 2 ? "disabled" : ""}>Reveal</button><span class="small muted">Type something first. A guess counts.</span></div>`}
  </section>`;
}
function nextDueText() {
  const dues = Object.values(S.cards).map(c => c.due).filter(d => d > today()).sort();
  return dues.length ? `Next cards are due ${dues[0] === addDays(today(), 1) ? "tomorrow" : "on " + dues[0]}.` : "";
}
function bindReview() {
  const ta = $("#review-attempt"); if (!ta) return;
  ta.addEventListener("input", () => { rAttempt = ta.value; const b = $("#card-show"); if (b) b.disabled = ta.value.trim().length < 2; });
  if (!rRevealed) ta.focus({ preventScroll: true });
}
function gradeCard(ok) {
  const c = cardList.find(x => x.id === rq[ri]); const t = today();
  const st = S.cards[c.id];
  if (!st) { if (S.newToday.date !== t) S.newToday = { date: t, n: 0 }; S.newToday.n++; }
  let box = st ? st.box : -1;
  if (ok) { box = Math.min(box + 1, 4); rStats.got++; resolveGapSilently("card:" + c.id); }
  else { box = 0; rStats.miss++; addGap(c.topic, "Flashcard: " + c.front, "card:" + c.id); }
  S.cards[c.id] = { box, due: addDays(t, INTERVALS[box]), last: ok ? "got" : "miss" };
  ri++; rRevealed = false; rAttempt = "";
  save(); render();
}
function resolveGapSilently(ref) { const g = S.gaps.find(x => x.ref === ref && !x.fixed); if (g) g.fixed = true; }

/* Practice (interleaved) */
let practiceSet = null;
function buildPractice() {
  const pool = Object.values(exById).filter(x => S.done[x.lesson]);
  const weak = new Set(gapTopics().map(x => x[0]));
  const scored = pool.map(x => {
    const r = S.prac[x.id], lr = S.ex[x.id];
    let s = Math.random();
    if (weak.has(x.topic)) s += 0.7;
    if (r && r.r === "miss") s += 0.6;
    if (lr && (lr.status === "shown" || lr.status === "self-miss")) s += 0.5;
    if (r && r.r === "pass") s -= 0.5 - Math.min(0.5, daysBetween(r.d, today()) / 30);
    if (x.kind === "text") s -= 0.2;
    return { x, s };
  }).sort((a, b) => b.s - a.s);
  const picked = [], perTopic = {};
  for (const { x } of scored) { if (picked.length >= 4) break; if ((perTopic[x.topic] || 0) >= 2) continue; picked.push(x.id); perTopic[x.topic] = (perTopic[x.topic] || 0) + 1; }
  for (let i = picked.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [picked[i], picked[j]] = [picked[j], picked[i]]; }
  practiceSet = picked;
  picked.forEach(id => { delete UI["p:" + id]; });
}
function viewPractice() {
  if (!doneCount()) return `<section class="sheet"><h2>Mixed practice</h2><p>Practice mixes problems from lessons you've finished. Finish your first lesson to unlock it.</p><div class="row"><button class="btn primary" data-go="lesson-${(nextLesson() || LESSONS[0]).id}">Go to the next lesson</button></div></section>`;
  if (!practiceSet) buildPractice();
  return `<section class="sheet"><h2>Mixed practice</h2>
    <p>Problems from every lesson you've finished, shuffled and unlabeled, starting from a blank editor. Working out <i>which</i> tool a problem needs is half the skill. Weak topics and missed problems come up more often.</p>
    <div class="row"><button class="btn" data-act="new-set">New mixed set</button><span class="small muted">${Object.keys(S.prac).length} problems practiced so far</span></div></section>
  <section class="sheet">${practiceSet.map((id, k) => exHTML(exById[id], "p", k + 1, practiceSet.length)).join("")}</section>
  <section class="sheet"><h2>More practice outside this page</h2><ul class="res">
    <li><a href="https://datalemur.com/questions" target="_blank" rel="noopener">DataLemur</a> <span class="muted">— real SQL interview questions by company</span></li>
    <li><a href="https://leetcode.com/studyplan/top-sql-50/" target="_blank" rel="noopener">LeetCode SQL 50</a> <span class="muted">— the standard SQL interview set</span></li>
    <li><a href="https://www.kaggle.com/learn" target="_blank" rel="noopener">Kaggle Learn</a> <span class="muted">— free Python, pandas and data-cleaning courses</span></li></ul></section>`;
}

function viewGaps() {
  const tops = gapTopics(); const max = tops.length ? tops[0][1] : 1;
  const open = openGaps(), fixed = S.gaps.filter(g => g.fixed);
  return `<section class="sheet"><h2>Gaps</h2>
    <p>Every miss lands here automatically: wrong flashcards, answers you had to look up, skipped parts. Your weakest topics come up first in practice. A gap closes when you get it right later on your own, or when you mark it fixed.</p>
    ${tops.length ? `<div class="topicbars">${tops.map(([k, c]) => `<div><span>${esc(k)}</span><span class="b" style="width:${Math.max(6, c / max * 100)}%"></span><em>${c}</em></div>`).join("")}</div>` : ""}
    <div class="row"><select id="gap-topic" aria-label="Gap topic">${TOPICS.map(x => `<option>${esc(x)}</option>`).join("")}</select>
    <input type="text" id="gap-text" placeholder="Something I got wrong or couldn't explain" class="grow"><button class="btn primary" data-act="add-gap">Add</button></div></section>
  <section class="sheet"><h2>Open (${open.length})</h2>
    ${open.length ? open.map(gapRow).join("") : `<p class="muted">No open gaps. Misses will appear here.</p>`}
    ${fixed.length ? `<h3>Fixed (${fixed.length})</h3>${fixed.slice(0, 40).map(gapRow).join("")}` : ""}</section>`;
}
function gapRow(g) {
  const ref = g.ref && g.ref.startsWith("ex:") ? exById[g.ref.slice(3)] : g.ref && g.ref.startsWith("card:") ? cardList.find(c => c.id === g.ref.slice(5)) : null;
  const lessonId = ref ? ref.lesson : null;
  return `<div class="gap ${g.fixed ? "fixed" : ""}"><div class="gt"><span class="chip ${g.fixed ? "good" : "bad"}">${esc(g.topic)}</span> <span class="small muted mono">${esc(g.date)}</span><br>${esc(g.text)}</div>
    <div class="row">${lessonId ? `<button class="btn ghost" data-go="lesson-${lessonId}">Lesson</button>` : ""}<button class="btn" data-act="toggle-gap" data-gid="${esc(g.id)}">${g.fixed ? "Reopen" : "Fixed"}</button><button class="btn ghost" data-act="del-gap" data-gid="${esc(g.id)}">Remove</button></div></div>`;
}

const SKILLS = [
  ["SQL: joins, aggregates, CTEs, window functions", ["s1","s2","s3","s4","s5","s6","s7","s8","s9","s10","s11","s12","s13","s14","s15","s16","s17","s18"], "SQL"],
  ["Python", ["p1","p2","p3","p4","p5"], "Python"],
  ["pandas", ["p6","p7","p8","p9"], "pandas"],
  ["Command line and Git", ["t1","t2","t3"], "Tools"],
  ["ETL pipelines and PostgreSQL", ["e1","e2","e3"], "Pipelines"],
  ["Data modeling / star schema", ["m1","m2","m3"], "Modeling"],
  ["Apache Spark / PySpark", ["k1","k2"], "Spark"],
  ["Airflow", ["a1"], "Airflow"],
  ["Docker", ["d1"], "Docker & Cloud"],
  ["AWS (S3, EC2, IAM)", ["c1"], "Docker & Cloud"],
  ["CI/CD and testing", ["c2"], "Docker & Cloud"],
  ["dbt, Power BI, T-SQL (basic)", ["x1"], "Docker & Cloud"],
  ["Portfolio project and STAR stories", ["j1","j2","j3"], "Interview"]
];
function skillLevel(ids, topic) {
  const d = ids.filter(id => S.done[id]).length;
  if (d === 0) return 0;
  if (d < ids.length) return 1;
  const cards = cardList.filter(c => ids.includes(c.lesson));
  const mature = cards.filter(c => S.cards[c.id] && S.cards[c.id].box >= 2).length;
  const gaps = openGaps().filter(g => g.topic === topic).length;
  if (mature / cards.length >= 0.7 && gaps === 0) return 3;
  return 2;
}
const LEVELS = [["Not started", ""], ["Learning", "mark"], ["Can explain", ""], ["Interview-ready", "good"]];
function viewProgress() {
  const studied = Object.keys(S.days).length;
  return `<section class="sheet" id="account"></section>
  <section class="sheet"><h2>Progress</h2>
    <div class="stats"><span><b>${doneCount()}</b>/${LESSONS.length} lessons</span><span><b>${Object.values(S.cards).filter(c => c.box >= 2).length}</b> cards remembered for a week or more</span><span><b>${openGaps().length}</b> open gaps</span><span><b>${studied}</b> day${studied === 1 ? "" : "s"} studied</span></div></section>
  <section class="sheet"><h2>Resume check</h2>
    <p>Which skills you can honestly claim today. <b>Can explain</b> = all lessons done. <b>Interview-ready</b> = all lessons done, most flashcards remembered for 7+ days, and no open gaps in that topic. Claim a skill on your resume only at <b>Can explain</b> or above.</p>
    <div class="scroll"><table class="skilltbl"><thead><tr><th>Skill</th><th>Lessons</th><th>Level</th><th>Safe to claim?</th></tr></thead><tbody>
    ${SKILLS.map(([name, ids, topic]) => { const lv = skillLevel(ids, topic); return `<tr><td>${esc(name)}</td><td class="mono">${ids.filter(id => S.done[id]).length}/${ids.length}</td><td><span class="chip ${LEVELS[lv][1]}">${LEVELS[lv][0]}</span></td><td>${lv >= 2 ? `<span class="chip good">Yes</span>` : `<span class="chip bad">Not yet</span>`}</td></tr>`; }).join("")}
    </tbody></table></div></section>
  <section class="sheet"><h2>Schedule</h2>
    <div class="row"><label for="start-date">I started on</label><input type="date" id="start-date" value="${esc(S.start)}"><span class="small muted">Week ${calendarWeek()} of 16. Change this if you take a break.</span></div></section>
  <section class="sheet"><h2>Backup code</h2>
    <p>A manual copy of your progress, in case you ever can't sign in. Copy it now and then and keep it somewhere safe.</p>
    <div class="row"><button class="btn" data-act="export">Copy backup code</button></div>
    <textarea id="backup" class="code" rows="3" placeholder="Paste a backup code here to restore…"></textarea>
    <div class="row"><button class="btn" data-act="import">Restore from code</button><span class="small muted">Restoring replaces the progress on this device.</span></div>
    <div id="import-confirm"></div></section>`;
}

function viewPlay() {
  const u = uiFor("play:sql", { id: "play-sql", starter: "SELECT * FROM customers;" }, "play");
  const v = uiFor("play:py", { id: "play-py", starter: "print('hello')" }, "play");
  return `<section class="sheet"><h2>Playground</h2><p>Try anything here. Nothing is checked or saved, and the database resets on every run.</p></section>
  <section class="sheet"><h3>The practice database</h3>
    <div class="scroll"><table class="skilltbl"><thead><tr><th>Table</th><th>Columns</th><th>What's in it</th></tr></thead><tbody>${SCHEMA.map(s => `<tr><td class="mono">${s[0]}</td><td class="mono small">${s[1]}</td><td class="small">${esc(s[2])}</td></tr>`).join("")}</tbody></table></div></section>
  <section class="sheet"><h3>SQL</h3>
    <textarea class="code" id="play-sql" data-play="sql" rows="6" spellcheck="false">${esc(u.code)}</textarea>
    <div class="row"><button class="btn primary" data-act="play-sql">Run</button></div><div class="out" id="play-sql-out">${u.outHTML}</div></section>
  <section class="sheet"><h3>Python</h3>
    <textarea class="code" id="play-py" data-play="py" rows="6" spellcheck="false">${esc(v.code)}</textarea>
    <div class="row"><button class="btn primary" data-act="play-py">Run</button><span class="small muted">pandas works: import pandas as pd</span></div><div class="out" id="play-py-out">${v.outHTML}</div></section>`;
}

function renderAccount() {
  const el = $("#account"); if (!el || !(typeof Sync !== "undefined")) return;
  if (Sync.status === "unavailable" || !Sync.client) { el.innerHTML = `<h2>Sync</h2><p class="muted">Sync couldn't load. Check your internet connection and reload. Your progress is still saved on this device.</p>`; return; }
  if (Sync.conflict) {
    const c = Sync.conflict;
    el.innerHTML = `<h2>Which progress do you want to keep?</h2>
      <p>This device and your account have different progress.</p>
      <div class="row"><button class="btn primary" data-act="keep-remote">Use my account's progress (${c.remoteDone} lesson${c.remoteDone === 1 ? "" : "s"})</button>
      <button class="btn" data-act="keep-local">Use this device's progress (${c.localDone} lesson${c.localDone === 1 ? "" : "s"})</button></div>
      <p class="small muted">The one you don't pick is replaced on all your devices.</p>`;
    return;
  }
  if (Sync.user) {
    el.innerHTML = `<h2>Sync is on</h2>
      <p>Signed in as <b>${esc(Sync.user.email)}</b>. Your progress saves to your account and shows up on every device where you sign in.</p>
      <p class="small muted">${Sync.status === "syncing" ? "Syncing…" : Sync.status === "error" ? "Last sync failed (" + esc(Sync.detail || "network") + "). Your progress is safe on this device and will sync next time." : Sync.lastSynced ? "Last synced at " + Sync.lastSynced.toLocaleTimeString() + "." : "Up to date."}</p>
      <div class="row"><button class="btn" data-act="sync-now">Sync now</button><button class="btn ghost" data-act="sign-out">Sign out</button></div>`;
    return;
  }
  el.innerHTML = `<h2>Sync your phone and laptop</h2>
    <p>Sign in with the same email and password on each device and your progress follows you. First time? Pick a password and tap <b>Create account</b>.</p>
    <form id="auth-form" class="authform" autocomplete="on">
      <label for="auth-email">Email</label><input type="email" id="auth-email" name="email" autocomplete="username" required>
      <label for="auth-pass">Password (6+ characters)</label><input type="password" id="auth-pass" name="password" autocomplete="current-password" minlength="6" required>
      <div class="row"><button class="btn primary" type="submit" data-mode="in">Sign in</button><button class="btn" type="submit" data-mode="up">Create account</button></div>
      <p class="small badtxt" id="auth-msg" role="alert"></p>
    </form>`;
}

/* ---------------- Events ---------------- */
document.addEventListener("click", async e => {
  const g = e.target.closest("[data-go]");
  if (g) { go(g.dataset.go); return; }
  const tb = e.target.closest("#tabs button[data-tab]");
  if (tb) { go(tb.dataset.tab); return; }
  const b = e.target.closest("[data-act]"); if (!b) return;
  const act = b.dataset.act;
  const exEl = b.closest(".ex");
  if (exEl) { exAction(exEl.dataset.key, act); return; }
  const l = route.tab === "lesson" ? lessonById(route.lesson) : null;
  if (act === "reveal-predict" && l) { S.lnotes[l.id] = Object.assign({}, S.lnotes[l.id], { revealed: true }); save(); render(); document.querySelector(".step .answer")?.scrollIntoView({ block: "nearest" }); }
  else if (act === "quiz-reveal") {
    const q = b.closest(".quiz"); const inp = q.querySelector("input");
    if (inp && !inp.value.trim()) { toast("Type a guess first. Any guess counts."); inp.focus(); return; }
    q.querySelector(".qreveal").hidden = false; b.hidden = true;
  }
  else if ((act === "quiz-got" || act === "quiz-miss") && l) {
    const k = +b.dataset.q; const ln = S.lnotes[l.id] = Object.assign({}, S.lnotes[l.id]); ln.quiz = Object.assign({}, ln.quiz, { [k]: act === "quiz-got" ? "got" : "miss" });
    if (act === "quiz-miss") addGap(l.topic, "Flashcard: " + l.cards[k][0], "card:" + l.id + "#" + k);
    save();
    const q = b.closest(".quiz");
    q.innerHTML = `<div class="qf">${esc(l.cards[k][0])}</div><div class="answer small">${esc(l.cards[k][1])}</div><div class="small ${act === "quiz-got" ? "goodtxt" : "badtxt"}">${act === "quiz-got" ? "✓ You knew it" : "✗ Added to Gaps — it'll come back"}</div>`;
    updateLessonFooter(); updateBadges();
  }
  else if (act === "complete") completeLesson(false);
  else if (act === "complete-anyway") completeLesson(true);
  else if (act === "card-show") { rRevealed = true; render(); }
  else if (act === "card-got") gradeCard(true);
  else if (act === "card-miss") gradeCard(false);
  else if (act === "new-set") { buildPractice(); render(); }
  else if (act === "add-gap" || act === "quick-gap") {
    const p = act === "add-gap" ? "gap" : "quick-gap";
    const txt = $("#" + p + "-text").value.trim(); if (!txt) { toast("Write what you missed first"); return; }
    addGap($("#" + p + "-topic").value, txt); save(); toast("Added to Gaps");
    if (act === "add-gap") render(); else { $("#quick-gap-text").value = ""; updateBadges(); }
  }
  else if (act === "toggle-gap") { const x = S.gaps.find(y => y.id === b.dataset.gid); if (x) { x.fixed = !x.fixed; save(); render(); } }
  else if (act === "del-gap") { S.gaps = S.gaps.filter(y => y.id !== b.dataset.gid); save(); render(); }
  else if (act === "reset-start") { S.start = addDays(today(), -7 * (Math.max(1, LESSONS[Math.min(doneCount(), LESSONS.length - 1)].week) - 1)); save(); toast("Schedule moved to match your progress"); render(); }
  else if (act === "export") {
    const code = btoa(unescape(encodeURIComponent(JSON.stringify(S))));
    const ta = $("#backup"); ta.value = code;
    try { await navigator.clipboard.writeText(code); toast("Backup code copied. Paste it on your other device."); }
    catch (err) { ta.select(); toast("Selected. Press Copy (Ctrl/Cmd + C)."); }
  }
  else if (act === "import") {
    const raw = $("#backup").value.trim();
    let data = null;
    try { data = JSON.parse(decodeURIComponent(escape(atob(raw)))); } catch (err) {}
    if (!data || data.v !== 2) { toast("That code isn't a valid backup. Copy it again from the other device."); return; }
    const n = Object.keys(data.done || {}).length;
    $("#import-confirm").innerHTML = `<div class="callout">This backup has ${n} finished lesson${n === 1 ? "" : "s"}. Replace this device's progress with it? <button class="btn primary" data-act="import-yes">Replace</button> <button class="btn ghost" data-act="import-no">Cancel</button></div>`;
    window.__pendingImport = data;
  }
  else if (act === "keep-remote") Sync.resolve("remote");
  else if (act === "keep-local") Sync.resolve("local");
  else if (act === "sync-now") Sync.pull(false);
  else if (act === "sign-out") { await Sync.signOut(); toast("Signed out. Progress stays on this device."); }
  else if (act === "import-yes" && window.__pendingImport) { S = Object.assign(blank(), window.__pendingImport); window.__pendingImport = null; save(); try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (err) {} toast("Progress restored"); rq = null; practiceSet = null; render(); }
  else if (act === "import-no") { window.__pendingImport = null; $("#import-confirm").innerHTML = ""; }
  else if (act === "play-sql") {
    const u = UI["play:sql"]; const out = $("#play-sql-out"); out.innerHTML = `<div class="small muted">Running…</div>`;
    try { const r = await runSQL(u.code); u.outHTML = r.error ? `<div class="err"><b>Error:</b> ${esc(r.error)}</div>` : tableHTML(r.result); } catch (err) { u.outHTML = `<div class="err">Couldn't load the SQL engine. Check your connection.</div>`; }
    out.innerHTML = u.outHTML;
  }
  else if (act === "play-py") {
    const u = UI["play:py"]; const out = $("#play-py-out"); out.innerHTML = `<div class="small muted">${pyPromise ? "Running…" : "Starting Python (first run only)…"}</div>`;
    try { const r = await runPy(u.code); u.outHTML = (r.out ? `<pre>${esc(r.out)}</pre>` : "") + (r.error ? `<div class="err"><pre>${esc(r.error)}</pre></div>` : "") || `<div class="small muted">No output.</div>`; } catch (err) { u.outHTML = `<div class="err">Couldn't load Python. Check your connection.</div>`; }
    out.innerHTML = u.outHTML;
  }
});
document.addEventListener("input", e => {
  const el = e.target;
  if (el.dataset.code) {
    const key = el.dataset.code; const u = UI[key]; if (!u) return;
    u.code = el.value;
    const [ctx, id] = key.split(":");
    if (ctx === "l") { S.ex[id] = Object.assign({ hints: u.hints }, S.ex[id], { code: el.value }); save(); }
    if (exById[id] && exById[id].kind === "text") {
      const btn = el.closest(".ex").querySelector('[data-act="show"]');
      if (btn && !u.shown) btn.disabled = !(el.value.trim().length >= 20 || u.hints >= 3);
    }
  }
  else if (el.dataset.play) { UI["play:" + el.dataset.play].code = el.value; }
  else if (el.dataset.lnote && route.tab === "lesson") {
    const l = route.lesson; S.lnotes[l] = Object.assign({}, S.lnotes[l], { [el.dataset.lnote]: el.value }); save();
    if (el.dataset.lnote === "predict") { const b = document.querySelector('[data-act="reveal-predict"]'); if (b && !S.lnotes[l].revealed) b.disabled = el.value.trim().length === 0; }
    if (el.dataset.lnote === "feynman") updateLessonFooter();
  }
  else if (el.dataset.note) { const t = today(); S.notes[t] = Object.assign({}, S.notes[t], { [el.dataset.note]: el.value }); save(); }
});
document.addEventListener("change", e => {
  const el = e.target;
  if (el.dataset.step) { const t = today(); S.steps[t] = Object.assign({}, S.steps[t], { [el.dataset.step]: el.checked }); save(); render(); }
  else if (el.id === "start-date" && el.value) { S.start = el.value; save(); render(); }
});
document.addEventListener("keydown", e => {
  const el = e.target;
  if (el.tagName !== "TEXTAREA" || !(el.classList.contains("code")) || el.classList.contains("prose")) return;
  if (e.key === "Tab" && !e.shiftKey && !e.altKey && !e.metaKey && !e.ctrlKey) {
    e.preventDefault();
    const s = el.selectionStart, en = el.selectionEnd;
    el.value = el.value.slice(0, s) + "    " + el.value.slice(en);
    el.selectionStart = el.selectionEnd = s + 4;
    el.dispatchEvent(new Event("input", { bubbles: true }));
  } else if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
    e.preventDefault();
    const exEl = el.closest(".ex");
    if (exEl) exAction(exEl.dataset.key, "run");
    else if (el.dataset.play) document.querySelector(`[data-act="play-${el.dataset.play}"]`).click();
  }
});

document.addEventListener("submit", async e => {
  if (e.target.id !== "auth-form") return;
  e.preventDefault();
  const mode = e.submitter && e.submitter.dataset.mode === "up" ? "up" : "in";
  const email = $("#auth-email").value.trim(), pass = $("#auth-pass").value;
  const msg = $("#auth-msg"); msg.textContent = mode === "up" ? "Creating your account…" : "Signing in…";
  e.target.querySelectorAll("button").forEach(b => b.disabled = true);
  const err = mode === "up" ? await Sync.signUp(email, pass) : await Sync.signIn(email, pass);
  if (err) { msg.textContent = err; e.target.querySelectorAll("button").forEach(b => b.disabled = false); }
  else { toast(mode === "up" ? "Account created. Sync is on." : "Signed in. Sync is on."); renderAccount(); }
});

route = parseHash();
render();
if ((typeof Sync !== "undefined")) Sync.init();
