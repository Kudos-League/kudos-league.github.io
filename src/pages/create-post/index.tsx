import React, { useState } from 'react';

import Login from '@/components/login/LoginForm';
import CreatePost from '@/components/posts/CreatePost';

export default function CreatePostPage() {
    const [showLoginForm, setShowLoginForm] = useState(false);

    if (showLoginForm) {
        return <Login onSuccess={() => setShowLoginForm(false)} />;
    }

    return <CreatePost setShowLoginForm={setShowLoginForm} />;
}
