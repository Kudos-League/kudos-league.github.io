'use client';

import React, { Fragment } from 'react';
import { Link } from 'react-router-dom';
import { Menu, Transition } from '@headlessui/react';
import { Bars3Icon } from '@heroicons/react/24/outline';
import AvatarComponent from '@/components/users/Avatar';
import HeaderBell from '@/components/notifications/NotificationsBell';
import Button from '../common/Button';

type UserLike = {
  id: string | number;
  username?: string | null;
  avatar?: string | null;
};

export type NavbarProps = {
  onOpenSidebar: () => void;
  isLoggedIn: boolean;
  user?: UserLike | null;
  onLogout: () => void;
  brand?: React.ReactNode;
};

function classNames(...classes: Array<string | false | null | undefined>) {
    return classes.filter(Boolean).join(' ');
}

const Navbar: React.FC<NavbarProps> = ({
    onOpenSidebar,
    isLoggedIn,
    user,
    onLogout,
    brand,
}) => {
    return (
        <header className="sticky top-0 z-40 flex items-center justify-between bg-white px-4 py-4 shadow dark:bg-gray-900 md:px-6">
            {/* Left: Hamburger + Brand */}
            <div className="flex items-center gap-3">
                <Button
                    type="button"
                    aria-label="Open sidebar"
                    onClick={onOpenSidebar}
                    className="lg:hidden -m-2.5 p-2.5 text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded dark:text-gray-300 dark:hover:text-white dark:hover:bg-white/5"
                >
                    <Bars3Icon className="h-6 w-6" />
                </Button>

                <div className="flex items-center">
                    {brand ?? (
                        <>
                            <img
                                alt="Kudos League"
                                src="/logo-light.svg"
                                className="h-8 w-auto dark:hidden"
                            />
                            <img
                                alt="Kudos League"
                                src="/logo-dark.svg"
                                className="hidden h-8 w-auto dark:block"
                            />
                        </>
                    )}
                </div>
            </div>

            {/* Right: Auth area */}
            <div className="flex items-center gap-2">
                {isLoggedIn && user ? (
                    <>
                        {/* Notifications bell */}
                        <HeaderBell />

                        {/* Profile menu */}
                        <Menu as="div" className="relative">
                            <Menu.Button className="flex items-center focus:outline-none">
                                {user.avatar ? (
                                    <AvatarComponent
                                        username={user.username ?? 'User'}
                                        avatar={user.avatar}
                                        size={32}
                                    />
                                ) : (
                                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-300 text-sm font-bold text-gray-700 dark:bg-gray-700 dark:text-white">
                                        {user.username?.charAt(0) || 'U'}
                                    </div>
                                )}
                            </Menu.Button>

                            {/* Animated dropdown using classic Transition (works on Tailwind v3) */}
                            <Transition
                                as={Fragment}
                                enter="transition ease-out duration-100"
                                enterFrom="transform opacity-0 scale-95"
                                enterTo="transform opacity-100 scale-100"
                                leave="transition ease-in duration-75"
                                leaveFrom="transform opacity-100 scale-100"
                                leaveTo="transform opacity-0 scale-95"
                            >
                                <Menu.Items
                                    className="absolute right-0 mt-2 w-44 origin-top-right rounded-md bg-white py-1 shadow-lg outline outline-1 outline-black/5 focus:outline-none dark:bg-gray-800 dark:outline-white/10"
                                >
                                    <Menu.Item>
                                        {({ active }) => (
                                            <Link
                                                to={`/user/${user.id}`}
                                                className={classNames(
                                                    active
                                                        ? 'bg-gray-100 dark:bg-white/5'
                                                        : '',
                                                    'block px-4 py-2 text-sm text-gray-700 dark:text-gray-200'
                                                )}
                                            >
											Profile
                                            </Link>
                                        )}
                                    </Menu.Item>
                                    <Menu.Item>
                                        {({ active }) => (
                                            <button
                                                onClick={onLogout}
                                                className={classNames(
                                                    active
                                                        ? 'bg-gray-100 dark:bg-white/5'
                                                        : '',
                                                    'block w-full px-4 py-2 text-left text-sm text-red-600 dark:text-red-400'
                                                )}
                                            >
											Logout
                                            </button>
                                        )}
                                    </Menu.Item>
                                </Menu.Items>
                            </Transition>
                        </Menu>
                    </>
                ) : (
                    <div className="flex gap-2">
                        <Link
                            to="/login"
                            className="rounded border border-blue-500 px-3 py-1 text-sm text-blue-500 hover:bg-blue-50 md:px-4"
                        >
						LOG IN
                        </Link>
                        <Link
                            to="/sign-up"
                            className="rounded bg-blue-500 px-3 py-1 text-sm text-white hover:bg-blue-600 md:px-4"
                        >
						SIGN UP
                        </Link>
                    </div>
                )}
            </div>
        </header>
    );
};

export default Navbar;