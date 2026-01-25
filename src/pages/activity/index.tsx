import React from 'react';
import Activity from '@/components/Activity';
import { useAuth } from '@/contexts/useAuth';

export default function MyActivity() {
    const { user } = useAuth();
    return <Activity user={user} />;
}
