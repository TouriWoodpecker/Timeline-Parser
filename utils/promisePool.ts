// utils/promisePool.ts

/**
 * Executes a pool of promise-returning tasks with a specific concurrency limit.
 * This prevents overwhelming APIs or the browser with too many simultaneous requests.
 *
 * @param items The array of items to process.
 * @param task The async function to execute for each item. It receives the item and its index.
 * @param concurrency The maximum number of tasks to run at the same time.
 * @param onProgress An optional callback that fires each time a task is completed.
 * @returns A promise that resolves to an array of results in the same order as the input items.
 */
export async function promisePool<T, U>(
    items: T[],
    task: (item: T, index: number) => Promise<U>,
    concurrency: number,
    onProgress?: (progress: { completed: number; total: number }) => void
): Promise<U[]> {
    const results: U[] = new Array(items.length);
    let completed = 0;
    let index = 0;
    const total = items.length;

    const worker = async () => {
        while (index < total) {
            const currentIndex = index++;
            if (currentIndex >= total) break;

            const item = items[currentIndex];
            
            try {
                const result = await task(item, currentIndex);
                results[currentIndex] = result;
            } catch (e) {
                // Propagate the error to cause Promise.all to reject, stopping all workers.
                throw e;
            }
            
            completed++;
            if (onProgress) {
                onProgress({ completed, total });
            }
        }
    };

    const workers = Array(concurrency).fill(null).map(worker);
    
    // This will wait for all workers to complete their assigned tasks.
    // If any worker's promise rejects, Promise.all will immediately reject.
    await Promise.all(workers);

    return results;
}
