import React from 'react';

const PARTNERS = [
    { name: 'Pesantren An-Nur', abbr: 'An-Nur' },
    { name: 'BAZNAS', abbr: 'BAZNAS' },
    { name: 'Bank Syariah Indonesia', abbr: 'BSI' },
    { name: 'Dompet Dhuafa', abbr: 'DD' },
    { name: 'KEMENAG RI', abbr: 'Kemenag' },
    { name: 'Rumah Zakat', abbr: 'RZ' },
    { name: 'LAZ Al-Azhar', abbr: 'Al-Azhar' },
];

const PublicPartners: React.FC = () => {
    const repeated = [...PARTNERS, ...PARTNERS, ...PARTNERS];

    return (
        <section className="border-y border-slate-100 bg-white py-5 overflow-hidden relative">
            {/* Gradient masks */}
            <div className="absolute top-0 left-0 w-24 h-full bg-gradient-to-r from-white to-transparent z-10 pointer-events-none" />
            <div className="absolute top-0 right-0 w-24 h-full bg-gradient-to-l from-white to-transparent z-10 pointer-events-none" />

            <div className="flex whitespace-nowrap" style={{ animation: 'marqueeScroll 30s linear infinite' }}>
                {repeated.map((partner, i) => (
                    <div
                        key={i}
                        className="inline-flex items-center gap-3 mx-10 shrink-0"
                    >
                        <div className="w-7 h-7 rounded-full border border-[#c09c53]/30 flex items-center justify-center bg-[#c09c53]/5">
                            <span className="text-[8px] font-bold text-[#c09c53] tracking-wider">{partner.abbr.charAt(0)}</span>
                        </div>
                        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">
                            {partner.name}
                        </span>
                    </div>
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
