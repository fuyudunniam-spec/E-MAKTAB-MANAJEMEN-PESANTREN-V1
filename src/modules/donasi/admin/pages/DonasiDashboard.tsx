import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Progress } from "@/components/ui/progress";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { toast } from 'sonner';
import {
  Heart, Plus, Trash2, Pencil, Eye, EyeOff, Users,
  HandCoins, Wallet, Search, TrendingUp, CheckCircle,
  XCircle, Clock, MoreHorizontal, Receipt, History
} from 'lucide-react';

import {
  ProgramDonasiService,
  DoaHajatService,
  DonasiTransparansiService,
  type ProgramDonasi,
  type DoaHajat
} from '@/modules/donasi/services/donasi.service';
import { AkunKasService } from '@/modules/keuangan/services/akunKas.service';
import { ProgramFormDialog } from '../components/ProgramFormDialog';
import { DonasiInputForm } from '../components/DonasiInputForm';

// ============================================
// HELPERS
// ============================================

const formatCurrency = (val: number) => {
  try {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);
  } catch {
    return `Rp ${val}`;
  }
};

const formatDate = (d: string) =>
  new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });

// ============================================
// COMPONENTS
// ============================================

function MetricCard({ label, value, icon: Icon, colorClass, borderClass }: any) {
  return (
    <div className={`relative overflow-hidden rounded-2xl border bg-gradient-to-br from-white to-slate-50 p-5 shadow-sm transition hover:shadow-md ${borderClass || 'border-slate-200'}`}>
      <div className="flex justify-between items-start">
        <div className="text-[11px] tracking-widest text-slate-500 font-bold">
          {label.toUpperCase()}
        </div>
        {Icon && <Icon className={`w-5 h-5 ${colorClass ? colorClass.replace('bg-', 'text-').split(' ')[0] : 'text-slate-400'}`} />}
      </div>
      <div className="mt-3 text-2xl font-bold text-slate-900 tabular-nums tracking-tight">
        {value}
      </div>
      {colorClass && (
        <div className={`absolute -right-6 -top-6 h-20 w-20 rounded-full blur-2xl opacity-40 ${colorClass}`} />
      )}
    </div>
  );
}

// ============================================
// MAIN DASHBOARD
// ============================================

const DonasiDashboard: React.FC = () => {
  const navigate = useNavigate();
  const qc = useQueryClient();

  // State
  const [qProgram, setQProgram] = useState('');
  const [qDoa, setQDoa] = useState('');
  const [showInputDonasi, setShowInputDonasi] = useState(false);
  const [showProgramForm, setShowProgramForm] = useState(false);
  const [editingProgram, setEditingProgram] = useState<ProgramDonasi | null>(null);
  const [viewAllDoa, setViewAllDoa] = useState(false);

  // Queries
  const { data: stats } = useQuery({
    queryKey: ['donasiTransparansi', new Date().getFullYear()],
    queryFn: () => DonasiTransparansiService.getData(new Date().getFullYear()),
  });

  const { data: programs = [], isLoading: isLoadingPrograms } = useQuery({
    queryKey: ['programDonasi'],
    queryFn: ProgramDonasiService.getAll,
  });

  const { data: pendingDoa = [] } = useQuery({
    queryKey: ['donasiPending'],
    queryFn: DoaHajatService.getPending,
  });

  const { data: allDoa = [] } = useQuery({
    queryKey: ['doaHajatAdmin'],
    queryFn: DoaHajatService.getAll,
    enabled: viewAllDoa,
  });

  const { data: akunKasList = [] } = useQuery({
    queryKey: ['akunKasAll'],
    queryFn: AkunKasService.getAllActive,
  });

  // Mutations
  const mDeleteProgram = useMutation({
    mutationFn: ProgramDonasiService.delete,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['programDonasi'] }); toast.success('Program dihapus'); },
    onError: () => toast.error('Gagal menghapus program'),
  });

  const mVerifyDoa = useMutation({
    mutationFn: DoaHajatService.verify,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['donasiPending'] });
      qc.invalidateQueries({ queryKey: ['donasiTransparansi'] });
      qc.invalidateQueries({ queryKey: ['doaHajatAdmin'] });
      toast.success('Donasi diverifikasi');
    },
    onError: (e: any) => toast.error(e.message || 'Gagal memverifikasi'),
  });

  const mRejectDoa = useMutation({
    mutationFn: DoaHajatService.reject,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['donasiPending'] });
      qc.invalidateQueries({ queryKey: ['doaHajatAdmin'] });
      toast.success('Donasi ditolak');
    },
  });

  const mToggleDoa = useMutation({
    mutationFn: ({ id, visible }: { id: string; visible: boolean }) => DoaHajatService.toggleVisibility(id, visible),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['doaHajatAdmin'] }); toast.success('Status diperbarui'); },
  });

  // Handlers
  const handleEditProgram = (p: ProgramDonasi) => { setEditingProgram(p); setShowProgramForm(true); };
  const handleAddProgram = () => { setEditingProgram(null); setShowProgramForm(true); };

  // Filtering
  const filteredPrograms = useMemo(
    () => programs.filter(p => p.nama.toLowerCase().includes(qProgram.toLowerCase())),
    [programs, qProgram]
  );

  const displayedDoa = viewAllDoa
    ? allDoa.filter(d => d.nama.toLowerCase().includes(qDoa.toLowerCase()) || d.pesan_doa.toLowerCase().includes(qDoa.toLowerCase()))
    : pendingDoa;

  return (
    <div className="min-h-screen bg-slate-50/50">
      <div className="mx-auto max-w-7xl px-6 py-10 space-y-10">

        {/* 1. HEADER */}
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 font-heading">
              Manajemen Donasi
            </h1>
            <p className="mt-2 text-sm text-slate-600">
              Dashboard operasional dan kontrol program donasi.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              className="rounded-xl border-slate-300 bg-white shadow-sm hover:bg-slate-50 h-10"
              onClick={() => navigate('/pms/donasi/master-donatur')}
            >
              <Users className="w-4 h-4 mr-2 text-slate-500" />
              Daftar Donatur
            </Button>

            <Button
              onClick={() => setShowInputDonasi(true)}
              className="rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white shadow-emerald-200 shadow-md h-10 px-5"
            >
              <Receipt className="mr-2 h-4 w-4" />
              Input Donasi
            </Button>
          </div>
        </div>

        {/* 2. METRICS */}
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            label="Total Donasi (Tahun Ini)"
            value={formatCurrency(stats?.totalPemasukan || 0)}
            icon={Wallet}
            colorClass="bg-emerald-500"
            borderClass="border-emerald-100"
          />
          <MetricCard
            label="Saldo Semua Program"
            value={formatCurrency(stats?.totalSaldoProgram || 0)}
            icon={TrendingUp}
            colorClass="bg-blue-500"
            borderClass="border-blue-100"
          />
          <MetricCard
            label="Program Aktif"
            value={programs.filter(p => p.is_active).length}
            icon={Heart}
            colorClass="bg-rose-500"
            borderClass="border-rose-100"
          />
          <MetricCard
            label="Menunggu Verifikasi"
            value={pendingDoa.length}
            icon={Clock}
            colorClass="bg-amber-500"
            borderClass="border-amber-100"
          />
        </div>

        <div className="grid gap-10 lg:grid-cols-12 items-start">
          {/* 3. LEFT COL: VERIFICATION & DOA (8 cols) */}
          <div className="lg:col-span-8 space-y-8">

            {/* A. VERIFICATION SECTION */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-emerald-600" />
                    Verifikasi Donasi
                  </h2>
                  {pendingDoa.length > 0 && (
                    <span className="bg-amber-100 text-amber-800 text-xs font-bold px-2.5 py-0.5 rounded-full">
                      {pendingDoa.length} BARU
                    </span>
                  )}
                </div>
                {viewAllDoa && (
                  <div className="relative w-64">
                    <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <Input
                      value={qDoa}
                      onChange={(e) => setQDoa(e.target.value)}
                      placeholder="Cari donatur/doa..."
                      className="rounded-xl border-slate-200 pl-9 h-9 text-sm"
                    />
                  </div>
                )}
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="divide-y divide-slate-100">
                  {displayedDoa.length === 0 ? (
                    <div className="p-12 text-center">
                      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-50 mb-4">
                        <CheckCircle className="w-8 h-8 text-slate-300" />
                      </div>
                      <p className="text-slate-500 font-medium">
                        {viewAllDoa ? 'Tidak ada data doa ditemukan.' : 'Tidak ada donasi yang perlu diverifikasi.'}
                      </p>
                    </div>
                  ) : (
                    displayedDoa.map((item) => (
                      <div key={item.id} className="p-5 hover:bg-slate-50 transition-colors flex flex-col sm:flex-row gap-4 sm:items-center justify-between group">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold text-slate-900">{item.nama}</span>
                            <span className="text-xs text-slate-400">• {formatDate(item.created_at)}</span>
                            {item.status === 'verified' && <span className="text-xs bg-emerald-50 text-emerald-600 px-1.5 py-0.5 rounded border border-emerald-100">Verified</span>}
                            {item.status === 'rejected' && <span className="text-xs bg-red-50 text-red-600 px-1.5 py-0.5 rounded border border-red-100">Rejected</span>}
                          </div>
                          <div className="flex items-center gap-2 text-sm text-slate-600 mb-1">
                            <span className="font-mono font-bold text-emerald-700">{formatCurrency(item.nominal)}</span>
                            <span className="text-slate-300">|</span>
                            <span>{item.program_nama}</span>
                          </div>
                          {item.pesan_doa && (
                            <p className="text-sm text-slate-500 italic line-clamp-2">"{item.pesan_doa}"</p>
                          )}
                        </div>

                        <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
                          {item.status === 'pending' ? (
                            <>
                              <Button
                                size="sm"
                                onClick={() => mVerifyDoa.mutate(item.id)}
                                disabled={mVerifyDoa.isPending}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg h-9"
                              >
                                {mVerifyDoa.isPending ? '...' : 'Terima'}
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => { if (confirm('Tolak donasi ini?')) mRejectDoa.mutate(item.id); }}
                                disabled={mRejectDoa.isPending}
                                className="border-slate-200 text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg h-9"
                              >
                                Tolak
                              </Button>
                            </>
                          ) : (
                            <div className="flex items-center gap-2">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => mToggleDoa.mutate({ id: item.id, visible: !item.is_visible })}
                                className={`rounded-lg h-8 px-2.5 ${item.is_visible ? 'text-emerald-600 bg-emerald-50 hover:bg-emerald-100' : 'text-slate-400 bg-slate-100 hover:bg-slate-200'}`}
                                title={item.is_visible ? 'Sembunyikan dari publik' : 'Tampilkan ke publik'}
                              >
                                {item.is_visible ? <Eye className="w-4 h-4 mr-1.5" /> : <EyeOff className="w-4 h-4 mr-1.5" />}
                                {item.is_visible ? 'Tampil' : 'Tersembunyi'}
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
                {/* Footer to toggle view */}
                <div className="bg-slate-50 px-5 py-3 border-t border-slate-100 flex justify-center">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setViewAllDoa(!viewAllDoa)}
                    className="text-slate-500 hover:text-slate-800 text-xs uppercase tracking-wider font-semibold"
                  >
                    {viewAllDoa ? 'Tampilkan Hanya Yang Pending' : 'Lihat Semua Riwayat Donasi & Doa'} <History className="w-3.5 h-3.5 ml-2" />
                  </Button>
                </div>
              </div>
            </div>

          </div>

          {/* 4. RIGHT COL: PROGRAMS (4 cols) */}
          <div className="lg:col-span-4 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900">
                Program Aktif
              </h2>
              <Button size="sm" variant="secondary" onClick={handleAddProgram} className="rounded-xl bg-white border border-slate-200 shadow-sm hover:bg-slate-50 text-slate-700">
                <Plus className="mr-1.5 h-3.5 w-3.5" />
                Tambah
              </Button>
            </div>

            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                value={qProgram}
                onChange={(e) => setQProgram(e.target.value)}
                placeholder="Cari program..."
                className="rounded-xl border-slate-200 pl-9 bg-white"
              />
            </div>

            <div className="space-y-4">
              {isLoadingPrograms ? (
                [1, 2, 3].map(i => <div key={i} className="h-24 bg-white rounded-2xl animate-pulse" />)
              ) : filteredPrograms.length === 0 ? (
                <div className="text-center py-8 text-slate-400 italic text-sm border-2 border-dashed border-slate-200 rounded-2xl">
                  Tidak ada program ditemukan.
                </div>
              ) : (
                filteredPrograms.map((p) => {
                  const progress = p.target_amount > 0 ? Math.min((p.akun_kas_saldo || 0) / p.target_amount * 100, 100) : 0;
                  return (
                    <div
                      key={p.id}
                      className="group relative rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:shadow-md hover:border-emerald-100"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="pr-6">
                          <h3 className="text-sm font-semibold text-slate-900 leading-tight mb-1">{p.nama}</h3>
                          <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400">
                            {p.is_active ? <span className="text-emerald-600">AKTIF</span> : 'NON-AKTIF'}
                          </p>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 -mr-2 text-slate-400 hover:text-slate-600 absolute top-4 right-4">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="rounded-xl">
                            <DropdownMenuItem onClick={() => handleEditProgram(p)}>
                              <Pencil className="w-3.5 h-3.5 mr-2" /> Edit Program
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => { if (confirm(`Hapus program "${p.nama}"?`)) mDeleteProgram.mutate(p.id); }} className="text-red-600 focus:text-red-700 focus:bg-red-50">
                              <Trash2 className="w-3.5 h-3.5 mr-2" /> Hapus Program
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>

                      <div className="mt-4 space-y-2">
                        <div className="flex justify-between text-xs text-slate-500 tabular-nums">
                          <span>{formatCurrency(p.akun_kas_saldo || 0)}</span>
                          <span>{formatCurrency(p.target_amount)}</span>
                        </div>
                        <Progress value={progress} className="h-2 rounded-full bg-slate-100" indicatorClassName="bg-emerald-500" />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>

      {/* DIALOGS */}
      <Dialog open={showInputDonasi} onOpenChange={setShowInputDonasi}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle>Input Donasi Manual</DialogTitle>
          </DialogHeader>
          <DonasiInputForm onSuccess={() => setShowInputDonasi(false)} defaultProgramId={programs.find(p => p.is_active)?.id} />
        </DialogContent>
      </Dialog>

      <ProgramFormDialog
        open={showProgramForm}
        onOpenChange={setShowProgramForm}
        editing={editingProgram}
        akunKasList={akunKasList}
      />
    </div>
  );
};

export default DonasiDashboard;
