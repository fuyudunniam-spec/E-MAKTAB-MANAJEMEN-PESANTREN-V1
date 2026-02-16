import React, { useState, useEffect, useRef } from 'react';
import { ArrowRight, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getPublicImpactData } from '../services/publicKeuangan.service';
import { SanityService } from '../../public-website/services/sanity.service';

interface PublicHeroProps {
    data?: any;
}

const SLIDES = [
    {
        id: 1,
        image: "https://images.unsplash.com/photo-1585036156171-384164a8c675?q=80&w=2000",
        badge: "Binaan Pesantren Mahasiswa An-Nur",
        title: "Memuliakan",
        titleItalic: "Harkat Kemanusiaan.",
        desc: "Ikhtiar tulus untuk mengangkat derajat sesama melalui pendidikan dan kasih sayang, memastikan setiap jiwa mendapatkan kesempatan yang setara.",
        ctaText: "Tentang Kami",
        ctaLink: "/tentang-kami",
        ctaStyle: "bg-white text-navy-950"
    },
    {
        id: 2,
        image: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=2000",
        subBadge: "Sinergi & Transparansi",
        title: "Dikelola dengan",
        titleItalic: "Amanah Profesional.",
        desc: "Kolaborasi manajemen kelembagaan bersama Pesantren Mahasiswa An-Nur serta pengelolaan transparansi informasi memastikan setiap amanah publik terlaporkan dengan jujur dan akuntabel.",
        ctaText: "Laporan Transparansi",
        ctaLink: "/transparansi",
        ctaStyle: "bg-white text-navy-950"
    },
    {
        id: 3,
        image: "https://images.unsplash.com/photo-1577896851231-70ef18881754?q=80&w=2000",
        subBadge: "Pendidikan Holistik",
        title: "Mencetak Generasi",
        titleItalic: "Berhati Mulia.",
        desc: "Kurikulum yang menyeimbangkan kecerdasan intelektual dan kematangan spiritual. Membekali santri yatim agar mandiri dan berdaya saing.",
        ctaText: "Lihat Program",
        ctaLink: "/akademik",
        ctaStyle: "bg-accent-gold text-navy-950"
    }
];

const PublicHero: React.FC<PublicHeroProps> = ({ data }) => {
    // We keep this to show we haven't lost the capability, even if we just use static for now as per design
    const { data: impactData } = useQuery({
        queryKey: ['public-impact-data'],
        queryFn: () => getPublicImpactData()
    });

    const [currentSlide, setCurrentSlide] = useState(0);
    const [isAnimating, setIsAnimating] = useState(false);

    useEffect(() => {
        const interval = setInterval(() => {
            const length = data?.length || 1;
            handleSlideChange((currentSlide + 1) % length);
        }, 8000);
        return () => clearInterval(interval);
    }, [currentSlide]);

    const handleSlideChange = (index: number) => {
        if (isAnimating) return; // Prevent rapid clicking
        // setIsAnimating(true); // Optional: if we want to lock controls
        setCurrentSlide(index);
        // setTimeout(() => setIsAnimating(false), 1000); 
    };

    return (
        <section className="relative h-screen w-full bg-navy-950 overflow-hidden font-jakarta">
            {/* Slides Container */}
            <div id="hero-slider" className="relative h-full w-full">
                {(data || []).map((slide: any, index: number) => {
                    const isActive = index === currentSlide;
                    // Fallback for image
                    const bgImage = slide.externalImageUrl || (slide.backgroundImage ? SanityService.imageUrl(slide.backgroundImage) : '');

                    return (
                        <div
                            key={slide._id || index}
                            className={`absolute inset-0 w-full h-full transition-all duration-1000 ease-in-out ${isActive ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}
                            style={{ visibility: isActive ? 'visible' : 'hidden' }}
                        >
                            {/* Overlay */}
                            <div className="absolute inset-0 bg-gradient-to-r from-navy-950/90 via-navy-950/60 to-transparent z-10"></div>

                            {/* Background Image with Scale Animation */}
                            <img
                                src={bgImage}
                                className={`absolute inset-0 w-full h-full object-cover transition-transform duration-[10000ms] ease-linear ${isActive ? 'scale-100' : 'scale-110'}`}
                                alt={slide.title}
                            />

                            {/* Content */}
                            <div className="relative z-20 h-full max-w-[1440px] mx-auto px-6 md:px-10 flex flex-col justify-center">
                                <div className={`max-w-3xl transition-all duration-1000 delay-300 transform ${isActive ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>

                                    {slide.badge && (
                                        <div className="inline-flex items-center gap-3 mb-8 bg-white/10 backdrop-blur-sm border border-white/20 px-4 py-2 rounded-full">
                                            <span className="w-2 h-2 rounded-full bg-accent-gold animate-pulse"></span>
                                            <span className="text-[10px] text-white uppercase tracking-widest">{slide.badge}</span>
                                        </div>
                                    )}

                                    {slide.subBadge && (
                                        <span className="text-accent-gold text-xs font-bold uppercase tracking-[0.3em] mb-6 block border-l-2 border-accent-gold pl-4">
                                            {slide.subBadge}
                                        </span>
                                    )}

                                    <h1 className="font-playfair text-5xl md:text-7xl text-white leading-[1.1] mb-8">
                                        {slide.title} <br />
                                        <span className="italic text-accent-gold">{slide.titleItalic}</span>
                                    </h1>

                                    <p className="text-lg text-white/80 font-light leading-relaxed mb-10 max-w-xl">
                                        {slide.subtitle}
                                    </p>

                                    <div className="flex gap-6">
                                        {slide.ctaText && (
                                            <Link
                                                to={slide.ctaLink || '#'}
                                                className={`${slide.ctaStyle || 'bg-white text-navy-950'} relative overflow-hidden px-10 py-4 font-bold uppercase tracking-widest text-xs transition-all hover:scale-105 group`}
                                            >
                                                <span className="relative z-10">{slide.ctaText}</span>
                                            </Link>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Slider Navigation Controls */}
            <div className="absolute bottom-12 left-6 md:left-10 z-30 flex items-center gap-10">
                <div id="slider-dots" className="flex gap-4">
                    {(data || []).map((_: any, idx: number) => (
                        <button
                            key={idx}
                            onClick={() => handleSlideChange(idx)}
                            className={`w-3 h-3 rounded-full transition-all duration-500 ${currentSlide === idx ? 'bg-accent-gold scale-125' : 'bg-white/30 hover:bg-white/50'}`}
                            aria-label={`Go to slide ${idx + 1}`}
                        ></button>
                    ))}
                </div>
                <div className="hidden md:block h-[1px] w-24 bg-white/20"></div>
                <div className="hidden md:block text-white/50 text-[10px] font-bold uppercase tracking-widest">
                    Jelajahi Profil
                </div>
            </div>

            {/* Floating Quick Stats */}
            <div className="absolute bottom-12 right-6 md:right-10 z-30 hidden lg:flex gap-12 text-white border-l border-white/20 pl-12">
                <div>
                    <p className="text-2xl font-playfair text-accent-gold">100%</p>
                    <p className="text-[8px] uppercase tracking-widest font-bold opacity-60">Beasiswa Penuh</p>
                </div>
                <div>
                    <p className="text-2xl font-playfair text-accent-gold">An-Nur</p>
                    <p className="text-[8px] uppercase tracking-widest font-bold opacity-60">Mitra Strategis</p>
                </div>
                {/* Dynamically loaded data if available */}
                {impactData && (
                    <div className="animate-fade-in">
                        <p className="text-2xl font-playfair text-accent-gold">{impactData.totalPenerima}+</p>
                        <p className="text-[8px] uppercase tracking-widest font-bold opacity-60">Penerima Manfaat</p>
                    </div>
                )}
            </div>
        </section>
    );
};

export default PublicHero;
