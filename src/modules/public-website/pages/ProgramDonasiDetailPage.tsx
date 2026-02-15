import React, { useEffect, useState, useMemo } from 'react';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import {
    ArrowLeft, ArrowRight, Heart, Calendar, FileText, TrendingUp,
    Copy, Check, MessageCircle, Send, X, Wallet, ArrowDownLeft, ArrowUpRight
} from 'lucide-react';
import PublicNavbar from '../components/PublicNavbar';
import PublicFooter from '../components/PublicFooter';
import { ProgramDonasiService, DoaHajatService, type ProgramDonasi } from '@/modules/donasi/services/donasi.service';
import { supabase } from '@/integrations/supabase/client';

// ============================================
// HELPERS
// ============================================

interface TransaksiProgram {
    id: string;
    tanggal: string;
    deskripsi: string;
    kategori: string;
    jumlah: number;
    jenis_transaksi: 'Pemasukan' | 'Pengeluaran';
    status: string;
}

const getTransaksiByAkunKas = async (akunKasId: string): Promise<TransaksiProgram[]> => {
    const { data, error } = await supabase
        .from('keuangan')
        .select('id, tanggal, deskripsi, kategori, jumlah, jenis_transaksi, status')
        .eq('akun_kas_id', akunKasId)
        .eq('status', 'posted')
        .order('tanggal', { ascending: false })
        .limit(50);

    if (error) throw error;
    return (data || []) as TransaksiProgram[];
};

const formatCurrency = (val: number) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(val);

const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

const generateUniqueCode = () => Math.floor(100 + Math.random() * 900);

// ============================================
// DONATION WIZARD MODAL (4 Steps) — Warm Theme
// ============================================

const NOMINAL_OPTIONS = [50000, 100000, 200000, 500000, 1000000, 2500000];

interface WizardProps {
    open: boolean;
    onClose: () => void;
    program: ProgramDonasi;
}

const DonationWizardModal: React.FC<WizardProps> = ({ open, onClose, program }) => {
    const [step, setStep] = useState(1);
    const [nominal, setNominal] = useState(0);
    const [customNominal, setCustomNominal] = useState('');
    const [nama, setNama] = useState('');
    const [noWa, setNoWa] = useState('');
    const [email, setEmail] = useState('');
    const [doaPesan, setDoaPesan] = useState('');
    const [isPublic, setIsPublic] = useState(false);
    const [uniqueCode] = useState(generateUniqueCode);
    const [copied, setCopied] = useState(false);

    const finalNominal = customNominal ? parseInt(customNominal) : nominal;
    const totalTransfer = finalNominal + uniqueCode;

    const mSubmit = useMutation({
        mutationFn: () => DoaHajatService.submit({
            nama: nama.trim() || 'Hamba Allah',
            pesan_doa: doaPesan.trim() || '-',
            no_wa: noWa.trim(),
            email: email.trim() || undefined,
            nominal: finalNominal,
            program_donasi_id: program.id,
            is_public: isPublic,
        }),
    });

    const handleCopy = (text: string) => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleConfirmWA = async () => {
        await mSubmit.mutateAsync();

        const waNumber = program.wa_admin || '6281234567890';
        const doaText = doaPesan.trim() ? `\nMohon doanya: ${doaPesan.trim()}` : '';
        const text = encodeURIComponent(
            `Assalamualaikum, saya *${nama.trim() || 'Hamba Allah'}* sudah transfer *${formatCurrency(totalTransfer)}* untuk program *${program.nama}*.${doaText}\n\nBukti transfer terlampir.`
        );
        window.open(`https://wa.me/${waNumber}?text=${text}`, '_blank');
        onClose();
    };

    useEffect(() => {
        if (open) {
            setStep(1); setNominal(0); setCustomNominal(''); setNama('');
            setNoWa(''); setEmail(''); setDoaPesan(''); setIsPublic(false);
            setCopied(false);
        }
    }, [open]);

    if (!open) return null;

    const canProceedStep1 = finalNominal > 0;
    const canProceedStep2 = noWa.trim().length >= 10;

    const stepTitles = ['Pilih Nominal', 'Data Diri & Doa', 'Instruksi Transfer', 'Konfirmasi WhatsApp'];

    return (
        <>
            <div className="fixed inset-0 z-[200] bg-black/40 backdrop-blur-sm" onClick={onClose} />

            <div className="fixed inset-0 z-[201] flex items-center justify-center p-4">
                <div className="bg-white rounded-3xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl border border-stone-100" onClick={e => e.stopPropagation()}>
                    {/* Header */}
                    <div className="bg-royal-950 rounded-t-3xl px-6 py-5">
                        <div className="flex items-center justify-between mb-3">
                            <div>
                                <p className="text-xs text-gold-400 font-bold uppercase tracking-widest">Langkah {step} dari 4</p>
                                <h3 className="text-white font-display text-lg mt-1">{stepTitles[step - 1]}</h3>
                            </div>
                            <button onClick={onClose} className="p-2 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="flex gap-1">
                            {[1, 2, 3, 4].map(s => (
                                <div key={s} className={`h-1 flex-1 rounded-full transition-colors ${s <= step ? 'bg-gold-500' : 'bg-white/10'}`} />
                            ))}
                        </div>
                    </div>

                    {/* Content */}
                    <div className="p-6">
                        {/* STEP 1: Nominal */}
                        {step === 1 && (
                            <div className="space-y-5">
                                <p className="text-stone-500 text-sm">Pilih nominal donasi untuk <strong className="text-royal-900">{program.nama}</strong></p>

                                <div className="grid grid-cols-2 gap-3">
                                    {NOMINAL_OPTIONS.map(n => (
                                        <button
                                            key={n}
                                            onClick={() => { setNominal(n); setCustomNominal(''); }}
                                            className={`py-3.5 px-4 rounded-xl border text-sm font-medium transition-all ${nominal === n && !customNominal
                                                ? 'border-gold-500 bg-gold-50 text-gold-700'
                                                : 'border-stone-200 text-stone-600 hover:border-stone-300 hover:bg-stone-50'
                                                }`}
                                        >
                                            {formatCurrency(n)}
                                        </button>
                                    ))}
                                </div>

                                <div>
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-2 block">Atau ketik nominal lain</label>
                                    <div className="relative">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400 text-sm">Rp</span>
                                        <input
                                            type="number"
                                            value={customNominal}
                                            onChange={e => { setCustomNominal(e.target.value); setNominal(0); }}
                                            placeholder="0"
                                            className="w-full bg-stone-50 border border-stone-200 rounded-xl pl-12 pr-4 py-3.5 text-royal-900 placeholder:text-stone-300 focus:outline-none focus:border-gold-500 focus:ring-1 focus:ring-gold-200 transition-all font-mono"
                                        />
                                    </div>
                                </div>

                                <button
                                    onClick={() => canProceedStep1 && setStep(2)}
                                    disabled={!canProceedStep1}
                                    className="w-full py-3.5 bg-royal-950 text-white rounded-full font-bold uppercase tracking-widest hover:bg-gold-600 transition-all disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    Lanjutkan <ArrowRight className="w-4 h-4" />
                                </button>
                            </div>
                        )}

                        {/* STEP 2: Data Diri & Doa */}
                        {step === 2 && (
                            <div className="space-y-4">
                                <div>
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-2 block">Nama</label>
                                    <input
                                        type="text"
                                        value={nama}
                                        onChange={e => setNama(e.target.value)}
                                        placeholder="Hamba Allah / Nama Asli"
                                        className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 text-royal-900 placeholder:text-stone-300 focus:outline-none focus:border-gold-500 transition-all"
                                    />
                                </div>

                                <div>
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-2 block">No. WhatsApp *</label>
                                    <input
                                        type="tel"
                                        value={noWa}
                                        onChange={e => setNoWa(e.target.value)}
                                        placeholder="08123456789"
                                        className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 text-royal-900 placeholder:text-stone-300 focus:outline-none focus:border-gold-500 transition-all"
                                    />
                                    <p className="text-xs text-stone-400 mt-1">Wajib diisi untuk konfirmasi transfer</p>
                                </div>

                                <div>
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-2 block">Email (Opsional)</label>
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={e => setEmail(e.target.value)}
                                        placeholder="email@example.com"
                                        className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 text-royal-900 placeholder:text-stone-300 focus:outline-none focus:border-gold-500 transition-all"
                                    />
                                </div>

                                <div>
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-2 block">Titip Doa / Hajat</label>
                                    <textarea
                                        value={doaPesan}
                                        onChange={e => setDoaPesan(e.target.value)}
                                        rows={3}
                                        placeholder="Tuliskan doa atau hajat Anda..."
                                        className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 text-royal-900 placeholder:text-stone-300 focus:outline-none focus:border-gold-500 transition-all resize-none"
                                    />
                                </div>

                                {doaPesan.trim() && (
                                    <label className="flex items-center gap-3 p-3 bg-gold-50 rounded-xl border border-gold-200 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={isPublic}
                                            onChange={e => setIsPublic(e.target.checked)}
                                            className="w-4 h-4 rounded text-gold-600 focus:ring-gold-200"
                                        />
                                        <div>
                                            <span className="text-sm font-medium text-royal-900">Tampilkan doa di halaman publik</span>
                                            <p className="text-xs text-stone-500">Setelah disetujui oleh admin</p>
                                        </div>
                                    </label>
                                )}

                                <div className="flex gap-3 pt-2">
                                    <button onClick={() => setStep(1)} className="px-6 py-3 border border-stone-200 rounded-full text-sm font-bold uppercase tracking-widest text-stone-600 hover:bg-stone-50 transition-all">
                                        Kembali
                                    </button>
                                    <button
                                        onClick={() => canProceedStep2 && setStep(3)}
                                        disabled={!canProceedStep2}
                                        className="flex-1 py-3 bg-royal-950 text-white rounded-full font-bold uppercase tracking-widest hover:bg-gold-600 transition-all disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                    >
                                        Lanjutkan <ArrowRight className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* STEP 3: Transfer Instructions */}
                        {step === 3 && (
                            <div className="space-y-5">
                                <div className="bg-stone-50 rounded-2xl p-5 border border-stone-100 space-y-4">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-stone-500">Nominal Donasi</span>
                                        <span className="text-royal-900 font-bold">{formatCurrency(finalNominal)}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-stone-500">Kode Unik</span>
                                        <span className="text-gold-700 font-bold">+ {uniqueCode}</span>
                                    </div>
                                    <div className="border-t border-stone-200 pt-3 flex justify-between">
                                        <span className="font-bold text-royal-900">Total Transfer</span>
                                        <div className="flex items-center gap-2">
                                            <span className="text-xl font-display font-bold text-royal-950">{formatCurrency(totalTransfer)}</span>
                                            <button
                                                onClick={() => handleCopy(totalTransfer.toString())}
                                                className="p-1.5 rounded-lg hover:bg-stone-200 transition-colors"
                                                title="Salin nominal"
                                            >
                                                {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-stone-400" />}
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-gold-50 border border-gold-200 rounded-2xl p-5">
                                    <p className="text-xs font-bold uppercase tracking-widest text-gold-700 mb-3">Rekening Tujuan</p>
                                    <div className="space-y-2 text-sm">
                                        <div className="flex justify-between">
                                            <span className="text-stone-500">Bank</span>
                                            <span className="text-royal-900 font-bold">{program.akun_kas_nama_bank || 'BSI'}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-stone-500">No. Rekening</span>
                                            <div className="flex items-center gap-2">
                                                <span className="text-royal-900 font-mono font-bold">{program.akun_kas_nomor_rekening || '-'}</span>
                                                <button
                                                    onClick={() => handleCopy(program.akun_kas_nomor_rekening || '')}
                                                    className="p-1 hover:bg-gold-100 rounded transition-colors"
                                                >
                                                    <Copy className="w-3.5 h-3.5 text-gold-600" />
                                                </button>
                                            </div>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-stone-500">Atas Nama</span>
                                            <span className="text-royal-900 font-bold">{program.akun_kas_atas_nama || '-'}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                                    <p className="text-xs text-blue-700 leading-relaxed">
                                        <strong>Penting:</strong> Transfer tepat <strong>{formatCurrency(totalTransfer)}</strong> agar donasi Anda mudah diidentifikasi oleh tim kami.
                                    </p>
                                </div>

                                <div className="flex gap-3">
                                    <button onClick={() => setStep(2)} className="px-6 py-3 border border-stone-200 rounded-full text-sm font-bold uppercase tracking-widest text-stone-600 hover:bg-stone-50 transition-all">
                                        Kembali
                                    </button>
                                    <button
                                        onClick={() => setStep(4)}
                                        className="flex-1 py-3 bg-royal-950 text-white rounded-full font-bold uppercase tracking-widest hover:bg-gold-600 transition-all flex items-center justify-center gap-2"
                                    >
                                        Sudah Transfer <ArrowRight className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* STEP 4: WhatsApp Confirmation */}
                        {step === 4 && (
                            <div className="space-y-5 text-center">
                                <div className="w-16 h-16 mx-auto bg-emerald-50 rounded-full flex items-center justify-center">
                                    <MessageCircle className="w-8 h-8 text-emerald-600" />
                                </div>

                                <div>
                                    <h3 className="font-display text-xl text-royal-900 mb-2">Konfirmasi via WhatsApp</h3>
                                    <p className="text-sm text-stone-500 leading-relaxed">
                                        Langkah terakhir! Kirim konfirmasi transfer beserta bukti kepada admin kami melalui WhatsApp.
                                    </p>
                                </div>

                                <div className="bg-stone-50 rounded-xl p-4 text-left text-sm space-y-1">
                                    <p className="text-stone-500">Ringkasan:</p>
                                    <p className="text-royal-900"><strong>Program:</strong> {program.nama}</p>
                                    <p className="text-royal-900"><strong>Nominal:</strong> {formatCurrency(totalTransfer)}</p>
                                    <p className="text-royal-900"><strong>Nama:</strong> {nama || 'Hamba Allah'}</p>
                                    {doaPesan.trim() && <p className="text-royal-900"><strong>Doa:</strong> {doaPesan.slice(0, 80)}...</p>}
                                </div>

                                <button
                                    onClick={handleConfirmWA}
                                    disabled={mSubmit.isPending}
                                    className="w-full py-4 bg-emerald-600 text-white rounded-full font-bold uppercase tracking-widest hover:bg-emerald-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                                >
                                    <MessageCircle className="w-5 h-5" />
                                    {mSubmit.isPending ? 'Mengirim...' : 'Buka WhatsApp'}
                                </button>

                                <button
                                    onClick={() => setStep(3)}
                                    className="text-sm text-stone-400 hover:text-stone-600 transition-colors"
                                >
                                    ← Kembali ke instruksi transfer
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
};

// ============================================
// SANITY NEWS CARDS
// ============================================

interface SanityPost {
    _id: string;
    title: string;
    slug: { current: string };
    mainImage?: { asset?: { url?: string } };
    publishedAt?: string;
}

const SanityNewsCards: React.FC<{ slugs: string[] }> = ({ slugs }) => {
    const { data: posts = [], isLoading } = useQuery<SanityPost[]>({
        queryKey: ['sanityPosts', slugs],
        queryFn: async () => {
            if (!slugs.length) return [];
            const projectId = import.meta.env.VITE_SANITY_PROJECT_ID;
            const dataset = import.meta.env.VITE_SANITY_DATASET || 'production';
            if (!projectId) return [];

            const slugFilter = slugs.map(s => `"${s}"`).join(',');
            const query = encodeURIComponent(`*[_type == "post" && slug.current in [${slugFilter}]] | order(publishedAt desc) { _id, title, slug, mainImage { asset->{ url } }, publishedAt }`);
            const res = await fetch(`https://${projectId}.api.sanity.io/v2023-08-01/data/query/${dataset}?query=${query}`);
            const json = await res.json();
            return json.result || [];
        },
        enabled: slugs.length > 0,
    });

    if (!slugs.length) return null;
    if (isLoading) return (
        <div className="grid md:grid-cols-2 gap-4">
            {[1, 2].map(i => <div key={i} className="h-40 bg-stone-100 rounded-2xl animate-pulse" />)}
        </div>
    );
    if (posts.length === 0) return null;

    return (
        <div className="space-y-4">
            {posts.map(post => (
                <Link key={post._id} to={`/news/${post.slug.current}`} className="group flex gap-4 bg-white rounded-2xl border border-stone-100 overflow-hidden hover:shadow-md transition-all">
                    {post.mainImage?.asset?.url && (
                        <div className="w-28 h-28 flex-shrink-0">
                            <img src={post.mainImage.asset.url} alt={post.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        </div>
                    )}
                    <div className="flex-1 py-4 pr-4">
                        <h4 className="font-display font-bold text-sm text-royal-900 group-hover:text-gold-700 transition-colors line-clamp-2 mb-1">{post.title}</h4>
                        {post.publishedAt && (
                            <p className="text-xs text-stone-400">{new Date(post.publishedAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                        )}
                    </div>
                </Link>
            ))}
        </div>
    );
};

// ============================================
// MAIN DETAIL PAGE
// ============================================

const ProgramDonasiDetailPage: React.FC = () => {
    const { slug } = useParams<{ slug: string }>();
    const [searchParams, setSearchParams] = useSearchParams();
    const [activeTab, setActiveTab] = useState<'detail' | 'transparansi' | 'kabar'>('detail');
    const [showWizard, setShowWizard] = useState(false);

    const { data: program, isLoading, error } = useQuery({
        queryKey: ['programDetail', slug],
        queryFn: () => ProgramDonasiService.getBySlug(slug || ''),
        enabled: !!slug,
    });

    const { data: transactions = [] } = useQuery({
        queryKey: ['programTx', program?.akun_kas_id],
        queryFn: () => getTransaksiByAkunKas(program!.akun_kas_id),
        enabled: !!program?.akun_kas_id,
    });

    // Auto-open wizard if ?donate=true
    useEffect(() => {
        if (searchParams.get('donate') === 'true' && program) {
            setShowWizard(true);
            setSearchParams({}, { replace: true });
        }
    }, [program, searchParams]);

    useEffect(() => { window.scrollTo(0, 0); }, []);

    const progress = useMemo(() => {
        if (!program || program.target_amount <= 0) return 0;
        return Math.min(((program.akun_kas_saldo || 0) / program.target_amount) * 100, 100);
    }, [program]);

    const { totalMasuk, totalKeluar } = useMemo(() => {
        let masuk = 0, keluar = 0;
        transactions.forEach(tx => {
            if (tx.jenis_transaksi === 'Pemasukan') masuk += tx.jumlah;
            else keluar += tx.jumlah;
        });
        return { totalMasuk: masuk, totalKeluar: keluar };
    }, [transactions]);

    if (isLoading) {
        return (
            <div className="min-h-screen bg-stone-50 flex items-center justify-center">
                <div className="w-10 h-10 border-2 border-gold-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (error || !program) {
        return (
            <div className="min-h-screen bg-stone-50 flex flex-col items-center justify-center gap-4">
                <Heart className="w-16 h-16 text-stone-200" />
                <p className="text-stone-500 text-lg font-light">Program tidak ditemukan</p>
                <Link to="/donasi" className="px-6 py-3 bg-royal-950 text-white rounded-full text-sm font-bold uppercase tracking-widest hover:bg-gold-600 transition-all">
                    Kembali
                </Link>
            </div>
        );
    }

    const tabs = [
        { key: 'detail' as const, label: 'Detail', icon: FileText },
        { key: 'transparansi' as const, label: 'Transparansi', icon: TrendingUp },
        ...(program.sanity_slugs?.length ? [{ key: 'kabar' as const, label: 'Kabar', icon: Calendar }] : []),
    ];

    return (
        <div className="bg-stone-50 text-royal-900 font-sans min-h-screen selection:bg-gold-200 selection:text-royal-950">
            <PublicNavbar />

            {/* HERO HEADER */}
            <header className="relative pt-28 lg:pt-32 bg-royal-950 text-white overflow-hidden">
                <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "url('https://www.transparenttextures.com/patterns/arabesque.png')" }} />

                <div className="max-w-7xl mx-auto px-6 relative z-10 pb-16">
                    <Link to="/donasi" className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors mb-8">
                        <ArrowLeft className="w-4 h-4" /> Semua Program
                    </Link>

                    <div className="grid lg:grid-cols-2 gap-10 items-center">
                        <div>
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-8 h-[1px] bg-gold-500" />
                                <span className="text-gold-500 text-xs font-bold uppercase tracking-[0.3em]">Program Donasi</span>
                            </div>

                            <h1 className="font-display text-3xl lg:text-5xl leading-tight mb-4">{program.nama}</h1>
                            {program.deskripsi && (
                                <p className="text-slate-300 font-light text-lg leading-relaxed mb-8">{program.deskripsi}</p>
                            )}

                            {/* Progress */}
                            {program.target_amount > 0 && (
                                <div className="mb-8">
                                    <div className="flex justify-between text-sm mb-2">
                                        <span className="text-slate-400">Terkumpul</span>
                                        <span className="text-gold-400 font-bold">{progress.toFixed(0)}%</span>
                                    </div>
                                    <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
                                        <div className="bg-gold-500 h-full rounded-full transition-all duration-1000" style={{ width: `${progress}%` }} />
                                    </div>
                                    <div className="flex justify-between mt-2 text-xs text-slate-400">
                                        <span>{formatCurrency(program.akun_kas_saldo || 0)}</span>
                                        <span>Target: {formatCurrency(program.target_amount)}</span>
                                    </div>
                                </div>
                            )}

                            <button
                                onClick={() => setShowWizard(true)}
                                className="px-10 py-4 bg-gold-500 text-royal-950 rounded-full font-bold uppercase tracking-widest hover:bg-white transition-all duration-300 flex items-center gap-2"
                            >
                                <Heart className="w-5 h-5" /> Donasi Sekarang
                            </button>
                        </div>

                        {/* Image */}
                        <div className="hidden lg:block">
                            <div className="aspect-[4/3] rounded-3xl overflow-hidden border border-white/10">
                                <img
                                    src={program.gambar_url || 'https://images.unsplash.com/photo-1542204637-e67bc7d41e0e?q=80&w=600&auto=format&fit=crop'}
                                    alt={program.nama}
                                    className="w-full h-full object-cover"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            {/* TABS + CONTENT */}
            <section className="py-12 px-6 -mt-6 relative z-20">
                <div className="max-w-7xl mx-auto">
                    {/* Tab Navigation */}
                    <div className="inline-flex bg-white rounded-xl p-1 border border-stone-100 shadow-sm mb-10">
                        {tabs.map(t => {
                            const Icon = t.icon;
                            const isActive = activeTab === t.key;
                            return (
                                <button
                                    key={t.key}
                                    onClick={() => setActiveTab(t.key)}
                                    className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold uppercase tracking-widest transition-all ${isActive
                                        ? 'bg-royal-950 text-white shadow-sm'
                                        : 'text-stone-400 hover:text-royal-900'
                                        }`}
                                >
                                    <Icon className="w-4 h-4" /> {t.label}
                                </button>
                            );
                        })}
                    </div>

                    {/* DETAIL TAB */}
                    {activeTab === 'detail' && (
                        <div className="grid lg:grid-cols-3 gap-8">
                            <div className="lg:col-span-2 space-y-6">
                                {/* Info Card */}
                                <div className="bg-white rounded-[2rem] border border-stone-100 p-8 shadow-sm">
                                    <h3 className="font-display text-xl font-bold mb-4">Tentang Program</h3>
                                    <p className="text-stone-600 leading-relaxed font-light">{program.deskripsi || 'Deskripsi belum tersedia.'}</p>
                                </div>

                                {/* Quick Stats */}
                                <div className="grid grid-cols-3 gap-4">
                                    <div className="bg-white rounded-2xl border border-stone-100 p-5 text-center">
                                        <Wallet className="w-5 h-5 text-gold-500 mx-auto mb-2" />
                                        <p className="text-xs text-stone-400 uppercase tracking-widest mb-1">Saldo</p>
                                        <p className="font-display text-lg font-bold">{formatCurrency(program.akun_kas_saldo || 0)}</p>
                                    </div>
                                    <div className="bg-white rounded-2xl border border-stone-100 p-5 text-center">
                                        <ArrowDownLeft className="w-5 h-5 text-emerald-500 mx-auto mb-2" />
                                        <p className="text-xs text-stone-400 uppercase tracking-widest mb-1">Masuk</p>
                                        <p className="font-display text-lg font-bold text-emerald-700">{formatCurrency(totalMasuk)}</p>
                                    </div>
                                    <div className="bg-white rounded-2xl border border-stone-100 p-5 text-center">
                                        <ArrowUpRight className="w-5 h-5 text-stone-400 mx-auto mb-2" />
                                        <p className="text-xs text-stone-400 uppercase tracking-widest mb-1">Tersalurkan</p>
                                        <p className="font-display text-lg font-bold">{formatCurrency(totalKeluar)}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Sidebar */}
                            <div className="space-y-6">
                                <div className="bg-white rounded-2xl border border-stone-100 p-6">
                                    <h4 className="text-xs font-bold uppercase tracking-widest text-stone-400 mb-3">Rekening Donasi</h4>
                                    <div className="space-y-3 text-sm">
                                        <div className="flex justify-between">
                                            <span className="text-stone-500">Bank</span>
                                            <span className="font-bold">{program.akun_kas_nama_bank || '-'}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-stone-500">Rekening</span>
                                            <span className="font-mono font-bold">{program.akun_kas_nomor_rekening || '-'}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-stone-500">a.n</span>
                                            <span className="font-bold">{program.akun_kas_atas_nama || '-'}</span>
                                        </div>
                                    </div>
                                </div>

                                <button
                                    onClick={() => setShowWizard(true)}
                                    className="w-full py-4 bg-gold-500 text-royal-950 rounded-full font-bold uppercase tracking-widest hover:bg-royal-950 hover:text-white transition-all duration-300 flex items-center justify-center gap-2"
                                >
                                    <Heart className="w-5 h-5" /> Donasi Sekarang
                                </button>
                            </div>
                        </div>
                    )}

                    {/* TRANSPARANSI TAB */}
                    {activeTab === 'transparansi' && (
                        <div className="bg-white rounded-[2rem] border border-stone-100 p-8 shadow-sm">
                            <h3 className="font-display text-xl font-bold mb-2">Rincian Transaksi</h3>
                            <p className="text-xs text-stone-400 mb-6 font-light">Data keuangan yang terkait langsung dengan program ini.</p>

                            {transactions.length === 0 ? (
                                <div className="text-center py-12">
                                    <TrendingUp className="w-12 h-12 text-stone-200 mx-auto mb-3" />
                                    <p className="text-stone-400 font-light">Belum ada transaksi tercatat</p>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left border-collapse min-w-[600px]">
                                        <thead>
                                            <tr className="bg-stone-50 text-[10px] font-bold uppercase tracking-widest text-stone-400 border-b border-stone-100">
                                                <th className="p-4 font-medium">Tanggal</th>
                                                <th className="p-4 font-medium">Uraian</th>
                                                <th className="p-4 font-medium text-right">Nominal</th>
                                                <th className="p-4 font-medium text-center">Jenis</th>
                                            </tr>
                                        </thead>
                                        <tbody className="text-sm">
                                            {transactions.map((tx) => (
                                                <tr key={tx.id} className={`border-b border-stone-50 hover:bg-stone-50/50 transition-colors`}>
                                                    <td className="p-4 text-stone-500 font-medium">
                                                        {new Date(tx.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                                                    </td>
                                                    <td className="p-4">
                                                        <p className="text-royal-900 font-medium">{tx.deskripsi || tx.kategori}</p>
                                                    </td>
                                                    <td className={`p-4 text-right font-display font-bold ${tx.jenis_transaksi === 'Pemasukan' ? 'text-emerald-700' : 'text-royal-900'}`}>
                                                        {tx.jenis_transaksi === 'Pemasukan' ? '+' : '-'} {formatCurrency(tx.jumlah)}
                                                    </td>
                                                    <td className="p-4 text-center">
                                                        <span className={`text-[10px] uppercase tracking-wider px-3 py-1 rounded-full font-bold ${tx.jenis_transaksi === 'Pemasukan'
                                                            ? 'text-emerald-700 bg-emerald-50 border border-emerald-200'
                                                            : 'text-stone-500 bg-stone-50 border border-stone-200'
                                                            }`}>
                                                            {tx.jenis_transaksi === 'Pemasukan' ? 'Masuk' : 'Keluar'}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    )}

                    {/* KABAR TAB */}
                    {activeTab === 'kabar' && program.sanity_slugs && (
                        <div className="max-w-2xl">
                            <h3 className="font-display text-xl font-bold mb-6">Kabar Terkini</h3>
                            <SanityNewsCards slugs={program.sanity_slugs} />
                        </div>
                    )}
                </div>
            </section>

            <PublicFooter />

            {/* Wizard Modal */}
            <DonationWizardModal
                open={showWizard}
                onClose={() => setShowWizard(false)}
                program={program}
            />
        </div>
    );
};

export default ProgramDonasiDetailPage;
