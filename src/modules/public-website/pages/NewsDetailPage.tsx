import React, { useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { useParams, Link } from 'react-router-dom';
import {
    Calendar,
    User,
    Clock,
    Facebook,
    Twitter,
    Link as LinkIcon,
    Instagram,
    Linkedin,
    Mail,
    Globe,
    MessageCircle,
    ArrowLeft
} from 'lucide-react';
import { PortableText } from '@portabletext/react';
import PublicNavbar from '../components/PublicNavbar';
import PublicFooter from '../components/PublicFooter';
import { useQuery } from '@tanstack/react-query';
import { SanityService } from '../services/sanity.service';


const NewsDetailPage: React.FC = () => {
    const { slug } = useParams();

    const { data: post, isLoading } = useQuery({
        queryKey: ['news-detail', slug],
        queryFn: () => SanityService.getNewsDetail(slug!),
        enabled: !!slug
    });

    useEffect(() => {
        window.scrollTo(0, 0);
    }, [slug]);

    if (isLoading) return (
        <div className="min-h-screen bg-[#FBFBFA] flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent-gold"></div>
        </div>
    );

    if (!post) return (
        <div className="min-h-screen bg-[#FBFBFA] flex flex-col items-center justify-center gap-4">
            <h2 className="text-2xl font-playfair text-navy-950">Berita tidak ditemukan</h2>
            <Link to="/berita" className="text-accent-gold hover:underline">Kembali ke Berita</Link>
        </div>
    );

    const relatedPosts = post?.relatedPosts || [];
    const description = post?.metaDescription || post?.excerpt || post?.title;

    return (
        <div className="min-h-screen bg-[#FBFBFA] font-jakarta selection:bg-accent-gold selection:text-white pb-0">
            <Helmet>
                <title>{post?.title} | Pesantren Al-Bisri</title>
                <meta name="description" content={description} />
                {post?.metaKeywords && <meta name="keywords" content={post.metaKeywords.join(', ')} />}

                {/* Open Graph & Twitter (Conditionally hidden based on CMS setting) */}
                {!post?.hideSocialPreview && (
                    <>
                        <meta property="og:title" content={post?.title} />
                        <meta property="og:description" content={description} />
                        <meta property="og:type" content="article" />
                        <meta property="og:url" content={window.location.href} />
                        {(post?.ogImage || post?.mainImage) && (
                            <meta property="og:image" content={SanityService.imageUrl(post.ogImage || post.mainImage)} />
                        )}

                        <meta name="twitter:card" content="summary_large_image" />
                        <meta name="twitter:title" content={post?.title} />
                        <meta name="twitter:description" content={description} />
                        {(post?.ogImage || post?.mainImage) && (
                            <meta name="twitter:image" content={SanityService.imageUrl(post.ogImage || post.mainImage)} />
                        )}
                    </>
                )}
            </Helmet>

            <PublicNavbar />

            <main className="pt-32">
                {/* 1. ARTICLE HEADER - Focus on Typography & Context */}
                <header className="max-w-4xl mx-auto px-6 mb-12">
                    {/* Category & Date */}
                    <div className="flex items-center gap-3 mb-8">
                        <span className="px-3 py-1 bg-accent-gold/10 text-accent-gold text-[10px] font-bold uppercase tracking-widest rounded-full">
                            {post.category || 'Berita'}
                        </span>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                            {post.publishedAt ? new Date(post.publishedAt).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' }) : '-'}
                        </span>
                        <span className="w-1 h-1 bg-slate-200 rounded-full"></span>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5" />
                            {post.readingTime || '3 Menit Baca'}
                        </span>
                    </div>

                    <h1 className="font-playfair text-4xl md:text-5xl lg:text-6xl text-navy-950 leading-[1.1] mb-8 font-bold">
                        {post.title}
                    </h1>

                    {/* Lead Paragraph / Excerpt - Moved here for better hierarchy */}
                    {post.excerpt && (
                        <p className="font-lora text-xl md:text-2xl text-slate-500 italic leading-relaxed mb-10 border-l-2 border-slate-100 pl-6">
                            {post.excerpt}
                        </p>
                    )}

                    {/* Simple Author Line */}
                    <div className="flex items-center gap-4 py-6 border-t border-slate-100">
                        <img
                            src={post.author?.photo ? SanityService.imageUrl(post.author.photo) : "https://placehold.co/100x100?text=Author"}
                            className="w-10 h-10 rounded-full object-cover grayscale"
                            alt={post.author?.name}
                        />
                        <div>
                            <p className="text-[11px] font-bold text-navy-950 uppercase tracking-widest">{post.author?.name || 'Redaksi'}</p>
                            <p className="text-[10px] text-slate-400 uppercase tracking-widest">{post.author?.role || 'Jurnalis'}</p>
                        </div>
                    </div>
                </header>

                {/* 2. FEATURED IMAGE - Full Width Aesthetic */}
                <div className="max-w-6xl mx-auto px-6 mb-20">
                    <div className="aspect-[16/8] w-full overflow-hidden shadow-2xl bg-slate-100 rounded-[2px]">
                        <img
                            src={post.mainImage ? SanityService.imageUrl(post.mainImage) : "https://placehold.co/1200x600?text=Detail+Berita"}
                            className="w-full h-full object-cover"
                            alt={post.title}
                        />
                    </div>
                </div>

                {/* 3. CORE CONTENT AREA - Two Columns for Professional Style */}
                <div className="max-w-6xl mx-auto px-6 grid md:grid-cols-12 gap-12 relative">

                    {/* LEFT SIDEBAR: Sticky Social Share (Media International Style) */}
                    <aside className="hidden md:block md:col-span-1 border-r border-slate-50">
                        <div className="sticky top-32 flex flex-col gap-5 py-4">
                            <div className="relative h-32 mb-12">
                                <span className="absolute left-1/2 -translate-x-1/2 top-0 text-[10px] font-bold uppercase tracking-[0.3em] text-slate-300 vertical-text whitespace-nowrap">
                                    Bagikan Konten
                                </span>
                            </div>

                            <button onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(post.title + ' ' + window.location.href)}`, '_blank')} className="w-10 h-10 bg-white border border-slate-100 rounded-full flex items-center justify-center text-slate-400 hover:text-[#25D366] hover:border-[#25D366] transition-all shadow-sm hover:shadow-md">
                                <MessageCircle className="w-4 h-4" />
                            </button>
                            <button onClick={() => window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`, '_blank')} className="w-10 h-10 bg-white border border-slate-100 rounded-full flex items-center justify-center text-slate-400 hover:text-[#1877F2] hover:border-[#1877F2] transition-all shadow-sm hover:shadow-md">
                                <Facebook className="w-4 h-4" />
                            </button>
                            <button onClick={() => window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(window.location.href)}&text=${encodeURIComponent(post.title)}`, '_blank')} className="w-10 h-10 bg-white border border-slate-100 rounded-full flex items-center justify-center text-slate-400 hover:text-black hover:border-black transition-all shadow-sm hover:shadow-md">
                                <Twitter className="w-4 h-4" />
                            </button>
                            <button onClick={() => navigator.clipboard.writeText(window.location.href)} className="w-10 h-10 bg-white border border-slate-100 rounded-full flex items-center justify-center text-slate-400 hover:text-accent-gold hover:border-accent-gold transition-all shadow-sm hover:shadow-md">
                                <LinkIcon className="w-4 h-4" />
                            </button>
                        </div>
                    </aside>

                    {/* CENTER: main article content */}
                    <article className="md:col-span-8 lg:col-span-7 md:col-start-2 lg:col-start-3 mb-24">
                        <style>{`
                            .article-body p {
                                margin-bottom: 2.5rem;
                                line-height: 2;
                                font-family: 'Lora', serif;
                                color: #1F2937;
                                font-size: 1.25rem;
                                text-align: ${post.justify ? 'justify' : 'left'};
                            }
                            .article-body h2, .article-body h3 {
                                font-family: 'Playfair Display', serif;
                                color: #0F172A;
                                font-weight: 700;
                                margin: 4rem 0 1.5rem;
                                line-height: 1.2;
                            }
                            .article-body h2 { font-size: 2.5rem; }
                            .article-body h3 { font-size: 1.85rem; }
                            .article-body blockquote {
                                position: relative;
                                padding: 3rem 0;
                                margin: 4rem 0;
                                border-top: 1px solid #E5E7EB;
                                border-bottom: 1px solid #E5E7EB;
                                border-left: none;
                                font-family: 'Playfair Display', serif;
                                font-style: italic;
                                font-size: 2rem;
                                color: #0F172A;
                                text-align: center;
                                line-height: 1.3;
                            }
                            .article-body blockquote::before {
                                content: '“';
                                position: absolute;
                                top: 1rem;
                                left: 50%;
                                transform: translateX(-50%);
                                font-size: 4rem;
                                color: #B59461;
                                opacity: 0.2;
                            }
                            .vertical-text {
                                writing-mode: vertical-rl;
                                text-orientation: mixed;
                            }
                        `}</style>

                        <div className="article-body">
                            {Array.isArray(post.content) ? (
                                <PortableText
                                    value={post.content}
                                    components={{
                                        block: {
                                            h2: ({ children }) => <h2 className="text-3xl md:text-4xl font-playfair font-bold mb-6 mt-12">{children}</h2>,
                                            h3: ({ children }) => <h3 className="text-2xl md:text-3xl font-playfair font-bold mb-4 mt-10">{children}</h3>,
                                            normal: ({ children }) => <p>{children}</p>,
                                            blockquote: ({ children }) => <blockquote className="italic border-l-4 border-accent-gold pl-6 my-8 text-2xl font-serif">{children}</blockquote>,
                                        }
                                    }}
                                />
                            ) : (
                                <div dangerouslySetInnerHTML={{ __html: post.content || '' }} />
                            )}
                        </div>

                        {/* POWERFUL AUTHOR SECTION */}
                        <div className="mt-24 pt-16 border-t border-slate-100">
                            <div className="bg-white p-10 shadow-[0_20px_50px_rgba(0,0,0,0.03)] border border-slate-50 relative overflow-hidden group">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50/50 rounded-bl-full transition-transform group-hover:scale-110"></div>
                                <div className="flex flex-col md:flex-row gap-8 items-start relative z-10">
                                    <div className="relative">
                                        <div className="w-24 h-24 rounded-sm overflow-hidden border-2 border-white shadow-xl relative z-10 bg-slate-100">
                                            <img
                                                src={post.author?.photo ? SanityService.imageUrl(post.author.photo) : "https://placehold.co/200x200?text=Author"}
                                                className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-700"
                                                alt={post.author?.name}
                                            />
                                        </div>
                                        <div className="absolute -bottom-3 -right-3 w-12 h-12 bg-accent-gold/10 -z-0"></div>
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="text-[10px] font-bold text-accent-gold uppercase tracking-[0.2em] mb-2">Tentang Penulis</h4>
                                        <h3 className="text-2xl font-playfair font-bold text-navy-950 mb-1">{post.author?.name}</h3>
                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">{post.author?.role || 'Visi & Pemikir Al-Bisri'}</p>
                                        <p className="text-base font-lora text-slate-600 leading-relaxed mb-6">
                                            {post.author?.description || 'Penulis aktif di Pesantren Al-Bisri yang berdedikasi untuk menyebarkan ilmu dan kebaikan.'}
                                        </p>

                                        <div className="flex gap-4">
                                            {post.author?.socialLinks?.map((link: any, idx: number) => {
                                                const platform = link.platform.toLowerCase();
                                                let IconComponent = Globe;
                                                if (platform.includes('facebook')) IconComponent = Facebook;
                                                else if (platform.includes('twitter') || platform.includes('x.com')) IconComponent = Twitter;
                                                else if (platform.includes('instagram')) IconComponent = Instagram;
                                                else if (platform.includes('linkedin')) IconComponent = Linkedin;

                                                return (
                                                    <a key={idx} href={link.url} target="_blank" rel="noopener noreferrer" className="text-slate-300 hover:text-accent-gold transition-colors">
                                                        <IconComponent className="w-4 h-4" />
                                                    </a>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* TAGS */}
                        <div className="mt-8 flex flex-wrap gap-2">
                            {post.metaKeywords?.map((keyword: string, idx: number) => (
                                <span key={idx} className="text-[10px] font-bold text-slate-300 uppercase tracking-widest hover:text-navy-950 transition-colors cursor-pointer mr-3">
                                    #{keyword}
                                </span>
                            ))}
                        </div>
                    </article>

                    {/* RIGHT SIDEBAR (Desktop only) - Can be used for CTAs or Related News info */}
                    <aside className="hidden lg:block lg:col-span-3 lg:col-start-10">
                        <div className="sticky top-32 space-y-10">
                            {/* MINI CTA */}
                            <div className="bg-[#0F172A] p-8 text-white rounded-[2px] shadow-2xl">
                                <h5 className="font-playfair text-xl mb-4 leading-snug">Gotong Royong Pendidikan Umat</h5>
                                <p className="text-xs text-slate-400 leading-relaxed mb-6 font-lora italic">
                                    Jadilah bagian dari senyum dan cerita kesuksesan mereka.
                                </p>
                                <Link to="/donasi" className="block text-center bg-accent-gold py-3 text-[10px] font-bold uppercase tracking-[0.2em] text-[#0F172A] hover:bg-white transition-all">
                                    Donasi Sekarang
                                </Link>
                            </div>
                        </div>
                    </aside>
                </div>

                {/* 4. POST-ARTICLE BANNER CTAs - Strategic Conversion */}
                <section className="bg-white py-24 border-t border-slate-100">
                    <div className="max-w-6xl mx-auto px-6">
                        <div className="grid md:grid-cols-2 gap-8">
                            {/* Donation Banner */}
                            <div className="relative group overflow-hidden bg-slate-900 border border-slate-800 p-12">
                                <div className="absolute inset-0 opacity-20 pointer-events-none grayscale group-hover:grayscale-0 transition-all duration-700">
                                    <img src="https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?q=80&w=1200&auto=format&fit=crop" className="w-full h-full object-cover" alt="Support" />
                                </div>
                                <div className="relative z-10 flex flex-col items-center text-center">
                                    <h3 className="font-playfair text-white text-3xl mb-4">Mari Berbagi Kebaikan</h3>
                                    <p className="text-slate-400 text-sm mb-8 max-w-sm leading-relaxed">Dana yang terkumpul akan digunakan sepenuhnya untuk menunjang fasilitas dan operasional pendidikan santri di Pesantren Anak Yatim Al-Bisri.</p>
                                    <Link to="/donasi" className="bg-accent-gold text-navy-950 px-8 py-3.5 text-[10px] font-bold uppercase tracking-[0.2em] hover:scale-105 transition-transform">
                                        Pusat Donasi
                                    </Link>
                                </div>
                            </div>

                            {/* PSB Banner */}
                            <div className="relative group overflow-hidden bg-[#FBFBFA] border border-slate-200 p-12">
                                <div className="absolute inset-0 opacity-10 pointer-events-none group-hover:opacity-20 transition-opacity duration-700">
                                    <style>{`
                                        .dots-bg { backgroundImage: radial-gradient(#B59461 1px, transparent 1px); background-size: 20px 20px; }
                                    `}</style>
                                    <div className="w-full h-full dots-bg" />
                                </div>
                                <div className="relative z-10 flex flex-col items-center text-center">
                                    <h3 className="font-playfair text-navy-950 text-3xl mb-4">Pendaftaran Santri</h3>
                                    <p className="text-slate-500 text-sm mb-8 max-w-sm leading-relaxed">Kesempatan bergabung dengan keluarga besar Al-Bisri untuk masa depan yang mandiri dan berilmu.</p>
                                    <Link to="/psb" className="border-2 border-navy-950 text-navy-950 px-8 py-3 text-[10px] font-bold uppercase tracking-[0.2em] hover:bg-navy-950 hover:text-white transition-all">
                                        Info Pendaftaran
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* 5. RELATED NEWS - Modern Grid */}
                <section className="py-24 bg-slate-50 relative">
                    <div className="max-w-7xl mx-auto px-6">
                        <div className="flex items-center justify-between mb-12">
                            <h3 className="font-playfair text-4xl text-navy-950">Terus Menjelajahi</h3>
                            <Link to="/berita" className="text-[10px] font-bold uppercase tracking-widest text-[#B59461] hover:text-navy-950 border-b border-[#B59461]/30 pb-1">Lihat Semua Berita</Link>
                        </div>
                        <div className="grid md:grid-cols-3 gap-8">
                            {relatedPosts.map((item, idx) => (
                                <Link
                                    to={`/berita/${item.slug}`}
                                    key={idx}
                                    className="group bg-white border border-slate-200/50 hover:shadow-2xl hover:-translate-y-1 transition-all duration-400 rounded-[2px] overflow-hidden"
                                >
                                    <div className="aspect-[4/3] bg-slate-100 relative overflow-hidden">
                                        <img src={item.mainImage ? SanityService.imageUrl(item.mainImage) : "https://placehold.co/600x400"} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-transform duration-700 group-hover:scale-105" alt={item.title} />
                                        <div className="absolute top-4 left-4">
                                            <span className="bg-white/90 backdrop-blur-sm px-3 py-1 text-[9px] font-bold uppercase tracking-widest text-navy-950">{item.category || 'Berita'}</span>
                                        </div>
                                    </div>
                                    <div className="p-8">
                                        <span className="text-[9px] font-bold text-accent-gold uppercase tracking-[0.2em] mb-4 block">
                                            {item.publishedAt ? new Date(item.publishedAt).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' }) : ''}
                                        </span>
                                        <h4 className="font-playfair text-xl text-navy-950 group-hover:text-accent-gold transition-colors leading-snug">
                                            {item.title}
                                        </h4>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>
                </section>
            </main>

            <PublicFooter />
        </div>
    );
};

export default NewsDetailPage;
