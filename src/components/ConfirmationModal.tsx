import React from 'react';
import {
    XMarkIcon,
    ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

interface ConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    variant?: 'danger' | 'warning' | 'info';
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    variant = 'danger'
}) => {
    if (!isOpen) return null;

    const variantStyles = {
        danger: {
            icon: 'text-red-600 dark:text-red-400',
            iconBg: 'bg-red-100 dark:bg-red-900/30',
            confirmButton:
                'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 dark:from-red-600 dark:to-red-700 dark:hover:from-red-700 dark:hover:to-red-800'
        },
        warning: {
            icon: 'text-yellow-600 dark:text-yellow-400',
            iconBg: 'bg-yellow-100 dark:bg-yellow-900/30',
            confirmButton:
                'bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 dark:from-yellow-600 dark:to-yellow-700 dark:hover:from-yellow-700 dark:hover:to-yellow-800'
        },
        info: {
            icon: 'text-blue-600 dark:text-blue-400',
            iconBg: 'bg-blue-100 dark:bg-blue-900/30',
            confirmButton:
                'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 dark:from-blue-600 dark:to-blue-700 dark:hover:from-blue-700 dark:hover:to-blue-800'
        }
    };

    const styles = variantStyles[variant];

    return (
        <div className='fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 dark:bg-opacity-70 animate-fadeIn'>
            <div
                className='bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full animate-slideUp'
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className='flex items-start justify-between p-6 border-b border-gray-200 dark:border-gray-700'>
                    <div className='flex items-start space-x-3 flex-1'>
                        <div
                            className={`p-2 rounded-full ${styles.iconBg} flex-shrink-0`}
                        >
                            <ExclamationTriangleIcon
                                className={`w-6 h-6 ${styles.icon}`}
                            />
                        </div>
                        <div className='flex-1 min-w-0'>
                            <h3 className='text-lg font-semibold text-gray-900 dark:text-gray-100 break-words'>
                                {title}
                            </h3>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className='text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors ml-4 flex-shrink-0'
                    >
                        <XMarkIcon className='w-6 h-6' />
                    </button>
                </div>

                {/* Body */}
                <div className='p-6'>
                    <p className='text-sm text-gray-600 dark:text-gray-300 break-words'>
                        {message}
                    </p>
                </div>

                {/* Footer */}
                <div className='flex flex-col-reverse sm:flex-row gap-3 p-6 bg-gray-50 dark:bg-gray-900/50 rounded-b-xl'>
                    <button
                        onClick={onClose}
                        className='w-full sm:w-auto px-6 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200'
                    >
                        {cancelText}
                    </button>
                    <button
                        onClick={() => {
                            onConfirm();
                            onClose();
                        }}
                        className={`w-full sm:w-auto px-6 py-2.5 rounded-lg text-white font-medium text-sm transition-all duration-200 transform hover:scale-105 active:scale-95 shadow-md hover:shadow-lg ${styles.confirmButton}`}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>

            <style>{`
                @keyframes fadeIn {
                    from {
                        opacity: 0;
                    }
                    to {
                        opacity: 1;
                    }
                }

                @keyframes slideUp {
                    from {
                        transform: translateY(20px);
                        opacity: 0;
                    }
                    to {
                        transform: translateY(0);
                        opacity: 1;
                    }
                }

                .animate-fadeIn {
                    animation: fadeIn 0.2s ease-out;
                }

                .animate-slideUp {
                    animation: slideUp 0.3s ease-out;
                }
            `}</style>
        </div>
    );
};

export default ConfirmationModal;
