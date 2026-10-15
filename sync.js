/* Cloud sync: email + password sign-in (Supabase). One row per learner in public.progress.
   Newest copy wins; the page pulls when it opens or comes back into view, and pushes after changes. */
const SB_URL = "https://ymkcvizzxuaksugcjcfh.supabase.co";
const SB_KEY = "sb_publishable_UfyjN1QgxRLR_Rx7k5bTGg_nQZUDW54"; // public browser key; access is limited by row-level security

const Sync = {
  client: null, user: null, status: "off", pushTimer: null, pushing: Promise.resolve(), conflict: null, lastSynced: null,

  init() {
    if (!window.supabase || !window.supabase.createClient) { this.set("unavailable"); return; }
    this.client = window.supabase.createClient(SB_URL, SB_KEY, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false } });
    this.client.auth.getSession().then(({ data }) => {
      this.user = data.session ? data.session.user : null;
      if (this.user) this.pull(false); else this.set("signed-out");
    });
    this.client.auth.onAuthStateChange((event, session) => {
      this.user = session ? session.user : null;
      if (event === "SIGNED_OUT") this.set("signed-out");
    });
    document.addEventListener("visibilitychange", () => { if (document.visibilityState === "visible" && this.user) this.pull(false); });
  },

  set(status, detail) {
    this.status = status; this.detail = detail || "";
    const el = document.getElementById("sync-status");
    if (el) {
      const t = { off: "", unavailable: "Sync unavailable", "signed-out": "Not synced · sign in", syncing: "Syncing…", synced: "Synced", error: "Sync failed · saved on this device", conflict: "Sync: choose which progress to keep" }[status] || "";
      el.textContent = t; el.dataset.state = status; el.hidden = !t;
    }
    if (typeof route !== "undefined" && route.tab === "progress" && typeof renderAccount === "function") renderAccount();
  },

  async signIn(email, password) {
    const { data, error } = await this.client.auth.signInWithPassword({ email, password });
    if (error) return friendlyAuthError(error);
    this.user = data.user; await this.pull(true); return null;
  },
  async signUp(email, password) {
    const { data, error } = await this.client.auth.signUp({ email, password });
    if (error) return friendlyAuthError(error);
    if (!data.session) return "Account created, but it needs email confirmation before you can sign in. Check your inbox.";
    this.user = data.user; await this.pull(true); return null;
  },
  async signOut() { await this.client.auth.signOut(); this.user = null; this.set("signed-out"); },

  async pull(firstSignIn) {
    if (!this.user) return;
    this.set("syncing");
    const { data, error } = await this.client.from("progress").select("state, updated_ms").eq("user_id", this.user.id).maybeSingle();
    if (error) { this.set("error", error.message); return; }
    const local = S, localHas = Object.keys(local.done || {}).length > 0 || Object.keys(local.cards || {}).length > 0;
    if (!data) { await this.push(); return; }
    const remote = data.state;
    if (firstSignIn && localHas && JSON.stringify(remote.done) !== JSON.stringify(local.done)) {
      this.conflict = { remote, remoteDone: Object.keys(remote.done || {}).length, localDone: Object.keys(local.done || {}).length };
      this.set("conflict"); if (typeof go === "function") go("progress"); return;
    }
    if ((data.updated_ms || 0) > (local.updated || 0)) { this.apply(remote); this.set("synced"); }
    else if ((local.updated || 0) > (data.updated_ms || 0)) await this.push();
    else this.set("synced");
  },

  apply(remote) {
    S = Object.assign(blank(), remote);
    try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {}
    if (typeof rq !== "undefined") { rq = null; practiceSet = null; }
    if (typeof render === "function") render();
  },

  resolve(keep) {
    const c = this.conflict; this.conflict = null; if (!c) return;
    if (keep === "remote") { this.apply(c.remote); this.set("synced"); }
    else { S.updated = Date.now(); try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} this.push(); }
  },

  schedule() {
    if (!this.user || this.conflict) return;
    clearTimeout(this.pushTimer);
    this.pushTimer = setTimeout(() => this.push(), 1500);
  },
  push() {
    if (!this.user) return Promise.resolve();
    this.pushing = this.pushing.then(async () => {
      this.set("syncing");
      const { error } = await this.client.from("progress").upsert({ user_id: this.user.id, state: S, updated_ms: S.updated || Date.now(), updated_at: new Date().toISOString() });
      if (error) this.set("error", error.message); else { this.lastSynced = new Date(); this.set("synced"); }
    }).catch(() => this.set("error"));
    return this.pushing;
  }
};

function friendlyAuthError(error) {
  const m = String(error.message || error);
  if (/invalid login credentials/i.test(m)) return "Wrong email or password. New here? Use Create account instead.";
  if (/already registered|already exists/i.test(m)) return "That email already has an account. Use Sign in instead.";
  if (/password should be at least/i.test(m)) return "Use a password of at least 6 characters.";
  if (/rate limit|too many/i.test(m)) return "Too many tries. Wait a minute and try again.";
  if (/fetch|network/i.test(m)) return "Can't reach the sync server. Check your internet connection.";
  return m;
}
