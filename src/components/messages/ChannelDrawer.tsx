import React from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import Drawer from '@/components/common/Drawer';
import { DialogTitle } from '@headlessui/react';
import { ChannelDTO } from '@/shared/api/types';
import UserCard from '../users/UserCard';
import { useAuth } from '@/contexts/useAuth';

type Props = {
    open: boolean;
    onClose: (v: boolean) => void;
    channels: ChannelDTO[];
    onSelect: (c: ChannelDTO) => void;
    isDMView: boolean;
};

export default function ChannelDrawer({ open, onClose, channels, onSelect, isDMView }: Props) {
    const { user } = useAuth();
    return (
        <Drawer open={open} onClose={onClose} maxWidth='max-w-md'>
            <div className='relative flex h-full flex-col overflow-y-auto bg-white py-6 shadow-xl dark:bg-gray-800'>
                <div className='px-4 sm:px-6'>
                    <div className='flex items-start justify-between'>
                        <DialogTitle className='text-base font-semibold text-gray-900 dark:text-white'>
                            {isDMView ? 'Direct messages' : 'Channels'}
                        </DialogTitle>
                        <div className='ml-3 flex h-7 items-center'>
                            <button
                                type='button'
                                onClick={() => onClose(false)}
                                className='relative rounded-md text-gray-400 hover:text-gray-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 dark:hover:text-white dark:focus-visible:outline-indigo-500'
                            >
                                <span className='absolute -inset-2.5' />
                                <span className='sr-only'>Close panel</span>
                                <XMarkIcon aria-hidden='true' className='size-6' />
                            </button>
                        </div>
                    </div>
                </div>

                <div className='relative mt-6 flex-1 px-4 sm:px-6'>
                    <ul className='space-y-2'>
                        {channels.map((c) => {
                            const otherUser =
                                (c as any).otherUser ||
                                (c.users ? c.users.find((u: any) => u.id !== user?.id) : null) ||
                                (c.users ? c.users[0] : null);

                            return (
                                <li key={c.id}>
                                    <button
                                        onClick={() => {
                                            onSelect(c);
                                            onClose(false);
                                        }}
                                        className='w-full text-left px-3 py-2 rounded hover:bg-gray-100 dark:hover:bg-zinc-700'
                                    >
                                        <div className='text-sm font-medium text-gray-900 dark:text-white'>
                                            {isDMView ? (
                                                <UserCard user={otherUser} />
                                            ) : (
                                                c.name
                                            )}
                                        </div>
                                        {isDMView ? (
                                            <div className='text-xs text-zinc-500 dark:text-zinc-400'>@{otherUser?.username}</div>
                                        ) : (
                                            <div className='text-xs text-zinc-500 dark:text-zinc-400'>Public channel</div>
                                        )}
                                    </button>
                                </li>
                            );
                        })}
                    </ul>
                </div>
            </div>
        </Drawer>
    );
}
