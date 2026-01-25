export const ASYNC_STORAGE_KEY__AUTH_DATA = 'KudosAPIToken';

export const AUTH_TOKEN_LIFETIME_MS = 1000 * 60 * 60 * 24 * 7; // One week
export const INVITES_ADMIN_ONLY = false;

export enum Events {
    POST_CREATE = 'postCreate',
    POST_UPDATE = 'postUpdate',
    MESSAGE_CREATE = 'messageCreate',
    MESSAGE_DELETE = 'messageDelete',
    NOTIFICATION_CREATE = 'notificationCreate',
    KUDOS_UPDATE = 'kudosUpdate',
    POST_AUTO_CLOSE_ALERT = 'postAutoCloseAlert'
}

export enum FiltersEnum {
    All = 'all',
    Gift = 'gift',
    Request = 'request',
    RequestsGifts = 'Requests / Gifts',
    Events = 'events'
}

export const Filters = [
    FiltersEnum.All,
    FiltersEnum.Gift,
    FiltersEnum.Request,
    FiltersEnum.RequestsGifts,
    FiltersEnum.Events
] as const;

export type FilterType = (typeof Filters)[number];

export const getFilters = (isSelf: boolean) => {
    const common = [FiltersEnum.All, FiltersEnum.Events] as const;

    return isSelf ? ([...common, FiltersEnum.RequestsGifts] as const) : common;
};

export const MAX_FILE_SIZE_MB = 5;
export const MAX_FILE_COUNT = 5;

export const SITE_FEEDBACK_CATEGORIES = [
    'general',
    'feature-request',
    'praise',
    'usability',
    'other'
] as const;

export const BUG_REPORT_CATEGORIES = [
    'posts',
    'profiles',
    'messaging',
    'events',
    'donations',
    'leaderboard',
    'other'
] as const;

export const FEEDBACK_BASE_REWARD = 5;

export const LOCAL_FMT = "yyyy-MM-dd'T'HH:mm";

export const isJwt = (tok: string) => tok.split('.').length === 3;

export const GOOGLE_LIBRARIES = ['places', 'marker'] as const;
