export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      dokumen_audit_log: {
        Row: {
          action: string
          dokumen_id: string | null
          id: string
          ip_address: unknown | null
          new_values: Json | null
          old_values: Json | null
          performed_at: string | null
          performed_by: string | null
          user_agent: string | null
        }
        Insert: {
          action: string
          dokumen_id?: string | null
          id?: string
          ip_address?: unknown | null
          new_values?: Json | null
          old_values?: Json | null
          performed_at?: string | null
          performed_by?: string | null
          user_agent?: string | null
        }
        Update: {
          action?: string
          dokumen_id?: string | null
          id?: string
          ip_address?: unknown | null
          new_values?: Json | null
          old_values?: Json | null
          performed_at?: string | null
          performed_by?: string | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "dokumen_audit_log_dokumen_id_fkey"
            columns: ["dokumen_id"]
            isOneToOne: false
            referencedRelation: "dokumen_santri"
            referencedColumns: ["id"]
          },
        ]
      }
      dokumen_santri: {
        Row: {
          catatan: string | null
          created_at: string | null
          id: string
          is_active: boolean | null
          kode_dokumen: string
          mime: string | null
          original_name: string | null
          parent_id: string | null
          santri_id: string | null
          size: number | null
          status_validasi: string | null
          tanggal_upload: string | null
          updated_at: string | null
          url: string | null
          verifier: string | null
          version: number | null
        }
        Insert: {
          catatan?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          kode_dokumen: string
          mime?: string | null
          original_name?: string | null
          parent_id?: string | null
          santri_id?: string | null
          size?: number | null
          status_validasi?: string | null
          tanggal_upload?: string | null
          updated_at?: string | null
          url?: string | null
          verifier?: string | null
          version?: number | null
        }
        Update: {
          catatan?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          kode_dokumen?: string
          mime?: string | null
          original_name?: string | null
          parent_id?: string | null
          santri_id?: string | null
          size?: number | null
          status_validasi?: string | null
          tanggal_upload?: string | null
          updated_at?: string | null
          url?: string | null
          verifier?: string | null
          version?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "dokumen_santri_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "dokumen_santri"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dokumen_santri_santri_id_fkey"
            columns: ["santri_id"]
            isOneToOne: false
            referencedRelation: "santri"
            referencedColumns: ["id"]
          },
        ]
      }
      donasi: {
        Row: {
          created_at: string | null
          created_by: string | null
          deskripsi: string | null
          email_donatur: string | null
          id: string
          jenis_donasi: string
          jumlah: number | null
          nama_donatur: string
          no_telepon: string | null
          status: string | null
          tanggal_diterima: string | null
          tanggal_donasi: string | null
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          deskripsi?: string | null
          email_donatur?: string | null
          id?: string
          jenis_donasi: string
          jumlah?: number | null
          nama_donatur: string
          no_telepon?: string | null
          status?: string | null
          tanggal_diterima?: string | null
          tanggal_donasi?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          deskripsi?: string | null
          email_donatur?: string | null
          id?: string
          jenis_donasi?: string
          jumlah?: number | null
          nama_donatur?: string
          no_telepon?: string | null
          status?: string | null
          tanggal_diterima?: string | null
          tanggal_donasi?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: []
      }
      inventaris: {
        Row: {
          created_at: string | null
          created_by: string | null
          harga_perolehan: number | null
          id: string
          jumlah: number | null
          kategori: string
          keterangan: string | null
          kondisi: string | null
          lokasi: string | null
          nama_barang: string
          supplier: string | null
          tanggal_perolehan: string | null
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          harga_perolehan?: number | null
          id?: string
          jumlah?: number | null
          kategori: string
          keterangan?: string | null
          kondisi?: string | null
          lokasi?: string | null
          nama_barang: string
          supplier?: string | null
          tanggal_perolehan?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          harga_perolehan?: number | null
          id?: string
          jumlah?: number | null
          kategori?: string
          keterangan?: string | null
          kondisi?: string | null
          lokasi?: string | null
          nama_barang?: string
          supplier?: string | null
          tanggal_perolehan?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: []
      }
      keuangan: {
        Row: {
          created_at: string | null
          created_by: string | null
          deskripsi: string | null
          id: string
          jenis_transaksi: string
          jumlah: number
          kategori: string
          referensi: string | null
          tanggal: string
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          deskripsi?: string | null
          id?: string
          jenis_transaksi: string
          jumlah: number
          kategori: string
          referensi?: string | null
          tanggal: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          deskripsi?: string | null
          id?: string
          jenis_transaksi?: string
          jumlah?: number
          kategori?: string
          referensi?: string | null
          tanggal?: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: []
      }
      koperasi: {
        Row: {
          created_at: string | null
          created_by: string | null
          deskripsi: string | null
          harga_beli: number | null
          harga_jual: number
          id: string
          kategori: string
          nama_produk: string
          status: string | null
          stok: number | null
          stok_minimum: number | null
          supplier: string | null
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          deskripsi?: string | null
          harga_beli?: number | null
          harga_jual: number
          id?: string
          kategori: string
          nama_produk: string
          status?: string | null
          stok?: number | null
          stok_minimum?: number | null
          supplier?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          deskripsi?: string | null
          harga_beli?: number | null
          harga_jual?: number
          id?: string
          kategori?: string
          nama_produk?: string
          status?: string | null
          stok?: number | null
          stok_minimum?: number | null
          supplier?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string | null
          email: string | null
          full_name: string | null
          id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      santri: {
        Row: {
          alamat: string | null
          angkatan: string | null
          created_at: string | null
          created_by: string | null
          id: string
          jenis: Database["public"]["Enums"]["santri_jenis"] | null
          jenis_kelamin: string | null
          kategori: string | null
          kelas: string | null
          kelas_aktif: string | null
          kelas_internal: string | null
          kelas_madin: string | null
          kelas_sekolah_formal: string | null
          kelas_tpq: string | null
          nama_lengkap: string
          nama_sekolah_formal: string | null
          nama_wali: string | null
          nama_wali_kelas: string | null
          nis: string
          no_telepon_wali: string | null
          no_telepon_wali_kelas: string | null
          program_aktif: Database["public"]["Enums"]["santri_program"] | null
          program_beasiswa: boolean | null
          program_spp: boolean | null
          rombel_aktif: string | null
          rombel_madin: string | null
          rombel_tpq: string | null
          status: string | null
          status_baru: Database["public"]["Enums"]["santri_status"] | null
          status_sosial: Database["public"]["Enums"]["status_sosial"] | null
          tanggal_keluar: string | null
          tanggal_lahir: string | null
          tanggal_masuk: string | null
          tempat_lahir: string | null
          ukuran_seragam: string | null
          updated_at: string | null
          updated_by: string | null
          warna_seragam: string | null
        }
        Insert: {
          alamat?: string | null
          angkatan?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          jenis?: Database["public"]["Enums"]["santri_jenis"] | null
          jenis_kelamin?: string | null
          kategori?: string | null
          kelas?: string | null
          kelas_aktif?: string | null
          kelas_internal?: string | null
          kelas_madin?: string | null
          kelas_sekolah_formal?: string | null
          kelas_tpq?: string | null
          nama_lengkap: string
          nama_sekolah_formal?: string | null
          nama_wali?: string | null
          nama_wali_kelas?: string | null
          nis: string
          no_telepon_wali?: string | null
          no_telepon_wali_kelas?: string | null
          program_aktif?: Database["public"]["Enums"]["santri_program"] | null
          program_beasiswa?: boolean | null
          program_spp?: boolean | null
          rombel_aktif?: string | null
          rombel_madin?: string | null
          rombel_tpq?: string | null
          status?: string | null
          status_baru?: Database["public"]["Enums"]["santri_status"] | null
          status_sosial?: Database["public"]["Enums"]["status_sosial"] | null
          tanggal_keluar?: string | null
          tanggal_lahir?: string | null
          tanggal_masuk?: string | null
          tempat_lahir?: string | null
          ukuran_seragam?: string | null
          updated_at?: string | null
          updated_by?: string | null
          warna_seragam?: string | null
        }
        Update: {
          alamat?: string | null
          angkatan?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          jenis?: Database["public"]["Enums"]["santri_jenis"] | null
          jenis_kelamin?: string | null
          kategori?: string | null
          kelas?: string | null
          kelas_aktif?: string | null
          kelas_internal?: string | null
          kelas_madin?: string | null
          kelas_sekolah_formal?: string | null
          kelas_tpq?: string | null
          nama_lengkap?: string
          nama_sekolah_formal?: string | null
          nama_wali?: string | null
          nama_wali_kelas?: string | null
          nis?: string
          no_telepon_wali?: string | null
          no_telepon_wali_kelas?: string | null
          program_aktif?: Database["public"]["Enums"]["santri_program"] | null
          program_beasiswa?: boolean | null
          program_spp?: boolean | null
          rombel_aktif?: string | null
          rombel_madin?: string | null
          rombel_tpq?: string | null
          status?: string | null
          status_baru?: Database["public"]["Enums"]["santri_status"] | null
          status_sosial?: Database["public"]["Enums"]["status_sosial"] | null
          tanggal_keluar?: string | null
          tanggal_lahir?: string | null
          tanggal_masuk?: string | null
          tempat_lahir?: string | null
          ukuran_seragam?: string | null
          updated_at?: string | null
          updated_by?: string | null
          warna_seragam?: string | null
        }
        Relationships: []
      }
      santri_dokumen: {
        Row: {
          akta_kematian: string | null
          created_at: string | null
          id: string
          jenis_dokumen: string
          keterangan: string | null
          nama_file: string | null
          path_file: string | null
          santri_id: string | null
          sktm: string | null
          status: Database["public"]["Enums"]["dokumen_status"] | null
          surat_domisili: string | null
          tanggal_upload: string | null
          updated_at: string | null
        }
        Insert: {
          akta_kematian?: string | null
          created_at?: string | null
          id?: string
          jenis_dokumen: string
          keterangan?: string | null
          nama_file?: string | null
          path_file?: string | null
          santri_id?: string | null
          sktm?: string | null
          status?: Database["public"]["Enums"]["dokumen_status"] | null
          surat_domisili?: string | null
          tanggal_upload?: string | null
          updated_at?: string | null
        }
        Update: {
          akta_kematian?: string | null
          created_at?: string | null
          id?: string
          jenis_dokumen?: string
          keterangan?: string | null
          nama_file?: string | null
          path_file?: string | null
          santri_id?: string | null
          sktm?: string | null
          status?: Database["public"]["Enums"]["dokumen_status"] | null
          surat_domisili?: string | null
          tanggal_upload?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "santri_dokumen_santri_id_fkey"
            columns: ["santri_id"]
            isOneToOne: false
            referencedRelation: "santri"
            referencedColumns: ["id"]
          },
        ]
      }
      santri_programs: {
        Row: {
          aktif: boolean | null
          created_at: string | null
          id: string
          kelas: string | null
          nama_program: string
          rombel: string | null
          santri_id: string | null
          tgl_mulai: string | null
          tgl_selesai: string | null
          updated_at: string | null
        }
        Insert: {
          aktif?: boolean | null
          created_at?: string | null
          id?: string
          kelas?: string | null
          nama_program: string
          rombel?: string | null
          santri_id?: string | null
          tgl_mulai?: string | null
          tgl_selesai?: string | null
          updated_at?: string | null
        }
        Update: {
          aktif?: boolean | null
          created_at?: string | null
          id?: string
          kelas?: string | null
          nama_program?: string
          rombel?: string | null
          santri_id?: string | null
          tgl_mulai?: string | null
          tgl_selesai?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "santri_programs_santri_id_fkey"
            columns: ["santri_id"]
            isOneToOne: false
            referencedRelation: "santri"
            referencedColumns: ["id"]
          },
        ]
      }
      santri_riwayat_kelas: {
        Row: {
          created_at: string | null
          id: string
          kelas: string
          program: Database["public"]["Enums"]["santri_program"]
          rombel: string | null
          santri_id: string | null
          semester: string
          status: string | null
          tahun_ajaran: string
          tanggal_mulai: string | null
          tanggal_selesai: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          kelas: string
          program: Database["public"]["Enums"]["santri_program"]
          rombel?: string | null
          santri_id?: string | null
          semester: string
          status?: string | null
          tahun_ajaran: string
          tanggal_mulai?: string | null
          tanggal_selesai?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          kelas?: string
          program?: Database["public"]["Enums"]["santri_program"]
          rombel?: string | null
          santri_id?: string | null
          semester?: string
          status?: string | null
          tahun_ajaran?: string
          tanggal_mulai?: string | null
          tanggal_selesai?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "santri_riwayat_kelas_santri_id_fkey"
            columns: ["santri_id"]
            isOneToOne: false
            referencedRelation: "santri"
            referencedColumns: ["id"]
          },
        ]
      }
      santri_wali: {
        Row: {
          alamat: string | null
          created_at: string | null
          email: string | null
          hubungan_keluarga: string
          id: string
          is_utama: boolean | null
          nama_lengkap: string
          no_telepon: string | null
          pekerjaan: string | null
          santri_id: string | null
          updated_at: string | null
        }
        Insert: {
          alamat?: string | null
          created_at?: string | null
          email?: string | null
          hubungan_keluarga: string
          id?: string
          is_utama?: boolean | null
          nama_lengkap: string
          no_telepon?: string | null
          pekerjaan?: string | null
          santri_id?: string | null
          updated_at?: string | null
        }
        Update: {
          alamat?: string | null
          created_at?: string | null
          email?: string | null
          hubungan_keluarga?: string
          id?: string
          is_utama?: boolean | null
          nama_lengkap?: string
          no_telepon?: string | null
          pekerjaan?: string | null
          santri_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "santri_wali_santri_id_fkey"
            columns: ["santri_id"]
            isOneToOne: false
            referencedRelation: "santri"
            referencedColumns: ["id"]
          },
        ]
      }
      tabungan: {
        Row: {
          created_at: string | null
          created_by: string | null
          id: string
          jenis_transaksi: string
          jumlah: number
          keterangan: string | null
          saldo_sebelum: number
          saldo_sesudah: number
          santri_id: string | null
          tanggal: string
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          jenis_transaksi: string
          jumlah: number
          keterangan?: string | null
          saldo_sebelum: number
          saldo_sesudah: number
          santri_id?: string | null
          tanggal: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          jenis_transaksi?: string
          jumlah?: number
          keterangan?: string | null
          saldo_sebelum?: number
          saldo_sesudah?: number
          santri_id?: string | null
          tanggal?: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tabungan_santri_id_fkey"
            columns: ["santri_id"]
            isOneToOne: false
            referencedRelation: "santri"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      calculate_document_completeness: {
        Args: { santri_id_param: string }
        Returns: {
          completeness_percentage: number
          total_required: number
          total_uploaded: number
          total_valid: number
        }[]
      }
      get_document_verification_history: {
        Args: { dokumen_id_param: string }
        Returns: {
          action: string
          catatan: string
          id: string
          new_status: string
          old_status: string
          performed_at: string
          performed_by: string
        }[]
      }
      get_dokumen_kelengkapan: {
        Args: { santri_id_param: string } | { santri_id_param: string }
        Returns: {
          dokumen_ada: number
          persentase_kelengkapan: number
          total_dokumen: number
        }[]
      }
      get_required_documents: {
        Args: {
          santri_kategori_param: string
          tanggal_lahir_param: string
          wali_hubungan_param?: string
        }
        Returns: {
          description: string
          is_required: boolean
          jenis_dokumen: string
        }[]
      }
      get_required_documents_v2: {
        Args: {
          alamat_param?: string
          santri_kategori_param: string
          status_sosial_param: string
          tanggal_lahir_param: string
          wali_hubungan_param?: string
        }
        Returns: {
          description: string
          is_required: boolean
          kategori: string
          kode_dokumen: string
          nama_dokumen: string
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      verify_document: {
        Args: {
          catatan_param?: string
          dokumen_id: string
          status_param: string
        }
        Returns: Json
      }
    }
    Enums: {
      app_role: "admin" | "pengurus" | "santri"
      dokumen_status: "Ada" | "Tidak Ada" | "Dalam Proses"
      santri_jenis: "Mukim" | "Non-Mukim"
      santri_program: "TPQ" | "Madin"
      santri_status: "Aktif" | "Non-Aktif" | "Alumni"
      status_sosial: "Yatim" | "Piatu" | "Yatim Piatu" | "Lengkap"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "pengurus", "santri"],
      dokumen_status: ["Ada", "Tidak Ada", "Dalam Proses"],
      santri_jenis: ["Mukim", "Non-Mukim"],
      santri_program: ["TPQ", "Madin"],
      santri_status: ["Aktif", "Non-Aktif", "Alumni"],
      status_sosial: ["Yatim", "Piatu", "Yatim Piatu", "Lengkap"],
    },
  },
} as const