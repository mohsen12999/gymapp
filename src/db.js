const STORAGE_KEY = "gym.day-plans";

function keyFor(date) {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

export function todayKey() {
  return keyFor(new Date());
}

export function shiftDay(key, amount) {
  const [year, month, day] = key.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  date.setDate(date.getDate() + amount);
  return keyFor(date);
}

const weekdayFormat = new Intl.DateTimeFormat(undefined, { weekday: "short" });
const dateFormat = new Intl.DateTimeFormat(undefined, { day: "numeric", month: "short" });

export function formatDayLabel(key) {
  const [year, month, day] = key.split("-").map(Number);
  const selected = new Date(year, month - 1, day);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const offset = Math.round((selected - today) / 86400000);
  const relative = { [-2]: "2 days ago", [-1]: "Yesterday", 0: "Today", 1: "Tomorrow", 2: "In 2 days" };
  const label = dateFormat.format(selected);
  if (offset in relative) return `${relative[offset]} · ${label}`;
  return `${weekdayFormat.format(selected)} · ${label}`;
}

export function readPlans() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === null) return {};
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return {};
    return parsed;
  } catch {
    return {};
  }
}

export function writePlans(plans) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(plans));
}
