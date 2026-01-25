import React from 'react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiGet } from '@/shared/api/apiClient';
import { PostDTO } from '@/shared/api/types';
import MinimalPostCard from '@/components/posts/MinimalPostCard';
import MinimalHandshakeCard from '@/components/handshakes/MinimalHandshakeCard';

// Expandable Post with Handshakes
function ExpandablePost({ post }: { post: PostDTO }) {
    const [isExpanded, setIsExpanded] = useState(false);
    const activeHandshakes =
        post.handshakes?.filter((h) => h.status !== 'cancelled') || [];

    return (
        <div className='space-y-0'>
            <MinimalPostCard
                post={post}
                hasHandshakes={activeHandshakes.length > 0}
                isExpanded={isExpanded}
                onExpandHandshakes={() => setIsExpanded(!isExpanded)}
            />
            {isExpanded && activeHandshakes.length > 0 && (
                <div className='ml-10 space-y-0.5 mt-0.5'>
                    {activeHandshakes.map((handshake) => (
                        <MinimalHandshakeCard
                            key={handshake.id}
                            handshake={handshake}
                            post={post}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

export default function ComponentPreviewPage() {
    const navigate = useNavigate();
    const [posts, setPosts] = useState<PostDTO[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchPosts = async () => {
            try {
                setLoading(true);
                const postIds = [317, 316, 315, 314, 324, 323, 322];
                const results = await Promise.all(
                    postIds.map((id) =>
                        apiGet<PostDTO>(`/posts/${id}`).catch(() => null)
                    )
                );
                setPosts(results.filter((p): p is PostDTO => p !== null));
            }
            catch (err) {
                console.error('Failed to fetch posts:', err);
                setError('Failed to load posts');
            }
            finally {
                setLoading(false);
            }
        };

        fetchPosts();
    }, []);

    return (
        <div className='min-h-screen bg-white dark:bg-slate-900'>
            {/* Back button */}
            <div className='p-4'>
                <button
                    onClick={() => navigate(-1)}
                    className='px-3 py-1.5 text-sm bg-gray-200 dark:bg-slate-700 hover:bg-gray-300 dark:hover:bg-slate-600 text-gray-700 dark:text-gray-200 rounded transition-colors'
                >
                    Back
                </button>
            </div>

            {/* Clean render area */}
            <div id='component-playground' className='px-4 pb-4'>
                <h2 className='text-lg font-bold text-gray-800 dark:text-gray-100 mb-4'>
                    Old Reddit Style Posts with Expandable Handshakes
                </h2>

                {loading && (
                    <div className='flex items-center gap-2 text-gray-500 dark:text-gray-400'>
                        <div className='w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin' />
                        <span>Loading posts with handshakes...</span>
                    </div>
                )}

                {error && (
                    <div className='p-3 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded'>
                        {error}
                    </div>
                )}

                {!loading && !error && posts.length === 0 && (
                    <div className='text-gray-500 dark:text-gray-400'>
                        No posts with handshakes found
                    </div>
                )}

                {!loading && !error && posts.length > 0 && (
                    <div className='space-y-2'>
                        {posts.map((post) => (
                            <ExpandablePost key={post.id} post={post} />
                        ))}
                    </div>
                )}

                {/* Component info */}
                <div className='mt-8 p-4 bg-gray-50 dark:bg-slate-800 rounded-lg text-sm text-gray-600 dark:text-gray-400'>
                    <h3 className='font-semibold text-gray-800 dark:text-gray-200 mb-2'>
                        Features:
                    </h3>
                    <ul className='list-disc list-inside space-y-1'>
                        <li>Old Reddit-style horizontal layout with small thumbnails</li>
                        <li>Kudos score in left column (like Reddit upvotes)</li>
                        <li>Click arrow on right to expand/collapse handshakes</li>
                        <li>Minimal handshake cards show user, status, and time</li>
                    </ul>
                </div>
            </div>
        </div>
    );
}
