'use client';

import styles from './TopBar.module.css';

export default function TopBar() {
    return (
        <header className={styles.topBar}>
            <div className={styles.dragRegion} />
        </header>
    );
}
