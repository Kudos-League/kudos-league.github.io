import type { ProfileFormValues, UserDTO } from "@/shared/api/types";
import deepEqual from "@/shared/deepEqual";

export default function computeChanged(
    values: ProfileFormValues,
    dirty: any,
    user: UserDTO
) {
    const changed: any = {};

    if (dirty.email && values.email?.trim() && values.email.trim() !== (user.email || '')) {
        changed.email = values.email.trim();
    }

    if (dirty.about) {
        const about = (values.about || '').trim();
        if (about && about !== (user.settings?.about || '')) {
            changed.about = about;
        }
    }

    // tags (string[] -> [{ name }]) and compare to original
    if (dirty.tags) {
        const origTagObjs = (user.tags || []).map(t => ({ name: (t.name || '').trim() })).filter(t => t.name);
        const newTagObjs = (Array.isArray(values.tags) ? values.tags : [])
            .map((t: any) => (typeof t === 'string' ? t.trim() : t?.name?.trim()))
            .filter(Boolean)
            .map((name: string) => ({ name }));

        // only set if actually different
        if (!deepEqual(newTagObjs, origTagObjs)) {
            changed.tags = newTagObjs;
        }
    }

    // location (compare to original without client-only flags)
    if (dirty.location && values.location) {
        const newLoc = { ...values.location };
        delete (newLoc as any).changed;
        if (!deepEqual(newLoc, user.location || null)) {
            changed.location = newLoc;
        }
    }

    // avatar (file or URL)
    const avatarDirty = !!dirty.avatar || !!dirty.avatarURL;
    if (avatarDirty) {
        const arr = Array.isArray(values.avatar) ? values.avatar : (values.avatar ? [values.avatar] : []);
        const fileOrString = arr[0];

        if (fileOrString instanceof File) {
            changed.avatar = fileOrString;
        }
        else if (typeof values.avatarURL === 'string' && values.avatarURL.trim()) {
            changed.avatar = values.avatarURL.trim();
        }
    }

    return changed;
}