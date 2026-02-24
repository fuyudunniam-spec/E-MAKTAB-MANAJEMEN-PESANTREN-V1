import React, { useState, useEffect, useRef } from 'react';
import { ArrowRight, ArrowLeft, ChevronDown } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getPublicImpactData } from '../services/publicKeuangan.service';
import { SanityService } from '../../public-website/services/sanity.service';

interface PublicHeroProps {
    data?: any[];
    impactOverride?: {
        value?: string;
        label?: string;
    };
}

const STATIC_SLIDES = [
    {
        id: 1,
        tag: 'Binaan Pesantren Mahasiswa An-Nur',
        titleA: 'Memuliakan',
        titleB: 'Harkat',
        titleC: 'Kemanusiaan.',
        desc: 'Ikhtiar tulus untuk mengangkat derajat sesama melalui pendidikan dan kasih sayang, memastikan setiap jiwa mendapatkan kesempatan yang setara.',
        ctaText: 'Tentang Kami',
        ctaLink: '/tentang-kami',
        quote: 'Barangsiapa memelihara seorang anak yatim, ia bersamaku di surga.',
        quoteAuthor: 'Nabi Muhammad ﷺ',
        images: [
            'https://images.unsplash.com/photo-1590012314607-cda9d9b699ae?q=80&w=800&auto=format&fit=crop',
            'https://images.unsplash.com/photo-1577896851231-70ef18881754?q=80&w=600&auto=format&fit=crop',
            'https://images.unsplash.com/photo-1518005020951-eccb494ad742?q=80&w=400&auto=format&fit=crop',
        ]
    },
    {
        id: 2,
        tag: 'Sinergi & Transparansi',
        titleA: 'Dikelola dengan',
        titleB: 'Amanah',
        titleC: 'Profesional.',
        desc: 'Kolaborasi manajemen kelembagaan bersama Pesantren Mahasiswa An-Nur memastikan setiap amanah publik terlaporkan dengan jujur dan akuntabel.',
        ctaText: 'Laporan Transparansi',
        ctaLink: '/transparansi',
        quote: 'Sesungguhnya Allah mencintai orang yang jika bekerja, ia lakukan dengan itqan (profesional).',
        quoteAuthor: 'HR. Al-Baihaqi',
        images: [
            'https://images.unsplash.com/photo-1585036156171-384164a8c675?q=80&w=800&auto=format&fit=crop',
            'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=600&auto=format&fit=crop',
            'https://images.unsplash.com/photo-1590012314607-cda9d9b699ae?q=80&w=400&auto=format&fit=crop',
        ]
    },
    {
        id: 3,
        tag: 'Pendidikan Holistik',
        titleA: 'Mencetak Generasi',
        titleB: 'Berhati',
        titleC: 'Mulia.',
        desc: 'Kurikulum yang menyeimbangkan kecerdasan intelektual dan kematangan spiritual. Membekali santri yatim agar mandiri dan berdaya saing.',
        ctaText: 'Lihat Program',
        ctaLink: '/akademik',
        quote: 'Ilmu tanpa adab bagaikan api tanpa cahaya.',
        quoteAuthor: 'Hikmah Salaf',
        images: [
            'https://images.unsplash.com/photo-1577896851231-70ef18881754?q=80&w=800&auto=format&fit=crop',
            'https://images.unsplash.com/photo-1518005020951-eccb494ad742?q=80&w=600&auto=format&fit=crop',
            'https://images.unsplash.com/photo-1585036156171-384164a8c675?q=80&w=400&auto=format&fit=crop',
        ]
    },
];

const PublicHero: React.FC<PublicHeroProps> = ({ data, impactOverride }) => {
    const { data: impactData } = useQuery({
        queryKey: ['public-impact-data'],
        queryFn: () => getPublicImpactData()
    });

    const [currentSlide, setCurrentSlide] = useState(0);
    const [isAnimating, setIsAnimating] = useState(false);

    // Build slides: from Sanity if available, fallback to static
    const slides = (data && data.length > 0)
        ? data.map((s: any) => ({
            id: s._id,
            tag: s.badge || s.subBadge || 'Al-Bisri',
            titleA: s.title || '',
            titleB: s.titleItalic || '',
            titleC: '',
            desc: s.subtitle || '',
            ctaText: s.ctaText || 'Selengkapnya',
            ctaLink: s.ctaLink || '/',
            quote: s.quote || STATIC_SLIDES[0].quote,
            quoteAuthor: s.quoteAuthor || STATIC_SLIDES[0].quoteAuthor,
            images: [
                s.backgroundImage ? SanityService.imageUrl(s.backgroundImage) : (s.externalImageUrl || STATIC_SLIDES[0].images[0]),
                s.image2 ? SanityService.imageUrl(s.image2) : STATIC_SLIDES[0].images[1],
                s.image3 ? SanityService.imageUrl(s.image3) : STATIC_SLIDES[0].images[2],
            ]
        }))
        : STATIC_SLIDES;

    useEffect(() => {
        const interval = setInterval(() => {
            goNext();
        }, 7000);
        return () => clearInterval(interval);
    }, [currentSlide, slides.length]);

    const goNext = () => {
        if (isAnimating) return;
        setIsAnimating(true);
        setCurrentSlide(prev => (prev + 1) % slides.length);
        setTimeout(() => setIsAnimating(false), 700);
    };

    const goPrev = () => {
        if (isAnimating) return;
        setIsAnimating(true);
        setCurrentSlide(prev => (prev - 1 + slides.length) % slides.length);
        setTimeout(() => setIsAnimating(false), 700);
    };

    const slide = slides[currentSlide];

    return (
        <section className="relative pt-20 pb-16 lg:pt-28 lg:pb-28 overflow-hidden bg-[#fafafa] min-h-[88vh] flex items-center">
            {/* Subtle background texture */}
            <div className="absolute inset-0 opacity-[0.025]" style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%230f172a' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
            }} />

            {/* Gold accent blobs */}
            <div className="absolute top-20 right-[5%] w-72 h-72 bg-[#c09c53]/5 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-10 left-[5%] w-48 h-48 bg-[#0f172a]/5 rounded-full blur-3xl pointer-events-none" />

            <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center relative z-10 w-full">

                {/* LEFT: Text Content */}
                <div
                    key={`text-${currentSlide}`}
                    className="lg:col-span-5 flex flex-col justify-center order-2 lg:order-1 mt-6 lg:mt-0"
                    style={{ animation: 'heroFadeUp 0.7s ease forwards' }}
                >
                    <h4 className="text-[10px] md:text-[11px] font-bold tracking-[0.25em] text-[#c09c53] uppercase mb-6 flex items-center gap-4">
                        <span className="w-10 h-px bg-[#c09c53]" />
                        {slide.tag}
                    </h4>

                    <h1 className="text-4xl md:text-5xl lg:text-[3.8rem] font-serif text-[#0f172a] leading-[1.08] mb-6 tracking-tight">
                        {slide.titleA}<br />
                        <span className="italic text-slate-400">{slide.titleB}</span>{slide.titleC && ` ${slide.titleC}`}
                    </h1>

                    <p className="text-slate-500 leading-relaxed mb-10 text-sm md:text-[0.95rem] max-w-md">
                        {slide.desc}
                    </p>

                    <div className="flex flex-wrap gap-4">
                        <Link
                            to={slide.ctaLink}
                            className="bg-[#0f172a] text-white px-8 py-4 text-[10px] font-bold uppercase tracking-widest hover:bg-slate-800 transition-all flex items-center gap-3 shadow-lg shadow-[#0f172a]/10 hover:-translate-y-0.5 duration-300"
                        >
                            {slide.ctaText} <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                        <Link
                            to="/donasi"
                            className="border border-[#0f172a]/20 text-[#0f172a] px-8 py-4 text-[10px] font-bold uppercase tracking-widest hover:border-[#c09c53] hover:text-[#c09c53] transition-all"
                        >
                            Tunaikan Sedekah
                        </Link>
                    </div>

                    {/* Slider Controls */}
                    <div className="flex items-center gap-6 mt-12 pt-8 border-t border-slate-200/60">
                        <button onClick={goPrev} className="w-9 h-9 flex items-center justify-center border border-slate-200 text-slate-400 hover:border-[#0f172a] hover:text-[#0f172a] transition-colors rounded-full">
                            <ArrowLeft className="w-4 h-4" />
                        </button>
                        <div className="flex gap-2">
                            {slides.map((_, i) => (
                                <button
                                    key={i}
                                    onClick={() => setCurrentSlide(i)}
                                    className={`h-[3px] rounded-full transition-all duration-500 ${i === currentSlide ? 'w-8 bg-[#c09c53]' : 'w-3 bg-slate-300 hover:bg-slate-400'}`}
                                />
                            ))}
                        </div>
                        <button onClick={goNext} className="w-9 h-9 flex items-center justify-center border border-slate-200 text-slate-400 hover:border-[#0f172a] hover:text-[#0f172a] transition-colors rounded-full">
                            <ArrowRight className="w-4 h-4" />
                        </button>
                        <span className="text-[10px] font-bold text-slate-300 tracking-widest uppercase ml-2">
                            {String(currentSlide + 1).padStart(2, '0')} / {String(slides.length).padStart(2, '0')}
                        </span>
                    </div>
                </div>

                {/* RIGHT: Image Frame */}
                <div
                    key={`img-${currentSlide}`}
                    className="lg:col-span-7 relative order-1 lg:order-2 w-full"
                    style={{ animation: 'heroFadeUp 0.7s ease 0.1s forwards', opacity: 0 }}
                >
                    {/* Main large frame */}
                    <div className="grid grid-cols-12 grid-rows-2 gap-3 h-[420px] md:h-[520px]">
                        {/* Primary image */}
                        <div className="col-span-8 row-span-2 rounded-2xl overflow-hidden relative">
                            <img
                                src={slide.images[0]}
                                alt="Hero Al-Bisri"
                                className="w-full h-full object-cover transition-transform duration-[10s] hover:scale-105"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-[#0f172a]/30 to-transparent" />
                        </div>
                        {/* Secondary images */}
                        <div className="col-span-4 row-span-1 rounded-2xl overflow-hidden">
                            <img src={slide.images[1]} alt="" className="w-full h-full object-cover" />
                        </div>
                        <div className="col-span-4 row-span-1 rounded-2xl overflow-hidden">
                            <img src={slide.images[2]} alt="" className="w-full h-full object-cover" />
                        </div>
                    </div>

                    {/* Gold accent border */}
                    <div className="absolute -top-3 -right-3 w-32 h-32 border border-[#c09c53]/30 rounded-2xl pointer-events-none" />
                    <div className="absolute -bottom-3 -left-3 w-20 h-20 border border-[#c09c53]/20 rounded-xl pointer-events-none" />

                    {/* Floating hadith badge */}
                    <div
                        key={`quote-${currentSlide}`}
                        className="absolute -bottom-8 left-4 lg:-bottom-10 lg:-left-10 bg-white p-5 lg:p-6 shadow-[0_20px_40px_-10px_rgba(0,0,0,0.1)] border border-slate-100 rounded-2xl max-w-[300px] z-30"
                        style={{ animation: 'heroFadeUp 0.6s ease 0.3s forwards', opacity: 0 }}
                    >
                        <p className="text-[11px] text-slate-600 leading-relaxed italic mb-3">
                            "{slide.quote}"
                        </p>
                        <div className="flex items-center gap-2">
                            <span className="w-5 h-px bg-[#c09c53]" />
                            <p className="text-[9px] font-bold text-[#c09c53] uppercase tracking-widest">{slide.quoteAuthor}</p>
                        </div>
                    </div>

                    {/* Floating impact stats */}
                    {(impactOverride || impactData) && (
                        <div className="absolute -top-6 -right-4 lg:-top-5 lg:-right-8 bg-[#0f172a] text-white px-5 py-4 rounded-2xl shadow-xl z-30">
                            <p className="text-2xl font-serif text-[#c09c53] leading-none">
                                {impactOverride?.value || (impactData ? `${impactData.totalPenerima}+` : '0')}
                            </p>
                            <p className="text-[9px] font-bold uppercase tracking-widest text-white/60 mt-1">
                                {impactOverride?.label || 'Penerima Manfaat'}
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* Scroll hint */}
            <div className="hidden lg:flex absolute bottom-6 left-1/2 -translate-x-1/2 flex-col items-center gap-2 text-slate-400 z-10">
                <span className="text-[9px] uppercase tracking-[0.25em] font-bold">Scroll</span>
                <ChevronDown className="w-4 h-4 animate-bounce" />
            </div>

            <style>{`
                @keyframes heroFadeUp {
                    from { opacity: 0; transform: translateY(20px); }
                    to   { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </section>
    );
};

export default PublicHero;
