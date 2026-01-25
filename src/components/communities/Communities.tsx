import React from 'react';

const Communities: React.FC = () => {
    return (
        /* h-dvh: Uses Dynamic Viewport Height to account for mobile toolbars.
           overflow-hidden: Prevents any accidental scrolling.
           fixed/inset-0: Ensures the container locks to the viewport edges.
        */
        <div className='fixed inset-0 flex items-center justify-center h-dvh w-screen overflow-hidden bg-gray-100 dark:bg-zinc-900'>
            <h1 className='text-3xl font-bold text-center px-6 text-gray-800 dark:text-gray-200'>
                Communities Page - Coming Soon!
            </h1>
        </div>
    );
};

export default Communities;
