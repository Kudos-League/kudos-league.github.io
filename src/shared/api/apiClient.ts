import { http } from '@/shared/api/httpClient';
import { extractApiErrors } from '@/shared/httpErrors';
import { buildBody } from '@/shared/api/body';

export async function apiGet<T>(
    url: string,
    opts?: { params?: any; headers?: any }
) {
    try {
        const res = await http.get<T>(url, opts);
        return res.data;
    }
    catch (err) {
        throw extractApiErrors(err);
    }
}

export async function apiMutate<T, B>(
    url: string,
    method: 'post' | 'put' | 'patch' | 'delete',
    body?: B,
    opts?: { as?: 'json' | 'form' | 'auto'; params?: any; headers?: any }
) {
    try {
        const { data, headers } = buildBody(body, opts?.as ?? 'auto');
        const res = await http.request<T>({
            url,
            method,
            data,
            params: opts?.params,
            headers: { ...opts?.headers, ...headers }
        });
        return res.data;
    }
    catch (err) {
        throw extractApiErrors(err);
    }
}
