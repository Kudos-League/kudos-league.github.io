import React, { useMemo, useState } from 'react';
import { useAuth } from '@/contexts/useAuth';
import { useBlockedUsers } from '@/contexts/useBlockedUsers';
import Tippy from '@tippyjs/react/headless';
import { useNavigate } from 'react-router-dom';
import {
    ShieldCheckIcon,
    ShieldExclamationIcon,
    ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

import AvatarComponent from '@/components/users/Avatar';
import { getImagePath } from '@/shared/api/config';
import Pill from '@/components/common/Pill';
import AdminReportModal from '@/components/admin/AdminReportModal';

import type { UserDTO } from '@/shared/api/types';

const DISCORD_ICON_SRC = '/images/discord.svg';
const GOOGLE_ICON_SRC = '/images/google.png';

const SocialBadgeIcon = ({
    src,
    alt,
    bg,
    label
}: {
    src?: string;
    alt: string;
    bg?: string;
    label?: string;
}) => {
    if (src) {
        return (
            <img
                src={src}
                alt={alt}
                title={alt}
                width={16}
                height={16}
                className='inline-block rounded-[3px] align-middle'
            />
        );
    }

    return (
        <span
            className='inline-flex items-center justify-center rounded-full text-[10px] font-bold text-white'
            style={{ width: 16, height: 16, backgroundColor: bg || '#6b7280' }}
            title={alt}
        >
            {label ?? ''}
        </span>
    );
};

type TriggerVariant = 'name' | 'avatar-name';

interface Props {
    user?: UserDTO;
    reportsThisMonth?: number;
    large?: boolean;
    triggerVariant?: TriggerVariant;
    className?: string;
    hoverDelayOpenMs?: number;
    hoverDelayCloseMs?: number;
    panelWidth?: number;
    sideOffset?: number;
    interactive?: boolean;
    triggerMode?: 'hover' | 'click' | 'focus' | 'hover+focus';
    subtitle?: React.ReactNode;
    centered?: boolean;
    nameClassName?: string;
    subtitleClassName?: string;
    disableTooltip?: boolean;
    onAdminReportOpen?: (userID: number) => void;
    showKudos?: boolean;
    compact?: boolean;
}

function fmtDate(d?: Date | string) {
    if (!d) return '';
    const date = typeof d === 'string' ? new Date(d) : d;
    if (Number.isNaN(date.getTime())) return '';
    return date.toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: '2-digit'
    });
}

const UserCard: React.FC<Props> = ({
    user,
    reportsThisMonth = 0,
    large = false,
    triggerVariant = 'avatar-name',
    className = '',
    hoverDelayOpenMs = 60,
    hoverDelayCloseMs = 120,
    panelWidth = 320,
    sideOffset = 10,
    interactive = true,
    triggerMode = 'hover+focus',
    subtitle,
    centered = false,
    nameClassName = '',
    subtitleClassName = '',
    disableTooltip = false,
    onAdminReportOpen,
    showKudos = false,
    compact = false
}) => {
    const navigate = useNavigate();
    const { user: currentUser } = useAuth();
    const [adminReportOpen, setAdminReportOpen] = useState(false);
    const {
        blockedUsers,
        loading: blockingLoading,
        block,
        unblock
    } = useBlockedUsers();

    // Detect mobile devices
    const isMobile = useMemo(() => {
        return (
            /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
                navigator.userAgent
            ) || window.innerWidth < 768
        );
    }, []);

    const username = user?.username;
    const displayName = user?.displayName || username || 'Anonymous';
    const kudos = typeof user?.kudos === 'number' ? user.kudos : 0;

    // 1. Define the handler that navigates to the profile
    const handleNavigate = (e: React.MouseEvent) => {
        // Prevent Tippy/other parent handlers from firing on this click
        e.stopPropagation();
        if (user?.id) {
            navigate(`/user/${user.id}`);
        }
    };

    const trigger = useMemo(() => {
        const baseNameClasses = [
            'font-semibold',
            large ? 'text-lg' : 'text-sm',
            'truncate',
            // REMOVE hover:underline and cursor-pointer here
            nameClassName
        ].join(' ');

        const nameEl = (
            <span
                className={baseNameClasses}
                title={
                    displayName
                        ? displayName
                        : username
                            ? username
                            : 'Anonymous'
                }
            >
                <span>{displayName}</span>
            </span>
        );

        const kudosEl =
            showKudos && !compact ? (
                <span className='text-xs text-gray-500 dark:text-gray-400 font-normal ml-2'>
                    {kudos} Kudos
                </span>
            ) : null;

        const wrapperClasses = [
            centered && subtitle
                ? 'group inline-flex flex-col items-center text-center gap-1'
                : 'group inline-flex items-center gap-2',
            // 3. APPLY overall cursor/hover styles to the wrapper
            'cursor-pointer',
            'hover:underline decoration-neutral-900 dark:decoration-neutral-100',
            // Ensure underline is only on text, not the avatar area
            centered && subtitle
                ? ''
                : 'group-hover:[&>div:last-child>div>span:first-child]:underline'
        ].join(' ');

        const avatar = (
            <div
                // REMOVE onClick here
                className='' // cursor-pointer is now on the wrapper
            >
                <AvatarComponent
                    username={displayName}
                    avatar={user?.avatar ? getImagePath(user.avatar) : null}
                    size={compact ? 24 : large ? 48 : 28}
                />
            </div>
        );

        const content = (
            <div
                className={
                    centered && subtitle
                        ? 'min-w-0 flex flex-col items-center'
                        : 'min-w-0'
                }
            >
                <div className={`flex flex-wrap items-center gap-x-0 ${compact ? "max-w-24" : ''}`}>
                    {nameEl}
                    {kudosEl}
                </div>
                {subtitle ? (
                    <div
                        className={[
                            'text-xs text-gray-500 dark:text-gray-400 truncate',
                            subtitleClassName
                        ].join(' ')}
                    >
                        {subtitle}
                    </div>
                ) : null}
            </div>
        );

        // Apply onClick handler to all trigger variants
        return (
            <div className={wrapperClasses} onClick={handleNavigate}>
                {triggerVariant === 'name' ? (
                    content
                ) : (
                    <>
                        {avatar}
                        {content}
                    </>
                )}
            </div>
        );
    }, [
        triggerVariant,
        large,
        compact,
        user?.id,
        user?.avatar,
        displayName,
        user?.username,
        handleNavigate, // Use the new handler
        subtitle,
        centered,
        nameClassName,
        subtitleClassName,
        showKudos,
        kudos
    ]);

    // useBlockedUsers handles fetching and state

    const tippyTrigger =
        triggerMode === 'hover'
            ? 'mouseenter'
            : triggerMode === 'click'
                ? 'click'
                : triggerMode === 'focus'
                    ? 'focus'
                    : 'mouseenter focus';

    if (disableTooltip || isMobile) {
        return (
            <div
                className={[
                    centered && subtitle
                        ? 'inline-flex flex-col items-center text-center gap-2'
                        : 'inline-flex items-center gap-2',
                    'text-neutral-900 dark:text-neutral-100',
                    className
                ].join(' ')}
                onClick={handleNavigate} // Apply handler for non-Tippy case
            >
                {trigger}
            </div>
        );
    }

    // The Tippy trigger wrapper still needs the padding/margin trick to expand
    // the *hover* area for the tooltip, but the click handling is now inside {trigger}.
    return (
        <>
            <Tippy
                placement='auto'
                offset={[0, sideOffset]}
                appendTo={() => document.body}
                interactive={interactive}
                delay={[hoverDelayOpenMs, hoverDelayCloseMs]}
                trigger={tippyTrigger}
                animation={false}
                duration={0}
                onMount={(inst) => {
                    const el = inst.popper
                        .firstElementChild as HTMLElement | null;
                    if (!el) return;
                    el.removeAttribute('data-open');
                    requestAnimationFrame(() =>
                        el.setAttribute('data-open', 'true')
                    );
                }}
                onHidden={(inst) => {
                    const el = inst.popper
                        .firstElementChild as HTMLElement | null;
                    if (!el) return;
                    el.removeAttribute('data-open');
                    return new Promise<void>((resolve) => {
                        const done = () => resolve();
                        el.addEventListener('transitionend', done, {
                            once: true
                        });
                        setTimeout(done, 250);
                    });
                }}
                render={(attrs) => (
                    <div
                        {...attrs}
                        tabIndex={-1}
                        className={[
                            'rounded-2xl shadow-2xl ring-1 ring-black/5',
                            'bg-white/90 dark:bg-neutral-900/90 backdrop-blur-md',
                            'p-3 w-[var(--card-w)] z-[1000] pointer-events-auto',
                            'opacity-0 scale-[0.99] transition-all duration-150',
                            "[data-placement^='top']:translate-y-2",
                            "[data-placement^='bottom']:-translate-y-2",
                            "data-[open='true']:opacity-100",
                            "data-[open='true']:scale-100",
                            "data-[open='true']:translate-y-0"
                        ].join(' ')}
                        style={
                            {
                                ['--card-w' as any]: `${panelWidth}px`
                            } as React.CSSProperties
                        }
                        onClick={(e) => e.stopPropagation()}
                    >
                        {user ? (
                            <div className='flex items-start gap-3'>
                                <AvatarComponent
                                    username={displayName}
                                    avatar={
                                        user.avatar
                                            ? getImagePath(user.avatar)
                                            : null
                                    }
                                    size={40}
                                />
                                <div className='min-w-0'>
                                    <div className='flex items-center gap-2'>
                                        <div className='flex items-center gap-2'>
                                            {/* Note: Profile link inside the card remains a separate button */}
                                            <button
                                                onClick={() =>
                                                    user.id &&
                                                    navigate(`/user/${user.id}`)
                                                }
                                                className='text-sm font-bold hover:underline truncate'
                                                title={
                                                    username ?? 'View profile'
                                                }
                                            >
                                                {displayName}
                                            </button>

                                            {currentUser?.admin && (
                                                <Tippy
                                                    placement='top'
                                                    delay={[100, 0]}
                                                    render={(attrs) => (
                                                        <div
                                                            {...attrs}
                                                            className='bg-black text-white text-xs rounded px-2 py-1'
                                                        >
                                                            Open admin report
                                                        </div>
                                                    )}
                                                >
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            e.preventDefault();
                                                            if (!user?.id)
                                                                return;
                                                            if (
                                                                onAdminReportOpen
                                                            ) {
                                                                onAdminReportOpen(
                                                                    user.id
                                                                );
                                                            }
                                                            else {
                                                                setAdminReportOpen(
                                                                    true
                                                                );
                                                            }
                                                        }}
                                                        title='Open admin report'
                                                        className='ml-1 p-1 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800'
                                                    >
                                                        <ExclamationTriangleIcon className='h-4 w-4 text-red-600' />
                                                    </button>
                                                </Tippy>
                                            )}

                                            {reportsThisMonth > 5 && (
                                                <Tippy
                                                    placement='top'
                                                    delay={[100, 0]}
                                                    render={(attrs) => (
                                                        <div
                                                            {...attrs}
                                                            className='bg-black text-white text-xs rounded px-2 py-1'
                                                        >
                                                            User has several
                                                            outstanding reports
                                                        </div>
                                                    )}
                                                >
                                                    <span
                                                        className='ml-1 inline-block'
                                                        title='User has several outstanding reports'
                                                    >
                                                        <span
                                                            style={{
                                                                display:
                                                                    'inline-block',
                                                                width: 0,
                                                                height: 0,
                                                                borderLeft:
                                                                    '6px solid transparent',
                                                                borderRight:
                                                                    '6px solid transparent',
                                                                borderBottom:
                                                                    '12px solid #ef4444'
                                                            }}
                                                        />
                                                    </span>
                                                </Tippy>
                                            )}

                                            {user.isEmailVerified ? (
                                                <Pill
                                                    tone='info'
                                                    size='sm'
                                                    leftIcon={
                                                        <ShieldCheckIcon className='h-4 w-4' />
                                                    }
                                                >
                                                    Verified
                                                </Pill>
                                            ) : (
                                                <Pill
                                                    tone='danger'
                                                    size='sm'
                                                    leftIcon={
                                                        <ShieldExclamationIcon className='h-4 w-4' />
                                                    }
                                                >
                                                    Not Verified
                                                </Pill>
                                            )}
                                            <div className='ml-1 inline-flex items-center gap-1'>
                                                {user.discordID ? (
                                                    <SocialBadgeIcon
                                                        src={DISCORD_ICON_SRC}
                                                        alt='Discord connected'
                                                        bg='#7289DA'
                                                        label='D'
                                                    />
                                                ) : null}
                                                {user.googleID ? (
                                                    <SocialBadgeIcon
                                                        src={GOOGLE_ICON_SRC}
                                                        alt='Google connected'
                                                        bg='#4285F4'
                                                        label='G'
                                                    />
                                                ) : null}
                                            </div>
                                        </div>
                                    </div>

                                    <div className='mt-1 grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-gray-600 dark:text-gray-300'>
                                        <div className='truncate'>
                                            <span className='opacity-70'>
                                                Kudos:
                                            </span>{' '}
                                            {typeof user.kudos === 'number'
                                                ? user.kudos
                                                : 0}
                                        </div>
                                        <div className='truncate'>
                                            <span className='opacity-70'>
                                                Joined:
                                            </span>{' '}
                                            {fmtDate(user.createdAt) || '—'}
                                        </div>
                                        {user.email ? (
                                            <div className='truncate col-span-2'>
                                                <span className='opacity-70'>
                                                    Email:
                                                </span>{' '}
                                                {user.email}
                                            </div>
                                        ) : null}
                                    </div>

                                    <div className='mt-3'>
                                        <button
                                            onClick={() =>
                                                user.id &&
                                                navigate(`/user/${user.id}`)
                                            }
                                            className='inline-flex items-center rounded-lg px-3 py-1.5 text-xs font-medium
                                            bg-neutral-900 text-white dark:bg-white dark:text-neutral-900
                                            hover:opacity-90 active:opacity-80 transition'
                                        >
                                            View Profile
                                        </button>
                                        {currentUser &&
                                            user?.id &&
                                            currentUser.id !== user.id && (
                                            <div className='inline-block ml-2'>
                                                {(
                                                    blockedUsers ?? []
                                                ).includes(user.id) ? (
                                                        <button
                                                            onClick={async (
                                                                e
                                                            ) => {
                                                                e.stopPropagation();
                                                                if (
                                                                    blockingLoading
                                                                )
                                                                    return;
                                                                try {
                                                                    await unblock(
                                                                        user.id
                                                                    );
                                                                }
                                                                catch (err) {
                                                                    // noop - hook will refresh/rollback as needed
                                                                }
                                                            }}
                                                            className='inline-flex items-center rounded-lg px-3 py-1.5 text-xs font-medium
                                                        bg-white text-neutral-900 dark:bg-neutral-800 dark:text-white border border-neutral-200 dark:border-neutral-700
                                                        hover:opacity-90 active:opacity-80 transition'
                                                        >
                                                            Unblock
                                                        </button>
                                                    ) : (
                                                        <button
                                                            onClick={async (
                                                                e
                                                            ) => {
                                                                e.stopPropagation();
                                                                if (
                                                                    blockingLoading
                                                                )
                                                                    return;
                                                                try {
                                                                    await block(
                                                                        user.id
                                                                    );
                                                                }
                                                                catch (err) {
                                                                    // noop
                                                                }
                                                            }}
                                                            className='inline-flex items-center rounded-lg px-3 py-1.5 text-xs font-medium
                                                        bg-red-600 text-white hover:opacity-90 active:opacity-80 transition'
                                                        >
                                                            Block
                                                        </button>
                                                    )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className='flex items-center justify-center py-6'>
                                <div className='h-5 w-5 rounded-full border-2 border-neutral-400 border-t-transparent animate-spin' />
                                <span className='ml-2 text-xs text-neutral-600 dark:text-neutral-300'>
                                    Loading...
                                </span>
                            </div>
                        )}
                    </div>
                )}
            >
                <div
                    className={[
                        centered && subtitle
                            ? 'inline-flex flex-col items-center text-center gap-2'
                            : 'inline-flex items-center gap-2',
                        'text-neutral-900 dark:text-neutral-100',
                        // Applying the padding/margin trick to increase the HOVER area for Tippy
                        'p-2',
                        '-m-2',
                        className
                    ].join(' ')}
                >
                    {trigger}
                </div>
            </Tippy>
            <AdminReportModal
                open={adminReportOpen}
                userID={user?.id ?? null}
                onClose={() => setAdminReportOpen(false)}
            />
        </>
    );
};

export default UserCard;
