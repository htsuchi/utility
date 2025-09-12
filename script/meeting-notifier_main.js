document.addEventListener("DOMContentLoaded", () => {
  initializeForm();
  renderTodayHistory();
  renderPastHistory();
  renderMeetingList();

  if (location.search.includes("mode=debug")) {
    document.getElementById("debug-mode").style.display = "block";
    renderDebug();
    document.getElementById("debug-refresh").addEventListener("click", renderDebug);
  }

  document.getElementById("meeting-form").addEventListener("submit", handleFormSubmit);
  document.getElementById("bulk-submit").addEventListener("click", handleBulkSubmit);
});

function handleFormSubmit(event) {
  event.preventDefault();
  const form = event.target;
  const index = form.dataset.editIndex;

  const newMeeting = collectFormData(form);
  const meetings = loadMeetings();

  if (index !== undefined) {
    meetings[index] = newMeeting;
    delete form.dataset.editIndex;
  } else {
    meetings.push(newMeeting);
  }

  saveMeetings(meetings);
  renderMeetingList();
  form.reset();
  form.querySelector("input[value='3']").checked = true;
}

function handleBulkSubmit() {
  const input = document.getElementById("bulk-input").value.trim();
  if (!input) return;

  const lines = input.split("\n");
  const meetings = loadMeetings();
  const newMeetings = [];

  for (let i = 0; i < lines.length; i++) {
    const parts = lines[i].split(",");
    if (parts.length !== 4 || parts.some(p => p.trim() === "")) {
      alert(`不正な形式の行があります（${i + 1}行目）。登録を中止しました。`);
      return;
    }

    const [title, day, time, url] = parts.map(p => p.trim());
    const correctedUrl = url.startsWith("http") ? url : "https://" + url;

    newMeetings.push({
      title,
      day,
      time,
      url: correctedUrl,
      notify: ["3"],
      launch: 3,
      savedDate: new Date().toISOString().split("T")[0]
    });
  }

  saveMeetings(meetings.concat(newMeetings));
  renderMeetingList();
  document.getElementById("bulk-input").value = "";
}

function renderMeetingList() {
  const tbody = document.getElementById("meeting-table");
  tbody.innerHTML = "";

  const meetings = loadMeetings();
  meetings.sort((a, b) => a.time.localeCompare(b.time));

  meetings.forEach((meeting, index) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${meeting.title}</td>
      <td>${meeting.day}</td>
      <td>${meeting.time}</td>
      <td><a href="${meeting.url}" target="_blank" class="link-button">リンク</a></td>
      <td>${getRemainingTime(meeting.time)}</td>
      <td>
        <button onclick="editMeeting(${index})">編集</button>
        <button onclick="confirmDelete(${index})">削除</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

function getRemainingTime(timeStr) {
  const [h, m] = timeStr.split(":").map(Number);
  const now = new Date();
  const target = new Date();
  target.setHours(h, m, 0, 0);

  const diffMs = target - now;
  if (diffMs < 0) return "終了済";

  const diffMin = Math.floor(diffMs / 60000);
  return `残り ${diffMin}分`;
}

function confirmDelete(index) {
  if (confirm("この会議を削除しますか？")) {
    const meetings = loadMeetings();
    meetings.splice(index, 1);
    saveMeetings(meetings);
    renderMeetingList();
  }
}

function editMeeting(index) {
  const meetings = loadMeetings();
  const meeting = meetings[index];
  const form = document.getElementById("meeting-form");

  form.title.value = meeting.title;
  form.time.value = meeting.time;
  form.url.value = meeting.url;

  const selectedDays = meeting.day.split("/");
  form.querySelectorAll("input[name='day']").forEach(input => {
    input.checked = selectedDays.includes(input.value);
  });

  form.querySelectorAll("input[name='notify']").forEach(input => {
    input.checked = meeting.notify.includes(input.value);
  });

  form.querySelectorAll("input[name='launch']").forEach(input => {
    input.checked = parseInt(input.value) === meeting.launch;
  });

  form.dataset.editIndex = index;
}

function collectFormData(form) {
  const title = form.title.value.trim();
  const time = form.time.value;
  const url = form.url.value.trim();
  const days = Array.from(form.querySelectorAll("input[name='day']:checked")).map(el => el.value);
  const notify = Array.from(form.querySelectorAll("input[name='notify']:checked")).map(el => el.value);
  const launch = form.querySelector("input[name='launch']:checked")?.value || "3";
  const correctedUrl = url.startsWith("http") ? url : "https://" + url;

  if (!title || !time || !url || days.length === 0) {
    alert("すべての項目を入力し、曜日を選択してください。");
    throw new Error("バリデーション失敗");
  }

  return {
    title,
    day: days.join("/"),
    time,
    url: correctedUrl,
    notify,
    launch: parseInt(launch),
    savedDate: new Date().toISOString().split("T")[0]
  };
}

function renderTodayHistory() {
  const list = document.getElementById("history-list");
  list.innerHTML = "";

  const history = loadHistory();
  const today = new Date().toISOString().split("T")[0];
  const records = history[today] || [];

  records.forEach(entry => {
    const li = document.createElement("li");
    li.textContent = `${entry.time} ${entry.status}：${entry.title || entry.url}`;
    li.style.backgroundColor = entry.status.includes("成功") ? "#e0ffe0" : "#ffe0e
