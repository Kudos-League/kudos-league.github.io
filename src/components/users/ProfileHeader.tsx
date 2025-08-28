import React from 'react';
import Tippy from '@tippyjs/react';

import { useAuth } from '@/hooks/useAuth';
import MapDisplay from '@/components/Map';
import AvatarComponent from '@/components/users/Avatar';
import { UserDTO } from '@/shared/api/types';
import { getImagePath } from '@/shared/api/config';
import Pill from '../common/Pill';
import Button from '../common/Button';

interface Props {
    user: UserDTO;
    userSettings?: { about?: string };
    onEditProfile?: () => void;
    onStartDM?: () => void;
    isSelf: boolean;
}

const ProfileHeader: React.FC<Props> = ({
    user: targetUser,
    userSettings,
    onEditProfile,
    onStartDM,
    isSelf
}) => {
    const { isLoggedIn } = useAuth();

    const getUserTitle = () => {
        if (targetUser.kudos > 10000) return 'Questing Knight';
        if (targetUser.kudos > 5000) return 'Pro';
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
                        avatar={targetUser.avatar}
                        username={targetUser.username}
                        size={80}
                    />
                </div>
            </div>
            <p className='text-gray-500 text-sm'>{getUserTitle()}</p>
            <h1 className='text-2xl font-bold'>{targetUser.username}</h1>
            <p className='text-gray-600 text-sm'>
                {targetUser.kudos || 0} Kudos
            </p>

            {targetUser.badges?.length ? (
                <div className='flex justify-center flex-wrap gap-2 mt-4'>
                    {targetUser.badges.map((badge, i) => (
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
                    <Button onClick={onStartDM} variant='secondary'>
                        💬 Message
                    </Button>
                )}
                {isSelf && (
                    <Button data-testid="edit-profile" onClick={onEditProfile} variant='secondary'>
                        ⚙️ Edit
                    </Button>
                )}
            </div>

            {targetUser.tags && targetUser.tags.length > 0 && (
                <div className='mt-6 flex flex-wrap justify-center gap-2'>
                    {targetUser.tags.map((tag, i) => (
                        <Pill key={i} name={tag.name} />
                    ))}
                </div>
            )}

            <p className='mt-6 text-gray-700 text-sm italic'>
                {userSettings?.about || 'No bio available'}
            </p>

            {/* Location Box */}
            <div className='mt-6'>
                <div className='bg-gray-50 border border-gray-200 rounded-lg p-4 max-w-md mx-auto'>
                    <h3 className='text-sm font-semibold mb-3 text-gray-700 text-left'>
                        Location
                    </h3>
                    {targetUser.location?.regionID ? (
                        <div className='flex justify-center'>
                            <MapDisplay
                                regionID={targetUser.location.regionID}
                                showAddressBar={false}
                                exactLocation={isSelf}
                                width='100%'
                                height={200}
                            />
                        </div>
                    ) : (
                        <p className='text-gray-500 text-sm text-left'>
                            Location: not submitted
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ProfileHeader;
