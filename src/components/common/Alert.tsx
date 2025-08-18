'use client';

import React from 'react';
import { Transition } from '@headlessui/react';
import {
    CheckCircleIcon,
    InformationCircleIcon,
    ExclamationTriangleIcon,
    XCircleIcon
} from '@heroicons/react/24/outline';
import { XMarkIcon } from '@heroicons/react/20/solid';

export type AlertType = 'success' | 'danger' | 'warning' | 'info';

export interface AlertProps {
  type: AlertType;
  title?: string;
  message: string;
  show?: boolean;
  onClose?: () => void;
  onClick?: () => void;
  onAfterLeave?: () => void;
  closable?: boolean;
}

const iconByType: Record<AlertType, React.ElementType> = {
    success: CheckCircleIcon,
    info: InformationCircleIcon,
    warning: ExclamationTriangleIcon,
    danger: XCircleIcon
};

const accentByType: Record<AlertType, string> = {
    success: 'text-green-400',
    info: 'text-blue-400',
    warning: 'text-yellow-400',
    danger: 'text-red-400'
};

const defaultTitleByType: Record<AlertType, string> = {
    success: 'Success',
    info: 'Info',
    warning: 'Warning',
    danger: 'Error'
};

const Alert: React.FC<AlertProps> = ({
    type,
    title,
    message,
    show = true,
    onClose,
    onClick,
    onAfterLeave,
    closable = false
}) => {
    const Icon = iconByType[type];
    const accent = accentByType[type];

    return (
        <Transition
            show={show}
            appear
            enter="transform transition ease-out duration-300"
            enterFrom="translate-y-2 opacity-0 sm:translate-x-2 sm:translate-y-0"
            enterTo="translate-y-0 opacity-100 sm:translate-x-0"
            leave="transition ease-in duration-100"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
            afterLeave={onAfterLeave}
        >
            <div
                className="pointer-events-auto w-fit min-w-[300px] rounded-lg bg-white shadow-lg outline-1 outline-black/5 dark:bg-gray-800 dark:-outline-offset-1 dark:outline-white/10"
                role="status"
            >
                <div className="p-4">
                    <div className="flex items-start">
                        <div className="shrink-0">
                            <Icon aria-hidden="true" className={`size-6 ${accent}`} />
                        </div>

                        <div
                            onClick={onClick}
                            className={`ml-3 w-0 flex-1 pt-0.5 ${onClick ? 'cursor-pointer' : ''}`}
                        >
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                                {title ?? defaultTitleByType[type]}
                            </p>
                            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{message}</p>
                        </div>

                        {closable && onClose && (
                            <div className="ml-4 flex shrink-0">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="inline-flex rounded-md text-gray-400 hover:text-gray-500 focus:outline-2 focus:outline-offset-2 focus:outline-indigo-600 dark:hover:text-white dark:focus:outline-indigo-500"
                                >
                                    <span className="sr-only">Close</span>
                                    <XMarkIcon aria-hidden="true" className="size-5" />
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </Transition>
    );
};

export default Alert;