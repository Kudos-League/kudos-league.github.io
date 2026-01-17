import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { usePostQuery } from '@/shared/api/queries/posts';
import { useQueryClient } from '@tanstack/react-query';
import PostDetails from '@/components/posts/PostDetails';
import { useNotifications } from '@/contexts/NotificationsContext';

import type { PostDTO } from '@/shared/api/types';

const Post = () => {
    const { id } = useParams<{ id: string }>();
    const { state: notificationsState, markActed } = useNotifications();
    const qc = useQueryClient();

    const { data: postDetails, isLoading: loading, error: queryError, refetch } = usePostQuery(
        id ? Number(id) : undefined
    );
    const error = queryError ? 'Failed to load post details. Please try again.' : null;
    const [liked, setLiked] = useState<boolean | null>(null);

    // Extract like status from post data
    useEffect(() => {
        if (postDetails) {
            const userLike = (postDetails as any).likes?.[0]?.like ?? null;
            setLiked(userLike);
        }
    }, [postDetails]);

    const setPostDetails = (updated: PostDTO) => {
        qc.setQueryData(['post', Number(id)], updated);
    };

    const fetchPostDetails = async () => {
        await refetch();
    };

    // Mark post-reply notifications for this post as acted upon
    useEffect(() => {
        if (!id || !postDetails) return;

        const postID = Number(id);
        const postReplyNotifications = notificationsState.items.filter(
            (n) =>
                n.type === 'post-reply' &&
                'postID' in n &&
                n.postID === postID &&
                !n.isActedOn
        );

        // Mark all post-reply notifications for this post as acted upon
        postReplyNotifications.forEach((notification) => {
            markActed(notification.id).catch((err) => {
                console.error(
                    'Failed to mark post-reply notification as acted:',
                    err
                );
            });
        });
    }, [id, postDetails, notificationsState.items, markActed]);

    return (
        <PostDetails
            id={id}
            post={postDetails ?? null}
            loading={loading}
            error={error}
            setPostDetails={setPostDetails}
            liked={liked}
            setLiked={setLiked}
            fetchPostDetails={fetchPostDetails}
        />
    );
};

export default Post;
