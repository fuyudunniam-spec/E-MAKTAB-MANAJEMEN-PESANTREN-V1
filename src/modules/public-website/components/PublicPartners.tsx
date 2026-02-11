import React from 'react';

const partners = [
    { name: "KEMENAG", color: "bg-slate-200" },
    { name: "BAZNAS", color: "bg-slate-200" },
    { name: "BANK BSI", color: "bg-slate-200" },
    { name: "UNIV. AL-AZHAR", color: "bg-slate-200" },
    { name: "DOMPET DHUAFA", color: "bg-slate-200" },
];

const PublicPartners: React.FC = () => {
    return (
        <section className="border-b border-slate-100 bg-white py-8 overflow-hidden relative group">
            {/* Gradient Masks for Fading Effect */}
            <div className="absolute top-0 left-0 w-20 h-full bg-gradient-to-r from-white to-transparent z-10"></div>
            <div className="absolute top-0 right-0 w-20 h-full bg-gradient-to-l from-white to-transparent z-10"></div>

            {/* Marquee Container */}
            <div className="flex whitespace-nowrap animate-marquee group-hover:[animation-play-state:paused]">
                {/* Logo Set 1 */}
                <div className="flex items-center gap-16 mx-8 opacity-70">
                    {partners.map((partner, index) => (
                        <div key={index} className="partner-logo flex items-center gap-2 font-bold text-slate-400 text-sm tracking-widest uppercase">
                            <div className={`w-8 h-8 ${partner.color} rounded-full`}></div> {partner.name}
                        </div>
                    ))}
                </div>

                {/* Logo Set 2 (Duplicate for Seamless Loop) */}
                <div className="flex items-center gap-16 mx-8 opacity-70">
                    {partners.map((partner, index) => (
                        <div key={`dup-${index}`} className="partner-logo flex items-center gap-2 font-bold text-slate-400 text-sm tracking-widest uppercase">
                            <div className={`w-8 h-8 ${partner.color} rounded-full`}></div> {partner.name}
                        </div>
                    ))}
                </div>
                {/* Logo Set 3 (Duplicate for Seamless Loop - Extra Safety) */}
                <div className="flex items-center gap-16 mx-8 opacity-70">
                    {partners.map((partner, index) => (
                        <div key={`dup2-${index}`} className="partner-logo flex items-center gap-2 font-bold text-slate-400 text-sm tracking-widest uppercase">
                            <div className={`w-8 h-8 ${partner.color} rounded-full`}></div> {partner.name}
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default PublicPartners;
