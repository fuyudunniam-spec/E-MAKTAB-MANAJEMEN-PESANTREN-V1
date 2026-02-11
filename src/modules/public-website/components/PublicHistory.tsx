import React from 'react';
import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const PublicHistory: React.FC = () => {
    return (
        <section id="jejak" className="py-32 px-6 lg:px-10 bg-white overflow-hidden">
            <div className="max-w-7xl mx-auto">
                <div className="grid lg:grid-cols-2 gap-12 lg:gap-24 items-center">

                    <div className="relative animate-slide-in order-2 lg:order-1">
                        <div className="relative rounded-sm overflow-hidden shadow-2xl aspect-[4/5] lg:aspect-square group bg-slate-100">
                            {/* UPDATED IMAGE URL: Architecture/Mosque Interior */}
                            <img src="https://images.unsplash.com/photo-1564121211835-e88c852648ab?q=80&w=1000" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" alt="Arsitektur Pesantren" />
                            <div className="absolute inset-0 bg-navy-950/20"></div>

                            <div className="absolute bottom-8 right-8 bg-white p-6 shadow-xl rounded-sm border-t-4 border-accent-gold z-20 max-w-[200px]">
                                <h4 className="font-playfair text-2xl text-navy-900 mb-1">TRADISI</h4>
                                <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Sanad Keilmuan</p>
                            </div>
                        </div>
                        <div className="absolute -top-10 -left-10 w-full h-full border border-slate-200 -z-10"></div>
                    </div>

                    <div className="animate-fade-in order-1 lg:order-2">
                        <span className="text-accent-gold text-xs font-bold uppercase tracking-[0.3em] mb-4 block">Filosofi & Sejarah</span>

                        <h2 className="font-playfair text-4xl lg:text-6xl text-navy-900 leading-[1.1] mb-8">
                            Menjaga Tradisi, <br />
                            <span className="italic text-slate-400 font-normal">Membangun Peradaban.</span>
                        </h2>

                        <p className="text-slate-600 text-base lg:text-lg font-light leading-relaxed mb-8">
                            Pendidikan di Al-Bisri bukan sekadar transfer ilmu, melainkan pewarisan nilai. Kami memadukan kemurnian <em>turats</em> (kitab klasik) dengan wawasan global, disokong oleh kemandirian ekonomi yang memastikan pelita ilmu ini terus menyala bagi siapa saja, tanpa terkecuali.
                        </p>

                        <div className="border-l-4 border-accent-gold pl-8 py-2 mb-10">
                            <p className="text-navy-900 font-playfair text-xl italic leading-relaxed">
                                "Setiap anak yatim yang kami asuh adalah aset umat. Kemandirian lembaga adalah kunci untuk menjaga martabat dan keberlanjutan masa depan mereka."
                            </p>
                        </div>

                        <Link to="/tentang-kami" className="group inline-flex items-center gap-4 text-xs font-bold uppercase tracking-widest text-navy-900 hover:text-accent-gold transition-colors border-b border-navy-900 pb-1 hover:border-accent-gold">
                            SELAMI SEJARAH KAMI
                            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-2" />
                        </Link>
                    </div>

                </div>
            </div>
        </section>
    );
};

export default PublicHistory;
