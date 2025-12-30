export type AlertLevel = 'success' | 'danger' | 'warning' | 'info';
export type AlertMsg = { type: AlertLevel; message: string };

type Listener = (msg: AlertMsg) => void;

const listeners = new Set<Listener>();
const resetListeners = new Set<() => void>();

const recentAlerts: string[] = [];
const DEDUPE_WINDOW_MS = 2000;

export function pushAlert(msg: AlertMsg) {
    const key = `${msg.type}:${msg.message}`;

    if (recentAlerts.includes(key)) {
        return;
    }

    recentAlerts.push(key);
    if (recentAlerts.length > 4) {
        recentAlerts.shift();
    }

    setTimeout(() => {
        const idx = recentAlerts.indexOf(key);
        if (idx !== -1) recentAlerts.splice(idx, 1);
    }, DEDUPE_WINDOW_MS);

    for (const l of Array.from(listeners)) l(msg);
}

export function subscribeAlerts(fn: Listener) {
    listeners.add(fn);
    return () => {
        listeners.delete(fn);
    };
}

export function clearAlerts() {
    for (const fn of Array.from(resetListeners)) fn();
}

export function subscribeAlertClears(fn: () => void) {
    resetListeners.add(fn);
    return () => {
        resetListeners.delete(fn);
    };
}
