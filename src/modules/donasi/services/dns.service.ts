import { supabase } from '@/integrations/supabase/client';

// ============================================
// TYPES
// ============================================

export interface DnsSubmission {
    id: string;
    nama: string;
    no_wa: string | null;
    nominal: number;
    pesan_doa: string | null;
    is_anonim: boolean;
    tampil_publik: boolean;
    bukti_transfer_url: string | null;
    status: 'pending' | 'verified' | 'rejected';
    catatan_admin: string | null;
    verified_by: string | null;
    verified_at: string | null;
    keuangan_id: string | null;
    akun_kas_id: string | null;
    created_at: string;
    updated_at: string;
}

export interface DnsDoaPublik {
    id: string;
    nama: string;
    pesan_doa: string;
    no_wa: string | null;
    is_anonim: boolean;
    status: 'pending' | 'approved' | 'rejected';
    created_at: string;
}

export interface DnsRekeningDisplay {
    id: string;
    nama_bank: string;
    nomor_rekening: string;
    atas_nama: string;
    keterangan: string | null;
    urutan: number;
    is_aktif: boolean;
    akun_kas_id: string | null;
    created_at: string;
}

export interface DnsSubmitInput {
    nama: string;
    no_wa?: string;
    nominal: number;
    pesan_doa?: string;
    bukti_transfer_url?: string;
    is_anonim?: boolean;
    tampil_publik?: boolean;
}

export interface DnsDoaInput {
    nama: string;
    pesan_doa: string;
    no_wa?: string;
    is_anonim?: boolean;
}

export interface DnsSocialProofItem {
    id: string;
    tipe: 'donasi' | 'doa';
    nama_tampil: string;
    nominal: number | null;
    pesan_doa: string | null;
    created_at: string;
}

export interface DnsKategoriBreakdown {
    nama: string;
    jumlah: number;
    persen?: number;
}

export interface DnsTrendBulanan {
    monthNum: number;
    month: string;
    pemasukan: number;
    pengeluaran: number;
}

export interface DnsTransparansiData {
    totalPemasukan: number;
    totalPengeluaran: number;
    saldoDonasi: number;
    tahun: number;
    breakdownKategori: DnsKategoriBreakdown[];
    trendBulanan: DnsTrendBulanan[];
}

// ============================================
// DEV HELPERS
// ============================================

const formatRp = (amount: number) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);

export { formatRp };

// ============================================
// DnsRekeningService
// Rekening yang ditampilkan di halaman donasi publik
// ============================================

export class DnsRekeningService {
    static async getAll(): Promise<DnsRekeningDisplay[]> {
        const { data, error } = await supabase
            .from('dns_rekening_display')
            .select('*')
            .eq('is_aktif', true)
            .order('urutan', { ascending: true });

        if (error) throw error;
        return (data ?? []) as DnsRekeningDisplay[];
    }

    // Admin: CRUD
    static async upsert(rekening: Partial<DnsRekeningDisplay> & { nama_bank: string; nomor_rekening: string; atas_nama: string }): Promise<DnsRekeningDisplay> {
        const { data, error } = await supabase
            .from('dns_rekening_display')
            .upsert(rekening)
            .select()
            .single();

        if (error) throw error;
        return data as DnsRekeningDisplay;
    }

    static async remove(id: string): Promise<void> {
        const { error } = await supabase
            .from('dns_rekening_display')
            .delete()
            .eq('id', id);
        if (error) throw error;
    }
}

// ============================================
// DnsSubmissionService
// Donasi online publik — submit + verifikasi admin
// ============================================

export class DnsSubmissionService {
    /** Public: submit donasi baru */
    static async submit(input: DnsSubmitInput): Promise<string> {
        const { data, error } = await supabase.rpc('dns_submit_donasi', {
            p_nama: input.nama,
            p_no_wa: input.no_wa ?? null,
            p_nominal: input.nominal,
            p_pesan_doa: input.pesan_doa ?? null,
            p_bukti_transfer_url: input.bukti_transfer_url ?? null,
            p_is_anonim: input.is_anonim ?? false,
            p_tampil_publik: input.tampil_publik ?? true,
        });

        if (error) throw error;
        return data as string; // returns uuid
    }

    /** Upload bukti transfer ke Supabase Storage */
    static async uploadBukti(file: File, submissionId?: string): Promise<string> {
        const ext = file.name.split('.').pop();
        const filename = `dns-bukti/${submissionId ?? Date.now()}-${Date.now()}.${ext}`;

        const { error } = await supabase.storage
            .from('donasi-images')
            .upload(filename, file, { upsert: true });

        if (error) throw error;

        const { data } = supabase.storage
            .from('donasi-images')
            .getPublicUrl(filename);

        return data.publicUrl;
    }

    /** Admin: ambil semua submission dengan filter */
    static async getAll(status?: DnsSubmission['status']): Promise<DnsSubmission[]> {
        let query = supabase
            .from('dns_submissions')
            .select('*')
            .order('created_at', { ascending: false });

        if (status) query = query.eq('status', status);

        const { data, error } = await query;
        if (error) throw error;
        return (data ?? []) as DnsSubmission[];
    }

    /** Admin: verifikasi submission → auto post ke keuangan + auto-upsert donor */
    static async verify(submissionId: string, akunKasId?: string): Promise<{
        keuangan_id: string; akun_kas_id: string;
        donor_id?: string; no_wa?: string; nama: string; nominal: number;
    }> {
        const { data, error } = await supabase.rpc('dns_verify_submission', {
            p_submission_id: submissionId,
            p_akun_kas_id: akunKasId ?? null,
        });
        if (error) throw error;
        return data as {
            keuangan_id: string; akun_kas_id: string;
            donor_id?: string; no_wa?: string; nama: string; nominal: number;
        };
    }

    /** Admin: tolak submission */
    static async reject(submissionId: string, catatan?: string): Promise<void> {
        const { error } = await supabase.rpc('dns_reject_submission', {
            p_submission_id: submissionId,
            p_catatan: catatan ?? null,
        });
        if (error) throw error;
    }

    /** Admin: input donasi offline langsung (post ke keuangan + upsert donor + social proof) */
    static async postOffline(input: {
        nama: string; no_wa?: string; nominal: number;
        catatan?: string; akun_kas_id?: string; tanggal?: string;
        pesan_doa?: string;
    }): Promise<{ keuangan_id: string; donor_id?: string; no_wa?: string; nama: string; nominal: number }> {
        const { data, error } = await supabase.rpc('dns_post_offline_donasi', {
            p_nama: input.nama,
            p_no_wa: input.no_wa ?? null,
            p_nominal: input.nominal,
            p_catatan: input.catatan ?? null,
            p_akun_kas_id: input.akun_kas_id ?? null,
            p_tanggal: input.tanggal ?? null,
            p_pesan_doa: input.pesan_doa ?? null,
        });
        if (error) throw error;
        return data as { keuangan_id: string; donor_id?: string; no_wa?: string; nama: string; nominal: number };
    }

    /** Admin: riwayat donasi yang sudah diverifikasi/ditolak */
    static async getHistory(limit = 30): Promise<DnsSubmission[]> {
        const { data, error } = await supabase
            .from('dns_submissions')
            .select('*')
            .in('status', ['verified', 'rejected'])
            .order('updated_at', { ascending: false })
            .limit(limit);
        if (error) throw error;
        return (data ?? []) as DnsSubmission[];
    }

    /** Admin: update tampil_publik toggle */
    static async togglePublik(id: string, tampil_publik: boolean): Promise<void> {
        const { error } = await supabase
            .from('dns_submissions')
            .update({ tampil_publik })
            .eq('id', id);
        if (error) throw error;
    }

    /** Admin: hapus submission (untuk data duplikat/test) */
    static async deleteSubmission(id: string): Promise<void> {
        const { error } = await supabase
            .from('dns_submissions')
            .delete()
            .eq('id', id);
        if (error) throw error;
    }
}

// ============================================
// DnsSocialProofService
// Donatur verified + doa approved untuk halaman publik
// ============================================

export class DnsSocialProofService {
    static async get(limit = 20): Promise<DnsSocialProofItem[]> {
        const { data, error } = await supabase.rpc('dns_get_social_proof', {
            p_limit: limit,
        });

        if (error) throw error;
        return (data ?? []) as DnsSocialProofItem[];
    }

    /** Public: kirim doa standalone */
    static async submitDoa(input: DnsDoaInput): Promise<string> {
        const { data, error } = await supabase.rpc('dns_submit_doa', {
            p_nama: input.nama,
            p_pesan_doa: input.pesan_doa,
            p_no_wa: input.no_wa ?? null,
            p_is_anonim: input.is_anonim ?? false,
        });

        if (error) throw error;
        return data as string;
    }
}

// ============================================
// DnsDoaAdminService
// Moderasi doa/hajat publik oleh admin
// ============================================

export class DnsDoaAdminService {
    static async getAll(status?: DnsDoaPublik['status']): Promise<DnsDoaPublik[]> {
        let query = supabase
            .from('dns_doa_publik')
            .select('*')
            .order('created_at', { ascending: false });

        if (status) query = query.eq('status', status);

        const { data, error } = await query;
        if (error) throw error;
        return (data ?? []) as DnsDoaPublik[];
    }

    static async approve(id: string): Promise<void> {
        const { error } = await supabase
            .from('dns_doa_publik')
            .update({ status: 'approved' })
            .eq('id', id);
        if (error) throw error;
    }

    static async reject(id: string): Promise<void> {
        const { error } = await supabase
            .from('dns_doa_publik')
            .update({ status: 'rejected' })
            .eq('id', id);
        if (error) throw error;
    }
}

// ============================================
// DnsTransparansiService
// Ringkasan keuangan donasi untuk halaman publik
// ============================================

export class DnsTransparansiService {
    static async getSummary(year?: number): Promise<DnsTransparansiData> {
        const targetYear = year ?? new Date().getFullYear();

        const { data, error } = await supabase.rpc('dns_get_transparansi_summary', {
            p_year: targetYear,
        });

        if (error) throw error;

        const raw = data as any;

        // Hitung persentase untuk breakdown
        const totalPengeluaran = raw?.totalPengeluaran ?? 0;
        const breakdown: DnsKategoriBreakdown[] = (raw?.breakdownKategori ?? []).map((k: any) => ({
            nama: k.nama,
            jumlah: k.jumlah,
            persen: totalPengeluaran > 0 ? Math.round((k.jumlah / totalPengeluaran) * 100) : 0,
        }));

        return {
            totalPemasukan: raw?.totalPemasukan ?? 0,
            totalPengeluaran: raw?.totalPengeluaran ?? 0,
            saldoDonasi: raw?.saldoDonasi ?? 0,
            tahun: raw?.tahun ?? targetYear,
            breakdownKategori: breakdown,
            trendBulanan: raw?.trendBulanan ?? [],
        };
    }

    /** Ambil daftar tahun yang tersedia di keuangan donasi */
    static async getAvailableYears(): Promise<number[]> {
        const { data, error } = await supabase
            .from('keuangan')
            .select('tanggal')
            .ilike('kategori', '%donasi%')
            .not('voided_at', 'is', null)
            .order('tanggal', { ascending: false });

        // Fallback: return tahun berjalan jika error
        if (error || !data || data.length === 0) {
            return [new Date().getFullYear()];
        }

        const years = [...new Set(data.map((r: any) => new Date(r.tanggal).getFullYear()))];
        return years.sort((a, b) => b - a);
    }
}
