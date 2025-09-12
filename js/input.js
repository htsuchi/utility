function switchMode(mode, meeting = null, index = null) {
  const area = document.getElementById("inputArea");
  if (mode === "form") {
    const selectedDays = meeting?.day?.split("/") || [];
    const dayOptions = ["月", "火", "水", "木", "金", "土", "日"];
    const dayCheckboxes = dayOptions.map(day => {
      const checked = selectedDays.includes(day) ? "checked" : "";
      return `<label><input type="checkbox" name="day" value="${day}" ${checked}>${day}</label>`;
    }).join("");

    area.innerHTML = `
      <table class="formTable">
        <tr><th>タイトル</th><td><input id="title" style="width:400px" value="${meeting?.title || ''}"></td></tr>
        <tr><th>曜日（複数選択可）</th><td>${dayCheckboxes}</td></tr>
        <tr><th>開始時刻</th><td><input id="time" type="time" value="${meeting?.time || ''}"></td></tr>
        <tr><th>URL</th><td><input id="url" style="width:600px" value="${meeting?.url || ''}"></td></tr>
        <tr><th>本日はスキップ</th><td><input type="checkbox" id="skipTodayForm"></td></tr>
      </table>
      <button onclick="saveForm(${index})">保存</button>
    `;
  } else if (mode === "text") {
    const csv = (localStorage.getItem("meetings") || "[]")
      .replace(/^\[/, "").replace(/\]$/, "").replace(/},{/g, "}\n{");
    area.innerHTML = `
      <textarea id="textInput" rows="20" cols="150" placeholder="タイトル,曜日,時刻,URL を改行区切りで入力">${csv}</textarea>
      <button onclick="saveText()">保存</button>
    `;
  }
}

function saveForm(index = null) {
  const title = document.getElementById("title").value.trim().replace(/,/g, "、");
  const days = [...document.querySelectorAll("input[name='day']:checked")].map(e => e.value).join("/");
  const time = document.getElementById("time").value;
  const url = document.getElementById("url").value;
  const skipToday = document.getElementById("skipTodayForm").checked;

  const meeting = { title, day: days, time, url };
  const meetings = JSON.parse(localStorage.getItem("meetings") || "[]");
  if (index !== null) {
    meetings[index] = meeting;
  } else {
    meetings.push(meeting);
  }
  localStorage.setItem("meetings", JSON.stringify(meetings));
  if (skipToday) {
    const skipList = JSON.parse(localStorage.getItem("skipToday") || "[]");
    skipList.push(meetings.length - 1);
    localStorage.setItem("skipToday", JSON.stringify(skipList));
  }
  location.reload();
}

function saveText() {
  const raw = document.getElementById("textInput").value;
  const lines = raw.split("\n").map(line => line.trim()).filter(line => line);
  const meetings = lines.map(line => {
    const [title, day, time, url] = line.split(",");
    return { title: title.replace(/,/g, "、"), day, time, url };
  });
  localStorage.setItem("meetings", JSON.stringify(meetings));
  location.reload();
}
