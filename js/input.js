let editingIndex = null;

function switchMode(mode, meeting = null, index = null) {
  const area = document.getElementById("inputFields");
  area.innerHTML = "";
  editingIndex = index;

  if (mode === "text") {
    const saved = JSON.parse(localStorage.getItem("meetings") || "[]");
    const csv = saved.map(m => `${m.title},${m.day},${m.time},${m.url}`).join("\n");
    area.innerHTML = `
      <textarea id="textInput" rows="5" cols="50" placeholder="タイトル,曜日,時刻,URL を改行区切りで入力">${csv}</textarea>
      <button onclick="saveText()">保存</button>
    `;
  } else {
    area.innerHTML = `
      <label>タイトル<br>
        <input id="title" placeholder="タイトル" style="width:400px" value="${meeting?.title || ''}">
      </label><br>
      <label>曜日（複数選択可）<br>
        <label><input type="checkbox" name="day" value="月">月</label>
        <label><input type="checkbox" name="day" value="火">火</label>
        <label><input type="checkbox" name="day" value="水">水</label>
        <label><input type="checkbox" name="day" value="木">木</label>
        <label><input type="checkbox" name="day" value="金">金</label>
        <label><input type="checkbox" name="day" value="土">土</label>
        <label><input type="checkbox" name="day" value="日">日</label>
      </label><br>
      <label>時刻<br>
        <input id="time" type="time" value="${meeting?.time || ''}">
      </label><br>
      <label>URL<br>
        <input id="url" placeholder="URL" style="width:600px" value="${meeting?.url || ''}">
      </label><br>
      <button onclick="saveForm()">保存</button>
    `;
  }
}

function validateMeeting(meeting) {
  if (!meeting.title || !meeting.title.trim()) {
    return "タイトルが未入力です";
  }

  const validDays = ["月", "火", "水", "木", "金", "土", "日"];
  const days = meeting.day.split("/").map(d => d.trim());
  if (days.length === 0 || !days.every(d => validDays.includes(d))) {
    return "曜日が未選択または不正です";
  }

  if (!meeting.time || !meeting.time.match(/^\d{2}:\d{2}$/)) {
    return "時刻の形式が不正です（HH:MM）";
  }
  const [hour, minute] = meeting.time.split(":").map(Number);
  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) {
    return "時刻が不正です（00:00〜23:59）";
  }

  if (!meeting.url || !meeting.url.trim()) {
    return "URLが未入力です";
  }
  if (!meeting.url.match(/^https?:\/\/.+/)) {
    return "URLの形式が不正です（http(s)://〜）";
  }

  return null;
}

function saveForm() {
  const title = document.getElementById("title").value.trim();
  const time = document.getElementById("time").value;
  let url = document.getElementById("url").value.trim();
  const dayCheckboxes = document.querySelectorAll('input[name="day"]');
  const selectedDays = Array.from(dayCheckboxes).filter(cb => cb.checked).map(cb => cb.value);

  if (!url.match(/^https?:\/\//)) {
    url = "https://" + url.replace(/^https?\/?\/?/, "");
  }

  const meeting = { title, day: selectedDays.join("/"), time, url };
  const error = validateMeeting(meeting);
  if (error) {
    alert(error);
    return;
  }

  const saved = JSON.parse(localStorage.getItem("meetings") || "[]");
  if (editingIndex !== null) {
    saved[editingIndex] = meeting;
    editingIndex = null;
  } else {
    saved.push(meeting);
  }

  localStorage.setItem("meetings", JSON.stringify(saved));
  renderSettings(saved);
  scheduleAll(saved);

  const csv = saved.map(m => `${m.title},${m.day},${m.time},${m.url}`).join("\n");
  const textInput = document.getElementById("textInput");
  if (textInput) textInput.value = csv;
}

function saveText() {
  const lines = document.getElementById("textInput").value.trim().split("\n");
  const meetings = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const parts = line.split(",");
    if (parts.length !== 4 || parts.some(p => !p.trim())) {
      alert(`第${i + 1}行に不正な形式があります（4項目すべて必要です）`);
      return;
    }

    let [title, day, time, rawUrl] = parts.map(p => p.trim());
    if (!rawUrl.match(/^https?:\/\//)) {
      rawUrl = "https://" + rawUrl.replace(/^https?\/?\/?/, "");
    }

    const meeting = { title, day, time, url: rawUrl };
    const error = validateMeeting(meeting);
    if (error) {
      alert(`第${i + 1}行のエラー: ${error}`);
      return;
    }

    meetings.push(meeting);
  }

  localStorage.setItem("meetings", JSON.stringify(meetings));
  renderSettings(meetings);
  scheduleAll(meetings);
}

function deleteMeeting(index) {
  const meetings = JSON.parse(localStorage.getItem("meetings") || "[]");
  meetings.splice(index, 1);
  localStorage.setItem("meetings", JSON.stringify(meetings));
  renderSettings(meetings);
  scheduleAll(meetings);

  const csv = meetings.map(m => `${m.title},${m.day},${m.time},${m.url}`).join("\n");
  const textInput = document.getElementById("textInput");
  if (textInput) textInput.value = csv;
}

function editMeeting(encoded, index) {
  const meeting = JSON.parse(decodeURIComponent(encoded));
  switchMode('form', meeting, index);
}