const STORAGE_KEYS = {
  MEETINGS: "meetings",
  HISTORY: "history"
};

function loadMeetings() {
  return JSON.parse(localStorage.getItem(STORAGE_KEYS.MEETINGS) || "[]");
}

function saveMeetings(data) {
  localStorage.setItem(STORAGE_KEYS.MEETINGS, JSON.stringify(data));
}

function loadHistory() {
  return JSON.parse(localStorage.getItem(STORAGE_KEYS.HISTORY) || "{}");
}

function saveHistory(data) {
  localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(data));
}

function clearOldHistory() {
  const history = loadHistory();
  const today = new Date();
  const cutoff = new Date(today);
  cutoff.setDate(today.getDate() - 7);

  const updated = {};
  const deletedDates = [];

  Object.keys(history).forEach(dateStr => {
    const date = new Date(dateStr);
    if (date >= cutoff) {
      updated[dateStr] = history[dateStr];
    } else {
      deletedDates.push(dateStr);
    }
  });

  saveHistory(updated);
  return deletedDates;
}
