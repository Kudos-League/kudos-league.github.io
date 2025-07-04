import React from 'react';
import Tippy from '@tippyjs/react';

import { useAuth } from '@/hooks/useAuth';
import MapDisplay from '@/components/Map';
import AvatarComponent from '@/components/users/Avatar';
import { UserDTO } from '@/shared/api/types';
import { getImagePath } from '@/shared/api/config';
import Pill from '../common/Pill';

interface Props {
    user: UserDTO;
    userSettings?: { about?: string };
    onEditProfile?: () => void;
    onStartDM?: () => void;
    isSelf: boolean;
}

const ProfileHeader: React.FC<Props> = ({
    user,
    userSettings,
    onEditProfile,
    onStartDM,
    isSelf
}) => {
    const { isLoggedIn } = useAuth();

    const getUserTitle = () => {
        if (user.kudos > 10000) return 'Questing Knight';
        if (user.kudos > 5000) return 'Pro';
        return 'Novice';
    };

    return (
        <div className='text-center px-6 pt-6 pb-8 bg-white shadow rounded'>
            <div className='flex justify-center mb-4'>
                <div
                    style={{
                        width: 80,
                        height: 80,
                        borderRadius: '50%',
                        overflow: 'hidden'
                    }}
                >
                    <AvatarComponent
                        avatar={user.avatar}
                        username={user.username}
                        size={80}
                    />
                </div>
            </div>
            <p className='text-gray-500 text-sm'>{getUserTitle()}</p>
            <h1 className='text-2xl font-bold'>{user.username}</h1>
            <p className='text-gray-600 text-sm'>
                {user.kudos || 0} Kudos
            </p>

            {user.badges?.length ? (
                <div className='flex justify-center flex-wrap gap-2 mt-4'>
                    {user.badges.map((badge, i) => (
                        <Tippy content={badge.name} key={i}>
                            <img
                                src={getImagePath(badge.image)}
                                alt={badge.name}
                                className='w-10 h-10 rounded-full border'
                            />
                        </Tippy>
                    ))}
                </div>
            ) : null}

            <div className='flex justify-center gap-4 mt-6'>
                {isLoggedIn && !isSelf && (
                    <button
                        onClick={onStartDM}
                        className='px-4 py-2 rounded bg-blue-100 hover:bg-blue-200'
                    >
                        💬 Message
                    </button>
                )}
                {isSelf && (
                    <button
                        onClick={onEditProfile}
                        className='px-4 py-2 rounded bg-gray-200 hover:bg-gray-300'
                    >
                        ⚙️ Edit
                    </button>
                )}
            </div>

            {user.tags && user.tags.length > 0 && (
                <div className='mt-4 flex flex-wrap justify-center gap-2'>
                    {user.tags.map((tag, i) => (
                        <Pill key={i} name={tag.name} />
                    ))}
                </div>
            )}

            <p className='mt-6 text-gray-700 text-sm italic'>
                {userSettings?.about || 'No bio available'}
            </p>

            {user.location?.regionID && (
                <div className='mt-6'>
                    <h3 className='text-sm font-semibold mb-1 text-gray-600'>
                        Location
                    </h3>
                    <div className='flex justify-center'>
                        <MapDisplay
                            regionID={user.location.regionID}
                            showAddressBar={false}
                            exactLocation={true}
                            width={400}
                            height={200}
                        />
                    </div>
                </div>
            )}

            {user.tags && user.tags.length > 0 && (
                <div className='mt-4 flex flex-wrap justify-center gap-2'>
                    {user.tags.map((tag, i) => (
                        <span
                            key={i}
                            className='px-3 py-1 bg-green-100 text-green-700 text-sm rounded-full'
                        >
                            {tag.name}
                        </span>
                    ))}
                </div>
            )}
        </div>
    );
};

export default ProfileHeader;
