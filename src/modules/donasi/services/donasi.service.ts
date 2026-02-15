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
        // Use SECURITY DEFINER RPC to bypass RLS for anonymous public access
        const { data, error } = await supabase.rpc('get_program_donasi_public', {});

        if (error) throw error;
        const programs = data as any[];
        if (!programs || !Array.isArray(programs)) return [];
        return programs.map((p: any) => ({
            ...p,
            sanity_slugs: p.sanity_slugs || [],
        }));
    }

    static async getBySlug(slug: string): Promise<ProgramDonasi | null> {
        // Use SECURITY DEFINER RPC to bypass RLS for anonymous public access
        const { data, error } = await supabase.rpc('get_program_donasi_public', {
            p_slug: slug,
        });

        if (error) throw error;
        if (!data || data === 'null') return null;
        const p = data as any;
        return {
            ...p,
            sanity_slugs: p.sanity_slugs || [],
        };
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
        // Use SECURITY DEFINER RPC to bypass RLS for anonymous public access
        const { data, error } = await supabase.rpc('get_donasi_transparansi_data', {
            p_year: year,
        });

        if (error) throw error;

        const result = data as any;

        if (!result || !result.totalSaldoProgram) {
            return {
                totalSaldoProgram: 0,
                totalPemasukan: 0,
                totalPengeluaran: 0,
                trendBulanan: MONTH_NAMES.map((m, i) => ({ month: m, monthNum: i + 1, pemasukan: 0, pengeluaran: 0 })),
                recentTransactions: [],
            };
        }

        return {
            totalSaldoProgram: result.totalSaldoProgram || 0,
            totalPemasukan: result.totalPemasukan || 0,
            totalPengeluaran: result.totalPengeluaran || 0,
            trendBulanan: (result.trendBulanan || []).map((t: any) => ({
                month: t.month,
                monthNum: t.monthNum,
                pemasukan: t.pemasukan || 0,
                pengeluaran: t.pengeluaran || 0,
            })),
            recentTransactions: (result.recentTransactions || []).map((tx: any) => ({
                date: tx.date,
                description: tx.description,
                category: tx.category,
                amount: tx.amount,
                type: tx.type,
                program_nama: tx.program_nama || '—',
            })),
        };
    }
}
