import axios from 'axios';
import { extractApiErrors } from '@/shared/httpErrors';
import { getEndpointUrl } from './config';
import { initNetworkInterceptor } from '@/services/logCollector/networkInterceptor';

export const http = axios.create({
    baseURL: getEndpointUrl(),
    withCredentials: true,
    responseType: 'json'
});

// Initialize dev tools network logging (only in dev mode)
initNetworkInterceptor(http);

http.interceptors.response.use(
    (r) => r,
    (err) => {
        (err as any).__messages = extractApiErrors(err);
        return Promise.reject(err);
    }
);

export function setAuthToken(token?: string) {
    if (!token) delete http.defaults.headers.common['Authorization'];
    const newHeader = token && `Bearer ${token}`;
    if (newHeader !== http.defaults.headers.common['Authorization']) {
        http.defaults.headers.common['Authorization'] = newHeader;
    }
}
