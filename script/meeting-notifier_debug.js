function renderDebug() {
  const meetings = loadMeetings();
  const history = loadHistory();
  const deleted = clearOldHistory();

  const output = {
    meetings,
    history
  };

  document.getElementById("debug-output").textContent =
    JSON.stringify(output, null, 2);

  document.getElementById("debug-count").textContent =
    `会議数: ${meetings.length}, 履歴日数: ${Object.keys(history).length}`;

  document.getElementById("debug-deleted").textContent =
    deleted.length > 0 ? deleted.join(", ") : "なし";
}
