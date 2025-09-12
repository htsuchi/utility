function getNotifyTimes() {
  const checkboxes = document.querySelectorAll('#settingsArea input[type="checkbox"]:checked');
  return Array.from(checkboxes).map(cb => parseInt(cb.value));
}

function getLaunchTime() {
  const radio = document.querySelector('input[name="launch"]:checked');
  if (!radio) {
    document.querySelector('input[value="3"]').checked = true;
    return 3;
  }
  return parseInt(radio.value);
}

function getRemainingTime(meetingTime, offsetMinutes) {
  const launchAt = new Date(meetingTime.getTime() - offsetMinutes * 60000);
  const now = new Date();
  const diff = launchAt - now;
  if (diff <= 0) return "終了";
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const s = Math.floor((diff % 60000) / 1000);
  return `残り ${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`;
}

function renderSettings(meetings) {
  const tbody = document.querySelector("#meetingTable tbody");
  tbody.innerHTML = "";
  const today = new Date();
  const weekdayMap = { "日": 0, "月": 1, "火": 2, "水": 3, "木": 4, "金": 5, "土": 6 };
  const todayNum = today.getDay();
  const launchOffset = getLaunchTime();

  meetings.forEach((meeting, index) => {
    const tr = document.createElement("tr");
    const meetingDays = meeting.day.split("/").map(d => weekdayMap[d.trim()]);
    const [hour, minute] = meeting.time.split(":").map(Number);
    const meetingTime = new Date(today.getFullYear(), today.getMonth(), today.getDate(), hour, minute);
    let timeInfo = "";

    if (meetingDays.includes(todayNum)) {
      timeInfo = getRemainingTime(meetingTime, launchOffset);
    }

    const displayTitle = meeting.title.length > 20
      ? meeting.title.slice(0, 20) + "…"
      : meeting.title;

    const encodedMeeting = encodeURIComponent(JSON.stringify(meeting));
    tr.innerHTML = `
      <td>${displayTitle}</td>
      <td>${meeting.day}</td>
      <td>${meeting.time}</td>
      <td><a href="${meeting.url}" target="_blank">リンク</a></td>
      <td>
        <button onclick="editMeeting('${encodedMeeting}', ${index})">✏️</button>
        <button onclick="deleteMeeting(${index})">🗑️</button>
      </td>
      <td class="countdown">${timeInfo}</td>
    `;
    tbody.appendChild(tr);
  });
}

function updateCountdowns() {
  const rows = document.querySelectorAll("#meetingTable tbody tr");
  const today = new Date();
  const weekdayMap = { "日": 0, "月": 1, "火": 2, "水": 3, "木": 4, "金": 5, "土": 6 };
  const todayNum = today.getDay();
  const launchOffset = getLaunchTime();

  rows.forEach(row => {
    const dayText = row.children[1].textContent;
    const timeText = row.children[2].textContent;
    const meetingDays = dayText.split("/").map(d => weekdayMap[d.trim()]);
    const cell = row.querySelector(".countdown");

    if (!meetingDays.includes(todayNum)) {
      cell.textContent = "";
      return;
    }

    const [hour, minute] = timeText.split(":").map(Number);
    const meetingTime = new Date(today.getFullYear(), today.getMonth(), today.getDate(), hour, minute);
    cell.textContent = getRemainingTime(meetingTime, launchOffset);
  });
}
setInterval(updateCountdowns, 1000);

function scheduleAll(meetings) {
  const notifyTimes = getNotifyTimes();
  const launchTime = getLaunchTime();
  const today = new Date();
  const weekdayMap = { "日": 0, "月": 1, "火": 2, "水": 3, "木": 4, "金": 5, "土": 6 };
  const launchHistory = new Set();

  meetings.forEach(meeting => {
    const meetingDays = meeting.day.split("/").map(d => weekdayMap[d.trim()]);
    const isToday = meetingDays.includes(today.getDay());
    if (isToday) {
      const [hour, minute] = meeting.time.split(":").map(Number);
      const meetingTime = new Date(today.getFullYear(), today.getMonth(), today.getDate(), hour, minute);

      notifyTimes.forEach(min => {
        const notifyAt = new Date(meetingTime.getTime() - min * 60000);
        if (notifyAt > new Date()) {
          setTimeout(() => {
            if (Notification.permission === "granted") {
              new Notification(`${meeting.title} 開始まであと${min}分`, { body: meeting.url });
              logHistory(meeting, `通知成功（${min}分前）`);
            } else {
              logHistory(meeting, `通知失敗（許可されていない可能性）`);
            }
          }, notifyAt.getTime() - Date.now());
        }
      });

      const launchAt = new Date(meetingTime.getTime() - launchTime * 60000);
      const launchKey = `${launchAt.toISOString()}|${meeting.url}`;
      if (!launchHistory.has(launchKey) && launchAt > new Date()) {
        launchHistory.add(launchKey);
        setTimeout(() => {
          const win = window.open(meeting.url);
          const status = win ? "URL起動成功" : "URL起動失敗（ポップアップブロックの可能性）";
          logHistory(meeting, status);
        }, launchAt.getTime() - Date.now());
      }
    }
  });
}

function logHistory(meeting, status) {
  const todayKey = new Date().toISOString().split("T")[0];
  const history = JSON.parse(localStorage.getItem("history") || "{}");
  history[todayKey] = history[todayKey] || [];
  history[todayKey].push({
    time: new Date().toLocaleTimeString(),
    title: meeting.title,
    url: meeting.url,
    status
  });
  localStorage.setItem("history", JSON.stringify(history));
  renderHistory(todayKey, history[todayKey]);
}

function renderHistory(dateKey, entries) {
  const list = document.getElementById("todayHistoryList");
  list.innerHTML = "";
  entries.forEach(item => {
    const li = document.createElement("li");
    li.className = item.status.includes("成功") ? "success" : "failure";
    li.innerHTML = `${item.time} - ${item.title} (<a href="${item.url}" target="_blank" rel="noopener">${item.status}</a>)`;
    list.appendChild(li);
  });
}

// 履歴のクリーンアップ（7日以上前の履歴を削除）
const todayKey = new Date().toISOString().split("T")[0];
const history = JSON.parse(localStorage.getItem("history") || "{}");
const todayDate = new Date(todayKey);
for (const key in history) {
  const entryDate = new Date(key);
  const diffDays = (todayDate - entryDate) / (1000 * 60 * 60 * 24);
  if (diffDays > 7) {
    delete history[key];
  }
}
localStorage.setItem("history", JSON.stringify(history));

// 初期化処理
const savedMeetings = localStorage.getItem("meetings");
if (savedMeetings) {
  const meetings = JSON.parse(savedMeetings);
  renderSettings(meetings);
  scheduleAll(meetings);
}

if (history[todayKey]) {
  renderHistory(todayKey, history[todayKey]);
}