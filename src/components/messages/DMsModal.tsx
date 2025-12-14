import React, { Fragment } from 'react';
import { Dialog, DialogPanel, DialogBackdrop, TransitionChild } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import Chat from './Chat';

interface DMsModalProps {
    open: boolean;
    onClose: () => void;
}

export default function DMsModal({ open, onClose }: DMsModalProps) {
    return (
        <Dialog open={open} onClose={onClose} className='relative z-50'>
            {/* Backdrop */}
            <TransitionChild
                as={Fragment}
                enter='transition-opacity ease-linear duration-300'
                enterFrom='opacity-0'
                enterTo='opacity-100'
                leave='transition-opacity ease-linear duration-200'
                leaveFrom='opacity-100'
                leaveTo='opacity-0'
            >
                <DialogBackdrop className='fixed inset-0 bg-black/50' />
            </TransitionChild>

            {/* Modal Panel */}
            <div className='fixed inset-0 flex items-center justify-center p-0 lg:p-4'>
                <TransitionChild
                    as={Fragment}
                    enter='transform transition ease-in-out duration-300'
                    enterFrom='translate-y-full lg:translate-y-0 lg:opacity-0 lg:scale-95'
                    enterTo='translate-y-0 lg:opacity-100 lg:scale-100'
                    leave='transform transition ease-in-out duration-300'
                    leaveFrom='translate-y-0 lg:opacity-100 lg:scale-100'
                    leaveTo='translate-y-full lg:translate-y-0 lg:opacity-0 lg:scale-95'
                >
                    <DialogPanel className='relative w-full h-[100dvh] lg:h-[90vh] lg:max-w-6xl lg:rounded-xl bg-white dark:bg-zinc-900 shadow-xl flex flex-col overflow-hidden'>
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
                            <Chat channelType='dm' />
                        </div>
                    </DialogPanel>
                </TransitionChild>
            </div>
        </Dialog>
    );
}
