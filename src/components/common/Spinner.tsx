import React from 'react'

export default function Spinner({ text = '', className = '' }: { text?: string, className?: string }) {
    return (
        <div className={`flex items-center justify-center h-full w-full p-3 ${className}`}>
            <div className="flex items-center gap-3">
                <div className="loading loading-spinner loading-xl"></div>
                <p className="text-black dark:text-white">{text}</p>
            </div>
        </div>
    )
}