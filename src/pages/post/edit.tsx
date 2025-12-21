import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiGet } from '@/shared/api/apiClient';
import PostEditForm from '@/components/posts/PostEditForm';

import type { PostDTO } from '@/shared/api/types';

const EditPost = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const [postDetails, setPostDetails] = useState<PostDTO | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (id) {
            fetchPostDetails(Number(id));
        }
    }, [id]);

    const fetchPostDetails = async (postID: number) => {
        try {
            const data = await apiGet<PostDTO>(`/posts/${postID}`);
            setPostDetails(data);
            setLoading(false);
        }
        catch (err) {
            console.error(err);
            setError('Failed to load post details. Please try again.');
            setLoading(false);
        }
    };

    if (loading) {
        return <div className='text-center mt-20 text-lg'>Loading post...</div>;
    }

    if (error) {
        return (
            <div className='text-center mt-20 text-red-500'>
                <p>{error}</p>
                <button
                    onClick={() => navigate(-1)}
                    className='mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600'
                >
                    Go Back
                </button>
            </div>
        );
    }

    if (!postDetails) {
        return <div className='text-center mt-20 text-lg'>Post not found</div>;
    }

    return (
        <PostEditForm
            post={postDetails}
            setPostDetails={setPostDetails}
            fetchPostDetails={fetchPostDetails}
        />
    );
};

export default EditPost;
