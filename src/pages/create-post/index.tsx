import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';

import Login from '@/components/login/LoginForm';
import CreatePost from '@/components/posts/CreatePost';

export default function CreatePostPage() {
    const [showLoginForm, setShowLoginForm] = useState(false);
    const [searchParams] = useSearchParams();
    const repostId = searchParams.get('repostId') ? parseInt(searchParams.get('repostId')!) : undefined;

    if (showLoginForm) {
        return <Login onSuccess={() => setShowLoginForm(false)} />;
    }

    return <CreatePost setShowLoginForm={setShowLoginForm} repostId={repostId} />;
}
