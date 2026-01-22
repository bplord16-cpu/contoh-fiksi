/* =========================================================
   TITIK FIKSI — Main Controller (FINAL FIX DETAIL LOADING)
   Perbaikan: Prioritas Router untuk Detail Novel
   ========================================================= */

const TitikFiksi = (() => {
  // Path Absolute
  const PATHS = {
    settings: "/content/settings/settings_general.json",
    home: "/content/home/home.json",
    works: "/content/works/works.json",
    writings: "/content/writings/writings.json",
    chaptersDir: "/content/chapters/" 
  };

  const Utils = {
    getQueryParam(param) { return new URLSearchParams(window.location.search).get(param); },
    
    formatDate(dateString) {
      if (!dateString) return "";
      return new Date(dateString).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' });
    },

    // Anti-Cache Fetch
    async fetchJSON(path) {
      try {
        const timestamp = new Date().getTime(); 
        const url = `${path}?v=${timestamp}`; 
        const res = await fetch(url, { cache: "no-store" });
        if (!res.ok) return null;
        return await res.json();
      } catch (e) {
        console.error("Error:", e);
        return null;
      }
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

  /* --- 1. GLOBAL SETTINGS --- */
  async function initGlobalSettings() {
    const settings = await Utils.fetchJSON(PATHS.settings);
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
  }

  /* --- 2. BERANDA --- */
  async function initHomePage() {
    const data = await Utils.fetchJSON(PATHS.home);
    if (!data || !data.hero) return;

    Utils.setText("hero-title", data.hero.title);
    Utils.setText("hero-subtitle", data.hero.subtitle);
    Utils.setText("hero-intro", data.hero.intro);
    
    const ytContainer = document.getElementById("hero-youtube");
    if (data.hero.youtube_embed && ytContainer) {
      let url = data.hero.youtube_embed;
      if (url.includes("watch?v=")) url = url.replace("watch?v=", "embed/");
      if (url.includes("youtu.be/")) url = url.replace("youtu.be/", "www.youtube.com/embed/");
      ytContainer.innerHTML = `<iframe src="${url}" title="YouTube" frameborder="0" allowfullscreen></iframe>`;
      ytContainer.style.display = "block";
    }
  }

  /* --- 3. LIST NOVEL --- */
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
      
      const coverImg = work.cover ? work.cover : 'assets/images/defaults/cover-default.jpg';

      card.innerHTML = `
        <div style="aspect-ratio:2/3; width:100%; border-radius:12px; overflow:hidden; margin-bottom:12px; background:#e2e8f0;">
          <img src="${coverImg}" style="width:100%; height:100%; object-fit:cover;" alt="${work.title}" loading="lazy">
        </div>
        <h4 style="margin:0 0 6px; font-size:1rem; line-height:1.4; font-weight:700;">${work.title}</h4>
        <div style="font-size:0.75rem; color:var(--muted); margin-top:auto;">
           <span class="badge">${work.status || 'Ongoing'}</span>
        </div>
      `;
      container.appendChild(card);
    });
  }

  /* --- 4. LIST TULISAN --- */
  async function initWritingsList() {
    const container = document.getElementById("writings-container");
    if (!container) return;
    
    container.innerHTML = '<div style="padding:20px; text-align:center;">⏳ Sedang memuat tulisan...</div>';
    const data = await Utils.fetchJSON(PATHS.writings);
    
    if (!data || !data.writings || data.writings.length === 0) {
      container.innerHTML = '<div class="glass-panel" style="padding:20px; text-align:center;">Belum ada tulisan.</div>';
      return;
    }
    
    container.innerHTML = "";
    const sorted = data.writings.sort((a, b) => new Date(b.date) - new Date(a.date));

    sorted.forEach(item => {
      const row = document.createElement("div");
      row.className = "glass-panel";
      row.style.cssText = "margin-bottom:15px; padding:22px; border-left:4px solid var(--brand);";
      
      row.innerHTML = `
        <div style="display:flex; justify-content:space-between; margin-bottom:8px;">
          <span style="font-size:0.8rem; color:var(--brand); font-weight:bold;">${item.category || 'Artikel'}</span>
          <span style="font-size:0.8rem; color:var(--muted);">${Utils.formatDate(item.date)}</span>
        </div>
        <h3 style="margin:0 0 10px; font-size:1.25rem;">${item.title}</h3>
        <p style="font-size:0.95rem; line-height:1.7; color:var(--text-2); margin:0;">
           ${item.content ? Utils.renderMarkdown(item.content) : '...'}
        </p>
      `;
      container.appendChild(row);
    });
  }

  /* --- 5. DETAIL NOVEL & BAB (LOGIKA DI FIX DISINI) --- */
  async function initNovelDetail() {
    const slug = Utils.getQueryParam("slug");
    // Debugging: Cek apakah fungsi ini jalan
    console.log("Menjalankan Detail Novel untuk:", slug);
    
    if (!slug) return;

    Utils.setText("work-title", "Sedang memuat data...");
    const data = await Utils.fetchJSON(PATHS.works);
    
    const novel = data?.works?.find(w => w.slug === slug);
    if (!novel) {
        Utils.setText("work-title", "Novel Tidak Ditemukan");
        Utils.setText("work-synopsis", "Cek URL Anda kembali.");
        return;
    }

    document.title = `${novel.title} | Titik Fiksi`;
    Utils.setText("work-title", novel.title);
    Utils.setText("work-genre", `📌 ${novel.genre || 'Fiksi'}`);
    Utils.setText("work-status", `✅ ${novel.status || '-'}`);
    Utils.setText("work-synopsis", novel.synopsis);
    
    const imgEl = document.getElementById("work-cover-img");
    if (imgEl) imgEl.src = novel.cover || "assets/images/defaults/cover-default.jpg";

    // --- CARI BAB ---
    const listContainer = document.getElementById("chapters-list");
    listContainer.innerHTML = '<div style="padding:10px; color:var(--muted);">Mengecek bab...</div>';
    
    let chapterCount = 1;
    let foundChapters = [];
    let gapCount = 0; 
    const MAX_GAP = 5;
    const MAX_CHAPTERS = 300; 

    while (chapterCount <= MAX_CHAPTERS && gapCount < MAX_GAP) {
      const code = String(chapterCount).padStart(2, '0');
      const filename = `${slug}-${code}.json`;
      const chapData = await Utils.fetchJSON(`${PATHS.chaptersDir}${filename}`);
      
      if (chapData) {
        if (chapData.published !== false) foundChapters.push({ ...chapData, code });
        gapCount = 0; 
      } else {
        gapCount++; 
      }
      chapterCount++;
    }

    listContainer.innerHTML = "";
    if (foundChapters.length === 0) {
        listContainer.innerHTML = '<div class="glass-panel" style="padding:15px; text-align:center;">Belum ada bab.</div>';
    } else {
      foundChapters.sort((a,b) => parseInt(a.code) - parseInt(b.code));
      foundChapters.forEach(chap => {
        const item = document.createElement("a");
        item.className = "chapter-item glass-panel";
        item.href = `chapter.html?novel=${slug}&chapter=${chap.code}`;
        item.style.marginBottom = "10px";
        item.innerHTML = `
            <div class="chap-num">#${parseInt(chap.code)}</div>
            <div class="chap-info">
                <strong>${chap.title}</strong>
                <span>${Utils.formatDate(chap.date)}</span>
            </div>
        `;
        listContainer.appendChild(item);
      });
    }
  }

  /* --- 6. BACA BAB --- */
  async function initReadChapter() {
    window.scrollTo(0,0);
    const novelSlug = Utils.getQueryParam("novel");
    const chapCode = Utils.getQueryParam("chapter");
    
    if (!novelSlug || !chapCode) return;

    const filename = `${novelSlug}-${chapCode}.json`;
    const data = await Utils.fetchJSON(`${PATHS.chaptersDir}${filename}`);
    
    if (!data) {
        Utils.setText("chapter-title", "Bab Tidak Ditemukan");
        document.getElementById("chapter-content").innerHTML = "<p>Bab belum tersedia.</p>";
        return;
    }

    document.title = `${data.title}`;
    Utils.setText("chapter-top", `CHAPTER ${parseInt(chapCode)}`);
    Utils.setText("chapter-title", data.title);
    document.getElementById("chapter-content").innerHTML = Utils.renderMarkdown(data.content);

    const btnBack = document.getElementById("btn-back-novel");
    if(btnBack) btnBack.href = `novel.html?slug=${novelSlug}`;

    // Navigasi Next/Prev
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

  /* --- INIT CONTROLLER (ROUTER FIXED) --- */
  function init() {
    initGlobalSettings();
    
    const path = window.location.pathname.toLowerCase(); 
    const slug = Utils.getQueryParam("slug");
    const chapter = Utils.getQueryParam("chapter");

    // URUTAN INI SANGAT PENTING (JANGAN DITUKAR)
    
    // 1. Cek Apakah ini Halaman BACA BAB? (Ada parameter 'novel' dan 'chapter')
    if (chapter && Utils.getQueryParam("novel")) {
        initReadChapter();
    }
    // 2. Cek Apakah ini Halaman DETAIL NOVEL? (Ada parameter 'slug')
    else if (slug) {
        initNovelDetail();
    }
    // 3. Cek Halaman List Novel (Jika URL mengandung 'works' atau 'novel' TAPI TIDAK ADA SLUG)
    else if (path.includes("works") || path.includes("novel")) {
        initWorksList();
    }
    // 4. Cek Halaman Tulisan
    else if (path.includes("writings") || path.includes("tulisan")) {
        initWritingsList();
    }
    // 5. Default ke Beranda
    else if (path === "/" || path.includes("index")) {
        initHomePage();
    }
  }

  return { init, Utils };
})();

document.addEventListener("DOMContentLoaded", TitikFiksi.init);
