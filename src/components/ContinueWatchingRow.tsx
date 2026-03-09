'use client';

import { useData } from '@/context/DataContext';
import ContinueWatchingCard from './ContinueWatchingCard';
import styles from './ContinueWatchingRow.module.css';

export default function ContinueWatchingRow() {
    const { progress } = useData();

    // Filter items that have progress (watched > 0)
    // And ensure they are valid
    const continueWatchingList = progress
        .filter(p => p.watched_seconds > 0)
        .sort((a, b) => new Date(b.last_watched_at).getTime() - new Date(a.last_watched_at).getTime());

    if (continueWatchingList.length === 0) {
        return null;
    }

    return (
        <section className={styles.section}>
            <div className={styles.header}>
                <h2 className={styles.title}>Continue Watching</h2>
            </div>
            <div className={styles.rail}>
                {continueWatchingList.map((record) => (
                    <div key={`${record.media_type}-${record.media_id}`} className={styles.item}>
                        <ContinueWatchingCard record={record} />
                    </div>
                ))}
            </div>
        </section>
    );
}
