import React from 'react';
import { MessageDTO } from '@/shared/api/types';
import AvatarComponent from '../Avatar';

interface Props {
    message: MessageDTO;
}

const Message: React.FC<Props> = ({ message }) => {
    return (
        <div className='flex mb-4 p-3 bg-gray-100 rounded-lg'>
            {message.author?.avatar && (
                <div
                    style={{
                        width: 50,
                        height: 50,
                        borderRadius: '50%',
                        marginRight: 10,
                        overflow: 'hidden',
                        flexShrink: 0
                    }}
                >
                    <AvatarComponent
                        username={message.author.username || 'Anonymous'}
                        avatar={message.author.avatar}
                        size={50}
                    />
                </div>
            )}

            <div className='flex-1 ml-3'>
                <div className='flex justify-between text-sm text-gray-700 font-semibold'>
                    <span>{message.author?.username}</span>
                    <span className='text-xs text-gray-400'>
                        {new Date(message.createdAt).toLocaleString()}
                    </span>
                </div>

                <div className='text-xs text-gray-500'>
                    Kudos: {message.author?.kudos}
                </div>
                <p className='mt-1 text-sm text-gray-800'>{message.content}</p>
            </div>
        </div>
    );
};

export default Message;
