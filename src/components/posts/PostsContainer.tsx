import React from 'react';
import PostCard from './PostCard';
import Alert from '../common/Alert';
import type { PostDTO } from '@/shared/api/types';
import SlideInOnScroll from '@/components/common/SlideInOnScroll';

export default function PostsContainer({
    posts,
    showHandshakeShortcut
}: {
    posts: PostDTO[];
    showHandshakeShortcut?: boolean;
}) {
    if (!posts || posts.length === 0) {
        return <Alert type='info' message='No posts found.' />;
    }

    return (
        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6'>
            {posts.map((post, index) => (
                <SlideInOnScroll key={post.id} delayStep={index * 0.05}>
                    <PostCard
                        {...post}
                        showHandshakeShortcut={showHandshakeShortcut}
                    />
                </SlideInOnScroll>
            ))}
        </div>
    );
}
