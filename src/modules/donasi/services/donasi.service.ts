import { supabase } from '@/integrations/supabase/client';

// ============================================
// TYPES
// ============================================

export interface ProgramDonasi {
    id: string;
    nama: string;
    deskripsi: string | null;
    slug: string;
    gambar_url: string | null;
    akun_kas_id: string;
    target_amount: number;
    is_active: boolean;
    urutan: number;
    sanity_slugs: string[];
    wa_admin: string | null;
    created_at: string;
    updated_at: string;
    // Joined from akun_kas
    akun_kas_nama?: string;
    akun_kas_saldo?: number;
    akun_kas_nomor_rekening?: string;
    akun_kas_nama_bank?: string;
    akun_kas_atas_nama?: string;
}

export interface DoaHajat {
    id: string;
    nama: string;
    pesan_doa: string;
    no_wa: string | null;
    email: string | null;
    nominal: number;
    program_donasi_id: string | null;
    is_public: boolean;
    is_visible: boolean;
    status: 'pending' | 'verified' | 'rejected';
    created_at: string;
    // Joined
    program_nama?: string;
}

export interface CreateProgramInput {
    nama: string;
    deskripsi?: string;
    slug: string;
    gambar_url?: string;
    akun_kas_id: string;
    target_amount?: number;
    is_active?: boolean;
    urutan?: number;
    sanity_slugs?: string[];
    wa_admin?: string;
}

export interface SubmitDoaInput {
    nama: string;
    pesan_doa: string;
    no_wa: string;
    email?: string;
    nominal?: number;
    program_donasi_id?: string;
    is_public?: boolean;
}

export interface DonasiTransparansiData {
    totalSaldoProgram: number;
    totalPemasukan: number;
    totalPengeluaran: number;
    trendBulanan: { month: string; monthNum: number; pemasukan: number; pengeluaran: number }[];
    recentTransactions: {
        date: string;
        description: string;
        category: string;
        amount: number;
        type: 'Pemasukan' | 'Pengeluaran';
        program_nama?: string;
    }[];
}

// ============================================
// HELPERS
// ============================================

const mapProgram = (p: any): ProgramDonasi => ({
    ...p,
    sanity_slugs: p.sanity_slugs || [],
    akun_kas_nama: p.akun_kas?.nama,
    akun_kas_saldo: p.akun_kas?.saldo_saat_ini,
    akun_kas_nomor_rekening: p.akun_kas?.nomor_rekening,
    akun_kas_nama_bank: p.akun_kas?.nama_bank,
    akun_kas_atas_nama: p.akun_kas?.atas_nama,
});

const AKUN_KAS_JOIN = '*, akun_kas!inner(nama, saldo_saat_ini, nomor_rekening, nama_bank, atas_nama)';
const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

// ============================================
// PROGRAM DONASI SERVICE
// ============================================

export class ProgramDonasiService {
    static async getAll(): Promise<ProgramDonasi[]> {
        const { data, error } = await supabase
            .from('program_donasi')
            .select(AKUN_KAS_JOIN)
            .order('urutan', { ascending: true });

        if (error) throw error;
        return (data || []).map(mapProgram);
    }

    static async getActivePublic(): Promise<ProgramDonasi[]> {
        const { data, error } = await supabase
            .from('program_donasi')
            .select(AKUN_KAS_JOIN)
            .eq('is_active', true)
            .order('urutan', { ascending: true });

        if (error) throw error;
        return (data || []).map(mapProgram);
    }

    static async getBySlug(slug: string): Promise<ProgramDonasi | null> {
        const { data, error } = await supabase
            .from('program_donasi')
            .select(AKUN_KAS_JOIN)
            .eq('slug', slug)
            .eq('is_active', true)
            .single();

        if (error) {
            if (error.code === 'PGRST116') return null;
            throw error;
        }

        return mapProgram(data);
    }

    static async create(input: CreateProgramInput): Promise<ProgramDonasi> {
        const { data, error } = await supabase
            .from('program_donasi')
            .insert(input)
            .select()
            .single();

        if (error) throw error;
        return data as ProgramDonasi;
    }

    static async update(id: string, input: Partial<CreateProgramInput>): Promise<ProgramDonasi> {
        const { data, error } = await supabase
            .from('program_donasi')
            .update(input)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data as ProgramDonasi;
    }

    static async delete(id: string): Promise<void> {
        const { error } = await supabase
            .from('program_donasi')
            .delete()
            .eq('id', id);

        if (error) throw error;
    }

    static async uploadImage(file: File): Promise<string> {
        const ext = file.name.split('.').pop() || 'jpg';
        const fileName = `program-covers/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

        const { error } = await supabase.storage
            .from('donasi-images')
            .upload(fileName, file, { upsert: true });

        if (error) throw error;

        const { data } = supabase.storage
            .from('donasi-images')
            .getPublicUrl(fileName);

        return data.publicUrl;
    }
}

// ============================================
// DOA HAJAT SERVICE
// ============================================

export class DoaHajatService {
    // Admin: get all (including hidden)
    static async getAll(): Promise<DoaHajat[]> {
        const { data, error } = await supabase
            .from('doa_hajat')
            .select('*, program_donasi(nama)')
            .order('created_at', { ascending: false });

        if (error) throw error;
        return (data || []).map((d: any) => ({
            ...d,
            program_nama: d.program_donasi?.nama || null,
        })) as DoaHajat[];
    }

    // Admin: get pending donations for verification
    static async getPending(): Promise<DoaHajat[]> {
        const { data, error } = await supabase
            .from('doa_hajat')
            .select('*, program_donasi(nama)')
            .eq('status', 'pending')
            .gt('nominal', 0)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return (data || []).map((d: any) => ({
            ...d,
            program_nama: d.program_donasi?.nama || null,
        })) as DoaHajat[];
    }

    // Public: get approved + public doas within N days
    static async getVisible(days: number = 30): Promise<DoaHajat[]> {
        const since = new Date();
        since.setDate(since.getDate() - days);

        const { data, error } = await supabase
            .from('doa_hajat')
            .select('*')
            .eq('is_visible', true)
            .eq('is_public', true)
            .gte('created_at', since.toISOString())
            .order('created_at', { ascending: false });

        if (error) throw error;
        return (data || []) as DoaHajat[];
    }

    // Public: submit new doa with full data
    static async submit(input: SubmitDoaInput): Promise<DoaHajat> {
        const { data, error } = await supabase
            .from('doa_hajat')
            .insert({
                nama: input.nama,
                pesan_doa: input.pesan_doa,
                no_wa: input.no_wa,
                email: input.email || null,
                nominal: input.nominal || 0,
                program_donasi_id: input.program_donasi_id || null,
                is_public: input.is_public ?? false,
                status: 'pending',
            })
            .select()
            .single();

        if (error) throw error;
        return data as DoaHajat;
    }

    // Admin: verify donation → auto-post to keuangan
    static async verify(id: string): Promise<void> {
        // 1. Get the doa entry with program info
        const { data: doa, error: fetchErr } = await supabase
            .from('doa_hajat')
            .select('*, program_donasi(nama, akun_kas_id)')
            .eq('id', id)
            .single();

        if (fetchErr || !doa) throw fetchErr || new Error('Doa not found');

        const program = (doa as any).program_donasi;
        if (!program?.akun_kas_id || !doa.nominal || doa.nominal <= 0) {
            // Just mark verified without posting to keuangan
            await supabase.from('doa_hajat').update({ status: 'verified', is_visible: true }).eq('id', id);
            return;
        }

        // 2. Insert into keuangan as Pemasukan
        const { error: keuErr } = await supabase.from('keuangan').insert({
            tanggal: new Date().toISOString().split('T')[0],
            kategori: 'Donasi',
            sub_kategori: program.nama,
            jumlah: doa.nominal,
            akun_kas_id: program.akun_kas_id,
            deskripsi: `Donasi Online — ${doa.nama}${doa.pesan_doa ? `. Doa: ${doa.pesan_doa.slice(0, 100)}` : ''}`,
            penerima_pembayar: doa.nama || 'Hamba Allah',
            jenis_transaksi: 'Pemasukan',
            status: 'posted',
        });

        if (keuErr) throw keuErr;

        // 3. Update doa status
        const { error: updateErr } = await supabase
            .from('doa_hajat')
            .update({ status: 'verified', is_visible: true })
            .eq('id', id);

        if (updateErr) throw updateErr;
    }

    // Admin: reject donation
    static async reject(id: string): Promise<void> {
        const { error } = await supabase
            .from('doa_hajat')
            .update({ status: 'rejected' })
            .eq('id', id);

        if (error) throw error;
    }

    // Admin: toggle visibility
    static async toggleVisibility(id: string, is_visible: boolean): Promise<void> {
        const { error } = await supabase
            .from('doa_hajat')
            .update({ is_visible })
            .eq('id', id);

        if (error) throw error;
    }

    // Admin: delete
    static async delete(id: string): Promise<void> {
        const { error } = await supabase
            .from('doa_hajat')
            .delete()
            .eq('id', id);

        if (error) throw error;
    }
}

// ============================================
// TRANSPARANSI SERVICE (Scoped to Donasi)
// ============================================

export class DonasiTransparansiService {
    static async getData(year: number): Promise<DonasiTransparansiData> {
        // 1. Get all program_donasi with their akun_kas_id
        const { data: programs, error: pgErr } = await supabase
            .from('program_donasi')
            .select('id, nama, akun_kas_id, akun_kas!inner(saldo_saat_ini)');

        if (pgErr) throw pgErr;
        if (!programs || programs.length === 0) {
            return {
                totalSaldoProgram: 0,
                totalPemasukan: 0,
                totalPengeluaran: 0,
                trendBulanan: MONTH_NAMES.map((m, i) => ({ month: m, monthNum: i + 1, pemasukan: 0, pengeluaran: 0 })),
                recentTransactions: [],
            };
        }

        const akunKasIds = [...new Set(programs.map((p: any) => p.akun_kas_id))];
        const totalSaldo = programs.reduce((s: number, p: any) => s + ((p.akun_kas as any)?.saldo_saat_ini || 0), 0);

        // Map akun_kas_id → program_nama
        const akunToProgram: Record<string, string> = {};
        programs.forEach((p: any) => { akunToProgram[p.akun_kas_id] = p.nama; });

        // 2. Get all transactions for these akun_kas in the given year
        const startDate = `${year}-01-01`;
        const endDate = `${year}-12-31`;

        const { data: txs, error: txErr } = await supabase
            .from('keuangan')
            .select('id, tanggal, deskripsi, kategori, jumlah, jenis_transaksi, akun_kas_id')
            .in('akun_kas_id', akunKasIds)
            .eq('status', 'posted')
            .gte('tanggal', startDate)
            .lte('tanggal', endDate)
            .order('tanggal', { ascending: false });

        if (txErr) throw txErr;

        const transactions = txs || [];

        // 3. Aggregate
        let totalPemasukan = 0;
        let totalPengeluaran = 0;
        const trendMap: Record<number, { pemasukan: number; pengeluaran: number }> = {};
        for (let i = 1; i <= 12; i++) trendMap[i] = { pemasukan: 0, pengeluaran: 0 };

        transactions.forEach((tx: any) => {
            const month = new Date(tx.tanggal).getMonth() + 1;
            if (tx.jenis_transaksi === 'Pemasukan') {
                totalPemasukan += tx.jumlah;
                trendMap[month].pemasukan += tx.jumlah;
            } else {
                totalPengeluaran += tx.jumlah;
                trendMap[month].pengeluaran += tx.jumlah;
            }
        });

        return {
            totalSaldoProgram: totalSaldo,
            totalPemasukan,
            totalPengeluaran,
            trendBulanan: MONTH_NAMES.map((m, i) => ({
                month: m,
                monthNum: i + 1,
                pemasukan: trendMap[i + 1].pemasukan,
                pengeluaran: trendMap[i + 1].pengeluaran,
            })),
            recentTransactions: transactions.slice(0, 50).map((tx: any) => ({
                date: tx.tanggal,
                description: tx.deskripsi || tx.kategori,
                category: tx.kategori,
                amount: tx.jumlah,
                type: tx.jenis_transaksi,
                program_nama: akunToProgram[tx.akun_kas_id] || '—',
            })),
        };
    }
}
