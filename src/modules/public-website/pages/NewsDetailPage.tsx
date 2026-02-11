import React, { useEffect } from 'react';
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

        // Update SEO meta tags
        if (post) {
            document.title = `${post.title} | Pesantren Al-Bisri`;

            // Meta description
            const metaDesc = document.querySelector('meta[name="description"]');
            if (metaDesc) {
                metaDesc.setAttribute('content', post.metaDescription || post.excerpt || post.title);
            }

            // Meta keywords
            let metaKeywords = document.querySelector('meta[name="keywords"]');
            if (!metaKeywords) {
                metaKeywords = document.createElement('meta');
                metaKeywords.setAttribute('name', 'keywords');
                document.head.appendChild(metaKeywords);
            }
            if (post.metaKeywords && Array.isArray(post.metaKeywords)) {
                metaKeywords.setAttribute('content', post.metaKeywords.join(', '));
            }

            // Open Graph tags
            let ogTitle = document.querySelector('meta[property="og:title"]');
            if (!ogTitle) {
                ogTitle = document.createElement('meta');
                ogTitle.setAttribute('property', 'og:title');
                document.head.appendChild(ogTitle);
            }
            ogTitle.setAttribute('content', post.title);

            let ogImage = document.querySelector('meta[property="og:image"]');
            if (!ogImage) {
                ogImage = document.createElement('meta');
                ogImage.setAttribute('property', 'og:image');
                document.head.appendChild(ogImage);
            }
            if (post.ogImage || post.mainImage) {
                ogImage.setAttribute('content', SanityService.imageUrl(post.ogImage || post.mainImage));
            }
        }
    }, [slug, post]);

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

    return (
        <div className="min-h-screen bg-[#FBFBFA] font-jakarta selection:bg-accent-gold selection:text-white">
            <PublicNavbar />

            {/* 1. NAVIGATION SPACER (Navbar is fixed/sticky usually, assuming PublicNavbar handles it or we need padding) */}
            {/* If PublicNavbar is fixed, we need pt-20. If not, this is fine. Based on user code, nav is fixed top-0 w-full h-20. */}

            {/* 2. ARTICLE HEADER */}
            <header className="pt-32 pb-12 px-6 bg-white border-b border-slate-100">
                <div className="max-w-3xl mx-auto text-center">

                    {/* Meta Info */}
                    <div className="flex justify-center items-center gap-4 mb-6 text-xs font-bold uppercase tracking-widest text-slate-400">
                        <span className="text-accent-gold">{post.category || 'Berita'}</span>
                        <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                        <span>{post.publishedAt ? new Date(post.publishedAt).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' }) : '-'}</span>
                        <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                        <span>{post.readingTime || '3 Menit Baca'}</span>
                    </div>

                    {/* Headline */}
                    <h1 className="font-playfair text-4xl md:text-5xl lg:text-6xl text-navy-950 leading-[1.1] mb-8 font-bold">
                        {post.title}
                    </h1>

                    {/* Author */}
                    <div className="flex justify-center items-center gap-3">
                        <div className="w-10 h-10 bg-slate-200 rounded-full overflow-hidden border border-slate-100">
                            <img
                                src={post.author?.photo ? SanityService.imageUrl(post.author.photo) : "https://placehold.co/100x100?text=Author"}
                                className="w-full h-full object-cover"
                                alt={post.author?.name}
                            />
                        </div>
                        <div className="text-left">
                            <p className="text-xs font-bold text-navy-950 uppercase tracking-wider">Oleh: {post.author?.name || 'Redaksi Al-Bisri'}</p>
                            <p className="text-[10px] text-slate-500 uppercase tracking-widest">{post.author?.role || 'Kontributor'}</p>
                        </div>
                    </div>
                </div>
            </header>

            {/* 3. FEATURED IMAGE */}
            <div className="max-w-5xl mx-auto px-6 -mt-8 mb-16 relative z-10">
                <div className="aspect-video w-full overflow-hidden rounded-sm shadow-xl bg-slate-100">
                    <img
                        src={post.mainImage ? SanityService.imageUrl(post.mainImage) : "https://placehold.co/1200x600?text=Detail+Berita"}
                        className="w-full h-full object-cover"
                        alt={post.title}
                    />
                </div>
                <p className="text-center text-xs text-slate-400 mt-4 italic font-lora">
                    {post.excerpt || post.title}
                </p>
            </div>

            {/* 4. ARTICLE CONTENT */}
            <article className="max-w-2xl mx-auto px-6 mb-24 relative">

                {/* Custom Styles Implemented as Styled JSX for Scoped Isolation */}
                <style>{`
                    .article-body {
                        color: #1F2937; /* Ink Color */
                    }
                    .article-body p {
                        margin-bottom: 1.5em;
                        line-height: 1.8;
                        font-family: 'Lora', serif;
                        color: #1F2937;
                    }
                    /* Mobile size default, Desktop media query below */
                    .article-body p { font-size: 1.125rem; } /* 18px */
                    @media (min-width: 768px) {
                        .article-body p { font-size: 1.25rem; } /* 20px */
                    }

                    /* Drop Cap targeting the first paragraph's first letter */
                    /* Note: This assumes the content from PortableText generates <p> tags inside the wrapper */
                    .article-body > div > p:first-of-type::first-letter,
                    .article-body > p:first-of-type::first-letter {
                        float: left;
                        font-family: 'Playfair Display', serif;
                        font-size: 4.5rem;
                        line-height: 0.85;
                        font-weight: 700;
                        margin-right: 0.5rem;
                        margin-top: 0.2rem;
                        color: #0F172A;
                    }

                    .article-body blockquote {
                        border-left: 3px solid #B59461;
                        padding-left: 1.5rem;
                        margin: 2.5rem 0;
                        font-family: 'Playfair Display', serif;
                        font-style: italic;
                        color: #4B5563;
                        font-size: 1.5rem;
                        background: transparent;
                    }

                    .article-body strong {
                        font-weight: 700;
                        color: #0F172A;
                    }
                    
                    .article-body a {
                        color: #B59461;
                        text-decoration: underline;
                        text-decoration-color: rgba(181, 148, 97, 0.3);
                        transition: all 0.2s;
                    }
                    .article-body a:hover {
                        text-decoration-color: #B59461;
                        color: #92400e;
                    }

                    .article-body h2, .article-body h3, .article-body h4 {
                        font-family: 'Playfair Display', serif;
                        color: #0F172A;
                        font-weight: 700;
                        margin-top: 2.5em;
                        margin-bottom: 1em;
                        line-height: 1.2;
                    }
                    .article-body h2 { font-size: 2rem; }
                    .article-body h3 { font-size: 1.75rem; }

                    .article-body ul, .article-body ol {
                        margin-bottom: 1.5em;
                        padding-left: 1.5em;
                        font-family: 'Lora', serif;
                        font-size: 1.125rem;
                        color: #1F2937;
                    }
                    @media (min-width: 768px) {
                        .article-body ul, .article-body ol { font-size: 1.25rem; }
                    }
                    .article-body li {
                        margin-bottom: 0.5em;
                        padding-left: 0.5em;
                    }
                    .article-body ul { list-style-type: disc; }
                    .article-body ol { list-style-type: decimal; }
                `}</style>

                <div className="article-body text-justify">
                    {Array.isArray(post.content) ? (
                        <PortableText value={post.content} />
                    ) : (
                        <div dangerouslySetInnerHTML={{ __html: post.content || '' }} />
                    )}
                </div>

                {/* Author Bio Box */}
                <div className="bg-slate-50 p-8 my-12 border border-slate-100 rounded-sm">
                    <h4 className="font-bold text-sm uppercase tracking-widest text-navy-950 mb-4 border-b border-slate-200 pb-2 inline-block">Tentang Penulis</h4>
                    <div className="flex flex-col md:flex-row gap-6 items-start">
                        <img
                            src={post.author?.photo ? SanityService.imageUrl(post.author.photo) : "https://placehold.co/100x100?text=Author"}
                            className="w-16 h-16 rounded-full object-cover border border-slate-200 shadow-sm shrink-0"
                            alt={post.author?.name}
                        />
                        <div>
                            <p className="text-lg font-playfair font-bold text-navy-950 mb-1">{post.author?.name}</p>
                            <p className="text-base mb-4 font-lora text-slate-600 leading-relaxed">
                                {post.author?.description || 'Penulis aktif di Pesantren Al-Bisri yang berdedikasi untuk menyebarkan ilmu dan kebaikan.'}
                            </p>

                            {/* Social Links inside Author Box */}
                            {post.author?.socialLinks && post.author.socialLinks.length > 0 && (
                                <div className="flex gap-4">
                                    {post.author.socialLinks.map((link: any, idx: number) => {
                                        const platform = link.platform.toLowerCase();
                                        let IconComponent = Globe;
                                        if (platform.includes('facebook')) IconComponent = Facebook;
                                        else if (platform.includes('twitter') || platform.includes('x.com')) IconComponent = Twitter;
                                        else if (platform.includes('instagram')) IconComponent = Instagram;
                                        else if (platform.includes('linkedin')) IconComponent = Linkedin;
                                        else if (platform.includes('mail') || platform.includes('email')) IconComponent = Mail;

                                        return (
                                            <a key={idx} href={link.url} target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-accent-gold transition-colors" title={platform}>
                                                <IconComponent className="w-5 h-5" />
                                            </a>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Tags */}
                <div className="mt-12 pt-8 border-t border-slate-200">
                    <div className="flex flex-wrap gap-2">
                        {post.metaKeywords && post.metaKeywords.length > 0 ? (
                            post.metaKeywords.map((keyword: string, idx: number) => (
                                <span key={idx} className="px-4 py-1 bg-slate-100 text-slate-600 text-xs font-bold uppercase tracking-widest hover:bg-navy-950 hover:text-white transition-colors cursor-pointer">
                                    #{keyword}
                                </span>
                            ))
                        ) : (
                            <span className="px-4 py-1 bg-slate-100 text-slate-600 text-xs font-bold uppercase tracking-widest hover:bg-navy-950 hover:text-white transition-colors cursor-pointer">
                                #{post.category || 'Berita'}
                            </span>
                        )}
                    </div>
                </div>

                {/* Share */}
                <div className="mt-8 flex items-center gap-4">
                    <span className="text-xs font-bold uppercase tracking-widest text-slate-400">Bagikan:</span>
                    <button
                        onClick={() => window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`, '_blank')}
                        className="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center text-slate-500 hover:border-[#1877F2] hover:text-[#1877F2] transition-all"
                        title="Share on Facebook"
                    >
                        <Facebook className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(window.location.href)}&text=${encodeURIComponent(post.title)}`, '_blank')}
                        className="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center text-slate-500 hover:border-black hover:text-black transition-all"
                        title="Share on X"
                    >
                        <Twitter className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(post.title + ' ' + window.location.href)}`, '_blank')}
                        className="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center text-slate-500 hover:border-[#25D366] hover:text-[#25D366] transition-all"
                        title="Share on WhatsApp"
                    >
                        <MessageCircle className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => navigator.clipboard.writeText(window.location.href)}
                        className="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center text-slate-500 hover:border-accent-gold hover:text-accent-gold transition-all"
                        title="Copy Link"
                    >
                        <LinkIcon className="w-4 h-4" />
                    </button>
                </div>

            </article>

            {/* 5. RELATED NEWS */}
            <section className="py-20 bg-slate-50 border-t border-slate-200">
                <div className="max-w-7xl mx-auto px-6">
                    <h3 className="font-playfair text-3xl text-navy-950 mb-10 text-center">Berita Lainnya</h3>
                    <div className="grid md:grid-cols-3 gap-8">
                        {relatedPosts.map((item, idx) => (
                            <div key={idx} className="group cursor-pointer">
                                <div className="aspect-[4/3] bg-white mb-4 overflow-hidden rounded-sm relative">
                                    <div className="absolute inset-0 bg-navy-950/0 group-hover:bg-navy-950/10 transition z-10"></div>
                                    <img src={item.image} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" alt={item.title} />
                                </div>
                                <span className="text-[9px] font-bold text-accent-gold uppercase tracking-widest mb-2 block">{item.date}</span>
                                <h4 className="font-playfair text-lg text-navy-950 leading-snug group-hover:text-accent-gold transition-colors">
                                    {item.title}
                                </h4>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <PublicFooter />
        </div>
    );
};

export default NewsDetailPage;
