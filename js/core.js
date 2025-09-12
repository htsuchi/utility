function updateClock() {
  const now = new Date();
  const days = ["日", "月", "火", "水", "木", "金", "土"];
  const str = `${now.getFullYear()}年${String(now.getMonth()+1).padStart(2,"0")}月${String(now.getDate()).padStart(2,"0")}日(${days[now.getDay()]}) ${now.toLocaleTimeString()}`;
  document.getElementById("clockDisplay").textContent = str;
}
setInterval(updateClock, 1000);
updateClock();

if (Notification.permission === "default") {
  Notification.requestPermission();
}

switchMode('form');
restoreAboutState();
showDebugIfNeeded();

function toggleAbout() {
  const content = document.getElementById("aboutContent");
  const collapsed = content.style.display === "none";
  content.style.display = collapsed ? "block" : "none";
  localStorage.setItem("aboutCollapsed", collapsed ? "false" : "true");
}

function restoreAboutState() {
  const collapsed = localStorage.getItem("aboutCollapsed") === "true";
  const content = document.getElementById("aboutContent");
  if (content) content.style.display = collapsed ? "none" : "block";
}

function toggleHistory() {
  const list = document.getElementById("todayHistoryList");
  list.style.display = (list.style.display === "none") ? "block" : "none";
}

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
        all[key] = localStorage.getItem(key);
      }
      content.textContent = JSON.stringify(all, null, 2);
    }
  }
}