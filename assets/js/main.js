/* =========================================================
   TITIK FIKSI — Main Controller (FINAL COMPLETE)
   Fitur: Safe Mode, Featured Post, Socials Fix, Smart Loop
   ========================================================= */

const TitikFiksi = (() => {
  const PATHS = {
    settings: "/content/settings/settings_general.json",
    home: "/content/home/home.json",
    works: "/content/works/works.json",
    writings: "/content/writings/writings.json",
    chaptersDir: "/content/chapters/" 
  };

  const Utils = {
    getQueryParam(param) { 
      return new URLSearchParams(window.location.search).get(param); 
    },
    
    formatDate(dateString) {
      if (!dateString) return "";
      try {
        return new Date(dateString).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' });
      } catch (e) { return dateString; }
    },

    // Anti-Cache Fetch
    async fetchJSON(path) {
      try {
        const timestamp = new Date().getTime(); 
        const url = `${path}?v=${timestamp}`; 
        const res = await fetch(url, { cache: "no-store" });
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
      try {
        let clean = text.replace(/\\/g, ''); 
        const paragraphs = clean.split(/\n\s*\n/);
        return paragraphs.map(para => {
          if (!para || para.trim().length === 0) return "";
          let formatted = para
            .replace(/\*\*(.*?)\*\*/g, '<b>$1</b>')
            .replace(/\*(.*?)\*/g, '<i>$1</i>')
            .replace(/__(.*?)__/g, '<u>$1</u>')
            .replace(/\n/g, '<br>'); 
          return `<p style="margin-bottom:18px; text-align:justify; line-height:1.9;">${formatted}</p>`;
        }).join("");
      } catch (e) { return text; }
    }
  };

  /* --- 1. SETTING GLOBAL & SOSMED (FIXED) --- */
  async function initGlobalSettings() {
    const settings = await Utils.fetchJSON(PATHS.settings);
    const homeData = await Utils.fetchJSON(PATHS.home);

    if (settings) {
      if (settings.brand_logo) {
        document.querySelectorAll('img[data-brand="logo"]').forEach(img => img.src = settings.brand_logo);
      }
      if (settings.brand_favicon) {
        let link = document.querySelector("link[rel~='icon']") || document.createElement('link');
        link.rel = 'icon'; link.href = settings.brand_favicon; document.head.appendChild(link);
      }
      if (settings.site_title && (location.pathname === '/' || location.pathname.includes('index'))) {
          document.title = settings.site_title;
      }
    }

    // 🔥 FIX: Update Link Sosmed (Target semua elemen dengan class social-xx)
    if (homeData && homeData.socials) {
      const s = homeData.socials;
      updateSocialLink('social-ig', s.instagram);
      updateSocialLink('social-fb', s.facebook);
      updateSocialLink('social-tw', s.twitter);
      updateSocialLink('social-tt', s.tiktok);
      updateSocialLink('social-yt', s.youtube);
    }
  }

  function updateSocialLink(className, url) {
    // Cari elemen berdasarkan class di Halaman Kontak atau Footer
    const els = document.getElementsByClassName(className);
    if (url && url.length > 5) {
        for (let el of els) {
            el.href = url;
            el.style.display = "inline-flex"; // Pastikan tampil
        }
    } else {
        // Jika url kosong, sembunyikan
        for (let el of els) { el.style.display = "none"; }
    }
  }

  /* --- 2. BERANDA (Platform & Featured Posts) --- */
  async function initHomePage() {
    const data = await Utils.fetchJSON(PATHS.home);
    if (!data || !data.hero) return;

    Utils.setText("hero-title", data.hero.title);
    Utils.setText("hero-subtitle", data.hero.subtitle);
    Utils.setText("hero-intro", data.hero.intro);
    
    // 🔥 FIX: Render Link Platform di Beranda
    const platContainer = document.querySelector(".platform-grid");
    if (data.platforms && platContainer) {
      let html = "";
      const p = data.platforms;
      if (p.wattpad && p.wattpad.length > 3) html += `<a href="${p.wattpad}" target="_blank" class="btn-platform">🟠 Wattpad</a>`;
      if (p.karyakarsa && p.karyakarsa.length > 3) html += `<a href="${p.karyakarsa}" target="_blank" class="btn-platform">🎁 Karyakarsa</a>`;
      if (p.goodnovel && p.goodnovel.length > 3) html += `<a href="${p.goodnovel}" target="_blank" class="btn-platform">📘 GoodNovel</a>`;
      if (p.fizzo && p.fizzo.length > 3) html += `<a href="${p.fizzo}" target="_blank" class="btn-platform">📗 Fizzo</a>`;
      platContainer.innerHTML = html;
    }

    const ytContainer = document.getElementById("hero-youtube");
    if (data.hero.youtube_embed && ytContainer) {
      let url = data.hero.youtube_embed.replace("watch?v=", "embed/").replace("youtu.be/", "www.youtube.com/embed/");
      ytContainer.innerHTML = `<iframe src="${url}" title="YouTube" frameborder="0" allowfullscreen></iframe>`;
      ytContainer.style.display = "block";
    }

    // 🔥 FITUR BARU: Tampilkan Tulisan Pilihan (Featured)
    initFeaturedWritings();
  }

  async function initFeaturedWritings() {
    const container = document.getElementById("home-featured-container");
    if (!container) return;

    const data = await Utils.fetchJSON(PATHS.writings);
    if (!data || !data.writings) return;

    // Filter yang 'featured' == true
    const featured = data.writings.filter(w => w.featured === true);

    if (featured.length === 0) {
        container.innerHTML = `<p style="font-size:13px; color:var(--muted);">Belum ada pengumuman.</p>`;
        return;
    }

    // Ambil 3 Teratas (Terbaru)
    featured.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
    const top3 = featured.slice(0, 3);

    let html = "";
    top3.forEach(item => {
        html += `
            <div style="margin-bottom:12px; padding-bottom:12px; border-bottom:1px solid var(--border);">
                <div style="font-size:11px; color:var(--brand); font-weight:bold;">${Utils.formatDate(item.date)}</div>
                <h4 style="margin:4px 0; font-size:14px;">${item.title}</h4>
                <p style="font-size:12px; margin:0; color:var(--text-2); line-height:1.4;">
                    ${item.content ? item.content.substring(0, 60) + '...' : ''}
                </p>
            </div>
        `;
    });
    // Tambah link lihat semua
    html += `<a href="writings.html" style="font-size:12px; font-weight:bold; color:var(--brand); text-decoration:none;">Lihat semua tulisan &rarr;</a>`;
    
    container.innerHTML = html;
  }

  /* --- 3. DETAIL NOVEL --- */
  async function initNovelDetail() {
    const slug = Utils.getQueryParam("slug");
    if (!slug) return;

    Utils.setText("work-title", "Memuat data...");
    
    const data = await Utils.fetchJSON(PATHS.works);
    const novel = data?.works?.find(w => w.slug === slug);
    
    if (!novel) {
        Utils.setText("work-title", "Novel Tidak Ditemukan");
        return;
    }

    document.title = `${novel.title} | Detail`;
    Utils.setText("work-title", novel.title);
    Utils.setText("work-genre", `📌 ${novel.genre || 'Fiksi'}`);
    Utils.setText("work-status", `✅ ${novel.status || '-'}`);
    
    const synopsisBox = document.getElementById("work-synopsis");
    if(synopsisBox) synopsisBox.innerHTML = Utils.renderMarkdown(novel.synopsis);
    
    const imgEl = document.getElementById("work-cover-img");
    if (imgEl) imgEl.src = novel.cover || "assets/images/defaults/cover-default.jpg";

    const listContainer = document.getElementById("chapters-list");
    listContainer.innerHTML = '<div style="padding:10px;">Sedang mencari bab...</div>';
    
    let chapterCount = 1, foundChapters = [], gapCount = 0; 
    while (chapterCount <= 300 && gapCount < 5) {
      const code = String(chapterCount).padStart(2, '0');
      const chapData = await Utils.fetchJSON(`${PATHS.chaptersDir}${slug}-${code}.json`);
      if (chapData) {
        if (chapData.published !== false) foundChapters.push({ ...chapData, code });
        gapCount = 0; 
      } else gapCount++;
      chapterCount++;
    }

    listContainer.innerHTML = "";
    if (foundChapters.length === 0) listContainer.innerHTML = '<div class="glass-panel" style="padding:15px; text-align:center;">Belum ada bab.</div>';
    else {
      foundChapters.sort((a,b) => parseInt(a.code) - parseInt(b.code));
      foundChapters.forEach(chap => {
        const item = document.createElement("a");
        item.className = "chapter-item glass-panel";
        item.href = `chapter.html?novel=${slug}&chapter=${chap.code}`;
        item.style.marginBottom = "10px";
        item.innerHTML = `<div class="chap-num">#${parseInt(chap.code)}</div><div class="chap-info"><strong>${chap.title}</strong><span>${Utils.formatDate(chap.date)}</span></div>`;
        listContainer.appendChild(item);
      });
    }
  }

  /* --- 4. BACA BAB --- */
  async function initReadChapter() {
    window.scrollTo(0,0);
    const novelSlug = Utils.getQueryParam("novel");
    const chapCode = Utils.getQueryParam("chapter");
    if (!novelSlug || !chapCode) return;

    const data = await Utils.fetchJSON(`${PATHS.chaptersDir}${novelSlug}-${chapCode}.json`);
    if (!data) {
        Utils.setText("chapter-title", "Bab Tidak Ditemukan");
        return;
    }

    document.title = `${data.title}`;
    Utils.setText("chapter-top", `CHAPTER ${parseInt(chapCode)}`);
    Utils.setText("chapter-title", data.title);
    
    const contentBox = document.getElementById("chapter-content");
    if(contentBox) contentBox.innerHTML = Utils.renderMarkdown(data.content);

    const linkBox = document.getElementById("chapter-external-links");
    if(linkBox && data.external_links) {
        let html = "";
        const l = data.external_links;
        if(l.karyakarsa && l.karyakarsa.length > 3) html += `<a href="${l.karyakarsa}" target="_blank" class="btn-ext btn-kk">🎁 Karyakarsa</a>`;
        if(l.wattpad && l.wattpad.length > 3) html += `<a href="${l.wattpad}" target="_blank" class="btn-ext btn-wp">🟠 Wattpad</a>`;
        if(l.goodnovel && l.goodnovel.length > 3) html += `<a href="${l.goodnovel}" target="_blank" class="btn-ext btn-gn">📘 GoodNovel</a>`;
        if(l.custom_url && l.custom_url.length > 3) html += `<a href="${l.custom_url}" target="_blank" class="btn-ext btn-custom">🔗 ${l.custom_text||'Link'}</a>`;
        linkBox.innerHTML = html ? `<div class="external-links-box"><p>Lanjut baca di:</p><div class="ext-buttons">${html}</div></div>` : "";
    }

    const btnBack = document.getElementById("btn-back-novel");
    if(btnBack) btnBack.href = `novel.html?slug=${novelSlug}`;

    const currentNum = parseInt(chapCode);
    const nextCode = String(currentNum + 1).padStart(2,'0');
    const prevCode = String(currentNum - 1).padStart(2,'0');

    const btnPrev = document.getElementById("btn-prev");
    if(btnPrev) {
        if(currentNum > 1) {
            btnPrev.href = `chapter.html?novel=${novelSlug}&chapter=${prevCode}`;
            btnPrev.style.display = "inline-flex";
        } else btnPrev.style.display = "none";
    }

    const btnNext = document.getElementById("btn-next");
    if(btnNext) {
        const nextData = await Utils.fetchJSON(`${PATHS.chaptersDir}${novelSlug}-${nextCode}.json`);
        if(nextData) {
            btnNext.href = `chapter.html?novel=${novelSlug}&chapter=${nextCode}`;
            btnNext.style.display = "inline-flex";
        } else btnNext.style.display = "none";
    }
  }

  /* --- 5. LIST WORKS & WRITINGS --- */
  async function initWorksList() {
    const container = document.getElementById("works-container");
    if (!container) return;
    
    container.innerHTML = '<div style="padding:20px; text-align:center;">⏳ Sedang memuat novel...</div>';
    
    const data = await Utils.fetchJSON(PATHS.works);
    if (!data || !data.works || data.works.length === 0) {
      container.innerHTML = '<div class="glass-panel" style="padding:20px; text-align:center;">Belum ada novel.</div>';
      return;
    }

    container.innerHTML = "";
    container.style.display = "grid";
    container.style.gridTemplateColumns = "repeat(auto-fill, minmax(160px, 1fr))";
    container.style.gap = "20px";

    data.works.forEach(work => {
      const card = document.createElement("a");
      card.href = `novel.html?slug=${work.slug}`;
      card.className = "glass-panel card-work";
      const cover = work.cover || 'assets/images/defaults/cover-default.jpg';
      card.innerHTML = `<div style="aspect-ratio:2/3; width:100%; border-radius:12px; overflow:hidden; margin-bottom:12px; background:#e2e8f0;"><img src="${cover}" style="width:100%; height:100%; object-fit:cover;" loading="lazy"></div><h4 style="margin:0 0 6px; font-size:1rem; line-height:1.4; font-weight:700;">${work.title}</h4><div style="font-size:0.75rem; color:var(--muted); margin-top:auto;"><span class="badge">${work.status || 'Ongoing'}</span></div>`;
      container.appendChild(card);
    });
  }

  async function initWritingsList() {
    const container = document.getElementById("writings-container");
    if (!container) return;
    
    container.innerHTML = '<div>Memuat...</div>';
    const data = await Utils.fetchJSON(PATHS.writings);
    
    if (!data || !data.writings) { container.innerHTML = '<div>Kosong.</div>'; return; }
    
    container.innerHTML = "";
    const sorted = data.writings.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));

    sorted.forEach(item => {
      const row = document.createElement("div");
      row.className = "glass-panel";
      row.style.cssText = "margin-bottom:15px; padding:22px; border-left:4px solid var(--brand);";
      row.innerHTML = `<div style="display:flex; justify-content:space-between; margin-bottom:8px;"><span style="font-size:0.8rem; color:var(--brand); font-weight:bold;">${item.category || 'Artikel'}</span><span style="font-size:0.8rem; color:var(--muted);">${Utils.formatDate(item.date)}</span></div><h3 style="margin:0 0 10px; font-size:1.25rem;">${item.title}</h3><p style="font-size:0.95rem; line-height:1.7; color:var(--text-2); margin:0;">${item.content ? Utils.renderMarkdown(item.content) : '...'}</p>`;
      container.appendChild(row);
    });
  }

  /* --- MAIN ROUTER --- */
  function init() {
    try {
        initGlobalSettings(); // Jalan di SEMUA halaman
        
        const path = window.location.pathname.toLowerCase();
        const slug = Utils.getQueryParam("slug");
        const chapter = Utils.getQueryParam("chapter");
        const novelParam = Utils.getQueryParam("novel");

        if (chapter && novelParam) initReadChapter();
        else if (slug) initNovelDetail();
        else if (path.includes("works") || path.includes("novel")) initWorksList();
        else if (path.includes("writings") || path.includes("tulisan")) initWritingsList();
        else if (path === "/" || path.includes("index")) initHomePage();
        
    } catch (error) { console.error("Error:", error); }
  }

  return { init, Utils };
})();

document.addEventListener("DOMContentLoaded", TitikFiksi.init);