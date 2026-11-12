'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Clapperboard, MonitorPlay } from 'lucide-react';
import { BRANDS } from '@/lib/brands';
import rowStyles from './SectionRow.module.css';
import styles from './BrandRow.module.css';
import BrandTile from './BrandTile';
import Rail from './ui/Rail';
import { Reveal } from './ui/Reveal';
import SegmentedControl from './ui/SegmentedControl';

type Group = 'streaming' | 'studio';

const GROUPS = [
    { value: 'streaming' as const, label: 'Streaming', icon: <MonitorPlay size={15} /> },
    { value: 'studio' as const, label: 'Studios', icon: <Clapperboard size={15} /> },
];

export default function BrandRow() {
    const [group, setGroup] = useState<Group>('streaming');
    const brands = BRANDS.filter(brand => brand.group === group);

    return (
        <section className={styles.section}>
            <Reveal className={rowStyles.header}>
                <h2 className={rowStyles.title}>Studios &amp; Streaming</h2>
                <SegmentedControl id="brand-group" size="sm" options={GROUPS} value={group} onChange={setGroup} />
            </Reveal>

            <Rail className={styles.rail}>
                <AnimatePresence mode="popLayout" initial={false}>
                    {brands.map((brand, index) => (
                        <motion.div
                            key={brand.id}
                            className="flex-shrink-0"
                            initial={{ opacity: 0, y: 24, scale: 0.94 }}
                            whileInView={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.94, transition: { duration: 0.15 } }}
                            viewport={{ once: true, margin: '0px 0px -6% 0px' }}
                            transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1], delay: index * 0.04 }}
                        >
                            <BrandTile brand={brand} />
                        </motion.div>
                    ))}
                </AnimatePresence>
            </Rail>
        </section>
    );
}
