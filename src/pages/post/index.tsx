import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { apiGet } from '@/shared/api/apiClient';
import PostDetails from '@/components/posts/PostDetails';
import { useNotifications } from '@/contexts/NotificationsContext';

import type { PostDTO } from '@/shared/api/types';

const Post = () => {
    const { id } = useParams<{ id: string }>();
    const { state: notificationsState, markActed } = useNotifications();

    const [postDetails, setPostDetails] = useState<PostDTO | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [liked, setLiked] = useState<boolean | null>(null);

    const fetchPostDetails = async (postID: number) => {
        try {
            const data = await apiGet<PostDTO>(`/posts/${postID}`);
            setPostDetails(data);
            const userLike = (data as any).likes?.[0]?.like ?? null;
            setLiked(userLike);
            setLoading(false);
        }
        catch (err) {
            console.error(err);
            setError('Failed to load post details. Please try again.');
            setLoading(false);
        }
    };

    useEffect(() => {
        if (id) fetchPostDetails(Number(id));
    }, [id]);

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
            post={postDetails}
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
