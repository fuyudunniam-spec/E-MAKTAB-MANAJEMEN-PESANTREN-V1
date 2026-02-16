
import React, { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { SanityService } from '../services/sanity.service';
import PublicNavbar from '../components/PublicNavbar';
import PublicFooter from '../components/PublicFooter';
import { BookOpen, GraduationCap, School, CheckCircle2, ArrowRight } from 'lucide-react';
import { IconMapper } from '@/components/ui/IconMapper';
import { Link } from 'react-router-dom';

const PublicProgramPage: React.FC = () => {
    const { data: psbData, isLoading } = useQuery({
        queryKey: ['psbPage'],
        queryFn: SanityService.getPsbPageData
    });

    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    const programs = psbData?.programs || [];

    return (
        <div className="min-h-screen bg-paper font-jakarta selection:bg-gold-200 selection:text-navy-950">
            <PublicNavbar />

            {/* HERO */}
            <header className="relative py-32 lg:py-48 px-6 bg-navy-950 text-white overflow-hidden">
                <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "url('https://www.transparenttextures.com/patterns/arabesque.png')" }}></div>
                <div className="absolute -bottom-24 right-0 w-[500px] h-[500px] bg-gold-500/10 rounded-full blur-3xl"></div>

                <div className="relative z-10 text-center max-w-4xl mx-auto animate-fade-in">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 mb-6 backdrop-blur">
                        <span className="w-1.5 h-1.5 rounded-full bg-accent-gold"></span>
                        <span className="text-accent-gold font-bold uppercase tracking-[0.2em] text-[10px]">Kurikulum & Pendidikan</span>
                    </div>
                    <h1 className="text-5xl md:text-7xl font-display font-medium text-white mb-8 leading-tight">
                        Program Pendidikan <br />
                        <span className="italic text-accent-gold font-serif">Berkelanjutan</span>
                    </h1>
                    <p className="text-lg md:text-xl text-slate-300 leading-relaxed max-w-2xl mx-auto font-light">
                        Membangun generasi Qur'ani yang intelek dan mandiri melalui integrasi kurikulum salaf dan modern.
                    </p>
                </div>
            </header>

            {/* PROGRAMS GRID */}
            <section className="py-24 px-6 -mt-20 relative z-20">
                <div className="max-w-7xl mx-auto">
                    {isLoading ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {[1, 2, 3].map(i => <div key={i} className="h-96 bg-white rounded-[2.5rem] animate-pulse"></div>)}
                        </div>
                    ) : programs.length === 0 ? (
                        <div className="text-center py-20 bg-white rounded-[2.5rem] shadow-sm">
                            <p className="text-slate-500">Belum ada data program.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            {programs.map((program: any, i: number) => (
                                <div key={i} className="group bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-lg hover:shadow-2xl hover:border-gold-200 transition-all duration-500 flex flex-col h-full">
                                    <div className="w-16 h-16 rounded-2xl bg-paper flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500">
                                        <IconMapper name={program.iconName} className="w-8 h-8 text-navy-950" />
                                    </div>

                                    <h3 className="text-2xl font-display font-bold text-navy-950 mb-3">{program.title}</h3>
                                    <p className="text-slate-500 leading-relaxed font-light text-sm mb-8 line-clamp-3">
                                        {program.description}
                                    </p>

                                    <div className="bg-paper rounded-2xl p-6 mb-8 border border-slate-100 group-hover:bg-royal-50 group-hover:border-royal-100 transition-colors">
                                        <p className="text-[10px] uppercase tracking-widest font-bold text-slate-400 mb-1">Infaq Pendidikan</p>
                                        <div className="flex items-baseline gap-1">
                                            <span className="text-2xl font-display font-bold text-navy-950">{program.price}</span>
                                            <span className="text-sm text-slate-400 font-light">{program.paymentPeriod}</span>
                                        </div>
                                    </div>

                                    <ul className="space-y-3 mb-10 flex-grow">
                                        {program.features?.map((feat: string, idx: number) => (
                                            <li key={idx} className="flex items-start gap-3 text-sm text-stone-600 font-light">
                                                <CheckCircle2 className="w-4 h-4 text-gold-500 shrink-0 mt-0.5" />
                                                {feat}
                                            </li>
                                        ))}
                                    </ul>

                                    <div className="mt-auto">
                                        <Link to={`/psb/register?type=${program.slug?.current}`} className="w-full block text-center py-4 bg-navy-950 text-white rounded-full font-bold text-xs uppercase tracking-widest hover:bg-gold-500 hover:text-navy-950 transition-all duration-300">
                                            Daftar Sekarang
                                        </Link>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </section>

            <PublicFooter />
        </div>
    );
};

export default PublicProgramPage;
