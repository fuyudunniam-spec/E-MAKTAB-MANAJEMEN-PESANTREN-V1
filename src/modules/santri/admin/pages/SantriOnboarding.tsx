// Santri Onboarding Page - Step-by-step profile completion guide
import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { SantriOnboardingService, type RegistrationStep, type SantriRegistrationData } from '@/modules/santri/services/santriOnboarding.service';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Loader2,
  CheckCircle2,
  Circle,
  User,
  Users,
  FileText,
  ArrowRight,
  ArrowLeft,
  AlertCircle,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { toast } from 'sonner';
import PersonalStep from '@/modules/psb/components/forms/PersonalStep';
import WaliStep from '@/modules/psb/components/forms/WaliStep';
import DokumenSantriTab from '@/modules/santri/components/DokumenSantriTab';
import { SantriData, WaliData } from '@/modules/santri/types/santri.types';

const SantriOnboarding: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const santriId = searchParams.get('santriId') || user?.santriId;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [completionStatus, setCompletionStatus] = useState<ProfileCompletionStatus | null>(null);
  const [currentStep, setCurrentStep] = useState<'info' | 'wali' | 'documents'>('info');
  const [santriData, setSantriData] = useState<any>(null);
  const [waliData, setWaliData] = useState<WaliData[]>([]);
  const [formSantriData, setFormSantriData] = useState<any>({});

  useEffect(() => {
    if (!santriId) {
      toast.error('ID Santri tidak ditemukan');
      navigate('/auth');
      return;
    }

    loadData();
  }, [santriId]);

  const loadData = async () => {
    if (!santriId) return;

    setLoading(true);
    try {
      // Load santri data
      const { data: santri, error: santriError } = await supabase
        .from('santri')
        .select('*')
        .eq('id', santriId)
        .single();

      if (santriError) throw santriError;

      setSantriData(santri);
      setFormSantriData(santri);

      // Load wali data
      const { data: wali, error: waliError } = await supabase
        .from('santri_wali')
        .select('*')
        .eq('santri_id', santriId)
        .order('is_utama', { ascending: false });

      if (!waliError && wali) {
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

      // Check completion status
      const status = await SantriOnboardingService.checkProfileCompletion(santriId);
      setCompletionStatus(status);

      // Determine current step
      if (status.missingFields.some(f => f.category === 'Data Pribadi' && f.severity === 'critical')) {
        setCurrentStep('info');
      } else if (status.missingWali) {
        setCurrentStep('wali');
      } else if (status.missingDocuments.length > 0) {
        setCurrentStep('documents');
      } else {
        setCurrentStep('info'); // Default to info if all complete
      }
    } catch (error: any) {
      console.error('Error loading data:', error);
      toast.error('Gagal memuat data: ' + (error.message || 'Terjadi kesalahan'));
    } finally {
      setLoading(false);
    }
  };

  const handleSaveInfo = async () => {
    if (!santriId) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('santri')
        .update(formSantriData)
        .eq('id', santriId);

      if (error) throw error;

      toast.success('Data pribadi berhasil disimpan');
      await loadData(); // Reload to check completion
    } catch (error: any) {
      console.error('Error saving info:', error);
      toast.error('Gagal menyimpan data: ' + (error.message || 'Terjadi kesalahan'));
    } finally {
      setSaving(false);
    }
  };

  const handleSaveWali = async () => {
    if (!santriId) return;

    setSaving(true);
    try {
      // Delete existing wali
      await supabase.from('santri_wali').delete().eq('santri_id', santriId);

      // Insert new wali
      const waliPayload = waliData.map(wali => {
        const { id, ...waliWithoutId } = wali;
        return { ...waliWithoutId, santri_id: santriId };
      });

      const { error } = await supabase
        .from('santri_wali')
        .insert(waliPayload);

      if (error) throw error;

      toast.success('Data wali berhasil disimpan');
      await loadData(); // Reload to check completion
    } catch (error: any) {
      console.error('Error saving wali:', error);
      toast.error('Gagal menyimpan data wali: ' + (error.message || 'Terjadi kesalahan'));
    } finally {
      setSaving(false);
    }
  };

  const handleComplete = async () => {
    // Re-check completion
    if (!santriId) return;

    const status = await SantriOnboardingService.checkProfileCompletion(santriId);
    setCompletionStatus(status);

    if (status.isComplete) {
      toast.success('Selamat! Profil Anda sudah lengkap.');
      setTimeout(() => {
        navigate(`/santri/profile?santriId=${santriId}&santriName=${encodeURIComponent(santriData?.nama_lengkap || 'Santri')}`);
      }, 1500);
    } else {
      toast.warning('Masih ada data yang perlu dilengkapi');
    }
  };

  const getStepStatus = (step: 'info' | 'wali' | 'documents') => {
    if (!completionStatus) return 'pending';

    if (step === 'info') {
      const hasCriticalMissing = completionStatus.missingFields.some(
        f => f.category === 'Data Pribadi' && f.severity === 'critical'
      );
      return hasCriticalMissing ? 'incomplete' : 'complete';
    }

    if (step === 'wali') {
      return completionStatus.missingWali ? 'incomplete' : 'complete';
    }

    if (step === 'documents') {
      const hasRequiredMissing = completionStatus.missingDocuments.some(d => d.required);
      return hasRequiredMissing ? 'incomplete' : 'complete';
    }

    return 'pending';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-primary/5 via-white to-background">
        <div className="text-center space-y-4">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">Memuat data onboarding...</p>
        </div>
      </div>
    );
  }

  if (!santriId || !santriData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-primary/5 via-white to-background">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <AlertCircle className="w-12 h-12 mx-auto text-destructive" />
              <div>
                <h3 className="text-lg font-semibold">Data Santri Tidak Ditemukan</h3>
                <p className="text-sm text-muted-foreground mt-2">
                  Silakan hubungi administrator untuk mendapatkan akses.
                </p>
              </div>
              <Button onClick={() => navigate('/auth')}>Kembali ke Login</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const infoStatus = getStepStatus('info');
  const waliStatus = getStepStatus('wali');
  const docsStatus = getStepStatus('documents');

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/5 via-white to-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Selamat Datang!</h1>
              <p className="text-muted-foreground mt-2">
                Lengkapi profil Anda untuk mulai menggunakan aplikasi
              </p>
            </div>
            {completionStatus?.canSkipOnboarding && (
              <Button
                variant="outline"
                onClick={() => navigate(`/santri/profile?santriId=${santriId}`)}
              >
                Lewati untuk Sekarang
              </Button>
            )}
          </div>

          {/* Progress Bar */}
          {completionStatus && (
            <Card className="mb-6">
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Progres Profil</span>
                    <span className="text-sm font-bold text-primary">
                      {completionStatus.completionPercentage}%
                    </span>
                  </div>
                  <Progress value={completionStatus.completionPercentage} className="h-3" />
                  {completionStatus.completionPercentage < 100 && (
                    <p className="text-xs text-muted-foreground">
                      {completionStatus.nextSteps[0]}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Steps Indicator */}
          <div className="flex items-center justify-between mb-6">
            {[
              { id: 'info', label: 'Informasi Dasar', icon: User },
              { id: 'wali', label: 'Data Wali', icon: Users },
              { id: 'documents', label: 'Dokumen', icon: FileText },
            ].map((step, index) => {
              const Icon = step.icon;
              const status = getStepStatus(step.id as 'info' | 'wali' | 'documents');
              const isActive = currentStep === step.id;

              return (
                <React.Fragment key={step.id}>
                  <div className="flex flex-col items-center flex-1">
                    <button
                      onClick={() => setCurrentStep(step.id as 'info' | 'wali' | 'documents')}
                      className={`
                        relative flex items-center justify-center w-12 h-12 rounded-full border-2 transition-all
                        ${isActive
                          ? 'border-primary bg-primary text-white scale-110'
                          : status === 'complete'
                            ? 'border-green-500 bg-green-500 text-white'
                            : 'border-muted bg-background text-muted-foreground hover:border-primary/50'
                        }
                      `}
                    >
                      {status === 'complete' ? (
                        <CheckCircle2 className="w-6 h-6" />
                      ) : (
                        <Icon className="w-6 h-6" />
                      )}
                    </button>
                    <span className={`text-xs mt-2 text-center ${isActive ? 'font-semibold text-primary' : 'text-muted-foreground'}`}>
                      {step.label}
                    </span>
                  </div>
                  {index < 2 && (
                    <div className={`flex-1 h-0.5 mx-2 ${status === 'complete' ? 'bg-green-500' : 'bg-muted'}`} />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        {/* Step Content */}
        <Card>
          <CardHeader>
            <CardTitle>
              {currentStep === 'info' && 'Informasi Pribadi'}
              {currentStep === 'wali' && 'Data Wali'}
              {currentStep === 'documents' && 'Dokumen Wajib'}
            </CardTitle>
            <CardDescription>
              {currentStep === 'info' && 'Lengkapi informasi dasar Anda'}
              {currentStep === 'wali' && 'Tambahkan data wali atau orang tua'}
              {currentStep === 'documents' && 'Upload dokumen-dokumen yang diperlukan'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Info Step */}
            {currentStep === 'info' && (
              <div className="space-y-6">
                {completionStatus?.missingFields
                  .filter(f => f.category === 'Data Pribadi')
                  .map(field => (
                    <Alert key={field.key} variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        <strong>{field.label}</strong> wajib diisi
                      </AlertDescription>
                    </Alert>
                  ))}

                {/* Info tentang status sosial mempengaruhi dokumen */}
                {formSantriData?.kategori?.includes('Binaan') && (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Catatan:</strong> Status sosial yang Anda pilih akan menentukan dokumen wajib yang perlu diupload di langkah berikutnya.
                    </AlertDescription>
                  </Alert>
                )}

                <PersonalStep
                  santriData={formSantriData}
                  onChange={(data) => setFormSantriData(prev => ({ ...prev, ...data }))}
                  isBinaan={santriData?.kategori?.includes('Binaan') || false}
                  isMukim={santriData?.kategori?.includes('Mukim') || false}
                />

                <div className="flex justify-between pt-4 border-t">
                  <Button
                    variant="outline"
                    onClick={() => {
                      if (completionStatus?.canSkipOnboarding) {
                        navigate(`/santri/profile?santriId=${santriId}`);
                      } else {
                        toast.warning('Lengkapi data wajib terlebih dahulu');
                      }
                    }}
                  >
                    Lewati
                  </Button>
                  <Button
                    onClick={handleSaveInfo}
                    disabled={saving}
                  >
                    {saving ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Menyimpan...
                      </>
                    ) : (
                      <>
                        Simpan & Lanjutkan
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}

            {/* Wali Step */}
            {currentStep === 'wali' && (
              <div className="space-y-6">
                {completionStatus?.missingWali && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Data wali utama wajib diisi
                    </AlertDescription>
                  </Alert>
                )}

                <WaliStep
                  waliData={waliData}
                  onChange={setWaliData}
                  isBinaan={santriData?.kategori?.includes('Binaan') || false}
                  isMukim={santriData?.kategori?.includes('Mukim') || false}
                />

                <div className="flex justify-between pt-4 border-t">
                  <Button
                    variant="outline"
                    onClick={() => setCurrentStep('info')}
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Kembali
                  </Button>
                  <Button
                    onClick={handleSaveWali}
                    disabled={saving}
                  >
                    {saving ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Menyimpan...
                      </>
                    ) : (
                      <>
                        Simpan & Lanjutkan
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}

            {/* Documents Step */}
            {currentStep === 'documents' && (
              <div className="space-y-6">
                {completionStatus?.missingDocuments.length > 0 && (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Dokumen wajib yang belum diupload:</strong>
                      <ul className="list-disc list-inside mt-2">
                        {completionStatus.missingDocuments
                          .filter(d => d.required)
                          .slice(0, 5)
                          .map((doc, idx) => (
                            <li key={idx}>{doc.jenis_dokumen}</li>
                          ))}
                      </ul>
                    </AlertDescription>
                  </Alert>
                )}

                <DokumenSantriTab
                  key={`dokumen-${formSantriData?.status_sosial || santriData?.status_sosial || 'default'}-${formSantriData?.kategori || santriData?.kategori || 'default'}`}
                  santriId={santriId}
                  santriData={{
                    // Gunakan formSantriData.status_sosial jika ada (perubahan belum disimpan)
                    // Fallback ke santriData.status_sosial jika belum diubah
                    status_sosial: (formSantriData?.status_sosial || santriData?.status_sosial) as any || 'Lengkap',
                    nama_lengkap: formSantriData?.nama_lengkap || santriData?.nama_lengkap || '',
                    kategori: formSantriData?.kategori || santriData?.kategori || 'Reguler',
                  }}
                  isBantuanRecipient={(formSantriData?.kategori || santriData?.kategori)?.includes('Binaan') || false}
                  mode="edit"
                />

                <div className="flex justify-between pt-4 border-t">
                  <Button
                    variant="outline"
                    onClick={() => setCurrentStep('wali')}
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Kembali
                  </Button>
                  <Button
                    onClick={handleComplete}
                    disabled={saving}
                    className="bg-primary hover:bg-primary/90"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Memeriksa...
                      </>
                    ) : completionStatus?.isComplete ? (
                      <>
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Selesai
                      </>
                    ) : (
                      <>
                        Periksa Kelengkapan
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SantriOnboarding;

