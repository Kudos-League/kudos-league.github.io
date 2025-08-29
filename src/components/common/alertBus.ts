export type AlertLevel = 'success' | 'danger' | 'warning' | 'info';
export type AlertMsg = { type: AlertLevel; message: string };

type Listener = (msg: AlertMsg) => void;

const listeners = new Set<Listener>();

export function pushAlert(msg: AlertMsg) {
    for (const l of Array.from(listeners)) l(msg);
}

export function subscribeAlerts(fn: Listener) {
    listeners.add(fn);
    return () => {
        listeners.delete(fn);
    };
}