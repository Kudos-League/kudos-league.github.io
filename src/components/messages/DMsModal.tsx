import React, { Fragment } from 'react';
import { Dialog, DialogPanel, DialogBackdrop, TransitionChild } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import Chat from './Chat';
import { useDMs } from '@/contexts/DMsContext';

interface DMsModalProps {
    open: boolean;
    onClose: () => void;
}

export default function DMsModal({ open, onClose }: DMsModalProps) {
    const { selectedUserId } = useDMs();
    // Define the custom width, now using a larger value (e.g., 40rem or 640px)
    // You can adjust this 'lg:w-[40rem]' value as needed.
    const customWidth = 'lg:w-[50rem]'; 

    return (
        // The 'Dialog' component is kept to manage state and focus, but we're removing the visible backdrop.
        <Dialog open={open} onClose={onClose} className='relative z-50'>
            
            {/* Backdrop: TransitionChild and DialogBackdrop are REMOVED entirely 
                to prevent the main screen from dimming/blocking clicks. */}
            
            {/* Modal Panel Container: Positions the panel to the bottom-right corner on large screens */}
            {/* We maintain the fixed positioning and padding for the bottom-right placement. */}
            <div className='fixed inset-0 lg:p-6 lg:flex lg:items-end lg:justify-end'>
                <TransitionChild
                    as={Fragment}
                    enter='transform transition ease-in-out duration-300'
                    // Mobile: Slide up from bottom
                    // Large: Fade in and grow from bottom right
                    enterFrom='translate-y-full lg:translate-y-0 lg:opacity-0 lg:scale-90'
                    enterTo='translate-y-0 lg:opacity-100 lg:scale-100'
                    // Mobile: Slide down
                    // Large: Fade out and shrink
                    leave='transform transition ease-in-out duration-300'
                    leaveFrom='translate-y-0 lg:opacity-100 lg:scale-100'
                    leaveTo='translate-y-full lg:translate-y-0 lg:opacity-0 lg:scale-90'
                >
                    <DialogPanel 
                        className={`relative w-full h-[100dvh] 
                                    lg:h-[70vh] ${customWidth} lg:max-w-none 
                                    lg:rounded-xl lg:shadow-2xl 
                                    bg-white dark:bg-zinc-900 flex flex-col overflow-hidden`}>
                        
                        {/* Header with close button */}
                        <div className='flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex-shrink-0'>
                            <h2 className='text-lg font-semibold text-gray-900 dark:text-zinc-100'>
                                Messages
                            </h2>
                            <button
                                onClick={onClose}
                                className='p-2 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg transition-colors'
                                aria-label='Close messages'
                            >
                                <XMarkIcon className='h-6 w-6 text-gray-600 dark:text-zinc-400' />
                            </button>
                        </div>

                        {/* Chat content */}
                        <div className='flex-1 min-h-0 overflow-hidden'>
                            <Chat channelType='dm' initialUserId={selectedUserId ?? undefined} />
                        </div>
                    </DialogPanel>
                </TransitionChild>
            </div>
        </Dialog>
    );

}
