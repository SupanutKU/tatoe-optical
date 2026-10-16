/** Invalidate shared catalog after a successful admin write, without copying
 * product photos/models into localStorage. Each storefront reads the same API. */
export const CATALOG_CHANGE_KEY = 'tatoe_catalog_changed';
export const CATALOG_CHANGE_EVENT = 'tatoe:catalog-changed';
export function notifyCatalogChanged() {
  if (typeof window === 'undefined') return;
  try { localStorage.setItem(CATALOG_CHANGE_KEY, `${Date.now()}-${Math.random()}`); } catch { /* local tab still updates */ }
  window.dispatchEvent(new Event(CATALOG_CHANGE_EVENT));
}
export function subscribeCatalogChanges(refresh: () => void) {
  let pending: ReturnType<typeof setTimeout> | undefined;
  const schedule = () => {
    if (document.visibilityState !== 'visible') return;
    clearTimeout(pending); pending = setTimeout(refresh, 100);
  };
  const storage = (event: StorageEvent) => { if (event.key === CATALOG_CHANGE_KEY) schedule(); };
  window.addEventListener(CATALOG_CHANGE_EVENT,schedule);
  window.addEventListener('storage',storage);
  window.addEventListener('focus',schedule);
  document.addEventListener('visibilitychange',schedule);
  // Other devices/browsers cannot receive this origin's storage event.
  const poll = setInterval(schedule,30000);
  return () => {
    clearTimeout(pending); clearInterval(poll);
    window.removeEventListener(CATALOG_CHANGE_EVENT,schedule);
    window.removeEventListener('storage',storage);
    window.removeEventListener('focus',schedule);
    document.removeEventListener('visibilitychange',schedule);
  };
}
