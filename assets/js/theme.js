(function () {
  const THEMES = ["pearl", "aurora", "dark"];
  const STORAGE_KEY = "titikfiksi_theme";

  function niceName(theme) {
    if (theme === "pearl") return "Pearl Sky";
    if (theme === "aurora") return "Aurora Mint";
    return "Dark Glass";
  }

  function applyTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);
    const label = document.getElementById("theme-label");
    if (label) label.textContent = niceName(theme);
  }

  function getSavedTheme() {
    return localStorage.getItem(STORAGE_KEY);
  }

  function setSavedTheme(theme) {
    localStorage.setItem(STORAGE_KEY, theme);
  }

  function getInitialTheme() {
    const saved = getSavedTheme();
    if (saved && THEMES.includes(saved)) return saved;
    return "pearl";
  }

  function nextTheme(current) {
    const idx = THEMES.indexOf(current);
    return THEMES[(idx + 1) % THEMES.length];
  }

  document.addEventListener("DOMContentLoaded", () => {
    applyTheme(getInitialTheme());

    const btn = document.getElementById("theme-toggle");
    if (!btn) return;

    btn.addEventListener("click", () => {
      const current = document.documentElement.getAttribute("data-theme") || "pearl";
      const t = nextTheme(current);
      applyTheme(t);
      setSavedTheme(t);
    });
  });
})();
