/* =========================================================
   TITIK FIKSI — Main Controller (Final Polish: Popup & Colors)
   ========================================================= */

const TitikFiksi = (() => {
  const PATHS = {
    settings: "content/settings/settings_general.json",
    home: "content/home/home.json",
    works: "content/works/works.json",
    writings: "content/writings/writings.json",
    chaptersDir: "content/chapters/" 
  };

  const Utils = {
    getQueryParam(param) { return new URLSearchParams(window.location.search).get(param); },
    formatDate(dateString) {
      if (!dateString) return "";
      return new Date(dateString).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' });
    },
    async fetchJSON(path) {
      try {
        const res = await fetch(path, { cache: "no-store" });
        if (!res.ok) return null;
        return await res.json();
      } catch (e) { return null; }
    },
    setText(id, text) {
      const el = document.getElementById(id);
      if (el) el.textContent = text;
    },
    renderMarkdown(text) {
      if (!text) return "";
      return text
        .replace(/\n---\n/g, '<hr class="scene-break">')
        .replace(/\n\*\*\*\n/g, '<hr class="scene-break">')
        .replace(/\*\*(.*?)\*\*/g, '<b>$1</b>')
        .replace(/\*(.*?)\*/g, '<i>$1</i>')
        .replace(/\n\n/g, '</p><p>')
        .replace(/\n/g, '<br>');
    }
  };

  /* --- 1. GLOBAL & KONTAK OTOMATIS --- */
  async function initGlobalSettings() {
    const settings = await Utils.fetchJSON(PATHS.settings);
    const homeData = await Utils.fetchJSON(PATHS.home);

    if (settings) {
      if (settings.brand_logo) document.querySelectorAll('img[data-brand="logo"]').forEach(img => img.src = settings.brand_logo);
      if (settings.brand_favicon) {
        let link = document.querySelector("link[rel~='icon']") || document.createElement('link');
        link.rel = 'icon'; link.href = settings.brand_favicon; document.head.appendChild(link);
      }
      if (settings.site_title && (location.pathname === '/' || location.pathname.includes('index'))) {
          document.title = settings.site_title;
      }
    }

    // Update Link Sosmed di Halaman Kontak
    if (homeData && homeData.socials) {
      const s = homeData.socials;
      // Gunakan class spesifik agar CSS warna bekerja
      if (s.instagram) updateLink('social-ig', s.instagram);
      if (s.facebook) updateLink('social-fb', s.facebook);
      if (s.twitter) updateLink('social-tw', s.twitter);
      if (s.tiktok) updateLink('social-tt', s.tiktok);
      if (s.youtube) updateLink('social-yt', s.youtube);
    }
  }

  function updateLink(className, url) {
    const els = document.getElementsByClassName(className);
    for (let el of els) {
        el.href = url;
        el.style.display = "inline-flex"; 
    }
  }

  /* --- 2. BERANDA --- */
  async function initHomePage() {
    const data = await Utils.fetchJSON(PATHS.home);
    if (!data || !data.hero) return;

    Utils.setText("hero-title", data.hero.title || "Selamat Datang");
    Utils.setText("hero-subtitle", data.hero.subtitle || "");
    Utils.setText("hero-intro", data.hero.intro || "");
    
    const ytContainer = document.getElementById("hero-youtube");
    if (data.hero.youtube_embed && ytContainer) {
      let url = data.hero.youtube_embed;
      if (url.includes("watch?v=")) url = url.replace("watch?v=", "embed/");
      if (url.includes("youtu.be/")) url = url.replace("youtu.be/", "www.youtube.com/embed/");
      ytContainer.innerHTML = `<iframe src="${url}" title="YouTube" frameborder="0" allowfullscreen></iframe>`;
      ytContainer.style.display = "block";
    }
  }

  /* --- 3. LIST NOVEL (POPUP CARD STYLE) --- */
  async function initWorksList() {
    const container = document.getElementById("works-container");
    if (!container) return;

    // Grid Layout
    container.style.display = "grid";
    container.style.gridTemplateColumns = "repeat(auto-fill, minmax(150px, 1fr))";
    container.style.gap = "25px"; // Jarak antar kartu
    container.style.paddingBottom = "40px";

    container.innerHTML = '<div class="loading-spinner">Memuat novel...</div>';
    
    const data = await Utils.fetchJSON(PATHS.works);
    if (!data || !data.works || data.works.length === 0) {
      container.innerHTML = '<div class="empty-state">Belum ada novel.</div>';
      container.style.display = "block"; 
      return;
    }

    container.innerHTML = "";
    data.works.forEach(work => {
      const card = document.createElement("a");
      card.href = `novel.html?slug=${work.slug}`;
      
      // 🔥 Gunakan class 'glass-panel card-work' agar kena CSS Popup
      card.className = "glass-panel card-work";
      
      card.innerHTML = `
        <div style="aspect-ratio:2/3; width:100%; border-radius:10px; overflow:hidden; margin-bottom:12px; background:#f0f0f0;">
          <img src="${work.cover || 'assets/images/defaults/cover-default.jpg'}" 
               style="width:100%; height:100%; object-fit:cover;" alt="${work.title}">
        </div>
        <h4 style="margin:0 0 5px; font-size:1rem; line-height:1.3; font-weight:700;">${work.title}</h4>
        <div style="font-size:0.75rem; color:var(--muted); margin-top:auto; display:flex; justify-content:space-between; align-items:center;">
           <span class="badge" style="font-size:0.7rem;">${work.status || 'Ongoing'}</span>
        </div>
      `;
      container.appendChild(card);
    });
  }

  /* --- 4. LIST TULISAN --- */
  async function initWritingsList() {
    const container = document.getElementById("writings-container");
    if (!container) return;
    container.innerHTML = '<div class="loading-spinner">Memuat tulisan...</div>';
    const data = await Utils.fetchJSON(PATHS.writings);
    
    if (!data || !data.writings || data.writings.length === 0) {
      container.innerHTML = '<div class="empty-state">Belum ada tulisan.</div>';
      return;
    }
    container.innerHTML = "";
    data.writings.forEach(item => {
      const row = document.createElement("div");
      row.className = "glass-panel";
      row.style.cssText = "margin-bottom:15px; padding:20px; border-left:4px solid var(--brand); transition:transform 0.2s;";
      
      // Efek hover simple untuk tulisan
      row.onmouseover = () => row.style.transform = "translateX(5px)";
      row.onmouseout = () => row.style.transform = "translateX(0)";

      row.innerHTML = `
        <div style="font-size:0.8rem; color:var(--brand); font-weight:bold; margin-bottom:6px; text-transform:uppercase; letter-spacing:0.5px;">
          ${item.category || 'Catatan'} • ${Utils.formatDate(item.date)}
        </div>
        <h3 style="margin:0 0 8px; font-size:1.2rem;">${item.title}</h3>
        <p style="font-size:0.95rem; line-height:1.6; color:var(--text-2);">
           ${item.content ? Utils.renderMarkdown(item.content) : '...'}
        </p>
      `;
      container.appendChild(row);
    });
  }

  /* --- 5. DETAIL NOVEL & BACA --- */
  async function initNovelDetail() {
    const slug = Utils.getQueryParam("slug");
    if (!slug) return (window.location.href = "works.html");

    Utils.setText("work-title", "Memuat...");
    const data = await Utils.fetchJSON(PATHS.works);
    const novel = data?.works?.find(w => w.slug === slug);
    if (!novel) return Utils.setText("work-title", "Novel Tidak Ditemukan");

    document.title = `${novel.title} | Titik Fiksi`;
    Utils.setText("work-title", novel.title);
    Utils.setText("work-genre", `📌 ${novel.genre || '-'}`);
    Utils.setText("work-status", `✅ ${novel.status || '-'}`);
    Utils.setText("work-synopsis", novel.synopsis);
    const imgEl = document.getElementById("work-cover-img");
    if (imgEl) imgEl.src = novel.cover || "assets/images/defaults/cover-default.jpg";

    const listContainer = document.getElementById("chapters-list");
    listContainer.innerHTML = '<div class="loading-spinner">Mencari bab...</div>';
    
    let chapterCount = 1, foundChapters = [], keepSearching = true;
    while (keepSearching && chapterCount <= 200) {
      const code = String(chapterCount).padStart(2, '0');
      const filename = `${slug}-${code}.json`;
      const chapterData = await Utils.fetchJSON(`${PATHS.chaptersDir}${filename}`);
      if (chapterData) {
        if (chapterData.published !== false) foundChapters.push({ ...chapterData, code });
        chapterCount++;
      } else {
         const nextExist = await Utils.fetchJSON(`${PATHS.chaptersDir}${slug}-${String(chapterCount+1).padStart(2,'0')}.json`);
         if(nextExist) chapterCount++; else keepSearching = false;
      }
    }

    listContainer.innerHTML = "";
    if (foundChapters.length === 0) listContainer.innerHTML = '<div class="empty-state">Belum ada bab.</div>';
    else {
      foundChapters.sort((a,b)=>a.code.localeCompare(b.code));
      foundChapters.forEach(chap => {
        const item = document.createElement("a");
        item.className = "chapter-item glass-panel";
        item.href = `chapter.html?novel=${slug}&chapter=${chap.code}`;
        item.innerHTML = `<div class="chap-num">#${chap.code}</div><div class="chap-info"><strong>${chap.title}</strong><span>${Utils.formatDate(chap.date)}</span></div>`;
        listContainer.appendChild(item);
      });
    }
  }

  async function initReadChapter() {
    window.scrollTo(0,0);
    const novelSlug = Utils.getQueryParam("novel");
    const chapCode = Utils.getQueryParam("chapter");
    if (!novelSlug || !chapCode) return (window.location.href = "works.html");

    const data = await Utils.fetchJSON(`${PATHS.chaptersDir}${novelSlug}-${chapCode}.json`);
    if (!data) return Utils.setText("chapter-title", "Bab tidak ditemukan.");

    document.title = `${data.title} | Baca Novel`;
    Utils.setText("chapter-top", `Chapter ${chapCode}`);
    Utils.setText("chapter-title", data.title);
    document.getElementById("chapter-content").innerHTML = Utils.renderMarkdown(data.content);

    const linkBox = document.getElementById("chapter-external-links");
    if(linkBox && data.external_links) {
        let html = "";
        const l = data.external_links;
        if(l.karyakarsa) html += `<a href="${l.karyakarsa}" target="_blank" class="btn-ext btn-kk">🎁 Karyakarsa</a>`;
        if(l.wattpad) html += `<a href="${l.wattpad}" target="_blank" class="btn-ext btn-wp">🟠 Wattpad</a>`;
        if(l.goodnovel) html += `<a href="${l.goodnovel}" target="_blank" class="btn-ext btn-gn">📘 GoodNovel</a>`;
        if(l.custom_url) html += `<a href="${l.custom_url}" target="_blank" class="btn-ext btn-custom">🔗 ${l.custom_text||'Link'}</a>`;
        linkBox.innerHTML = html ? `<div class="external-links-box"><p>Lanjut baca di:</p><div class="ext-buttons">${html}</div></div>` : "";
    }

    const btnBack = document.getElementById("btn-back-novel");
    if(btnBack) btnBack.href = `novel.html?slug=${novelSlug}`;
    
    const prevCode = String(parseInt(chapCode)-1).padStart(2,'0');
    const nextCode = String(parseInt(chapCode)+1).padStart(2,'0');
    const btnPrev = document.getElementById("btn-prev");
    if(btnPrev && parseInt(chapCode)>1) {
        btnPrev.href = `chapter.html?novel=${novelSlug}&chapter=${prevCode}`;
        btnPrev.style.display = "inline-flex";
    }
    const btnNext = document.getElementById("btn-next");
    if(btnNext) {
        const nextExist = await Utils.fetchJSON(`${PATHS.chaptersDir}${novelSlug}-${nextCode}.json`);
        if(nextExist) {
            btnNext.href = `chapter.html?novel=${novelSlug}&chapter=${nextCode}`;
            btnNext.style.display = "inline-flex";
        }
    }
  }

  function init() {
    initGlobalSettings();
    const path = window.location.pathname;
    if (path === "/" || path.includes("index.html")) initHomePage();
    else if (path.includes("works.html")) initWorksList();
    else if (path.includes("writings.html")) initWritingsList();
    else if (path.includes("novel.html")) initNovelDetail();
    else if (path.includes("chapter.html")) initReadChapter();
  }
  return { init, Utils };
})();
document.addEventListener("DOMContentLoaded", TitikFiksi.init);