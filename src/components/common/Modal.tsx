import React, { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';

type ModalProps = {
    open: boolean;
    onClose: () => void;
    title?: string;
    children: React.ReactNode;
    maxWidth?: string;
};

export default function Modal({
    open,
    onClose,
    title,
    children,
    maxWidth = 'sm:max-w-lg'
}: ModalProps) {
    return (
        <Transition.Root show={open} as={Fragment}>
            <Dialog as='div' className='relative z-50' onClose={onClose}>
                {/* Backdrop */}
                <Transition.Child
                    as={Fragment}
                    enter='ease-out duration-300'
                    enterFrom='opacity-0'
                    enterTo='opacity-100'
                    leave='ease-in duration-200'
                    leaveFrom='opacity-100'
                    leaveTo='opacity-0'
                >
                    <div className='fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity' />
                </Transition.Child>

                {/* Panel */}
                <div className='fixed inset-0 z-50 flex items-center justify-center p-4'>
                    <Transition.Child
                        as={Fragment}
                        enter='ease-out duration-300'
                        enterFrom='opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95'
                        enterTo='opacity-100 translate-y-0 sm:scale-100'
                        leave='ease-in duration-200'
                        leaveFrom='opacity-100 translate-y-0 sm:scale-100'
                        leaveTo='opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95'
                    >
                        <Dialog.Panel
                            className={`relative w-full ${maxWidth} transform overflow-hidden rounded-xl bg-white dark:bg-zinc-900 p-6 shadow-xl transition-all`}
                        >
                            {/* Close button */}
                            <button
                                type='button'
                                onClick={onClose}
                                className='absolute right-4 top-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
                            >
                                <XMarkIcon className='h-6 w-6' />
                            </button>

                            {title && (
                                <Dialog.Title className='text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4'>
                                    {title}
                                </Dialog.Title>
                            )}

                            {children}
                        </Dialog.Panel>
                    </Transition.Child>
                </div>
            </Dialog>
        </Transition.Root>
    );
}
