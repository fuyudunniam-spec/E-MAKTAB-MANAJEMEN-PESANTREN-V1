import React, { useEffect } from 'react';
import { Search, ArrowRight, Play, HeartHandshake, ChevronLeft, ChevronRight, BookOpen } from 'lucide-react';
import { Link } from 'react-router-dom';
import PublicNavbar from '../components/PublicNavbar';
import PublicFooter from '../components/PublicFooter';
import { useQuery } from '@tanstack/react-query';
import { SanityService } from '../services/sanity.service';

const NewsPage: React.FC = () => {
    const { data: postsData } = useQuery({
        queryKey: ['news-list'],
        queryFn: SanityService.getNews
    });

    const posts = postsData || [];
    const featuredPost = posts.length > 0 ? posts[0] : null;
    const regularPosts = posts.length > 0 ? posts.slice(1) : [];

    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);


    return (
        <div className="min-h-screen bg-paper font-jakarta selection:bg-gold-200 selection:text-navy-950">
            <PublicNavbar />

            {/* HEADER - Luxury Navy Theme */}
            <header className="relative py-32 px-6 bg-navy-950 text-white overflow-hidden text-center">
                {/* Background Patterns */}
                <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "url('https://www.transparenttextures.com/patterns/arabesque.png')" }}></div>
                <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>

                <div className="max-w-4xl mx-auto relative z-10 animate-fade-in">
                    <span className="text-accent-gold font-bold uppercase tracking-[0.2em] text-xs mb-4 block">Jendela Informasi & Pemikiran</span>
                    <h1 className="text-4xl md:text-6xl font-display text-white mb-8">Kabar Al-Bisri</h1>

                    {/* Category Filter - Luxury Style */}
                    <div className="flex flex-wrap justify-center gap-3 mt-8">
                        <button className="px-8 py-3 rounded-full bg-accent-gold text-navy-950 text-xs font-bold uppercase tracking-widest shadow-lg hover:bg-gold-400 transition transform hover:-translate-y-0.5">Semua</button>
                        <button className="px-8 py-3 rounded-full border border-white/10 text-slate-200 hover:text-white hover:border-accent-gold hover:bg-white/5 text-xs font-bold uppercase tracking-widest transition">Prestasi</button>
                        <button className="px-8 py-3 rounded-full border border-white/10 text-slate-200 hover:text-white hover:border-accent-gold hover:bg-white/5 text-xs font-bold uppercase tracking-widest transition">Laporan Wakaf</button>
                        <button className="px-8 py-3 rounded-full border border-white/10 text-slate-200 hover:text-white hover:border-accent-gold hover:bg-white/5 text-xs font-bold uppercase tracking-widest transition">Opini</button>
                    </div>
                </div>
            </header>

            {/* MAIN CONTENT */}
            <main className="max-w-7xl mx-auto px-6 py-20 lg:py-24">

                {/* Featured Post (Big Card) */}
                {featuredPost && (
                    <Link to={`/berita/${featuredPost.slug?.current}`} className="group block relative rounded-[2.5rem] overflow-hidden shadow-2xl mb-20 aspect-[4/3] md:aspect-[21/9]">
                        <img
                            src={featuredPost.mainImage ? SanityService.imageUrl(featuredPost.mainImage) : "https://placehold.co/1200x600?text=Featured+News"}
                            className="absolute inset-0 w-full h-full object-cover transition duration-1000 group-hover:scale-105"
                            alt={featuredPost.title}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-navy-950/95 via-navy-950/50 to-transparent"></div>

                        <div className="absolute bottom-0 left-0 p-8 md:p-16 w-full md:w-3/4">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent-gold text-navy-950 text-[10px] font-bold uppercase tracking-wider mb-6">
                                <span className="w-1.5 h-1.5 rounded-full bg-navy-950"></span> Headline
                            </div>
                            <h2 className="text-3xl md:text-5xl font-display text-white mb-6 leading-tight group-hover:text-gold-200 transition duration-300">
                                {featuredPost.title}
                            </h2>
                            <p className="text-slate-300 text-sm md:text-lg line-clamp-2 mb-8 font-light leading-relaxed max-w-2xl">
                                {featuredPost.excerpt}
                            </p>
                            <span className="text-accent-gold text-xs font-bold uppercase tracking-widest flex items-center gap-3 group-hover:gap-6 transition-all">
                                Baca Selengkapnya <ArrowRight className="w-4 h-4" />
                            </span>
                        </div>
                    </Link>
                )}

                {/* Latest Posts Grid - Clean & Minimalist */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-10 gap-y-16">
                    {regularPosts.map((post: any) => (
                        <Link to={`/berita/${post.slug?.current}`} key={post._id} className="group cursor-pointer block">
                            <div className="aspect-[4/3] rounded-2xl overflow-hidden relative mb-6">
                                <img
                                    src={post.mainImage ? SanityService.imageUrl(post.mainImage) : "https://placehold.co/800x600?text=Kabar+Al-Bisri"}
                                    className="w-full h-full object-cover transition duration-700 group-hover:scale-110 grayscale/[0.1] group-hover:grayscale-0"
                                    alt={post.title}
                                />
                                {post.isVideo && (
                                    <div className="absolute inset-0 bg-royal-950/30 flex items-center justify-center group-hover:bg-royal-950/20 transition">
                                        <div className="w-14 h-14 bg-white/20 backdrop-blur rounded-full flex items-center justify-center text-white border border-white/30 group-hover:scale-110 transition duration-300">
                                            <Play className="w-5 h-5 fill-current ml-1" />
                                        </div>
                                    </div>
                                )}
                                <span className={`absolute top-4 left-4 ${post.category === 'Video' ? 'bg-navy-950 text-white' : 'bg-white/90 text-navy-950'} backdrop-blur-sm px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider shadow-sm`}>
                                    {post.category}
                                </span>
                            </div>
                            <div className="pr-4">
                                <div className="flex items-center gap-3 mb-3">
                                    <span className="text-xs text-accent-gold font-bold uppercase tracking-widest">
                                        {post.publishedAt ? new Date(post.publishedAt).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : ''}
                                    </span>
                                </div>
                                <h3 className="text-xl font-display text-navy-950 mb-3 leading-snug group-hover:text-accent-gold transition duration-300 line-clamp-2">
                                    {post.title}
                                </h3>
                                <p className="text-slate-500 text-sm line-clamp-3 font-light leading-relaxed">
                                    {post.excerpt}
                                </p>
                            </div>
                        </Link>
                    ))}
                </div>

                {/* Pagination - Luxury Style */}
                <div className="mt-24 flex justify-center gap-3">
                    <button className="w-12 h-12 rounded-full border border-slate-200 flex items-center justify-center text-slate-400 hover:bg-navy-950 hover:text-white hover:border-navy-950 transition duration-300">
                        <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button className="w-12 h-12 rounded-full bg-navy-950 text-white flex items-center justify-center text-sm font-bold shadow-lg shadow-navy-900/20">1</button>
                    <button className="w-12 h-12 rounded-full border border-stone-200 flex items-center justify-center text-stone-500 hover:bg-stone-100 transition text-sm font-bold">2</button>
                    <button className="w-12 h-12 rounded-full border border-stone-200 flex items-center justify-center text-stone-500 hover:bg-stone-100 transition text-sm font-bold">3</button>
                    <span className="w-12 h-12 flex items-center justify-center text-slate-400 tracking-widest">...</span>
                    <button className="w-12 h-12 rounded-full border border-slate-200 flex items-center justify-center text-slate-400 hover:bg-navy-950 hover:text-white hover:border-navy-950 transition duration-300">
                        <ChevronRight className="w-5 h-5" />
                    </button>
                </div>

                {/* Support Us Banner */}
                <div className="mt-32">
                    <div className="bg-navy-950 rounded-[3rem] p-12 lg:p-20 text-white relative overflow-hidden text-center group">
                        <div className="absolute inset-0 opacity-10 transition duration-1000 group-hover:scale-105" style={{ backgroundImage: "url('https://www.transparenttextures.com/patterns/arabesque.png')" }}></div>
                        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-gold-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>

                        <div className="relative z-10 max-w-3xl mx-auto">
                            <div className="w-20 h-20 bg-white/5 border border-white/10 rounded-full flex items-center justify-center mx-auto mb-8 text-accent-gold shadow-2xl ring-4 ring-white/5">
                                <HeartHandshake className="w-10 h-10" />
                            </div>
                            <h3 className="font-display text-4xl lg:text-5xl mb-6">Dukung Peradaban Ilmu</h3>
                            <p className="text-slate-300 mb-10 leading-relaxed text-lg font-light max-w-xl mx-auto">

                                Jadilah bagian dari gerakan mencetak 1000 ulama dan teknokrat muslim masa depan.
                            </p>
                            <Link to="/donasi" className="inline-flex items-center px-10 py-5 bg-accent-gold text-navy-950 rounded-full font-bold text-sm uppercase tracking-[0.2em] hover:bg-white hover:text-navy-950 transition-all duration-300 shadow-xl hover:shadow-2xl">
                                Support Us
                            </Link>
                        </div>
                    </div>
                </div>

            </main>

            <PublicFooter />
        </div>
    );
};

export default NewsPage;
