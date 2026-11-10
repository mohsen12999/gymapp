let deferredPrompt = null;
const listeners = new Set();

function emit() {
  for (const listener of listeners) listener();
}

// Captured at import time so the event is not missed before React mounts.
window.addEventListener("beforeinstallprompt", (event) => {
  event.preventDefault();
  deferredPrompt = event;
  emit();
});

window.addEventListener("appinstalled", () => {
  deferredPrompt = null;
  emit();
});

const standaloneQuery = window.matchMedia("(display-mode: standalone)");
standaloneQuery.addEventListener("change", emit);

export function isStandalone() {
  return standaloneQuery.matches || window.navigator.standalone === true;
}

export function installState() {
  if (isStandalone()) return "installed";
  return deferredPrompt ? "available" : "unknown";
}

export function onInstallChange(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function install() {
  if (!deferredPrompt) return Promise.resolve(null);
  const prompt = deferredPrompt;
  deferredPrompt = null;
  prompt.prompt();
  return prompt.userChoice.then((choice) => {
    emit();
    return choice.outcome;
  });
}
