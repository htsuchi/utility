function getNotifyTimes(selected) {
  if (!selected || selected.length === 0) return [3]; // 補正
  return selected.map(Number);
}

function scheduleNotifications(meeting) {
  const notifyTimes = getNotifyTimes(meeting.notify);
  const launchTime = meeting.launch ?? 3;

  notifyTimes.forEach(min => {
    const delay = calculateDelay(meeting.time, min);
    if (delay > 0) {
      setTimeout(() => showNotification(meeting.title, min), delay);
    }
  });

  const launchDelay = calculateDelay(meeting.time, launchTime);
  if (launchDelay > 0) {
    setTimeout(() => openMeetingURL(meeting.url), launchDelay);
  }
}

function showNotification(title, minutesBefore) {
  if (Notification.permission === "granted") {
    new Notification(`「${title}」が ${minutesBefore}分後に開始されます`);
    logHistory(title, "", `通知成功（${minutesBefore}分前）`);
  }
}

function openMeetingURL(url) {
  window.open(url, "_blank");
  logHistory("", url, "URL起動成功");
}

function calculateDelay(timeStr, offsetMinutes) {
  const [h, m] = timeStr.split(":").map(Number);
  const now = new Date();
  const target = new Date();
  target.setHours(h, m - offsetMinutes, 0, 0);
  return target - now;
}

function logHistory(title, url, status) {
  const history = loadHistory();
  const today = new Date().toISOString().split("T")[0];

  if (!history[today]) history[today] = [];

  history[today].push({
    time: new Date().toLocaleTimeString(),
    title,
    url,
    status
  });

  saveHistory(history);
}
