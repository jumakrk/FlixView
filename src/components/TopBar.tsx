'use client';

import styles from './TopBar.module.css';

export default function TopBar() {
    return (
        <header className={styles.topBar}>
            {/* Electron Title Bar Drag Region - Now pure and clean */}
            <div className={styles.dragRegion} />

            {/* Empty space below drag region in the header */}
            <div className={styles.content} />
        </header>
    );
}
