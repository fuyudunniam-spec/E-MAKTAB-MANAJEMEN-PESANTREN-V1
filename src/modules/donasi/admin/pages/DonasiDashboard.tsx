import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import {
  Heart, Users, HandCoins, Wallet,
  TrendingUp, CheckCircle, XCircle, Globe,
  PhoneCall, ImageIcon, BadgeCheck, X, History, MessageCircle,
  ChevronDown, Send,
} from 'lucide-react';

import {
  DonasiTransparansiService,
} from '@/modules/donasi/services/donasi.service';
import { DnsSubmissionService, type DnsSubmission, DnsDoaAdminService, type DnsDoaPublik } from '@/modules/donasi/services/dns.service';
import { AkunKasService } from '@/modules/keuangan/services/akunKas.service';

// ================================================
// HELPERS
// ================================================

const formatCurrency = (val: number) => {
  try {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);
  } catch {
    return `Rp ${val}`;
  }
};

const formatDate = (d: string) =>
  new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });

// Normalize phone → WA link
const toWaLink = (noWa: string | null | undefined, message: string): string | null => {
  if (!noWa?.trim()) return null;
  const cleaned = noWa.replace(/[^0-9]/g, '');
  const normalized = cleaned.startsWith('0') ? '62' + cleaned.slice(1) : cleaned;
  return `https://wa.me/${normalized}?text=${encodeURIComponent(message)}`;
};

// Build WA thank-you message
const buildWaMessage = (nama: string, nominal: number) =>
  `Assalamu'alaikum ${nama},\n\nJazakumullah khairan katsiran atas amanah donasi sebesar ${formatCurrency(nominal)} yang telah kami terima.\n\nInsya Allah setiap rupiah benar-benar bermanfaat untuk para santri yatim Al-Bisri. Mohon doanya agar kami senantiasa amanah 🤲\n\n_Pesantren Al-Bisri_`;

// ================================================
// METRIC CARD
// ================================================

function MetricCard({ label, value, icon: Icon, colorClass, borderClass }: any) {
  return (
    <div className={`relative overflow-hidden rounded-2xl border bg-gradient-to-br from-white to-slate-50 p-5 shadow-sm transition hover:shadow-md ${borderClass || 'border-slate-200'}`}>
      <div className="flex justify-between items-start">
        <div className="text-[11px] tracking-widest text-slate-500 font-bold">{label.toUpperCase()}</div>
        {Icon && <Icon className={`w-5 h-5 ${colorClass ? colorClass.replace('bg-', 'text-').split(' ')[0] : 'text-slate-400'}`} />}
      </div>
      <div className="mt-3 text-2xl font-bold text-slate-900 tabular-nums tracking-tight">{value}</div>
      {colorClass && <div className={`absolute -right-6 -top-6 h-20 w-20 rounded-full blur-2xl opacity-40 ${colorClass}`} />}
    </div>
  );
}

// ================================================
// QUICK OFFLINE FORM
// ================================================

function QuickOfflineForm({ akunKasList, onSuccess }: { akunKasList: any[]; onSuccess: (result: any) => void }) {
  const [nama, setNama] = useState('');
  const [noWa, setNoWa] = useState('');
  const [nominal, setNominal] = useState('');
  const [catatan, setCatatan] = useState('');
  const [pesanDoa, setPesanDoa] = useState('');
  const [akunKasId, setAkunKasId] = useState('');
  const [tanggal, setTanggal] = useState(new Date().toISOString().slice(0, 10));
  const [expanded, setExpanded] = useState(false);

  const mOffline = useMutation({
    mutationFn: () => DnsSubmissionService.postOffline({
      nama: nama.trim(),
      no_wa: noWa.trim() || undefined,
      nominal: parseInt(nominal.replace(/\D/g, ''), 10),
      catatan: catatan.trim() || undefined,
      pesan_doa: pesanDoa.trim() || undefined,
      akun_kas_id: akunKasId || undefined,
      tanggal,
    }),
    onSuccess: (data) => {
      toast.success(`Donasi offline ${nama} dicatat!`);
      onSuccess(data);
      setNama(''); setNoWa(''); setNominal(''); setCatatan(''); setPesanDoa(''); setAkunKasId('');
      setTanggal(new Date().toISOString().slice(0, 10));
    },
    onError: (e: any) => toast.error(e?.message || 'Gagal mencatat donasi offline'),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const n = parseInt(nominal.replace(/\D/g, ''), 10);
    if (!nama.trim()) return toast.error('Nama harus diisi');
    if (!n || n < 1000) return toast.error('Nominal minimal Rp 1.000');
    mOffline.mutate();
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <button
        className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-slate-50 transition-colors"
        onClick={() => setExpanded(v => !v)}
      >
        <div className="flex items-center gap-2">
          <HandCoins className="w-4 h-4 text-emerald-600" />
          <span className="font-semibold text-slate-800 text-sm">Catat Donasi Offline / Tunai</span>
        </div>
        <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${expanded ? 'rotate-180' : ''}`} />
      </button>

      {expanded && (
        <form onSubmit={handleSubmit} className="px-5 pb-5 space-y-3 border-t border-slate-100 pt-4">
          <p className="text-xs text-slate-400">
            Jika No. WA sudah ada di database donatur, akan otomatis terhubung ke profil donatur yang sama.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-slate-600 mb-1 block">Nama *</label>
              <Input value={nama} onChange={e => setNama(e.target.value)} placeholder="Nama donatur" className="rounded-xl border-slate-200 h-9 text-sm" />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600 mb-1 block">No. WhatsApp</label>
              <Input value={noWa} onChange={e => setNoWa(e.target.value)} placeholder="08xx..." className="rounded-xl border-slate-200 h-9 text-sm" type="tel" />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600 mb-1 block">Nominal (Rp) *</label>
              <Input
                value={nominal}
                onChange={e => setNominal(e.target.value.replace(/\D/g, ''))}
                placeholder="500000"
                className="rounded-xl border-slate-200 h-9 text-sm font-mono"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600 mb-1 block">Tanggal</label>
              <Input type="date" value={tanggal} onChange={e => setTanggal(e.target.value)} className="rounded-xl border-slate-200 h-9 text-sm" />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600 mb-1 block">Akun Kas</label>
              <select value={akunKasId} onChange={e => setAkunKasId(e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-3 h-9 text-sm text-slate-700 outline-none focus:border-emerald-400 bg-white">
                <option value="">Default (rekening aktif)</option>
                {akunKasList.map((ak: any) => (
                  <option key={ak.id} value={ak.id}>{ak.nama}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600 mb-1 block">Catatan</label>
              <Input value={catatan} onChange={e => setCatatan(e.target.value)} placeholder="Keterangan (opsional)" className="rounded-xl border-slate-200 h-9 text-sm" />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-slate-600 mb-1 block">Doa / Hajat (ditampilkan di website)</label>
            <textarea
              value={pesanDoa}
              onChange={e => setPesanDoa(e.target.value)}
              placeholder="Mohon doakan santri yatim agar istiqamah..."
              className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-700 outline-none focus:border-emerald-400 bg-white resize-none h-20"
            />
          </div>
          <div className="flex justify-end pt-1">
            <Button
              type="submit" disabled={mOffline.isPending}
              className="bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl h-9 px-6 text-sm"
            >
              {mOffline.isPending ? 'Menyimpan...' : <><Send className="w-3.5 h-3.5 mr-1.5" />Catat Donasi</>}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}

// ================================================
// HISTORY TABLE
// ================================================

function HistoryTable() {
  const qc = useQueryClient();
  const { data: history = [], isLoading } = useQuery({
    queryKey: ['dnsHistory'],
    queryFn: () => DnsSubmissionService.getHistory(30),
    staleTime: 30_000,
  });

  const mDelete = useMutation({
    mutationFn: (id: string) => DnsSubmissionService.deleteSubmission(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['dnsHistory'] });
      qc.invalidateQueries({ queryKey: ['dnsSubmissions'] });
      toast.success('Data donasi dihapus');
    },
    onError: () => toast.error('Gagal menghapus data'),
  });

  if (isLoading) return <div className="text-center py-8 text-slate-400 text-sm">Memuat riwayat...</div>;
  if (history.length === 0) return (
    <div className="text-center py-10">
      <History className="w-8 h-8 text-slate-200 mx-auto mb-2" />
      <p className="text-slate-400 text-sm">Belum ada riwayat donasi.</p>
    </div>
  );

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-100">
            <th className="text-left text-[10px] uppercase tracking-widest text-slate-400 font-bold pb-3 pr-4 pl-5">Donatur</th>
            <th className="text-left text-[10px] uppercase tracking-widest text-slate-400 font-bold pb-3 pr-4">Nominal</th>
            <th className="text-left text-[10px] uppercase tracking-widest text-slate-400 font-bold pb-3 pr-4">Status</th>
            <th className="text-left text-[10px] uppercase tracking-widest text-slate-400 font-bold pb-3 pr-4">Tanggal</th>
            <th className="text-left text-[10px] uppercase tracking-widest text-slate-400 font-bold pb-3">Aksi</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {history.map(item => {
            const waLink = toWaLink(item.no_wa, buildWaMessage(item.nama, item.nominal));
            return (
              <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                <td className="py-3 pr-4 pl-5">
                  <div className="font-medium text-slate-800">{item.is_anonim ? 'Hamba Allah' : item.nama}</div>
                  {item.no_wa && <div className="text-xs text-slate-400">{item.no_wa}</div>}
                </td>
                <td className="py-3 pr-4">
                  <span className="font-mono font-bold text-emerald-700">{formatCurrency(item.nominal)}</span>
                </td>
                <td className="py-3 pr-4">
                  {item.status === 'verified'
                    ? <span className="inline-flex items-center gap-1 text-xs bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full border border-emerald-100"><CheckCircle className="w-3 h-3" />Verified</span>
                    : <span className="inline-flex items-center gap-1 text-xs bg-red-50 text-red-600 px-2 py-0.5 rounded-full border border-red-100"><XCircle className="w-3 h-3" />Ditolak</span>
                  }
                </td>
                <td className="py-3 pr-4 text-xs text-slate-500">{formatDate(item.updated_at)}</td>
                <td className="py-3">
                  <div className="flex items-center gap-1">
                    {waLink && (
                      <a
                        href={waLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-emerald-600 hover:text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-2 py-1 rounded-lg transition-colors"
                      >
                        <MessageCircle className="w-3 h-3" /> WA
                      </a>
                    )}
                    <button
                      onClick={() => { if (confirm(`Hapus data donasi "${item.nama}"?`)) mDelete.mutate(item.id); }}
                      className="inline-flex items-center gap-1 text-xs text-red-500 hover:text-red-700 hover:bg-red-50 px-2 py-1 rounded-lg transition-colors"
                      title="Hapus"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ================================================
// MODERASI DOA TABLE
// ================================================

function ModerasiDoaTable() {
  const qc = useQueryClient();
  const { data: doas = [], isLoading } = useQuery({
    queryKey: ['dnsDoaPending'],
    queryFn: () => DnsDoaAdminService.getAll('pending'),
    staleTime: 30_000,
  });

  const mApprove = useMutation({
    mutationFn: (id: string) => DnsDoaAdminService.approve(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['dnsDoaPending'] });
      qc.invalidateQueries({ queryKey: ['dns_social_proof'] });
      toast.success('Doa disetujui untuk tampil di website');
    },
    onError: () => toast.error('Gagal menyetujui doa'),
  });

  const mReject = useMutation({
    mutationFn: (id: string) => DnsDoaAdminService.reject(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['dnsDoaPending'] });
      toast.success('Doa ditolak');
    },
    onError: () => toast.error('Gagal menolak doa'),
  });

  if (isLoading) return <div className="text-center py-8 text-slate-400 text-sm">Memuat doa...</div>;
  if (doas.length === 0) return (
    <div className="text-center py-10">
      <MessageCircle className="w-8 h-8 text-slate-200 mx-auto mb-2" />
      <p className="text-slate-400 text-sm">Tidak ada doa yang menunggu moderasi.</p>
    </div>
  );

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-100">
            <th className="text-left text-[10px] uppercase tracking-widest text-slate-400 font-bold pb-3 pr-4 pl-5">Pengirim</th>
            <th className="text-left text-[10px] uppercase tracking-widest text-slate-400 font-bold pb-3 pr-4">Pesan Doa / Hajat</th>
            <th className="text-left text-[10px] uppercase tracking-widest text-slate-400 font-bold pb-3 pr-4">Tanggal</th>
            <th className="text-left text-[10px] uppercase tracking-widest text-slate-400 font-bold pb-3">Aksi</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {doas.map(item => (
            <tr key={item.id} className="hover:bg-slate-50 transition-colors">
              <td className="py-4 pr-4 pl-5 align-top">
                <div className="font-medium text-slate-800">{item.is_anonim ? 'Hamba Allah' : item.nama}</div>
                {item.no_wa && <div className="text-xs text-slate-400">{item.no_wa}</div>}
              </td>
              <td className="py-4 pr-4 align-top">
                <p className="text-slate-600 leading-relaxed max-w-md italic">"{item.pesan_doa}"</p>
              </td>
              <td className="py-4 pr-4 align-top text-xs text-slate-500">{formatDate(item.created_at)}</td>
              <td className="py-4 align-top">
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    onClick={() => mApprove.mutate(item.id)}
                    disabled={mApprove.isPending}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg h-8 text-xs px-3"
                  >
                    Setujui
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => { if (confirm('Tolak doa ini?')) mReject.mutate(item.id); }}
                    disabled={mReject.isPending}
                    className="border-slate-200 text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg h-8 text-xs px-3"
                  >
                    Tolak
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ================================================
// MAIN DASHBOARD
// ================================================

const DonasiDashboard: React.FC = () => {
  const navigate = useNavigate();
  const qc = useQueryClient();

  // State
  const [previewBukti, setPreviewBukti] = useState<string | null>(null);
  const [verifyingId, setVerifyingId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'pending' | 'riwayat' | 'doa'>('pending');

  // Queries
  const { data: stats } = useQuery({
    queryKey: ['donasiTransparansi', new Date().getFullYear()],
    queryFn: () => DonasiTransparansiService.getData(new Date().getFullYear()),
  });

  const { data: dnsSubmissions = [], isLoading: isDnsLoading } = useQuery({
    queryKey: ['dnsSubmissions', 'pending'],
    queryFn: () => DnsSubmissionService.getAll('pending'),
    refetchInterval: 30_000,
  });



  const { data: akunKasList = [] } = useQuery({
    queryKey: ['akunKasAll'],
    queryFn: AkunKasService.getAllActive,
  });

  const { data: pendingDoas = [] } = useQuery({
    queryKey: ['dnsDoaPendingCount'],
    queryFn: () => DnsDoaAdminService.getAll('pending'),
    refetchInterval: 30_000,
  });

  // DNS Mutations
  const mVerifyDns = useMutation({
    mutationFn: ({ id, akunKasId }: { id: string; akunKasId?: string }) =>
      DnsSubmissionService.verify(id, akunKasId),
    onSuccess: (result) => {
      qc.invalidateQueries({ queryKey: ['dnsSubmissions'] });
      qc.invalidateQueries({ queryKey: ['dnsHistory'] });
      qc.invalidateQueries({ queryKey: ['donasiTransparansi'] });
      setVerifyingId(null);

      // WA Thank-you toast
      const waLink = toWaLink(result.no_wa, buildWaMessage(result.nama, result.nominal));
      if (waLink) {
        toast.success(
          <div className="flex flex-col gap-2">
            <span className="font-semibold">✅ Donasi diverifikasi!</span>
            <a href={waLink} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 bg-emerald-600 text-white text-xs px-3 py-1.5 rounded-lg w-fit hover:bg-emerald-700 transition-colors">
              <MessageCircle className="w-3.5 h-3.5" /> Kirim Ucapan Terima Kasih ke {result.nama}
            </a>
          </div>,
          { duration: 8000 }
        );
      } else {
        toast.success('Donasi online diverifikasi & diposting ke keuangan');
      }
    },
    onError: (e: any) => toast.error(e.message || 'Gagal memverifikasi'),
  });

  const mRejectDns = useMutation({
    mutationFn: ({ id, catatan }: { id: string; catatan?: string }) =>
      DnsSubmissionService.reject(id, catatan),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['dnsSubmissions'] });
      qc.invalidateQueries({ queryKey: ['dnsHistory'] });
      toast.success('Donasi online ditolak');
    },
    onError: () => toast.error('Gagal menolak submission'),
  });



  const handleOfflineSuccess = (result: any) => {
    qc.invalidateQueries({ queryKey: ['dnsHistory'] });
    qc.invalidateQueries({ queryKey: ['donasiTransparansi'] });
    const waLink = toWaLink(result.no_wa, buildWaMessage(result.nama, result.nominal));
    if (waLink) {
      toast.success(
        <div className="flex flex-col gap-2">
          <span className="font-semibold">✅ Donasi offline dicatat!</span>
          <a href={waLink} target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 bg-emerald-600 text-white text-xs px-3 py-1.5 rounded-lg w-fit hover:bg-emerald-700 transition-colors">
            <MessageCircle className="w-3.5 h-3.5" /> Kirim Nota ke {result.nama}
          </a>
        </div>,
        { duration: 8000 }
      );
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/50">
      <div className="mx-auto max-w-7xl px-6 py-10 space-y-10">

        {/* 1. HEADER */}
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 font-heading">Manajemen Donasi</h1>
            <p className="mt-2 text-sm text-slate-600">Dashboard operasional dan kontrol program donasi.</p>
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
          </div>
        </div>

        {/* 2. METRICS */}
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard label="Total Donasi (Tahun Ini)" value={formatCurrency(stats?.totalPemasukan || 0)} icon={Wallet} colorClass="bg-emerald-500" borderClass="border-emerald-100" />
          <MetricCard label="Total Penyaluran" value={formatCurrency(stats?.totalPengeluaran || 0)} icon={TrendingUp} colorClass="bg-blue-500" borderClass="border-blue-100" />
          <MetricCard label="Total Donatur" value="—" icon={Users} colorClass="bg-rose-500" borderClass="border-rose-100" />
          <MetricCard
            label="Donasi Online Pending"
            value={dnsSubmissions.length}
            icon={Globe}
            colorClass={dnsSubmissions.length > 0 ? 'bg-amber-500' : 'bg-slate-300'}
            borderClass={dnsSubmissions.length > 0 ? 'border-amber-100' : 'border-slate-200'}
          />
        </div>

        <div className="space-y-10">

          {/* VERIFICATION + HISTORY + OFFLINE */}
          <div className="space-y-10">

            {/* A. DONASI ONLINE — Tabs: Pending | Riwayat */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Globe className="w-5 h-5 text-blue-600" />
                  Donasi Online
                  {dnsSubmissions.length > 0 && (
                    <span className="bg-amber-100 text-amber-800 text-xs font-bold px-2.5 py-0.5 rounded-full">
                      {dnsSubmissions.length} PENDING
                    </span>
                  )}
                </h2>
              </div>

              {/* Tab bar */}
              <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-fit">
                {(['pending', 'riwayat', 'doa'] as const).map(tab => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-colors capitalize flex items-center gap-2 ${activeTab === tab ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
                  >
                    {tab === 'pending' ? 'Pending' : tab === 'riwayat' ? 'Riwayat' : 'Moderasi Doa'}
                    {tab === 'doa' && pendingDoas.length > 0 && (
                      <span className="bg-blue-100 text-blue-700 text-[9px] px-1.5 py-0.5 rounded-full">
                        {pendingDoas.length}
                      </span>
                    )}
                  </button>
                ))}
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                {activeTab === 'pending' ? (
                  isDnsLoading ? (
                    <div className="p-8 text-center text-slate-400 text-sm">Memuat data...</div>
                  ) : dnsSubmissions.length === 0 ? (
                    <div className="p-10 text-center">
                      <BadgeCheck className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                      <p className="text-slate-400 text-sm">Tidak ada donasi online yang menunggu verifikasi.</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-100">
                      {dnsSubmissions.map((item: DnsSubmission) => (
                        <div key={item.id} className="p-5 hover:bg-slate-50 transition-colors">
                          <div className="flex flex-col sm:flex-row gap-4">
                            {/* Bukti Transfer */}
                            {item.bukti_transfer_url ? (
                              <button
                                onClick={() => setPreviewBukti(item.bukti_transfer_url)}
                                className="w-16 h-16 rounded-xl overflow-hidden border border-slate-200 flex-shrink-0 hover:ring-2 hover:ring-blue-300 transition-all"
                              >
                                <img src={item.bukti_transfer_url} alt="Bukti" className="w-full h-full object-cover" />
                              </button>
                            ) : (
                              <div className="w-16 h-16 rounded-xl bg-slate-100 flex items-center justify-center flex-shrink-0">
                                <ImageIcon className="w-6 h-6 text-slate-300" />
                              </div>
                            )}

                            {/* Info */}
                            <div className="flex-1 min-w-0">
                              <div className="flex flex-wrap items-center gap-2 mb-1">
                                <span className="font-semibold text-slate-900">{item.is_anonim ? 'Hamba Allah' : item.nama}</span>
                                {item.is_anonim && <span className="text-xs bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded">Anonim</span>}
                                <span className="text-xs text-slate-400">• {formatDate(item.created_at)}</span>
                              </div>
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-mono font-bold text-emerald-700 text-sm">{formatCurrency(item.nominal)}</span>
                                {item.no_wa && (
                                  <a
                                    href={`https://wa.me/62${item.no_wa.replace(/^0/, '').replace(/\D/g, '')}?text=${encodeURIComponent(`Halo ${item.nama}, kami ingin mengkonfirmasi donasi Anda sebesar ${formatCurrency(item.nominal)}.`)}`}
                                    target="_blank" rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 text-xs text-emerald-600 hover:text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full transition-colors"
                                  >
                                    <PhoneCall className="w-3 h-3" /> {item.no_wa}
                                  </a>
                                )}
                              </div>
                              {item.pesan_doa && (
                                <p className="text-xs text-slate-500 italic line-clamp-2">"{item.pesan_doa}"</p>
                              )}
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
                              {verifyingId === item.id ? (
                                <div className="flex flex-col gap-2">
                                  <select
                                    id={`akun-${item.id}`}
                                    className="text-xs border border-slate-200 rounded-lg px-2 py-1.5 text-slate-700 outline-none focus:border-blue-400"
                                    defaultValue=""
                                  >
                                    <option value="">Default akun kas</option>
                                    {akunKasList.map((ak: any) => (
                                      <option key={ak.id} value={ak.id}>{ak.nama}</option>
                                    ))}
                                  </select>
                                  <div className="flex gap-2">
                                    <Button
                                      size="sm"
                                      className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg h-8 text-xs flex-1"
                                      disabled={mVerifyDns.isPending}
                                      onClick={() => {
                                        const sel = document.getElementById(`akun-${item.id}`) as HTMLSelectElement;
                                        mVerifyDns.mutate({ id: item.id, akunKasId: sel?.value || undefined });
                                      }}
                                    >
                                      {mVerifyDns.isPending ? '...' : 'Konfirmasi'}
                                    </Button>
                                    <Button size="sm" variant="ghost" className="h-8 text-xs" onClick={() => setVerifyingId(null)}>
                                      <X className="w-3 h-3" />
                                    </Button>
                                  </div>
                                </div>
                              ) : (
                                <>
                                  <Button
                                    size="sm"
                                    onClick={() => setVerifyingId(item.id)}
                                    className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg h-9"
                                  >
                                    Verifikasi
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => { if (confirm('Tolak donasi online ini?')) mRejectDns.mutate({ id: item.id }); }}
                                    disabled={mRejectDns.isPending}
                                    className="border-slate-200 text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg h-9"
                                  >
                                    Tolak
                                  </Button>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )
                ) : activeTab === 'riwayat' ? (
                  <HistoryTable />
                ) : (
                  <ModerasiDoaTable />
                )}
              </div>
            </div>

            {/* B. DONASI OFFLINE (QUICK INPUT) */}
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <HandCoins className="w-5 h-5 text-slate-600" />
                Input Donasi Offline
              </h2>
              <QuickOfflineForm akunKasList={akunKasList} onSuccess={handleOfflineSuccess} />
            </div>

          </div>

        </div>
      </div>



      {/* Bukti Transfer Preview */}
      {previewBukti && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setPreviewBukti(null)}
        >
          <div className="relative max-w-2xl w-full" onClick={e => e.stopPropagation()}>
            <button
              className="absolute -top-10 right-0 text-white/70 hover:text-white text-sm flex items-center gap-1"
              onClick={() => setPreviewBukti(null)}
            >
              <X className="w-4 h-4" /> Tutup
            </button>
            <img src={previewBukti} alt="Bukti Transfer" className="w-full rounded-2xl shadow-2xl object-contain max-h-[80vh]" />
          </div>
        </div>
      )}
    </div>
  );
};

export default DonasiDashboard;
