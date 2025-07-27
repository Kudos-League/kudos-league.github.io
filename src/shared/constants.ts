export const ASYNC_STORAGE_KEY__AUTH_DATA = 'KudosAPIToken';

export const AUTH_TOKEN_LIFETIME_MS = 1000 * 60 * 60 * 24 * 7; // One week

export enum Events {
    POST_CREATE = 'postCreate',
    MESSAGE_CREATE = 'messageCreate'
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
    const common = [
        FiltersEnum.All,
        FiltersEnum.Events
    ] as const;

    return isSelf
        ? [...common, FiltersEnum.RequestsGifts] as const
        : common;
};

export const MAX_FILE_SIZE_MB = 5;
export const MAX_FILE_COUNT = 5;

export const LOCAL_FMT = "yyyy-MM-dd'T'HH:mm";

export const isJwt = (tok: string) => tok.split('.').length === 3;
