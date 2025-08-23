import React from 'react';
import PostCard from './PostCard';
import Alert from '../common/Alert';
import type { PostDTO } from '@/shared/api/types';
import SlideInOnScroll from '@/components/common/SlideInOnScroll';

export default function PostsContainer({ posts, showHandshakeShortcut }: { posts: PostDTO[]; showHandshakeShortcut?: boolean }) {
    if (!posts || posts.length === 0) {
        return <Alert type='danger' message='No posts found.' />;
    }

    return (
        <div className='space-y-6'>
            {posts.map((post, index) => (
                <SlideInOnScroll key={post.id} delayStep={index * 0.05}>
                    <PostCard {...post} showHandshakeShortcut={showHandshakeShortcut} />
                </SlideInOnScroll>
            ))}
        </div>
    );
}