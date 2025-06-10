import React from 'react';
import { useNavigate } from 'react-router-dom';
import AvatarComponent from '@/components/users/Avatar';

interface UserCardProps {
    userID?: number;
    username: string | null;
    avatar: string | null | undefined;
    kudos?: number;
    createdAt?: Date;
    large?: boolean;
}

const UserCard: React.FC<UserCardProps> = ({
    userID,
    username,
    avatar,
    kudos,
    createdAt,
    large = false
}) => {
    const navigate = useNavigate();

    const goToProfile = (e?: React.MouseEvent) => {
        e?.stopPropagation();
        if (userID) navigate(`/user/${userID}`);
    };

    if (large) {
        return (
            <div className='flex items-center gap-4'>
                <div onClick={goToProfile} className='cursor-pointer'>
                    <AvatarComponent
                        username={username || 'Anonymous'}
                        avatar={avatar}
                        size={50}
                        onClick={goToProfile}
                    />
                </div>
                <div>
                    <h2
                        className='font-bold text-lg cursor-pointer hover:underline'
                        onClick={goToProfile}
                    >
                        {username || 'Anonymous'}
                    </h2>
                    {typeof kudos === 'number' && (
                        <p className='text-sm text-gray-500'>Kudos: {kudos}</p>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className='flex items-center gap-3 text-sm'>
            <div onClick={goToProfile} className='cursor-pointer'>
                <AvatarComponent
                    username={username || 'Anonymous'}
                    avatar={avatar}
                    size={32}
                />
            </div>
            <div className='flex flex-col'>
                <span
                    className='font-semibold cursor-pointer hover:underline'
                    onClick={goToProfile}
                >
                    {username || 'Anonymous'}
                </span>
                {typeof kudos === 'number' && (
                    <span className='text-gray-500 text-xs'>Kudos: {kudos}</span>
                )}
                {createdAt && (
                    <span className='text-gray-400 text-xs'>
                        {createdAt.toLocaleString()}
                    </span>
                )}
            </div>
        </div>
    );
};

export default UserCard;
