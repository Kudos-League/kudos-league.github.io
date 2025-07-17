import React, { useState, useEffect, useRef, useCallback } from 'react';
import debounce from 'lodash/debounce';
import { getTopTags } from '@/shared/api/actions';
import { useAuth } from '@/hooks/useAuth';

interface Tag {
    id: string;
    name: string;
    count?: number;
}

interface TagInputProps {
    onTagsChange: (tags: Tag[]) => void;
    initialTags?: string[];
}

const TagInput: React.FC<TagInputProps> = ({
    onTagsChange,
    initialTags = []
}) => {
    const [currentTagInput, setCurrentTagInput] = useState('');
    const [selectedTags, setSelectedTags] = useState<Tag[]>(() =>
        initialTags.map((name) => ({ id: `init-${name}`, name }))
    );
    const [suggestedTags, setSuggestedTags] = useState<Tag[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const { token } = useAuth();
    const currentRequestRef = useRef<number>(0);

    // Memoize the debounced function to prevent recreation on every render
    const fetchSuggestions = useCallback(
        debounce(async (query: string, requestId: number) => {
            if (!query || query.length < 2) {
                setSuggestedTags([]);
                setIsLoading(false);
                return;
            }

            try {
                if (!token) {
                    setIsLoading(false);
                    return;
                }
                
                const response = await getTopTags(query, token);
                
                // Check if this is still the latest request
                if (requestId === currentRequestRef.current) {
                    const filtered = response.data.filter(
                        (tag: Tag) => !selectedTags.some((sel) => sel.name === tag.name)
                    );
                    setSuggestedTags(filtered);
                }
            } 
            catch (e) {
                console.error('Failed to fetch tags:', e);
                // Only update state if this is still the current request
                if (requestId === currentRequestRef.current) {
                    setSuggestedTags([]);
                }
            } 
            finally {
                if (requestId === currentRequestRef.current) {
                    setIsLoading(false);
                }
            }
        }, 400),
        [token, selectedTags] // Include dependencies that the function uses
    );

    // Handle input changes and trigger suggestions
    const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setCurrentTagInput(value);
        
        // Increment request ID for race condition handling
        currentRequestRef.current += 1;
        const requestId = currentRequestRef.current;
        
        if (value && value.length >= 2) {
            setIsLoading(true);
        }
        
        fetchSuggestions(value, requestId);
    }, [fetchSuggestions]);

    // Use useRef to track if we should call onTagsChange to prevent infinite loops
    const lastTagsRef = useRef<Tag[]>(selectedTags);
    const onTagsChangeRef = useRef(onTagsChange);
    onTagsChangeRef.current = onTagsChange;

    useEffect(() => {
        // Only call onTagsChange if tags actually changed
        if (JSON.stringify(selectedTags) !== JSON.stringify(lastTagsRef.current)) {
            lastTagsRef.current = selectedTags;
            onTagsChangeRef.current(selectedTags);
        }
    }, [selectedTags]); // Remove onTagsChange from deps to prevent infinite loop

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            fetchSuggestions.cancel();
        };
    }, [fetchSuggestions]);

    const handleAddTag = useCallback(() => {
        const trimmedInput = currentTagInput.trim();
        if (!trimmedInput) return;
        
        // Check if tag already exists
        if (selectedTags.some(tag => tag.name.toLowerCase() === trimmedInput.toLowerCase())) {
            setCurrentTagInput('');
            setSuggestedTags([]);
            return;
        }

        const newTag: Tag = {
            id: `custom-${Date.now()}`,
            name: trimmedInput
        };
        
        setSelectedTags(prev => [...prev, newTag]);
        setCurrentTagInput('');
        setSuggestedTags([]);
        
        // Use setTimeout to avoid cursor issues
        setTimeout(() => {
            inputRef.current?.focus();
        }, 0);
    }, [currentTagInput, selectedTags]);

    const handleSelectSuggestion = useCallback((tag: Tag) => {
        // Check if tag already exists
        if (selectedTags.some(selected => selected.name.toLowerCase() === tag.name.toLowerCase())) {
            return;
        }

        setSelectedTags(prev => [...prev, tag]);
        setCurrentTagInput('');
        setSuggestedTags([]);
        
        // Use setTimeout to avoid cursor issues
        setTimeout(() => {
            inputRef.current?.focus();
        }, 0);
    }, [selectedTags]);

    const handleRemoveTag = useCallback((id: string) => {
        setSelectedTags(prev => prev.filter(tag => tag.id !== id));
    }, []);

    const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleAddTag();
        } 
        else if (e.key === 'Escape') {
            setSuggestedTags([]);
        } 
        else if (e.key === 'ArrowDown' && suggestedTags.length > 0) {
            e.preventDefault();
            // Could implement keyboard navigation here
        }
    }, [handleAddTag, suggestedTags.length]);

    return (
        <div className='w-full space-y-3'>
            <label className='text-sm font-semibold'>Tags</label>
            <div className='flex items-center gap-2'>
                <input
                    ref={inputRef}
                    type='text'
                    value={currentTagInput}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                    className='flex-1 border rounded px-3 py-2'
                    placeholder='Enter tag and press Add'
                    autoComplete='off'
                />
                <button
                    onClick={handleAddTag}
                    className='px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400'
                    disabled={!currentTagInput.trim() || isLoading}
                    type='button'
                >
                    Add
                </button>
            </div>

            {isLoading && (
                <div className='text-gray-500 text-sm'>Searching tags...</div>
            )}

            {suggestedTags.length > 0 && !isLoading && (
                <ul className='border rounded max-h-48 overflow-y-auto bg-white shadow-sm'>
                    {suggestedTags.map((tag) => (
                        <li
                            key={tag.id}
                            className='flex justify-between px-4 py-2 hover:bg-gray-100 cursor-pointer border-b last:border-b-0'
                            onClick={() => handleSelectSuggestion(tag)}
                        >
                            <span>{tag.name}</span>
                            {tag.count !== undefined && (
                                <span className='text-sm text-gray-400'>
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
                            className='bg-gray-200 text-sm px-3 py-1 rounded-full flex items-center gap-1'
                        >
                            {tag.name}
                            <button
                                onClick={() => handleRemoveTag(tag.id)}
                                className='text-gray-500 hover:text-red-500 font-bold ml-1'
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
