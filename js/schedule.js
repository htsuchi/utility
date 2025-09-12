function scheduleAll() {
  const todayKey = new Date().toISOString().split("T")[0];
  const lastKey = localStorage.getItem("skipTodayDate");
  if (lastKey !== todayKey) {
    localStorage.setItem("skipToday", "[]");
    localStorage.setItem("skipTodayDate", todayKey);
  }

  const skipList = JSON.parse(localStorage.getItem("skipToday") || "[]");
  const meetings = JSON.parse(localStorage.getItem("meetings") || "[]");
  const history = JSON.parse(localStorage.getItem("history") || "{}");

  const now = new Date();
  const today = now.toISOString().split("T")[0];
  const todayWeekday = ["日", "月", "火", "水", "木", "金", "土"][now.getDay()];

  meetings.forEach((meeting, index) => {
    if (skipList.includes(index)) return;
    if (!meeting.day.includes(todayWeekday)) return;

    const [hour, minute] = meeting.time.split(":").map(Number);
    const target = new Date();
    target.setHours(hour);
    target.setMinutes(minute);
    target.setSeconds(0);
    target.setMilliseconds(0);

    const diff = target - now;
    if (diff > 0 && diff <= 180000) { // 3分前以内
      const entry = { time: meeting.time, title: meeting.title, url: meeting.url };

      // 通知処理
      if (Notification.permission === "granted") {
        try {
          new Notification(meeting.title);
          entry.status = "通知成功（3分前）";
        } catch {
          entry.status = "通知失敗（通知APIエラー）";
        }
      } else {
        entry.status = "通知失敗（許可されていない可能性）";
      }

      // URL起動処理
      try {
        window.open(meeting.url, "_blank");
        history[today] = history[today] || [];
        history[today].push({ ...entry, status: "URL起動成功" });
      } catch {
        history[today] = history[today] || [];
        history[today].push({ ...entry, status: "URL起動失敗" });
      }

      // 履歴保存
      localStorage.setItem("history", JSON.stringify(history));
    }
  });
}

function toggleSkip(index) {
  const skipList = JSON.parse(localStorage.getItem("skipToday") || "[]");
  const updated = skipList.includes(index)
    ? skipList.filter(i => i !== index)
    : [...skipList, index];
  localStorage.setItem("skipToday", JSON.stringify(updated));
  location.reload();
}

function renderMeetingList() {
  const meetings = JSON.parse(localStorage.getItem("meetings") || "[]");
  const skipList = JSON.parse(localStorage.getItem("skipToday") || "[]");
  const tbody = document.getElementById("meetingList");
  tbody.innerHTML = "";

  const now = new Date();

  meetings.forEach((meeting, index) => {
    const row = document.createElement("tr");

    const titleCell = document.createElement("td");
    titleCell.textContent = meeting.title;

    const timeCell = document.createElement("td");
    timeCell.textContent = meeting.time;

    const dayCell = document.createElement("td");
    dayCell.textContent = meeting.day;

    const diffCell = document.createElement("td");
    const [hour, minute] = meeting.time.split(":").map(Number);
    const target = new Date();
    target.setHours(hour);
    target.setMinutes(minute);
    target.setSeconds(0);
    const diff = Math.floor((target - now) / 60000);
    diffCell.textContent = diff >= 0 ? `${diff}分前` : "過ぎています";

    const skipCell = document.createElement("td");
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = skipList.includes(index);
    checkbox.onchange = () => toggleSkip(index);
    skipCell.appendChild(checkbox);

    row.appendChild(titleCell);
    row.appendChild(timeCell);
    row.appendChild(dayCell);
    row.appendChild(diffCell);
    row.appendChild(skipCell);
    tbody.appendChild(row);
  });
}

// 初期化処理
document.addEventListener("DOMContentLoaded", () => {
  renderMeetingList();
  scheduleAll();
});
