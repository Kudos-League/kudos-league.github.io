import React, { useMemo } from 'react';
import { detectUrls } from '@/shared/linkUtils';
import { usePostQuery } from '@/shared/api/queries/posts';
import { getEndpointUrl, getImagePath } from '@/shared/api/config';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { apiGet } from '@/shared/api/apiClient';

export type LinkPreview = {
    url?: string;
    title?: string;
    description?: string;
    siteName?: string;
    image?: string;
    images?: string[];
    favicon?: string;
    provider?: string;
    type?: string;
};

interface RichEmbedsProps {
    text: string;
    maxEmbeds?: number;
    className?: string;
}

const LINK_PREVIEW_URL = process.env.REACT_APP_LINK_PREVIEW_URL;

const normalizePreview = (raw: any): LinkPreview | null => {
    const data = raw?.data ?? raw?.preview ?? raw;
    if (!data || typeof data !== 'object') return null;
    return data as LinkPreview;
};

const fetchLinkPreview = async (url: string): Promise<LinkPreview | null> => {
    if (!url) return null;

    if (LINK_PREVIEW_URL) {
        const res = await fetch(LINK_PREVIEW_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url })
        });
        if (!res.ok) return null;
        const json = await res.json().catch(() => null);
        return normalizePreview(json);
    }

    const data = await apiGet<any>('/links/preview', { params: { url } });
    return normalizePreview(data);
};

const shouldProxyImage = (src?: string) => {
    if (!src) return false;
    try {
        const parsed = new URL(src);
        const host = typeof window !== 'undefined' ? window.location.host : '';
        if (host && parsed.host === host) return false;
        return true;
    }
    catch {
        return false;
    }
};

const getImageSrc = (src?: string) => {
    if (!src) return src;
    if (!shouldProxyImage(src)) return src;
    const base = getEndpointUrl();
    return `${base}/links/image?url=${encodeURIComponent(src)}`;
};

const extractPostId = (url: string): number | null => {
    try {
        const parsed = new URL(url);
        const host = typeof window !== 'undefined' ? window.location.host : '';
        if (host && parsed.host && parsed.host !== host) return null;
        const match = parsed.pathname.match(/\/post\/(\d+)/);
        if (!match) return null;
        return Number(match[1]);
    }
    catch {
        return null;
    }
};

const PostLinkEmbed: React.FC<{ postId: number }> = ({ postId }) => {
    const { data: post, isLoading } = usePostQuery(postId);

    if (isLoading) {
        return (
            <div className='rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-xs text-zinc-500'>
                Loading preview…
            </div>
        );
    }

    if (!post) return null;

    const image = getImagePath(post.images?.[0]);
    const link = `/post/${postId}`;

    return (
        <Link
            to={link}
            className='block rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-600 transition-colors overflow-hidden'
        >
            <div className='flex gap-3 p-3'>
                {image && (
                    <img
                        src={image}
                        alt={post.title}
                        className='w-20 h-20 object-cover rounded-md border border-zinc-200 dark:border-zinc-700'
                    />
                )}
                <div className='min-w-0 flex-1'>
                    <div className='flex items-center gap-2 mb-1'>
                        <span className='text-xs font-semibold uppercase text-zinc-500 dark:text-zinc-400'>
                            {post.type}
                        </span>
                    </div>
                    <div className='text-sm font-semibold text-zinc-900 dark:text-zinc-100 line-clamp-1'>
                        {post.title}
                    </div>
                    {post.body && (
                        <div className='text-xs text-zinc-600 dark:text-zinc-300 line-clamp-2 mt-0.5'>
                            {post.body}
                        </div>
                    )}
                </div>
            </div>
        </Link>
    );
};

const ExternalLinkEmbed: React.FC<{ url: string }> = ({ url }) => {
    const { data } = useQuery({
        queryKey: ['link-preview', url],
        queryFn: () => fetchLinkPreview(url),
        staleTime: 5 * 60 * 1000,
        retry: 1
    });

    if (!data) return null;

    const title =
        data.title ||
        (data as any).text ||
        (data as any).name ||
        (data as any).headline ||
        '';
    const description =
        data.description || (data as any).summary || (data as any).excerpt || '';
    const image = getImageSrc(data.image || data.images?.[0]);
    const siteName =
        data.siteName ||
        data.provider ||
        (() => {
            try {
                return new URL(url).hostname;
            }
            catch {
                return '';
            }
        })();

    if (!title && !description && !image) return null;

    return (
        <a
            href={url}
            target='_blank'
            rel='noreferrer'
            className='block rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-600 transition-colors overflow-hidden'
        >
            <div className='flex gap-3 p-3'>
                {image && (
                    <img
                        src={image}
                        alt={title || siteName || 'Link preview'}
                        className='w-20 h-20 object-cover rounded-md border border-zinc-200 dark:border-zinc-700'
                    />
                )}
                <div className='min-w-0 flex-1'>
                    {siteName && (
                        <div className='text-[11px] uppercase tracking-wide text-zinc-500 dark:text-zinc-400 mb-1'>
                            {siteName}
                        </div>
                    )}
                    {title && (
                        <div className='text-sm font-semibold text-zinc-900 dark:text-zinc-100 line-clamp-2'>
                            {title}
                        </div>
                    )}
                    {description && (
                        <div className='text-xs text-zinc-600 dark:text-zinc-300 line-clamp-2 mt-0.5'>
                            {description}
                        </div>
                    )}
                </div>
            </div>
        </a>
    );
};

const RichEmbeds: React.FC<RichEmbedsProps> = ({
    text,
    maxEmbeds = 2,
    className = ''
}) => {
    const urls = useMemo(() => {
        const matches = detectUrls(text || '').map((m) => m.url);
        const unique = Array.from(new Set(matches));
        return unique.slice(0, maxEmbeds);
    }, [text, maxEmbeds]);

    if (!urls.length) return null;

    return (
        <div className={`mt-2 space-y-2 ${className}`.trim()}>
            {urls.map((url) => {
                const postId = extractPostId(url);
                if (postId) {
                    return <PostLinkEmbed key={`post-${postId}`} postId={postId} />;
                }

                return <ExternalLinkEmbed key={url} url={url} />;
            })}
        </div>
    );
};

export default RichEmbeds;
