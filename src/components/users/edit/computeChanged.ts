import type { ProfileFormValues } from '@/shared/api/types';
import deepEqual from '@/shared/deepEqual';

type Baseline = Pick<
    ProfileFormValues,
    | 'email'
    | 'username'
    | 'displayName'
    | 'about'
    | 'profession'
    | 'tags'
    | 'location'
    | 'avatar'
    | 'avatarURL'
>;

const norm = (v: unknown) => (typeof v === 'string' ? v.trim() : v);
const same = (a: unknown, b: unknown) => deepEqual(a ?? null, b ?? null);

/**
 * Pure diff: compares current form values against a stable baseline and
 * returns only the changed fields. No dependence on RHF dirtyFields or context.
 */
export default function computeChanged(
    values: ProfileFormValues,
    baseline: Baseline
) {
    const changed: Record<string, any> = {};

    // strings
    if (norm(values.email) !== norm(baseline.email))
        changed.email = values.email?.trim();
    if (norm(values.username) !== norm(baseline.username))
        changed.username = values.username?.trim();
    if (norm(values.displayName) !== norm(baseline.displayName))
        changed.displayName = values.displayName?.trim();
    if (norm(values.about) !== norm(baseline.about))
        changed.about = (values.about || '').trim();
    if (norm(values.profession) !== norm(baseline.profession))
        changed.profession = (values.profession || '').trim();

    // tags (compare as string[], emit string[])
    const nextTags = Array.isArray(values.tags) ? values.tags.map(String) : [];
    const baseTags = Array.isArray(baseline.tags)
        ? baseline.tags.map(String)
        : [];
    if (!deepEqual(nextTags, baseTags)) changed.tags = nextTags;

    // location (strip client-only flags before compare)
    const nextLoc = values.location ? { ...values.location } : null;
    if (nextLoc && 'changed' in nextLoc) delete (nextLoc as any).changed;
    const baseLoc = baseline.location ? { ...baseline.location } : null;
    if (baseLoc && 'changed' in baseLoc) delete (baseLoc as any).changed;
    if (!same(nextLoc, baseLoc)) changed.location = nextLoc;

    // avatar: prefer file; otherwise URL if present
    const arr = Array.isArray(values.avatar)
        ? values.avatar
        : values.avatar
            ? [values.avatar]
            : [];
    const file = arr[0];
    if (file instanceof File) {
        changed.avatar = file;
    }
    else if (
        typeof values.avatarURL === 'string' &&
        values.avatarURL.trim()
    ) {
        const urlNext = values.avatarURL.trim();
        const urlBase =
            typeof baseline.avatarURL === 'string'
                ? baseline.avatarURL.trim()
                : '';
        if (urlNext !== urlBase) changed.avatarURL = urlNext;
    }

    return changed;
}
