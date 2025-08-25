import Button from '@/components/common/Button';
import React from 'react';

const PageHeader: React.FC<{ onBack: () => void }> = ({ onBack }) => (
    <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-white/10">
        <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Account Settings</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">Update your profile and preferences.</p>
        </div>
        <Button variant="secondary" onClick={onBack}>
			← Back
        </Button>
    </div>
);

export default PageHeader;