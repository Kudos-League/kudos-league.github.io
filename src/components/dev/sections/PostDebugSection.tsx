import React, { useState, useEffect } from 'react';
import { useCreatePost } from '@/shared/api/mutations/posts';
import { useCreatePostAsUser } from '@/shared/api/mutations/dev';
import { useCategories } from '@/shared/api/queries/categories';
import { useAuth } from '@/contexts/useAuth';
import { useSearchUsersQuery } from '@/shared/api/queries/users';
import { apiMutate } from '@/shared/api/apiClient';

const SEED_IMAGES_DIR = '/seed-images/';

type PostType = 'gift' | 'request' | 'random';
type UserMode = 'current' | 'search' | 'random';
type LocationMode = 'user' | 'random';
type DescriptionMode = 'short' | 'long' | 'custom' | 'random';
type CountMode = '1' | '5' | '10' | 'custom';
type TagsMode = 'off' | 'random' | 'custom';
type NavField = 'count' | 'type' | 'category' | 'user' | 'description' | 'images' | 'location' | 'tags' | 'create';

const SHORT_DESCRIPTIONS = [
    'Great item to share',
    'Looking for help',
    'Need assistance',
    'Available now',
    'Can help with this'
];

const LONG_DESCRIPTIONS = [
    'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
    'Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.',
    'Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.',
    'Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.',
    'Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium.',
    'Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia consequuntur magni dolores.'
];

export default function PostDebugSection() {
    const [countMode, setCountMode] = useState<'1' | '5' | '10' | 'custom'>('1');
    const [customCount, setCustomCount] = useState(1);
    const [customDescription, setCustomDescription] = useState('');
    const [descriptionMode, setDescriptionMode] = useState<DescriptionMode>('short');
    const [imageCount, setImageCount] = useState(1);
    const [includeLocation, setIncludeLocation] = useState(false);
    const [locationMode, setLocationMode] = useState<LocationMode>('user');
    const [tagsMode, setTagsMode] = useState<TagsMode>('off');
    const [customTags, setCustomTags] = useState('');
    const [seedImages, setSeedImages] = useState<string[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<number | undefined>();
    const [postType, setPostType] = useState<PostType>('gift');
    const [userMode, setUserMode] = useState<UserMode>('current');
    const [userSearchQuery, setUserSearchQuery] = useState('');
    const [selectedUserId, setSelectedUserId] = useState<number | undefined>();
    const [selectedUserName, setSelectedUserName] = useState<string | undefined>();
    const [activeField, setActiveField] = useState<NavField>('count');

    const { mutate: createPost, isPending: isCreatingPost } = useCreatePost();
    const { mutate: createPostAsUser, isPending: isCreatingPostAsUser } = useCreatePostAsUser();
    const { data: categories } = useCategories();
    const { user } = useAuth();
    const { data: searchResults } = useSearchUsersQuery(userSearchQuery);

    // Load available seed images on component mount
    useEffect(() => {
        const loadSeedImages = async () => {
            try {
                const response = await fetch(`${SEED_IMAGES_DIR}manifest.json`);
                if (!response.ok) {
                    console.warn('Seed images manifest not found');
                    return;
                }

                const manifest = await response.json();
                const images = manifest.images.map((filename: string) => `${SEED_IMAGES_DIR}${filename}`);
                setSeedImages(images);
            }
            catch (error) {
                console.warn('Could not load seed images:', error);
            }
        };

        loadSeedImages();
    }, []);

    const getRandomSeedImages = (count: number): string[] => {
        if (seedImages.length === 0) return [];
        const selected: string[] = [];
        for (let i = 0; i < count; i++) {
            selected.push(seedImages[Math.floor(Math.random() * seedImages.length)]);
        }
        return selected;
    };

    const WORLD_CAPITALS = [
        { name: 'Tokyo', lat: 35.6762, lon: 139.6503 },
        { name: 'Paris', lat: 48.8566, lon: 2.3522 },
        { name: 'London', lat: 51.5074, lon: -0.1278 },
        { name: 'New York', lat: 40.7128, lon: -74.0060 },
        { name: 'Sydney', lat: -33.8688, lon: 151.2093 },
        { name: 'Berlin', lat: 52.5200, lon: 13.4050 },
        { name: 'Rome', lat: 41.9028, lon: 12.4964 },
        { name: 'Moscow', lat: 55.7558, lon: 37.6173 },
        { name: 'Dubai', lat: 25.2048, lon: 55.2708 },
        { name: 'Singapore', lat: 1.3521, lon: 103.8198 },
        { name: 'Bangkok', lat: 13.7563, lon: 100.5018 },
        { name: 'Toronto', lat: 43.6532, lon: -79.3832 },
        { name: 'Mexico City', lat: 19.4326, lon: -99.1332 },
        { name: 'São Paulo', lat: -23.5505, lon: -46.6333 },
        { name: 'Istanbul', lat: 41.0082, lon: 28.9784 },
        { name: 'Barcelona', lat: 41.3851, lon: 2.1734 },
        { name: 'Amsterdam', lat: 52.3676, lon: 4.9041 },
        { name: 'Seoul', lat: 37.5665, lon: 126.9780 },
        { name: 'Hong Kong', lat: 22.3193, lon: 114.1694 },
        { name: 'Mumbai', lat: 19.0760, lon: 72.8777 }
    ];

    const getRandomLocation = () => {
        const capital = WORLD_CAPITALS[Math.floor(Math.random() * WORLD_CAPITALS.length)];
        return {
            name: capital.name,
            regionID: null,
            global: false,
            latitude: capital.lat,
            longitude: capital.lon
        };
    };

    const getRandomUserId = (): number | undefined => {
        if (searchResults && searchResults.length > 0) {
            const availableUsers = searchResults.filter(u => u.id !== user?.id);
            if (availableUsers.length > 0) {
                return availableUsers[Math.floor(Math.random() * availableUsers.length)].id;
            }
        }
        return undefined;
    };

    const getRandomPostType = (): 'gift' | 'request' => {
        return Math.random() > 0.5 ? 'gift' : 'request';
    };

    const fetchFileFromUrl = async (url: string): Promise<File | null> => {
        try {
            const response = await fetch(url);
            const blob = await response.blob();
            const filename = url.split('/').pop() || 'image.jpg';
            return new File([blob], filename, { type: blob.type });
        }
        catch (error) {
            console.error(`Failed to fetch image ${url}:`, error);
            return null;
        }
    };

    const isPending = isCreatingPost || isCreatingPostAsUser;

    // Handle keyboard navigation
    useEffect(() => {
        const handleKeyPress = (e: KeyboardEvent) => {
            if (isPending) return;

            // Check if we're typing in an input/textarea
            if ((e.target as any)?.tagName === 'TEXTAREA' || (e.target as any)?.tagName === 'INPUT') {
                return;
            }

            // 'r' key to randomize current field
            if (e.key === 'r' || e.key === 'R') {
                e.preventDefault();
                handleRandomizeField();
                return;
            }

            const fields: NavField[] = ['count', 'type', 'category', 'user', 'description', 'images', 'location', 'tags', 'create'];
            const currentIndex = fields.indexOf(activeField);

            // Arrow keys for navigation
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                const nextIndex = (currentIndex + 1) % fields.length;
                setActiveField(fields[nextIndex]);
            }
            else if (e.key === 'ArrowUp') {
                e.preventDefault();
                const prevIndex = (currentIndex - 1 + fields.length) % fields.length;
                setActiveField(fields[prevIndex]);
            }
            else if (e.key === 'ArrowRight') {
                e.preventDefault();
                handleFieldRight();
            }
            else if (e.key === 'ArrowLeft') {
                e.preventDefault();
                handleFieldLeft();
            }
            else if (e.key === 'Enter') {
                e.preventDefault();
                if (activeField === 'create') {
                    handleCreatePosts();
                }
            }
        };

        window.addEventListener('keydown', handleKeyPress);
        return () => window.removeEventListener('keydown', handleKeyPress);
    }, [isPending, activeField, postType, userMode, descriptionMode, imageCount, includeLocation, locationMode, countMode, customCount, tagsMode, customTags]);

    const handleRandomizeField = () => {
        switch (activeField) {
        case 'count': {
            setCountMode('custom');
            setCustomCount(Math.floor(Math.random() * 10) + 1);
            break;
        }
        case 'type': {
            setPostType('random');
            break;
        }
        case 'category': {
            setSelectedCategory(undefined);
            break;
        }
        case 'user': {
            setUserMode('random');
            setSelectedUserId(undefined);
            break;
        }
        case 'description': {
            setDescriptionMode('random');
            break;
        }
        case 'images': {
            setImageCount([1, 3, 5][Math.floor(Math.random() * 3)]);
            break;
        }
        case 'location': {
            setIncludeLocation(true);
            setLocationMode('random');
            break;
        }
        case 'tags': {
            setTagsMode('random');
            break;
        }
        case 'create': {
            handleRandomizeAll();
            break;
        }
        }
    };

    const handleFieldRight = () => {
        switch (activeField) {
        case 'count': {
            const modes: Array<'1' | '5' | '10' | 'custom'> = ['1', '5', '10', 'custom'];
            const currentIndex = modes.indexOf(countMode);
            const nextIndex = (currentIndex + 1) % modes.length;
            setCountMode(modes[nextIndex]);
            break;
        }
        case 'type': {
            const types: PostType[] = ['gift', 'request', 'random'];
            const typeIndex = types.indexOf(postType);
            setPostType(types[(typeIndex + 1) % types.length]);
            break;
        }
        case 'category': {
            if (selectedCategory === undefined) {
                setSelectedCategory(categories?.[0]?.id);
            }
            else if (categories) {
                const catIndex = categories.findIndex(c => c.id === selectedCategory);
                if (catIndex < categories.length - 1) {
                    setSelectedCategory(categories[catIndex + 1].id);
                }
            }
            break;
        }
        case 'user': {
            const userModes: UserMode[] = ['current', 'random', 'search'];
            const userIndex = userModes.indexOf(userMode);
            setUserMode(userModes[(userIndex + 1) % userModes.length]);
            break;
        }
        case 'description': {
            const descModes: DescriptionMode[] = ['short', 'long', 'custom', 'random'];
            const descIndex = descModes.indexOf(descriptionMode);
            setDescriptionMode(descModes[(descIndex + 1) % descModes.length]);
            break;
        }
        case 'images': {
            const imgCounts = [1, 3, 5];
            const imgIndex = imgCounts.indexOf(imageCount);
            if (imgIndex < imgCounts.length - 1) {
                setImageCount(imgCounts[imgIndex + 1]);
            }
            else {
                setImageCount(imgCounts[0]);
            }
            break;
        }
        case 'location': {
            if (!includeLocation) {
                setIncludeLocation(true);
                setLocationMode('user');
            }
            else if (locationMode === 'user') {
                setLocationMode('random');
            }
            else {
                setIncludeLocation(false);
            }
            break;
        }
        case 'tags': {
            const modes: Array<TagsMode> = ['off', 'random', 'custom'];
            const currentIndex = modes.indexOf(tagsMode);
            const nextIndex = (currentIndex + 1) % modes.length;
            setTagsMode(modes[nextIndex]);
            break;
        }
        }
    };

    const handleFieldLeft = () => {
        switch (activeField) {
        case 'count': {
            const modes: Array<'1' | '5' | '10' | 'custom'> = ['1', '5', '10', 'custom'];
            const currentIndex = modes.indexOf(countMode);
            const prevIndex = (currentIndex - 1 + modes.length) % modes.length;
            setCountMode(modes[prevIndex]);
            break;
        }
        case 'type': {
            const types: PostType[] = ['gift', 'request', 'random'];
            const typeIndex = types.indexOf(postType);
            setPostType(types[(typeIndex - 1 + types.length) % types.length]);
            break;
        }
        case 'category': {
            if (selectedCategory === undefined) {
                setSelectedCategory(undefined);
            }
            else if (categories) {
                const catIndex = categories.findIndex(c => c.id === selectedCategory);
                if (catIndex > 0) {
                    setSelectedCategory(categories[catIndex - 1].id);
                }
                else {
                    setSelectedCategory(undefined);
                }
            }
            break;
        }
        case 'user': {
            const userModes: UserMode[] = ['current', 'random', 'search'];
            const userIndex = userModes.indexOf(userMode);
            setUserMode(userModes[(userIndex - 1 + userModes.length) % userModes.length]);
            break;
        }
        case 'description': {
            const descModes: DescriptionMode[] = ['short', 'long', 'custom', 'random'];
            const descIndex = descModes.indexOf(descriptionMode);
            setDescriptionMode(descModes[(descIndex - 1 + descModes.length) % descModes.length]);
            break;
        }
        case 'images': {
            const imgCounts = [1, 3, 5];
            const imgIndex = imgCounts.indexOf(imageCount);
            if (imgIndex > 0) {
                setImageCount(imgCounts[imgIndex - 1]);
            }
            else {
                setImageCount(imgCounts[imgCounts.length - 1]);
            }
            break;
        }
        case 'location': {
            if (!includeLocation) {
                setIncludeLocation(true);
                setLocationMode('random');
            }
            else if (locationMode === 'random') {
                setLocationMode('user');
            }
            else {
                setIncludeLocation(false);
            }
            break;
        }
        case 'tags': {
            const modes: Array<TagsMode> = ['off', 'random', 'custom'];
            const currentIndex = modes.indexOf(tagsMode);
            const prevIndex = (currentIndex - 1 + modes.length) % modes.length;
            setTagsMode(modes[prevIndex]);
            break;
        }
        }
    }

    const handleRandomizeAll = () => {
        const modes: Array<'1' | '5' | '10' | 'custom'> = ['1', '5', '10', 'custom'];
        setCountMode(modes[Math.floor(Math.random() * modes.length)]);
        if (Math.random() > 0.5) {
            setCustomCount(Math.floor(Math.random() * 20) + 1);
        }
        setPostType('random');
        setUserMode('random');
        setImageCount([1, 3, 5][Math.floor(Math.random() * 3)]);
        setIncludeLocation(Math.random() > 0.5);
        if (includeLocation) {
            setLocationMode(Math.random() > 0.5 ? 'user' : 'random');
        }
        const tagsModes: Array<TagsMode> = ['off', 'random', 'custom'];
        setTagsMode(tagsModes[Math.floor(Math.random() * tagsModes.length)]);
        setDescriptionMode('random');
        setCustomDescription('');
    };

    const handleDeleteFakePosts = async () => {
        if (!confirm('Delete all fake dev posts?')) return;
        try {
            await apiMutate('/dev/posts/delete-all', 'post', {});
            alert('Deleted all fake posts');
        }
        catch (error) {
            console.error('Failed to delete posts:', error);
            alert('Failed to delete posts');
        }
    };

    const getDescription = () => {
        if (descriptionMode === 'short') {
            return SHORT_DESCRIPTIONS[Math.floor(Math.random() * SHORT_DESCRIPTIONS.length)];
        }
        else if (descriptionMode === 'long') {
            return LONG_DESCRIPTIONS[Math.floor(Math.random() * LONG_DESCRIPTIONS.length)];
        }
        else if (descriptionMode === 'custom') {
            return customDescription;
        }
        else {
            // random
            return Math.random() > 0.5
                ? SHORT_DESCRIPTIONS[Math.floor(Math.random() * SHORT_DESCRIPTIONS.length)]
                : LONG_DESCRIPTIONS[Math.floor(Math.random() * LONG_DESCRIPTIONS.length)];
        }
    };

    const getTags = (): string[] => {
        if (tagsMode === 'off') {
            return [];
        }
        else if (tagsMode === 'custom') {
            return customTags
                .split(',')
                .map(tag => tag.trim())
                .filter(tag => tag.length > 0)
                .slice(0, 10);
        }
        else {
            // random
            const randomTagCount = Math.floor(Math.random() * 8) + 1;
            const randomTags: string[] = [];
            const tagPool = ['test', 'dev', 'random', 'sample', 'demo', 'example', 'temp', 'trial'];
            for (let i = 0; i < randomTagCount; i++) {
                randomTags.push(tagPool[Math.floor(Math.random() * tagPool.length)]);
            }
            return randomTags;
        }
    };

    const handleCreatePosts = async () => {
        const finalCount = countMode === 'custom' ? customCount : parseInt(countMode);
        for (let i = 0; i < finalCount; i++) {
            const selectedImages = getRandomSeedImages(imageCount);
            const files: File[] = [];

            for (const imageUrl of selectedImages) {
                const file = await fetchFileFromUrl(imageUrl);
                if (file) files.push(file);
            }

            const location = includeLocation ? (
                locationMode === 'user' ? (user?.location as any) : getRandomLocation()
            ) : undefined;

            const targetUserId = userMode === 'search' ? selectedUserId : userMode === 'random' ? getRandomUserId() : undefined;
            const finalPostType = postType === 'random' ? getRandomPostType() : postType;
            const finalDescription = getDescription();
            const finalTags = getTags();

            if (targetUserId) {
                createPostAsUser({
                    title: `Dev Post ${i + 1}`,
                    body: finalDescription,
                    tags: finalTags,
                    type: finalPostType,
                    categoryID: selectedCategory || 1,
                    userId: targetUserId,
                    files: files.length > 0 ? files : undefined,
                    location
                });
            }
            else {
                createPost({
                    title: `Dev Post ${i + 1}`,
                    body: finalDescription,
                    tags: finalTags,
                    type: finalPostType,
                    categoryID: selectedCategory || 1,
                    files: files.length > 0 ? files : undefined,
                    location
                });
            }
        }
    };

    const FieldBox = ({ children, isActive }: { children: React.ReactNode; isActive: boolean }) => (
        <div className={`p-2 rounded border-2 transition-colors ${
            isActive
                ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/30'
                : 'border-gray-300 dark:border-gray-600'
        }`}>
            {children}
        </div>
    );

    const ToggleButton = ({ label, isActive, onClick }: { label: string; isActive: boolean; onClick: () => void }) => (
        <button
            onClick={onClick}
            className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                isActive
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
            }`}
        >
            {label}
        </button>
    );

    return (
        <div className='space-y-2'>
            {/* Header */}
            <div className='bg-purple-50 dark:bg-purple-900/20 p-2 rounded text-xs'>
                <div className='font-medium text-gray-700 dark:text-gray-300'>Quick Post Creator</div>
                <div className='text-gray-600 dark:text-gray-400 text-xs mt-1'>Navigate: ↑↓, Change: ←→, Randomize: R, Create: Enter</div>
                <div className='mt-1 text-xs text-gray-600 dark:text-gray-400'>As: <span className='font-semibold text-gray-900 dark:text-white'>{user?.displayName || user?.username || 'Current User'}</span></div>
            </div>

            {/* Count */}
            <FieldBox isActive={activeField === 'count'}>
                <label className='text-xs font-medium text-gray-700 dark:text-gray-300'>Count</label>
                <div className='flex gap-1 mt-1'>
                    <ToggleButton label='1' isActive={countMode === '1'} onClick={() => setCountMode('1')} />
                    <ToggleButton label='5' isActive={countMode === '5'} onClick={() => setCountMode('5')} />
                    <ToggleButton label='10' isActive={countMode === '10'} onClick={() => setCountMode('10')} />
                    <ToggleButton label='Custom' isActive={countMode === 'custom'} onClick={() => setCountMode('custom')} />
                </div>
                {countMode === 'custom' && (
                    <input
                        type='number'
                        min='1'
                        max='50'
                        value={customCount}
                        onChange={(e) => setCustomCount(Math.max(1, parseInt(e.target.value) || 1))}
                        className='w-full mt-1 px-1 py-0.5 border border-gray-300 dark:border-gray-600 rounded text-xs bg-white dark:bg-slate-700 text-gray-900 dark:text-white'
                    />
                )}
            </FieldBox>

            {/* Post Type */}
            <FieldBox isActive={activeField === 'type'}>
                <label className='text-xs font-medium text-gray-700 dark:text-gray-300'>Type</label>
                <div className='flex gap-1 mt-1'>
                    <ToggleButton label='Gift' isActive={postType === 'gift'} onClick={() => setPostType('gift')} />
                    <ToggleButton label='Request' isActive={postType === 'request'} onClick={() => setPostType('request')} />
                    <ToggleButton label='Random' isActive={postType === 'random'} onClick={() => setPostType('random')} />
                </div>
            </FieldBox>

            {/* Category */}
            <FieldBox isActive={activeField === 'category'}>
                <label className='text-xs font-medium text-gray-700 dark:text-gray-300'>Category</label>
                <select
                    value={selectedCategory || ''}
                    onChange={(e) => setSelectedCategory(e.target.value ? parseInt(e.target.value) : undefined)}
                    onFocus={() => setActiveField('category')}
                    className='w-full mt-1 px-1 py-0.5 border border-gray-300 dark:border-gray-600 rounded text-xs bg-white dark:bg-slate-700 text-gray-900 dark:text-white'
                >
                    <option value=''>Random</option>
                    {categories?.map((cat) => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                </select>
            </FieldBox>

            {/* User Mode */}
            <FieldBox isActive={activeField === 'user'}>
                <label className='text-xs font-medium text-gray-700 dark:text-gray-300'>Post As</label>
                <div className='flex gap-1 mt-1'>
                    <ToggleButton label='Me' isActive={userMode === 'current'} onClick={() => { setUserMode('current'); setSelectedUserId(undefined); }} />
                    <ToggleButton label='Random' isActive={userMode === 'random'} onClick={() => { setUserMode('random'); setSelectedUserId(undefined); }} />
                    <ToggleButton label='Search' isActive={userMode === 'search'} onClick={() => setUserMode('search')} />
                </div>

                {userMode === 'search' && (
                    <div className='mt-2 pt-2 border-t border-gray-300 dark:border-gray-600'>
                        <input
                            type='text'
                            placeholder='Search user...'
                            value={userSearchQuery}
                            onChange={(e) => setUserSearchQuery(e.target.value)}
                            className='w-full px-1 py-0.5 border border-gray-300 dark:border-gray-600 rounded text-xs bg-white dark:bg-slate-700 text-gray-900 dark:text-white'
                        />
                        {searchResults && searchResults.length > 0 && (
                            <div className='mt-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-slate-700 max-h-32 overflow-y-auto'>
                                {searchResults.map((u) => (
                                    <button
                                        key={u.id}
                                        onClick={() => {
                                            setSelectedUserId(u.id);
                                            setSelectedUserName(u.displayName || u.username);
                                            setUserSearchQuery('');
                                        }}
                                        className='w-full text-left px-1 py-0.5 hover:bg-purple-100 dark:hover:bg-purple-900 border-b border-gray-200 dark:border-gray-600 last:border-b-0 text-xs'
                                    >
                                        <div className='font-medium'>{u.displayName || u.username}</div>
                                        <div className='text-xs text-gray-500'>@{u.username}</div>
                                    </button>
                                ))}
                            </div>
                        )}
                        {selectedUserId && selectedUserName && (
                            <div className='mt-1 p-1 bg-purple-100 dark:bg-purple-900 rounded text-xs'>
                                ✓ {selectedUserName}
                                <button onClick={() => { setSelectedUserId(undefined); setSelectedUserName(undefined); }} className='ml-2 text-purple-600 dark:text-purple-300 hover:underline text-xs'>clear</button>
                            </div>
                        )}
                    </div>
                )}
            </FieldBox>

            {/* Description Mode */}
            <FieldBox isActive={activeField === 'description'}>
                <label className='text-xs font-medium text-gray-700 dark:text-gray-300'>Description</label>
                <div className='flex gap-1 mt-1'>
                    <ToggleButton label='Short' isActive={descriptionMode === 'short'} onClick={() => setDescriptionMode('short')} />
                    <ToggleButton label='Long' isActive={descriptionMode === 'long'} onClick={() => setDescriptionMode('long')} />
                    <ToggleButton label='Custom' isActive={descriptionMode === 'custom'} onClick={() => setDescriptionMode('custom')} />
                    <ToggleButton label='Random' isActive={descriptionMode === 'random'} onClick={() => setDescriptionMode('random')} />
                </div>

                {descriptionMode === 'custom' && (
                    <textarea
                        value={customDescription}
                        onChange={(e) => setCustomDescription(e.target.value)}
                        placeholder='Enter custom description...'
                        className='w-full mt-1 px-1 py-0.5 border border-gray-300 dark:border-gray-600 rounded text-xs bg-white dark:bg-slate-700 text-gray-900 dark:text-white resize-none'
                        rows={2}
                        onFocus={() => setActiveField('description')}
                    />
                )}
            </FieldBox>

            {/* Images & Location */}
            <div className='grid grid-cols-2 gap-2'>
                <FieldBox isActive={activeField === 'images'}>
                    <label className='text-xs font-medium text-gray-700 dark:text-gray-300'>Images</label>
                    <div className='flex gap-1 mt-1'>
                        {[1, 3, 5].map((num) => (
                            <ToggleButton
                                key={num}
                                label={String(num)}
                                isActive={imageCount === num}
                                onClick={() => setImageCount(num)}
                            />
                        ))}
                    </div>
                </FieldBox>

                <FieldBox isActive={activeField === 'location'}>
                    <label className='text-xs font-medium text-gray-700 dark:text-gray-300'>Location</label>
                    <div className='flex gap-1 mt-1'>
                        <ToggleButton label='Off' isActive={!includeLocation} onClick={() => setIncludeLocation(false)} />
                        <ToggleButton label='User' isActive={includeLocation && locationMode === 'user'} onClick={() => { setIncludeLocation(true); setLocationMode('user'); }} />
                        <ToggleButton label='Random' isActive={includeLocation && locationMode === 'random'} onClick={() => { setIncludeLocation(true); setLocationMode('random'); }} />
                    </div>
                </FieldBox>

                <FieldBox isActive={activeField === 'tags'}>
                    <label className='text-xs font-medium text-gray-700 dark:text-gray-300'>Tags</label>
                    <div className='flex gap-1 mt-1'>
                        <ToggleButton label='Off' isActive={tagsMode === 'off'} onClick={() => setTagsMode('off')} />
                        <ToggleButton label='Random' isActive={tagsMode === 'random'} onClick={() => setTagsMode('random')} />
                        <ToggleButton label='Custom' isActive={tagsMode === 'custom'} onClick={() => setTagsMode('custom')} />
                    </div>
                    {tagsMode === 'custom' && (
                        <input
                            type='text'
                            value={customTags}
                            onChange={(e) => setCustomTags(e.target.value)}
                            placeholder='Comma-separated, max 10'
                            className='w-full mt-1 px-1 py-0.5 border border-gray-300 dark:border-gray-600 rounded text-xs bg-white dark:bg-slate-700 text-gray-900 dark:text-white'
                        />
                    )}
                </FieldBox>
            </div>

            {/* Create Button */}
            <FieldBox isActive={activeField === 'create'}>
                <button
                    onClick={handleCreatePosts}
                    disabled={isPending}
                    className='w-full px-2 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white rounded text-sm font-medium transition-colors'
                >
                    {isPending ? 'Creating...' : `Create ${countMode === 'custom' ? customCount : countMode}`}
                </button>
            </FieldBox>

            {/* Other Actions */}
            <div className='flex gap-2 pt-1'>
                <button
                    onClick={handleRandomizeAll}
                    disabled={isPending}
                    className='flex-1 px-2 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded text-sm font-medium transition-colors'
                    title='Randomize all fields (R)'
                >
                    Random
                </button>
                <button
                    onClick={handleDeleteFakePosts}
                    disabled={isPending}
                    className='flex-1 px-2 py-1.5 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white rounded text-sm font-medium transition-colors'
                    title='Delete all fake posts'
                >
                    Delete
                </button>
            </div>
        </div>
    );
}
