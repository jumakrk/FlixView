'use client';

import React from 'react';

interface BrandLogoProps {
    brandId: string;
    className?: string;
    width?: number | string;
    height?: number | string;
}

const LOGO_PATHS: Record<string, string> = {
    // Original Streaming Networks
    'netflix': '/wwemzKWzjKYJFfCeiB57q3r4Bcm.png',
    'disney': '/1edZOYAfoyZyZ3rklNSiUpXX30Q.png',
    'apple-tv': '/bngHRFi794mnMq34gfVcm9nDxN1.png',
    'prime-video': '/w7HfLNm9CWwRmAMU58udl2L7We7.png',
    'hulu': '/pqUTCleNUiTLAVlelGxUgWn1ELh.png',
    'hbo': '/tuomPhY2UtuPTqqFnKMVHvSb724.png',
    'paramount-plus': '/fi83B1oztoS47xxcemFdPMhIzK.png',
    'peacock': '/gIAcGTjKKr0KOHL5s4O36roJ8p7.png',
    'bbc-one': '/uJjcCg3O4DMEjM0xtno9OWFciRP.png',
    'crunchyroll': '/qqyXcZlJQKlRmAD1TCKV7mGLQlt.png',
    
    // Original Studios
    'marvel': '/837VMM4wOkODc1idNxGT0KQJlej.png',
    'dc': '/2Tc1P3Ac8M479naPp1kYT3izLS5.png',
    'warner-bros': '/zhD3hhtKB5qyv7ZeL4uLpNxgMVU.png',
    'pixar': '/1TjvGVDMYsj6JBxOAkUHpPEwLf7.png',
    'disney-pictures': '/wdrCwmRnLFJhEoH8GSfymY85KHT.png',
    'universal': '/8lvHyhjr8oUKOOy2dKXoALWKdp0.png',
    'sony-pictures': '/mtp1fvZbe4H991Ka1HOORl572VH.png',
    'columbia': '/71BqEFAF4V3qjjMPCpLuyJFB9A.png',
    'dreamworks': '/zcKhWbxFJ4CohZ9dLBMxmOArTVn.png',

    // Additional Studios & Networks
    'mgm': '/usUnaYV6hQnlVAXP6r4HwrlLFPG.png',
    'lionsgate': '/cisLn1YAUuptXVBa0xjq7ST9cH0.png',
    'a24': '/1ZXsGaFPgrgS6ZZGS37AqD5uU12.png',
    'ghibli': '/uFuxPEZRUcBTEiYIxjHJq62Vr77.png',
    'new-line': '/2ycs64eqV5rqKYHyQK0GVoKGvfX.png',
    'lucasfilm': '/tlVSws0RvvtPBwViUyOFAO0vcQS.png',
    'searchlight': '/4RgIPr55kBakgupWkzdDxqXJEqr.png'
};

// These logos are black/dark in TMDB database.
// We apply CSS invert filter so they are visible as white logos on our dark background.
const INVERT_IDS = new Set([
    'apple-tv',
    'hbo',
    'dc',
    'pixar',
    'disney-pictures',
    'universal',
    'sony-pictures',
    'columbia',
    'dreamworks',
    'lionsgate',
    'a24',
    'new-line',
    'lucasfilm',
    'searchlight'
]);

export default function BrandLogo({ brandId, className = '', width = '100%', height = '100%' }: BrandLogoProps) {
    const logoPath = LOGO_PATHS[brandId];

    if (!logoPath) {
        return (
            <div className="text-white font-black text-center select-none uppercase tracking-wider text-sm">
                {brandId}
            </div>
        );
    }

    const imageUrl = `https://image.tmdb.org/t/p/w300${logoPath}`;
    const shouldInvert = INVERT_IDS.has(brandId);

    // Apply brightness / invert filter to make dark logos white
    const filterStyle = shouldInvert 
        ? { filter: 'brightness(0) invert(1)', objectFit: 'contain' as const } 
        : { objectFit: 'contain' as const };

    return (
        <img
            src={imageUrl}
            alt={`${brandId} logo`}
            className={className}
            style={{ 
                width, 
                height, 
                ...filterStyle,
                maxHeight: '100%',
                maxWidth: '100%'
            }}
            loading="lazy"
        />
    );
}
