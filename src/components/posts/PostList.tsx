import React from 'react';
import ActivityPostItem from './PostItem';
import { PostDTO } from '@/shared/api/types';
import { timeAgoLabel } from '@/shared/timeAgoLabel';
import SlideInOnScroll from '@/components/common/SlideInOnScroll';

export default function PostList({
    posts,
    showHandshakeShortcut = false,
}: {
  posts: PostDTO[];
  showHandshakeShortcut?: boolean;
}) {
    if (!posts?.length) return null;

    return (
        <ul role="list" className="space-y-6 relative">
            <div className="absolute left-0 top-0 h-3 w-6" />
            {posts.map((post, idx) => (
                <SlideInOnScroll key={post.id} index={idx} delayStep={70}>
                    <ActivityPostItem
                        post={post}
                        showHandshakeShortcut={showHandshakeShortcut}
                        rightTimeLabel={timeAgoLabel(post.createdAt)}
                        rightTimeDateTime={new Date(post.createdAt)?.toISOString()}
                    />
                </SlideInOnScroll>
            ))}
        </ul>
    );
}