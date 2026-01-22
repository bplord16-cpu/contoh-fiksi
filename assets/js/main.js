/* =========================================================
   TITIK FIKSI — Main Controller (FINAL ROBUST VERSION)
   Fix: White Screen, URL Detection, Caching, & Loop Logic
   ========================================================= */

const TitikFiksi = (() => {
  // Gunakan Absolute Path (diawali /) agar stabil di semua halaman
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

    // --- ANTI-CACHE FETCH ---
    // Menambahkan ?v=WAKTU agar browser selalu mengambil data terbaru dari server (Admin Panel)
    async fetchJSON(path) {
      try {
        const timestamp = new Date().getTime(); 
        const url = `${path}?v=${timestamp}`; 
        const res = await fetch(url, { cache: "no-store" });
        if (!res.ok) throw new Error(`Gagal memuat: ${path} (Status: ${res.status})`);
        return await res.json();
      } catch (e) {
        console.error("Error Fetching Data:", e);
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
    
    // Update link sosmed
    if (homeData && homeData.socials) {
      const s = homeData.socials;
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

  /* --- 3. LIST NOVEL (WORKS) --- */
  async function initWorksList() {
    const container = document.getElementById("works-container");
    if (!container) return; // Jika elemen tidak ada, stop.

    // Tampilkan loading agar user tahu script berjalan
    container.innerHTML = '<div style="padding:20px; text-align:center; color:var(--text-2);">⏳ Sedang memuat daftar novel...</div>';
    container.style.display = "grid"; 
    
    const data = await Utils.fetchJSON(PATHS.works);
    
    // Cek Error: Jika data null (gagal fetch) atau kosong
    if (!data || !data.works) {
      container.innerHTML = `
        <div class="glass-panel" style="grid-column: 1/-1; padding: 30px; text-align: center;">
          <h3 style="margin-top:0;">Gagal Memuat Data</h3>
          <p style="color:var(--muted)">Pastikan file <b>content/works/works.json</b> sudah ada di Admin Panel.</p>
        </div>`;
      container.style.display = "block"; 
      return;
    }

    if (data.works.length === 0) {
      container.innerHTML = '<div class="glass-panel" style="padding:20px; text-align:center;">Belum ada novel yang dipublikasikan.</div>';
      container.style.display = "block";
      return;
    }

    // Render Data
    container.innerHTML = "";
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
           <span class="badge" style="background:rgba(59,130,246,0.1); color:var(--brand); border:none;">${work.status || 'Ongoing'}</span>
        </div>
      `;
      container.appendChild(card);
    });
  }

  /* --- 4. LIST TULISAN --- */
  async function initWritingsList() {
    const container = document.getElementById("writings-container");
    if (!container) return;
    
    container.innerHTML = '<div style="padding:20px; text-align:center;">⏳ Memuat tulisan...</div>';
    const data = await Utils.fetchJSON(PATHS.writings);
    
    if (!data || !data.writings || data.writings.length === 0) {
      container.innerHTML = '<div class="glass-panel" style="padding:20px; text-align:center;">Belum ada tulisan terbaru.</div>';
      return;
    }
    
    container.innerHTML = "";
    // Urutkan dari yang terbaru
    const sorted = data.writings.sort((a, b) => new Date(b.date) - new Date(a.date));

    sorted.forEach(item => {
      const row = document.createElement("div");
      row.className = "glass-panel";
      row.style.cssText = "margin-bottom:15px; padding:22px; border-left:4px solid var(--brand);";
      
      row.innerHTML = `
        <div style="display:flex; justify-content:space-between; margin-bottom:8px;">
          <span style="font-size:0.8rem; color:var(--brand); font-weight:bold; text-transform:uppercase;">${item.category || 'Artikel'}</span>
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

  /* --- 5. DETAIL NOVEL & BAB (SMART LOOP) --- */
  async function initNovelDetail() {
    const slug = Utils.getQueryParam("slug");
    if (!slug) return (window.location.href = "works.html");

    Utils.setText("work-title", "Sedang memuat...");
    const data = await Utils.fetchJSON(PATHS.works);
    
    // Cari novel berdasarkan slug
    const novel = data?.works?.find(w => w.slug === slug);
    if (!novel) {
        Utils.setText("work-title", "Novel Tidak Ditemukan");
        Utils.setText("work-synopsis", "Cek kembali URL atau kembali ke halaman daftar novel.");
        return;
    }

    document.title = `${novel.title} | Titik Fiksi`;
    Utils.setText("work-title", novel.title);
    Utils.setText("work-genre", `📌 ${novel.genre || 'Fiksi'}`);
    Utils.setText("work-status", `✅ ${novel.status || '-'}`);
    Utils.setText("work-synopsis", novel.synopsis);
    
    const imgEl = document.getElementById("work-cover-img");
    if (imgEl) imgEl.src = novel.cover || "assets/images/defaults/cover-default.jpg";

    // --- CARI BAB DENGAN TOLERANSI ERROR (Loop Pintar) ---
    const listContainer = document.getElementById("chapters-list");
    listContainer.innerHTML = '<div style="padding:10px; color:var(--muted);">Sedang mengecek bab yang tersedia...</div>';
    
    let chapterCount = 1;
    let foundChapters = [];
    let gapCount = 0; 
    const MAX_GAP = 5; // Toleransi: Jika 5 nomor kosong berturut-turut, baru berhenti.
    const MAX_CHAPTERS = 300; // Batas aman

    while (chapterCount <= MAX_CHAPTERS && gapCount < MAX_GAP) {
      // Cek format 01, 02.. lalu 10, 11..
      const code = String(chapterCount).padStart(2, '0');
      const filename = `${slug}-${code}.json`;
      
      const chapData = await Utils.fetchJSON(`${PATHS.chaptersDir}${filename}`);
      
      if (chapData) {
        if (chapData.published !== false) foundChapters.push({ ...chapData, code });
        gapCount = 0; // Reset gap jika ketemu
      } else {
        gapCount++; // Tambah gap jika tidak ketemu
      }
      chapterCount++;
    }

    listContainer.innerHTML = "";
    if (foundChapters.length === 0) {
        listContainer.innerHTML = '<div class="glass-panel" style="padding:15px; text-align:center;">Belum ada bab dirilis.</div>';
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
    
    if (!novelSlug || !chapCode) return (window.location.href = "works.html");

    const filename = `${novelSlug}-${chapCode}.json`;
    const data = await Utils.fetchJSON(`${PATHS.chaptersDir}${filename}`);
    
    if (!data) {
        Utils.setText("chapter-title", "Bab Tidak Ditemukan");
        document.getElementById("chapter-content").innerHTML = "<p>Bab ini mungkin belum dipublikasikan atau URL salah.</p>";
        return;
    }

    document.title = `${data.title} | Baca`;
    Utils.setText("chapter-top", `CHAPTER ${parseInt(chapCode)}`);
    Utils.setText("chapter-title", data.title);
    document.getElementById("chapter-content").innerHTML = Utils.renderMarkdown(data.content);

    // External Link & Navigasi
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

    // Navigasi Next/Prev
    const currentNum = parseInt(chapCode);
    const prevCode = String(currentNum - 1).padStart(2,'0');
    const nextCode = String(currentNum + 1).padStart(2,'0');

    const btnPrev = document.getElementById("btn-prev");
    if(btnPrev) {
        if(currentNum > 1) {
            btnPrev.href = `chapter.html?novel=${novelSlug}&chapter=${prevCode}`;
            btnPrev.style.display = "inline-flex";
        } else btnPrev.style.display = "none";
    }

    const btnNext = document.getElementById("btn-next");
    if(btnNext) {
        // Cek dulu apakah file bab selanjutnya ada
        const nextData = await Utils.fetchJSON(`${PATHS.chaptersDir}${novelSlug}-${nextCode}.json`);
        if(nextData) {
            btnNext.href = `chapter.html?novel=${novelSlug}&chapter=${nextCode}`;
            btnNext.style.display = "inline-flex";
        } else btnNext.style.display = "none";
    }
  }

  /* --- INIT CONTROLLER (FIXED ROUTING) --- */
  function init() {
    initGlobalSettings();
    
    // LOGIKA NAVIGASI YANG DIPERBAIKI (Support URL tanpa .html)
    const path = window.location.pathname.toLowerCase(); 
    
    // Deteksi halaman berdasarkan kata kunci di URL
    if (path === "/" || path.includes("index")) {
        initHomePage();
    } 
    else if (path.includes("works") || path.includes("novel") && !path.includes("slug")) {
        // Halaman Daftar Novel (works.html)
        // Note: works.html kadang diakses via /works atau /novel tergantung penamaan file Anda.
        // Di file Anda namanya works.html, tapi di screenshot navbar link "Novel".
        initWorksList();
    }
    else if (path.includes("writings") || path.includes("tulisan")) {
        // Halaman Tulisan (writings.html)
        initWritingsList();
    }
    else if (path.includes("chapter") || path.includes("baca")) {
        // Halaman Baca (chapter.html)
        initReadChapter();
    }
    else if (Utils.getQueryParam("slug")) {
        // Jika URL ada ?slug=... biasanya ini halaman Detail Novel (novel.html)
        initNovelDetail();
    }
  }

  return { init, Utils };
})();

document.addEventListener("DOMContentLoaded", TitikFiksi.init);
