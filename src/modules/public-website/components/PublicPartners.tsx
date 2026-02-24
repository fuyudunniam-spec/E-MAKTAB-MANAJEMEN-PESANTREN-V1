import React from 'react';
import { SanityService } from '../services/sanity.service';

const PARTNERS = [
    { name: 'Pesantren An-Nur', abbr: 'An-Nur' },
    { name: 'BAZNAS', abbr: 'BAZNAS' },
    { name: 'Bank Syariah Indonesia', abbr: 'BSI' },
    { name: 'Dompet Dhuafa', abbr: 'DD' },
    { name: 'KEMENAG RI', abbr: 'Kemenag' },
    { name: 'Rumah Zakat', abbr: 'RZ' },
    { name: 'LAZ Al-Azhar', abbr: 'Al-Azhar' },
];

interface PublicPartnersProps {
    data?: any[];
    variant?: 'marquee' | 'grid';
}

const PublicPartners: React.FC<PublicPartnersProps> = ({ data, variant = 'marquee' }) => {
    // If data is from Sanity, it will be an array of objects with {name, logo, url, description}
    const displayPartners = (data && data.length > 0)
        ? data.map(item => ({
            name: item.name || '',
            abbr: item.name ? item.name.split(' ').map((n: string) => n[0]).join('').toUpperCase() : 'P',
            logoUrl: item.logo ? SanityService.imageUrl(item.logo) : null,
            description: item.description || '',
            url: item.url || '#'
        }))
        : PARTNERS.map(p => ({ ...p, description: '', logoUrl: null, url: '#' }));

    if (variant === 'grid') {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {displayPartners.map((partner, i) => (
                    <div key={i} className="bg-[#fafafa] p-8 border border-slate-100 rounded-2xl hover:border-[#c09c53]/30 transition-all group">
                        <div className="flex items-center gap-4 mb-6">
                            {partner.logoUrl ? (
                                <img src={partner.logoUrl} alt={partner.name} className="h-10 w-auto" />
                            ) : (
                                <div className="w-10 h-10 rounded-full border border-[#c09c53]/30 flex items-center justify-center bg-[#c09c53]/10">
                                    <span className="text-xs font-bold text-[#c09c53]">{partner.abbr?.charAt(0)}</span>
                                </div>
                            )}
                            <h3 className="font-serif text-lg text-[#0f172a] group-hover:text-[#c09c53] transition-colors">{partner.name}</h3>
                        </div>
                        <p className="text-sm text-slate-500 leading-relaxed min-h-[3rem]">
                            {partner.description || 'Mitra strategis dalam mewujudkan misi kemandirian santri yatim Al-Bisri.'}
                        </p>
                    </div>
                ))}
            </div>
        );
    }

    const repeated = [...displayPartners, ...displayPartners, ...displayPartners];

    return (
        <section className="border-y border-slate-100 bg-white py-5 overflow-hidden relative">
            {/* Gradient masks */}
            <div className="absolute top-0 left-0 w-24 h-full bg-gradient-to-r from-white to-transparent z-10 pointer-events-none" />
            <div className="absolute top-0 right-0 w-24 h-full bg-gradient-to-l from-white to-transparent z-10 pointer-events-none" />

            <div className="flex whitespace-nowrap" style={{ animation: 'marqueeScroll 30s linear infinite' }}>
                {repeated.map((partner: any, i) => (
                    <a
                        key={i}
                        href={partner.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-3 mx-10 shrink-0 hover:scale-110 transition-transform"
                        title={partner.description}
                    >
                        {partner.logoUrl ? (
                            <img src={partner.logoUrl} alt={partner.name} className="h-6 w-auto grayscale opacity-50 hover:grayscale-0 hover:opacity-100 transition-all duration-300" />
                        ) : (
                            <>
                                <div className="w-7 h-7 rounded-full border border-[#c09c53]/30 flex items-center justify-center bg-[#c09c53]/5">
                                    <span className="text-[8px] font-bold text-[#c09c53] tracking-wider">{partner.abbr?.charAt(0)}</span>
                                </div>
                                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">
                                    {partner.name}
                                </span>
                            </>
                        )}
                    </a>
                ))}
            </div>

            <style>{`
                @keyframes marqueeScroll {
                    0%   { transform: translateX(0); }
                    100% { transform: translateX(-33.333%); }
                }
            `}</style>
        </section>
    );
};

export default PublicPartners;
