import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '@/components/ui/dialog';
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
    Users,
    Search,
    Filter,
    CheckCircle,
    XCircle,
    Clock,
    Eye,
    FileText,
    User,
    MapPin,
    Smartphone,
    MoreHorizontal,
    Download,
    Check,
    X,
    Loader2,
    Calendar,
    Heart
} from 'lucide-react';
import { format } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

interface Applicant {
    id: string;
    id_santri: string;
    nama_lengkap: string;
    status_approval: 'pending' | 'disetujui' | 'ditolak';
    status_santri: string;
    kategori: string;
    status_sosial: string;
    created_at: string;
    no_whatsapp: string;
    tempat_lahir: string;
    tanggal_lahir: string;
    alamat: string;
    user_id: string;
    catatan_approval?: string;
}

export default function AdminPSB() {
    const [applicants, setApplicants] = useState<Applicant[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedApplicant, setSelectedApplicant] = useState<Applicant | null>(null);
    const [isDetailOpen, setIsDetailOpen] = useState(false);
    const [isApprovalDialogOpen, setIsApprovalDialogOpen] = useState(false);
    const [approvalType, setApprovalType] = useState<'approve' | 'reject'>('approve');
    const [approvalNote, setApprovalNote] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [waliData, setWaliData] = useState<any[]>([]);
    const [docsData, setDocsData] = useState<any[]>([]);
    const [stats, setStats] = useState({ total: 0, pending: 0, approved: 0, rejected: 0 });

    const { toast } = useToast();
    const { user: adminUser } = useAuth();

    useEffect(() => {
        fetchApplicants();
    }, []);

    const fetchApplicants = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('santri')
                .select('*')
                .eq('status_santri', 'Calon')
                .order('created_at', { ascending: false });

            if (error) throw error;

            const items = data || [];
            setApplicants(items);

            // Calculate stats
            const pending = items.filter(a => a.status_approval === 'pending').length;
            const approved = items.filter(a => a.status_approval === 'disetujui').length;
            const rejected = items.filter(a => a.status_approval === 'ditolak').length;

            setStats({ total: items.length, pending, approved, rejected });
        } catch (error: any) {
            console.error('Error fetching applicants:', error);
            toast({
                title: 'Error',
                description: 'Gagal mengambil data pendaftar: ' + error.message,
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    };

    const fetchApplicantDetails = async (applicantId: string) => {
        try {
            // Fetch Wali
            const { data: wali, error: waliError } = await supabase
                .from('santri_wali')
                .select('*')
                .eq('santri_id', applicantId);

            if (waliError) throw waliError;
            setWaliData(wali || []);

            // Fetch Documents
            const { data: docs, error: docsError } = await supabase
                .from('santri_dokumen')
                .select('*')
                .eq('santri_id', applicantId);

            if (docsError) throw docsError;
            setDocsData(docs || []);
        } catch (error: any) {
            console.error('Error fetching details:', error);
        }
    };

    const handleViewDetail = (applicant: Applicant) => {
        setSelectedApplicant(applicant);
        fetchApplicantDetails(applicant.id);
        setIsDetailOpen(true);
    };

    const handleOpenApproval = (type: 'approve' | 'reject') => {
        setApprovalType(type);
        setApprovalNote('');
        setIsApprovalDialogOpen(true);
    };

    const processApproval = async () => {
        if (!selectedApplicant) return;

        setIsSubmitting(true);
        try {
            const statusValue = approvalType === 'approve' ? 'disetujui' : 'ditolak';

            const updateData: any = {
                status_approval: statusValue,
                catatan_approval: approvalNote,
                updated_at: new Date().toISOString()
            };

            // If approved, maybe update status_santri to 'Aktif' if desired, 
            // but usually PSB stays 'Calon' until formal enrollment.
            // However, we'll follow user's "sinkron" request.

            const { error } = await supabase
                .from('santri')
                .update(updateData)
                .eq('id', selectedApplicant.id);

            if (error) throw error;

            toast({
                title: 'Berhasil',
                description: `Pendaftar telah ${approvalType === 'approve' ? 'disetujui' : 'ditolak'}.`,
            });

            setIsApprovalDialogOpen(false);
            setIsDetailOpen(false);
            fetchApplicants();
        } catch (error: any) {
            console.error('Error processing approval:', error);
            toast({
                title: 'Error',
                description: 'Gagal memproses approval: ' + error.message,
                variant: 'destructive',
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const filteredApplicants = applicants.filter(a =>
        a.nama_lengkap.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.id_santri?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'pending': return <Badge variant="outline" className="bg-amber-50 text-amber-600 border-amber-200">Pending</Badge>;
            case 'disetujui': return <Badge variant="outline" className="bg-green-50 text-green-600 border-green-200">Disetujui</Badge>;
            case 'ditolak': return <Badge variant="outline" className="bg-red-50 text-red-600 border-red-200">Ditolak</Badge>;
            default: return <Badge variant="outline">{status}</Badge>;
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Manajemen Pendaftaran (PSB)</h1>
                    <p className="text-muted-foreground text-sm">Kelola calon santri, verifikasi dokumen, dan proses kelulusan pendaftaran.</p>
                </div>
                <Button onClick={fetchApplicants} variant="outline" size="sm">
                    <Clock className="w-4 h-4 mr-2" /> Refresh Data
                </Button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="border-none shadow-sm bg-royal-50/50">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-royal-900/60 uppercase tracking-wider">Total Pendaftar</p>
                                <h3 className="text-2xl font-bold text-royal-950 mt-1">{stats.total}</h3>
                            </div>
                            <div className="w-12 h-12 rounded-2xl bg-royal-100 flex items-center justify-center">
                                <Users className="w-6 h-6 text-royal-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-none shadow-sm bg-amber-50/50">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-amber-900/60 uppercase tracking-wider">Menunggu</p>
                                <h3 className="text-2xl font-bold text-amber-950 mt-1">{stats.pending}</h3>
                            </div>
                            <div className="w-12 h-12 rounded-2xl bg-amber-100 flex items-center justify-center">
                                <Clock className="w-6 h-6 text-amber-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-none shadow-sm bg-green-50/50">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-green-900/60 uppercase tracking-wider">Disetujui</p>
                                <h3 className="text-2xl font-bold text-green-950 mt-1">{stats.approved}</h3>
                            </div>
                            <div className="w-12 h-12 rounded-2xl bg-green-100 flex items-center justify-center">
                                <CheckCircle className="w-6 h-6 text-green-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-none shadow-sm bg-red-50/50">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-red-900/60 uppercase tracking-wider">Ditolak</p>
                                <h3 className="text-2xl font-bold text-red-950 mt-1">{stats.rejected}</h3>
                            </div>
                            <div className="w-12 h-12 rounded-2xl bg-red-100 flex items-center justify-center">
                                <XCircle className="w-6 h-6 text-red-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card className="border-none shadow-xl">
                <CardHeader className="pb-3">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="relative flex-1 max-w-sm">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <Input
                                placeholder="Cari nama atau ID..."
                                className="pl-10 h-10 border-slate-200"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <Tabs defaultValue="pending" className="w-full md:w-auto">
                            <TabsList className="grid grid-cols-3 w-full md:w-[400px]">
                                <TabsTrigger value="pending">Pending</TabsTrigger>
                                <TabsTrigger value="disetujui">Diterima</TabsTrigger>
                                <TabsTrigger value="ditolak">Ditolak</TabsTrigger>
                            </TabsList>
                        </Tabs>
                    </div>
                </CardHeader>
                <CardContent>
                    <Tabs defaultValue="pending" className="w-full">
                        <TabsContent value="pending" className="mt-0">
                            <ApplicantTable applicants={filteredApplicants.filter(a => a.status_approval === 'pending')} onView={handleViewDetail} loading={loading} />
                        </TabsContent>
                        <TabsContent value="disetujui" className="mt-0">
                            <ApplicantTable applicants={filteredApplicants.filter(a => a.status_approval === 'disetujui')} onView={handleViewDetail} loading={loading} />
                        </TabsContent>
                        <TabsContent value="ditolak" className="mt-0">
                            <ApplicantTable applicants={filteredApplicants.filter(a => a.status_approval === 'ditolak')} onView={handleViewDetail} loading={loading} />
                        </TabsContent>
                    </Tabs>
                </CardContent>
            </Card>

            {/* DETAIL DIALOG */}
            <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col p-0">
                    <DialogHeader className="p-6 pb-2">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <Avatar className="w-16 h-16 border-2 border-royal-100">
                                    <AvatarFallback className="bg-royal-50 text-royal-600 text-xl font-bold">
                                        {selectedApplicant?.nama_lengkap.substring(0, 2).toUpperCase()}
                                    </AvatarFallback>
                                </Avatar>
                                <div>
                                    <DialogTitle className="text-2xl font-bold text-royal-950">{selectedApplicant?.nama_lengkap}</DialogTitle>
                                    <DialogDescription className="flex items-center gap-2 mt-1">
                                        {getStatusBadge(selectedApplicant?.status_approval || '')}
                                        <span>•</span>
                                        <span className="font-medium text-slate-600">{selectedApplicant?.no_whatsapp}</span>
                                    </DialogDescription>
                                </div>
                            </div>
                            {selectedApplicant?.status_approval === 'pending' && (
                                <div className="flex gap-2">
                                    <Button variant="outline" className="border-red-200 text-red-600 hover:bg-red-50" onClick={() => handleOpenApproval('reject')}>
                                        <X className="w-4 h-4 mr-2" /> Tolak
                                    </Button>
                                    <Button className="bg-green-600 hover:bg-green-700" onClick={() => handleOpenApproval('approve')}>
                                        <Check className="w-4 h-4 mr-2" /> Setujui
                                    </Button>
                                </div>
                            )}
                        </div>
                    </DialogHeader>

                    <ScrollArea className="flex-1 p-6 pt-2">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {/* INFO PRIBADI */}
                            <div className="space-y-4">
                                <h4 className="font-bold text-royal-900 flex items-center gap-2">
                                    <User className="w-4 h-4" /> Data Pribadi
                                </h4>
                                <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-100">
                                    <InfoRow label="Tempat, Tgl Lahir" value={`${selectedApplicant?.tempat_lahir}, ${selectedApplicant?.tanggal_lahir}`} />
                                    <InfoRow label="Status Sosial" value={selectedApplicant?.status_sosial} />
                                    <InfoRow label="Kategori" value={selectedApplicant?.kategori} />
                                    <InfoRow label="Alamat" value={selectedApplicant?.alamat} />
                                    <InfoRow label="Daftar Pada" value={selectedApplicant?.created_at ? format(new Date(selectedApplicant.created_at), 'PPP', { locale: localeId }) : '-'} />
                                </div>
                            </div>

                            {/* DATA WALI */}
                            <div className="space-y-4">
                                <h4 className="font-bold text-royal-900 flex items-center gap-2">
                                    <Heart className="w-4 h-4" /> Data Wali
                                </h4>
                                {waliData.length > 0 ? (
                                    <div className="space-y-3">
                                        {waliData.map((wali, idx) => (
                                            <div key={idx} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                                                <div className="flex justify-between items-start mb-2">
                                                    <p className="font-bold text-slate-900">{wali.nama_lengkap}</p>
                                                    <Badge variant="secondary" className="text-[10px]">{wali.hubungan_keluarga}</Badge>
                                                </div>
                                                <div className="text-sm text-slate-600 space-y-1">
                                                    <p className="flex items-center gap-2"><Smartphone className="w-3 h-3" /> {wali.no_whatsapp}</p>
                                                    <p className="flex items-center gap-2"><MapPin className="w-3 h-3" /> {wali.alamat}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : <p className="text-sm text-slate-400 italic py-4 text-center">Data wali belum diisi</p>}
                            </div>
                        </div>

                        <Separator className="my-8" />

                        {/* DOKUMEN */}
                        <div className="space-y-4 pb-8">
                            <h4 className="font-bold text-royal-900 flex items-center gap-2">
                                <FileText className="w-4 h-4" /> Dokumen Terlampir
                            </h4>
                            {docsData.length > 0 ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {docsData.map((doc, idx) => (
                                        <div key={idx} className="flex items-center justify-between p-3 rounded-lg border border-slate-200 bg-white group hover:border-royal-200 transition-colors">
                                            <div className="flex items-center gap-3 overflow-hidden">
                                                <div className="w-8 h-8 rounded bg-royal-100 flex items-center justify-center shrink-0">
                                                    <FileText className="w-4 h-4 text-royal-600" />
                                                </div>
                                                <div className="overflow-hidden">
                                                    <p className="text-xs font-bold text-slate-900 truncate tracking-tight">{doc.jenis_dokumen}</p>
                                                    <p className="text-[10px] text-slate-400 truncate">{doc.nama_file || 'File'}</p>
                                                </div>
                                            </div>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-royal-600" asChild>
                                                <a href={`${supabase.storage.from('santri_documents').getPublicUrl(doc.path_file).data.publicUrl}`} target="_blank" rel="noreferrer">
                                                    <Download className="w-4 h-4" />
                                                </a>
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            ) : <p className="text-sm text-slate-400 italic py-4 text-center">Belum ada dokumen yang diupload</p>}
                        </div>
                    </ScrollArea>
                </DialogContent>
            </Dialog>

            {/* APPROVAL DIALOG */}
            <Dialog open={isApprovalDialogOpen} onOpenChange={setIsApprovalDialogOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            {approvalType === 'approve' ? <CheckCircle className="text-green-600" /> : <XCircle className="text-red-600" />}
                            Konfirmasi {approvalType === 'approve' ? 'Persetujuan' : 'Penolakan'}
                        </DialogTitle>
                        <DialogDescription>
                            Alihkan status pendaftaran <strong>{selectedApplicant?.nama_lengkap}</strong> menjadi {approvalType === 'approve' ? 'Diterima' : 'Ditolak'}.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4 space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Catatan / Alasan (Opsional)</label>
                            <textarea
                                className="w-full min-h-[100px] p-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-royal-500 focus:outline-none text-sm"
                                placeholder="Tambahkan pesan untuk pendaftar..."
                                value={approvalNote}
                                onChange={(e) => setApprovalNote(e.target.value)}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsApprovalDialogOpen(false)} disabled={isSubmitting}>
                            Batal
                        </Button>
                        <Button
                            onClick={processApproval}
                            disabled={isSubmitting}
                            className={approvalType === 'approve' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}
                        >
                            {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            Ya, {approvalType === 'approve' ? 'Setujui' : 'Tolak'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

function InfoRow({ label, value }: { label: string, value?: string }) {
    return (
        <div className="flex justify-between items-center text-sm">
            <span className="text-slate-500">{label}</span>
            <span className="font-bold text-slate-950 text-right ml-4">{value || '-'}</span>
        </div>
    );
}

function ApplicantTable({ applicants, onView, loading }: { applicants: Applicant[], onView: (a: Applicant) => void, loading: boolean }) {
    if (loading) return (
        <div className="py-20 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-royal-600" />
            <p className="text-sm text-slate-500">Memuat data...</p>
        </div>
    );

    if (applicants.length === 0) return (
        <div className="py-20 flex flex-col items-center justify-center gap-3 opacity-40">
            <Users className="w-12 h-12" />
            <p className="text-sm font-medium">Tidak ada data pendaftar</p>
        </div>
    );

    return (
        <div className="overflow-x-auto">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="font-bold">ID Santri</TableHead>
                        <TableHead className="font-bold">Nama Lengkap</TableHead>
                        <TableHead className="font-bold">Kategori / Status</TableHead>
                        <TableHead className="font-bold">Tgl Daftar</TableHead>
                        <TableHead className="text-right font-bold">Aksi</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {applicants.map((applicant) => (
                        <TableRow key={applicant.id} className="group hover:bg-slate-50 transition-colors">
                            <TableCell className="font-mono text-xs font-bold text-royal-600">
                                {applicant.id_santri || 'PENDING'}
                            </TableCell>
                            <TableCell>
                                <div className="flex flex-col">
                                    <span className="font-bold text-slate-900 group-hover:text-royal-900 transition-colors">{applicant.nama_lengkap}</span>
                                    <span className="text-xs text-slate-500">{applicant.no_whatsapp}</span>
                                </div>
                            </TableCell>
                            <TableCell>
                                <div className="flex flex-col gap-1">
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{applicant.kategori}</span>
                                    <span className="text-xs font-medium text-slate-600 italic">"{applicant.status_sosial}"</span>
                                </div>
                            </TableCell>
                            <TableCell className="text-xs text-slate-500">
                                {format(new Date(applicant.created_at), 'dd MMM yyyy')}
                            </TableCell>
                            <TableCell className="text-right">
                                <Button variant="ghost" size="sm" className="hover:bg-royal-100 hover:text-royal-900" onClick={() => onView(applicant)}>
                                    <Eye className="w-4 h-4 mr-1.5" /> Detail
                                </Button>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
}
