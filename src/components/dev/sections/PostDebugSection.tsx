import React, { useState } from 'react';
import { useCreateRandomPosts } from '@/shared/api/mutations/dev';
import { useCategories } from '@/shared/api/queries/categories';
import { useAuth } from '@/contexts/useAuth';

export default function PostDebugSection() {
    const [count, setCount] = useState(1);
    const [includeDescription, setIncludeDescription] = useState(true);
    const [includeImages, setIncludeImages] = useState(false);
    const [imageCount, setImageCount] = useState(1);
    const [includeLocation, setIncludeLocation] = useState(false);
    const [locationMode, setLocationMode] = useState<'user' | 'random'>('user');
    const { mutate: createRandomPosts, isPending } = useCreateRandomPosts();
    const { data: categories } = useCategories();
    const { user } = useAuth();
    const [selectedCategory, setSelectedCategory] = useState<number | undefined>();

    const handleCreatePosts = () => {
        createRandomPosts({
            count,
            includeDescription,
            categoryId: selectedCategory,
            includeImages,
            imageCount: includeImages ? imageCount : undefined,
            includeLocation,
            locationMode: includeLocation ? locationMode : undefined,
            userLocation: locationMode === 'user' ? user?.location : undefined
        });
    };

    return (
        <div className='space-y-4'>
            <div className='bg-purple-50 dark:bg-purple-900/20 p-3 rounded text-xs text-gray-700 dark:text-gray-300'>
				Create random posts with auto-generated content
            </div>

            <div>
                <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'>
					Count
                </label>
                <input
                    type='number'
                    min='1'
                    max='50'
                    value={count}
                    onChange={(e) => setCount(Math.max(1, parseInt(e.target.value) || 1))}
                    className='w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-slate-700 text-gray-900 dark:text-white'
                />
            </div>

            <div>
                <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'>
					Category
                </label>
                <select
                    value={selectedCategory || ''}
                    onChange={(e) =>
                        setSelectedCategory(e.target.value ? parseInt(e.target.value) : undefined)
                    }
                    className='w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-slate-700 text-gray-900 dark:text-white'
                >
                    <option value=''>Random</option>
                    {categories?.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                            {cat.name}
                        </option>
                    ))}
                </select>
            </div>

            <label className='flex items-center gap-2 cursor-pointer'>
                <input
                    type='checkbox'
                    checked={includeDescription}
                    onChange={(e) => setIncludeDescription(e.target.checked)}
                    className='w-4 h-4'
                />
                <span className='text-sm text-gray-700 dark:text-gray-300'>
                    Include descriptions
                </span>
            </label>

            <label className='flex items-center gap-2 cursor-pointer'>
                <input
                    type='checkbox'
                    checked={includeImages}
                    onChange={(e) => setIncludeImages(e.target.checked)}
                    className='w-4 h-4'
                />
                <span className='text-sm text-gray-700 dark:text-gray-300'>
                    Include images
                </span>
            </label>

            {includeImages && (
                <div>
                    <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'>
                        Image count
                    </label>
                    <input
                        type='number'
                        min='1'
                        max='10'
                        value={imageCount}
                        onChange={(e) => setImageCount(Math.max(1, parseInt(e.target.value) || 1))}
                        className='w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-slate-700 text-gray-900 dark:text-white'
                    />
                </div>
            )}

            <label className='flex items-center gap-2 cursor-pointer'>
                <input
                    type='checkbox'
                    checked={includeLocation}
                    onChange={(e) => setIncludeLocation(e.target.checked)}
                    className='w-4 h-4'
                />
                <span className='text-sm text-gray-700 dark:text-gray-300'>
                    Include location
                </span>
            </label>

            {includeLocation && (
                <div>
                    <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'>
                        Location
                    </label>
                    <select
                        value={locationMode}
                        onChange={(e) => setLocationMode(e.target.value as 'user' | 'random')}
                        className='w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-slate-700 text-gray-900 dark:text-white'
                    >
                        <option value='user'>User location</option>
                        <option value='random'>Random location</option>
                    </select>
                </div>
            )}

            <button
                onClick={handleCreatePosts}
                disabled={isPending}
                className='w-full px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white rounded text-sm font-medium transition-colors'
            >
                {isPending ? 'Creating...' : `Create ${count} Post${count !== 1 ? 's' : ''}`}
            </button>

            <div className='pt-2 border-t border-gray-200 dark:border-gray-700'>
                <div className='grid grid-cols-3 gap-2'>
                    {[1, 5, 10].map((num) => (
                        <button
                            key={num}
                            onClick={() => {
                                setCount(num);
                                createRandomPosts({
                                    count: num,
                                    includeDescription,
                                    categoryId: selectedCategory,
                                    includeImages,
                                    imageCount: includeImages ? imageCount : undefined,
                                    includeLocation,
                                    locationMode: includeLocation ? locationMode : undefined,
                                    userLocation: locationMode === 'user' ? user?.location : undefined
                                });
                            }}
                            disabled={isPending}
                            className='px-2 py-1 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50 text-gray-900 dark:text-white rounded text-xs transition-colors'
                        >
							Quick: {num}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}
