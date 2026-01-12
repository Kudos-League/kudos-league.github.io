import React, { useState, useEffect, useRef, useCallback } from 'react';
import debounce from 'lodash/debounce';
import { apiGet } from '@/shared/api/apiClient';
import { useAuth } from '@/contexts/useAuth';
import Button from './common/Button';

interface Tag {
    id: string;
    name: string;
    count?: number;
}

interface TagInputProps {
    onTagsChange: (tags: Tag[]) => void;
    initialTags?: string[];
    className?: string;
}

const TagInput: React.FC<TagInputProps> = ({
    onTagsChange,
    initialTags = [],
    className
}) => {
    const [currentTagInput, setCurrentTagInput] = useState('');
    const [selectedTags, setSelectedTags] = useState<Tag[]>(() =>
        initialTags.map((name) => ({ id: `init-${name}`, name }))
    );
    const [suggestedTags, setSuggestedTags] = useState<Tag[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    useAuth();
    const currentRequestRef = useRef<number>(0);

    const fetchSuggestions = useCallback(
        debounce(async (query: string, requestID: number) => {
            if (!query || query.length < 2) {
                setSuggestedTags([]);
                setIsLoading(false);
                return;
            }

            try {
                const response = await apiGet<any>('/tags/top', {
                    params: { q: query }
                });

                let tags: Tag[] = [];
                if (Array.isArray(response)) {
                    tags = response;
                }
                else if (Array.isArray(response?.data)) {
                    tags = response.data;
                }
                else {
                    tags = [];
                }

                if (requestID === currentRequestRef.current) {
                    const filtered = tags.filter(
                        (tag: Tag) =>
                            !selectedTags.some((sel) => sel.name === tag.name)
                    );
                    setSuggestedTags(filtered);
                }
            }
            catch (e) {
                console.error('Failed to fetch tags:', e);
                if (requestID === currentRequestRef.current) {
                    setSuggestedTags([]);
                }
            }
            finally {
                if (requestID === currentRequestRef.current) {
                    setIsLoading(false);
                }
            }
        }, 400),
        [selectedTags]
    );

    const handleInputChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            const value = e.target.value;
            setCurrentTagInput(value);

            currentRequestRef.current += 1;
            const requestID = currentRequestRef.current;

            if (value && value.length >= 2) {
                setIsLoading(true);
            }

            fetchSuggestions(value, requestID);
        },
        [fetchSuggestions]
    );

    const lastTagsRef = useRef<Tag[]>(selectedTags);
    const onTagsChangeRef = useRef(onTagsChange);
    onTagsChangeRef.current = onTagsChange;

    useEffect(() => {
        if (
            JSON.stringify(selectedTags) !== JSON.stringify(lastTagsRef.current)
        ) {
            lastTagsRef.current = selectedTags;
            onTagsChangeRef.current(selectedTags);
        }
    }, [selectedTags]);

    useEffect(() => {
        return () => {
            fetchSuggestions.cancel();
        };
    }, [fetchSuggestions]);

    const handleAddTag = useCallback(() => {
        const trimmedInput = currentTagInput.trim();
        if (!trimmedInput) return;

        if (
            selectedTags.some(
                (tag) => tag.name.toLowerCase() === trimmedInput.toLowerCase()
            )
        ) {
            setCurrentTagInput('');
            setSuggestedTags([]);
            return;
        }

        const newTag: Tag = {
            id: `custom-${Date.now()}`,
            name: trimmedInput
        };

        setSelectedTags((prev) => [...prev, newTag]);
        setCurrentTagInput('');
        setSuggestedTags([]);

        setTimeout(() => {
            inputRef.current?.focus();
        }, 0);
    }, [currentTagInput, selectedTags]);

    const handleSelectSuggestion = useCallback(
        (tag: Tag) => {
            if (
                selectedTags.some(
                    (selected) =>
                        selected.name.toLowerCase() === tag.name.toLowerCase()
                )
            ) {
                return;
            }

            setSelectedTags((prev) => [...prev, tag]);
            setCurrentTagInput('');
            setSuggestedTags([]);

            setTimeout(() => {
                inputRef.current?.focus();
            }, 0);
        },
        [selectedTags]
    );

    const handleRemoveTag = useCallback((id: string) => {
        setSelectedTags((prev) => prev.filter((tag) => tag.id !== id));
    }, []);

    const handleKeyDown = useCallback(
        (e: React.KeyboardEvent<HTMLInputElement>) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                e.stopPropagation();
                handleAddTag();
            }
            else if (e.key === 'Escape') {
                setSuggestedTags([]);
            }
            else if (e.key === 'ArrowDown' && suggestedTags.length > 0) {
                e.preventDefault();
            }
        },
        [handleAddTag, suggestedTags.length]
    );

    return (
        <div className={`w-full space-y-3 ${className ? className : ''}`}>
            <label className='text-sm font-semibold'>Tags</label>
            <div className='flex items-center gap-2 w-full'>
                <input
                    ref={inputRef}
                    type='text'
                    value={currentTagInput}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                    className='flex-1 min-w-0 border rounded px-3 py-2'
                    placeholder='Enter tag and press Add'
                    autoComplete='off'
                />
                <Button
                    type='button'
                    onClick={handleAddTag}
                    disabled={!currentTagInput.trim() || isLoading}
                    className='flex-shrink-0 bg-brand-600'
                >
                    Add
                </Button>
            </div>

            {isLoading && (
                <div className='text-gray-500 text-sm'>Searching tags...</div>
            )}

            {suggestedTags.length > 0 && !isLoading && (
                <ul className='border dark:border-gray-700 rounded max-h-48 overflow-y-auto bg-white dark:bg-gray-800 shadow-sm'>
                    {suggestedTags.map((tag) => (
                        <li
                            key={tag.id}
                            className='flex justify-between px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer border-b dark:border-gray-700 last:border-b-0 text-gray-800 dark:text-gray-200'
                            onClick={() => handleSelectSuggestion(tag)}
                        >
                            <span>{tag.name}</span>
                            {tag.count !== undefined && (
                                <span className='text-sm text-gray-400 dark:text-gray-500'>
                                    ({tag.count})
                                </span>
                            )}
                        </li>
                    ))}
                </ul>
            )}

            {selectedTags.length > 0 && (
                <div className='flex flex-wrap gap-2'>
                    {selectedTags.map((tag) => (
                        <span
                            key={tag.id}
                            className='bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 text-sm px-3 py-1 rounded-full flex items-center gap-1'
                        >
                            {tag.name}
                            <button
                                onClick={() => handleRemoveTag(tag.id)}
                                className='text-gray-500 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400 font-bold ml-1'
                                type='button'
                                aria-label={`Remove ${tag.name} tag`}
                            >
                                ×
                            </button>
                        </span>
                    ))}
                </div>
            )}
        </div>
    );
};

export default TagInput;
