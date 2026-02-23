import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { SanityService } from '../services/sanity.service';
import PublicNavbar from '../components/PublicNavbar';
import PublicFooter from '../components/PublicFooter';
import { ArrowRight, Search, Clock, HeartHandshake } from 'lucide-react';

const CATEGORIES = [
    { key: 'all', label: 'Semua' },
    { key: 'prestasi', label: 'Prestasi' },
    { key: 'laporan-wakaf', label: 'Laporan Wakaf' },
    { key: 'opini', label: 'Opini' },
];

const ITEMS_PER_PAGE = 6;

const NewsPage: React.FC = () => {
    const { data: newsData, isLoading } = useQuery({
        queryKey: ['news-all'],
        queryFn: SanityService.getNews,
    });

    const [activeCategory, setActiveCategory] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [page, setPage] = useState(1);

    useEffect(() => { window.scrollTo(0, 0); }, []);
    useEffect(() => { setPage(1); }, [activeCategory, searchQuery]);

    const allPosts: any[] = newsData || [];

    // Filter
    const filtered = allPosts.filter(post => {
        const matchesCategory = activeCategory === 'all' || (post.category?.toLowerCase() === activeCategory);
        const matchesSearch = !searchQuery
            || post.title?.toLowerCase().includes(searchQuery.toLowerCase())
            || post.excerpt?.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesCategory && matchesSearch;
    });

    // Split: first post = featured, rest = articles
    const featuredPost = filtered[0] || null;
    const gridPosts = filtered.slice(1);

    // Pagination on gridPosts
    const totalPages = Math.ceil(gridPosts.length / ITEMS_PER_PAGE);
    const paginatedPosts = gridPosts.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

    const formatDate = (dateStr: string) =>
        dateStr ? new Date(dateStr).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' }) : '';

    const estimateReadTime = (text?: string) => {
        if (!text) return '3';
        const words = text.split(' ').length;
        return Math.max(1, Math.ceil(words / 200)).toString();
    };

    return (
        <div className="min-h-screen bg-[#fafafa] font-jakarta">
            <PublicNavbar />

            {/* ── HEADER ── */}
            <header className="bg-[#0f172a] text-white pt-36 pb-16 px-6 relative overflow-hidden">
                <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")` }} />
                <div className="absolute top-0 right-1/4 w-[400px] h-[400px] bg-[#c09c53]/5 rounded-full blur-3xl" />

                <div className="max-w-7xl mx-auto relative z-10">
                    <div className="grid lg:grid-cols-12 gap-8 items-end">
                        {/* Title Block */}
                        <div className="lg:col-span-7">
                            <h4 className="text-[10px] font-bold tracking-[0.2em] text-[#c09c53] uppercase mb-5 flex items-center gap-3">
                                <span className="w-8 h-px bg-[#c09c53]" />
                                Kabar Pesantren
                            </h4>
                            <h1 className="text-5xl md:text-6xl font-serif leading-[1.05] mb-4">
                                Berita &<br />
                                <span className="italic text-[#c09c53]">Pemikiran</span>
                            </h1>
                            <p className="text-slate-400 font-light text-lg max-w-lg leading-relaxed">
                                Laporan perkembangan terkini, kisah inspirasi, dan refleksi pemikiran dari keluarga besar Al-Bisri.
                            </p>
                        </div>

                        {/* Search & Stats */}
                        <div className="lg:col-span-5 flex flex-col gap-5">
                            {/* Search Bar */}
                            <div className="relative">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                    placeholder="Cari artikel..."
                                    className="w-full bg-white/5 border border-white/10 text-white placeholder-slate-500 py-3.5 pl-11 pr-4 text-sm focus:outline-none focus:border-[#c09c53]/50 transition-colors"
                                />
                            </div>
                            <p className="text-slate-500 text-[10px] uppercase tracking-widest text-right">
                                {filtered.length} artikel ditemukan
                            </p>
                        </div>
                    </div>

                    {/* Category Pills */}
                    <div className="flex flex-wrap gap-2 mt-10 pt-8 border-t border-white/[0.06]">
                        {CATEGORIES.map(cat => (
                            <button
                                key={cat.key}
                                onClick={() => setActiveCategory(cat.key)}
                                className={`px-5 py-2 text-[9px] font-bold uppercase tracking-widest transition-all duration-200 ${activeCategory === cat.key
                                    ? 'bg-[#c09c53] text-[#0f172a]'
                                    : 'border border-white/20 text-slate-400 hover:border-white/40 hover:text-white'
                                    }`}
                            >
                                {cat.label}
                            </button>
                        ))}
                    </div>
                </div>
            </header>

            {/* ── MAIN CONTENT ── */}
            <main className="max-w-7xl mx-auto px-6 py-16 lg:py-20">

                {isLoading ? (
                    // Loading skeleton
                    <div className="space-y-12">
                        <div className="w-full aspect-[21/9] bg-slate-200 animate-pulse" />
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="space-y-3">
                                    <div className="aspect-[4/3] bg-slate-200 animate-pulse" />
                                    <div className="h-2 bg-slate-200 rounded w-24 animate-pulse" />
                                    <div className="h-4 bg-slate-200 rounded animate-pulse" />
                                </div>
                            ))}
                        </div>
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="text-center py-32">
                        <p className="text-slate-300 text-6xl mb-6">✦</p>
                        <h3 className="font-serif text-2xl text-[#0f172a] mb-3">Artikel tidak ditemukan</h3>
                        <p className="text-slate-400 text-sm">Coba kata kunci lain atau pilih kategori yang berbeda.</p>
                        <button onClick={() => { setSearchQuery(''); setActiveCategory('all'); }} className="mt-6 text-[10px] font-bold uppercase tracking-widest text-[#c09c53] hover:text-[#0f172a] transition-colors border-b border-[#c09c53]">
                            Reset Filter
                        </button>
                    </div>
                ) : (
                    <>
                        {/* ── FEATURED / HERO POST ── */}
                        {featuredPost && (
                            <Link
                                to={`/berita/${featuredPost.slug?.current}`}
                                className="group grid lg:grid-cols-12 gap-0 mb-16 overflow-hidden border border-slate-100 hover:border-slate-200 hover:shadow-2xl transition-all duration-500 bg-white"
                            >
                                {/* Image */}
                                <div className="lg:col-span-7 aspect-[4/3] lg:aspect-auto relative overflow-hidden bg-slate-200">
                                    <img
                                        src={featuredPost.mainImage
                                            ? SanityService.imageUrl(featuredPost.mainImage)
                                            : 'https://images.unsplash.com/photo-1590012314607-cda9d9b699ae?q=80&w=1200&auto=format&fit=crop'}
                                        alt={featuredPost.title}
                                        className="w-full h-full object-cover transition-transform duration-[8s] group-hover:scale-105"
                                    />
                                    {featuredPost.category && (
                                        <span className="absolute top-5 left-5 bg-white text-[#0f172a] text-[9px] font-bold uppercase tracking-widest px-3 py-1.5">
                                            {featuredPost.category}
                                        </span>
                                    )}
                                </div>

                                {/* Content */}
                                <div className="lg:col-span-5 p-8 md:p-10 lg:p-12 flex flex-col justify-between">
                                    <div>
                                        <div className="flex items-center gap-4 mb-6">
                                            <span className="h-px w-6 bg-[#c09c53]" />
                                            <span className="text-[9px] font-bold text-[#c09c53] uppercase tracking-[0.2em]">Artikel Utama</span>
                                        </div>
                                        <h2 className="font-serif text-3xl md:text-4xl text-[#0f172a] leading-snug mb-5 group-hover:text-[#c09c53] transition-colors">
                                            {featuredPost.title}
                                        </h2>
                                        <p className="text-slate-400 text-sm leading-relaxed line-clamp-3 mb-8">
                                            {featuredPost.excerpt}
                                        </p>
                                    </div>
                                    <div className="flex items-center justify-between pt-6 border-t border-slate-100">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-[#0f172a] flex items-center justify-center text-white text-[10px] font-bold">
                                                {(featuredPost.author?.name || 'A').charAt(0)}
                                            </div>
                                            <div>
                                                <p className="text-xs font-bold text-[#0f172a]">{featuredPost.author?.name || 'Tim Redaksi'}</p>
                                                <p className="text-[9px] text-slate-400">{formatDate(featuredPost.publishedAt)}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 text-[9px] text-slate-300 font-bold uppercase tracking-wider group-hover:text-[#c09c53] group-hover:gap-4 transition-all duration-300">
                                            <Clock className="w-3 h-3" />
                                            {estimateReadTime(featuredPost.excerpt)} mnt baca
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        )}

                        {/* ── GRID POSTS ── */}
                        {paginatedPosts.length > 0 && (
                            <>
                                <div className="flex items-center gap-4 mb-8">
                                    <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-300">Artikel Lainnya</h2>
                                    <div className="flex-1 h-px bg-slate-100" />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-12 mb-16">
                                    {paginatedPosts.map((post: any) => (
                                        <Link
                                            key={post._id}
                                            to={`/berita/${post.slug?.current}`}
                                            className="group cursor-pointer block"
                                        >
                                            {/* Image */}
                                            <div className="aspect-[4/3] overflow-hidden bg-slate-100 mb-5 relative">
                                                <img
                                                    src={post.mainImage
                                                        ? SanityService.imageUrl(post.mainImage)
                                                        : 'https://images.unsplash.com/photo-1518005020951-eccb494ad742?q=80&w=800&auto=format&fit=crop'}
                                                    alt={post.title}
                                                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                                                />
                                                {post.category && (
                                                    <span className="absolute top-3 left-3 bg-white/90 text-[#0f172a] text-[9px] font-bold uppercase tracking-wider px-2.5 py-1">
                                                        {post.category}
                                                    </span>
                                                )}
                                            </div>

                                            {/* Meta */}
                                            <div className="flex items-center gap-3 mb-3">
                                                <span className="text-[9px] font-bold text-[#c09c53] uppercase tracking-[0.15em]">
                                                    {formatDate(post.publishedAt)}
                                                </span>
                                                <span className="w-1 h-1 rounded-full bg-slate-300" />
                                                <span className="text-[9px] text-slate-400 flex items-center gap-1">
                                                    <Clock className="w-2.5 h-2.5" />
                                                    {estimateReadTime(post.excerpt)} mnt
                                                </span>
                                            </div>

                                            {/* Title */}
                                            <h3 className="font-serif text-xl text-[#0f172a] group-hover:text-[#c09c53] transition-colors leading-snug mb-3 line-clamp-2">
                                                {post.title}
                                            </h3>

                                            {/* Excerpt */}
                                            <p className="text-slate-400 text-xs leading-relaxed line-clamp-2 mb-4">
                                                {post.excerpt}
                                            </p>

                                            {/* Author */}
                                            <div className="flex items-center gap-2 pt-4 border-t border-slate-100">
                                                <div className="w-6 h-6 rounded-full bg-[#0f172a] flex items-center justify-center text-white text-[8px] font-bold shrink-0">
                                                    {(post.author?.name || 'A').charAt(0)}
                                                </div>
                                                <span className="text-[9px] text-slate-400 font-bold">{post.author?.name || 'Tim Redaksi'}</span>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            </>
                        )}

                        {/* ── PAGINATION ── */}
                        {totalPages > 1 && (
                            <div className="flex justify-center items-center gap-2 border-t border-slate-100 pt-10">
                                <button
                                    onClick={() => setPage(p => Math.max(1, p - 1))}
                                    disabled={page === 1}
                                    className="w-10 h-10 border border-slate-200 text-slate-400 hover:border-[#0f172a] hover:text-[#0f172a] disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-sm"
                                >
                                    ←
                                </button>
                                {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                                    <button
                                        key={p}
                                        onClick={() => setPage(p)}
                                        className={`w-10 h-10 text-sm font-bold transition-colors ${page === p
                                            ? 'bg-[#0f172a] text-white'
                                            : 'border border-slate-200 text-slate-400 hover:border-[#0f172a] hover:text-[#0f172a]'
                                            }`}
                                    >
                                        {p}
                                    </button>
                                ))}
                                <button
                                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                    disabled={page === totalPages}
                                    className="w-10 h-10 border border-slate-200 text-slate-400 hover:border-[#0f172a] hover:text-[#0f172a] disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-sm"
                                >
                                    →
                                </button>
                            </div>
                        )}
                    </>
                )}

                {/* ── SUPPORT BANNER ── */}
                <div className="mt-20 bg-white border border-slate-200 p-10 md:p-14 relative overflow-hidden">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-8 relative z-10">
                        <div>
                            <span className="text-[10px] font-bold tracking-[0.2em] text-[#c09c53] uppercase mb-3 block">Ambil Bagian</span>
                            <h3 className="font-serif text-3xl md:text-4xl text-[#0f172a]">
                                Dukung Pendidikan<br />
                                <span className="italic text-slate-400 font-normal">Santri Yatim Al-Bisri.</span>
                            </h3>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-4 shrink-0">
                            <Link
                                to="/donasi"
                                className="bg-[#0f172a] text-white px-8 py-4 text-[10px] font-bold uppercase tracking-widest hover:bg-slate-800 transition-colors inline-flex items-center gap-2 justify-center"
                            >
                                <HeartHandshake className="w-4 h-4" /> Donasi Sekarang
                            </Link>
                            <Link
                                to="/psb"
                                className="border border-slate-300 text-[#0f172a] px-8 py-4 text-[10px] font-bold uppercase tracking-widest hover:bg-slate-50 transition-colors inline-flex items-center gap-2 justify-center"
                            >
                                Daftar Santri <ArrowRight className="w-3.5 h-3.5" />
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
