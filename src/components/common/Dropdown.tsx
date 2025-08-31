'use client';

import React, { useEffect } from 'react';
import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react';
import { ChevronDown, Check } from 'lucide-react';

type Option<T extends string> = { label: string; value: T };

type OnChange<T extends string> =
  | ((val: T) => void)
  | React.Dispatch<React.SetStateAction<T>>;

interface Props<T extends string> {
  value: T;
  onChange: OnChange<T>;
  options: readonly Option<T>[];
  className?: string;
  buttonClassName?: string;
  label?: string;
  hideButton?: boolean;
  autoSelectFirst?: boolean;
  fullWidth?: boolean;
  placeholder?: string;
}

export default function Dropdown<T extends string>({
    value,
    onChange,
    options,
    className = '',
    buttonClassName = '',
    label,
    hideButton = false,
    autoSelectFirst = false,
    fullWidth = false,
    placeholder = 'Select'
}: Props<T>) {
    const selectedLabel = options.find((o) => o.value === value)?.label ?? placeholder;
    const hasValue = options.some((o) => o.value === value);

    useEffect(() => {
        if (!autoSelectFirst) return;
        if (hasValue) return;
        if (options.length > 0) {
            onChange(options[0].value);
        }
    }, [autoSelectFirst, hasValue, options, onChange]);

    if (hideButton) {
        return (
            <div className={`relative inline-block ${fullWidth ? 'w-full' : ''} ${className}`}>
                {label ? (
                    <div className="mb-1 text-xs font-medium text-gray-600 dark:text-gray-300">
                        {label}
                    </div>
                ) : null}
                <div
                    className={[
                        'rounded-md bg-white shadow-lg outline-1 outline-black/5',
                        'dark:bg-gray-800 dark:shadow-none dark:-outline-offset-1 dark:outline-white/10'
                    ].join(' ')}
                >
                    <div className="py-1 max-h-52 overflow-auto">
                        {options.map((opt) => {
                            const active = opt.value === value;
                            return (
                                <button
                                    key={opt.value}
                                    type="button"
                                    onClick={() => onChange(opt.value)}
                                    className={[
                                        'flex w-full items-center justify-between px-4 py-2 text-left text-sm',
                                        'text-gray-700 dark:text-gray-300',
                                        active
                                            ? 'bg-gray-100 text-gray-900 dark:bg-white/5 dark:text-white'
                                            : 'hover:bg-gray-50 dark:hover:bg-white/5'
                                    ].join(' ')}
                                >
                                    <span className="pr-3">{opt.label}</span>
                                    {active ? <Check className="size-4" /> : <span className="size-4" />}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className={`relative inline-block ${className}`}>
            {label ? (
                <div className="mb-1 text-xs font-medium text-gray-600 dark:text-gray-300">
                    {label}
                </div>
            ) : null}

            <Menu as="div" className="relative inline-block text-left">
                <MenuButton
                    className={[
                        'inline-flex items-center justify-between gap-x-2 rounded-md bg-white px-3 py-2',
                        'text-sm font-medium text-gray-900 shadow-xs inset-ring-1 inset-ring-gray-300',
                        'hover:bg-gray-50 focus:outline-none',
                        'dark:bg-white/10 dark:text-white dark:shadow-none dark:inset-ring-white/5 dark:hover:bg-white/20',
                        buttonClassName
                    ].join(' ')}
                >
                    <span className="truncate">{selectedLabel}</span>
                    <ChevronDown aria-hidden className="size-4 text-gray-500" />
                </MenuButton>

                <MenuItems
                    transition
                    className={[
                        'absolute right-0 z-10 mt-2 w-56 origin-top-right rounded-md bg-white',
                        'shadow-lg outline-1 outline-black/5',
                        'transition data-closed:scale-95 data-closed:transform data-closed:opacity-0',
                        'data-enter:duration-100 data-enter:ease-out data-leave:duration-75 data-leave:ease-in',
                        'dark:bg-gray-800 dark:shadow-none dark:-outline-offset-1 dark:outline-white/10'
                    ].join(' ')}
                >
                    <div className="py-1">
                        {options.map((opt) => {
                            const active = opt.value === value;
                            return (
                                <MenuItem key={opt.value}>
                                    {({ focus }) => (
                                        <button
                                            type="button"
                                            onClick={() => onChange(opt.value)}
                                            className={[
                                                'flex w-full items-center justify-between px-4 py-2 text-left text-sm',
                                                'text-gray-700 dark:text-gray-300',
                                                focus
                                                    ? 'bg-gray-100 text-gray-900 dark:bg.White/5 dark:text-white'
                                                    : ''
                                            ].join(' ')}
                                        >
                                            <span className="pr-3">{opt.label}</span>
                                            {active ? <Check className="size-4" /> : <span className="size-4" />}
                                        </button>
                                    )}
                                </MenuItem>
                            );
                        })}
                    </div>
                </MenuItems>
            </Menu>
        </div>
    );
}