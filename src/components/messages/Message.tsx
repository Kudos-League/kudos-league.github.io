import React from 'react';
import { MessageDTO } from '@/shared/api/types';
import UserCard from '@/components/users/UserCard';

interface Props {
    message: MessageDTO;
}

const Message: React.FC<Props> = ({ message }) => {
    return (
        <div className='flex mb-4 p-3 bg-gray-100 rounded-lg'>
            <div className='mr-3'>
                <UserCard
                    userID={message.author?.id}
                    username={message.author?.username}
                    avatar={message.author?.avatar}
                    kudos={message.author?.kudos}
                    createdAt={message.createdAt}
                    large={false}
                />
            </div>
            <div className='flex-1'>
                <p className='mt-1 text-sm text-gray-800'>{message.content}</p>
            </div>
        </div>
    );
};

export default Message;
