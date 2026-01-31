import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { PSBLayout } from "@/components/layout/PSBLayout";
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
    LogIn // Added from instruction snippet
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { toast } from 'sonner';

// Import Native Components
import PersonalStep from '@/components/forms/PersonalStep';
import WaliStep from '@/components/forms/WaliStep';
import ProgramSelectionView from '@/components/forms/ProgramSelectionView';
import DokumenSantriTab from '@/modules/santri/components/DokumenSantriTab';
import { SantriData, WaliData } from '@/types/santri.types';

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

    const handleProgramSelect = async (programId: string) => {
        if (!user?.id) return;
        setSaving(true);
        try {
            console.log("Creating initial santri record for program:", programId);
            const timestamp = Date.now();
            
            const newSantriData = {
                user_id: user.id,
                nama_lengkap: user.name || user.email?.split('@')[0] || 'Calon Santri',
                status_santri: 'Calon',
                status_approval: 'pending',
                kategori: programId, // Use selected program ID
                // Default values for required fields
                nisn: `TMP${timestamp}`,
                nik: `NIK${timestamp}`, 
                jenis_kelamin: 'Laki-laki',
                tempat_lahir: '-',
                tanggal_lahir: new Date().toISOString().split('T')[0],
                alamat: '-',
                tipe_pembayaran: programId.includes('Binaan') ? 'Bantuan Yayasan' : 'Mandiri',
                angkatan: new Date().getFullYear().toString(),
                created_at: new Date().toISOString()
            };

            const { data: newSantri, error: createError } = await supabase
                .from('santri')
                .insert(newSantriData)
                .select()
                .single();

            if (createError) throw createError;

            setSantriData(newSantri);
            setFormSantriData(newSantri);
            setWaliData([{
                nama_lengkap: '',
                hubungan_keluarga: 'Ayah',
                no_whatsapp: '',
                alamat: '',
                is_utama: true,
            }]);
            
            setShowProgramSelection(false);
            toast.success("Program berhasil dipilih! Silakan lengkapi data diri.");
        } catch (error: any) {
            console.error('Error creating santri:', error);
            toast.error(`Gagal memilih program: ${error.message}`);
        } finally {
            setSaving(false);
        }
    };

    const handleSaveInfo = async () => {
        setSaving(true);
        setErrorState(null);
        try {
            if (!santriData?.id) {
                toast.error("Santri ID tidak ditemukan.");
                return;
            }

            const { error } = await supabase
                .from('santri')
                .update(formSantriData)
                .eq('id', santriData.id);

            if (error) throw error;

            toast.success('Data diri berhasil disimpan!');
            setCurrentStep('wali');
        } catch (error: any) {
            console.error('Error saving personal info:', error);
            toast.error(`Gagal menyimpan data diri: ${error.message}`);
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

    const steps = [
        { id: 'info', label: 'Data Diri', icon: User },
        { id: 'wali', label: 'Data Orang Tua', icon: Users },
        { id: 'documents', label: 'Berkas Wajib', icon: FileText },
        { id: 'status', label: 'Status Pengajuan', icon: Clock },
    ];

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
                                    <div className="text-slate-400 font-medium flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-green-500"></div>
                                        ID Pendaftar: <span className="text-white font-bold">{santriData?.id_santri || 'TERDAFTAR'}</span>
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
                                            return (
                                                <button
                                                    key={step.id}
                                                    onClick={() => setCurrentStep(step.id as any)}
                                                    className={`
                                                        w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all font-bold text-sm
                                                        ${isActive
                                                            ? 'bg-royal-950 text-white shadow-lg shadow-royal-950/20'
                                                            : isPast
                                                                ? 'text-green-600 bg-green-50'
                                                                : 'text-slate-500 hover:bg-slate-100'
                                                        }
                                                    `}
                                                >
                                                    <div className={`
                                                        w-8 h-8 rounded-xl flex items-center justify-center transition-all
                                                        ${isActive ? 'bg-gold-500 text-royal-950' : 'bg-slate-100'}
                                                    `}>
                                                        {isPast ? <CheckCircle2 className="w-5 h-5" /> : <step.icon className="w-4 h-4" />}
                                                    </div>
                                                    {step.label}
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
                                                <div className={`
                                                    w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 shadow-2xl
                                                    ${santriData?.status_approval === 'disetujui' ? 'bg-green-100 text-green-600' : 'bg-amber-100 text-amber-600'}
                                                `}>
                                                    {santriData?.status_approval === 'disetujui' ? <CheckCircle className="w-12 h-12" /> : <Clock className="w-12 h-12" />}
                                                </div>
                                                <h3 className="text-3xl font-bold text-royal-950 mb-3">
                                                    {santriData?.status_approval === 'disetujui' ? 'Selamat! Anda Diterima' : 'Sedang Diverifikasi'}
                                                </h3>
                                                <p className="text-slate-500 max-w-lg mx-auto font-medium leading-relaxed mb-6">
                                                    {santriData?.status_approval === 'disetujui'
                                                        ? 'Pendaftaran Anda telah disetujui. Silakan login ke dashboard santri reguler menggunakan akun ini.'
                                                        : 'Terima kasih telah melengkapi data. Tim panitia sedang melakukan pengecekan berkas dan data Anda.'
                                                    }
                                                </p>
                                                
                                                {santriData?.status_approval === 'disetujui' && (
                                                  <div className="flex flex-col items-center gap-4 animate-in fade-in zoom-in duration-500">
                                                    <div className="p-4 bg-royal-950/5 rounded-xl border border-royal-950/10">
                                                      <p className="text-xs uppercase tracking-widest font-bold text-slate-500 mb-1">ID Santri Anda</p>
                                                      <p className="text-3xl font-display font-bold text-royal-950 tracking-wider">{santriData.id_santri}</p>
                                                    </div>
                                                    <Button 
                                                      onClick={() => {
                                                        signOut();
                                                        setTimeout(() => navigate('/auth'), 500);
                                                      }}
                                                      className="bg-gold-500 hover:bg-gold-600 text-royal-950 font-bold px-8 py-6 rounded-2xl shadow-xl shadow-gold-500/20"
                                                    >
                                                      <LogIn className="w-5 h-5 mr-2" />
                                                      Login Portal Santri
                                                    </Button>
                                                  </div>
                                                )}
                                            </div>

                                            {/* Timeline Visual */}
                                            <div className="relative pt-10">
                                                <div className="absolute top-[70px] left-0 right-0 h-1 bg-slate-100"></div>
                                                <div className="grid grid-cols-4 gap-4 relative">
                                                    {[
                                                        { label: "Daftar Akun", status: "done" },
                                                        { label: "Lengkapi Data", status: "done" },
                                                        { label: "Verifikasi", status: santriData?.status_approval === 'pending' ? "active" : "done" },
                                                        { label: "Selesai", status: santriData?.status_approval === 'disetujui' ? "done" : "pending" },
                                                    ].map((item, i) => (
                                                        <div key={i} className="text-center group">
                                                            <div className={`
                                                                w-12 h-12 rounded-full border-4 border-white flex items-center justify-center mx-auto mb-4 transition-all relative z-10 shadow-lg
                                                                ${item.status === 'done' ? 'bg-green-500 text-white' : item.status === 'active' ? 'bg-royal-950 text-white ring-8 ring-royal-950/5' : 'bg-slate-200 text-slate-400'}
                                                            `}>
                                                                {item.status === 'done' ? <CheckCircle2 className="w-6 h-6" /> : <span className="font-bold text-sm">{i + 1}</span>}
                                                            </div>
                                                            <span className={`text-xs font-bold uppercase tracking-widest ${item.status === 'done' ? 'text-green-600' : item.status === 'active' ? 'text-royal-950' : 'text-slate-400'}`}>
                                                                {item.label}
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            <div className="p-8 rounded-[32px] bg-slate-50 border border-slate-100">
                                                <h4 className="font-bold text-royal-950 mb-4 flex items-center gap-2">
                                                    <Info className="w-5 h-5 text-royal-600" />
                                                    Catatan Panitia
                                                </h4>
                                                <p className="text-slate-500 font-medium italic">
                                                    "{santriData?.catatan_approval || 'Belum ada catatan untuk Anda saat ini.'}"
                                                </p>
                                            </div>
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
                                            <DokumenSantriTab
                                                santriId={santriData?.id}
                                                santriData={{
                                                    status_sosial: santriData?.status_sosial || 'Lengkap',
                                                    nama_lengkap: santriData?.nama_lengkap || '',
                                                    kategori: santriData?.kategori || 'Reguler',
                                                }}
                                                isBantuanRecipient={santriData?.kategori?.includes('Binaan') || false}
                                                mode="edit"
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
        </PSBLayout>
    );
};

export default PSBPortal;
