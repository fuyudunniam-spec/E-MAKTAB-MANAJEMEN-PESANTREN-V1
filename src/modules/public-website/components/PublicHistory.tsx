import React from 'react';
import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { SanityService } from '../services/sanity.service';

interface PublicHistoryProps {
    data?: any;
}

const STATS = [
    { value: '2010', label: 'Tahun Transformasi', suffix: '' },
    { value: '200+', label: 'Santri Aktif', suffix: '' },
    { value: '100%', label: 'Beasiswa Penuh', suffix: '' },
    { value: '1.2k+', label: 'Alumni Tersebar', suffix: '' },
];

const PublicHistory: React.FC<PublicHistoryProps> = ({ data }) => {
    const descriptionText = data?.description
        ? data.description.map((block: any) => block.children.map((c: any) => c.text).join('')).join(' ')
        : null;

    const stats = data?.stats || STATS;

    return (
        <section id="jejak" className="py-24 bg-[#0f172a] text-white relative overflow-hidden">
            {/* Subtle background pattern */}
            <div className="absolute inset-0 opacity-[0.04]" style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
            }} />
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#c09c53]/5 rounded-full blur-3xl" />

            <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-16 relative z-10">

                {/* Left: Text Content */}
                <div>
                    <h4 className="text-[10px] font-bold tracking-[0.2em] text-[#c09c53] uppercase mb-4 flex items-center gap-3">
                        <span className="w-8 h-px bg-[#c09c53]" />
                        {data?.badge || 'Sejarah & Dedikasi'}
                    </h4>

                    <h2 className="text-3xl md:text-5xl font-serif leading-tight mb-8">
                        {data?.title || 'Merawat Fitrah,'}<br />
                        <span className="italic text-slate-400 font-normal">{data?.subtitle || 'Membangun Peradaban.'}</span>
                    </h2>

                    <div className="space-y-5 text-slate-400 leading-relaxed text-sm md:text-[0.95rem] border-l border-[#c09c53]/30 pl-6">
                        {descriptionText ? (
                            <p>{descriptionText}</p>
                        ) : (
                            <>
                                <p>
                                    Bermula dari sebuah rumah wakaf sederhana, KH. Bisri Mustofa (Alm) memulai majelis taklim kecil dengan lima orang santri yatim. Niat beliau sederhana: memberikan hak pendidikan bagi mereka yang kurang beruntung.
                                </p>
                                <p>
                                    Pada tahun 2010, Yayasan Al-Bisri resmi bertransformasi menjadi lembaga pendidikan terpadu yang memadukan kurikulum salaf dengan sistem sekolah formal modern, di bawah pembinaan Pesantren Mahasiswa An-Nur.
                                </p>
                            </>
                        )}
                    </div>

                    <Link
                        to="/tentang-kami"
                        className="mt-10 group inline-flex items-center gap-3 text-[10px] font-bold uppercase tracking-widest text-white hover:text-[#c09c53] transition-colors border-b border-white/20 pb-1 hover:border-[#c09c53]"
                    >
                        Selami Sejarah Kami
                        <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-2" />
                    </Link>
                </div>

                {/* Right: Stat Cards */}
                <div className="grid grid-cols-2 gap-4 content-center">
                    {stats.map((stat: any, i: number) => (
                        <div
                            key={i}
                            className="border border-white/10 p-7 hover:border-[#c09c53]/40 hover:bg-white/5 transition-all duration-300 group"
                        >
                            <p className="text-3xl md:text-4xl font-serif text-white mb-2 group-hover:text-[#c09c53] transition-colors">
                                {stat.value}
                            </p>
                            <p className="text-[9px] text-slate-500 uppercase tracking-[0.2em] font-bold">
                                {stat.label}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default PublicHistory;
