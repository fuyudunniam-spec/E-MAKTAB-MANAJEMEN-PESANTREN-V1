import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    Wallet, TrendingUp, HandCoins, Users, Plus, CheckCircle,
    XCircle, Clock, ArrowRight, Heart
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DonasiTransparansiService } from '@/modules/donasi/services/donasi.service';
import { DoaHajatService } from '@/modules/donasi/services/donasi.service';
import { ProgramDonasiService } from '@/modules/donasi/services/donasi.service';
import { DonasiInputForm } from './DonasiInputForm';
import { ProgramFormDialog } from './ProgramFormDialog';
import { AkunKasService } from '@/modules/keuangan/services/akunKas.service';
import { toast } from 'sonner';

const formatCurrency = (val: number) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(val);

export const TabOverview: React.FC = () => {
    const qc = useQueryClient();
    const [showInputDonasi, setShowInputDonasi] = useState(false);
    const [showProgramForm, setShowProgramForm] = useState(false);

    // Stats
    const { data: stats } = useQuery({
        queryKey: ['donasiTransparansi', new Date().getFullYear()],
        queryFn: () => DonasiTransparansiService.getData(new Date().getFullYear()),
    });

    // Pending Verifications
    const { data: pending = [] } = useQuery({
        queryKey: ['donasiPending'],
        queryFn: DoaHajatService.getPending,
    });

    // Active Programs
    const { data: programs = [] } = useQuery({
        queryKey: ['programDonasi'],
        queryFn: ProgramDonasiService.getAll,
    });

    // Akun Kas for Program Form
    const { data: akunKasList = [] } = useQuery({
        queryKey: ['akunKasAll'],
        queryFn: AkunKasService.getAllActive,
    });

    const mVerify = useMutation({
        mutationFn: DoaHajatService.verify,
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['donasiPending'] });
            qc.invalidateQueries({ queryKey: ['donasiTransparansi'] });
            toast.success('Donasi diverifikasi');
        },
        onError: (e: any) => toast.error(e.message || 'Gagal memverifikasi'),
    });

    const mReject = useMutation({
        mutationFn: DoaHajatService.reject,
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['donasiPending'] });
            toast.success('Donasi ditolak');
        },
    });

    const StatCard = ({ label, value, icon: Icon, colorClass }: any) => (
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-start justify-between">
            <div>
                <p className="text-sm text-gray-500 font-medium mb-1">{label}</p>
                <h3 className="text-2xl font-bold text-gray-900 tracking-tight">{value}</h3>
            </div>
            <div className={`p-3 rounded-lg ${colorClass}`}>
                <Icon className="w-5 h-5 text-white" />
            </div>
        </div>
    );

    return (
        <div className="space-y-6 animate-fade-in">
            {/* 1. KEY METRICS */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    label="Total Donasi Tahun Ini"
                    value={formatCurrency(stats?.totalPemasukan || 0)}
                    icon={Wallet}
                    colorClass="bg-emerald-500 shadow-emerald-200"
                />
                <StatCard
                    label="Saldo Semua Program"
                    value={formatCurrency(stats?.totalSaldoProgram || 0)}
                    icon={TrendingUp}
                    colorClass="bg-blue-500 shadow-blue-200"
                />
                <StatCard
                    label="Program Aktif"
                    value={programs.filter(p => p.is_active).length}
                    icon={Heart}
                    colorClass="bg-rose-500 shadow-rose-200"
                />
                <StatCard
                    label="Menunggu Verifikasi"
                    value={pending.length}
                    icon={Clock}
                    colorClass="bg-amber-500 shadow-amber-200"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* 2. LEFT COLUMN: Actions & Verification */}
                <div className="space-y-6 lg:col-span-2">
                    {/* Quick Actions */}
                    <div className="flex gap-3">
                        <Button
                            onClick={() => setShowInputDonasi(true)}
                            size="lg"
                            className="flex-1 bg-emerald-600 hover:bg-emerald-700 shadow-sm h-12 text-base"
                        >
                            <HandCoins className="w-5 h-5 mr-2" />
                            Input Donasi Manual
                        </Button>
                        <Button
                            onClick={() => setShowProgramForm(true)}
                            size="lg"
                            variant="outline"
                            className="flex-1 h-12 text-base border-gray-300 text-gray-700 hover:bg-gray-50"
                        >
                            <Plus className="w-5 h-5 mr-2" />
                            Tambah Program Baru
                        </Button>
                    </div>

                    {/* Verification Queue */}
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                        <div className="px-5 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                                <Clock className="w-4 h-4 text-amber-500" />
                                Butuh Verifikasi
                                {pending.length > 0 && (
                                    <span className="bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full text-xs font-bold">
                                        {pending.length}
                                    </span>
                                )}
                            </h3>
                        </div>
                        <div className="divide-y divide-gray-50">
                            {pending.length === 0 ? (
                                <div className="p-8 text-center text-gray-400 italic">
                                    Tidak ada donasi yang perlu diverifikasi saat ini.
                                </div>
                            ) : (
                                pending.slice(0, 5).map(item => (
                                    <div key={item.id} className="p-4 hover:bg-gray-50 transition-colors flex items-center justify-between gap-4">
                                        <div className="min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="font-medium text-gray-900">{item.nama}</span>
                                                <span className="text-xs text-gray-400">• {new Date(item.created_at).toLocaleDateString('id-ID')}</span>
                                            </div>
                                            <p className="text-sm text-gray-600 mb-1">
                                                <span className="font-mono font-medium text-emerald-700 bg-emerald-50 px-1.5 rounded">{formatCurrency(item.nominal)}</span>
                                                <span className="mx-1 text-gray-300">|</span>
                                                <span className="text-xs">{item.program_nama}</span>
                                            </p>
                                            {item.pesan_doa && (
                                                <p className="text-xs text-gray-500 italic truncate max-w-md">"{item.pesan_doa}"</p>
                                            )}
                                        </div>
                                        <div className="flex gap-2">
                                            <Button
                                                size="sm"
                                                onClick={() => mVerify.mutate(item.id)}
                                                disabled={mVerify.isPending}
                                                className="bg-emerald-600 hover:bg-emerald-700 h-8 px-3"
                                            >
                                                <CheckCircle className="w-3.5 h-3.5 mr-1" /> Terima
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                onClick={() => { if (confirm('Tolak donasi ini?')) mReject.mutate(item.id); }}
                                                disabled={mReject.isPending}
                                                className="text-red-600 hover:bg-red-50 hover:text-red-700 h-8 px-3"
                                            >
                                                <XCircle className="w-3.5 h-3.5" />
                                            </Button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                {/* 3. RIGHT COLUMN: Program Performance */}
                <div className="space-y-6">
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                        <div className="px-5 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                                <TrendingUp className="w-4 h-4 text-blue-500" />
                                Performa Program
                            </h3>
                        </div>
                        <div className="p-2 max-h-[500px] overflow-y-auto">
                            {programs.filter(p => p.is_active).map(p => {
                                const progress = p.target_amount > 0 ? Math.min((p.akun_kas_saldo || 0) / p.target_amount * 100, 100) : 0;
                                return (
                                    <div key={p.id} className="p-3 hover:bg-gray-50 rounded-lg transition-colors border border-transparent hover:border-gray-100">
                                        <div className="flex justify-between items-start mb-2">
                                            <h4 className="text-sm font-medium text-gray-900 line-clamp-1">{p.nama}</h4>
                                            <span className="text-xs font-mono font-medium text-gray-600 bg-gray-100 px-1.5 rounded ml-2">
                                                {Math.round(progress)}%
                                            </span>
                                        </div>
                                        <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden mb-2">
                                            <div className="bg-blue-500 h-full rounded-full transition-all" style={{ width: `${progress}%` }} />
                                        </div>
                                        <div className="flex justify-between text-xs text-gray-500">
                                            <span>{formatCurrency(p.akun_kas_saldo || 0)}</span>
                                            <span>Target: {formatCurrency(p.target_amount)}</span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    <div className="bg-emerald-900 rounded-xl p-5 text-white relative overflow-hidden">
                        <div className="relative z-10">
                            <h3 className="font-semibold text-lg mb-1">Butuh Bantuan?</h3>
                            <p className="text-emerald-100 text-sm mb-4">
                                Hubungi support jika mengalami kendala teknis pada modul donasi.
                            </p>
                            <Button size="sm" variant="secondary" className="bg-white text-emerald-900 hover:bg-emerald-50 border-0">
                                Hubungi IT Support
                            </Button>
                        </div>
                        <Heart className="absolute -bottom-4 -right-4 w-32 h-32 text-emerald-800 opacity-20 rotate-12" />
                    </div>
                </div>
            </div>

            {/* DIALOGS */}
            <Dialog open={showInputDonasi} onOpenChange={setShowInputDonasi}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Input Donasi Manual</DialogTitle>
                    </DialogHeader>
                    <DonasiInputForm onSuccess={() => setShowInputDonasi(false)} />
                </DialogContent>
            </Dialog>

            <ProgramFormDialog
                open={showProgramForm}
                onOpenChange={setShowProgramForm}
                editing={null}
                akunKasList={akunKasList}
            />
        </div>
    );
};
