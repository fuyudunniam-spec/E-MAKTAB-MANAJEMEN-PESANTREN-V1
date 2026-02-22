import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  Heart, ArrowRight, CheckCircle2, Loader2, Upload, X,
  Users, Star, Shield, ChevronDown, Send, BookOpen,
  Clock, BadgeCheck, Copy, Check, PhoneCall, HeartHandshake,
  Sparkles
} from 'lucide-react';
import PublicNavbar from '../components/PublicNavbar';
import PublicFooter from '../components/PublicFooter';
import {
  DnsSubmissionService,
  DnsSocialProofService,
  DnsRekeningService,
  type DnsSocialProofItem,
  type DnsRekeningDisplay,
} from '@/modules/donasi/services/dns.service';
// ============================================
// HELPERS
// ============================================

const formatRp = (n: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n);

const timeAgo = (dateStr: string) => {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'baru saja';
  if (m < 60) return `${m} menit lalu`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} jam lalu`;
  const d = Math.floor(h / 24);
  return `${d} hari lalu`;
};

const QUICK_AMOUNTS = [25000, 50000, 100000, 250000, 500000, 1000000];

// ================================================
// REKENING CARD — Elegant white bank card
// ================================================

const RekeningCard = ({ r }: { r: DnsRekeningDisplay }) => {
  const [copied, setCopied] = useState(false);

  const copy = () => {
    navigator.clipboard.writeText(r.nomor_rekening).catch(() => {
      // fallback for older browsers
      const el = document.createElement('textarea');
      el.value = r.nomor_rekening;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
    });
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
      {/* Bank name row */}
      <p className="text-[10px] font-bold text-stone-400 uppercase tracking-[0.15em] mb-3">{r.nama_bank}</p>

      {/* Account number + copy */}
      <div className="flex items-center justify-between gap-3 bg-stone-50 border border-stone-100 rounded-xl px-4 py-3 mb-3">
        <span className="font-mono font-bold text-[#0a192f] text-xl tracking-wider select-all">
          {r.nomor_rekening}
        </span>
        <button
          onClick={copy}
          className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg transition-all whitespace-nowrap ${copied
            ? 'bg-emerald-500 text-white'
            : 'bg-amber-500/10 text-amber-600 hover:bg-amber-500 hover:text-white'
            }`}
        >
          {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
          {copied ? 'Tersalin!' : 'Salin'}
        </button>
      </div>

      {/* Atas nama */}
      <div className="flex items-center gap-2">
        <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Atas Nama</span>
        <span className="text-sm font-bold text-[#0a192f]">{r.atas_nama}</span>
      </div>
      {r.keterangan && <p className="text-xs text-amber-600 mt-1.5">{r.keterangan}</p>}
    </div>
  );
};

// ============================================
// MAIN PAGE
// ============================================

const DonasiPage = () => {
  const formRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  // Form state
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState('');
  const [nama, setNama] = useState('');
  const [noWa, setNoWa] = useState('');
  const [pesanDoa, setPesanDoa] = useState('');
  const [isAnonim, setIsAnonim] = useState(false);
  const [buktiFile, setBuktiFile] = useState<File | null>(null);
  const [buktiPreview, setBuktiPreview] = useState<string>('');
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submittedId, setSubmittedId] = useState<string>('');
  const [formError, setFormError] = useState('');
  const [uploadProgress, setUploadProgress] = useState(false);

  // Data fetches
  const { data: rekening = [] } = useQuery<DnsRekeningDisplay[]>({
    queryKey: ['dns_rekening'],
    queryFn: DnsRekeningService.getAll,
    staleTime: 5 * 60 * 1000,
  });

  const { data: socialProof = [], refetch: refetchSP } = useQuery<DnsSocialProofItem[]>({
    queryKey: ['dns_social_proof'],
    queryFn: () => DnsSocialProofService.get(15),
    refetchInterval: 60 * 1000,
  });

  // Auto-refresh social proof every 60s
  useEffect(() => {
    const timer = setInterval(() => refetchSP(), 60000);
    return () => clearInterval(timer);
  }, [refetchSP]);

  const getNominal = useCallback((): number => {
    if (selectedAmount === -1) {
      const n = parseInt(customAmount.replace(/\D/g, ''), 10);
      return isNaN(n) ? 0 : n;
    }
    return selectedAmount ?? 0;
  }, [selectedAmount, customAmount]);

  const handleBuktiChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 5 * 1024 * 1024) {
      setFormError('Ukuran file maksimal 5 MB');
      return;
    }
    setBuktiFile(f);
    setBuktiPreview(URL.createObjectURL(f));
    setFormError('');
  };

  const submitMutation = useMutation({
    mutationFn: async () => {
      setFormError('');
      const nominal = getNominal();
      if (!nama.trim()) throw new Error('Nama harus diisi');
      if (nominal < 1000) throw new Error('Nominal minimal Rp 1.000');
      if (!buktiFile) throw new Error('Bukti transfer wajib dilampirkan');

      // 1. Upload bukti
      setUploadProgress(true);
      let buktiUrl = '';
      try {
        const tempId = `tmp-${Date.now()}`;
        buktiUrl = await DnsSubmissionService.uploadBukti(buktiFile, tempId);
      } finally {
        setUploadProgress(false);
      }

      // 2. Submit
      const id = await DnsSubmissionService.submit({
        nama: nama.trim(),
        no_wa: noWa.trim() || undefined,
        nominal,
        pesan_doa: pesanDoa.trim() || undefined,
        bukti_transfer_url: buktiUrl,
        is_anonim: isAnonim,
        tampil_publik: true,
      });

      return id;
    },
    onSuccess: (id) => {
      setSubmittedId(id);
      setSubmitSuccess(true);
      queryClient.invalidateQueries({ queryKey: ['dns_social_proof'] });
    },
    onError: (err: any) => {
      setFormError(err?.message ?? 'Terjadi kesalahan, silakan coba lagi');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submitMutation.mutate();
  };

  const scrollToForm = () => {
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  // WA konfirmasi ke nomor pesantren (085955303882)
  const waLink = `https://wa.me/6285955303882?text=${encodeURIComponent(
    `Assalamu'alaikum, saya ${nama || 'Hamba Allah'} sudah transfer donasi sebesar ${formatRp(selectedAmount || parseInt(customAmount || '0'))} untuk Pesantren Al-Bisri.\n\nRekening: BSI 3334444940 a/n YPAY Al-Bisri\n\nMohon konfirmasinya. Jazakumullah khairan 🤲`
  )}`;

  const verifiedDonors = socialProof.filter(s => s.tipe === 'donasi').length;

  return (
    <div className="min-h-screen bg-[#fafafa] font-jakarta overflow-x-hidden">

      {/* NAVBAR */}
      <PublicNavbar />

      {/* ── HERO / HEADER ───────────────────────────────────────── */}
      <section className="relative pt-20 pb-12 overflow-hidden">
        <div className="max-w-[1200px] mx-auto px-6 lg:px-12 text-center animate-in fade-in slide-in-from-bottom-5 duration-700">
          <div className="inline-block mb-3">
            <span className="text-[10px] font-bold tracking-[0.2em] text-amber-600 uppercase">Tunaikan Kebaikan</span>
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif text-[#0a192f] mb-4">
            Satu Sedekah, <span className="italic">Seribu Keberkahan</span>
          </h1>
          <p className="text-slate-500 text-base md:text-lg max-w-2xl mx-auto leading-relaxed">
            Dukungan Anda adalah hidangan bergizi, seragam bersih, dan lampu yang menerangi waktu mengaji para santri yatim Al-Bisri.
          </p>
        </div>
      </section>

      {/* ── MAIN CONTENT GRID ─────────────────────────────── */}
      <main className="max-w-[1200px] mx-auto px-6 lg:px-12 pb-24">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

          {/* LEFT COLUMN: Info, Rekening, Social Proof (Col 5) */}
          <div className="lg:col-span-5 space-y-6 animate-in fade-in slide-in-from-left-5 duration-700 delay-100">

            {/* Info Card - Deep Navy Accent */}
            <div className="bg-[#0a192f] rounded-3xl p-8 shadow-xl relative overflow-hidden text-white group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-5 rounded-bl-full -z-0 group-hover:scale-110 transition-transform duration-500" />
              <Heart className="w-8 h-8 text-amber-500/40 absolute top-6 right-6" />

              <div className="relative z-10">
                <h3 className="text-lg font-serif text-amber-400 mb-4">Setiap Rupiah Berarti</h3>
                <p className="text-sm text-slate-300 leading-relaxed mb-6 font-light">
                  Bukan sekadar nominal, donasi Anda adalah wujud kasih nyata bagi masa depan mereka yang membutuhkan.
                </p>
                <div className="flex items-center gap-4 pt-5 border-t border-white/10">
                  <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-slate-400">Status Program</p>
                    <p className="font-bold text-sm">100% Beasiswa Santri Yatim</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Rekening Card Section */}
            {rekening.length > 0 && (
              <div className="bg-white rounded-3xl p-8 shadow-sm border border-stone-100">
                <h3 className="text-lg font-serif text-[#0a192f] mb-6 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-stone-50 flex items-center justify-center">
                    <Shield className="w-4 h-4 text-[#0a192f]" />
                  </div>
                  Rekening Resmi
                </h3>

                <div className="space-y-6">
                  {rekening.map(r => (
                    <RekeningCard key={r.id} r={r} />
                  ))}
                </div>
              </div>
            )}

            {/* Live Social Proof / Doa Feed */}
            <div className="bg-white rounded-3xl p-8 shadow-sm border border-stone-100">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-serif text-[#0a192f] flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-stone-50 flex items-center justify-center relative">
                    <div className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                    <BookOpen className="w-4 h-4 text-[#0a192f]" />
                  </div>
                  Buku Doa Santri
                </h3>
                {socialProof.length > 5 && (
                  <span className="text-[10px] text-stone-400 uppercase tracking-wider font-bold">Scroll ↓</span>
                )}
              </div>

              <div className="bg-[#fafafa] p-4 rounded-2xl border border-stone-100 border-l-2 border-l-amber-500 mb-6">
                <p className="text-[11px] text-slate-600 leading-relaxed italic">
                  "Mengetuk pintu langit bersama doa para santri yatim setiap ba'da Maghrib."
                </p>
              </div>

              <div className="relative">
                <div className="space-y-5 max-h-[250px] md:max-h-[350px] overflow-y-auto pr-2 scroll-smooth" style={{ scrollbarWidth: 'thin', scrollbarColor: '#d6d3d1 transparent' }}>
                  {socialProof.length === 0 ? (
                    <div className="text-center py-8 text-slate-400 text-xs">
                      Belum ada doa hari ini.
                    </div>
                  ) : (
                    socialProof.map(item => (
                      <div key={item.id} className="flex gap-4 items-start pb-4 border-b border-stone-50 last:border-0 last:pb-0">
                        <div className="w-8 h-8 rounded-full bg-stone-50 border border-stone-100 flex items-center justify-center shrink-0 mt-0.5">
                          <Heart className="w-3.5 h-3.5 text-[#0a192f]" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-sm text-[#0a192f]">{item.nama_tampil}</span>
                            {item.tipe === 'donasi' && item.nominal && (
                              <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                                {formatRp(item.nominal)}
                              </span>
                            )}
                          </div>
                          {item.pesan_doa && (
                            <p className="text-xs text-slate-500 italic mt-1.5 leading-relaxed line-clamp-3">"{item.pesan_doa}"</p>
                          )}
                          <p className="text-[10px] font-semibold text-stone-400 mt-2 uppercase tracking-wide">
                            {timeAgo(item.created_at)}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
                {/* Fade gradient at bottom to indicate more content */}
                {socialProof.length > 3 && (
                  <div className="absolute bottom-0 left-0 right-2 h-8 bg-gradient-to-t from-white to-transparent pointer-events-none rounded-b-xl" />
                )}
              </div>
            </div>

          </div>

          {/* RIGHT COLUMN: Donation Form (Col 7) */}
          <div className="lg:col-span-7 animate-in fade-in slide-in-from-right-5 duration-700 delay-200" ref={formRef}>
            <div className="bg-white rounded-3xl p-8 md:p-10 shadow-xl shadow-stone-200/50 border border-stone-100">

              <div className="mb-8">
                <h2 className="text-2xl font-serif text-[#0a192f] mb-2">Formulir Donasi</h2>
                <p className="text-sm text-slate-500">Mohon lengkapi data di bawah untuk pencatatan donasi.</p>
              </div>

              {submitSuccess ? (
                /* SUCCESS STATE */
                <div className="py-10 text-center animate-in zoom-in-95 duration-500">
                  <div className="w-20 h-20 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle2 className="w-10 h-10" />
                  </div>
                  <h3 className="text-2xl font-serif text-[#0a192f] mb-3">Jazaakumullah Khairan!</h3>
                  <p className="text-slate-600 mb-8 max-w-sm mx-auto">
                    Donasi Anda telah diterima dan sedang diproses admin. Semoga menjadi jariyah yang terus mengalir.
                  </p>

                  <div className="flex flex-col gap-3 max-w-xs mx-auto">
                    {waLink && (
                      <a href={waLink} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 rounded-2xl transition-all shadow-lg shadow-emerald-200">
                        <PhoneCall className="w-4 h-4" />
                        Konfirmasi via WhatsApp
                      </a>
                    )}
                    <button
                      onClick={() => {
                        setSubmitSuccess(false);
                        setNama(''); setNoWa(''); setPesanDoa('');
                        setSelectedAmount(null); setCustomAmount('');
                        setBuktiFile(null); setBuktiPreview('');
                        setIsAnonim(false);
                      }}
                      className="text-sm font-bold text-stone-400 hover:text-[#0a192f] transition-colors"
                    >
                      Berdonasi Lagi
                    </button>
                  </div>
                </div>
              ) : (
                /* FORM */
                <form onSubmit={handleSubmit} className="space-y-8">

                  {/* 1. NOMINAL */}
                  <div>
                    <h4 className="text-[10px] font-bold text-[#0a192f] tracking-[0.2em] uppercase mb-4 flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-stone-100 flex items-center justify-center text-[10px]">1</span>
                      Pilih Nominal
                    </h4>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
                      {QUICK_AMOUNTS.map(amt => (
                        <button
                          key={amt}
                          type="button"
                          onClick={() => { setSelectedAmount(amt); setCustomAmount(''); }}
                          className={`h-14 rounded-2xl border-2 font-bold transition-all flex items-center justify-center ${selectedAmount === amt
                            ? 'bg-stone-50 border-[#0a192f] text-[#0a192f]'
                            : 'bg-white border-stone-100 text-slate-500 hover:border-amber-400/50 hover:text-amber-600'
                            }`}
                        >
                          {formatRp(amt)}
                        </button>
                      ))}
                    </div>
                    <div className={`relative h-14 rounded-2xl border-2 transition-all ${selectedAmount === -1 ? 'border-[#0a192f] bg-stone-50' : 'border-stone-100 bg-white'}`}>
                      <span className="absolute left-5 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">Rp</span>
                      <input
                        type="text"
                        placeholder="Nominal lainnya"
                        value={customAmount}
                        onChange={e => {
                          const cleaned = e.target.value.replace(/\D/g, '');
                          setCustomAmount(cleaned);
                          setSelectedAmount(-1);
                        }}
                        className="w-full h-full pl-12 pr-5 bg-transparent text-sm font-bold text-[#0a192f] outline-none placeholder:font-normal placeholder:text-slate-300"
                      />
                    </div>
                  </div>

                  {/* 2. DATA DIRI */}
                  <div>
                    <h4 className="text-[10px] font-bold text-[#0a192f] tracking-[0.2em] uppercase mb-4 flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-stone-100 flex items-center justify-center text-[10px]">2</span>
                      Detail Donatur
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <input
                        type="text"
                        placeholder="Nama Lengkap *"
                        value={nama}
                        onChange={e => setNama(e.target.value)}
                        required
                        className="w-full h-14 px-5 rounded-2xl border-2 border-stone-100 bg-white text-sm text-[#0a192f] outline-none focus:border-[#0a192f] transition-all placeholder:text-slate-300 font-medium"
                      />
                      <input
                        type="tel"
                        placeholder="WhatsApp (untuk konfirmasi)"
                        value={noWa}
                        onChange={e => setNoWa(e.target.value)}
                        className="w-full h-14 px-5 rounded-2xl border-2 border-stone-100 bg-white text-sm text-[#0a192f] outline-none focus:border-[#0a192f] transition-all placeholder:text-slate-300 font-medium"
                      />
                    </div>
                    <label className="flex items-center gap-3 px-1 cursor-pointer group mb-5">
                      <input
                        type="checkbox"
                        checked={isAnonim}
                        onChange={e => setIsAnonim(e.target.checked)}
                        className="w-4 h-4 rounded border-stone-300 accent-[#0a192f]"
                      />
                      <span className="text-xs text-slate-500 group-hover:text-[#0a192f] transition-colors font-medium">Sembunyikan nama (sebagai Hamba Allah)</span>
                    </label>

                    <textarea
                      placeholder="Tuliskan harapan atau doa yang ingin diaminkan para santri... (opsional)"
                      value={pesanDoa}
                      onChange={e => setPesanDoa(e.target.value)}
                      rows={3}
                      className="w-full p-5 rounded-2xl border-2 border-stone-100 bg-white text-sm text-[#0a192f] outline-none focus:border-[#0a192f] transition-all placeholder:text-slate-300 font-medium resize-none"
                    />
                  </div>

                  {/* 3. UPLOAD */}
                  <div>
                    <h4 className="text-[10px] font-bold text-[#0a192f] tracking-[0.2em] uppercase mb-4 flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-stone-100 flex items-center justify-center text-[10px]">3</span>
                      Bukti Transfer
                    </h4>
                    {buktiPreview ? (
                      <div className="relative rounded-2xl overflow-hidden border-2 border-stone-100 group">
                        <img src={buktiPreview} alt="Bukti" className="w-full max-h-56 object-cover" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <button
                            type="button"
                            onClick={() => { setBuktiFile(null); setBuktiPreview(''); }}
                            className="bg-white text-red-600 px-4 py-2 rounded-xl font-bold text-xs"
                          >
                            Ganti Foto
                          </button>
                        </div>
                      </div>
                    ) : (
                      <label className="flex flex-col items-center justify-center gap-1 border-2 border-dashed border-stone-200 rounded-2xl p-8 cursor-pointer hover:border-amber-400 hover:bg-amber-50/30 transition-all group">
                        <Upload className="w-8 h-8 text-stone-300 group-hover:text-amber-500 transition-colors mb-2" />
                        <span className="text-sm font-bold text-slate-600">Unggah Bukti Transfer</span>
                        <span className="text-[10px] text-stone-400 uppercase tracking-widest">JPG, PNG, PDF · Maks. 5 MB</span>
                        <input type="file" accept="image/*,application/pdf" className="hidden" onChange={handleBuktiChange} />
                      </label>
                    )}
                  </div>

                  {/* ERROR */}
                  {formError && (
                    <div className="bg-rose-50 border border-rose-100 text-rose-600 text-xs px-5 py-3 rounded-xl font-medium">
                      {formError}
                    </div>
                  )}

                  {/* SUBMIT */}
                  <button
                    type="submit"
                    disabled={submitMutation.isPending || uploadProgress}
                    className="w-full bg-amber-500 hover:bg-amber-600 disabled:bg-stone-100 disabled:text-stone-400 text-[#0a192f] h-16 rounded-2xl font-bold tracking-widest uppercase text-xs transition-all flex items-center justify-center gap-2 shadow-xl shadow-amber-200"
                  >
                    {(submitMutation.isPending || uploadProgress) ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        {uploadProgress ? 'Mengupload...' : 'Memproses...'}
                      </>
                    ) : (
                      <>
                        Konfirmasi Donasi
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          </div>

        </div>
      </main>

      <PublicFooter />
    </div>
  );
};

// ============================================
// DOA STANDALONE FORM (inside page)
// ============================================

const DoandaloneForm = () => {
  const [nama, setNama] = useState('');
  const [pesan, setPesan] = useState('');
  const [isAnonim, setIsAnonim] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const mut = useMutation({
    mutationFn: () => DnsSocialProofService.submitDoa({ nama, pesan_doa: pesan, is_anonim: isAnonim }),
    onSuccess: () => setSuccess(true),
    onError: (e: any) => setError(e?.message ?? 'Gagal mengirim doa'),
  });

  if (success) {
    return (
      <div className="text-center py-3">
        <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
        <p className="text-sm font-medium text-slate-700">Doa terkirim!</p>
        <p className="text-xs text-slate-500">Admin akan memoderasi & mendoakan.</p>
        <button onClick={() => { setSuccess(false); setNama(''); setPesan(''); setIsAnonim(false); }} className="text-xs text-slate-400 underline mt-2">Kirim lagi</button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <input
        type="text"
        placeholder="Nama Anda"
        value={nama}
        onChange={e => setNama(e.target.value)}
        className="w-full text-sm border border-stone-200 rounded-lg px-3 py-2 outline-none focus:border-amber-400 transition-colors"
      />
      <textarea
        placeholder="Tulis doa atau hajat Anda di sini..."
        value={pesan}
        onChange={e => setPesan(e.target.value)}
        rows={2}
        className="w-full text-sm border border-stone-200 rounded-lg px-3 py-2 outline-none focus:border-amber-400 transition-colors resize-none"
      />
      <label className="flex items-center gap-2 cursor-pointer">
        <input type="checkbox" checked={isAnonim} onChange={e => setIsAnonim(e.target.checked)} className="w-3.5 h-3.5 accent-amber-400" />
        <span className="text-xs text-slate-500">Kirim sebagai anonim</span>
      </label>
      {error && <p className="text-xs text-red-500">{error}</p>}
      <button
        onClick={() => { if (!nama.trim() || !pesan.trim()) { setError('Nama dan doa wajib diisi'); return; } setError(''); mut.mutate(); }}
        disabled={mut.isPending}
        className="w-full bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium py-2 rounded-lg transition-colors flex items-center justify-center gap-2"
      >
        {mut.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        Kirim Doa
      </button>
    </div>
  );
};

export default DonasiPage;
