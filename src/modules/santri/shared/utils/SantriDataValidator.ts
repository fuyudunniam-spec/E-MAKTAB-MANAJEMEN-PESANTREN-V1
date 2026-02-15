// Santri Data Validator - Validates cross-module data consistency
import { supabase } from "@/integrations/supabase/client";
import { ProfileHelper } from "@/modules/santri/shared/utils/profile.helper";

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  summary: ValidationSummary;
}

export interface ValidationError {
  module: string;
  field: string;
  message: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  suggestion?: string;
}

export interface ValidationWarning {
  module: string;
  field: string;
  message: string;
  suggestion?: string;
}

export interface ValidationSummary {
  total_checks: number;
  passed: number;
  failed: number;
  warnings: number;
  score: number; // 0-100
}

interface ValidationCounters {
  total: number;
  passed: number;
}

export class SantriDataValidator {
  /**
   * Validate santri data consistency across all modules
   */
  static async validateSantriData(santriId: string): Promise<ValidationResult> {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    const counters: ValidationCounters = {
      total: 0,
      passed: 0
    };

    try {
      // Get santri basic data
      const { data: santriData, error: santriError } = await supabase
        .from('santri')
        .select('*')
        .eq('id', santriId)
        .single();

      if (santriError || !santriData) {
        errors.push({
          module: 'core',
          field: 'santri_id',
          message: 'Data santri tidak ditemukan',
          severity: 'critical'
        });
        return this.createValidationResult(errors, warnings, 0, 0);
      }

      // Run all validation checks
      await Promise.all([
        this.validateBasicData(santriData, errors, warnings, counters),
        this.validateAcademicData(santriId, santriData, errors, warnings, counters),
        this.validateFinancialData(santriId, santriData, errors, warnings, counters),
        this.validateDocumentData(santriId, santriData, errors, warnings, counters),
        this.validateWaliData(santriId, santriData, errors, warnings, counters)
      ]);

      const score = counters.total > 0 ? Math.round((counters.passed / counters.total) * 100) : 0;

      return this.createValidationResult(errors, warnings, counters.total, counters.passed, score);

    } catch (error) {
      console.error('Error validating santri data:', error);
      errors.push({
        module: 'system',
        field: 'validation',
        message: 'Terjadi kesalahan saat validasi data',
        severity: 'critical',
        suggestion: 'Coba lagi atau hubungi administrator'
      });
      return this.createValidationResult(errors, warnings, counters.total, counters.passed);
    }
  }

  /**
   * Validate basic santri data
   */
  private static async validateBasicData(
    santriData: any,
    errors: ValidationError[],
    warnings: ValidationWarning[],
    counters: ValidationCounters
  ) {
    const checks = [
      { field: 'nama_lengkap', required: true, message: 'Nama lengkap harus diisi' },
      { field: 'jenis_kelamin', required: true, message: 'Jenis kelamin harus diisi' },
      { field: 'kategori', required: true, message: 'Kategori santri harus diisi' },
      { field: 'status_santri', required: true, message: 'Status santri harus diisi' },
      { field: 'no_whatsapp', required: true, message: 'Nomor WhatsApp harus diisi' }
    ];

    checks.forEach(check => {
      counters.total++;
      if (!santriData[check.field] || santriData[check.field].trim() === '') {
        errors.push({
          module: 'core',
          field: check.field,
          message: check.message,
          severity: check.required ? 'high' : 'medium',
          suggestion: `Silakan lengkapi ${check.field}`
        });
      } else {
        counters.passed++;
      }
    });

    // Validate category-specific fields
    const requiredFields = ProfileHelper.getRequiredFields(santriData.kategori, santriData.status_sosial);
    requiredFields.forEach(field => {
      counters.total++;
      if (!santriData[field.key] || santriData[field.key].toString().trim() === '') {
        errors.push({
          module: 'core',
          field: field.key,
          message: `${field.label} wajib diisi untuk kategori ${santriData.kategori}`,
          severity: 'high',
          suggestion: `Lengkapi ${field.label}`
        });
      } else {
        counters.passed++;
      }
    });
  }

  /**
   * Validate academic data consistency
   */
  private static async validateAcademicData(
    santriId: string,
    santriData: any,
    errors: ValidationError[],
    warnings: ValidationWarning[],
    counters: ValidationCounters
  ) {
    const { data: kelasAnggotaData } = await supabase
      .from('kelas_anggota')
      .select(`
        id,
        status,
        tanggal_mulai,
        tanggal_selesai,
        kelas:kelas_id(
          id,
          nama_kelas,
          program,
          tingkat,
          tahun_ajaran,
          semester,
          status
        )
      `)
      .eq('santri_id', santriId)
      .eq('status', 'Aktif');

    counters.total++;
    if ((santriData.status_santri || santriData.status_baru) === 'Aktif' && (!kelasAnggotaData || kelasAnggotaData.length === 0)) {
      errors.push({
        module: 'academic',
        field: 'program_assignment',
        message: 'Santri aktif harus tergabung ke kelas aktif',
        severity: 'high',
        suggestion: 'Masukkan santri ke kelas melalui modul Ploating Kelas'
      });
    } else {
      counters.passed++;
    }

    // Validate program consistency
    if (kelasAnggotaData && kelasAnggotaData.length > 0) {
      kelasAnggotaData.forEach((kelas, index) => {
        counters.total++;
        if (!kelas.kelas) {
          errors.push({
            module: 'academic',
            field: `kelas_${index}`,
            message: 'Keanggotaan kelas harus terhubung ke data master kelas',
            severity: 'medium',
            suggestion: 'Perbaiki referensi kelas di modul Kelas Master'
          });
        } else {
          counters.passed++;
        }

        if (kelas.tanggal_mulai || kelas.tanggal_selesai) {
          counters.total++;
          if (kelas.tanggal_mulai && kelas.tanggal_selesai && new Date(kelas.tanggal_mulai) > new Date(kelas.tanggal_selesai)) {
            warnings.push({
              module: 'academic',
              field: `kelas_period_${index}`,
              message: 'Tanggal mulai kelas lebih besar daripada tanggal selesai',
              suggestion: 'Periksa kembali periode keanggotaan kelas'
            });
          } else {
            counters.passed++;
          }
        }
      });
    }
  }

  /**
   * Validate financial data consistency
   */
  private static async validateFinancialData(
    santriId: string,
    santriData: any,
    errors: ValidationError[],
    warnings: ValidationWarning[],
    counters: ValidationCounters
  ) {
    const [tagihanResult, pembayaranResult] = await Promise.all([
      supabase
        .from('tagihan_santri')
        .select('*')
        .eq('santri_id', santriId),
      supabase
        .from('pembayaran_santri')
        .select('*')
        .eq('santri_id', santriId)
    ]);

    // Validate payment consistency
    if (tagihanResult.data && tagihanResult.data.length > 0) {
      const totalTagihan = tagihanResult.data.reduce((sum, t) => sum + (t.total_tagihan || 0), 0);
      const totalPembayaran = pembayaranResult.data?.reduce((sum, p) => sum + (p.jumlah_bayar || 0), 0) || 0;

      counters.total++;
      if (totalPembayaran > totalTagihan) {
        warnings.push({
          module: 'financial',
          field: 'payment_overflow',
          message: 'Total pembayaran melebihi total tagihan',
          suggestion: 'Periksa kembali data pembayaran'
        });
      } else {
        counters.passed++;
      }
    }
  }

  /**
   * Validate document data completeness
   */
  private static async validateDocumentData(
    santriId: string,
    santriData: any,
    errors: ValidationError[],
    warnings: ValidationWarning[],
    counters: ValidationCounters
  ) {
    const requiredDocs = ProfileHelper.getRequiredDocuments(santriData.kategori, santriData.status_sosial);

    const { data: uploadedDocs } = await supabase
      .from('dokumen_santri')
      .select('*')
      .eq('santri_id', santriId);

    const dokumenWajibLengkap = requiredDocs.filter(reqDoc =>
      uploadedDocs?.some(uploaded => uploaded.jenis_dokumen === reqDoc.jenis_dokumen)
    ).length;

    counters.total++;
    if (dokumenWajibLengkap < requiredDocs.length) {
      const missingCount = requiredDocs.length - dokumenWajibLengkap;
      errors.push({
        module: 'documents',
        field: 'required_documents',
        message: `${missingCount} dokumen wajib belum diupload`,
        severity: 'medium',
        suggestion: 'Upload dokumen yang belum lengkap'
      });
    } else {
      counters.passed++;
    }

    // Check document verification status
    if (uploadedDocs && uploadedDocs.length > 0) {
      const unverifiedDocs = uploadedDocs.filter(doc => doc.status_verifikasi === 'Belum Diverifikasi');

      if (unverifiedDocs.length > 0) {
        warnings.push({
          module: 'documents',
          field: 'verification',
          message: `${unverifiedDocs.length} dokumen belum diverifikasi`,
          suggestion: 'Lakukan verifikasi dokumen'
        });
      }
    }
  }

  /**
   * Validate wali data
   */
  private static async validateWaliData(
    santriId: string,
    santriData: any,
    errors: ValidationError[],
    warnings: ValidationWarning[],
    counters: ValidationCounters
  ) {
    const { data: waliData } = await supabase
      .from('santri_wali')
      .select('*')
      .eq('santri_id', santriId);

    counters.total++;
    if (!waliData || waliData.length === 0) {
      errors.push({
        module: 'wali',
        field: 'wali_data',
        message: 'Data wali harus diisi',
        severity: 'high',
        suggestion: 'Tambah data wali santri'
      });
    } else {
      counters.passed++;

      // Check for main wali
      const mainWali = waliData.find(wali => wali.is_utama);
      if (!mainWali) {
        warnings.push({
          module: 'wali',
          field: 'main_wali',
          message: 'Tidak ada wali utama yang ditetapkan',
          suggestion: 'Tetapkan salah satu wali sebagai wali utama'
        });
      }

      // Check contact information
      const waliWithoutContact = waliData.filter(wali => !wali.no_whatsapp && !wali.no_telepon);
      counters.total++;
      if (waliWithoutContact.length > 0) {
        warnings.push({
          module: 'wali',
          field: 'contact_info',
          message: 'Beberapa wali tidak memiliki kontak',
          suggestion: 'Lengkapi informasi kontak wali'
        });
      } else {
        counters.passed++;
      }
    }
  }

  /**
   * Create validation result object
   */
  private static createValidationResult(
    errors: ValidationError[],
    warnings: ValidationWarning[],
    totalChecks: number,
    passedChecks: number,
    score?: number
  ): ValidationResult {
    const calculatedScore = score !== undefined ? score : (totalChecks > 0 ? Math.round((passedChecks / totalChecks) * 100) : 0);

    return {
      isValid: errors.filter(e => e.severity === 'critical' || e.severity === 'high').length === 0,
      errors,
      warnings,
      summary: {
        total_checks: totalChecks,
        passed: passedChecks,
        failed: totalChecks - passedChecks,
        warnings: warnings.length,
        score: calculatedScore
      }
    };
  }

  /**
   * Get validation recommendations based on results
   */
  static getValidationRecommendations(result: ValidationResult): string[] {
    const recommendations: string[] = [];

    if (result.summary.score < 70) {
      recommendations.push('Data santri memerlukan perhatian segera. Silakan perbaiki error yang ada.');
    }

    const criticalErrors = result.errors.filter(e => e.severity === 'critical');
    if (criticalErrors.length > 0) {
      recommendations.push('Terdapat error kritis yang harus segera diperbaiki.');
    }

    const highErrors = result.errors.filter(e => e.severity === 'high');
    if (highErrors.length > 0) {
      recommendations.push('Lengkapi data yang wajib diisi untuk kategori santri ini.');
    }

    if (result.warnings.length > 0) {
      recommendations.push('Periksa warning yang ada untuk meningkatkan kualitas data.');
    }

    if (result.summary.score >= 90) {
      recommendations.push('Data santri sudah sangat baik! Tetap jaga konsistensi data.');
    }

    return recommendations;
  }
}

export default SantriDataValidator;

