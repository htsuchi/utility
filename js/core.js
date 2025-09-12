function showDebugIfNeeded() {
  const params = new URLSearchParams(location.search);
  if (params.get("mode") === "debug") {
    const box = document.getElementById("debugBox");
    const content = document.getElementById("debugContent");
    if (box && content) {
      box.style.display = "block";

      const all = {};
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        let value = localStorage.getItem(key);
        try {
          value = JSON.parse(value);
        } catch {
          // JSONでなければそのまま保持
        }
        all[key] = value;
      }

      content.innerHTML = "";
      for (const key in all) {
        const section = document.createElement("details");
        section.open = true;

        const summary = document.createElement("summary");
        summary.textContent = key;

        const pre = document.createElement("pre");
        pre.style.whiteSpace = "pre-wrap";
        pre.textContent = JSON.stringify(all[key], null, 2);

        section.appendChild(summary);
        section.appendChild(pre);
        content.appendChild(section);
      }
    }
  }
}

// ページ読み込み時に呼び出し
document.addEventListener("DOMContentLoaded", () => {
  showDebugIfNeeded();
});
