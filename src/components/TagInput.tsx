import React, { useState, useEffect, useRef } from 'react';
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

    const fetchSuggestions = debounce(async (query: string) => {
        if (!query || query.length < 2) {
            setSuggestedTags([]);
            return;
        }

        setIsLoading(true);
        try {
            if (!token) return;
            const response = await getTopTags(query, token);
            const filtered = response.data.filter(
                (tag: Tag) => !selectedTags.some((sel) => sel.name === tag.name)
            );
            setSuggestedTags(filtered);
        }
        catch (e) {
            console.error('Failed to fetch tags:', e);
            setSuggestedTags([]);
        }
        finally {
            setIsLoading(false);
        }
    }, 400);

    useEffect(() => {
        fetchSuggestions(currentTagInput);
        return () => fetchSuggestions.cancel();
    }, [currentTagInput]);

    useEffect(() => {
        onTagsChange(selectedTags);
    }, [selectedTags]);

    const handleAddTag = () => {
        if (!currentTagInput.trim()) return;
        const newTag: Tag = {
            id: `custom-${Date.now()}`,
            name: currentTagInput.trim()
        };
        setSelectedTags([...selectedTags, newTag]);
        setCurrentTagInput('');
        setSuggestedTags([]);
        inputRef.current?.focus();
    };

    const handleSelectSuggestion = (tag: Tag) => {
        setSelectedTags([...selectedTags, tag]);
        setCurrentTagInput('');
        setSuggestedTags([]);
        inputRef.current?.focus();
    };

    const handleRemoveTag = (id: string) => {
        setSelectedTags((prev) => prev.filter((tag) => tag.id !== id));
    };

    if (isLoading) {
        return <div className='text-gray-500'>Loading tags...</div>;
    }

    return (
        <div className='w-full space-y-3'>
            <label className='text-sm font-semibold'>Tags</label>
            <div className='flex items-center gap-2'>
                <input
                    ref={inputRef}
                    type='text'
                    value={currentTagInput}
                    onChange={(e) => setCurrentTagInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddTag()}
                    className='flex-1 border rounded px-3 py-2'
                    placeholder='Enter tag and press Add'
                />
                <button
                    onClick={handleAddTag}
                    className='px-4 py-2 bg-blue-600 text-white rounded'
                    disabled={!currentTagInput.trim()}
                >
                    Add
                </button>
            </div>

            {suggestedTags.length > 0 && (
                <ul className='border rounded max-h-48 overflow-y-auto'>
                    {suggestedTags.map((tag) => (
                        <li
                            key={tag.id}
                            className='flex justify-between px-4 py-2 hover:bg-gray-100 cursor-pointer'
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

            <div className='flex flex-wrap gap-2'>
                {selectedTags.map((tag) => (
                    <span
                        key={tag.id}
                        className='bg-gray-200 text-sm px-3 py-1 rounded-full flex items-center gap-1'
                    >
                        {tag.name}
                        <button
                            onClick={() => handleRemoveTag(tag.id)}
                            className='text-gray-500 hover:text-red-500 font-bold'
                        >
                            ×
                        </button>
                    </span>
                ))}
            </div>
        </div>
    );
};

export default TagInput;
