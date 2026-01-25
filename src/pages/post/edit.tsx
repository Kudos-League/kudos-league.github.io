import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { usePostQuery } from '@/shared/api/queries/posts';
import { useQueryClient } from '@tanstack/react-query';
import PostEditForm from '@/components/posts/PostEditForm';

import type { PostDTO } from '@/shared/api/types';

const EditPost = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const qc = useQueryClient();

    const { data: postDetails, isLoading: loading, error: queryError, refetch } = usePostQuery(
        id ? Number(id) : undefined
    );
    const error = queryError ? 'Failed to load post details. Please try again.' : null;

    const setPostDetails = (updated: PostDTO) => {
        qc.setQueryData(['post', Number(id)], updated);
    };

    const fetchPostDetails = async () => {
        await refetch();
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
