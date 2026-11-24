/* Guarda só os arquivos do próprio app. Nunca guarda respostas do Supabase, fontes ou fotos. */
const VERSAO = "us-v12";
const ARQUIVOS = ["./", "index.html", "styles.css", "app.js", "manifest.webmanifest", "icons/icon-192.png", "icons/icon-512.png", "icons/apple-touch-icon.png", "fonts/DSEG7Classic-Bold.woff2"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(VERSAO).then(c => c.addAll(ARQUIVOS.map(u => new Request(u, { cache: "reload" })))).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== VERSAO).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return; // Supabase, fontes e CDN ficam de fora
  e.respondWith(
    // sempre pergunta ao servidor se há versão nova (o GitHub deixaria o navegador reaproveitar a antiga por 10 min)
    fetch(req, { cache: "no-cache" }).then(res => {
      if (res.ok) { const copia = res.clone(); caches.open(VERSAO).then(c => c.put(req, copia)); }
      return res;
    }).catch(() => caches.match(req).then(r => r || caches.match("index.html")))
  );
});

/* avisos dos compromissos: o servidor manda {title, body, tag, url} */
self.addEventListener("push", e => {
  let d = {};
  try { d = e.data ? e.data.json() : {}; } catch (x) { try { d = { body: e.data.text() }; } catch (y) { d = {}; } }
  e.waitUntil(self.registration.showNotification(d.title || "Us", {
    body: d.body || "", tag: d.tag || undefined, icon: "icons/icon-192.png", badge: "icons/icon-192.png", data: { url: d.url || "./" }
  }));
});
self.addEventListener("notificationclick", e => {
  e.notification.close();
  const url = String((e.notification.data && e.notification.data.url) || "./");
  const cal = /#cal/.test(url), fotos = /#fotos/.test(url);
  e.waitUntil((async () => {
    const wins = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
    const aberta = wins.find(w => w.url.startsWith(self.registration.scope));
    if (aberta) { try { await aberta.focus(); } catch (x) { } if (cal) aberta.postMessage({ tipo: "abrir-calendario" }); if (fotos) aberta.postMessage({ tipo: "abrir-fotos" }); return; }
    return self.clients.openWindow(new URL(cal ? "./#cal" : fotos ? "./#fotos" : "./", self.registration.scope).href);
  })());
});
