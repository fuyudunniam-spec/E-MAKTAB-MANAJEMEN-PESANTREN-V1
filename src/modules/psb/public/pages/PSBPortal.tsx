import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { PSBLayout } from "@/modules/psb/public/components/layout/PSBLayout";
import { Helmet } from "react-helmet";
import {
    Loader2,
    User,
    Users,
    FileText,
    CheckCircle2,
    AlertCircle,
    ArrowRight,
    ArrowLeft,
    LogOut,
    Clock,
    CheckCircle,
    XCircle,
    Wallet,
    MessageCircle,
    Info, // Ensure Info is imported
    Package, // Added from instruction snippet
    Check, // Added from instruction snippet
    ChevronRight, // Added from instruction snippet
    LogIn, // Added from instruction snippet
    Edit2 // Added for Edit button
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { toast } from 'sonner';

// Import Native Components
import PersonalStep from '@/modules/psb/components/forms/PersonalStep';
import WaliStep from '@/modules/psb/components/forms/WaliStep';
import ProgramSelectionView from '@/modules/psb/components/forms/ProgramSelectionView';
import DokumenSantriTab from '@/modules/santri/shared/components/DokumenSantriTab';
import { SantriData, WaliData } from '@/modules/santri/shared/types/santri.types';

const PSBPortal = () => {
    const navigate = useNavigate();
    const { user, logout: signOut, loading: authLoading } = useAuth();

    const [dataLoading, setDataLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [currentStep, setCurrentStep] = useState<'info' | 'wali' | 'documents' | 'status'>('info');
    const [showProgramSelection, setShowProgramSelection] = useState(false);

    const [santriData, setSantriData] = useState<any>(null);
    const [waliData, setWaliData] = useState<WaliData[]>([]);
    const [formSantriData, setFormSantriData] = useState<any>({});
    const [errorState, setErrorState] = useState<string | null>(null);
    const [showResetConfirm, setShowResetConfirm] = useState(false);

    useEffect(() => {
        // Handle auth state once loading is finished
        if (!authLoading && !user) {
            // Only redirect if explicitly not logged in AND loading is done
            console.log("No user found in portal, redirecting to auth");
            navigate('/psb/auth', { replace: true });
        } else if (user && !dataLoading && !santriData) {
            // User exists, but data not loaded yet.
            // Only load if not already loading and no data present
            loadInitialData();
        }
    }, [user, authLoading, navigate, santriData]);

    const loadInitialData = async () => {
        if (!user?.id) return;

        setDataLoading(true);
        try {
            // 1. Fetch linked santri record via user_id
            const { data: santri, error: santriError } = await supabase
                .from('santri')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })
                .limit(1)
                .maybeSingle();

            if (santriError) throw santriError;

            if (santri) {
                setSantriData(santri);
                setFormSantriData(santri);

                // Load wali data
                const { data: wali, error: waliError } = await supabase
                    .from('santri_wali')
                    .select('*')
                    .eq('santri_id', santri.id)
                    .order('is_utama', { ascending: false });

                if (!waliError && wali && wali.length > 0) {
                    setWaliData(wali);
                } else {
                    setWaliData([{
                        nama_lengkap: '',
                        hubungan_keluarga: 'Ayah',
                        no_whatsapp: '',
                        alamat: '',
                        is_utama: true,
                    }]);
                }
            } else {
                // Show program selection if no data found
                setShowProgramSelection(true);
            }
        } catch (error: any) {
            console.error('Error loading data:', error);
            toast.error('Gagal memuat data portal');
        } finally {
            setDataLoading(false);
        }
    };

    const generateIdSantri = async (kategori: string, angkatan: string) => {
        let kategoriCode = 'SN'; // Default
        if (kategori.includes('Binaan Mukim')) kategoriCode = 'BM';
        else if (kategori.includes('Binaan Non-Mukim')) kategoriCode = 'BN';
        else if (kategori.includes('Reguler')) kategoriCode = 'RG';
        else if (kategori.includes('Mahasiswa')) kategoriCode = 'MH';
        else if (kategori.includes('Santri TPO')) kategoriCode = 'TP';

        const yearStr = angkatan.length === 4 ? angkatan.slice(-2) : new Date().getFullYear().toString().slice(-2);
        const prefix = `${kategoriCode}${yearStr}`;

        // Fetch last sequence from DB
        const { data } = await supabase
            .from('santri')
            .select('id_santri')
            .ilike('id_santri', `${prefix}%`)
            .order('id_santri', { ascending: false })
            .limit(1)
            .maybeSingle();

        let nextSequence = 1;
        if (data?.id_santri) {
            const lastSequenceStr = data.id_santri.slice(-4);
            const lastSequence = parseInt(lastSequenceStr, 10);
            if (!isNaN(lastSequence)) {
                nextSequence = lastSequence + 1;
            }
        }

        return `${prefix}${nextSequence.toString().padStart(4, '0')}`;
    };

    const handleProgramSelect = async (programId: string) => {
        if (!user?.id) return;

        // Draft Mode: Tidak langsung simpan ke database
        const timestamp = Date.now();
        const angkatan = new Date().getFullYear().toString();

        // Generate ID properly with async await
        const idSantri = await generateIdSantri(programId, angkatan);

        const draftSantriData = {
            user_id: user.id,
            nama_lengkap: user.name || user.email?.split('@')[0] || 'Calon Santri',
            status_santri: 'Calon',
            status_approval: 'pending',
            kategori: programId,
            id_santri: idSantri,

            // Default values
            nisn: `TMP${timestamp}`,
            nik: `NIK${timestamp}`,
            jenis_kelamin: 'Laki-laki',
            tempat_lahir: '',
            tanggal_lahir: '',
            alamat: '',
            no_whatsapp: '',
            agama: 'Islam',
            status_sosial: 'Lengkap',
            kewarganegaraan: 'Indonesia',

            tipe_pembayaran: programId.includes('Binaan') ? 'Subsidi Penuh' : 'Bayar Sendiri',
            angkatan: angkatan,
            created_at: new Date().toISOString()
        };

        setSantriData(draftSantriData);
        setFormSantriData(draftSantriData);
        setWaliData([{
            nama_lengkap: '',
            hubungan_keluarga: 'Ayah',
            no_whatsapp: '',
            alamat: '',
            is_utama: true,
        }]);

        setShowProgramSelection(false);
        toast.info("Program dipilih. Silakan lengkapi data diri Anda.");
    };

    const handleResetProgram = async () => {
        // Jika belum ada ID (masih draft), cukup reset state lokal
        if (!santriData?.id) {
            setSantriData(null);
            setFormSantriData({});
            setWaliData([]);
            setShowProgramSelection(true);
            setCurrentStep('info');
            setShowResetConfirm(false);
            return;
        }

        // Jika sudah tersimpan di DB, hapus record
        setSaving(true);
        try {
            const { error } = await supabase
                .from('santri')
                .delete()
                .eq('id', santriData.id);

            if (error) throw error;

            toast.success("Program berhasil direset. Silakan pilih program baru.");

            setSantriData(null);
            setFormSantriData({});
            setWaliData([]);
            setShowProgramSelection(true);
            setCurrentStep('info');
            setShowResetConfirm(false);

        } catch (error: any) {
            console.error('Error resetting program:', error);
            toast.error(`Gagal mereset program: ${error.message}`);
        } finally {
            setSaving(false);
        }
    };

    const handleSaveInfo = async () => {
        setSaving(true);
        setErrorState(null);
        try {
            // Validate required fields
            if (!formSantriData.nama_lengkap?.trim()) throw new Error("Nama Lengkap wajib diisi");
            if (!formSantriData.jenis_kelamin) throw new Error("Jenis Kelamin wajib dipilih");
            if (!formSantriData.nik?.trim()) throw new Error("NIK wajib diisi");
            if (!formSantriData.tempat_lahir?.trim()) throw new Error("Tempat Lahir wajib diisi");
            if (!formSantriData.tanggal_lahir) throw new Error("Tanggal Lahir wajib diisi");
            if (!formSantriData.alamat?.trim()) throw new Error("Alamat wajib diisi");

            // Clean up data before sending
            const cleanData = { ...formSantriData };

            // Remove empty strings for date fields to avoid DB errors
            if (cleanData.tanggal_lahir === '') cleanData.tanggal_lahir = null;
            if (cleanData.tanggal_masuk === '') cleanData.tanggal_masuk = null;

            // Ensure numeric fields are numbers or null
            if (cleanData.anak_ke === '') cleanData.anak_ke = null;
            if (cleanData.jumlah_saudara === '') cleanData.jumlah_saudara = null;

            // INSERT (Create) jika belum punya ID
            if (!santriData?.id) {
                const { data: newSantri, error: createError } = await supabase
                    .from('santri')
                    .insert(cleanData)
                    .select()
                    .single();

                if (createError) throw createError;

                setSantriData(newSantri);
                setFormSantriData(newSantri);
                toast.success('Data diri berhasil disimpan! Pendaftaran Anda telah dibuat.');
            } else {
                // UPDATE jika sudah ada ID
                const { error } = await supabase
                    .from('santri')
                    .update(cleanData)
                    .eq('id', santriData.id);

                if (error) throw error;
                toast.success('Data diri berhasil diperbarui!');
            }

            setCurrentStep('wali');
        } catch (error: any) {
            console.error('Error saving personal info:', error);
            toast.error(`Gagal menyimpan data: ${error.message}`);
        } finally {
            setSaving(false);
        }
    };

    const handleSaveWali = async () => {
        setSaving(true);
        setErrorState(null);
        try {
            if (!santriData?.id) {
                toast.error("Santri ID tidak ditemukan.");
                return;
            }

            // Delete existing wali data for this santri
            const { error: deleteError } = await supabase
                .from('santri_wali')
                .delete()
                .eq('santri_id', santriData.id);

            if (deleteError) throw deleteError;

            // Insert updated wali data
            const waliDataWithSantriId = waliData.map(wali => ({
                ...wali,
                santri_id: santriData.id,
            }));

            const { error: insertError } = await supabase
                .from('santri_wali')
                .insert(waliDataWithSantriId);

            if (insertError) throw insertError;

            toast.success('Data wali berhasil disimpan!');
            setCurrentStep('documents');
        } catch (error: any) {
            console.error('Error saving wali info:', error);
            toast.error(`Gagal menyimpan data wali: ${error.message}`);
        } finally {
            setSaving(false);
        }
    };

    // Initial Auth Loading Screen (Clean & Minimal)
    if (authLoading || (user && !santriData && !showProgramSelection)) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-royal-950">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-10 h-10 text-gold-500 animate-spin" />
                    <p className="text-slate-400 font-medium tracking-widest text-sm">MEMUAT DATA...</p>
                </div>
            </div>
        );
    }

    // Error State
    if (errorState) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
                <Card className="w-full max-w-md border-0 shadow-2xl rounded-[32px] overflow-hidden">
                    <div className="p-10 text-center">
                        <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
                            <AlertCircle className="w-10 h-10" />
                        </div>
                        <h3 className="text-2xl font-heading font-bold text-royal-950 mb-2">Oops! Ada Masalah</h3>
                        <p className="text-slate-500 mb-8 font-medium">{errorState}</p>
                        <Button onClick={() => navigate('/psb/auth')} className="w-full py-6 rounded-2xl bg-royal-950 font-bold">Kembali ke Login</Button>
                    </div>
                </Card>
            </div>
        );
    }

    // Program Selection View
    if (showProgramSelection) {
        return (
            <PSBLayout>
                <ProgramSelectionView
                    onSelect={handleProgramSelect}
                    isLoading={saving}
                />
            </PSBLayout>
        );
    }

    const handleStatusSosialChange = async (value: string) => {
        if (!santriData?.id) return;

        // Update local state immediately for UI responsiveness
        setFormSantriData(prev => ({ ...prev, status_sosial: value }));
        setSantriData(prev => ({ ...prev, status_sosial: value }));

        try {
            const { error } = await supabase
                .from('santri')
                .update({ status_sosial: value })
                .eq('id', santriData.id);

            if (error) throw error;
            toast.success(`Status berhasil diubah menjadi ${value}`);
        } catch (error) {
            console.error('Error updating status:', error);
            toast.error('Gagal mengubah status');
            // Revert on error
            setFormSantriData(prev => ({ ...prev, status_sosial: santriData.status_sosial }));
            setSantriData(prev => ({ ...prev, status_sosial: santriData.status_sosial }));
        }
    };

    const steps = [
        { id: 'info', label: 'Data Diri', icon: User },
        { id: 'wali', label: 'Data Orang Tua', icon: Users },
        { id: 'documents', label: 'Berkas Wajib', icon: FileText },
        { id: 'status', label: 'Status Pengajuan', icon: Clock },
    ];

    const canAccessStep = (stepId: string) => {
        if (stepId === 'info') return true;
        if (stepId === 'wali') return !!santriData?.id;
        if (stepId === 'documents') return !!santriData?.id && waliData.length > 0;
        if (stepId === 'status') return !!santriData?.id && waliData.length > 0; // Loose check for status
        return false;
    };

    return (
        <PSBLayout>
            <Helmet>
                <title>Portal Pendaftar | PSB Al-Bisri</title>
            </Helmet>

            <div className="min-h-screen bg-slate-50 pb-20 font-body">
                {/* Header Portal */}
                <div className="bg-royal-950 text-white pt-32 pb-24 relative overflow-hidden">
                    <div className="container-section px-6 relative z-10">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
                            <div className="space-y-4">
                                <h1 className="text-4xl md:text-5xl font-heading font-bold">
                                    Ahlan wa Sahlan, <span className="text-gold-500">{user?.name}</span>
                                </h1>
                                {dataLoading ? (
                                    <div className="flex items-center gap-3 text-slate-400">
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        <span className="text-sm font-medium animate-pulse">Menyiapkan data pendaftaran...</span>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-start gap-1">
                                        <div className="text-slate-400 font-medium flex items-center gap-2">
                                            <div className="w-2 h-2 rounded-full bg-green-500"></div>
                                            ID Pendaftar: <span className="text-white font-bold">{santriData?.id_santri || 'TERDAFTAR'}</span>
                                        </div>

                                        {!dataLoading && santriData?.status_approval === 'pending' && (
                                            <div className="mt-1">
                                                <button
                                                    onClick={() => setShowResetConfirm(true)}
                                                    className="text-xs font-medium text-slate-400 hover:text-gold-500 transition-colors flex items-center gap-1 group"
                                                >
                                                    <AlertCircle className="w-3 h-3 group-hover:text-gold-500" />
                                                    Salah pilih program? <span className="underline underline-offset-2">Ubah Program</span>
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                            <Button
                                variant="outline"
                                onClick={() => signOut()}
                                className="border-white/10 text-white hover:bg-white/5 rounded-2xl px-6 py-6 h-auto transition-all"
                            >
                                <LogOut className="w-5 h-5 mr-2" />
                                Keluar Portal
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Content Area */}
                <div className="container-section px-6 -mt-12 relative z-20">
                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">

                        {/* Sidebar Navigation */}
                        <div className="lg:col-span-1 space-y-4">
                            <Card className="border-0 shadow-xl rounded-3xl overflow-hidden bg-white/80 backdrop-blur-md sticky top-28">
                                <CardContent className="p-4">
                                    <div className="space-y-1">
                                        {steps.map((step, i) => {
                                            const isActive = currentStep === step.id;
                                            const isPast = steps.findIndex(s => s.id === currentStep) > i;
                                            const isAccessible = canAccessStep(step.id);

                                            return (
                                                <button
                                                    key={step.id}
                                                    onClick={() => isAccessible && setCurrentStep(step.id as any)}
                                                    disabled={!isAccessible}
                                                    className={`
                                                        w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all font-bold text-sm text-left
                                                        ${isActive
                                                            ? 'bg-royal-950 text-white shadow-lg shadow-royal-950/20'
                                                            : isPast
                                                                ? 'text-green-600 bg-green-50 hover:bg-green-100'
                                                                : isAccessible
                                                                    ? 'text-slate-500 hover:bg-slate-100'
                                                                    : 'text-slate-300 cursor-not-allowed opacity-60'
                                                        }
                                                    `}
                                                >
                                                    <div className={`
                                                        w-8 h-8 rounded-xl flex items-center justify-center transition-all flex-shrink-0
                                                        ${isActive ? 'bg-gold-500 text-royal-950' : isPast ? 'bg-green-100' : 'bg-slate-100'}
                                                    `}>
                                                        {isPast ? <CheckCircle2 className="w-5 h-5" /> : <step.icon className="w-4 h-4" />}
                                                    </div>
                                                    {step.label}
                                                    {/* Lock Icon for inaccessible steps */}
                                                    {!isAccessible && !isPast && !isActive && (
                                                        <div className="ml-auto">
                                                            <div className="w-2 h-2 rounded-full bg-slate-300" />
                                                        </div>
                                                    )}
                                                </button>
                                            );
                                        })}
                                    </div>
                                    <div className="mt-6 pt-6 border-t border-slate-100 px-2 space-y-4">
                                        <div>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Bantuan</p>
                                            <a
                                                href="https://wa.me/6281234567890"
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="w-full flex items-center gap-3 text-slate-600 hover:text-royal-950 font-bold text-sm transition-colors"
                                            >
                                                <div className="w-8 h-8 rounded-xl bg-royal-50 flex items-center justify-center">
                                                    <MessageCircle className="w-4 h-4 text-royal-600" />
                                                </div>
                                                Hubungi Panitia
                                            </a>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Step Forms Area */}
                        <div className="lg:col-span-3">
                            <Card className="border-0 shadow-2xl rounded-[32px] overflow-hidden bg-white">
                                <CardHeader className="p-8 pb-4">
                                    <CardTitle className="text-3xl font-heading font-bold text-royal-950">
                                        {steps.find(s => s.id === currentStep)?.label}
                                    </CardTitle>
                                    <CardDescription className="text-slate-500 font-medium text-base">
                                        Lengkapi seluruh informasi di bawah ini untuk mempermudah proses verifikasi.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="p-8 pt-0">

                                    {/* STATUS STEP */}
                                    {currentStep === 'status' && (
                                        <div className="space-y-10 py-10">
                                            <div className="text-center">
                                                {/* Status Icon */}
                                                <div className={`
                                                    w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 shadow-2xl animate-in zoom-in duration-500
                                                    ${santriData?.status_approval === 'disetujui' ? 'bg-green-100 text-green-600'
                                                        : santriData?.status_approval === 'ditolak' ? 'bg-red-100 text-red-600'
                                                            : 'bg-amber-100 text-amber-600'}
                                                `}>
                                                    {santriData?.status_approval === 'disetujui' ? <CheckCircle className="w-12 h-12" />
                                                        : santriData?.status_approval === 'ditolak' ? <XCircle className="w-12 h-12" />
                                                            : <Clock className="w-12 h-12" />}
                                                </div>

                                                {/* Status Title */}
                                                <h3 className={`text-3xl font-bold mb-3 ${santriData?.status_approval === 'disetujui' ? 'text-green-700'
                                                        : santriData?.status_approval === 'ditolak' ? 'text-red-700'
                                                            : 'text-royal-950'
                                                    }`}>
                                                    {santriData?.status_approval === 'disetujui' ? 'Selamat! Anda Diterima'
                                                        : santriData?.status_approval === 'ditolak' ? 'Mohon Maaf, Pendaftaran Ditolak'
                                                            : 'Sedang Diverifikasi'}
                                                </h3>

                                                {/* Status Description */}
                                                <p className="text-slate-500 max-w-lg mx-auto font-medium leading-relaxed mb-6">
                                                    {santriData?.status_approval === 'disetujui'
                                                        ? 'Alhamdulillah, pendaftaran Anda telah disetujui. Silakan gunakan ID Santri di bawah ini untuk login ke Sistem Akademik.'
                                                        : santriData?.status_approval === 'ditolak'
                                                            ? 'Mohon maaf, berdasarkan hasil verifikasi, pendaftaran Anda belum dapat kami terima. Silakan hubungi panitia untuk informasi lebih lanjut.'
                                                            : 'Terima kasih telah melengkapi data. Tim panitia sedang melakukan pengecekan berkas dan data Anda. Mohon tunggu informasi selanjutnya.'
                                                    }
                                                </p>

                                                {/* APPROVED ACTION: Show ID & Login Button */}
                                                {santriData?.status_approval === 'disetujui' && (
                                                    <div className="flex flex-col items-center gap-6 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-150">
                                                        <div className="p-6 bg-royal-950/5 rounded-2xl border-2 border-royal-950/10 w-full max-w-sm relative overflow-hidden group hover:border-gold-500/50 transition-colors">
                                                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-royal-900 via-gold-500 to-royal-900"></div>
                                                            <p className="text-xs uppercase tracking-widest font-bold text-slate-500 mb-2">ID Santri Resmi Anda</p>
                                                            <div className="flex items-center justify-center gap-3">
                                                                <p className="text-4xl font-display font-bold text-royal-950 tracking-wider font-mono">{santriData.id_santri}</p>
                                                            </div>
                                                            <p className="text-[10px] text-slate-400 mt-2">Gunakan ID ini sebagai username login Anda</p>
                                                        </div>

                                                        <div className="flex flex-col sm:flex-row gap-3 w-full max-w-md justify-center">
                                                            <Button
                                                                onClick={() => {
                                                                    signOut();
                                                                    setTimeout(() => navigate('/auth'), 500);
                                                                }}
                                                                className="bg-gold-500 hover:bg-gold-600 text-royal-950 font-bold px-8 py-6 rounded-2xl shadow-xl shadow-gold-500/20 w-full sm:w-auto transition-all hover:scale-105"
                                                            >
                                                                <LogIn className="w-5 h-5 mr-2" />
                                                                Login Portal Santri
                                                            </Button>
                                                        </div>
                                                    </div>
                                                )}

                                                {/* REJECTED ACTION: Show Contact Button */}
                                                {santriData?.status_approval === 'ditolak' && (
                                                    <div className="flex justify-center animate-in fade-in slide-in-from-bottom-4 duration-500">
                                                        <a
                                                            href="https://wa.me/6281234567890" // Ganti dengan nomor admin yang sesuai
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 px-6 py-4 rounded-xl font-bold transition-colors"
                                                        >
                                                            <MessageCircle className="w-5 h-5" />
                                                            Hubungi Panitia PSB
                                                        </a>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Timeline Visual - Updated Logic */}
                                            <div className="relative pt-10 px-4 md:px-0">
                                                <div className="absolute top-[70px] left-0 right-0 h-1 bg-slate-100 hidden md:block"></div>
                                                <div className="grid grid-cols-2 md:grid-cols-4 gap-y-8 gap-x-4 relative">
                                                    {[
                                                        { label: "Daftar Akun", status: "done" },
                                                        { label: "Lengkapi Data", status: "done" },
                                                        { label: "Verifikasi", status: santriData?.status_approval === 'pending' ? "active" : "done" },
                                                        {
                                                            label: santriData?.status_approval === 'ditolak' ? "Ditolak" : "Diterima",
                                                            status: santriData?.status_approval === 'pending' ? "pending"
                                                                : santriData?.status_approval === 'ditolak' ? "error"
                                                                    : "done"
                                                        },
                                                    ].map((item, i) => (
                                                        <div key={i} className="text-center group flex flex-col items-center z-10">
                                                            <div className={`
                                                                w-12 h-12 rounded-full border-4 border-white flex items-center justify-center mb-3 transition-all shadow-lg
                                                                ${item.status === 'done' ? 'bg-green-500 text-white'
                                                                    : item.status === 'active' ? 'bg-royal-950 text-white ring-4 ring-royal-950/10'
                                                                        : item.status === 'error' ? 'bg-red-500 text-white'
                                                                            : 'bg-slate-200 text-slate-400'}
                                                            `}>
                                                                {item.status === 'done' ? <CheckCircle2 className="w-6 h-6" />
                                                                    : item.status === 'error' ? <XCircle className="w-6 h-6" />
                                                                        : <span className="font-bold text-sm">{i + 1}</span>}
                                                            </div>
                                                            <span className={`text-xs font-bold uppercase tracking-widest ${item.status === 'done' ? 'text-green-600'
                                                                    : item.status === 'active' ? 'text-royal-950'
                                                                        : item.status === 'error' ? 'text-red-600'
                                                                            : 'text-slate-400'
                                                                }`}>
                                                                {item.label}
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Admin Notes Section */}
                                            {(santriData?.catatan_approval || santriData?.status_approval === 'ditolak') && (
                                                <div className={`p-6 rounded-[24px] border ${santriData?.status_approval === 'ditolak' ? 'bg-red-50 border-red-100' : 'bg-slate-50 border-slate-100'
                                                    }`}>
                                                    <h4 className={`font-bold mb-3 flex items-center gap-2 ${santriData?.status_approval === 'ditolak' ? 'text-red-800' : 'text-royal-950'
                                                        }`}>
                                                        <Info className={`w-5 h-5 ${santriData?.status_approval === 'ditolak' ? 'text-red-600' : 'text-royal-600'}`} />
                                                        Catatan Panitia
                                                    </h4>
                                                    <p className={`font-medium italic leading-relaxed ${santriData?.status_approval === 'ditolak' ? 'text-red-600' : 'text-slate-600'
                                                        }`}>
                                                        "{santriData?.catatan_approval || 'Tidak ada catatan khusus.'}"
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* INFO STEP */}
                                    {currentStep === 'info' && (
                                        <div className="space-y-8 py-6">
                                            <PersonalStep
                                                santriData={formSantriData}
                                                onChange={(data) => setFormSantriData(prev => ({ ...prev, ...data }))}
                                                isBinaan={santriData?.kategori?.includes('Binaan') || false}
                                                isMukim={santriData?.kategori?.includes('Mukim') || false}
                                            />
                                            <div className="flex justify-end pt-8 border-t">
                                                <Button
                                                    onClick={handleSaveInfo}
                                                    disabled={saving}
                                                    className="bg-royal-950 hover:bg-royal-900 px-10 py-7 rounded-2xl font-bold shadow-xl shadow-royal-950/20"
                                                >
                                                    {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : "Simpan & Lanjut"}
                                                    <ArrowRight className="w-5 h-5 ml-2" />
                                                </Button>
                                            </div>
                                        </div>
                                    )}

                                    {/* WALI STEP */}
                                    {currentStep === 'wali' && (
                                        <div className="space-y-8 py-6">
                                            <WaliStep
                                                waliData={waliData}
                                                onChange={setWaliData}
                                                isBinaan={santriData?.kategori?.includes('Binaan') || false}
                                                isMukim={santriData?.kategori?.includes('Mukim') || false}
                                            />
                                            <div className="flex justify-between pt-8 border-t">
                                                <Button variant="ghost" onClick={() => setCurrentStep('info')} className="rounded-2xl font-bold">Kembali</Button>
                                                <Button
                                                    onClick={handleSaveWali}
                                                    disabled={saving}
                                                    className="bg-royal-950 hover:bg-royal-900 px-10 py-7 rounded-2xl font-bold shadow-xl shadow-royal-950/20"
                                                >
                                                    {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : "Simpan & Lanjut"}
                                                    <ArrowRight className="w-5 h-5 ml-2" />
                                                </Button>
                                            </div>
                                        </div>
                                    )}

                                    {/* DOCUMENTS STEP */}
                                    {currentStep === 'documents' && (
                                        <div className="space-y-8 py-6">
                                            {/* Status Selection - Only for Binaan */}
                                            {santriData?.kategori?.includes('Binaan') && (
                                                <div className="bg-blue-50 border border-blue-100 rounded-2xl p-6">
                                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                                                        <div>
                                                            <h3 className="text-lg font-bold text-royal-950 flex items-center gap-2">
                                                                <Package className="w-5 h-5 text-blue-600" />
                                                                Status Santri
                                                            </h3>
                                                            <p className="text-slate-500 text-sm mt-1">
                                                                Pilih status yang sesuai untuk menyesuaikan dokumen wajib.
                                                            </p>
                                                        </div>
                                                        <div className="w-full md:w-64">
                                                            <Select
                                                                value={santriData.status_sosial || 'Lengkap'}
                                                                onValueChange={handleStatusSosialChange}
                                                            >
                                                                <SelectTrigger className="bg-white h-12 rounded-xl border-slate-200 focus:ring-2 focus:ring-blue-500/20 font-medium">
                                                                    <SelectValue placeholder="Pilih Status" />
                                                                </SelectTrigger>
                                                                <SelectContent>
                                                                    <SelectItem value="Lengkap">Lengkap (Umum)</SelectItem>
                                                                    <SelectItem value="Yatim">Yatim</SelectItem>
                                                                    <SelectItem value="Piatu">Piatu</SelectItem>
                                                                    <SelectItem value="Yatim Piatu">Yatim Piatu</SelectItem>
                                                                    <SelectItem value="Dhuafa">Dhuafa</SelectItem>
                                                                </SelectContent>
                                                            </Select>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            <DokumenSantriTab
                                                santriId={santriData?.id}
                                                santriData={{
                                                    status_sosial: santriData?.status_sosial || 'Lengkap',
                                                    nama_lengkap: santriData?.nama_lengkap || '',
                                                    kategori: santriData?.kategori || 'Reguler',
                                                }}
                                                isBantuanRecipient={santriData?.kategori?.includes('Binaan') || false}
                                                mode="edit"
                                                isPSB={true}
                                            />
                                            <div className="flex justify-between pt-8 border-t">
                                                <Button variant="ghost" onClick={() => setCurrentStep('wali')} className="rounded-2xl font-bold">Kembali</Button>
                                                <Button
                                                    onClick={() => setCurrentStep('status')}
                                                    className="bg-gold-500 hover:bg-gold-600 text-royal-950 px-10 py-7 rounded-2xl font-bold shadow-xl shadow-gold-500/20"
                                                >
                                                    Selesai & Cek Status
                                                    <ArrowRight className="w-5 h-5 ml-2" />
                                                </Button>
                                            </div>
                                        </div>
                                    )}

                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </div>
            </div>

            <AlertDialog open={showResetConfirm} onOpenChange={setShowResetConfirm}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Ubah Program Pilihan?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Tindakan ini akan <strong>menghapus data pendaftaran Anda saat ini</strong> (ID: {santriData?.id_santri}) dan mengembalikan Anda ke halaman pemilihan program.
                            <br /><br />
                            Data yang sudah diisi (Biodata, Wali, Dokumen) akan hilang permanen.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Batal</AlertDialogCancel>
                        <AlertDialogAction onClick={handleResetProgram} className="bg-red-600 hover:bg-red-700 text-white">
                            Ya, Reset & Ubah Program
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </PSBLayout>
    );
};

export default PSBPortal;
