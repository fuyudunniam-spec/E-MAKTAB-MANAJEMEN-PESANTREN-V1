import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowRight, Loader2, Upload, X,
  Shield, Send, BookOpen, Copy, Check,
  Lock, HeartHandshake, BookMarked, Users, MessageCircle,
  Sparkles, Home, GraduationCap, Building, Heart, CheckCircle2, PhoneCall
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

const IMPACT_AMOUNTS = [
  { value: 50000, label: 'Sedekah Operasional' },
  { value: 150000, label: 'Pangan 1 Santri / Pekan' },
  { value: 300000, label: 'Pendidikan 1 Santri / Bulan' },
  { value: 1000000, label: 'Beasiswa Penuh 1 Santri' },
];

export default function DonasiPage() {
  const formRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  // --- WIDGET STATES ---
  const [formStep, setFormStep] = useState(1);
  const [donationType, setDonationType] = useState<'one-time' | 'monthly'>('one-time');

  // --- FORM STATES ---
  const [selectedAmount, setSelectedAmount] = useState<number | null>(IMPACT_AMOUNTS[1].value);
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
  const [isPending, setIsPending] = useState(false);
  const [copiedRek, setCopiedRek] = useState<string | null>(null);

  // --- DATA FETCHES ---
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

  useEffect(() => {
    const timer = setInterval(() => refetchSP(), 60000);
    return () => clearInterval(timer);
  }, [refetchSP]);

  // --- LOGIC ---
  const getNominal = useCallback((): number => {
    if (selectedAmount === -1) {
      const n = parseInt(customAmount.replace(/\D/g, ''), 10);
      return isNaN(n) ? 0 : n;
    }
    return selectedAmount ?? 0;
  }, [selectedAmount, customAmount]);

  const handleNextStep = () => {
    if (getNominal() < 10000) {
      setFormError('Nominal minimal donasi adalah Rp 10.000');
      return;
    }
    setFormError('');
    setFormStep(2);
    if (formRef.current) {
      const y = formRef.current.getBoundingClientRect().top + window.scrollY - 100;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  };

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
      if (!buktiFile) throw new Error('Bukti transfer wajib dilampirkan');

      setIsPending(true);
      try {
        // 1. Upload bukti
        const tempId = `tmp-${Date.now()}`;
        const buktiUrl = await DnsSubmissionService.uploadBukti(buktiFile, tempId);

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
      } finally {
        setIsPending(false);
      }
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

  const copyRekening = (rek: string, id: string) => {
    navigator.clipboard.writeText(rek).catch(() => {
      const el = document.createElement('textarea');
      el.value = rek;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
    });
    setCopiedRek(id);
    setTimeout(() => setCopiedRek(null), 2500);
  };

  const waLink = `https://wa.me/6285955303882?text=${encodeURIComponent(
    `Assalamu'alaikum, saya ${isAnonim ? 'Hamba Allah' : (nama || 'Hamba Allah')} telah menunaikan donasi sebesar ${formatRp(getNominal())} untuk Pesantren Al-Bisri dengan ID ${submittedId}.\n\nMohon konfirmasinya. Jazakumullah khairan.`
  )}`;

  return (
    <div className="min-h-screen font-sans text-slate-800 flex flex-col relative page-bg-pattern font-jakarta">

      {/* Background Ambience Layers */}
      <div className="absolute top-0 left-0 w-full h-[600px] hero-glow pointer-events-none z-0"></div>

      <div className="relative z-10 flex flex-col min-h-screen">
        <PublicNavbar />

        <main className="flex-1 w-full pb-24">

          {/* ========================================== */}
          {/* EDITORIAL HERO HEADER                      */}
          {/* ========================================== */}
          <header className="pt-24 pb-20 px-6 bg-[#0f172a] text-white text-center relative overflow-hidden">
            <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")` }} />
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#c09c53]/5 rounded-full blur-3xl -translate-y-1/3 translate-x-1/4 pointer-events-none" />
            <div className="max-w-3xl mx-auto relative z-10 animate-fade-in-up">
              <h4 className="text-[10px] font-bold tracking-[0.2em] text-[#c09c53] uppercase mb-6 flex items-center justify-center gap-3">
                <span className="w-8 h-px bg-[#c09c53]" /> Gotong Royong Pendidikan Umat <span className="w-8 h-px bg-[#c09c53]" />
              </h4>
              <h1 className="text-4xl md:text-5xl lg:text-[4.5rem] font-serif text-white leading-[1.1] mb-8 tracking-tight">
                Berikan Hadiah Ilmu<br />
                <span className="italic text-[#c09c53]">&amp; Masa Depan.</span>
              </h1>
              <p className="text-slate-300 text-lg leading-relaxed font-light mb-10 max-w-xl mx-auto">
                Di balik setiap lantunan doa bakda Maghrib, ada santri yatim dan dhuafa yang menggantungkan cita-citanya. Uluran tangan Anda bukan sekadar angka — melainkan kepastian bahwa mereka bisa makan bergizi hari ini dan meraih masa depan tanpa takut putus sekolah.
              </p>
              <button
                onClick={() => formRef.current?.scrollIntoView({ behavior: 'smooth' })}
                className="inline-flex items-center gap-2 bg-[#c09c53] text-[#0f172a] px-8 py-4 text-xs font-bold uppercase tracking-widest hover:bg-[#b08a42] transition-colors"
              >
                <HeartHandshake className="w-4 h-4" /> Donasikan Sekarang
              </button>
            </div>
          </header>

          {/* ========================================== */}
          {/* SECTION 1: IMPACT PILLARS                  */}
          {/* ========================================== */}
          <section className="max-w-5xl mx-auto px-6 py-20 text-center">
            <div className="animate-fade-in-up">


              {/* Impact Pillars - Horizontal Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 text-left border-t border-slate-200/60 pt-16 animate-fade-in-up delay-100">
                <div className="space-y-4 group hover:-translate-y-2 transition-transform duration-500 ease-out bg-white/40 p-6 rounded-2xl hover:bg-white hover:shadow-xl hover:shadow-[#0f172a]/5 border border-transparent hover:border-slate-100">
                  <div className="w-12 h-12 rounded border border-slate-200 bg-white flex items-center justify-center mb-6 shadow-sm group-hover:scale-110 transition-transform duration-500">
                    <Home className="w-5 h-5 text-[#0f172a]" />
                  </div>
                  <h3 className="text-xs font-bold text-[#0f172a] uppercase tracking-widest leading-relaxed">Asrama &<br />Pangan Santri</h3>
                  <p className="text-xs text-slate-500 leading-relaxed">Menjamin tempat tinggal yang aman dan gizi 3x sehari. Memastikan tak ada satupun santri yatim yang belajar dalam keadaan lapar.</p>
                </div>
                <div className="space-y-4 group hover:-translate-y-2 transition-transform duration-500 ease-out bg-white/40 p-6 rounded-2xl hover:bg-white hover:shadow-xl hover:shadow-[#0f172a]/5 border border-transparent hover:border-slate-100">
                  <div className="w-12 h-12 rounded border border-slate-200 bg-white flex items-center justify-center mb-6 shadow-sm group-hover:scale-110 transition-transform duration-500">
                    <BookMarked className="w-5 h-5 text-[#0f172a]" />
                  </div>
                  <h3 className="text-xs font-bold text-[#0f172a] uppercase tracking-widest leading-relaxed">Pendidikan<br />Diniyah & Tahfidz</h3>
                  <p className="text-xs text-slate-500 leading-relaxed">Fokus membina akhlak mulia dan mendampingi hafalan Al-Qur'an mereka siang dan malam, mencetak generasi Rabbani.</p>
                </div>
                <div className="space-y-4 group hover:-translate-y-2 transition-transform duration-500 ease-out bg-white/40 p-6 rounded-2xl hover:bg-white hover:shadow-xl hover:shadow-[#0f172a]/5 border border-transparent hover:border-slate-100">
                  <div className="w-12 h-12 rounded border border-slate-200 bg-white flex items-center justify-center mb-6 shadow-sm group-hover:scale-110 transition-transform duration-500">
                    <GraduationCap className="w-5 h-5 text-[#0f172a]" />
                  </div>
                  <h3 className="text-xs font-bold text-[#0f172a] uppercase tracking-widest leading-relaxed">Pendidikan<br />Formal (Sekolah)</h3>
                  <p className="text-xs text-slate-500 leading-relaxed">Membiayai akses sekolah 100% gratis. Membekali mereka dengan ijazah dan ilmu umum agar siap mandiri dan bersaing di masa depan.</p>
                </div>
                <div className="space-y-4 group hover:-translate-y-2 transition-transform duration-500 ease-out bg-white/40 p-6 rounded-2xl hover:bg-white hover:shadow-xl hover:shadow-[#0f172a]/5 border border-transparent hover:border-slate-100">
                  <div className="w-12 h-12 rounded border border-slate-200 bg-white flex items-center justify-center mb-6 shadow-sm group-hover:scale-110 transition-transform duration-500">
                    <Building className="w-5 h-5 text-[#0f172a]" />
                  </div>
                  <h3 className="text-xs font-bold text-[#0f172a] uppercase tracking-widest leading-relaxed">Operasional<br />& Khidmah</h3>
                  <p className="text-xs text-slate-500 leading-relaxed">Menopang fasilitas pesantren serta memberikan apresiasi yang layak bagi para asatidz yang mengabdi 24 jam merawat santri.</p>
                </div>
              </div>
            </div>
          </section>


          {/* ========================================== */}
          {/* SECTION 2: BUKTI DOA & FORM (SIDE BY SIDE) */}
          {/* ========================================== */}
          <section className="max-w-7xl mx-auto px-6 relative z-10 -mt-10 mb-24 animate-fade-in-up delay-200" ref={formRef}>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-stretch">

              {/* LEFT: BUKU DOA SANTRI (Sacred parchment look) */}
              <div className="lg:col-span-5 bg-[#fdfaf3] border border-[#e8dfc9] p-8 md:p-12 shadow-2xl shadow-[#0f172a]/10 rounded-[2.5rem] relative overflow-hidden flex flex-col group">
                {/* Parchment Texture Overlay */}
                <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/natural-paper.png')]" />

                <div className="relative z-10 flex-1 flex flex-col">
                  <div className="flex items-center justify-between mb-8 pb-6 border-b border-[#e8dfc9]">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-white border border-[#e8dfc9] flex items-center justify-center shadow-sm">
                        <BookMarked className="w-6 h-6 text-[#c09c53]" />
                      </div>
                      <div>
                        <h3 className="font-serif text-2xl text-[#0f172a] leading-none mb-1">Buku Doa Santri</h3>
                        <p className="text-[9px] uppercase tracking-widest text-[#a38240] font-bold">Khidmah & Doa Bersama</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1 bg-white/50 rounded-full border border-[#e8dfc9]">
                      <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                      <span className="text-[9px] font-bold text-slate-500 uppercase tracking-tighter">Live</span>
                    </div>
                  </div>

                  <div className="bg-white/40 p-5 rounded-2xl border border-[#e8dfc9] mb-10 italic text-[#0f172a]/80 text-sm leading-relaxed font-light relative">
                    <span className="absolute -top-3 left-4 bg-[#fdfaf3] px-2 text-[9px] font-bold text-[#c09c53] uppercase tracking-widest">Amanah Kami</span>
                    "Setiap titipan doa Anda akan dicatat dan dilantunkan secara khusus oleh para santri ba'da shalat Maghrib berjamaah."
                  </div>

                  <div className="space-y-6 flex-1 overflow-y-auto pr-4 custom-scrollbar max-h-[450px]" style={{ scrollbarWidth: 'thin', scrollbarColor: '#c09c53 transparent' }}>
                    {socialProof.length === 0 ? (
                      <div className="text-center py-12 text-stone-400 text-sm font-light italic">
                        Menunggu lantunan doa pertama hari ini...
                      </div>
                    ) : (
                      socialProof.map((item) => (
                        <div key={item.id} className="relative pl-6 border-l border-[#e8dfc9] pb-8 last:pb-0 group/item">
                          <div className="absolute -left-[5px] top-1 w-2 h-2 rounded-full bg-[#c09c53] border-4 border-[#fdfaf3] group-hover/item:scale-150 transition-transform" />

                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-bold text-[#0f172a] font-serif">
                              {item.nama_tampil}
                            </span>
                            <span className="text-[9px] font-bold text-stone-400 uppercase tracking-widest">{timeAgo(item.created_at)}</span>
                          </div>

                          {item.tipe === 'donasi' && Number(item.nominal || 0) > 0 && (
                            <div className="mb-3 inline-flex items-center gap-2 text-[9px] font-bold text-[#c09c53] uppercase tracking-widest bg-[#c09c53]/5 px-2 py-1 rounded">
                              <Sparkles className="w-3 h-3" /> Mendukung {formatRp(item.nominal || 0)}
                            </div>
                          )}

                          {item.pesan_doa && (
                            <div className="bg-white/60 p-4 rounded-xl border border-[#e8dfc9]/50 shadow-sm group-hover/item:border-[#c09c53]/30 transition-colors">
                              <p className="text-sm text-stone-600 italic leading-relaxed font-light">
                                "{item.pesan_doa}"
                              </p>
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>

                  <div className="mt-10 pt-8 border-t border-[#e8dfc9]">
                    <DoandaloneForm />
                  </div>
                </div>
              </div>

              {/* RIGHT: DONATION WIDGET (Clean professional card) */}
              <div className="lg:col-span-7 flex flex-col">
                <div className="bg-white border border-slate-200 shadow-[0_32px_64px_-16px_rgba(15,23,42,0.1)] rounded-[2.5rem] overflow-hidden flex-1 flex flex-col h-full transform hover:-translate-y-1 transition-transform duration-500">

                  {/* Widget Header Progress */}
                  {!submitSuccess && (
                    <div className="flex bg-slate-50 border-b border-slate-200 text-[10px] font-bold uppercase tracking-widest text-slate-400 relative">
                      <div className="absolute top-0 left-0 h-0.5 bg-[#c09c53] transition-all duration-500"
                        style={{ width: formStep === 1 ? '50%' : '100%' }}></div>

                      <div className={`flex-1 py-4 text-center transition-colors ${formStep === 1 ? 'bg-white text-[#0f172a]' : ''}`}>
                        1. Pilih Niat
                      </div>
                      <div className={`flex-1 py-4 text-center transition-colors border-l border-slate-200 ${formStep === 2 ? 'bg-white text-[#0f172a]' : ''}`}>
                        2. Selesaikan
                      </div>
                    </div>
                  )}

                  <div className="p-8 md:p-10 relative">
                    {submitSuccess ? (
                      /* --- SUCCESS STATE --- */
                      <div className="text-center py-8 animate-fade-in-up">
                        <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6 relative">
                          <div className="absolute inset-0 bg-green-400 rounded-full animate-ping opacity-20"></div>
                          <Check className="w-10 h-10 text-green-600" />
                        </div>
                        <h2 className="text-2xl font-serif text-[#0f172a] mb-3">Jazakumullah Khairan.</h2>
                        <p className="text-slate-500 text-sm mb-8 leading-relaxed max-w-md mx-auto">
                          Kebaikan Anda telah tercatat dengan ID <span className="font-mono text-[#0f172a] font-bold bg-slate-100 px-2 py-1 rounded">{submittedId}</span>. Kwitansi digital dan update program akan kami kirimkan via WhatsApp.
                        </p>

                        <div className="space-y-4 max-w-sm mx-auto">
                          <a href={waLink} target="_blank" rel="noopener noreferrer" className="w-full flex items-center justify-center gap-2 py-4 bg-[#0f172a] hover:bg-slate-800 text-white text-xs font-bold uppercase tracking-widest transition-all rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-0.5">
                            <PhoneCall className="w-4 h-4" />
                            Konfirmasi ke Admin
                          </a>
                          <button onClick={() => {
                            setSubmitSuccess(false); setFormStep(1);
                            setNama(''); setNoWa(''); setPesanDoa('');
                            setSelectedAmount(IMPACT_AMOUNTS[1].value); setCustomAmount('');
                            setBuktiFile(null); setBuktiPreview('');
                            setIsAnonim(false);
                          }}
                            className="w-full py-4 text-xs font-bold uppercase tracking-widest text-slate-500 hover:text-[#0f172a] transition-colors"
                          >
                            Donasi Lagi
                          </button>
                        </div>
                      </div>

                    ) : formStep === 1 ? (
                      /* --- STEP 1: CHOOSE AMOUNT --- */
                      <div className="animate-fade-in">

                        <div className="flex bg-slate-100 p-1.5 mb-8 rounded-xl">
                          <button type="button" onClick={() => setDonationType('one-time')}
                            className={`flex-1 py-3 text-xs font-bold uppercase tracking-widest transition-all rounded-lg ${donationType === 'one-time' ? 'bg-white text-[#0f172a] shadow-sm' : 'text-slate-500 hover:text-[#0f172a]'}`}
                          >
                            Sekali Donasi
                          </button>
                          <button type="button" onClick={() => setDonationType('monthly')}
                            className={`flex-1 py-3 text-xs font-bold uppercase tracking-widest transition-all rounded-lg ${donationType === 'monthly' ? 'bg-white text-[#0f172a] shadow-sm' : 'text-slate-500 hover:text-[#0f172a]'}`}
                          >
                            Rutin Bulanan
                          </button>
                        </div>

                        <div className="space-y-3 mb-8">
                          {IMPACT_AMOUNTS.map((item) => (
                            <button key={item.value} type="button" onClick={() => { setSelectedAmount(item.value); setCustomAmount(''); }}
                              className={`w-full flex flex-col sm:flex-row sm:items-center justify-between p-5 rounded-xl border transition-all text-left gap-2 group ${selectedAmount === item.value
                                ? 'border-[#0f172a] bg-slate-50 ring-1 ring-[#0f172a] shadow-md'
                                : 'border-slate-200 hover:border-[#c09c53] hover:shadow-sm'
                                }`}
                            >
                              <span className={`text-sm font-bold transition-colors ${selectedAmount === item.value ? 'text-[#0f172a]' : 'text-slate-600 group-hover:text-[#0f172a]'}`}>
                                {formatRp(item.value)}
                              </span>
                              <span className={`text-[10px] uppercase tracking-widest font-bold transition-colors ${selectedAmount === item.value ? 'text-[#c09c53]' : 'text-slate-400 group-hover:text-[#c09c53]'}`}>
                                {item.label}
                              </span>
                            </button>
                          ))}

                          <div className={`relative border rounded-xl transition-all overflow-hidden ${selectedAmount === -1
                            ? 'border-[#0f172a] bg-slate-50 ring-1 ring-[#0f172a] shadow-md'
                            : 'border-slate-200 hover:border-[#c09c53]'}`}>
                            <span className="absolute left-5 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">Rp</span>
                            <input type="text" placeholder="Nominal lainnya..." value={customAmount} onChange={e => {
                              const cleaned = e.target.value.replace(/\D/g, '');
                              setCustomAmount(cleaned);
                              setSelectedAmount(-1);
                            }}
                              className="w-full py-5 pl-14 pr-5 text-sm font-bold text-[#0f172a] outline-none placeholder:font-normal placeholder:text-slate-400 bg-transparent transition-all"
                            />
                          </div>
                        </div>

                        {formError && <p className="text-red-500 text-xs font-medium mb-4 animate-fade-in-up">{formError}</p>}

                        <button onClick={handleNextStep}
                          className="w-full bg-[#0f172a] hover:bg-slate-800 text-white py-4 rounded-xl text-xs font-bold uppercase tracking-widest transition-all hover:shadow-lg hover:-translate-y-0.5 flex items-center justify-center gap-2 group">
                          Lanjutkan <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </button>
                      </div>

                    ) : (
                      /* --- STEP 2: DETAILS & PAYMENT --- */
                      <form onSubmit={handleSubmit} className="animate-fade-in">

                        <div className="mb-8 flex items-center justify-between border-b border-slate-100 pb-6">
                          <div>
                            <p className="text-[10px] font-bold text-[#c09c53] uppercase tracking-widest mb-1">Total Donasi</p>
                            <h3 className="font-serif text-2xl text-[#0f172a]">
                              {formatRp(getNominal())} <span className="text-sm font-sans text-slate-400">{donationType === 'monthly' ? '/ Bulan' : ''}</span>
                            </h3>
                          </div>
                          <button type="button" onClick={() => setFormStep(1)}
                            className="text-[10px] font-bold text-slate-400 uppercase tracking-widest hover:text-[#0f172a] transition-colors border border-slate-200 px-3 py-1.5 rounded-full hover:bg-slate-50">
                            Ubah
                          </button>
                        </div>

                        <div className="space-y-5 mb-10">
                          <div>
                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Nama Lengkap *</label>
                            <input type="text" value={nama} onChange={e => setNama(e.target.value)} required
                              className="w-full py-3.5 px-4 border border-slate-200 rounded-xl text-sm text-[#0f172a] outline-none focus:border-[#0f172a] bg-slate-50 focus:bg-white transition-all focus:ring-4 focus:ring-[#0f172a]/5"
                            />
                            <label className="flex items-center gap-2 mt-3 cursor-pointer w-fit group">
                              <input type="checkbox" checked={isAnonim} onChange={e => setIsAnonim(e.target.checked)}
                                className="w-4 h-4 border-slate-300 rounded accent-[#0f172a]"
                              />
                              <span className="text-xs text-slate-500 group-hover:text-slate-800 transition-colors">Donasi Tanpa Nama (Hamba Allah)</span>
                            </label>
                          </div>

                          <div>
                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">No. WhatsApp <span className="font-normal">(Opsional)</span></label>
                            <input type="tel" value={noWa} onChange={e => setNoWa(e.target.value)}
                              className="w-full py-3.5 px-4 border border-slate-200 rounded-xl text-sm text-[#0f172a] outline-none focus:border-[#0f172a] bg-slate-50 focus:bg-white transition-all focus:ring-4 focus:ring-[#0f172a]/5"
                            />
                          </div>

                          <div>
                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Pesan & Doa <span className="font-normal">(Opsional)</span></label>
                            <textarea value={pesanDoa} onChange={e => setPesanDoa(e.target.value)}
                              rows={3}
                              placeholder="Tuliskan hajat Anda agar diaminkan para santri..."
                              className="w-full py-3.5 px-4 border border-slate-200 rounded-xl text-sm text-[#0f172a] outline-none focus:border-[#0f172a] bg-slate-50 focus:bg-white transition-all focus:ring-4 focus:ring-[#0f172a]/5 resize-none"
                            />
                          </div>
                        </div>

                        <div className="mb-10">
                          <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 border-b border-slate-100 pb-2">Instruksi Transfer</h3>

                          {rekening.length > 0 ? (
                            rekening.map(r => (
                              <div key={r.id} className="bg-slate-50 border border-slate-200 p-5 mb-5 rounded-xl relative overflow-hidden group">
                                <div className="absolute top-0 left-0 w-1 h-full bg-[#c09c53]"></div>
                                <div className="flex justify-between items-center mb-1">
                                  <p className="text-xs font-bold text-[#0f172a] uppercase tracking-widest">{r.nama_bank}</p>
                                </div>
                                <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-4">A.N {r.atas_nama}</p>

                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                  <p className="text-xl font-mono text-[#0f172a] tracking-wider font-bold bg-white px-3 py-1 rounded-md border border-slate-100 select-all">{r.nomor_rekening}</p>
                                  <button
                                    type="button"
                                    onClick={() => copyRekening(r.nomor_rekening, r.id)}
                                    className={`text-[10px] font-bold uppercase tracking-widest transition-colors flex items-center gap-1.5 w-fit px-3 py-2 rounded-lg ${copiedRek === r.id ? 'bg-green-50 text-green-600' : 'bg-white text-[#c09c53] hover:bg-[#c09c53] hover:text-white border border-slate-200 hover:border-[#c09c53]'}`}
                                  >
                                    {copiedRek === r.id ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                    {copiedRek === r.id ? 'Tersalin' : 'Salin'}
                                  </button>
                                </div>
                                {r.keterangan && <p className="text-xs text-[#c09c53] mt-2">{r.keterangan}</p>}
                              </div>
                            ))
                          ) : (
                            <div className="bg-slate-50 border border-slate-200 p-5 rounded-xl relative overflow-hidden">
                              <div className="absolute top-0 left-0 w-1 h-full bg-[#c09c53]"></div>
                              <p className="text-xs font-bold text-[#0f172a] uppercase tracking-widest">Bank Syariah Indonesia (BSI)</p>
                              <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-4">A.N YPAY Al-Bisri</p>
                              <p className="text-xl font-mono text-[#0f172a] tracking-wider font-bold">3334444940</p>
                            </div>
                          )}

                          {buktiPreview ? (
                            <div className="relative border border-slate-200 rounded-xl overflow-hidden group shadow-sm">
                              <img src={buktiPreview} alt="Bukti" className="w-full h-32 object-cover" />
                              <div className="absolute inset-0 bg-[#0f172a]/80 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                                <button
                                  type="button"
                                  onClick={() => { setBuktiFile(null); setBuktiPreview(''); }}
                                  className="text-xs font-bold text-white uppercase tracking-widest border-2 border-white px-6 py-2 rounded-full hover:bg-white hover:text-[#0f172a] transition-colors"
                                >
                                  Ubah Foto
                                </button>
                              </div>
                            </div>
                          ) : (
                            <label className="flex flex-col items-center justify-center border-2 border-dashed border-slate-300 rounded-xl py-8 cursor-pointer hover:border-[#0f172a] bg-slate-50 hover:bg-slate-50/50 transition-colors group">
                              <div className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform shadow-sm">
                                <Upload className="w-5 h-5 text-slate-400 group-hover:text-[#0f172a] transition-colors" />
                              </div>
                              <span className="text-xs font-bold text-slate-600 uppercase tracking-widest group-hover:text-[#0f172a] transition-colors">Unggah Bukti Transfer</span>
                              <span className="text-[10px] text-slate-400 mt-1">JPG/PNG (Max 5MB)</span>
                              <input type="file" accept="image/*" className="hidden" onChange={handleBuktiChange} />
                            </label>
                          )}
                        </div>

                        {formError && (
                          <div className="mb-6 p-4 bg-red-50 text-red-600 text-xs font-bold uppercase tracking-widest border border-red-100 rounded-xl flex items-center gap-3 animate-fade-in">
                            <X className="w-4 h-4" /> {formError}
                          </div>
                        )}

                        <button
                          type="submit"
                          disabled={submitMutation.isPending || isPending}
                          className="w-full bg-[#0f172a] text-white py-4 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-slate-800 transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-3 shadow-lg hover:shadow-xl hover:-translate-y-0.5"
                        >
                          {(submitMutation.isPending || isPending) ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
                          {(submitMutation.isPending || isPending) ? 'Memproses Data...' : 'Selesaikan Donasi'}
                        </button>

                        <div className="mt-5 flex items-center justify-center gap-2 text-slate-400">
                          <Shield className="w-3 h-3 text-green-500" />
                          <p className="text-[9px] uppercase tracking-widest font-bold">Transaksi Aman & Terenkripsi</p>
                        </div>
                      </form>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </section>

        </main>

        <PublicFooter />
      </div>

      <style dangerouslySetInnerHTML={{
        __html: `
        /* Pattern Background */
        .page-bg-pattern {
            background-color: #fafafa;
            background-image: radial-gradient(#cbd5e1 1px, transparent 1px);
            background-size: 32px 32px;
        }
        
        /* Subtle Glow in Hero */
        .hero-glow {
            background: radial-gradient(circle at 50% -20%, rgba(192, 156, 83, 0.1) 0%, rgba(15, 23, 42, 0.02) 40%, transparent 70%);
        }

        /* Animations */
        @keyframes fadeInUp {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }
        
        .animate-fade-in-up { 
            animation: fadeInUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards; 
            opacity: 0; 
        }
        .animate-fade-in { 
            animation: fadeIn 0.5s ease-out forwards; 
        }
        
        .delay-100 { animation-delay: 100ms; }
        .delay-200 { animation-delay: 200ms; }

        /* Scrollbar */
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 4px; }
        .custom-scrollbar:hover::-webkit-scrollbar-thumb { background: #cbd5e1; }
      `}} />
    </div>
  );
}

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
        className="w-full text-sm border border-slate-200 px-3 py-2 rounded-lg outline-none focus:border-[#0f172a] transition-colors"
      />
      <textarea
        placeholder="Tulis doa atau hajat Anda di sini..."
        value={pesan}
        onChange={e => setPesan(e.target.value)}
        rows={2}
        className="w-full text-sm border border-slate-200 px-3 py-2 rounded-lg outline-none focus:border-[#0f172a] transition-colors resize-none"
      />
      <label className="flex items-center gap-2 cursor-pointer">
        <input type="checkbox" checked={isAnonim} onChange={e => setIsAnonim(e.target.checked)} className="w-3.5 h-3.5 accent-[#0f172a]" />
        <span className="text-xs text-slate-500">Kirim sebagai anonim</span>
      </label>
      {error && <p className="text-xs text-red-500">{error}</p>}
      <button
        onClick={() => { if (!nama.trim() || !pesan.trim()) { setError('Nama dan doa wajib diisi'); return; } setError(''); mut.mutate(); }}
        disabled={mut.isPending}
        className="w-full bg-[#0f172a] hover:bg-slate-800 text-white text-xs font-bold uppercase tracking-widest py-3 rounded-xl transition-all shadow-md flex items-center justify-center gap-2"
      >
        {mut.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        Kirim Doa
      </button>
    </div>
  );
};
