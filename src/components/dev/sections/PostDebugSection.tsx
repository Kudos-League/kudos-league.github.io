import React, { useState, useEffect, useRef } from 'react';
import { useCreatePost } from '@/shared/api/mutations/posts';
import { useCreatePostAsUser } from '@/shared/api/mutations/dev';
import { useCategories } from '@/shared/api/queries/categories';
import { useAuth } from '@/contexts/useAuth';
import { useSearchUsersQuery, useAllUsersQuery } from '@/shared/api/queries/users';
import { apiMutate } from '@/shared/api/apiClient';
import { useQueryClient } from '@tanstack/react-query';
import { pushAlert } from '@/components/common/alertBus';

const SEED_IMAGES_DIR = '/seed-images/';

type PostType = 'gift' | 'request' | 'random';
type UserMode = 'current' | 'search' | 'random';
type LocationMode = 'user' | 'random';
type DescriptionMode = 'short' | 'long' | 'custom' | 'random';
type CountMode = '1' | '5' | '10' | 'custom';
type TagsMode = 'off' | 'random' | 'custom';
type HandshakesMode = 'off' | 'add' | 'random';
type HandshakeCountMode = 'off' | '1' | '3' | '5' | 'random';
type HandshakeStateMode = 'new' | 'accepted' | 'completed' | 'random';
type HandshakeSenderMode = 'random' | 'current';
type NavField = 'count' | 'type' | 'category' | 'user' | 'description' | 'images' | 'location' | 'tags' | 'handshakes' | 'handshakes-count' | 'handshakes-state' | 'handshakes-sender' | 'create' | 'random' | 'delete';

interface FormState {
    countMode: CountMode;
    customCount: number;
    customDescription: string;
    descriptionMode: DescriptionMode;
    imageCount: number;
    includeLocation: boolean;
    locationMode: LocationMode;
    tagsMode: TagsMode;
    customTags: string;
    selectedCategory: number | undefined;
    postType: PostType;
    userMode: UserMode;
    userSearchQuery: string;
    selectedUserId: number | undefined;
    handshakesMode: HandshakesMode;
    handshakeCountMode: HandshakeCountMode;
    handshakeStateMode: HandshakeStateMode;
    handshakeSenderMode: HandshakeSenderMode;
}

const PRESET_CONFIGS: Record<string, Partial<FormState>> = {
    'Quick Gift': {
        countMode: '1',
        postType: 'gift',
        descriptionMode: 'short',
        imageCount: 1,
        includeLocation: false,
        tagsMode: 'off',
        handshakesMode: 'off'
    },
    'Random Spam': {
        countMode: 'custom',
        customCount: 10,
        postType: 'random',
        descriptionMode: 'random',
        imageCount: 5,
        includeLocation: true,
        locationMode: 'random',
        tagsMode: 'random',
        handshakesMode: 'random',
        handshakeCountMode: 'random',
        handshakeStateMode: 'random',
        handshakeSenderMode: 'random'
    },
    'Bulk Test': {
        countMode: 'custom',
        customCount: 20,
        postType: 'random',
        descriptionMode: 'long',
        imageCount: 3,
        includeLocation: false,
        tagsMode: 'off',
        handshakesMode: 'off'
    },
    'Tagged Posts': {
        countMode: '5',
        postType: 'random',
        descriptionMode: 'short',
        imageCount: 1,
        includeLocation: false,
        tagsMode: 'random',
        handshakesMode: 'off'
    },
    'With Handshakes': {
        countMode: '5',
        postType: 'random',
        descriptionMode: 'random',
        imageCount: 3,
        includeLocation: false,
        tagsMode: 'off',
        handshakesMode: 'add',
        handshakeCountMode: 'random',
        handshakeStateMode: 'new',
        handshakeSenderMode: 'random'
    }
};

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

const STORAGE_KEY = 'kudos-dev-tools-state';
const LAST_SELECTION_KEY = 'kudos-dev-tools-last-selection';

const getInitialState = (): FormState => {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            return JSON.parse(stored);
        }
    }
    catch (e) {
        console.warn('Failed to load saved state:', e);
    }
    return {
        countMode: '1',
        customCount: 1,
        customDescription: '',
        descriptionMode: 'short',
        imageCount: 1,
        includeLocation: false,
        locationMode: 'user',
        tagsMode: 'off',
        customTags: '',
        selectedCategory: undefined,
        postType: 'gift',
        userMode: 'current',
        userSearchQuery: '',
        selectedUserId: undefined,
        handshakesMode: 'off',
        handshakeCountMode: 'off',
        handshakeStateMode: 'new',
        handshakeSenderMode: 'random'
    };
};

const getLastSelection = (): NavField | null => {
    try {
        return localStorage.getItem(LAST_SELECTION_KEY) as NavField | null;
    }
    catch (e) {
        return null;
    }
};

export default function PostDebugSection() {
    const initialState = getInitialState();
    const [countMode, setCountMode] = useState<'1' | '5' | '10' | 'custom'>(initialState.countMode);
    const [customCount, setCustomCount] = useState(initialState.customCount);
    const [customDescription, setCustomDescription] = useState(initialState.customDescription);
    const [descriptionMode, setDescriptionMode] = useState<DescriptionMode>(initialState.descriptionMode);
    const [imageCount, setImageCount] = useState(initialState.imageCount);
    const [includeLocation, setIncludeLocation] = useState(initialState.includeLocation);
    const [locationMode, setLocationMode] = useState<LocationMode>(initialState.locationMode);
    const [tagsMode, setTagsMode] = useState<TagsMode>(initialState.tagsMode);
    const [customTags, setCustomTags] = useState(initialState.customTags);
    const [seedImages, setSeedImages] = useState<string[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<number | undefined>(initialState.selectedCategory);
    const [postType, setPostType] = useState<PostType>(initialState.postType);
    const [userMode, setUserMode] = useState<UserMode>(initialState.userMode);
    const [userSearchQuery, setUserSearchQuery] = useState(initialState.userSearchQuery);
    const [selectedUserId, setSelectedUserId] = useState<number | undefined>(initialState.selectedUserId);
    const [selectedUserName, setSelectedUserName] = useState<string | undefined>();
    const [handshakesMode, setHandshakesMode] = useState<HandshakesMode>(initialState.handshakesMode);
    const [handshakeCountMode, setHandshakeCountMode] = useState<HandshakeCountMode>(initialState.handshakeCountMode);
    const [handshakeStateMode, setHandshakeStateMode] = useState<HandshakeStateMode>(initialState.handshakeStateMode);
    const [handshakeSenderMode, setHandshakeSenderMode] = useState<HandshakeSenderMode>(initialState.handshakeSenderMode);

    const lastSelection = getLastSelection();
    const [activeField, setActiveField] = useState<NavField>(lastSelection || 'count');
    const fieldRefs = React.useRef<Partial<Record<NavField, HTMLDivElement | HTMLButtonElement | null>>>({});
    const randomButtonRef = React.useRef<HTMLButtonElement>(null);
    const deleteButtonRef = React.useRef<HTMLButtonElement>(null);

    const qc = useQueryClient();
    const { mutate: createPost, isPending: isCreatingPost } = useCreatePost();
    const { mutate: createPostAsUser, isPending: isCreatingPostAsUser } = useCreatePostAsUser();
    const { data: categories } = useCategories();
    const { user } = useAuth();
    const { data: searchResults } = useSearchUsersQuery(userSearchQuery);
    const { data: allUsers } = useAllUsersQuery();

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

    // Save state to localStorage whenever it changes
    useEffect(() => {
        const state: FormState = {
            countMode,
            customCount,
            customDescription,
            descriptionMode,
            imageCount,
            includeLocation,
            locationMode,
            tagsMode,
            customTags,
            selectedCategory,
            postType,
            userMode,
            userSearchQuery,
            selectedUserId,
            handshakesMode,
            handshakeCountMode,
            handshakeStateMode,
            handshakeSenderMode
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    }, [countMode, customCount, customDescription, descriptionMode, imageCount, includeLocation, locationMode, tagsMode, customTags, selectedCategory, postType, userMode, userSearchQuery, selectedUserId, handshakesMode, handshakeCountMode, handshakeStateMode, handshakeSenderMode]);

    // Save active field selection and scroll into view
    useEffect(() => {
        localStorage.setItem(LAST_SELECTION_KEY, activeField);

        // Scroll the active field into view
        let fieldElement: HTMLElement | null = null;

        if (activeField === 'random') {
            fieldElement = randomButtonRef.current;
        }
        else if (activeField === 'delete') {
            fieldElement = deleteButtonRef.current;
        }
        else {
            fieldElement = fieldRefs.current[activeField];
        }

        if (fieldElement) {
            fieldElement.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
        }
    }, [activeField]);

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
        const usersToChooseFrom = allUsers || searchResults;
        if (usersToChooseFrom && usersToChooseFrom.length > 0) {
            const availableUsers = usersToChooseFrom.filter(u => u.id !== user?.id);
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

            // 'q' key to return to last selected field
            if (e.key === 'q' || e.key === 'Q') {
                e.preventDefault();
                const lastSel = getLastSelection();
                if (lastSel && lastSel !== activeField) {
                    setActiveField(lastSel);
                }
                return;
            }

            const allFields: NavField[] = ['count', 'type', 'category', 'user', 'description', 'images', 'location', 'tags', 'handshakes', 'handshakes-count', 'handshakes-state', 'handshakes-sender', 'create', 'random', 'delete'];

            // Filter out handshake sub-fields if not in 'add' mode
            const fields = allFields.filter(f => {
                if (f.startsWith('handshakes-') && handshakesMode !== 'add') {
                    return false;
                }
                return true;
            });

            let currentIndex = fields.indexOf(activeField);

            // If current field is not in filtered list (e.g., was a sub-field but mode changed), find nearest valid field
            if (currentIndex === -1) {
                currentIndex = fields.indexOf('handshakes');
                if (currentIndex === -1) {
                    currentIndex = 0;
                }
            }

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
                else if (activeField === 'random') {
                    handleRandomizeAll();
                }
                else if (activeField === 'delete') {
                    handleDeleteFakePosts();
                }
            }
        };

        window.addEventListener('keydown', handleKeyPress);
        return () => window.removeEventListener('keydown', handleKeyPress);
    }, [isPending, activeField, postType, userMode, descriptionMode, imageCount, includeLocation, locationMode, countMode, customCount, tagsMode, customTags, handshakesMode, handshakeCountMode, handshakeStateMode, handshakeSenderMode]);

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
        case 'handshakes': {
            setHandshakesMode('random');
            break;
        }
        case 'handshakes-count': {
            setHandshakeCountMode('random');
            break;
        }
        case 'handshakes-state': {
            setHandshakeStateMode('random');
            break;
        }
        case 'handshakes-sender': {
            setHandshakeSenderMode('random');
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
        case 'handshakes': {
            const modes: Array<HandshakesMode> = ['off', 'add', 'random'];
            const currentIndex = modes.indexOf(handshakesMode);
            setHandshakesMode(modes[(currentIndex + 1) % modes.length]);
            break;
        }
        case 'handshakes-count': {
            const modes: Array<HandshakeCountMode> = ['off', '1', '3', '5', 'random'];
            const currentIndex = modes.indexOf(handshakeCountMode);
            const nextIndex = (currentIndex + 1) % modes.length;
            setHandshakeCountMode(modes[nextIndex]);
            break;
        }
        case 'handshakes-state': {
            const modes: Array<HandshakeStateMode> = ['new', 'accepted', 'completed', 'random'];
            const currentIndex = modes.indexOf(handshakeStateMode);
            const nextIndex = (currentIndex + 1) % modes.length;
            setHandshakeStateMode(modes[nextIndex]);
            break;
        }
        case 'handshakes-sender': {
            const modes: Array<HandshakeSenderMode> = ['random', 'current'];
            const currentIndex = modes.indexOf(handshakeSenderMode);
            const nextIndex = (currentIndex + 1) % modes.length;
            setHandshakeSenderMode(modes[nextIndex]);
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
        case 'handshakes': {
            const modes: Array<HandshakesMode> = ['off', 'add', 'random'];
            const currentIndex = modes.indexOf(handshakesMode);
            setHandshakesMode(modes[(currentIndex - 1 + modes.length) % modes.length]);
            break;
        }
        case 'handshakes-count': {
            const modes: Array<HandshakeCountMode> = ['off', '1', '3', '5', 'random'];
            const currentIndex = modes.indexOf(handshakeCountMode);
            const prevIndex = (currentIndex - 1 + modes.length) % modes.length;
            setHandshakeCountMode(modes[prevIndex]);
            break;
        }
        case 'handshakes-state': {
            const modes: Array<HandshakeStateMode> = ['new', 'accepted', 'completed', 'random'];
            const currentIndex = modes.indexOf(handshakeStateMode);
            const prevIndex = (currentIndex - 1 + modes.length) % modes.length;
            setHandshakeStateMode(modes[prevIndex]);
            break;
        }
        case 'handshakes-sender': {
            const modes: Array<HandshakeSenderMode> = ['random', 'current'];
            const currentIndex = modes.indexOf(handshakeSenderMode);
            const prevIndex = (currentIndex - 1 + modes.length) % modes.length;
            setHandshakeSenderMode(modes[prevIndex]);
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

        // Truly random location: 50% chance of being enabled, and if enabled pick random mode
        const shouldIncludeLocation = Math.random() > 0.5;
        setIncludeLocation(shouldIncludeLocation);
        if (shouldIncludeLocation) {
            const locationModes: LocationMode[] = ['user', 'random'];
            setLocationMode(locationModes[Math.floor(Math.random() * locationModes.length)]);
        }

        // Truly random tags: pick a random mode and optionally set custom tags
        const tagsModes: Array<TagsMode> = ['off', 'random', 'custom'];
        const randomTagsMode = tagsModes[Math.floor(Math.random() * tagsModes.length)];
        setTagsMode(randomTagsMode);
        if (randomTagsMode === 'custom') {
            // Generate random tags for custom mode
            const tagPool = ['test', 'dev', 'random', 'sample', 'demo', 'example', 'temp', 'trial'];
            const tagCount = Math.floor(Math.random() * 4) + 1;
            const randomTags: string[] = [];
            for (let i = 0; i < tagCount; i++) {
                randomTags.push(tagPool[Math.floor(Math.random() * tagPool.length)]);
            }
            setCustomTags(randomTags.join(', '));
        }
        else {
            setCustomTags('');
        }

        setDescriptionMode('random');
        setCustomDescription('');

        // Randomize handshakes
        const handshakeModes: Array<HandshakesMode> = ['off', 'add', 'random'];
        setHandshakesMode(handshakeModes[Math.floor(Math.random() * handshakeModes.length)]);
        const countModes: Array<HandshakeCountMode> = ['off', '1', '3', '5', 'random'];
        setHandshakeCountMode(countModes[Math.floor(Math.random() * countModes.length)]);
        const stateModes: Array<HandshakeStateMode> = ['new', 'accepted', 'completed', 'random'];
        setHandshakeStateMode(stateModes[Math.floor(Math.random() * stateModes.length)]);
        const senderModes: Array<HandshakeSenderMode> = ['random', 'current'];
        setHandshakeSenderMode(senderModes[Math.floor(Math.random() * senderModes.length)]);
    };

    const applyPreset = (preset: Partial<FormState>) => {
        if (preset.countMode) setCountMode(preset.countMode);
        if (preset.customCount !== undefined) setCustomCount(preset.customCount);
        if (preset.customDescription !== undefined) setCustomDescription(preset.customDescription);
        if (preset.descriptionMode) setDescriptionMode(preset.descriptionMode);
        if (preset.imageCount !== undefined) setImageCount(preset.imageCount);
        if (preset.includeLocation !== undefined) setIncludeLocation(preset.includeLocation);
        if (preset.locationMode) setLocationMode(preset.locationMode);
        if (preset.tagsMode) setTagsMode(preset.tagsMode);
        if (preset.customTags !== undefined) setCustomTags(preset.customTags);
        if (preset.selectedCategory !== undefined) setSelectedCategory(preset.selectedCategory);
        if (preset.postType) setPostType(preset.postType);
        if (preset.userMode) setUserMode(preset.userMode);
        if (preset.handshakesMode) setHandshakesMode(preset.handshakesMode);
        if (preset.handshakeCountMode) setHandshakeCountMode(preset.handshakeCountMode);
        if (preset.handshakeStateMode) setHandshakeStateMode(preset.handshakeStateMode);
        if (preset.handshakeSenderMode) setHandshakeSenderMode(preset.handshakeSenderMode);
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

    const getRandomHandshakeState = (): HandshakeStateMode => {
        const states: HandshakeStateMode[] = ['new', 'accepted', 'completed'];
        return states[Math.floor(Math.random() * states.length)];
    };

    const createHandshakesForPost = async (postId: number, postOwnerId: number) => {
        if (handshakesMode === 'off') return;

        const finalHandshakeCount = handshakeCountMode === 'off'
            ? 0
            : handshakeCountMode === 'random'
                ? Math.floor(Math.random() * 10) + 1
                : parseInt(handshakeCountMode);

        if (finalHandshakeCount === 0) return;

        for (let h = 0; h < finalHandshakeCount; h++) {
            // Receiver is always the post owner
            const receiverId = postOwnerId;

            // Determine sender (configurable)
            let senderId = handshakeSenderMode === 'random'
                ? getRandomUserId()
                : user?.id;

            // CRITICAL: Sender can NEVER be the post creator
            // If sender equals receiver, pick a random user instead
            if (senderId === receiverId) {
                senderId = getRandomUserId();
            }

            // Ensure we have valid, different users
            if (!senderId || !receiverId || senderId === receiverId) continue;

            const finalState = handshakeStateMode === 'random'
                ? getRandomHandshakeState()
                : handshakeStateMode;

            try {
                await apiMutate('/dev/handshakes/create', 'post', {
                    postID: postId,
                    senderID: senderId,
                    receiverID: receiverId,
                    type: 'request',
                    status: finalState
                });
            }
            catch (error) {
                console.error('Failed to create dev handshake:', error);
            }
        }
    };

    const handleCreatePosts = async () => {
        const finalCount = countMode === 'custom' ? customCount : parseInt(countMode);
        const shouldCreateHandshakes = handshakesMode !== 'off';
        const createdPosts: Array<{ postId: number; ownerId: number }> = [];

        for (let i = 0; i < finalCount; i++) {
            const selectedImages = getRandomSeedImages(imageCount);
            const files: File[] = [];

            for (const imageUrl of selectedImages) {
                const file = await fetchFileFromUrl(imageUrl);
                if (file) files.push(file);
            }

            const location = includeLocation ? (
                locationMode === 'user' ? (user?.location ? {
                    regionID: user.location.regionID || null,
                    name: user.location.name || null
                } : undefined) : getRandomLocation()
            ) : undefined;

            const targetUserId = userMode === 'search' ? selectedUserId : userMode === 'random' ? getRandomUserId() : undefined;
            const finalPostType = postType === 'random' ? getRandomPostType() : postType;
            const finalDescription = getDescription();
            const finalTags = getTags();

            const postData = {
                title: `Dev Post ${i + 1}`,
                body: finalDescription,
                tags: finalTags,
                type: finalPostType,
                categoryID: selectedCategory || 1,
                files: files.length > 0 ? files : undefined,
                location
            };

            try {
                let postResponse;
                let postOwnerId: number;

                if (targetUserId) {
                    postResponse = await apiMutate('/dev/posts/as-user', 'post', { ...postData, userId: targetUserId }, { as: 'form' });
                    postOwnerId = targetUserId;
                }
                else {
                    postResponse = await apiMutate('/posts', 'post', postData, { as: 'form' });
                    postOwnerId = user?.id || 0;
                }

                if ((postResponse as any)?.id) {
                    const postId = (postResponse as any).id;
                    console.log(`[Dev] Post created with ID: ${postId} by user ${postOwnerId}`);
                    createdPosts.push({ postId, ownerId: postOwnerId });
                }
            }
            catch (error) {
                console.error(`[Dev] Failed to create post ${i + 1}:`, error);
            }
        }

        // If handshakes are enabled and we have posts, create handshakes
        if (shouldCreateHandshakes && createdPosts.length > 0) {
            console.log(`[Dev] Creating handshakes for ${createdPosts.length} posts:`, createdPosts);
            for (const { postId, ownerId } of createdPosts) {
                await createHandshakesForPost(postId, ownerId);
            }
            // Invalidate all post and handshake related caches to ensure UI updates
            // Use exact: false to match partial keys since infinite query includes filters object
            qc.invalidateQueries({ queryKey: ['posts'], exact: false });
            qc.invalidateQueries({ queryKey: ['posts', 'infinite'], exact: false });
            qc.invalidateQueries({ queryKey: ['handshakes'] });
        }
        else if (shouldCreateHandshakes) {
            console.warn('[Dev] Handshakes enabled but no post IDs captured');
        }

        // Show success toast
        if (createdPosts.length > 0) {
            const message = createdPosts.length === 1
                ? `✨ Post created successfully!`
                : `✨ ${createdPosts.length} posts created successfully!`;
            pushAlert({ type: 'success', message });
        }
        else {
            pushAlert({ type: 'danger', message: '❌ Failed to create any posts. Check console for errors.' });
        }
    };

    const FieldBox = ({ children, isActive, fieldName }: { children: React.ReactNode; isActive: boolean; fieldName: NavField }) => (
        <div
            ref={(el) => {
                if (el) fieldRefs.current[fieldName] = el;
            }}
            className={`p-2 rounded border-2 transition-colors ${
                isActive
                    ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/30 ring-2 ring-purple-400 ring-opacity-50'
                    : 'border-gray-300 dark:border-gray-600'
            }`}
        >
            {children}
        </div>
    );

    const ActionButton = React.forwardRef<HTMLButtonElement, { label: string; onClick: () => void; isActive: boolean; variant?: 'secondary' | 'primary' | 'destructive'; disabled?: boolean }>(
        ({ label, onClick, isActive, variant = 'secondary', disabled }, ref) => {
            const baseClasses = 'w-full px-2 py-1.5 rounded text-sm font-medium transition-all';
            const activeClasses = isActive ? 'ring-2 ring-offset-2 ring-purple-400' : '';
            const colorClasses = variant === 'primary'
                ? `${isActive ? 'bg-purple-700' : 'bg-purple-600'} hover:bg-purple-700 disabled:bg-gray-400 text-white`
                : variant === 'secondary'
                    ? `${isActive ? 'bg-blue-700' : 'bg-blue-600'} hover:bg-blue-700 disabled:bg-gray-400 text-white`
                    : `${isActive ? 'bg-red-700' : 'bg-red-600'} hover:bg-red-700 disabled:bg-gray-400 text-white`;
            return (
                <button
                    ref={ref}
                    onClick={onClick}
                    disabled={disabled}
                    className={`${baseClasses} ${colorClasses} ${activeClasses}`}
                >
                    {label}
                </button>
            );
        }
    );
    ActionButton.displayName = 'ActionButton';

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
                <div className='text-gray-600 dark:text-gray-400 text-xs mt-1'>Navigate: ↑↓, Change: ←→, Randomize: R, Repeat: Q, Execute: Enter</div>
                <div className='mt-1 text-xs text-gray-600 dark:text-gray-400'>As: <span className='font-semibold text-gray-900 dark:text-white'>{user?.displayName || user?.username || 'Current User'}</span></div>
            </div>

            {/* Preset Configurations */}
            <div className='bg-blue-50 dark:bg-blue-900/20 p-2 rounded'>
                <div className='text-xs font-medium text-gray-700 dark:text-gray-300 mb-2'>Quick Presets</div>
                <div className='flex flex-wrap gap-1'>
                    {Object.entries(PRESET_CONFIGS).map(([name, config]) => (
                        <button
                            key={name}
                            onClick={() => applyPreset(config)}
                            disabled={isPending}
                            className='px-2 py-1 text-xs bg-blue-200 dark:bg-blue-900 hover:bg-blue-300 dark:hover:bg-blue-800 disabled:bg-gray-400 text-gray-900 dark:text-gray-100 rounded transition-colors whitespace-nowrap flex-shrink-0'
                        >
                            {name}
                        </button>
                    ))}
                </div>
            </div>

            {/* Count */}
            <FieldBox isActive={activeField === 'count'} fieldName='count'>
                <label className='text-xs font-medium text-gray-700 dark:text-gray-300'>Count</label>
                <div className='flex flex-wrap gap-1 mt-1'>
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
            <FieldBox isActive={activeField === 'type'} fieldName='type'>
                <label className='text-xs font-medium text-gray-700 dark:text-gray-300'>Type</label>
                <div className='flex flex-wrap gap-1 mt-1'>
                    <ToggleButton label='Gift' isActive={postType === 'gift'} onClick={() => setPostType('gift')} />
                    <ToggleButton label='Request' isActive={postType === 'request'} onClick={() => setPostType('request')} />
                    <ToggleButton label='Random' isActive={postType === 'random'} onClick={() => setPostType('random')} />
                </div>
            </FieldBox>

            {/* Category */}
            <FieldBox isActive={activeField === 'category'} fieldName='category'>
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
            <FieldBox isActive={activeField === 'user'} fieldName='user'>
                <label className='text-xs font-medium text-gray-700 dark:text-gray-300'>Post As</label>
                <div className='flex flex-wrap gap-1 mt-1'>
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
            <FieldBox isActive={activeField === 'description'} fieldName='description'>
                <label className='text-xs font-medium text-gray-700 dark:text-gray-300'>Description</label>
                <div className='flex flex-wrap gap-1 mt-1'>
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
                <FieldBox isActive={activeField === 'images'} fieldName='images'>
                    <label className='text-xs font-medium text-gray-700 dark:text-gray-300'>Images</label>
                    <div className='flex flex-wrap gap-1 mt-1'>
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

                <FieldBox isActive={activeField === 'location'} fieldName='location'>
                    <label className='text-xs font-medium text-gray-700 dark:text-gray-300'>Location</label>
                    <div className='flex flex-wrap gap-1 mt-1'>
                        <ToggleButton label='Off' isActive={!includeLocation} onClick={() => setIncludeLocation(false)} />
                        <ToggleButton label='User' isActive={includeLocation && locationMode === 'user'} onClick={() => { setIncludeLocation(true); setLocationMode('user'); }} />
                        <ToggleButton label='Random' isActive={includeLocation && locationMode === 'random'} onClick={() => { setIncludeLocation(true); setLocationMode('random'); }} />
                    </div>
                </FieldBox>

                <FieldBox isActive={activeField === 'tags'} fieldName='tags'>
                    <label className='text-xs font-medium text-gray-700 dark:text-gray-300'>Tags</label>
                    <div className='flex flex-wrap gap-1 mt-1'>
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

            {/* Handshakes */}
            <FieldBox isActive={activeField === 'handshakes'} fieldName='handshakes'>
                <label className='text-xs font-medium text-gray-700 dark:text-gray-300'>Handshakes</label>
                <div className='flex flex-wrap gap-1 mt-1'>
                    <ToggleButton label='Off' isActive={handshakesMode === 'off'} onClick={() => setHandshakesMode('off')} />
                    <ToggleButton label='Add' isActive={handshakesMode === 'add'} onClick={() => setHandshakesMode('add')} />
                    <ToggleButton label='Random' isActive={handshakesMode === 'random'} onClick={() => setHandshakesMode('random')} />
                </div>

                {handshakesMode === 'add' && (
                    <div className='mt-2 pt-2 border-t border-gray-300 dark:border-gray-600 space-y-2'>
                        {/* Count Mode */}
                        <div
                            ref={(el) => {
                                if (el) fieldRefs.current['handshakes-count'] = el;
                            }}
                            className={`p-2 rounded border-2 transition-colors ${
                                activeField === 'handshakes-count'
                                    ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/30 ring-2 ring-purple-400 ring-opacity-50'
                                    : 'border-gray-200 dark:border-gray-700'
                            }`}
                            onClick={() => setActiveField('handshakes-count')}
                        >
                            <label className='text-xs font-medium text-gray-600 dark:text-gray-400 block mb-1'>Per Post Count</label>
                            <div className='flex flex-wrap gap-1'>
                                <ToggleButton label='Off' isActive={handshakeCountMode === 'off'} onClick={() => { setActiveField('handshakes-count'); setHandshakeCountMode('off'); }} />
                                <ToggleButton label='1' isActive={handshakeCountMode === '1'} onClick={() => { setActiveField('handshakes-count'); setHandshakeCountMode('1'); }} />
                                <ToggleButton label='3' isActive={handshakeCountMode === '3'} onClick={() => { setActiveField('handshakes-count'); setHandshakeCountMode('3'); }} />
                                <ToggleButton label='5' isActive={handshakeCountMode === '5'} onClick={() => { setActiveField('handshakes-count'); setHandshakeCountMode('5'); }} />
                                <ToggleButton label='Random' isActive={handshakeCountMode === 'random'} onClick={() => { setActiveField('handshakes-count'); setHandshakeCountMode('random'); }} />
                            </div>
                        </div>

                        {/* State Mode */}
                        <div
                            ref={(el) => {
                                if (el) fieldRefs.current['handshakes-state'] = el;
                            }}
                            className={`p-2 rounded border-2 transition-colors ${
                                activeField === 'handshakes-state'
                                    ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/30 ring-2 ring-purple-400 ring-opacity-50'
                                    : 'border-gray-200 dark:border-gray-700'
                            }`}
                            onClick={() => setActiveField('handshakes-state')}
                        >
                            <label className='text-xs font-medium text-gray-600 dark:text-gray-400 block mb-1'>State</label>
                            <div className='flex flex-wrap gap-1'>
                                <ToggleButton label='New' isActive={handshakeStateMode === 'new'} onClick={() => { setActiveField('handshakes-state'); setHandshakeStateMode('new'); }} />
                                <ToggleButton label='Accepted' isActive={handshakeStateMode === 'accepted'} onClick={() => { setActiveField('handshakes-state'); setHandshakeStateMode('accepted'); }} />
                                <ToggleButton label='Completed' isActive={handshakeStateMode === 'completed'} onClick={() => { setActiveField('handshakes-state'); setHandshakeStateMode('completed'); }} />
                                <ToggleButton label='Random' isActive={handshakeStateMode === 'random'} onClick={() => { setActiveField('handshakes-state'); setHandshakeStateMode('random'); }} />
                            </div>
                        </div>

                        {/* Sender User Mode */}
                        <div
                            ref={(el) => {
                                if (el) fieldRefs.current['handshakes-sender'] = el;
                            }}
                            className={`p-2 rounded border-2 transition-colors ${
                                activeField === 'handshakes-sender'
                                    ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/30 ring-2 ring-purple-400 ring-opacity-50'
                                    : 'border-gray-200 dark:border-gray-700'
                            }`}
                            onClick={() => setActiveField('handshakes-sender')}
                        >
                            <label className='text-xs font-medium text-gray-600 dark:text-gray-400 block mb-1'>Sender</label>
                            <div className='flex flex-wrap gap-1'>
                                <ToggleButton label='Random' isActive={handshakeSenderMode === 'random'} onClick={() => { setActiveField('handshakes-sender'); setHandshakeSenderMode('random'); }} />
                                <ToggleButton label='Current' isActive={handshakeSenderMode === 'current'} onClick={() => { setActiveField('handshakes-sender'); setHandshakeSenderMode('current'); }} />
                            </div>
                        </div>
                    </div>
                )}
            </FieldBox>

            {/* Create Button */}
            <FieldBox isActive={activeField === 'create'} fieldName='create'>
                <button
                    onClick={handleCreatePosts}
                    disabled={isPending}
                    className={`w-full px-2 py-2 rounded text-sm font-medium transition-all ${
                        activeField === 'create' ? 'ring-2 ring-offset-2 ring-purple-400' : ''
                    } ${
                        isPending
                            ? 'bg-gray-400 text-white'
                            : 'bg-purple-600 hover:bg-purple-700 text-white'
                    }`}
                >
                    {isPending ? 'Creating...' : `Create ${countMode === 'custom' ? customCount : countMode}`}
                </button>
            </FieldBox>

            {/* Other Actions */}
            <div className='flex gap-2 pt-1'>
                <div className='flex-1'>
                    <ActionButton
                        ref={randomButtonRef}
                        label='Random'
                        onClick={handleRandomizeAll}
                        isActive={activeField === 'random'}
                        variant='secondary'
                        disabled={isPending}
                    />
                </div>
                <div className='flex-1'>
                    <ActionButton
                        ref={deleteButtonRef}
                        label='Delete'
                        onClick={handleDeleteFakePosts}
                        isActive={activeField === 'delete'}
                        variant='destructive'
                        disabled={isPending}
                    />
                </div>
            </div>
        </div>
    );
}
