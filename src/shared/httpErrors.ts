import axios, { AxiosError } from 'axios';

type ZodIssue = {
    path?: (string | number)[];
    message?: string;
    field?: string;
};
type CvError = {
    property?: string;
    constraints?: Record<string, string>;
    children?: CvError[];
};

function flattenCv(errs: CvError[], parent?: string): string[] {
    const out: string[] = [];
    for (const e of errs) {
        const path = [parent, e.property].filter(Boolean).join('.');
        if (e.constraints)
            for (const msg of Object.values(e.constraints))
                out.push(path ? `${path}: ${msg}` : msg);
        if (e.children?.length) out.push(...flattenCv(e.children, path));
    }
    return out;
}

function extractErrorsBag(data: any): string[] {
    if (Array.isArray(data?.errors)) {
        const cv = flattenCv(data.errors as CvError[]);
        if (cv.length) return cv;

        const zodish = (data.errors as any[])
            .map((i) => {
                const field =
                    i.field ??
                    (Array.isArray(i.path) ? i.path.join('.') : undefined);
                return field
                    ? `${field}: ${i.message ?? 'Invalid'}`
                    : (i.message ?? '');
            })
            .filter(Boolean);
        if (zodish.length) return zodish;
    }

    if (
        data?.errors &&
        typeof data.errors === 'object' &&
        !Array.isArray(data.errors)
    ) {
        const msgs: string[] = [];
        for (const [field, val] of Object.entries<any>(data.errors)) {
            if (Array.isArray(val))
                val.forEach((v) => msgs.push(`${field}: ${String(v)}`));
            else if (typeof val === 'string') msgs.push(`${field}: ${val}`);
        }
        if (msgs.length) return msgs;
    }

    return [];
}

export function extractApiErrors(err: unknown): string[] {
    if (!axios.isAxiosError(err)) return ['Unexpected error.'];

    const ax = err as AxiosError<any>;
    const { response, message: axiosMessage } = ax;

    if (!response) {
        if ((ax as any).code === 'ERR_NETWORK')
            return ['Network error. Check your connection or CORS.'];
        return [axiosMessage || 'Request failed before reaching the server.'];
    }

    const data = response.data;

    const fromErrors = extractErrorsBag(data);
    if (fromErrors.length) return fromErrors;

    if (Array.isArray(data?.issues)) {
        const msgs = (data.issues as ZodIssue[])
            .map((i) => {
                const field =
                    i.field ??
                    (Array.isArray(i.path) ? i.path.join('.') : undefined);
                return field
                    ? `${field}: ${i.message ?? 'Invalid'}`
                    : (i.message ?? '');
            })
            .filter(Boolean) as string[];
        if (msgs.length) return msgs;
    }

    if (Array.isArray(data?.message)) {
        const msgs = (data.message as any[]).map(String).filter(Boolean);
        if (msgs.length) return msgs;
    }

    if (typeof data?.message === 'string' && data.message.trim()) {
        return [data.message];
    }

    if (typeof data?.detail === 'string' && data.detail.trim())
        return [data.detail];
    if (typeof data?.title === 'string' && data.title.trim())
        return [data.title];

    const statusLine = response.status
        ? `HTTP ${response.status}`
        : 'Bad Request';
    return [statusLine || axiosMessage || 'Validation failed'];
}
