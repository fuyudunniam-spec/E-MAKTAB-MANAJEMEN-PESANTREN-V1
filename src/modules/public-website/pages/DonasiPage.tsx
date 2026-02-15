import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { ArrowRight, Heart, TrendingUp, Users, ShieldCheck, Send, MessageSquareHeart, ChevronDown } from 'lucide-react';
import PublicNavbar from '../components/PublicNavbar';
import PublicFooter from '../components/PublicFooter';
import { ProgramDonasiService, DoaHajatService, type ProgramDonasi, type DoaHajat } from '@/modules/donasi/services/donasi.service';

// ============================================
// HELPERS
// ============================================

const formatCurrency = (val: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(val);

// ============================================
// PROGRAM CARD with CTA
// ============================================

const ProgramCard: React.FC<{ program: ProgramDonasi }> = ({ program }) => {
  const progress = program.target_amount > 0
    ? Math.min(((program.akun_kas_saldo || 0) / program.target_amount) * 100, 100)
    : 0;

  return (
    <div className="group relative bg-white rounded-3xl border border-stone-100 overflow-hidden hover:shadow-xl hover:shadow-stone-200/50 transition-all duration-500">
      {/* Image */}
      <Link to={`/donasi/${program.slug}`} className="block">
        <div className="h-48 bg-stone-100 overflow-hidden">
          <img
            src={program.gambar_url || 'https://images.unsplash.com/photo-1542204637-e67bc7d41e0e?q=80&w=400&auto=format&fit=crop'}
            alt={program.nama}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
          />
        </div>
      </Link>

      {/* Content */}
      <div className="p-6 space-y-4">
        <Link to={`/donasi/${program.slug}`} className="block">
          <h3 className="font-display text-lg font-bold text-royal-900 group-hover:text-gold-700 transition-colors">{program.nama}</h3>
          {program.deskripsi && (
            <p className="text-sm text-stone-500 font-light line-clamp-2 mt-1.5">{program.deskripsi}</p>
          )}
        </Link>

        {program.target_amount > 0 && (
          <div className="space-y-2">
            <div className="w-full bg-stone-100 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-gold-500 h-full rounded-full transition-all duration-1000"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-stone-400">Terkumpul</span>
              <span className="text-gold-700 font-bold">{progress.toFixed(0)}%</span>
            </div>
          </div>
        )}

        <div className="flex items-center gap-3 pt-2 border-t border-stone-100">
          <Link
            to={`/donasi/${program.slug}`}
            className="flex-1 text-center py-2.5 text-xs font-bold uppercase tracking-widest text-royal-900 border border-stone-200 rounded-full hover:bg-stone-50 transition-all"
          >
            Lihat Detail
          </Link>
          <Link
            to={`/donasi/${program.slug}?donate=true`}
            className="flex-1 text-center py-2.5 text-xs font-bold uppercase tracking-widest text-white bg-royal-950 rounded-full hover:bg-gold-600 transition-all"
          >
            Donasi
          </Link>
        </div>
      </div>
    </div>
  );
};

// ============================================
// DOA LIST (Expandable with Animation)
// ============================================

const DoaListSection: React.FC<{ doas: DoaHajat[] }> = ({ doas }) => {
  const [expanded, setExpanded] = useState(false);
  const preview = doas.slice(0, 3);
  const rest = doas.slice(3);

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <MessageSquareHeart className="w-5 h-5 text-gold-600" />
        <h3 className="font-display text-xl font-bold text-royal-900">Doa Terbaru</h3>
        <span className="text-xs text-stone-400 bg-stone-100 px-2.5 py-1 rounded-full">{doas.length} doa</span>
      </div>

      {doas.length === 0 ? (
        <div className="bg-stone-50 rounded-2xl border border-stone-100 p-8 text-center">
          <p className="text-stone-400 font-light">Jadilah yang pertama mengirimkan doa</p>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Always show first 3 */}
          {preview.map((d, i) => (
            <div
              key={d.id}
              className="bg-white rounded-xl border border-stone-100 p-4 hover:shadow-md transition-all"
              style={{ animationDelay: `${i * 80}ms` }}
            >
              <div className="flex items-center gap-2 mb-2">
                <div className="w-7 h-7 rounded-full bg-gold-50 flex items-center justify-center">
                  <span className="text-gold-700 text-xs font-bold">{d.nama.charAt(0).toUpperCase()}</span>
                </div>
                <span className="text-sm font-medium text-royal-900">{d.nama}</span>
                <span className="text-xs text-stone-400 ml-auto">
                  {new Date(d.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                </span>
              </div>
              <p className="text-sm text-stone-600 leading-relaxed pl-9 font-light">{d.pesan_doa}</p>
            </div>
          ))}

          {/* Expandable rest */}
          {rest.length > 0 && (
            <>
              <div
                className="overflow-hidden transition-all duration-500 ease-in-out"
                style={{
                  maxHeight: expanded ? `${rest.length * 120}px` : '0px',
                  opacity: expanded ? 1 : 0,
                }}
              >
                <div className="space-y-3">
                  {rest.map((d, i) => (
                    <div
                      key={d.id}
                      className="bg-white rounded-xl border border-stone-100 p-4 hover:shadow-md transition-all"
                      style={{
                        transform: expanded ? 'translateY(0)' : 'translateY(-10px)',
                        opacity: expanded ? 1 : 0,
                        transition: `all 0.3s ease-out ${(i + 1) * 60}ms`,
                      }}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-7 h-7 rounded-full bg-gold-50 flex items-center justify-center">
                          <span className="text-gold-700 text-xs font-bold">{d.nama.charAt(0).toUpperCase()}</span>
                        </div>
                        <span className="text-sm font-medium text-royal-900">{d.nama}</span>
                        <span className="text-xs text-stone-400 ml-auto">
                          {new Date(d.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                        </span>
                      </div>
                      <p className="text-sm text-stone-600 leading-relaxed pl-9 font-light">{d.pesan_doa}</p>
                    </div>
                  ))}
                </div>
              </div>

              <button
                onClick={() => setExpanded(!expanded)}
                className="w-full py-3 text-sm font-bold uppercase tracking-widest text-stone-500 hover:text-royal-900 bg-stone-50 rounded-xl border border-stone-100 hover:bg-stone-100 transition-all flex items-center justify-center gap-2"
              >
                <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${expanded ? 'rotate-180' : ''}`} />
                {expanded ? 'Tutup' : `Lihat ${rest.length} Doa Lainnya`}
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
};

// ============================================
// MAIN PAGE
// ============================================

const DonasiPage: React.FC = () => {
  const [doaNama, setDoaNama] = useState('');
  const [doaPesan, setDoaPesan] = useState('');
  const [doaSent, setDoaSent] = useState(false);

  const { data: programs = [], isLoading: loadingPrograms } = useQuery({
    queryKey: ['publicPrograms'],
    queryFn: ProgramDonasiService.getActivePublic,
  });

  const { data: doas = [] } = useQuery({
    queryKey: ['publicDoas'],
    queryFn: () => DoaHajatService.getVisible(30),
  });

  const mSubmitDoa = useMutation({
    mutationFn: () => DoaHajatService.submit({
      nama: doaNama.trim() || 'Hamba Allah',
      pesan_doa: doaPesan.trim(),
      no_wa: '',
      is_public: true,
    }),
    onSuccess: () => {
      setDoaSent(true);
      setDoaNama('');
      setDoaPesan('');
      setTimeout(() => setDoaSent(false), 5000);
    },
  });

  useEffect(() => { window.scrollTo(0, 0); }, []);

  return (
    <div className="bg-stone-50 text-royal-900 font-sans min-h-screen selection:bg-gold-200 selection:text-royal-950">
      <PublicNavbar />

      {/* ==================== HERO ==================== */}
      <header className="relative pt-32 pb-20 lg:pt-40 lg:pb-28 px-6 bg-royal-950 text-white overflow-hidden">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "url('https://www.transparenttextures.com/patterns/arabesque.png')" }} />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-gold-500/10 rounded-full blur-3xl" />
        <div className="absolute top-0 right-0 w-2/3 h-full bg-gradient-to-l from-royal-900/50 to-transparent pointer-events-none" />

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="max-w-3xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-[1px] bg-gold-500" />
              <span className="text-gold-500 text-xs font-bold uppercase tracking-[0.3em]">Donasi & Infaq</span>
            </div>

            <h1 className="font-display text-4xl lg:text-6xl leading-tight mb-6">
              Salurkan Amanah, <br /><span className="text-gold-500 italic font-serif">Raih Keberkahan.</span>
            </h1>

            <p className="text-slate-300 font-light max-w-xl text-lg leading-relaxed mb-8">
              Setiap kontribusi Anda membantu pesantren dalam mencetak generasi
              berilmu, berakhlak, dan mandiri.
            </p>

            <div className="flex flex-wrap gap-4">
              <a
                href="#program-donasi"
                onClick={(e) => { e.preventDefault(); document.getElementById('program-donasi')?.scrollIntoView({ behavior: 'smooth' }); }}
                className="px-8 py-4 bg-gold-500 text-royal-950 rounded-full font-bold uppercase tracking-widest hover:bg-white transition-all duration-300 flex items-center gap-2"
              >
                Pilih Program <ArrowRight className="w-4 h-4" />
              </a>
              <Link
                to="/transparansi"
                className="px-8 py-4 border border-white/20 text-white rounded-full font-bold uppercase tracking-widest hover:bg-white/5 hover:border-white/40 transition-all duration-300"
              >
                Transparansi
              </Link>
            </div>

            <div className="pt-8 flex items-center gap-8 border-t border-white/10 mt-10">
              <div>
                <p className="text-3xl font-display font-bold text-white">{programs.length}</p>
                <p className="text-xs text-slate-400 uppercase tracking-widest mt-1">Program Aktif</p>
              </div>
              <div className="w-px h-10 bg-white/10" />
              <div>
                <p className="text-3xl font-display font-bold text-white">100%</p>
                <p className="text-xs text-slate-400 uppercase tracking-widest mt-1">Transparan</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* ==================== PROGRAM CARDS ==================== */}
      <section id="program-donasi" className="py-20 px-6 -mt-10 relative z-20">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12 space-y-3">
            <span className="text-gold-600 font-bold uppercase tracking-[0.2em] text-xs">Program Kami</span>
            <h2 className="font-display text-3xl md:text-4xl text-royal-900">Pilih Program Donasi</h2>
            <div className="w-16 h-1 bg-gold-500/30 mx-auto rounded-full" />
          </div>

          {loadingPrograms ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-[380px] bg-white rounded-3xl border border-stone-100 animate-pulse" />
              ))}
            </div>
          ) : programs.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-3xl border border-stone-100">
              <Heart className="w-16 h-16 mx-auto text-stone-200 mb-4" />
              <p className="text-stone-400 text-lg font-light">Program donasi akan segera tersedia</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {programs.map(p => <ProgramCard key={p.id} program={p} />)}
            </div>
          )}
        </div>
      </section>

      {/* ==================== DOA & HAJAT ==================== */}
      <section className="py-20 px-6 bg-stone-100/50 rounded-t-[3rem]">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16">
            {/* Form */}
            <div>
              <span className="text-gold-600 text-xs font-bold uppercase tracking-[0.2em] mb-4 block">Buku Doa</span>
              <h2 className="font-display text-3xl text-royal-900 mb-4">Titipkan Doa & Hajat</h2>
              <p className="text-stone-500 leading-relaxed mb-8 font-light">
                Sampaikan doa dan hajat Anda. Insya Allah para santri, ustadz, dan pengasuh pesantren akan turut mendoakan di waktu ba'da Maghrib.
              </p>

              {doaSent ? (
                <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-8 text-center">
                  <div className="w-14 h-14 mx-auto bg-emerald-100 rounded-full flex items-center justify-center mb-4">
                    <Heart className="w-7 h-7 text-emerald-600" />
                  </div>
                  <h3 className="font-display text-xl text-royal-900 mb-2">Jazakallahu Khairan</h3>
                  <p className="text-stone-500 text-sm font-light">Doa Anda telah kami terima dan akan ditinjau oleh pengurus.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-2 block">Nama Anda</label>
                    <input
                      type="text"
                      value={doaNama}
                      onChange={e => setDoaNama(e.target.value)}
                      placeholder="Hamba Allah"
                      className="w-full bg-white border border-stone-200 rounded-xl px-5 py-3.5 text-royal-900 placeholder:text-stone-300 focus:outline-none focus:border-gold-500 focus:ring-1 focus:ring-gold-200 transition-all"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-2 block">Doa / Hajat</label>
                    <textarea
                      value={doaPesan}
                      onChange={e => setDoaPesan(e.target.value)}
                      rows={4}
                      placeholder="Tuliskan doa atau hajat Anda..."
                      className="w-full bg-white border border-stone-200 rounded-xl px-5 py-3.5 text-royal-900 placeholder:text-stone-300 focus:outline-none focus:border-gold-500 focus:ring-1 focus:ring-gold-200 transition-all resize-none"
                    />
                  </div>
                  <button
                    onClick={() => { if (doaPesan.trim()) mSubmitDoa.mutate(); }}
                    disabled={!doaPesan.trim() || mSubmitDoa.isPending}
                    className="px-8 py-3.5 bg-royal-950 text-white rounded-full font-bold uppercase tracking-widest hover:bg-gold-600 transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    <Send className="w-4 h-4" />
                    {mSubmitDoa.isPending ? 'Mengirim...' : 'Kirim Doa'}
                  </button>
                </div>
              )}
            </div>

            {/* Doa List */}
            <DoaListSection doas={doas} />
          </div>
        </div>
      </section>

      {/* ==================== TRANSPARENCY CTA ==================== */}
      <section className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="bg-royal-950 rounded-[2.5rem] p-12 lg:p-16 relative overflow-hidden">
            <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: "url('https://www.transparenttextures.com/patterns/arabesque.png')" }} />

            <div className="relative z-10 text-center max-w-2xl mx-auto">
              <span className="text-gold-500 font-bold uppercase tracking-[0.2em] text-xs mb-4 block">Transparansi Keuangan</span>
              <h2 className="font-display text-3xl md:text-4xl text-white mb-6">
                Amanah Anda, Tanggung Jawab Kami
              </h2>
              <p className="text-slate-300 font-light text-lg mb-10 leading-relaxed">
                Setiap rupiah yang Anda donasikan tercatat dan dapat diakses laporannya secara real-time.
              </p>

              <Link
                to="/transparansi"
                className="inline-flex items-center gap-2 px-8 py-4 bg-gold-500 text-royal-950 rounded-full font-bold uppercase tracking-widest hover:bg-white transition-all duration-300"
              >
                Lihat Laporan <ArrowRight className="w-4 h-4" />
              </Link>

              <div className="flex justify-center gap-12 mt-12 pt-8 border-t border-white/10">
                <div className="text-center">
                  <ShieldCheck className="w-5 h-5 text-gold-500 mx-auto mb-1" />
                  <p className="text-[10px] text-slate-400 uppercase tracking-widest">Audit Internal</p>
                </div>
                <div className="text-center">
                  <TrendingUp className="w-5 h-5 text-emerald-400 mx-auto mb-1" />
                  <p className="text-[10px] text-slate-400 uppercase tracking-widest">Real-time</p>
                </div>
                <div className="text-center">
                  <Users className="w-5 h-5 text-blue-400 mx-auto mb-1" />
                  <p className="text-[10px] text-slate-400 uppercase tracking-widest">500+ Santri</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
};

export default DonasiPage;
