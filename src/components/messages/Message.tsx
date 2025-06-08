import React from 'react';
import { MessageDTO } from '@/shared/api/types';
import { useAuth } from '@/hooks/useAuth';
import { getUserKudos } from '@/shared/api/actions';
import UserCard from '@/components/users/UserCard';

interface Props {
    message: MessageDTO;
}

const Message: React.FC<Props> = ({ message }) => {
    const { token } = useAuth();
    const [kudos, setKudos] = React.useState<number>(message.author?.kudos || 0);

    React.useEffect(() => {
        const fetchKudos = async () => {
            if (!message?.authorID) return;
            try {
                const totalKudos = await getUserKudos(message.authorID, token);
                setKudos(totalKudos);
            }
            catch (error) {
                console.error('Failed to fetch user kudos:', error);
            }
        };

        fetchKudos();
    }, [message?.authorID]);

    return (
        <div className='flex mb-4 p-3 bg-gray-100 rounded-lg'>
            <div className='mr-3'>
                <UserCard
                    userID={message.author?.id}
                    username={message.author?.username}
                    avatar={message.author?.avatar}
                    kudos={kudos}
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
