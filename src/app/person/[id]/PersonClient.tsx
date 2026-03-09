'use client';

import { useState, useEffect } from 'react';
import { fetchPersonDetails, fetchPersonCredits } from '@/lib/tmdb';
import styles from './Person.module.css';
import MovieCard from '@/components/MovieCard';
import { Calendar, MapPin, User } from 'lucide-react';
import BackButton from '@/components/BackButton';
import Image from 'next/image';

export default function PersonClient({ id }: { id: string }) {
    const [person, setPerson] = useState<any>(null);
    const [credits, setCredits] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadData() {
            setLoading(true);
            try {
                const [personData, creditsData] = await Promise.all([
                    fetchPersonDetails(id),
                    fetchPersonCredits(id)
                ]);

                setPerson(personData);
                setCredits(creditsData);
            } catch (error) {
                console.error('Failed to fetch person details:', error);
            } finally {
                setLoading(false);
            }
        }
        loadData();
    }, [id]);

    if (loading) {
        return (
            <div className={styles.container} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
                <div className="animate-pulse flex flex-col items-center">
                    <div className="w-12 h-12 border-4 border-violet-500 border-t-transparent rounded-full animate-spin"></div>
                    <span className="mt-4 text-violet-400 font-medium">Loading profile...</span>
                </div>
            </div>
        );
    }

    if (!person) return <div className="p-10 text-center">Person not found</div>;

    const profileBaseUrl = 'https://image.tmdb.org/t/p/h632';

    // Filter credits to have unique items and sort by popularity
    const uniqueCredits = credits?.cast
        ? Array.from(new Map(credits.cast.map((item: any) => [item.id, item])).values())
            .sort((a: any, b: any) => (b.vote_count || 0) - (a.vote_count || 0))
            .slice(0, 48)
        : [];

    return (
        <div className={styles.container}>
            <BackButton className={styles.backButton} />
            <div className={styles.header}>
                <div className={styles.profileSection}>
                    <div className={styles.imageContainer}>
                        {person.profile_path ? (
                            <Image
                                src={`${profileBaseUrl}${person.profile_path}`}
                                alt={person.name || 'Profile Picture'}
                                fill
                                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                className={styles.profileImage}
                            />
                        ) : (
                            <div className={styles.placeholder}>
                                <User size={80} className="opacity-20" />
                            </div>
                        )}
                    </div>

                    <div className={styles.info}>
                        <h1 className={styles.name}>{person.name}</h1>
                        <p className={styles.department}>{person.known_for_department}</p>

                        <div className={styles.meta}>
                            {person.birthday && (
                                <div className={styles.metaItem}>
                                    <Calendar size={18} />
                                    <span>Born: {new Date(person.birthday).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                                </div>
                            )}
                            {person.place_of_birth && (
                                <div className={styles.metaItem}>
                                    <MapPin size={18} />
                                    <span>{person.place_of_birth}</span>
                                </div>
                            )}
                        </div>

                        {person.biography && (
                            <div className={styles.biographySection}>
                                <h3 className={styles.subTitle}>Biography</h3>
                                <p className={styles.biography}>{person.biography}</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className={styles.content}>
                {uniqueCredits.length > 0 && (
                    <div className={styles.creditsSection}>
                        <h2 className={styles.sectionTitle}>Known For</h2>
                        <div className={styles.creditsGrid}>
                            {uniqueCredits.map((item: any) => (
                                <MovieCard key={item.id} movie={item} className="w-full" />
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
