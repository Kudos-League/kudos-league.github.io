type QueueItem = () => Promise<void>;

const rateLimitMap = new Map<string, number>(); // endpoint → unix timestamp when it's OK to retry
const queueMap = new Map<string, QueueItem[]>(); // endpoint → queued jobs
const retryInProgress = new Set<string>(); // endpoint → lock for active retry

function getNow() {
    return Math.floor(Date.now() / 1000);
}

function delay(ms: number) {
    return new Promise((res) => setTimeout(res, ms));
}

export async function withRateLimit(endpointKey: string, fn: () => Promise<any>) {
    const now = getNow();
    const retryAfter = rateLimitMap.get(endpointKey) ?? 0;

    // If we're still rate-limited, queue this call
    if (now < retryAfter) {
        console.info(`[RateLimit] Queuing call to ${endpointKey} until ${retryAfter} (now: ${now})`);

        return new Promise((resolve, reject) => {
            const queue = queueMap.get(endpointKey) ?? [];
            queue.push(async () => {
                try {
                    const result = await fn();
                    resolve(result);
                }
                catch (err) {
                    reject(err);
                }
            });
            queueMap.set(endpointKey, queue);
        });
    }

    // Try the request
    try {
        const result = await fn();
        return result;
    }
    catch (error: any) {
        if (error?.response?.status === 429) {
            const retryAfterHeader = error.response.headers['retry-after'];
            const resetHeader = error.response.headers['x-ratelimit-reset'];

            const retrySeconds = parseInt(retryAfterHeader ?? resetHeader ?? '1');
            const waitUntil = getNow() + retrySeconds;

            console.warn(`[RateLimit] 429 received on ${endpointKey}. Retrying after ${retrySeconds}s at ${waitUntil}`);
            rateLimitMap.set(endpointKey, waitUntil);

            // If another retry is already in progress, just queue and exit
            if (retryInProgress.has(endpointKey)) {
                console.info(`[RateLimit] Retry already in progress for ${endpointKey}. Queuing.`);
                return new Promise((resolve, reject) => {
                    const queue = queueMap.get(endpointKey) ?? [];
                    queue.push(async () => {
                        try {
                            const result = await fn();
                            resolve(result);
                        }
                        catch (err) {
                            reject(err);
                        }
                    });
                    queueMap.set(endpointKey, queue);
                });
            }

            retryInProgress.add(endpointKey);
            await delay(retrySeconds * 1000);

            console.info(`[RateLimit] Retrying original request for ${endpointKey}`);
            let result;
            try {
                result = await fn();
            }
            catch (err) {
                retryInProgress.delete(endpointKey);
                throw err;
            }

            // Process any queued calls
            const queue = queueMap.get(endpointKey);
            if (queue) {
                console.info(`[RateLimit] Flushing ${queue.length} queued calls for ${endpointKey}`);
                for (const job of queue) await job();
                queueMap.delete(endpointKey);
            }

            retryInProgress.delete(endpointKey);
            return result;
        }

        throw error;
    }
}
