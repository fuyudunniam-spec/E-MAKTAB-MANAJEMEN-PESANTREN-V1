import React, { useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Calendar, User, Tag, Share2, ArrowLeft, Clock, Bookmark, Facebook, MessageCircle, Twitter, Link as LinkIcon, BookOpen } from 'lucide-react';
import PublicNavbar from '../components/PublicNavbar';
import PublicFooter from '../components/PublicFooter';

const NewsDetailPage: React.FC = () => {
    const { slug } = useParams();

    useEffect(() => {
        window.scrollTo(0, 0);
    }, [slug]);

    // Mock Data - In real app, fetch based on slug
    const post = {
        title: "Transformasi Pendidikan Pesantren di Era Digital: Peluang & Tantangan",
        date: "20 Okt 2024",
        author: "Dr. H. Muhammad Ilham",
        category: "Opini",
        readingTime: "5 Menit Baca",
        image: "https://images.unsplash.com/photo-1542816417-0983c9c9ad53?q=80&w=2000&auto=format&fit=crop",
        content: `
      <p class="lead">Pesantren sebagai benteng pertahanan moral bangsa kini menghadapi tantangan baru di era disrupsi digital. Bagaimana Al-Bisri menjawab tantangan ini tanpa kehilangan jati diri?</p>
      
      <h3>Mengawinkan Tradisi dan Teknologi</h3>
      <p>Di Al-Bisri, kami percaya bahwa teknologi bukanlah ancaman bagi tradisi, melainkan alat (washilah) untuk memperluas jangkauan dakwah dan efisiensi pembelajaran. Implementasi sistem manajemen pembelajaran berbasis cloud dan digitalisasi kitab kuning adalah bukti nyata komitmen kami.</p>
      
      <p>Namun, kami tetap memegang teguh prinsip <em>"al-muhafadzah 'alal qadim al-shalih wal akhdzu bil jadid al-ashlah"</em> (memelihara tradisi lama yang baik dan mengambil hal baru yang lebih baik). Pengajian sorogan dan bandongan tetap berjalan sebagaimana mestinya, namun kini didukung dengan referensi digital yang lebih kaya.</p>

      <blockquote>
        "Teknologi di pesantren bukan untuk menggantikan peran Kyai, tetapi untuk meluaskan sayap hikmah beliau agar bisa menjangkau cakrawala yang lebih luas."
      </blockquote>

      <h3>Tantangan Akhlak di Dunia Maya</h3>
      <p>Digitalisasi juga membawa tantangan moral. Akses informasi yang tanpa batas menuntut kematangan spiritual santri. Oleh karena itu, kurikulum digital literacy di Al-Bisri tidak hanya mengajarkan 'cara menggunakan', tetapi juga 'adab menggunakan' teknologi.</p>
      
      <h3>Menyongsong Masa Depan</h3>
      <p>Dengan integrasi ini, kami optimis lulusan Al-Bisri tidak hanya akan menjadi ulama yang faqih, tetapi juga teknokrat yang mampu mewarnai peradaban digital dengan nilai-nilai Islami.</p>
    `
    };

    const relatedPosts = [
        { title: "Soft Launching Digital Library Al-Bisri", date: "10 Okt 2024", image: "https://images.unsplash.com/photo-1505664194779-8beaceb93744?q=80&w=400&auto=format&fit=crop" },
        { title: "Juara 1 Lomba Coding Santri Nasional", date: "05 Okt 2024", image: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=400&auto=format&fit=crop" },
        { title: "Urgensi Fiqih Muamalah Digital", date: "01 Okt 2024", image: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?q=80&w=400&auto=format&fit=crop" },
    ];

    return (
        <div className="min-h-screen bg-paper font-jakarta selection:bg-gold-200 selection:text-navy-950">
            <PublicNavbar />

            {/* HEADER HERO */}
            <header className="relative py-24 lg:py-32 px-6 bg-navy-950 text-white overflow-hidden">
                <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "url('https://www.transparenttextures.com/patterns/arabesque.png')" }}></div>
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gold-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>

                <div className="max-w-4xl mx-auto relative z-10 text-center animate-fade-in pt-10">
                    <Link to="/news" className="inline-flex items-center gap-2 text-accent-gold font-bold uppercase tracking-[0.2em] text-[10px] mb-8 hover:text-white transition-colors">
                        <ArrowLeft className="w-4 h-4" /> Kembali ke Berita
                    </Link>
                    <div className="flex items-center justify-center gap-4 mb-6">
                        <span className="bg-accent-gold text-navy-950 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider shadow-lg">
                            {post.category}
                        </span>
                        <span className="flex items-center gap-2 text-slate-400 text-xs font-bold uppercase tracking-wider">
                            <Clock className="w-3 h-3" /> {post.readingTime}
                        </span>
                    </div>
                    <h1 className="text-3xl md:text-5xl lg:text-6xl font-display text-white mb-8 leading-tight">
                        {post.title}
                    </h1>
                    <div className="flex items-center justify-center gap-6 text-sm text-slate-300 font-light">
                        <span className="flex items-center gap-2">
                            <User className="w-4 h-4 text-accent-gold" /> {post.author}
                        </span>
                        <div className="w-1 h-1 bg-accent-gold rounded-full"></div>
                        <span className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-accent-gold" /> {post.date}
                        </span>
                    </div>
                </div>
            </header>

            {/* CONTENT LAYOUT */}
            <div className="max-w-7xl mx-auto px-6 py-20">
                <div className="grid lg:grid-cols-12 gap-12 lg:gap-20">

                    {/* Share & Meta - Left Sidebar (Desktop) */}
                    <div className="hidden lg:block lg:col-span-1">
                        <div className="sticky top-32 flex flex-col gap-6 items-center">
                            <button className="w-12 h-12 rounded-full border border-stone-200 text-stone-400 hover:bg-royal-950 hover:text-white hover:border-royal-950 transition flex items-center justify-center group" title="Share via Facebook">
                                <Facebook className="w-5 h-5 group-hover:scale-110 transition" />
                            </button>
                            <button className="w-12 h-12 rounded-full border border-stone-200 text-stone-400 hover:bg-royal-950 hover:text-white hover:border-royal-950 transition flex items-center justify-center group" title="Share via Twitter">
                                <Twitter className="w-5 h-5 group-hover:scale-110 transition" />
                            </button>
                            <button className="w-12 h-12 rounded-full border border-stone-200 text-stone-400 hover:bg-gold-500 hover:text-royal-950 hover:border-gold-500 transition flex items-center justify-center group" title="Bookmark">
                                <Bookmark className="w-5 h-5 group-hover:scale-110 transition" />
                            </button>
                            <div className="h-20 w-px bg-stone-200"></div>
                        </div>
                    </div>

                    {/* Main Content */}
                    <article className="lg:col-span-7">
                        <figure className="mb-12 rounded-[2rem] overflow-hidden shadow-2xl relative">
                            <img src={post.image} alt={post.title} className="w-full aspect-video object-cover" />
                            <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-royal-950/50 to-transparent"></div>
                        </figure>

                        <div
                            className="prose prose-lg prose-slate max-w-none 
                            prose-headings:font-display prose-headings:text-navy-950 prose-headings:font-bold
                            prose-p:font-jakarta prose-p:font-light prose-p:leading-relaxed prose-p:text-slate-600
                            prose-lead:text-2xl prose-lead:font-display prose-lead:text-navy-800 prose-lead:font-medium
                            prose-blockquote:border-l-4 prose-blockquote:border-accent-gold prose-blockquote:bg-white prose-blockquote:py-6 prose-blockquote:px-8 prose-blockquote:rounded-r-xl prose-blockquote:not-italic prose-blockquote:font-display prose-blockquote:text-xl prose-blockquote:text-navy-900
                            strong:bg-gold-100 strong:px-1 strong:text-navy-950 strong:font-bold
                            "
                            dangerouslySetInnerHTML={{ __html: post.content }}
                        />

                        {/* Tags */}
                        <div className="mt-12 pt-8 border-t border-stone-200">
                            <div className="flex flex-wrap gap-3">
                                {['Pendidikan', 'Digitalisasi', 'Pesantren', 'Teknologi'].map(tag => (
                                    <span key={tag} className="px-4 py-2 bg-white text-slate-500 rounded-full text-xs font-bold uppercase tracking-wider hover:bg-navy-950 hover:text-white transition cursor-pointer border border-slate-100">
                                        # {tag}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </article>

                    {/* Right Sidebar */}
                    <aside className="lg:col-span-4 space-y-12">
                        {/* Author Widget */}
                        <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/50">
                            <span className="text-xs font-bold uppercase tracking-widest text-accent-gold mb-6 block">Tentang Penulis</span>
                            <div className="flex items-center gap-4 mb-4">
                                <img src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=200&auto=format&fit=crop" className="w-16 h-16 rounded-full object-cover border-2 border-white shadow-md" alt={post.author} />
                                <div>
                                    <h4 className="font-display font-bold text-lg text-navy-950">{post.author}</h4>
                                    <p className="text-xs text-slate-400">Direktur Pendidikan</p>
                                </div>
                            </div>
                            <p className="text-sm text-slate-500 font-light leading-relaxed mb-6">
                                Praktisi pendidikan Islam dengan pengalaman lebih dari 15 tahun dalam pengembangan kurikulum berbasis riset.
                            </p>
                            <button className="w-full py-3 rounded-full border border-navy-950 text-navy-950 text-xs font-bold uppercase tracking-widest hover:bg-navy-950 hover:text-white transition">
                                Lihat Profil
                            </button>
                        </div>

                        {/* Related Posts */}
                        <div>
                            <span className="text-xs font-bold uppercase tracking-widest text-stone-400 mb-6 block">Baca Juga</span>
                            <div className="space-y-6">
                                {relatedPosts.map((item, idx) => (
                                    <Link to="#" key={idx} className="group flex gap-4 items-start">
                                        <div className="w-24 h-24 rounded-2xl overflow-hidden shrink-0 relative">
                                            <img src={item.image} className="w-full h-full object-cover transition duration-500 group-hover:scale-110" alt={item.title} />
                                        </div>
                                        <div>
                                            <span className="text-[10px] bg-royal-50 text-royal-700 px-2 py-0.5 rounded-full font-bold uppercase mb-2 inline-block">Berita</span>
                                            <h4 className="font-display font-bold text-navy-950 leading-tight group-hover:text-accent-gold transition mb-2">
                                                {item.title}
                                            </h4>
                                            <span className="text-[10px] text-stone-400 font-bold uppercase tracking-widest">{item.date}</span>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </div>

                        {/* Newsletter Mini */}
                        <div className="bg-navy-950 rounded-[2rem] p-8 text-center text-white relative overflow-hidden">
                            <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "url('https://www.transparenttextures.com/patterns/arabesque.png')" }}></div>
                            <div className="relative z-10">
                                <h4 className="font-display text-2xl mb-2">Berlangganan</h4>
                                <p className="text-sm text-royal-200/80 mb-6 font-light">Dapatkan intisari kajian dan berita terbaru setiap minggu.</p>
                                <input type="email" placeholder="Alamat Email" className="w-full bg-white/10 border border-white/20 rounded-full px-5 py-3 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-gold-500 mb-4 transition" />
                                <button className="w-full py-3 bg-accent-gold text-navy-950 rounded-full text-xs font-bold uppercase tracking-widest hover:bg-white transition">
                                    Daftar
                                </button>
                            </div>
                        </div>
                    </aside>

                </div>
            </div>

            <PublicFooter />
        </div>
    );
};

export default NewsDetailPage;
