/* Us: app fechado do casal. Site estático, sem build. Tudo conversa com o Supabase (login, banco e fotos). */
(function () {
"use strict";

/* ============ conexão ============ */
const SB_URL = "https://qjouhtitpufjnhocbnbs.supabase.co";
const SB_KEY = "sb_publishable_jFwJ41vOmpU4uTI44YbPdA_TxmA53gS";
const SB_KEY_LEGADA = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFqb3VodGl0cHVmam5ob2NibmJzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTUyMDEyNjgsImV4cCI6MjExMDc3NzI2OH0.yYO_ahpMMXpEd0gZTVt6nZ13yFBeh28V7ryujkv2Hd8";
let sb = null;

/* ============ utilidades ============ */
const $ = id => document.getElementById(id);
const esc = s => String(s == null ? "" : s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const MES = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
const MESL = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];
const SEM = ["domingo", "segunda", "terça", "quarta", "quinta", "sexta", "sábado"];
const pad = n => String(n).padStart(2, "0");
const ymd = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const parseYmd = s => { const [y, m, d] = String(s).slice(0, 10).split("-").map(Number); return new Date(y, m - 1, d); };
const todayDate = () => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; };
const fmtN = n => Number(n).toLocaleString("pt-BR");
const plural = (n, a, b) => `${fmtN(n)} ${n === 1 ? a : b}`;
const cap1 = s => s.charAt(0).toUpperCase() + s.slice(1);
const dayDiff = (a, b) => Math.round((a - b) / 864e5);

function fmtLong(s) { const d = parseYmd(s); return `${d.getDate()} de ${MESL[d.getMonth()]} de ${d.getFullYear()}`; }
function fmtShort(s, withYear = true) { const d = parseYmd(s); return `${d.getDate()} ${MES[d.getMonth()]}${withYear ? " " + d.getFullYear() : ""}`; }
function rangeLabel(a, b) {
  if (a && b) {
    const da = parseYmd(a), db = parseYmd(b);
    if (a === b) return fmtShort(a);
    if (da.getFullYear() === db.getFullYear() && da.getMonth() === db.getMonth()) return `${da.getDate()} a ${db.getDate()} ${MES[db.getMonth()]} ${db.getFullYear()}`;
    if (da.getFullYear() === db.getFullYear()) return `${fmtShort(a, false)} a ${fmtShort(b)}`;
    return `${fmtShort(a)} a ${fmtShort(b)}`;
  }
  if (a) return fmtShort(a);
  if (b) return `até ${fmtShort(b)}`;
  return "Sem datas";
}
function juntos(from, to) {
  let m = (to.getFullYear() - from.getFullYear()) * 12 + (to.getMonth() - from.getMonth());
  if (to.getDate() < from.getDate()) m--;
  if (m < 1) { const d = Math.max(0, dayDiff(to, from)); return d === 1 ? "1 dia" : `${d} dias`; }
  if (m < 12) return m === 1 ? "1 mês" : `${m} meses`;
  const a = Math.floor(m / 12), r = m % 12, as = a === 1 ? "1 ano" : `${a} anos`;
  return r ? `${as} e ${r === 1 ? "1 mês" : r + " meses"}` : as;
}
function relDay(iso) {
  const d = new Date(iso); if (isNaN(d)) return "";
  const t = todayDate(), dd = new Date(d.getFullYear(), d.getMonth(), d.getDate()), diff = dayDiff(t, dd);
  if (diff <= 0) return "hoje";
  if (diff === 1) return "ontem";
  if (diff < 7) return SEM[dd.getDay()];
  return fmtShort(ymd(dd), dd.getFullYear() !== t.getFullYear());
}

const IC = {
  back: '<path d="m15 5-7 7 7 7"/>', next: '<path d="m9 5 7 7-7 7"/>', plus: '<path d="M12 5v14M5 12h14"/>',
  upload: '<path d="M12 16V4M7 9l5-5 5 5M5 20h14"/>', trash: '<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>',
  pin: '<path d="M9 4h6l-1 6 3 3v2H7v-2l3-3Z"/><path d="M12 15v6"/>', lock: '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
  note: '<path d="M9 18V5l11-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="17" cy="16" r="3"/>', check: '<path d="m5 12.5 4.5 4.5L19 7.5"/>',
  x: '<path d="M6 6l12 12M18 6 6 18"/>', copy: '<rect x="8" y="8" width="12" height="12" rx="2.5"/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"/>',
  edit: '<path d="M12 20h8"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/>', pinfill: '<path d="M9 4h6l-1 6 3 3v2H7v-2l3-3Z" fill="currentColor"/><path d="M12 15v6"/>'
};
function ic(name, size = 22, sw = 2) {
  return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${IC[name]}</svg>`;
}
const PLAY = '<svg width="18" height="18" viewBox="0 0 24 24" fill="#fff" aria-hidden="true"><path d="M7 4.5v15l12.5-7.5Z"/></svg>';

/* ============ estado ============ */
const S = { user: null, members: [], couple: null, media: [], trips: [], lists: [], items: [], events: [], loaded: false, lastLoad: 0 };
const t0 = todayDate();
const UI = {
  tab: "feed", seg: "datas", openList: null, panel: null, viewer: null,
  calY: t0.getFullYear(), calM: t0.getMonth(), selDay: ymd(t0),
  authTab: "entrar", authEmail: "", recovery: false, dateStep: false, onbMode: "criar"
};
const view = $("view"), panel = $("panel"), viewer = $("viewer"), gate = $("gate"), app = $("app");

const me = () => S.members.find(m => m.user_id === (S.user && S.user.id)) || null;
const partner = () => S.members.find(m => m.user_id !== (S.user && S.user.id)) || null;
const nameOf = uid => { const m = S.members.find(x => x.user_id === uid); return m ? (m.display_name || "Alguém") : "Alguém"; };
const memberColor = uid => { const i = S.members.findIndex(m => m.user_id === uid); return i === 0 ? "var(--wine)" : "#e0899a"; };
const whoColor = uid => uid ? memberColor(uid) : "var(--red)";
const whoName = uid => uid ? nameOf(uid) : "Os dois";
const coupleNames = () => S.members.map(m => m.display_name || "Alguém").join(" & ");

/* ============ erros ============ */
function isNet(e) { const m = String((e && e.message) || e || ""); return /failed to fetch|networkerror|load failed|network request|timeout/i.test(m); }
function friendly(e, fallback) {
  const m = String((e && e.message) || e || "");
  if (isNet(e)) return "Sem conexão. Confira a internet e tente de novo.";
  if (/jwt expired|not signed in|invalid jwt/i.test(m)) return "Sua sessão expirou. Saia e entre de novo.";
  if (/row-level security|permission denied/i.test(m)) return "Você não tem permissão para isso. Entre de novo e tente outra vez.";
  return fallback || "Algo deu errado. Tente de novo em instantes.";
}
async function q(p) { const r = await p; if (r.error) throw r.error; return r.data; }

/* ============ avisos ============ */
const toastEl = $("toast"); let toastT;
function toast(m) { toastEl.textContent = m; toastEl.classList.add("on"); clearTimeout(toastT); toastT = setTimeout(() => toastEl.classList.remove("on"), 3200); }

/* ============ fotos privadas: links assinados em lote ============ */
const urlCache = new Map();
const fresh = p => { const c = urlCache.get(p); return c && c.exp > Date.now(); };
let hydrating = false, hydrateAgain = false;
async function hydrate() {
  if (hydrating) { hydrateAgain = true; return; }
  hydrating = true;
  try {
    do {
      hydrateAgain = false;
      const els = [...document.querySelectorAll("[data-path]:not([data-ok])")];
      const need = [...new Set(els.map(e => e.dataset.path).filter(p => p && !fresh(p)))];
      for (let i = 0; i < need.length; i += 100) {
        const chunk = need.slice(i, i + 100);
        try {
          const { data } = await sb.storage.from("media").createSignedUrls(chunk, 3600);
          (data || []).forEach(d => { if (d && d.signedUrl) urlCache.set(d.path, { url: d.signedUrl, exp: Date.now() + 55 * 60e3 }); });
        } catch (e) { /* tenta de novo no próximo desenho */ }
      }
      els.forEach(e => {
        const c = urlCache.get(e.dataset.path);
        if (c && fresh(e.dataset.path)) { e.src = e.tagName === "VIDEO" && e.dataset.thumb ? c.url + "#t=0.1" : c.url; e.dataset.ok = "1"; }
      });
    } while (hydrateAgain);
  } finally { hydrating = false; }
}
document.addEventListener("error", e => {
  const t = e.target;
  if (t && t.dataset && t.dataset.path && !t.dataset.retry) { t.dataset.retry = "1"; urlCache.delete(t.dataset.path); delete t.dataset.ok; hydrate(); }
}, true);
const imgTag = (path, alt = "", extra = "") => `<img data-path="${esc(path)}" alt="${esc(alt)}" ${extra}>`;

/* ============ carregar dados ============ */
async function fetchAll(table, build) {
  const out = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await build(sb.from(table).select("*")).range(from, from + 999);
    if (error) throw error;
    out.push(...data);
    if (data.length < 1000) break;
  }
  return out;
}
async function loadData() {
  const mem = await q(sb.from("couple_members").select("*"));
  S.members = mem.sort((a, b) => String(a.joined_at).localeCompare(String(b.joined_at)) || a.user_id.localeCompare(b.user_id));
  if (!me()) { S.couple = null; return false; }
  const coupleId = me().couple_id;
  const [couple, media, trips, lists, items, events] = await Promise.all([
    q(sb.from("couples").select("*").eq("id", coupleId).single()),
    fetchAll("media", b => b.order("taken_at", { ascending: false }).order("created_at", { ascending: false }).order("id")),
    q(sb.from("trips").select("*").order("created_at", { ascending: false })),
    q(sb.from("lists").select("*").order("updated_at", { ascending: false })),
    fetchAll("list_items", b => b.order("created_at", { ascending: true }).order("id")),
    q(sb.from("events").select("*").order("starts_on", { ascending: true }))
  ]);
  S.couple = couple; S.media = media; S.trips = trips; S.lists = lists; S.items = items; S.events = events;
  S.loaded = true; S.lastLoad = Date.now();
  return true;
}

/* ============ entrada (login, cadastro, recuperação) ============ */
function showGate(html) { app.hidden = true; gate.hidden = false; gate.innerHTML = html; closeSheet(); }
function loadingHTML(msg) { return `<div class="center stack"><div class="spinner" role="progressbar" aria-label="Carregando"></div><p>${esc(msg || "Carregando…")}</p></div>`; }
function errorGate(e) {
  showGate(`<div class="center stack"><h1 class="step">Não deu para abrir o Us</h1><p>${esc(friendly(e, "Algo deu errado ao carregar."))}</p><button class="btn" data-g="retry">Tentar de novo</button><button class="btn ghost" data-g="signout">Sair da conta</button></div>`);
}
const AUTH_HERO = `<div class="hero-us" aria-label="Us">Us</div><p class="tagline">Baixar o Us juntos é o novo juntar as escovas de dente.</p><p class="lede">Fotos, listas e datas, só de vocês dois.</p>`;
function authMsg(kind, text) { const el = $("authmsg"); if (el) { el.className = "msg " + kind; el.textContent = text; el.hidden = false; } }
function authErr(e) {
  const m = String((e && e.message) || e || "");
  if (isNet(e)) return "Sem conexão. Confira a internet e tente de novo.";
  if (/invalid login/i.test(m)) return "E-mail ou senha incorretos. Confira e tente de novo.";
  if (/not confirmed/i.test(m)) return "Falta confirmar seu e-mail. Abra o link que enviamos e volte para entrar.";
  if (/already registered|already been registered/i.test(m)) return "Esse e-mail já tem conta. Use a aba Entrar.";
  if (/password/i.test(m) && /(least|short|weak|characters)/i.test(m)) return "A senha precisa ter pelo menos 6 caracteres.";
  if (/valid email|invalid email|unable to validate email/i.test(m)) return "Esse e-mail não parece certo. Confira e tente de novo.";
  if (/rate limit|too many|security purposes/i.test(m)) return "Muitas tentativas seguidas. Espere um minuto e tente de novo.";
  if (/same password|different from the old/i.test(m)) return "Escolha uma senha diferente da anterior.";
  return "Não deu certo. Tente de novo em instantes.";
}
function showAuth(initialMsg) {
  const t = UI.authTab;
  if (t === "enviado") {
    showGate(`<div class="center">${AUTH_HERO}<div class="msg ok">Enviamos um link para <b>${esc(UI.authEmail)}</b>. Abra, confirme e volte para entrar.</div><button class="btn ghost" data-g="tab" data-v="entrar">Voltar para entrar</button></div>`);
    return;
  }
  if (t === "esqueci") {
    showGate(`<div class="center">${AUTH_HERO}
      <p id="authmsg" class="msg" hidden></p>
      <form data-form="esqueci" novalidate>
        <label class="field"><span>E-mail</span><input name="email" type="email" inputmode="email" autocomplete="email" autocapitalize="off" required value="${esc(UI.authEmail)}"></label>
        <button class="btn" type="submit">Enviar link</button>
      </form>
      <div class="row-links"><button class="link" data-g="tab" data-v="entrar">Voltar para entrar</button></div></div>`);
    return;
  }
  const entrar = t !== "criar";
  showGate(`<div class="center">${AUTH_HERO}
    <div class="seg" role="group" aria-label="Entrar ou criar conta" style="margin:0 0 18px">
      <button data-g="tab" data-v="entrar" aria-pressed="${entrar}">Entrar</button>
      <button data-g="tab" data-v="criar" aria-pressed="${!entrar}">Criar conta</button>
    </div>
    <p id="authmsg" class="msg ${initialMsg ? "err" : ""}" ${initialMsg ? "" : "hidden"}>${esc(initialMsg || "")}</p>
    <form data-form="${entrar ? "entrar" : "criar"}" novalidate>
      <label class="field"><span>E-mail</span><input name="email" type="email" inputmode="email" autocomplete="email" autocapitalize="off" required value="${esc(UI.authEmail)}"></label>
      <label class="field"><span>Senha</span><input name="senha" type="password" autocomplete="${entrar ? "current-password" : "new-password"}" minlength="6" required>${entrar ? "" : '<span class="help">Pelo menos 6 caracteres.</span>'}</label>
      <button class="btn" type="submit">${entrar ? "Entrar" : "Criar conta"}</button>
    </form>
    ${entrar ? '<div class="row-links"><button class="link" data-g="tab" data-v="esqueci">Esqueci a senha</button></div>' : ""}</div>`);
}
function showRecovery() {
  showGate(`<div class="center"><h1 class="step">Nova senha</h1><p class="lede">Escolha a senha que você vai usar daqui para frente.</p>
    <p id="authmsg" class="msg" hidden></p>
    <form data-form="recuperar" novalidate>
      <label class="field"><span>Nova senha</span><input name="senha" type="password" autocomplete="new-password" minlength="6" required><span class="help">Pelo menos 6 caracteres.</span></label>
      <button class="btn" type="submit">Salvar senha</button>
    </form></div>`);
}
function showOnboarding() {
  const criar = UI.onbMode === "criar";
  showGate(`<div class="center"><h1 class="step">Que bom ter você aqui</h1><p class="lede">Falta pouco para abrir o Us de vocês.</p>
    <p id="authmsg" class="msg" hidden></p>
    <form data-form="onb" novalidate>
      <label class="field"><span>Como você quer ser chamado(a)?</span><input name="nome" type="text" maxlength="60" autocomplete="given-name" required value="${esc(UI.onbName || "")}"></label>
      <div class="choice" role="group" aria-label="O que você quer fazer">
        <button type="button" data-g="mode" data-v="criar" aria-pressed="${criar}">Criar a conta do casal</button>
        <button type="button" data-g="mode" data-v="codigo" aria-pressed="${!criar}">Tenho um código</button>
      </div>
      ${criar ? '<p class="lede" style="margin-top:-4px">Você cria o Us e depois convida quem você ama com um código.</p>' : `<label class="field"><span>Código de convite</span><input name="codigo" type="text" maxlength="12" autocapitalize="characters" autocomplete="off" spellcheck="false" required value="${esc(UI.onbCode || "")}"><span class="help">Quem criou o Us encontra o código no perfil.</span></label>`}
      <button class="btn" type="submit">${criar ? "Criar a conta do casal" : "Entrar no Us"}</button>
    </form>
    <div class="row-links"><button class="link" data-g="signout">Sair da conta</button></div></div>`);
}
function showDateStep() {
  showGate(`<div class="center"><h1 class="step">Quando começou a história de vocês?</h1><p class="lede">Com a data de início o Us conta quanto tempo vocês já têm juntos.</p>
    <p id="authmsg" class="msg" hidden></p>
    <form data-form="data" novalidate>
      <label class="field"><span>Início do namoro</span><input name="data" type="date" max="${ymd(todayDate())}" required></label>
      <button class="btn" type="submit">Salvar e entrar</button>
    </form>
    <div class="row-links"><button class="link" data-g="skipdate">Pular por agora</button></div></div>`);
}

const FORMS = {
  async entrar(f) {
    const email = f.email.value.trim(), senha = f.senha.value; UI.authEmail = email;
    if (!email || !senha) return authMsg("err", "Preencha o e-mail e a senha.");
    const { error } = await sb.auth.signInWithPassword({ email, password: senha });
    if (error) throw error;
    /* o resto acontece no evento SIGNED_IN */
  },
  async criar(f) {
    const email = f.email.value.trim(), senha = f.senha.value; UI.authEmail = email;
    if (!email) return authMsg("err", "Escreva seu e-mail.");
    if (senha.length < 6) return authMsg("err", "A senha precisa ter pelo menos 6 caracteres.");
    const { data, error } = await sb.auth.signUp({ email, password: senha, options: { emailRedirectTo: location.origin + location.pathname } });
    if (error) throw error;
    if (data && data.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) return authMsg("err", "Esse e-mail já tem conta. Use a aba Entrar.");
    if (!data.session) { UI.authTab = "enviado"; showAuth(); }
  },
  async esqueci(f) {
    const email = f.email.value.trim(); UI.authEmail = email;
    if (!email) return authMsg("err", "Escreva seu e-mail.");
    const { error } = await sb.auth.resetPasswordForEmail(email, { redirectTo: location.origin + location.pathname });
    if (error) throw error;
    authMsg("ok", `Enviamos um link para ${email}. Abra e crie sua nova senha.`);
  },
  async recuperar(f) {
    const senha = f.senha.value;
    if (senha.length < 6) return authMsg("err", "A senha precisa ter pelo menos 6 caracteres.");
    const { error } = await sb.auth.updateUser({ password: senha });
    if (error) throw error;
    UI.recovery = false;
    history.replaceState(null, "", location.pathname);
    await boot();
  },
  async onb(f) {
    const nome = f.nome.value.trim(); UI.onbName = nome;
    if (!nome) return authMsg("err", "Escreva como você quer ser chamado(a).");
    if (UI.onbMode === "criar") {
      await q(sb.rpc("create_couple", { p_display_name: nome }));
      UI.dateStep = true;
    } else {
      const codigo = f.codigo.value.trim(); UI.onbCode = codigo;
      if (!codigo) return authMsg("err", "Digite o código de convite.");
      await q(sb.rpc("join_couple", { p_code: codigo, p_display_name: nome }));
    }
    await boot();
  },
  async data(f) {
    const d = f.data.value;
    if (!d) return authMsg("err", "Escolha a data ou toque em Pular por agora.");
    await q(sb.from("couples").update({ start_date: d }).eq("id", S.couple.id));
    S.couple.start_date = d; UI.dateStep = false; enterApp();
  }
};
function onbErr(e) {
  const m = String((e && e.message) || "");
  if (/invalid code/i.test(m)) return "Código não encontrado. Confira com quem te convidou.";
  if (/couple is full/i.test(m)) return "Esse casal já tem duas pessoas.";
  return null;
}
gate.addEventListener("submit", async e => {
  const f = e.target.closest("form[data-form]"); if (!f) return;
  e.preventDefault();
  const btn = f.querySelector("[type=submit]"); const label = btn.textContent;
  btn.disabled = true; btn.textContent = "Um instante…";
  try { await FORMS[f.dataset.form](f); }
  catch (err) {
    if (/already in a couple/i.test(String(err && err.message))) { boot(); return; }
    authMsg("err", onbErr(err) || (f.dataset.form === "onb" || f.dataset.form === "data" ? friendly(err) : authErr(err)));
  }
  if (btn.isConnected) { btn.disabled = false; btn.textContent = label; }
});
gate.addEventListener("click", async e => {
  const t = e.target.closest("[data-g]"); if (!t) return;
  const a = t.dataset.g;
  if (a === "tab") { const f = gate.querySelector("input[name=email]"); if (f) UI.authEmail = f.value; UI.authTab = t.dataset.v; showAuth(); }
  else if (a === "mode") { const f = gate.querySelector("input[name=nome]"); if (f) UI.onbName = f.value; UI.onbMode = t.dataset.v; showOnboarding(); }
  else if (a === "retry") boot();
  else if (a === "signout") signOut();
  else if (a === "skipdate") { UI.dateStep = false; enterApp(); }
});
async function signOut() {
  try { await sb.auth.signOut(); } catch (e) { /* segue mesmo assim */ }
  resetState(); UI.authTab = "entrar"; showAuth();
}
function resetState() {
  Object.assign(S, { user: null, members: [], couple: null, media: [], trips: [], lists: [], items: [], events: [], loaded: false });
  Object.assign(UI, { tab: "feed", openList: null, panel: null, viewer: null, dateStep: false });
  urlCache.clear(); closePanel(true); closeViewer(true); closeSheet();
}

/* ============ início ============ */
let bootP = null;
function boot() { if (!bootP) bootP = bootRun().finally(() => { bootP = null; }); return bootP; }
async function bootRun() {
  showGate(loadingHTML("Abrindo o Us…"));
  try {
    const { data } = await sb.auth.getSession();
    if (UI.recovery) { showRecovery(); return; }
    if (!data.session) { showAuth(); return; }
    S.user = data.session.user;
    const has = await loadData();
    if (!has) { showOnboarding(); return; }
    if (UI.dateStep) { showDateStep(); return; }
    enterApp();
  } catch (e) { errorGate(e); }
}
function enterApp() {
  gate.hidden = true; app.hidden = false;
  document.querySelectorAll(".tab").forEach(t => t.dataset.tab === UI.tab ? t.setAttribute("aria-current", "page") : t.removeAttribute("aria-current"));
  render();
}

/* ============ telas ============ */
function render(keep) {
  if (!S.couple) return;
  const y = view.scrollTop;
  view.innerHTML = { feed: feedHTML, fotos: fotosHTML, listas: listasHTML, cal: calHTML }[UI.tab]();
  $("fab").innerHTML = UI.tab === "listas" && UI.openList === null ? `<button class="compose" data-act="novalista" aria-label="Nova lista">${ic("edit", 22)}</button>` : "";
  view.scrollTop = keep ? y : 0;
  document.querySelectorAll(".tab").forEach(t => t.dataset.tab === UI.tab ? t.setAttribute("aria-current", "page") : t.removeAttribute("aria-current"));
  hydrate();
}
function avatar(m, cls = "av") {
  if (!m) return "";
  if (m.avatar_path) return `<span class="${cls}">${imgTag(m.avatar_path, m.display_name || "")}</span>`;
  return `<span class="${cls} init" aria-hidden="true">${esc((m.display_name || "?").trim().charAt(0).toUpperCase())}</span>`;
}
function tile(m, extra = "") {
  const media = m.kind === "video"
    ? `<video data-path="${esc(m.path)}" data-thumb="1" preload="metadata" muted playsinline aria-hidden="true"></video><span class="vid">${PLAY}</span>`
    : imgTag(m.path, m.caption || m.place || "Foto");
  return `<button class="tile" data-media="${m.id}" aria-label="${m.kind === "video" ? "Vídeo" : "Foto"}${m.caption ? ": " + esc(m.caption) : ""}" ${extra}>${media}</button>`;
}

function aboutHTML() {
  const c = S.couple;
  if (c.about_mode === "musica") {
    if (c.song_title) return `<div class="about"><div class="song-line"><span class="note">${ic("note", 18, 1.9)}</span><div style="min-width:0"><div class="lbl">A música de vocês</div><div class="tt">${esc(c.song_title)}${c.song_artist ? ` <span>· ${esc(c.song_artist)}</span>` : ""}</div></div></div></div>`;
    return `<div class="addlink"><button class="link" data-act="editar">Adicionar a música de vocês</button></div>`;
  }
  if (c.about_mode === "frase") {
    if (c.phrase) return `<div class="about"><div class="quote"><p>“${esc(c.phrase)}”</p></div></div>`;
    return `<div class="addlink"><button class="link" data-act="editar">Adicionar uma frase</button></div>`;
  }
  return `<div style="height:8px"></div>`;
}
function feedHTML() {
  const c = S.couple, ms = S.members, posts = S.media.filter(m => m.in_feed);
  const names = ms.length ? coupleNames() : "";
  const start = c.start_date
    ? `Desde ${esc(fmtLong(c.start_date))} · <b>${esc(juntos(parseYmd(c.start_date), todayDate()))}</b>`
    : `<button class="link" data-act="editar" style="min-height:32px">Adicionar a data de vocês</button>`;
  const cover = c.cover_path
    ? `<div class="cover">${imgTag(c.cover_path, "Capa do perfil")}</div>`
    : `<div class="cover empty"><button class="pbtn" data-act="capa">Escolher capa</button></div>`;
  const invite = ms.length < 2 ? `<div class="invite"><div><b>Convide quem você ama</b><span class="code" aria-label="Código de convite">${esc(c.invite_code)}</span></div><button class="pbtn red small" data-act="copiar" style="padding:8px 16px;flex:none">Copiar código</button></div>` : "";
  return `
  <div class="appbar"><span><span class="logo">Us</span><span class="lock">${ic("lock", 12, 2.4)}só nós dois</span></span>
    <span class="acts"><button data-act="novo" aria-label="Novo post">${ic("plus", 25, 1.8)}</button></span></div>
  ${cover}
  <div class="prof">
    <div class="avs">${ms.map(m => avatar(m)).join("")}</div>
    <h1 class="names">${esc(names)}</h1>
    <div class="bio">${start}</div>
    <div class="stats"><div><b>${fmtN(posts.length)}</b><span>no feed</span></div><div><b>${fmtN(S.media.length)}</b><span>fotos e vídeos</span></div><div><b>${fmtN(S.trips.length)}</b><span>viagens</span></div></div>
    <div class="prof-btns"><button class="pbtn" data-act="editar">Editar perfil</button><button class="pbtn red" data-act="novo">Novo post</button></div>
  </div>
  ${invite}
  ${aboutHTML()}
  ${posts.length ? `<div class="grid">${posts.map(m => tile(m)).join("")}</div>` : `<div class="empty-state"><h3>O feed de vocês começa aqui</h3><p>Escolha as fotos que contam a história de vocês e elas aparecem nesta grade.</p><button class="btn small" data-act="novo">Fazer o primeiro post</button></div>`}
  <div style="height:16px"></div>`;
}

/* ---- fotos e vídeos ---- */
function groupBy(arr, keyFn) { const m = new Map(); arr.forEach(x => { const k = keyFn(x); if (!m.has(k)) m.set(k, []); m.get(k).push(x); }); return m; }
function tripMedia(id) { return S.media.filter(m => m.trip_id === id); }
function fotosHTML() {
  const total = S.media.length, vids = S.media.filter(m => m.kind === "video").length;
  let body = "";
  if (!total && UI.seg !== "viagens") {
    body = `<div class="empty-state"><h3>Nenhuma foto ainda</h3><p>Suba as primeiras fotos e vídeos de vocês. Só vocês dois veem.</p><button class="btn small" data-act="subir">Subir fotos</button></div>`;
  } else if (UI.seg === "datas") {
    const g = groupBy(S.media, m => m.taken_at.slice(0, 7));
    body = [...g.keys()].sort().reverse().map(k => {
      const [y, mo] = k.split("-"), list = g.get(k);
      return `<div class="mhead"><h3>${cap1(MESL[+mo - 1])} ${y}</h3><span>${plural(list.length, "item", "itens")}</span></div><div class="pgrid">${list.map(m => tile(m)).join("")}</div>`;
    }).join("");
  } else if (UI.seg === "viagens") {
    const trips = [...S.trips].sort((a, b) => String(b.start_date || "").localeCompare(String(a.start_date || "")) || String(b.created_at).localeCompare(String(a.created_at)));
    body = `<div class="albums"><button class="album new" data-act="novaviagem" aria-label="Nova viagem"><div class="cv">${ic("plus", 26)}<span style="display:block;margin-top:4px;position:absolute;bottom:14px">Nova viagem</span></div></button>` + trips.map(t => {
      const ms = tripMedia(t.id), first = [...ms].sort((a, b) => a.taken_at.localeCompare(b.taken_at)).find(m => m.kind === "photo");
      return `<button class="album" data-trip="${t.id}"><div class="cv ${first ? "" : "ph"}">${first ? imgTag(first.path, "") : ic("pin", 30, 1.8)}<span class="cnt">${ms.length ? fmtN(ms.length) : "sem fotos"}</span></div><b>${esc(t.name)}</b><span>${esc(rangeLabel(t.start_date, t.end_date))}</span></button>`;
    }).join("") + `</div>`;
    if (!trips.length) body += `<p class="none" style="padding:0 16px">Crie uma viagem e junte nela as fotos da estrada, do hotel e do jantar.</p>`;
  } else {
    const g = groupBy(S.media.filter(m => m.place && m.place.trim()), m => m.place.trim().toLowerCase());
    const rows = [...g.values()].map(l => ({ name: l[0].place.trim(), list: l, key: l[0].place.trim().toLowerCase() })).sort((a, b) => b.list.length - a.list.length);
    const semLugar = S.media.filter(m => !(m.place && m.place.trim())).length;
    body = rows.length
      ? `<div class="places">${rows.map(r => `<button class="place" data-place="${esc(r.key)}"><b><span class="pin"></span>${esc(r.name)}</b><span class="th">${r.list.filter(m => m.kind === "photo").slice(0, 3).map(m => `<span>${imgTag(m.path, "")}</span>`).join("")}</span><span class="meta">${plural(r.list.length, "foto ou vídeo", "fotos e vídeos")}</span></button>`).join("")}</div>`
      : `<div class="empty-state"><h3>Nenhum lugar marcado</h3><p>Abra uma foto e escreva onde ela foi tirada. Os lugares aparecem aqui.</p></div>`;
    if (rows.length && semLugar) body += `<p class="none" style="padding:0 16px">${plural(semLugar, "item sem lugar", "itens sem lugar")}. Abra a foto para marcar onde foi.</p>`;
  }
  return `
  <div class="appbar"><span style="font-weight:700;font-size:15px">Tudo de vocês</span>
    <span class="acts"><button data-act="subir" aria-label="Subir fotos e vídeos" style="display:flex;gap:6px;align-items:center;color:var(--red);font-weight:700;font-size:14.5px">${ic("upload", 20, 2.2)}Subir</button></span></div>
  <h1 class="big-title">Fotos e vídeos</h1>
  <p class="sub-title">${plural(total, "item", "itens")} dos dois · ${plural(vids, "vídeo", "vídeos")}</p>
  <div class="seg" role="group" aria-label="Organizar por">
    <button data-seg="datas" aria-pressed="${UI.seg === "datas"}">Datas</button>
    <button data-seg="viagens" aria-pressed="${UI.seg === "viagens"}">Viagens</button>
    <button data-seg="lugares" aria-pressed="${UI.seg === "lugares"}">Lugares</button>
  </div>
  ${body}<div style="height:16px"></div>`;
}

/* ---- painel (viagem e lugar) ---- */
function renderPanel() {
  const p = UI.panel; if (!p) return;
  let title = "", sub = "", list = [], actions = "", empty = "";
  if (p.type === "trip") {
    const t = S.trips.find(x => x.id === p.id); if (!t) { closePanel(); return; }
    list = tripMedia(t.id); title = t.name; sub = `${rangeLabel(t.start_date, t.end_date)} · ${plural(list.length, "item", "itens")}`;
    actions = `<div class="bar-actions"><button class="pbtn red" data-act="trip-upload">Enviar fotos</button><button class="pbtn" data-act="trip-pick">Escolher das já enviadas</button></div>
      <div class="bar-actions"><button class="pbtn" data-act="trip-del" style="color:#a00f25;flex:none">Apagar viagem</button></div>`;
    empty = "Nenhuma foto nesta viagem ainda. Envie novas ou escolha entre as que já estão aqui.";
  } else {
    list = S.media.filter(m => m.place && m.place.trim().toLowerCase() === p.key);
    if (!list.length) { closePanel(); return; }
    title = list[0].place.trim(); sub = plural(list.length, "foto ou vídeo", "fotos e vídeos");
  }
  panel.innerHTML = `<div class="appbar"><button class="back" data-act="fecharpanel" aria-label="Voltar">${ic("back", 22)}Fotos</button><span></span></div>
    <h1 class="big-title">${esc(title)}</h1><p class="sub-title">${esc(sub)}</p>${actions}
    ${list.length ? `<div class="pgrid" style="margin-top:14px">${list.map(m => tile(m)).join("")}</div>` : `<p class="none" style="padding:12px 16px">${esc(empty)}</p>`}
    <div style="height:30px"></div>`;
  hydrate();
}
function openPanel(type, idOrKey) { UI.panel = type === "trip" ? { type, id: idOrKey } : { type, key: idOrKey }; renderPanel(); panel.scrollTop = 0; panel.classList.add("on"); }
function closePanel(quick) { UI.panel = null; panel.classList.remove("on"); if (quick) panel.innerHTML = ""; }

/* ---- visualizador (post) ---- */
function renderViewer() {
  const m = S.media.find(x => x.id === UI.viewer);
  if (!m) { closeViewer(); return; }
  const trip = m.trip_id ? S.trips.find(t => t.id === m.trip_id) : null;
  const minis = S.members.map(x => x.avatar_path ? `<span>${imgTag(x.avatar_path, "")}</span>` : `<span class="init" aria-hidden="true">${esc((x.display_name || "?").charAt(0).toUpperCase())}</span>`).join("");
  const mediaEl = m.kind === "video"
    ? `<video data-path="${esc(m.path)}" controls playsinline preload="metadata"></video>`
    : imgTag(m.path, m.caption || "Foto");
  viewer.innerHTML = `
    <div class="appbar"><button class="back" data-act="fecharviewer" aria-label="Voltar">${ic("back", 22)}Voltar</button><span></span></div>
    <div class="post-head"><span class="mini">${minis}</span><div><div class="who">${esc(coupleNames())}</div><div class="where">${esc(m.place || "")}</div></div></div>
    <div class="vmedia">${mediaEl}</div>
    <div class="vact">
      <button class="pbtn ${m.in_feed ? "" : "red"}" data-act="v-feed">${m.in_feed ? "Tirar do feed" : "Pôr no feed"}</button>
      <button class="pbtn" data-act="v-edit">Editar detalhes</button>
      <button class="pbtn dng" data-act="v-del">Apagar</button>
    </div>
    <div class="post-body">${m.caption ? `<b>${esc(coupleNames())}</b> ${esc(m.caption)}` : `<span style="color:var(--ink-2)">Sem legenda.</span>`}
      <div class="date">${esc(fmtLong(m.taken_at))}${m.place ? ` · ${esc(m.place)}` : ""}${trip ? ` · ${esc(trip.name)}` : ""}${m.in_feed ? " · no feed" : ""}</div></div>`;
  hydrate();
}
function openViewer(id) { UI.viewer = id; renderViewer(); viewer.scrollTop = 0; viewer.classList.add("on"); }
function closeViewer(quick) { UI.viewer = null; viewer.classList.remove("on"); const v = viewer.querySelector("video"); if (v) v.pause(); if (quick) viewer.innerHTML = ""; }

/* ---- listas ---- */
const itemsOf = id => S.items.filter(i => i.list_id === id);
function listPreview(L) {
  const its = itemsOf(L.id); if (!its.length) return "Sem itens";
  const open = its.filter(i => !i.done).map(i => i.text);
  return open.length ? open.join(", ") : "Tudo feito";
}
function listasHTML() {
  if (UI.openList !== null) { const html = noteHTML(); if (html) return html; UI.openList = null; }
  const row = L => `<button class="nrow" data-list="${L.id}"><b>${esc(L.title)}</b><span><em>${esc(relDay(L.updated_at))}</em>${esc(listPreview(L))}</span></button>`;
  const sorted = [...S.lists].sort((a, b) => String(b.updated_at).localeCompare(String(a.updated_at)));
  const pins = sorted.filter(l => l.pinned), rest = sorted.filter(l => !l.pinned);
  return `<div class="notes-app">
    <div class="nbar" style="background:var(--group)"><span></span><span style="font-weight:600;color:var(--ink-2);font-size:13px">${esc(coupleNames())}</span></div>
    <h1 class="big-title">Listas</h1>
    ${!S.lists.length ? `<div class="empty-state"><h3>Uma lista para cada vontade</h3><p>Restaurantes para conhecer, filmes, viagens, compras da casa. Toque no lápis para criar a primeira.</p></div>` : ""}
    ${pins.length ? `<div class="ngroup-h">Fixadas</div><div class="ngroup">${pins.map(row).join("")}</div>` : ""}
    ${rest.length ? `<div class="ngroup-h">Do casal</div><div class="ngroup">${rest.map(row).join("")}</div>` : ""}
    ${S.lists.length ? `<div class="ncount">${plural(S.lists.length, "lista", "listas")}</div>` : ""}
  </div>`;
}
function noteHTML() {
  const L = S.lists.find(l => l.id === UI.openList); if (!L) return "";
  const its = itemsOf(L.id);
  return `<div class="lnote">
    <div class="nbar"><button data-act="voltarlista" class="back" style="color:var(--red);font-size:16px;font-weight:400">${ic("back", 20, 2.4)}Listas</button>
      <span class="icos"><button data-act="fixar" aria-pressed="${L.pinned}" aria-label="${L.pinned ? "Desafixar lista" : "Fixar lista"}">${ic(L.pinned ? "pinfill" : "pin", 21, 1.9)}</button><button data-act="apagarlista" aria-label="Apagar lista">${ic("trash", 21, 1.9)}</button></span></div>
    <div class="lnote-date">Atualizada ${esc(relDay(L.updated_at))}</div>
    <label class="sr" for="ltitle" style="position:absolute;left:-9999px">Título da lista</label>
    <input class="title-in" id="ltitle" value="${esc(L.title)}" maxlength="120" autocomplete="off" enterkeyhint="done">
    ${its.length ? its.map(it => `<div class="citem ${it.done ? "done" : ""}"><button class="cbox" data-check="${it.id}" aria-pressed="${it.done}" aria-label="${it.done ? "Desmarcar" : "Marcar"}: ${esc(it.text)}"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m5 12.5 4.5 4.5L19 7.5"/></svg></button><div class="body"><div class="tx">${esc(it.text)}</div><div class="by">${esc(nameOf(it.created_by))}</div></div><button class="del" data-delitem="${it.id}" aria-label="Apagar item: ${esc(it.text)}">${ic("x", 18, 2)}</button></div>`).join("") : `<p class="empty-note">Lista vazia. Escreva o primeiro item aqui embaixo.</p>`}
    <form class="nadd" id="nadd"><span class="cbox" aria-hidden="true"></span><label for="nitem" style="position:absolute;left:-9999px">Novo item</label><input id="nitem" placeholder="Novo item" autocomplete="off" maxlength="200" enterkeyhint="done"></form>
  </div>`;
}

/* ---- calendário ---- */
const evTime = e => e.time_label || "";
const sortEv = (a, b) => a.starts_on.localeCompare(b.starts_on) || evTime(a).localeCompare(evTime(b));
function calHTML() {
  const y = UI.calY, mo = UI.calM, first = new Date(y, mo, 1), dow = first.getDay(), dim = new Date(y, mo + 1, 0).getDate();
  const todayS = ymd(todayDate());
  let cells = "";
  for (let i = 0; i < dow; i++) cells += `<div class="dcell out"></div>`;
  for (let d = 1; d <= dim; d++) {
    const ds = `${y}-${pad(mo + 1)}-${pad(d)}`, evs = S.events.filter(e => e.starts_on === ds);
    const whos = [...new Set(evs.map(e => e.who_user || "ambos"))].slice(0, 3);
    cells += `<button class="dcell ${ds === todayS ? "today" : ""} ${ds === UI.selDay ? "sel" : ""}" data-day="${ds}" aria-pressed="${ds === UI.selDay}" aria-label="${d} de ${MESL[mo]}${evs.length ? `, ${plural(evs.length, "compromisso", "compromissos")}` : ""}"><span class="n">${d}</span><span class="ds">${whos.map(w => `<i style="--c:${w === "ambos" ? "var(--red)" : memberColor(w)}"></i>`).join("")}</span></button>`;
  }
  const sel = parseYmd(UI.selDay);
  const dayEvs = S.events.filter(e => e.starts_on === UI.selDay).sort(sortEv);
  const later = S.events.filter(e => e.starts_on > UI.selDay).sort(sortEv).slice(0, 4);
  const evRow = (e, withDate) => {
    const d = parseYmd(e.starts_on);
    const sub = withDate ? `${SEM[d.getDay()]}, ${d.getDate()} ${MES[d.getMonth()]}${d.getFullYear() !== todayDate().getFullYear() ? " " + d.getFullYear() : ""} · ${esc(whoName(e.who_user))}` : esc(whoName(e.who_user));
    return `<div class="evt" style="--c:${whoColor(e.who_user)}"><span class="bar"></span><div><b>${esc(e.title)}</b><span>${sub}</span>${e.note ? `<span class="note-ev">${esc(e.note)}</span>` : ""}</div><div class="tm">${esc(e.time_label || (withDate ? "" : "dia todo"))}</div><button class="del" data-delev="${e.id}" aria-label="Apagar compromisso: ${esc(e.title)}">${ic("trash", 18, 1.9)}</button></div>`;
  };
  const next = S.events.filter(e => e.starts_on > todayS).sort(sortEv)[0];
  let card = "";
  if (next) { const n = dayDiff(parseYmd(next.starts_on), todayDate()); card = `<div class="count-card"><div><div class="t">${esc(next.title)}</div><span>${esc(fmtLong(next.starts_on))}${next.time_label ? " · " + esc(next.time_label) : ""}</span></div><div style="text-align:right"><b>${fmtN(n)}</b><span style="display:block">${n === 1 ? "dia" : "dias"}</span></div></div>`; }
  return `
  <div class="appbar"><span style="font-weight:700;font-size:15px">Agenda do casal</span>
    <span class="acts"><button data-act="hoje" style="color:var(--red);font-weight:700;font-size:14.5px">Hoje</button><button data-act="evento" aria-label="Novo compromisso" style="color:var(--red)">${ic("plus", 24, 2.2)}</button></span></div>
  <div class="cal-head"><h2>${cap1(MESL[mo])} <i>${y}</i></h2>
    <span class="arr"><button data-mon="-1" aria-label="Mês anterior">${ic("back", 18, 2.4)}</button><button data-mon="1" aria-label="Próximo mês">${ic("next", 18, 2.4)}</button></span></div>
  <div class="legend"><span><i style="--c:var(--red)"></i>Os dois</span>${S.members.map(m => `<span><i style="--c:${memberColor(m.user_id)}"></i>${esc(m.display_name || "Alguém")}</span>`).join("")}</div>
  <div class="wk" aria-hidden="true"><span>D</span><span>S</span><span>T</span><span>Q</span><span>Q</span><span>S</span><span>S</span></div>
  <div class="month">${cells}</div>
  <div class="daylist">
    <div class="dl-h">${SEM[sel.getDay()]}, ${sel.getDate()} de ${MESL[sel.getMonth()]}</div>
    ${dayEvs.length ? dayEvs.map(e => evRow(e, false)).join("") : `<div class="none">Nenhum compromisso. Dia livre para os dois. Toque no + para marcar algo.</div>`}
    ${later.length ? `<div class="dl-h">Depois</div>${later.map(e => evRow(e, true)).join("")}` : ""}
  </div>
  ${card}
  <div style="height:20px"></div>`;
}

/* ============ janela de baixo (sheet) ============ */
const sheetEl = $("sheet"), scrimEl = $("scrim");
let SH = null, SHSTACK = [];
function drawSheet() { if (!SH) return; sheetEl.innerHTML = `<div class="grab"></div>${SH.view(SH.model)}`; hydrate(); }
function openSheet(def, push) {
  if (push && SH) SHSTACK.push(SH); else if (!push) SHSTACK = [];
  def.model = def.model || {}; SH = def; drawSheet();
  sheetEl.classList.add("on"); scrimEl.classList.add("on"); sheetEl.scrollTop = 0;
  const f = sheetEl.querySelector("input:not([type=hidden]),textarea");
  if (f && def.focus !== false) setTimeout(() => f.focus({ preventScroll: true }), 380);
}
function closeSheet() { SH = null; SHSTACK = []; sheetEl.classList.remove("on"); scrimEl.classList.remove("on"); }
function sheetBack() { const p = SHSTACK.pop(); if (p) { SH = p; drawSheet(); } else closeSheet(); }
scrimEl.addEventListener("click", closeSheet);
document.addEventListener("keydown", e => { if (e.key === "Escape" && SH) closeSheet(); });
sheetEl.addEventListener("click", async e => {
  const t = e.target.closest("[data-s]"); if (!t || !SH) return;
  const h = SH.on && SH.on[t.dataset.s]; if (!h) return;
  e.preventDefault();
  await guard(t, () => h(t, e));
});
sheetEl.addEventListener("input", e => { const t = e.target; if (t.dataset && t.dataset.m && SH) SH.model[t.dataset.m] = t.value; });
sheetEl.addEventListener("change", e => { const t = e.target; if (t.dataset && t.dataset.m && SH) SH.model[t.dataset.m] = t.value; });
sheetEl.addEventListener("submit", async e => {
  const f = e.target.closest("form"); if (!f || !SH) return;
  e.preventDefault();
  const h = SH.on && SH.on.submit; if (!h) return;
  await guard(f.querySelector("[type=submit]"), () => h(f));
});
async function guard(btn, fn) {
  if (btn && btn.disabled) return;
  if (btn) btn.disabled = true;
  try { await fn(); } catch (err) { toast(friendly(err)); }
  if (btn && btn.isConnected) btn.disabled = false;
}
const hint = txt => `<p class="msg err" role="alert">${esc(txt)}</p>`;
function askConfirm(title, text, label, fn) {
  openSheet({ focus: false, view: () => `<h3>${esc(title)}</h3><p class="hint">${esc(text)}</p><div class="btns"><button class="btn ghost" data-s="no">Cancelar</button><button class="btn warn" data-s="yes">${esc(label)}</button></div>`,
    on: { no: () => sheetBack(), yes: async () => { await fn(); } } }, !!SH);
}

/* ============ fotos: envio, redução, escolha ============ */
const VIDEO_EXT = { "video/mp4": "mp4", "video/quicktime": "mov", "video/webm": "webm" };
const IMG_OK = ["image/jpeg", "image/png", "image/webp", "image/heic", "image/gif"];
function loadImg(file) {
  return new Promise((res, rej) => { const u = URL.createObjectURL(file), i = new Image(); i.onload = () => { URL.revokeObjectURL(u); res(i); }; i.onerror = () => { URL.revokeObjectURL(u); rej(new Error("decode")); }; i.src = u; });
}
async function resizeImage(file, max, quality) {
  let bmp;
  try { bmp = await createImageBitmap(file, { imageOrientation: "from-image" }); } catch (e) { bmp = await loadImg(file); }
  const w = bmp.width || bmp.naturalWidth, h = bmp.height || bmp.naturalHeight;
  if (!w || !h) throw new Error("decode");
  const sc = Math.min(1, max / Math.max(w, h)), cw = Math.round(w * sc), ch = Math.round(h * sc);
  const cv = document.createElement("canvas"); cv.width = cw; cv.height = ch;
  const ctx = cv.getContext("2d"); ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, cw, ch); ctx.drawImage(bmp, 0, 0, cw, ch);
  if (bmp.close) bmp.close();
  const blob = await new Promise(r => cv.toBlob(r, "image/jpeg", quality));
  if (!blob) throw new Error("decode");
  return blob;
}
const own = m => { const e = new Error(m); e.own = true; return e; };
function fileType(file) {
  let t = (file.type || "").toLowerCase();
  if (!t) { const x = (file.name.split(".").pop() || "").toLowerCase(); t = { jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", webp: "image/webp", heic: "image/heic", gif: "image/gif", mp4: "video/mp4", m4v: "video/mp4", mov: "video/quicktime", webm: "video/webm" }[x] || ""; }
  return t;
}
/* sobe um arquivo (foto reduzida ou vídeo) e cria a linha em media; devolve a linha */
async function uploadOne(file, opts) {
  const type = fileType(file), isVideo = type.startsWith("video/");
  let blob = file, ctype = type, ext;
  if (isVideo) {
    if (!VIDEO_EXT[type]) throw own(`${file.name}: formato de vídeo não aceito. Use MP4, MOV ou WebM.`);
    if (file.size > 50 * 1024 * 1024) throw own(`${file.name}: o vídeo passa de 50 MB. Encurte ou reduza o vídeo e tente de novo.`);
    ext = VIDEO_EXT[type];
  } else if (type === "image/gif") {
    if (file.size > 50 * 1024 * 1024) throw own(`${file.name}: o arquivo passa de 50 MB.`);
    ext = "gif";
  } else if (IMG_OK.includes(type)) {
    try { blob = await resizeImage(file, 2000, 0.85); } catch (e) {
      throw own(type === "image/heic" ? `${file.name}: este navegador não abre fotos HEIC. Envie pelo iPhone ou converta para JPG.` : `${file.name}: não consegui abrir essa foto. Tente outra.`);
    }
    ctype = "image/jpeg"; ext = "jpg";
  } else throw own(`${file.name}: formato não aceito. Use foto (JPG, PNG, WebP) ou vídeo (MP4, MOV, WebM).`);
  const path = `${S.couple.id}/${crypto.randomUUID()}.${ext}`;
  const up = await sb.storage.from("media").upload(path, blob, { contentType: ctype, upsert: false });
  if (up.error) throw up.error;
  const row = {
    couple_id: S.couple.id, path, kind: isVideo ? "video" : "photo",
    taken_at: ymd(file.lastModified ? new Date(file.lastModified) : new Date()),
    in_feed: !!opts.in_feed, place: opts.place || null, caption: opts.caption || null, trip_id: opts.trip_id || null
  };
  const ins = await sb.from("media").insert(row).select().single();
  if (ins.error) { sb.storage.from("media").remove([path]).catch(() => { }); throw ins.error; }
  return ins.data;
}
const progEl = $("progress");
async function uploadFiles(files, opts = {}) {
  const list = [...files], n = list.length, out = [], fails = [];
  progEl.hidden = false;
  const draw = (i, extra = "") => { progEl.innerHTML = `<div>${extra || `Enviando ${Math.min(i + 1, n)} de ${n}…`}</div><div class="pb"><i style="width:${Math.round((i / n) * 100)}%"></i></div>`; };
  draw(0);
  for (let i = 0; i < n; i++) {
    draw(i);
    try { const row = await uploadOne(list[i], opts); S.media.unshift(row); out.push(row); }
    catch (e) { fails.push(isNet(e) ? "Sem conexão. Confira a internet e tente de novo." : (e && e.own ? e.message : `${list[i].name}: não subiu. Tente de novo.`)); if (isNet(e)) break; }
  }
  S.media.sort((a, b) => b.taken_at.localeCompare(a.taken_at) || String(b.created_at).localeCompare(String(a.created_at)));
  refreshViews();
  if (fails.length) {
    progEl.innerHTML = `<div>${out.length ? `${plural(out.length, "arquivo subiu", "arquivos subiram")}. ` : ""}${esc(fails.slice(0, 2).join(" "))}${fails.length > 2 ? ` E mais ${fails.length - 2}.` : ""}</div><button data-act="fecharprog">Entendi</button>`;
  } else { progEl.hidden = true; toast(out.length === 1 ? "Enviado." : `${out.length} arquivos enviados.`); }
  return out;
}
progEl.addEventListener("click", e => { if (e.target.closest("[data-act=fecharprog]")) progEl.hidden = true; });
function pickFiles(accept, multiple, cb) {
  const inp = $("filepick"); inp.accept = accept; inp.multiple = !!multiple; inp.value = "";
  inp.onchange = () => { const fs = [...inp.files]; inp.value = ""; if (fs.length) cb(fs); };
  inp.click();
}
const ACCEPT_ALL = "image/*,video/mp4,video/quicktime,video/webm,.heic,.mov";

/* janela de escolher fotos já enviadas */
function openPicker(o) {
  const m = { sel: new Set(), caption: "", place: "" };
  const pool = () => S.media.filter(x => (!o.onlyPhotos || x.kind === "photo") && !(o.exclude && o.exclude(x)));
  const def = {
    model: m, focus: false,
    view: () => {
      const items = pool();
      return `<h3>${esc(o.title)}</h3><p class="hint">${esc(o.hint || "")}</p>
      ${items.length ? `<div class="picker" role="group" aria-label="Fotos já enviadas">${items.map(x => `<button type="button" class="pick" data-s="tog" data-id="${x.id}" aria-pressed="${m.sel.has(x.id)}" aria-label="${x.kind === "video" ? "Vídeo" : "Foto"} de ${esc(fmtShort(x.taken_at))}">${x.kind === "video" ? `<video data-path="${esc(x.path)}" data-thumb="1" preload="metadata" muted playsinline></video>` : imgTag(x.path, "")}<span class="chk"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m5 12.5 4.5 4.5L19 7.5"/></svg></span></button>`).join("")}</div>` : `<p class="none">${esc(o.emptyText || "Não há fotos para escolher aqui. Envie novas.")}</p>`}
      ${o.extra ? `<label class="field"><span>Legenda (opcional)</span><textarea data-m="caption" maxlength="1000" rows="2">${esc(m.caption)}</textarea></label><label class="field"><span>Lugar (opcional)</span><input data-m="place" maxlength="120" value="${esc(m.place)}" autocomplete="off"></label>` : ""}
      <button class="btn" data-s="ok" ${m.sel.size ? "" : "disabled"}>${esc(o.okLabel)}${m.sel.size && o.multi ? ` (${m.sel.size})` : ""}</button>
      <button class="btn ghost" data-s="up">Enviar ${o.onlyPhotos ? "foto nova" : "novas"} do celular</button>${o.push ? '<button class="btn ghost" data-s="back">Voltar</button>' : ""}`;
    },
    on: {
      tog: t => { const id = t.dataset.id; if (!o.multi) m.sel.clear(); if (m.sel.has(id)) m.sel.delete(id); else m.sel.add(id); drawSheet(); },
      ok: async () => { await o.onDone([...m.sel], m); },
      back: () => sheetBack(),
      up: () => pickFiles(o.onlyPhotos ? "image/*,.heic" : ACCEPT_ALL, o.multi, async files => { await o.onUpload(files, m); })
    }
  };
  openSheet(def, !!o.push);
}

/* ============ ações: perfil ============ */
function openProfile() {
  const c = S.couple, mm = me();
  const m = { about: c.about_mode, song_title: c.song_title || "", song_artist: c.song_artist || "", phrase: c.phrase || "", nome: mm.display_name || "", start: c.start_date || "", err: "" };
  const def = {
    model: m, focus: false,
    view: () => `<h3>Editar perfil</h3><p class="hint">O que aparece embaixo dos nomes de vocês.</p>
      ${m.err ? hint(m.err) : ""}
      <div role="radiogroup" aria-label="Embaixo dos nomes">
        ${[["musica", "Música do casal", "O nome da música aparece no perfil"], ["frase", "Uma frase", "Um verso, uma promessa, uma piada interna"], ["branco", "Deixar em branco", "Só as fotos"]].map(([k, t, d]) => `<button type="button" class="opt" role="radio" data-s="about" data-v="${k}" aria-checked="${m.about === k}"><span class="radio"></span><span><b>${t}</b><span class="d">${d}</span></span></button>`).join("")}
      </div>
      <form id="pform" novalidate style="margin-top:8px">
      ${m.about === "musica" ? `<label class="field"><span>Título da música</span><input data-m="song_title" maxlength="120" value="${esc(m.song_title)}" autocomplete="off"></label><label class="field"><span>Artista</span><input data-m="song_artist" maxlength="120" value="${esc(m.song_artist)}" autocomplete="off"></label>` : ""}
      ${m.about === "frase" ? `<label class="field"><span>A frase de vocês</span><textarea data-m="phrase" maxlength="200" rows="2">${esc(m.phrase)}</textarea></label>` : ""}
      <label class="field"><span>Seu nome</span><input data-m="nome" maxlength="60" value="${esc(m.nome)}" autocomplete="given-name"></label>
      <label class="field"><span>Início do namoro</span><input type="date" data-m="start" max="${ymd(todayDate())}" value="${esc(m.start)}"></label>
      <button class="cover-row" type="button" data-s="avatar"><span class="th" style="width:44px;height:44px;border-radius:50%;display:grid;place-items:center;font-family:var(--f-display);font-style:italic;font-size:22px;color:var(--red)">${mm.avatar_path ? imgTag(mm.avatar_path, "") : esc((mm.display_name || "?").charAt(0).toUpperCase())}</span><span><b style="display:block;font-size:15.5px">Sua foto</b><span style="font-size:13px;color:var(--ink-2)">${mm.avatar_path ? "Trocar a foto do seu perfil" : "Escolher uma foto sua"}</span></span></button>
      <button class="cover-row" type="button" data-s="capa"><span class="th ${c.cover_path ? "" : "none"}">${c.cover_path ? imgTag(c.cover_path, "") : ""}</span><span><b style="display:block;font-size:15.5px">Trocar foto de capa</b><span style="font-size:13px;color:var(--ink-2)">Escolher entre as fotos de vocês ou enviar uma nova</span></span></button>
      <button class="btn" type="submit" style="margin-top:14px">Salvar</button>
      <button class="btn ghost signout" type="button" data-s="sair">Sair da conta</button>
      </form>`,
    on: {
      about: t => { m.about = t.dataset.v; drawSheet(); },
      submit: async () => {
        const nome = m.nome.trim();
        if (!nome) { m.err = "Escreva o seu nome."; drawSheet(); return; }
        const patch = { about_mode: m.about, song_title: m.song_title.trim() || null, song_artist: m.song_artist.trim() || null, phrase: m.phrase.trim() || null, start_date: m.start || null };
        const [c2, m2] = await Promise.all([
          q(sb.from("couples").update(patch).eq("id", S.couple.id).select().single()),
          q(sb.from("couple_members").update({ display_name: nome }).eq("user_id", S.user.id).select().single())
        ]);
        S.couple = c2; Object.assign(me(), m2);
        closeSheet(); render(true); toast("Perfil salvo.");
      },
      avatar: () => pickFiles("image/*,.heic", false, async files => {
        try {
          const old = me().avatar_path;
          progEl.hidden = false; progEl.innerHTML = "<div>Enviando sua foto…</div>";
          const blob = await resizeImage(files[0], 600, 0.85);
          const path = `${S.couple.id}/avatar-${S.user.id.slice(0, 8)}-${crypto.randomUUID()}.jpg`;
          const up = await sb.storage.from("media").upload(path, blob, { contentType: "image/jpeg", upsert: false });
          if (up.error) throw up.error;
          const r = await sb.from("couple_members").update({ avatar_path: path }).eq("user_id", S.user.id).select().single();
          if (r.error) { sb.storage.from("media").remove([path]).catch(() => { }); throw r.error; }
          me().avatar_path = path;
          if (old && /\/avatar-/.test(old)) sb.storage.from("media").remove([old]).catch(() => { });
          progEl.hidden = true; toast("Foto atualizada."); drawSheet(); render(true);
        } catch (e) { progEl.hidden = true; toast(isNet(e) ? friendly(e) : "Não consegui usar essa foto. Tente outra."); }
      }),
      capa: () => openCoverPicker(true),
      sair: () => { closeSheet(); signOut(); }
    }
  };
  openSheet(def);
}
async function setCover(path) {
  const r = await q(sb.from("couples").update({ cover_path: path }).eq("id", S.couple.id).select().single());
  S.couple = r; render(true);
}
function openCoverPicker(push) {
  openPicker({
    title: "Foto de capa", hint: "Escolha uma das fotos de vocês ou envie uma nova.", onlyPhotos: true, multi: false, okLabel: "Usar como capa", push,
    emptyText: "Ainda não há fotos. Envie a primeira para usar como capa.",
    onDone: async ids => { const mm = S.media.find(x => x.id === ids[0]); if (!mm) return; await setCover(mm.path); closeSheet(); toast("Capa atualizada."); },
    onUpload: async files => { const rows = await uploadFiles([files[0]]); if (rows[0]) { await setCover(rows[0].path); closeSheet(); toast("Capa atualizada."); } }
  });
}

/* ============ ações: posts ============ */
function openNewPost() {
  openPicker({
    title: "Novo post", hint: "Escolha as fotos e vídeos que vão para o feed. Cada um vira um post.", multi: true, extra: true, okLabel: "Pôr no feed",
    exclude: x => x.in_feed, emptyText: "Todas as fotos já estão no feed. Envie novas para postar.",
    onDone: async (ids, m) => {
      const patch = { in_feed: true }; if (m.caption.trim()) patch.caption = m.caption.trim(); if (m.place.trim()) patch.place = m.place.trim();
      const rows = await q(sb.from("media").update(patch).in("id", ids).select());
      rows.forEach(r => { const i = S.media.findIndex(x => x.id === r.id); if (i >= 0) S.media[i] = r; });
      closeSheet(); refreshViews(); toast(rows.length === 1 ? "Post publicado no feed." : `${rows.length} posts no feed.`);
    },
    onUpload: async (files, m) => {
      closeSheet();
      const rows = await uploadFiles(files, { in_feed: true, caption: m.caption.trim(), place: m.place.trim() });
      if (rows.length) toast(rows.length === 1 ? "Post publicado no feed." : `${rows.length} posts no feed.`);
    }
  });
}
function openEditMedia() {
  const x = S.media.find(v => v.id === UI.viewer); if (!x) return;
  const m = { caption: x.caption || "", place: x.place || "", trip: x.trip_id || "", date: x.taken_at };
  openSheet({
    model: m, focus: false,
    view: () => `<h3>Detalhes</h3>
      <form novalidate>
      <label class="field"><span>Legenda</span><textarea data-m="caption" maxlength="1000" rows="3">${esc(m.caption)}</textarea></label>
      <label class="field"><span>Lugar</span><input data-m="place" maxlength="120" value="${esc(m.place)}" autocomplete="off"></label>
      <label class="field"><span>Viagem</span><select data-m="trip"><option value="">Nenhuma</option>${S.trips.map(t => `<option value="${t.id}" ${t.id === m.trip ? "selected" : ""}>${esc(t.name)}</option>`).join("")}</select></label>
      <label class="field"><span>Data</span><input type="date" data-m="date" value="${esc(m.date)}" max="${ymd(todayDate())}"></label>
      <button class="btn" type="submit">Salvar</button></form>`,
    on: {
      submit: async () => {
        const patch = { caption: m.caption.trim() || null, place: m.place.trim() || null, trip_id: m.trip || null };
        if (m.date) patch.taken_at = m.date;
        const r = await q(sb.from("media").update(patch).eq("id", x.id).select().single());
        const i = S.media.findIndex(v => v.id === x.id); if (i >= 0) S.media[i] = r;
        closeSheet(); refreshViews(); toast("Detalhes salvos.");
      }
    }
  });
}
function deleteMedia() {
  const x = S.media.find(v => v.id === UI.viewer); if (!x) return;
  askConfirm(x.kind === "video" ? "Apagar este vídeo?" : "Apagar esta foto?", "Ela some para os dois e não dá para desfazer.", "Apagar", async () => {
    await q(sb.from("media").delete().eq("id", x.id));
    sb.storage.from("media").remove([x.path]).catch(() => { });
    if (S.couple.cover_path === x.path) { S.couple = await q(sb.from("couples").update({ cover_path: null }).eq("id", S.couple.id).select().single()); }
    S.media = S.media.filter(v => v.id !== x.id);
    closeSheet(); closeViewer(); refreshViews(); toast("Apagado.");
  });
}

/* ============ ações: viagens ============ */
function openNewTrip() {
  const m = { name: "", start: "", end: "", err: "" };
  openSheet({
    model: m,
    view: () => `<h3>Nova viagem</h3><p class="hint">Depois é só juntar as fotos nela.</p>${m.err ? hint(m.err) : ""}
      <form novalidate>
      <label class="field"><span>Nome da viagem</span><input data-m="name" maxlength="80" value="${esc(m.name)}" autocomplete="off" placeholder="Ex.: Paraty"></label>
      <label class="field"><span>Ida</span><input type="date" data-m="start" value="${esc(m.start)}"></label>
      <label class="field"><span>Volta</span><input type="date" data-m="end" value="${esc(m.end)}"></label>
      <button class="btn" type="submit">Criar viagem</button></form>`,
    on: {
      submit: async () => {
        if (!m.name.trim()) { m.err = "Dê um nome para a viagem."; drawSheet(); return; }
        if (m.start && m.end && m.end < m.start) { m.err = "A volta precisa ser depois da ida."; drawSheet(); return; }
        const t = await q(sb.from("trips").insert({ couple_id: S.couple.id, name: m.name.trim(), start_date: m.start || null, end_date: m.end || null }).select().single());
        S.trips.unshift(t); closeSheet(); render(true); toast("Viagem criada.");
        openPanel("trip", t.id);
      }
    }
  });
}
async function addToTrip(ids, tripId) {
  const rows = await q(sb.from("media").update({ trip_id: tripId }).in("id", ids).select());
  rows.forEach(r => { const i = S.media.findIndex(x => x.id === r.id); if (i >= 0) S.media[i] = r; });
  refreshViews();
}
function tripUpload() {
  const t = UI.panel && UI.panel.type === "trip" ? UI.panel.id : null; if (!t) return;
  pickFiles(ACCEPT_ALL, true, async files => { await uploadFiles(files, { trip_id: t }); });
}
function tripPick() {
  const tid = UI.panel && UI.panel.id; if (!tid) return;
  openPicker({
    title: "Juntar à viagem", hint: "Escolha as fotos e vídeos que fazem parte dela.", multi: true, okLabel: "Adicionar à viagem",
    exclude: x => x.trip_id === tid, emptyText: "Tudo o que foi enviado já está nesta viagem.",
    onDone: async ids => { await addToTrip(ids, tid); closeSheet(); toast("Adicionado à viagem."); },
    onUpload: async files => { closeSheet(); await uploadFiles(files, { trip_id: tid }); }
  });
}
function deleteTrip() {
  const t = S.trips.find(x => x.id === (UI.panel && UI.panel.id)); if (!t) return;
  askConfirm(`Apagar a viagem ${t.name}?`, "As fotos continuam guardadas, só saem da viagem.", "Apagar viagem", async () => {
    await q(sb.from("trips").delete().eq("id", t.id));
    S.trips = S.trips.filter(x => x.id !== t.id); S.media.forEach(m => { if (m.trip_id === t.id) m.trip_id = null; });
    closeSheet(); closePanel(); refreshViews(); toast("Viagem apagada.");
  });
}

/* ============ ações: subir ============ */
function startUpload() {
  pickFiles(ACCEPT_ALL, true, files => {
    const m = { place: "", trip: "" };
    openSheet({
      model: m, focus: false,
      view: () => `<h3>${files.length === 1 ? "Enviar 1 arquivo" : `Enviar ${files.length} arquivos`}</h3><p class="hint">Fotos ficam com no máximo 2000 px de largura. Vídeos podem ter até 50 MB.</p>
        <form novalidate>
        <label class="field"><span>Lugar (opcional)</span><input data-m="place" maxlength="120" value="${esc(m.place)}" autocomplete="off" placeholder="Ex.: Belo Horizonte, MG"></label>
        <label class="field"><span>Viagem (opcional)</span><select data-m="trip"><option value="">Nenhuma</option>${S.trips.map(t => `<option value="${t.id}" ${t.id === m.trip ? "selected" : ""}>${esc(t.name)}</option>`).join("")}</select></label>
        <button class="btn" type="submit">Enviar</button></form>`,
      on: { submit: async () => { closeSheet(); await uploadFiles(files, { place: m.place.trim(), trip_id: m.trip || null }); } }
    });
  });
}

/* ============ ações: listas ============ */
async function touchList(id) {
  const now = new Date().toISOString();
  const L = S.lists.find(l => l.id === id); if (L) L.updated_at = now;
  sb.from("lists").update({ updated_at: now }).eq("id", id).then(() => { });
}
async function newList() {
  try {
    const L = await q(sb.from("lists").insert({ couple_id: S.couple.id, title: "Nova lista" }).select().single());
    S.lists.unshift(L); UI.openList = L.id; render();
    const t = $("ltitle"); if (t) { t.focus(); t.select(); }
  } catch (e) { toast(friendly(e)); }
}
async function toggleItem(id) {
  const it = S.items.find(i => i.id === id); if (!it) return;
  it.done = !it.done; render(true);
  try { await q(sb.from("list_items").update({ done: it.done }).eq("id", id)); touchList(it.list_id); }
  catch (e) { it.done = !it.done; render(true); toast(friendly(e)); }
}
async function deleteItem(id) {
  const it = S.items.find(i => i.id === id); if (!it) return;
  try { await q(sb.from("list_items").delete().eq("id", id)); S.items = S.items.filter(i => i.id !== id); touchList(it.list_id); render(true); }
  catch (e) { toast(friendly(e)); }
}
async function addItem(text) {
  const L = S.lists.find(l => l.id === UI.openList); if (!L) return;
  const it = await q(sb.from("list_items").insert({ list_id: L.id, couple_id: S.couple.id, text }).select().single());
  S.items.push(it); touchList(L.id); render(true);
  setTimeout(() => { const n = $("nitem"); if (n) n.focus(); }, 30);
}
async function togglePin() {
  const L = S.lists.find(l => l.id === UI.openList); if (!L) return;
  try { const r = await q(sb.from("lists").update({ pinned: !L.pinned, updated_at: new Date().toISOString() }).eq("id", L.id).select().single()); Object.assign(L, r); render(true); toast(L.pinned ? "Lista fixada." : "Lista desafixada."); }
  catch (e) { toast(friendly(e)); }
}
function deleteList() {
  const L = S.lists.find(l => l.id === UI.openList); if (!L) return;
  askConfirm(`Apagar a lista ${L.title}?`, "Os itens somem para os dois e não dá para desfazer.", "Apagar lista", async () => {
    await q(sb.from("lists").delete().eq("id", L.id));
    S.lists = S.lists.filter(l => l.id !== L.id); S.items = S.items.filter(i => i.list_id !== L.id);
    UI.openList = null; closeSheet(); render(); toast("Lista apagada.");
  });
}

/* ============ ações: calendário ============ */
function openNewEvent() {
  const m = { title: "", date: UI.selDay, time: "", who: "", note: "", err: "" };
  openSheet({
    model: m,
    view: () => `<h3>Novo compromisso</h3>${m.err ? hint(m.err) : ""}
      <form novalidate>
      <label class="field"><span>O que vai acontecer</span><input data-m="title" maxlength="120" value="${esc(m.title)}" autocomplete="off" placeholder="Ex.: Jantar na casa da Bia"></label>
      <label class="field"><span>Dia</span><input type="date" data-m="date" value="${esc(m.date)}"></label>
      <label class="field"><span>Horário (opcional)</span><input type="time" data-m="time" value="${esc(m.time)}"></label>
      <div class="field"><span>Quem vai</span><div class="chips" role="group" aria-label="Quem vai">
        <button type="button" data-s="who" data-v="" aria-pressed="${m.who === ""}">Os dois</button>
        ${S.members.map(x => `<button type="button" data-s="who" data-v="${x.user_id}" aria-pressed="${m.who === x.user_id}">${esc(x.display_name || "Alguém")}</button>`).join("")}</div></div>
      <label class="field"><span>Observação (opcional)</span><input data-m="note" maxlength="300" value="${esc(m.note)}" autocomplete="off"></label>
      <button class="btn" type="submit">Salvar compromisso</button></form>`,
    on: {
      who: t => { m.who = t.dataset.v; drawSheet(); },
      submit: async () => {
        if (!m.title.trim()) { m.err = "Dê um nome para o compromisso."; drawSheet(); return; }
        if (!m.date) { m.err = "Escolha o dia."; drawSheet(); return; }
        const e = await q(sb.from("events").insert({ couple_id: S.couple.id, title: m.title.trim(), starts_on: m.date, time_label: m.time || null, who_user: m.who || null, note: m.note.trim() || null }).select().single());
        S.events.push(e); S.events.sort(sortEv);
        const d = parseYmd(m.date); UI.calY = d.getFullYear(); UI.calM = d.getMonth(); UI.selDay = m.date;
        closeSheet(); render(true); toast("Compromisso salvo.");
      }
    }
  });
}
function deleteEvent(id) {
  const e = S.events.find(x => x.id === id); if (!e) return;
  askConfirm(`Apagar "${e.title}"?`, "O compromisso some para os dois.", "Apagar", async () => {
    await q(sb.from("events").delete().eq("id", id));
    S.events = S.events.filter(x => x.id !== id); closeSheet(); render(true); toast("Compromisso apagado.");
  });
}
function copyCode() {
  const code = S.couple.invite_code;
  const done = () => toast("Código copiado. Mande para quem você ama.");
  if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(code).then(done, () => toast(`Seu código: ${code}`));
  else toast(`Seu código: ${code}`);
}

/* ============ eventos da tela ============ */
function refreshViews() { render(true); if (UI.panel) renderPanel(); if (UI.viewer) renderViewer(); }
$("tabbar").addEventListener("click", e => {
  const b = e.target.closest(".tab"); if (!b) return;
  closePanel(); closeViewer();
  if (b.dataset.tab === UI.tab && UI.tab === "listas") UI.openList = null;
  UI.tab = b.dataset.tab; render();
  view.classList.remove("enter"); void view.offsetWidth; view.classList.add("enter");
});
$("main").addEventListener("click", e => {
  const t = e.target.closest("[data-media],[data-act],[data-seg],[data-list],[data-check],[data-delitem],[data-day],[data-mon],[data-trip],[data-place],[data-delev]");
  if (!t) return;
  const d = t.dataset;
  if (d.media) return openViewer(d.media);
  if (d.seg) { UI.seg = d.seg; return render(true); }
  if (d.trip) return openPanel("trip", d.trip);
  if (d.place) return openPanel("place", d.place);
  if (d.list) { UI.openList = d.list; return render(); }
  if (d.check) return toggleItem(d.check);
  if (d.delitem) return deleteItem(d.delitem);
  if (d.delev) return deleteEvent(d.delev);
  if (d.day) { UI.selDay = d.day; return render(true); }
  if (d.mon) {
    UI.calM += +d.mon; if (UI.calM < 0) { UI.calM = 11; UI.calY--; } if (UI.calM > 11) { UI.calM = 0; UI.calY++; }
    const first = `${UI.calY}-${pad(UI.calM + 1)}-01`; UI.selDay = first;
    return render(true);
  }
  const A = {
    editar: openProfile, novo: openNewPost, capa: () => openCoverPicker(false), copiar: copyCode, subir: startUpload,
    novaviagem: openNewTrip, "trip-upload": tripUpload, "trip-pick": tripPick, "trip-del": deleteTrip,
    fecharpanel: () => closePanel(), fecharviewer: () => closeViewer(),
    "v-feed": async () => {
      const x = S.media.find(v => v.id === UI.viewer); if (!x) return;
      try { const r = await q(sb.from("media").update({ in_feed: !x.in_feed }).eq("id", x.id).select().single()); Object.assign(x, r); refreshViews(); toast(x.in_feed ? "Foi para o feed." : "Saiu do feed."); }
      catch (err) { toast(friendly(err)); }
    },
    "v-edit": openEditMedia, "v-del": deleteMedia,
    novalista: newList, voltarlista: () => { UI.openList = null; render(); }, fixar: togglePin, apagarlista: deleteList,
    hoje: () => { const n = todayDate(); UI.calY = n.getFullYear(); UI.calM = n.getMonth(); UI.selDay = ymd(n); render(true); },
    evento: openNewEvent
  }[d.act];
  if (A) A();
});
view.addEventListener("submit", async e => {
  if (e.target.id !== "nadd") return;
  e.preventDefault();
  const i = $("nitem"), v = i.value.trim(); if (!v) return;
  i.disabled = true;
  try { await addItem(v); } catch (err) { toast(friendly(err)); const n = $("nitem"); if (n) { n.disabled = false; n.value = v; } }
});
view.addEventListener("change", async e => {
  if (e.target.id !== "ltitle") return;
  const L = S.lists.find(l => l.id === UI.openList); if (!L) return;
  const v = e.target.value.trim();
  if (!v) { e.target.value = L.title; toast("A lista precisa de um nome."); return; }
  if (v === L.title) return;
  try { const r = await q(sb.from("lists").update({ title: v, updated_at: new Date().toISOString() }).eq("id", L.id).select().single()); Object.assign(L, r); }
  catch (err) { e.target.value = L.title; toast(friendly(err)); }
});
view.addEventListener("keydown", e => { if (e.key === "Enter" && e.target.id === "ltitle") e.target.blur(); });

/* ============ atualizar quando voltar para o app ============ */
async function refresh() {
  if (!S.loaded || Date.now() - S.lastLoad < 8000) return;
  try {
    await loadData();
    if (!S.couple) return;
    const busy = SH || (document.activeElement && /^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement.tagName));
    if (busy) return;
    if (UI.viewer && !S.media.find(x => x.id === UI.viewer)) closeViewer();
    refreshViews();
  } catch (e) { /* sem rede: mantém o que está na tela */ }
}
document.addEventListener("visibilitychange", () => { if (document.visibilityState === "visible") refresh(); });

/* ============ começar ============ */
async function init() {
  if (!window.supabase) { showGate(`<div class="center stack"><h1 class="step">Sem conexão</h1><p>Não consegui carregar o Us. Confira a internet e tente de novo.</p><button class="btn" data-g="reload">Tentar de novo</button></div>`); gate.addEventListener("click", e => { if (e.target.closest("[data-g=reload]")) location.reload(); }); return; }
  showGate(loadingHTML("Abrindo o Us…"));
  let key = SB_KEY;
  try { const r = await fetch(`${SB_URL}/auth/v1/settings`, { headers: { apikey: SB_KEY } }); if (r.status === 401 || r.status === 403) key = SB_KEY_LEGADA; } catch (e) { /* offline: segue com a chave principal */ }
  sb = window.supabase.createClient(SB_URL, key, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } });
  const h = location.hash || "";
  if (/type=recovery/.test(h)) UI.recovery = true;
  let hashErr = "";
  if (/error_code=otp_expired|error=access_denied/.test(h)) { hashErr = "O link venceu ou já foi usado. Peça um novo em Esqueci a senha."; history.replaceState(null, "", location.pathname); }
  sb.auth.onAuthStateChange((ev, session) => {
    setTimeout(() => {
      if (ev === "PASSWORD_RECOVERY") { UI.recovery = true; showRecovery(); }
      else if (ev === "SIGNED_IN" && session && !UI.recovery) { if (!S.user || S.user.id !== session.user.id) boot(); }
      else if (ev === "SIGNED_OUT") { if (S.user || S.loaded) { resetState(); showAuth(); } }
    }, 0);
  });
  if (hashErr) { const { data } = await sb.auth.getSession(); if (!data.session) { showAuth(hashErr); return; } }
  await boot();
}
if ("serviceWorker" in navigator && /^https?:$/.test(location.protocol)) window.addEventListener("load", () => navigator.serviceWorker.register("sw.js").catch(() => { }));
init();
})();
