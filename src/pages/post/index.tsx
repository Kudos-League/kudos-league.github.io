import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useAppSelector } from 'redux_store/hooks';

import { getPostDetails } from '@/shared/api/actions';
import PostDetails from '@/components/posts/PostDetails';

import type { PostDTO } from '@/shared/api/types';

const Post = () => {
    const { id } = useParams<{ id: string }>();
    const token = useAppSelector((state) => state.auth.token);

    const [postDetails, setPostDetails] = useState<PostDTO | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [liked, setLiked] = useState<boolean | null>(null);

    const fetchPostDetails = async (postID: number) => {
        if (!token) {
            setError('No token found. Please log in.');
            setLoading(false);
            return;
        }

        try {
            const data = await getPostDetails(token, postID);
            setPostDetails(data);
            const userLike = data.likes?.[0]?.like ?? null;
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

    return <PostDetails
        id={id}
        post={postDetails}
        loading={loading}
        error={error}
        setPostDetails={setPostDetails}
        liked={liked}
        setLiked={setLiked}
        fetchPostDetails={fetchPostDetails}
    />;
};

export default Post;
