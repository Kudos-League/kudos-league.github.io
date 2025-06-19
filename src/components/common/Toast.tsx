import React from 'react';

type ToastProps = {
    message: string;
    onClose: () => void;
    type?: 'success' | 'error';
};

const Toast: React.FC<ToastProps> = ({ message, onClose, type = 'success' }) => {
    return (
        <div className={`fixed bottom-4 right-4 z-50 p-4 rounded shadow-lg
            ${type === 'error' ? 'bg-red-600 text-white' : 'bg-green-600 text-white'}`}>
            <div className="flex items-center justify-between gap-4">
                <span>{message}</span>
                <button onClick={onClose} className="text-white font-bold">&times;</button>
            </div>
        </div>
    );
};

export default Toast;
