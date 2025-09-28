export type AlertLevel = 'success' | 'danger' | 'warning' | 'info';
export type AlertMsg = { type: AlertLevel; message: string };

type Listener = (msg: AlertMsg) => void;

const listeners = new Set<Listener>();
const resetListeners = new Set<() => void>();

export function pushAlert(msg: AlertMsg) {
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
