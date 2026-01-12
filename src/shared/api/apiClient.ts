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
        console.log(`[apiMutate] Calling ${method.toUpperCase()} ${url}`);
        console.log('[apiMutate] Body:', body);
        console.log('[apiMutate] Options:', opts);

        const { data, headers } = buildBody(body, opts?.as ?? 'auto');

        console.log(
            '[apiMutate] After buildBody - data type:',
            data instanceof FormData ? 'FormData' : typeof data
        );
        console.log('[apiMutate] Headers:', headers);

        const res = await http.request<T>({
            url,
            method,
            data,
            params: opts?.params,
            headers: { ...opts?.headers, ...headers }
        });

        console.log('[apiMutate] Response received:', res.data);
        return res.data;
    }
    catch (err) {
        console.error('[apiMutate] Error occurred:', err);
        throw extractApiErrors(err);
    }
}
