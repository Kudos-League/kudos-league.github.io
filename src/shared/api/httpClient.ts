import axios from 'axios';
import { extractApiErrors } from '@/shared/httpErrors';
import { getEndpointUrl } from './config';

export const http = axios.create({
    baseURL: getEndpointUrl(),
    withCredentials: true,
    responseType: 'json'
});

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
