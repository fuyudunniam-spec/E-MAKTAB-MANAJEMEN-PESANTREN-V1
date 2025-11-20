import { useEffect, useState, useMemo } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { 
  ArrowLeft, 
  Award, 
  BookOpen, 
  HandCoins, 
  User, 
  Users, 
  GraduationCap, 
  FileText, 
  Calendar, 
  Phone, 
  MapPin, 
  Mail,
  Edit, 
  AlertCircle,
  AlertTriangle,
  CreditCard,
  TrendingUp,
  DollarSign,
  Clock,
  CheckCircle,
  XCircle,
  Settings,
  Plus,
  Eye,
  Download,
  Upload,
  UserCheck,
  MoreVertical,
  MoreHorizontal,
  Shield,
  Activity,
  BarChart3,
  PieChart,
  Target,
  Zap,
  Star,
  Heart,
  Globe,
  Lock,
  Unlock,
  ChevronRight,
  Info,
  ExternalLink,
  Check,
  X,
  Loader2
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { formatDate, formatRupiah } from "@/utils/inventaris.utils";
import { getSafeAvatarUrl } from '@/utils/url.utils';
import { calculateAge } from '@/lib/utils';
import { toast } from 'sonner';
import DokumenSantriTab from "@/components/DokumenSantriTab";
import BantuanYayasanTab from "@/components/BantuanYayasanTab";
import SantriFormWizard from "@/components/SantriFormWizard";
import SantriSettingsPanel from "@/components/SantriSettingsPanel";
import SantriDataAggregator from "@/components/SantriDataAggregator";
import SantriDataValidationPanel from "@/components/SantriDataValidationPanel";
import SantriProgressTracking from "@/components/SantriProgressTracking";
import { ProfileHelper } from "@/utils/profile.helper";

interface SantriData {
  id: string;
  nis?: string;
  nama_lengkap: string;
  tempat_lahir?: string;
  tanggal_lahir?: string;
  jenis_kelamin: string;
  kategori: string;
  tipe_pembayaran: string;
  status_santri: string;
  status_approval: string;
  status_sosial?: string;
  alamat?: string;
  no_whatsapp?: string;
  foto_profil?: string;
  created_at?: string;
  updated_at?: string;
  // Extended fields
  nama_sekolah?: string;
  kelas?: string;
  kelas_sekolah?: string;
  nomor_wali_kelas?: string;
  // Formal education fields
  jenjang_formal?: string;
  kelas_formal?: string;
  // Additional fields
  id_santri?: string;
  nik?: string;
  nisn?: string;
  status_baru?: string;
  golongan_darah?: string;
  tinggi_badan?: number;
  berat_badan?: number;
  riwayat_penyakit?: string;
  alergi?: string;
  kondisi_khusus?: string;
  pernah_rawat_inap?: boolean;
  disabilitas_khusus?: string;
  obat_khusus?: string;
  keterangan_rawat_inap?: string;
  // Binaan fields
  anak_ke?: number;
  jumlah_saudara?: number;
  hobi?: string;
  cita_cita?: string;
  // Related data
  wali_data?: any[];
  program_data?: any[];
  financial_summary?: {
    total_bantuan: number;
    total_tagihan: number;
    total_pembayaran: number;
    saldo_tabungan: number;
  };
}

// Inline Editable Field Component
const InlineEditableField = ({ 
  label, 
  value, 
  fieldName,
  santriId,
  onUpdate,
  type = 'text',
  placeholder = 'Klik untuk edit',
  disabled = false
}: {
  label: string;
  value: string | number | undefined;
  fieldName: string;
  santriId: string;
  onUpdate: (field: string, newValue: any) => Promise<void>;
  type?: 'text' | 'number' | 'date' | 'textarea';
  placeholder?: string;
  disabled?: boolean;
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value || '');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setEditValue(value || '');
  }, [value]);

  const handleSave = async () => {
    if (editValue === value || disabled) {
      setIsEditing(false);
      return;
    }

    setSaving(true);
    try {
      await onUpdate(fieldName, editValue || null);
      setIsEditing(false);
      toast.success(`${label} berhasil diperbarui`);
    } catch (error: any) {
      toast.error(`Gagal memperbarui ${label}: ${error.message}`);
      setEditValue(value || '');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setEditValue(value || '');
    setIsEditing(false);
  };

  if (disabled) {
    return (
      <div className="flex items-center justify-between py-2 px-3 rounded border border-slate-200 bg-slate-50">
        <div className="flex-1 min-w-0">
          <p className="text-sm text-slate-600 mb-0.5">{label}</p>
          <p className="font-medium text-slate-900 truncate">
            {value || <span className="text-slate-400 italic">{placeholder}</span>}
          </p>
        </div>
      </div>
    );
  }

  if (isEditing) {
    return (
      <div className="flex items-center gap-2 py-2 px-3 rounded border border-blue-300 bg-blue-50">
        {type === 'textarea' ? (
          <Textarea
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            className="flex-1 min-h-[60px]"
            autoFocus
            disabled={saving}
          />
        ) : (
          <Input
            type={type}
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            className="flex-1"
            autoFocus
            disabled={saving}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSave();
              if (e.key === 'Escape') handleCancel();
            }}
          />
        )}
        <Button size="sm" onClick={handleSave} disabled={saving}>
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
        </Button>
        <Button size="sm" variant="ghost" onClick={handleCancel} disabled={saving}>
          <X className="w-4 h-4" />
        </Button>
      </div>
    );
  }

  return (
    <div 
      className="group flex items-center justify-between py-2 px-3 rounded border border-slate-200 hover:border-blue-300 hover:bg-blue-50/50 cursor-pointer transition-colors"
      onClick={() => setIsEditing(true)}
    >
      <div className="flex-1 min-w-0">
        <p className="text-sm text-slate-600 mb-0.5">{label}</p>
        <p className="font-medium text-slate-900 truncate">
          {value || <span className="text-slate-400 italic">{placeholder}</span>}
        </p>
      </div>
      <Edit className="w-4 h-4 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 ml-2" />
    </div>
  );
};

// Modern Info Card Component - Compact Version
const ModernInfoCard = ({ 
  icon: Icon, 
  iconColor, 
  iconBg, 
  label, 
  value, 
  badge,
  trend,
  subtitle,
  action
}: {
  icon: any;
  iconColor: string;
  iconBg: string;
  label: string;
  value: string | React.ReactNode;
  badge?: React.ReactNode;
  trend?: { value: string; positive: boolean };
  subtitle?: string;
  action?: React.ReactNode;
}) => (
  <div className="group border rounded-lg p-3 bg-white hover:shadow-md transition-all duration-200">
    <div className="flex items-start gap-3">
      <div className={`p-2 ${iconBg} rounded-lg flex-shrink-0`}>
        <Icon className={`w-4 h-4 ${iconColor}`} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium text-slate-600 mb-1">{label}</p>
        <div className="flex items-center gap-2 flex-wrap">
          {typeof value === 'string' ? (
            <p className="font-semibold text-slate-900 text-sm truncate">{value}</p>
          ) : (
            <div className="font-semibold text-slate-900 text-sm">{value}</div>
          )}
          {badge}
        </div>
        {subtitle && (
          <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>
        )}
        {trend && (
          <div className={`flex items-center gap-1 mt-1 text-xs ${trend.positive ? 'text-green-600' : 'text-red-600'}`}>
            <TrendingUp className="w-3 h-3" />
            <span>{trend.value}</span>
          </div>
        )}
      </div>
      {action && (
        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
          {action}
        </div>
      )}
    </div>
  </div>
);

// Status Badge Component
const StatusBadge = ({ status, type }: { status: string; type: 'primary' | 'success' | 'warning' | 'danger' | 'info' }) => {
  const variants = {
    primary: 'bg-blue-100 text-blue-800 border-blue-200',
    success: 'bg-green-100 text-green-800 border-green-200',
    warning: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    danger: 'bg-red-100 text-red-800 border-red-200',
    info: 'bg-slate-100 text-slate-800 border-slate-200'
  };

  return (
    <Badge className={`${variants[type]} text-xs px-3 py-1 font-medium`}>
      {status}
    </Badge>
  );
};

// Quick Stats Component
const QuickStats = ({ santri, financialSummary, programData }: { santri: SantriData; financialSummary: any; programData: any[] }) => {
  const hasActiveClass = programData && programData.length > 0;
  const activeClassNames = hasActiveClass
    ? programData
        .map((program) => program.kelas_program)
        .filter((name: string | null | undefined) => !!name)
        .slice(0, 2)
        .join(', ')
    : undefined;

  return (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
    <ModernInfoCard
      icon={User}
      iconColor="text-blue-600"
      iconBg="bg-blue-100"
      label="Status Santri"
      value={santri.status_santri || (santri as any).status_baru}
      badge={<StatusBadge status={santri.status_santri || (santri as any).status_baru} type="success" />}
      subtitle={`Bergabung ${formatDate(santri.created_at || '')}`}
    />
    
    <ModernInfoCard
      icon={BookOpen}
      iconColor="text-emerald-600"
      iconBg="bg-emerald-100"
      label="Status Kelas"
      value={hasActiveClass ? 'Aktif' : 'Belum ditempatkan'}
      subtitle={hasActiveClass ? (activeClassNames || 'Terdaftar pada kelas aktif') : 'Butuh penempatan kelas'}
    />
    
    {/* Finance-related fields */}
    {santri.jenjang_formal && (
      <ModernInfoCard
        icon={BookOpen}
        iconColor="text-green-600"
        iconBg="bg-green-100"
        label="Jenjang Formal"
        value={santri.jenjang_formal}
        subtitle={santri.kelas_formal ? `Kelas ${santri.kelas_formal}` : 'Kelas tidak ditentukan'}
      />
    )}
    
    <ModernInfoCard
      icon={DollarSign}
      iconColor="text-purple-600"
      iconBg="bg-purple-100"
      label="Saldo Tabungan"
      value={formatRupiah(financialSummary?.saldo_tabungan || 0)}
      subtitle="Total tabungan"
      trend={financialSummary?.saldo_tabungan > 0 ? { value: '+5%', positive: true } : undefined}
    />
  </div>
);
};

// Profile Header Component
const ProfileHeader = ({ santri, onEditProfile }: { santri: SantriData; onEditProfile: () => void }) => {
  const generateInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const isBantuanRecipient = useMemo(() => 
    santri?.tipe_pembayaran === 'Bantuan Yayasan', 
    [santri?.tipe_pembayaran]
  );

  return (
    <Card className="border shadow-sm bg-white">
      <CardContent className="p-4 lg:p-6">
        <div className="flex flex-col lg:flex-row items-start lg:items-center gap-4 lg:gap-6">
          {/* Avatar Section */}
          <div className="relative flex-shrink-0">
            <Avatar className="w-20 h-20 lg:w-24 lg:h-24 ring-2 ring-slate-200">
              <AvatarImage src={getSafeAvatarUrl(santri.foto_profil)} />
              <AvatarFallback className="text-lg font-bold bg-gradient-to-br from-slate-600 to-slate-800 text-white">
                {generateInitials(santri.nama_lengkap)}
              </AvatarFallback>
            </Avatar>
            {isBantuanRecipient && (
              <div className="absolute -top-1 -right-1 w-6 h-6 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full flex items-center justify-center shadow-md">
                <GraduationCap className="w-3 h-3 text-white" />
              </div>
            )}
          </div>
          
          {/* Profile Info */}
          <div className="flex-1 min-w-0 w-full">
            <div className="space-y-3">
              <div>
                <h1 className="text-2xl lg:text-3xl font-bold text-slate-900 mb-2 truncate">{santri.nama_lengkap}</h1>
                <div className="flex flex-wrap gap-2">
                  <StatusBadge status={santri.status_santri || (santri as any).status_baru} type="success" />
                  <StatusBadge status={santri.kategori} type="primary" />
                  {isBantuanRecipient && (
                    <StatusBadge status={santri.tipe_pembayaran} type="info" />
                  )}
                </div>
              </div>

              {/* Key Information */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                  <div className="p-1.5 bg-blue-100 rounded-lg">
                    <User className="w-4 h-4 text-blue-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-slate-600">ID Santri</p>
                    <p className="font-semibold text-slate-900 text-sm truncate">{santri.id_santri || 'Belum ada'}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                  <div className="p-1.5 bg-emerald-100 rounded-lg">
                    <Calendar className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-600">Umur</p>
                    <p className="font-semibold text-slate-900 text-sm">
                      {santri.tanggal_lahir ? `${calculateAge(santri.tanggal_lahir)} tahun` : '-'}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                  <div className="p-1.5 bg-amber-100 rounded-lg">
                    <Phone className="w-4 h-4 text-amber-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-slate-600">WhatsApp</p>
                    <p className="font-semibold text-slate-900 text-sm truncate">{santri.no_whatsapp || 'Belum ada'}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const SantriProfileMaster = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const santriId = searchParams.get("santriId") || undefined;
  const santriName = searchParams.get("santriName") || undefined;

  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(true);
  const [santri, setSantri] = useState<SantriData | null>(null);
  const [programData, setProgramData] = useState<any[]>([]);
  const [waliData, setWaliData] = useState<any[]>([]);
  const [financialSummary, setFinancialSummary] = useState<any>(null);
  const [comprehensiveSummary, setComprehensiveSummary] = useState<any>(null);
  const [editingSantri, setEditingSantri] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [editTab, setEditTab] = useState<string>('personal');
  const [absensiSummary, setAbsensiSummary] = useState<{
    total: number;
    statuses: Record<string, number>;
    lastDate?: string;
  } | null>(null);

  // Load comprehensive santri data
  const loadSantriData = async () => {
    if (!santriId) return;

    try {
      setLoading(true);

      // Load main santri data
      const { data: santriData, error: santriError } = await supabase
        .from('santri')
        .select('*')
        .eq('id', santriId)
        .single();

      if (santriError) throw santriError;

      // Load related data in parallel
      const absensiWindowStart = new Date();
      absensiWindowStart.setDate(absensiWindowStart.getDate() - 30);
      const absensiStartIso = absensiWindowStart.toISOString().split('T')[0];

      const [programsResult, waliResult, absensiResult] = await Promise.all([
        // Kelas data (new)
        supabase
          .from('kelas_anggota')
          .select(`
            id,
            tanggal_mulai,
            tanggal_selesai,
            status,
            kelas:kelas_id(id, nama_kelas, program, rombel, tingkat, tahun_ajaran, semester)
          `)
          .eq('santri_id', santriId)
          .eq('status', 'Aktif'),
        
        // Wali data
        supabase
          .from('santri_wali')
          .select('*')
          .eq('santri_id', santriId)
          .order('is_utama', { ascending: false })
        ,
        supabase
          .from('absensi_madin')
          .select('status, tanggal')
          .eq('santri_id', santriId)
          .gte('tanggal', absensiStartIso)
          .order('tanggal', { ascending: false })
      ]);

      if (programsResult.error) throw programsResult.error;
      if (waliResult.error) throw waliResult.error;
      if (absensiResult.error) throw absensiResult.error;

      console.log('🔍 Loading santri data:', {
        id: santriData.id,
        nama: santriData.nama_lengkap,
        nik: santriData.nik,
        nisn: santriData.nisn,
        hobi: santriData.hobi,
        cita_cita: santriData.cita_cita,
        id_santri: santriData.id_santri
      });
      
      setSantri(santriData);
      const mapped = (programsResult.data || []).map((row: any) => ({
        id: row.id,
        kelas_program: row.kelas?.nama_kelas || '-',
        rombel: row.kelas?.rombel || null,
        tingkat: row.kelas?.tingkat || null,
        tanggal_mulai: row.tanggal_mulai || null,
        tanggal_selesai: row.tanggal_selesai || null,
        total_biaya_final: 0,
        subsidi_persen: 0,
        status_kelas: row.status || 'Aktif',
      }));
      setProgramData(mapped);
      setWaliData(waliResult.data || []);

      const absensiData = absensiResult.data || [];
      const statusCounts = absensiData.reduce((acc: Record<string, number>, item: any) => {
        const key = item.status || 'Tidak diketahui';
        acc[key] = (acc[key] || 0) + 1;
        return acc;
      }, {});
      setAbsensiSummary({
        total: absensiData.length,
        statuses: statusCounts,
        lastDate: absensiData[0]?.tanggal || undefined
      });

      // Load comprehensive summary using aggregator
      try {
        const summary = await SantriDataAggregator.getComprehensiveSummary(
          santriId, 
          santriData.kategori, 
          santriData.status_sosial
        );
        setComprehensiveSummary(summary);
        setFinancialSummary(summary.financial);
      } catch (error) {
        console.error('Error loading comprehensive summary:', error);
        // Fallback to basic financial data
        const basicFinancial = {
          total_bantuan: 0,
          total_tagihan: 0,
          total_pembayaran: 0,
          saldo_tabungan: 0,
          hutang_bulanan: 0,
          status_pembayaran: 'belum_bayar'
        };
        setFinancialSummary(basicFinancial);
      }
    } catch (error) {
      console.error('Error loading santri data:', error);
      toast.error('Gagal memuat data santri');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSantriData();
  }, [santriId]);

  // Handle update field function
  const handleUpdateField = async (fieldName: string, value: any) => {
    if (!santriId) return;
    
    try {
      const updateData: any = { [fieldName]: value };
      
      // Handle date fields
      if (fieldName === 'tanggal_lahir' && value) {
        updateData[fieldName] = new Date(value).toISOString();
      }
      
      // Handle number fields
      if (fieldName === 'anak_ke' || fieldName === 'jumlah_saudara' || fieldName === 'tinggi_badan' || fieldName === 'berat_badan') {
        updateData[fieldName] = value ? parseInt(value) : null;
      }
      
      const { error } = await supabase
        .from('santri')
        .update(updateData)
        .eq('id', santriId);
      
      if (error) throw error;
      
      // Update local state
      setSantri((prev: any) => ({
        ...prev,
        [fieldName]: value
      }));
      
      // Reload data to ensure consistency
      await loadSantriData();
    } catch (error: any) {
      console.error('Error updating field:', error);
      throw error;
    }
  };

  // Memoized calculations
  const isBantuanRecipient = useMemo(() => 
    santri?.tipe_pembayaran === 'Bantuan Yayasan' || santri?.kategori?.includes('Binaan'), 
    [santri?.tipe_pembayaran, santri?.kategori]
  );

  const { user } = useAuth();
  const isCurrentUserSantri = useMemo(() => {
    if (!user || !santri) return false;
    // Check if current user is viewing their own profile
    return user.id === santri.id;
  }, [user, santri]);

  const academicSummary = useMemo(() => comprehensiveSummary?.academic, [comprehensiveSummary]);

  const availableTabs = useMemo(() => {
    if (!santri) return ['overview', 'academic', 'financial', 'documents'];
    return ProfileHelper.getAvailableTabs(santri.kategori, santri.tipe_pembayaran);
  }, [santri?.kategori, santri?.tipe_pembayaran]);

  const progressProgramOptions = useMemo(() => {
    if (!programData || programData.length === 0) return undefined;

    const options: { value: 'TPQ' | 'Tahfid' | 'Tahsin'; label: string }[] = [];

    const hasIqra = programData.some((program) => (program.kelas_program || '').toLowerCase().includes("iqra"));
    const hasHafalan = programData.some((program) => {
      const name = (program.kelas_program || '').toLowerCase();
      return name.includes("hafalan") || name.includes("surat pendek");
    });

    if (hasIqra) {
      options.push({ value: 'TPQ', label: "Iqra'" });
    }
    if (hasHafalan) {
      options.push({ value: 'Tahfid', label: 'Hafalan Surat Pendek' });
    }

    return options.length > 0 ? options : undefined;
  }, [programData]);

  const navigateToTabungan = (view?: 'riwayat' | 'withdraw') => {
    if (!santriId) return;
    const params = new URLSearchParams();
    params.set('tab', 'daftar-santri');
    params.set('santriId', santriId);
    if (view) {
      params.set('view', view);
    }
    if (santri?.nama_lengkap) {
      params.set('santriName', santri.nama_lengkap);
    }
    navigate(`/tabungan-santri?${params.toString()}`);
  };

  if (loading) {
    return (
      <div className="p-6 lg:p-8">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground text-lg">Memuat profil santri...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!santri) {
    return (
      <div className="p-6 lg:p-8">
        <div className="text-center py-12">
          <User className="w-20 h-20 text-muted-foreground mx-auto mb-6" />
          <h3 className="text-2xl font-semibold mb-4">Santri tidak ditemukan</h3>
          <p className="text-muted-foreground mb-6">Data santri dengan ID tersebut tidak tersedia</p>
          <Button onClick={() => navigate('/santri')} size="lg">
            <ArrowLeft className="w-5 h-5 mr-2" />
            Kembali ke Data Santri
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6 space-y-4 animate-fade-in max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => navigate('/santri')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Kembali
          </Button>
          <div>
            <h1 className="text-3xl lg:text-4xl font-bold text-foreground flex items-center gap-3">
              <User className="w-8 h-8 text-primary" />
              Profil Santri
            </h1>
            <p className="text-muted-foreground">
              Data master individual santri - sumber terpusat untuk semua modul
            </p>
          </div>
        </div>

        {/* Quick Actions */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="flex items-center gap-2">
              <MoreHorizontal className="w-4 h-4" />
              Aksi
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64">
            <DropdownMenuItem onClick={() => setShowForm(true)}>
              <Edit className="w-4 h-4 mr-2" />
              Edit Profil Lengkap
            </DropdownMenuItem>
            
            {/* Only show admin actions if current user is NOT santri */}
            {!isCurrentUserSantri && (
              <>
                {programData.length === 0 && (
                  <DropdownMenuItem onClick={() => navigate(`/ploating-kelas?santriId=${santriId}`)}>
                    <BookOpen className="w-4 h-4 mr-2" />
                    Tempatkan ke Program
                  </DropdownMenuItem>
                )}
                
                <DropdownMenuItem onClick={() => navigate('/keuangan')}>
                  <DollarSign className="w-4 h-4 mr-2" />
                  Kelola Keuangan
                </DropdownMenuItem>
              </>
            )}
            
            
            <DropdownMenuSeparator />
            
            <DropdownMenuItem onClick={() => navigate('/santri')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Kembali ke Daftar
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Profile Header */}
      <ProfileHeader 
        santri={santri} 
        onEditProfile={() => {
          setEditTab('personal');
          setShowForm(true);
          setEditingSantri(santriId);
        }}
      />

      {/* Quick Stats */}
      <QuickStats santri={santri} financialSummary={financialSummary} programData={programData} />

      {/* Main Content Tabs - 5 Tab Utama */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5 bg-white border shadow-sm rounded-lg p-1 h-auto">
          <TabsTrigger value="overview" className="flex items-center gap-2 text-xs sm:text-sm py-2.5">
            <BarChart3 className="w-4 h-4" />
            <span className="hidden sm:inline">Ringkasan</span>
          </TabsTrigger>
          <TabsTrigger value="personal" className="flex items-center gap-2 text-xs sm:text-sm py-2.5">
            <User className="w-4 h-4" />
            <span className="hidden sm:inline">Informasi Pribadi</span>
          </TabsTrigger>
          <TabsTrigger value="academic" className="flex items-center gap-2 text-xs sm:text-sm py-2.5">
            <BookOpen className="w-4 h-4" />
            <span className="hidden sm:inline">Akademik</span>
          </TabsTrigger>
          <TabsTrigger value="financial" className="flex items-center gap-2 text-xs sm:text-sm py-2.5">
            <DollarSign className="w-4 h-4" />
            <span className="hidden sm:inline">Keuangan</span>
          </TabsTrigger>
          <TabsTrigger value="monitoring" className="flex items-center gap-2 text-xs sm:text-sm py-2.5">
            <Shield className="w-4 h-4" />
            <span className="hidden sm:inline">Monitoring</span>
          </TabsTrigger>
        </TabsList>

        {/* Tab: Overview */}
        <TabsContent value="overview" className="space-y-4 mt-4">
          {/* Cross-Module Summary */}
          {comprehensiveSummary && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              <Card className="border shadow-sm bg-gradient-to-br from-blue-50 to-blue-100">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-blue-700">Status Akademik</p>
                      <p className="text-2xl font-bold text-blue-900">
                        {comprehensiveSummary.academic.status_akademik === 'baik' ? 'Baik' : 
                         comprehensiveSummary.academic.status_akademik === 'cukup' ? 'Cukup' : 'Perlu Perhatian'}
                      </p>
                      <p className="text-xs text-blue-600 mt-1">
                        {comprehensiveSummary.academic.program_aktif}/{comprehensiveSummary.academic.total_program} program aktif
                      </p>
                    </div>
                    <div className="p-3 bg-blue-200 rounded-lg">
                      <BookOpen className="w-6 h-6 text-blue-800" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border shadow-sm bg-gradient-to-br from-green-50 to-green-100">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-green-700">Status Keuangan</p>
                      <p className="text-2xl font-bold text-green-900">
                        {comprehensiveSummary.financial.status_pembayaran === 'lunas' ? 'Lunas' :
                         comprehensiveSummary.financial.status_pembayaran === 'sebagian' ? 'Sebagian' : 'Belum Bayar'}
                      </p>
                      <p className="text-xs text-green-600 mt-1">
                        {formatRupiah(comprehensiveSummary.financial.hutang_bulanan)} hutang
                      </p>
                    </div>
                    <div className="p-3 bg-green-200 rounded-lg">
                      <DollarSign className="w-6 h-6 text-green-800" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border shadow-sm bg-gradient-to-br from-purple-50 to-purple-100">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-purple-700">Dokumen</p>
                      <p className="text-2xl font-bold text-purple-900">
                        {comprehensiveSummary.documents.status_verifikasi === 'lengkap' ? 'Lengkap' :
                         comprehensiveSummary.documents.status_verifikasi === 'sebagian' ? 'Sebagian' : 'Belum Lengkap'}
                      </p>
                      <p className="text-xs text-purple-600 mt-1">
                        {comprehensiveSummary.documents.dokumen_wajib_lengkap}/{comprehensiveSummary.documents.dokumen_wajib_total} dokumen wajib
                      </p>
                    </div>
                    <div className="p-3 bg-purple-200 rounded-lg">
                      <FileText className="w-6 h-6 text-purple-800" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border shadow-sm bg-gradient-to-br from-amber-50 to-amber-100">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-amber-700">Kontak Wali</p>
                      <p className="text-2xl font-bold text-amber-900">
                        {comprehensiveSummary.wali.status_kontak === 'aktif' ? 'Aktif' : 'Tidak Aktif'}
                      </p>
                      <p className="text-xs text-amber-600 mt-1">
                        {comprehensiveSummary.wali.total_wali} wali terdaftar
                      </p>
                    </div>
                    <div className="p-3 bg-amber-200 rounded-lg">
                      <Users className="w-6 h-6 text-amber-800" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Personal Information */}
            <Card className="border shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <User className="w-5 h-5 text-blue-600" />
                  Informasi Pribadi
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="grid grid-cols-1 gap-3">
                  {/* ID Santri - Primary Identifier */}
                  <ModernInfoCard
                    icon={User}
                    iconColor="text-blue-600"
                    iconBg="bg-blue-100"
                    label="ID Santri"
                    value={santri.id_santri || 'Belum ada'}
                    subtitle="Identitas utama santri"
                  />
                  
                  <ModernInfoCard
                    icon={User}
                    iconColor="text-slate-600"
                    iconBg="bg-slate-100"
                    label="Nama Lengkap"
                    value={santri.nama_lengkap}
                  />
                  
                  <ModernInfoCard
                    icon={Calendar}
                    iconColor="text-emerald-600"
                    iconBg="bg-emerald-100"
                    label="Tanggal Lahir"
                    value={
                      <div>
                        <p className="font-semibold text-slate-800">
                          {santri.tanggal_lahir ? formatDate(santri.tanggal_lahir) : 'Belum diisi'}
                        </p>
                        {santri.tanggal_lahir && (
                          <p className="text-xs text-muted-foreground">
                            ({calculateAge(santri.tanggal_lahir)} tahun)
                          </p>
                        )}
                      </div>
                    }
                  />
                  
                  <ModernInfoCard
                    icon={MapPin}
                    iconColor="text-purple-600"
                    iconBg="bg-purple-100"
                    label="Tempat Lahir"
                    value={santri.tempat_lahir || 'Belum diisi'}
                  />
                  
                  <ModernInfoCard
                    icon={Phone}
                    iconColor="text-amber-600"
                    iconBg="bg-amber-100"
                    label="Nomor WhatsApp"
                    value={santri.no_whatsapp || 'Belum diisi'}
                  />

                  {/* NIK - Required for all */}
                  <ModernInfoCard
                    icon={Shield}
                    iconColor="text-red-600"
                    iconBg="bg-red-100"
                    label="NIK"
                    value={santri.nik || 'Belum diisi'}
                    subtitle="Nomor Induk Kependudukan (Wajib)"
                  />

                  {/* NISN - Optional for all */}
                  <ModernInfoCard
                    icon={GraduationCap}
                    iconColor="text-indigo-600"
                    iconBg="bg-indigo-100"
                    label="NISN"
                    value={santri.nisn || 'Belum diisi'}
                    subtitle="Nomor Induk Siswa Nasional (Opsional)"
                  />

                  {/* Hobi & Cita-cita - Optional for all */}
                  <ModernInfoCard
                    icon={Heart}
                    iconColor="text-pink-600"
                    iconBg="bg-pink-100"
                    label="Hobi"
                    value={santri.hobi || 'Belum diisi'}
                    subtitle="Hobi atau minat khusus"
                  />

                  <ModernInfoCard
                    icon={Target}
                    iconColor="text-orange-600"
                    iconBg="bg-orange-100"
                    label="Cita-cita"
                    value={santri.cita_cita || 'Belum diisi'}
                    subtitle="Cita-cita atau tujuan masa depan"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Status & Category Info */}
            <Card className="border shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Shield className="w-5 h-5 text-emerald-600" />
                  Status & Kategori
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="grid grid-cols-1 gap-3">
                  <ModernInfoCard
                    icon={Activity}
                    iconColor="text-green-600"
                    iconBg="bg-green-100"
                    label="Status Santri"
                    value={santri.status_baru}
                    badge={<StatusBadge status={santri.status_baru} type="success" />}
                  />
                  
                  <ModernInfoCard
                    icon={Target}
                    iconColor="text-blue-600"
                    iconBg="bg-blue-100"
                    label="Kategori"
                    value={santri.kategori}
                    badge={<StatusBadge status={santri.kategori} type="primary" />}
                  />
                  
                  <ModernInfoCard
                    icon={DollarSign}
                    iconColor="text-purple-600"
                    iconBg="bg-purple-100"
                    label="Tipe Pembayaran"
                    value={santri.tipe_pembayaran}
                    badge={<StatusBadge status={santri.tipe_pembayaran} type="info" />}
                  />
                  
                  <ModernInfoCard
                    icon={Clock}
                    iconColor="text-slate-600"
                    iconBg="bg-slate-100"
                    label="Bergabung"
                    value={santri.created_at ? formatDate(santri.created_at) : 'Belum diisi'}
                  />

                  {/* Status Sosial - Only for Binaan */}
                  {santri.kategori?.includes('Binaan') && santri.status_sosial && (
                    <ModernInfoCard
                      icon={Heart}
                      iconColor="text-pink-600"
                      iconBg="bg-pink-100"
                      label="Status Sosial"
                      value={santri.status_sosial}
                      subtitle="Kondisi sosial ekonomi keluarga"
                    />
                  )}

                  {/* Anak Ke & Jumlah Saudara - Only for Binaan Mukim */}
                  {santri.kategori === 'Binaan Mukim' && (
                    <>
                      {santri.anak_ke && (
                        <ModernInfoCard
                          icon={Users}
                          iconColor="text-cyan-600"
                          iconBg="bg-cyan-100"
                          label="Anak Ke-"
                          value={santri.anak_ke.toString()}
                        />
                      )}
                      
                      {santri.jumlah_saudara && (
                        <ModernInfoCard
                          icon={Users}
                          iconColor="text-teal-600"
                          iconBg="bg-teal-100"
                          label="Jumlah Saudara"
                          value={santri.jumlah_saudara.toString()}
                        />
                      )}
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Tab: Informasi Pribadi - Semua Data Registrasi */}
        <TabsContent value="personal" className="space-y-4 mt-4">
          {/* Section A: Data Diri - Simplified Layout with Inline Editing */}
          <Card className="border shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Data Diri</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">Klik pada field untuk mengedit</p>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* ID Santri - Read Only */}
                <InlineEditableField
                  label="ID Santri"
                  value={santri.id_santri || 'Belum ada'}
                  fieldName="id_santri"
                  santriId={santriId || ''}
                  onUpdate={handleUpdateField}
                  disabled={true}
                  placeholder="ID Santri (auto-generated)"
                />
                
                {/* Nama Lengkap */}
                <InlineEditableField
                  label="Nama Lengkap"
                  value={santri.nama_lengkap}
                  fieldName="nama_lengkap"
                  santriId={santriId || ''}
                  onUpdate={handleUpdateField}
                  placeholder="Masukkan nama lengkap"
                />
                
                {/* Tanggal Lahir */}
                <InlineEditableField
                  label="Tanggal Lahir"
                  value={santri.tanggal_lahir ? new Date(santri.tanggal_lahir).toISOString().split('T')[0] : ''}
                  fieldName="tanggal_lahir"
                  santriId={santriId || ''}
                  onUpdate={handleUpdateField}
                  type="date"
                  placeholder="Pilih tanggal lahir"
                />
                
                {/* Tempat Lahir */}
                <InlineEditableField
                  label="Tempat Lahir"
                  value={santri.tempat_lahir}
                  fieldName="tempat_lahir"
                  santriId={santriId || ''}
                  onUpdate={handleUpdateField}
                  placeholder="Masukkan tempat lahir"
                />
                
                {/* Nomor WhatsApp */}
                <InlineEditableField
                  label="Nomor WhatsApp"
                  value={santri.no_whatsapp}
                  fieldName="no_whatsapp"
                  santriId={santriId || ''}
                  onUpdate={handleUpdateField}
                  type="text"
                  placeholder="Masukkan nomor WhatsApp"
                />
                
                {/* NIK */}
                <InlineEditableField
                  label="NIK"
                  value={santri.nik}
                  fieldName="nik"
                  santriId={santriId || ''}
                  onUpdate={handleUpdateField}
                  placeholder="Nomor Induk Kependudukan (Wajib)"
                />
                
                {/* NISN */}
                <InlineEditableField
                  label="NISN"
                  value={santri.nisn}
                  fieldName="nisn"
                  santriId={santriId || ''}
                  onUpdate={handleUpdateField}
                  placeholder="Nomor Induk Siswa Nasional (Opsional)"
                />
                
                {/* Hobi */}
                <InlineEditableField
                  label="Hobi"
                  value={santri.hobi}
                  fieldName="hobi"
                  santriId={santriId || ''}
                  onUpdate={handleUpdateField}
                  placeholder="Hobi atau minat khusus"
                />
                
                {/* Cita-cita */}
                <InlineEditableField
                  label="Cita-cita"
                  value={santri.cita_cita}
                  fieldName="cita_cita"
                  santriId={santriId || ''}
                  onUpdate={handleUpdateField}
                  placeholder="Cita-cita atau tujuan masa depan"
                />
              </div>
            </CardContent>
          </Card>

          {/* Section B: Data Wali */}
          <Card className="border shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Users className="w-5 h-5 text-emerald-600" />
                Data Wali
              </CardTitle>
            </CardHeader>
            <CardContent>
              {waliData.length === 0 ? (
                <div className="text-center py-6">
                  <p className="text-muted-foreground mb-3 text-sm">Belum ada data wali</p>
                  <Button 
                    onClick={() => {
                      setEditTab('wali');
                      setShowForm(true);
                      setEditingSantri(santriId);
                    }}
                    variant="outline"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Tambah Data Wali
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {waliData.map((wali, idx) => (
                    <Card key={wali.id || idx} className="border-l-4 border-l-emerald-500">
                      <CardContent className="p-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h4 className="font-semibold">{wali.nama_lengkap || 'Nama belum diisi'}</h4>
                              {wali.is_utama && (
                                <Badge variant="default" className="text-xs">Wali Utama</Badge>
                              )}
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-muted-foreground">
                              <p><span className="font-medium">Hubungan:</span> {wali.hubungan_keluarga || '-'}</p>
                              <p><span className="font-medium">WhatsApp:</span> {wali.no_whatsapp || '-'}</p>
                              <p><span className="font-medium">Pekerjaan:</span> {wali.pekerjaan || '-'}</p>
                              <p><span className="font-medium">Alamat:</span> {wali.alamat || '-'}</p>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Section C: Riwayat Pendidikan - Only for Binaan Mukim */}
          {santri?.kategori === 'Binaan Mukim' && (
            <Card className="border shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <GraduationCap className="w-5 h-5 text-blue-600" />
                  Riwayat Pendidikan
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="text-center py-6">
                  <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <GraduationCap className="w-7 h-7 text-blue-600" />
                  </div>
                  <h3 className="text-base font-semibold mb-2">Riwayat Pendidikan</h3>
                  <p className="text-muted-foreground mb-3 text-sm">
                    Data riwayat pendidikan akan ditampilkan di sini
                  </p>
                  <Button 
                    onClick={() => {
                      setEditTab('pendidikan');
                      setShowForm(true);
                      setEditingSantri(santriId);
                    }}
                    className="flex items-center gap-2"
                  >
                    <Edit className="w-4 h-4" />
                    Edit Riwayat Pendidikan
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Section D: Kesehatan - Only for Binaan Mukim */}
          {santri?.kategori === 'Binaan Mukim' && (
            <Card className="border shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Kondisi Kesehatan</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">Klik pada field untuk mengedit</p>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <InlineEditableField
                    label="Golongan Darah"
                    value={santri.golongan_darah}
                    fieldName="golongan_darah"
                    santriId={santriId || ''}
                    onUpdate={handleUpdateField}
                    placeholder="Masukkan golongan darah"
                  />
                  <InlineEditableField
                    label="Tinggi Badan (cm)"
                    value={santri.tinggi_badan}
                    fieldName="tinggi_badan"
                    santriId={santriId || ''}
                    onUpdate={handleUpdateField}
                    type="number"
                    placeholder="Masukkan tinggi badan"
                  />
                  <InlineEditableField
                    label="Berat Badan (kg)"
                    value={santri.berat_badan}
                    fieldName="berat_badan"
                    santriId={santriId || ''}
                    onUpdate={handleUpdateField}
                    type="number"
                    placeholder="Masukkan berat badan"
                  />
                  <InlineEditableField
                    label="Riwayat Penyakit"
                    value={santri.riwayat_penyakit}
                    fieldName="riwayat_penyakit"
                    santriId={santriId || ''}
                    onUpdate={handleUpdateField}
                    type="textarea"
                    placeholder="Masukkan riwayat penyakit (jika ada)"
                  />
                  <InlineEditableField
                    label="Alergi"
                    value={santri.alergi}
                    fieldName="alergi"
                    santriId={santriId || ''}
                    onUpdate={handleUpdateField}
                    placeholder="Masukkan alergi (jika ada)"
                  />
                  <InlineEditableField
                    label="Kondisi Khusus"
                    value={santri.kondisi_khusus}
                    fieldName="kondisi_khusus"
                    santriId={santriId || ''}
                    onUpdate={handleUpdateField}
                    placeholder="Masukkan kondisi khusus (jika ada)"
                  />
                  <InlineEditableField
                    label="Keterangan Rawat Inap"
                    value={santri.keterangan_rawat_inap}
                    fieldName="keterangan_rawat_inap"
                    santriId={santriId || ''}
                    onUpdate={handleUpdateField}
                    type="textarea"
                    placeholder="Masukkan keterangan rawat inap (jika pernah)"
                  />
                  <InlineEditableField
                    label="Disabilitas Khusus"
                    value={santri.disabilitas_khusus}
                    fieldName="disabilitas_khusus"
                    santriId={santriId || ''}
                    onUpdate={handleUpdateField}
                    placeholder="Masukkan disabilitas khusus (jika ada)"
                  />
                  <InlineEditableField
                    label="Obat Khusus"
                    value={santri.obat_khusus}
                    fieldName="obat_khusus"
                    santriId={santriId || ''}
                    onUpdate={handleUpdateField}
                    placeholder="Masukkan obat khusus (jika ada)"
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Section E: Dokumen */}
          <Card className="border shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <FileText className="w-5 h-5 text-purple-600" />
                Dokumen
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <DokumenSantriTab 
                santriId={santriId} 
                santriData={{
                  status_sosial: santri?.status_sosial as 'Yatim' | 'Piatu' | 'Yatim Piatu' | 'Dhuafa',
                  nama_lengkap: santri?.nama_lengkap || '',
                  kategori: santri?.kategori || 'Reguler'
                }}
                isBantuanRecipient={isBantuanRecipient}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Academic - fokus pada statistik */}
        <TabsContent value="academic" className="space-y-4 mt-4">
          <Card className="border shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <PieChart className="w-5 h-5 text-emerald-600" />
                Ringkasan Akademik
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Gambaran cepat tentang status kelas, kehadiran, dan prestasi santri.
              </p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
                <Card className="border border-emerald-100 shadow-none">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2 text-emerald-700">
                        <BookOpen className="w-4 h-4" />
                        <span className="text-sm font-medium">Status Kelas</span>
                      </div>
                      <StatusBadge status={programData.length > 0 ? 'Aktif' : 'Belum'} type={programData.length > 0 ? 'success' : 'warning'} />
                    </div>
                    <p className="text-xl font-semibold text-slate-900">
                      {programData.length > 0 ? (programData[0]?.kelas_program || 'Kelas Aktif') : 'Belum ditempatkan'}
                    </p>
                    {programData.length > 1 && (
                      <p className="text-xs text-muted-foreground mt-1">
                        +{programData.length - 1} kelas tambahan.
                      </p>
                    )}
                  </CardContent>
                </Card>

                <Card className="border border-blue-100 shadow-none">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2 text-blue-700">
                        <Calendar className="w-4 h-4" />
                        <span className="text-sm font-medium">Absensi 30 Hari</span>
                      </div>
                    </div>
                    <p className="text-xl font-semibold text-slate-900">{absensiSummary?.total || 0} pertemuan</p>
                    <div className="flex flex-wrap gap-2 mt-3 text-xs text-muted-foreground">
                      {absensiSummary ? (
                        Object.entries(absensiSummary.statuses).map(([status, count]) => (
                          <span key={status} className="inline-flex items-center gap-1 px-2 py-1 rounded-full border bg-slate-50 border-slate-200">
                            <span className="font-medium text-slate-700">{count}</span>
                            <span>{status}</span>
                          </span>
                        ))
                      ) : (
                        <span>Belum ada data absensi</span>
                      )}
                    </div>
                    {absensiSummary?.lastDate && (
                      <p className="text-xs text-muted-foreground mt-3">
                        Kehadiran terakhir: {formatDate(absensiSummary.lastDate)}
                      </p>
                    )}
                  </CardContent>
                </Card>

                <Card className="border border-purple-100 shadow-none">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2 text-purple-700">
                        <TrendingUp className="w-4 h-4" />
                        <span className="text-sm font-medium">Program Aktif</span>
                      </div>
                    </div>
                    <p className="text-xl font-semibold text-slate-900">{(academicSummary?.program_aktif ?? programData.length) || 0}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Dari total {(academicSummary?.total_program ?? programData.length) || 0} penugasan.
                    </p>
                    <p className="text-xs text-muted-foreground mt-3">
                      Data terbaru {comprehensiveSummary?.last_updated ? formatDate(comprehensiveSummary.last_updated) : 'belum tersedia'}.
                    </p>
                  </CardContent>
                </Card>

                <Card className="border border-amber-100 shadow-none">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2 text-amber-700">
                        <Award className="w-4 h-4" />
                        <span className="text-sm font-medium">Prestasi / Pelanggaran</span>
                      </div>
                    </div>
                    {academicSummary?.prestasi_terbaru?.length ? (
                      <ul className="space-y-2 text-sm">
                        {academicSummary.prestasi_terbaru.slice(0, 3).map((item: any, idx: number) => (
                          <li key={idx} className="flex items-start gap-2">
                            <Star className="w-4 h-4 text-amber-500 mt-0.5" />
                            <span className="text-slate-700">
                              {item.prestasi_santri || 'Prestasi tanpa keterangan'}
                            </span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        Belum ada catatan prestasi atau pelanggaran.
                      </p>
                    )}
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>

          {santriId && (
            <SantriProgressTracking santriId={santriId} programOptions={progressProgramOptions} />
          )}

          <Card className="border shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Activity className="w-5 h-5 text-blue-600" />
                Rekap Kehadiran & Ketertiban
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Detail kehadiran terbaru beserta catatan kedisiplinan.
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              {absensiSummary?.total ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-lg border border-blue-100 bg-blue-50">
                    <h4 className="text-sm font-semibold text-blue-900 mb-2">Ringkasan Kehadiran</h4>
                    <div className="text-3xl font-bold text-blue-900 mb-2">{absensiSummary.total}</div>
                    <p className="text-xs text-blue-800">Pertemuan tercatat 30 hari terakhir.</p>
                  </div>
                  <div className="p-4 rounded-lg border border-amber-100 bg-amber-50">
                    <h4 className="text-sm font-semibold text-amber-900 mb-2">Catatan Disiplin</h4>
                    <p className="text-sm text-amber-800">
                      Integrasi catatan pelanggaran sedang disiapkan. Masukan dari pengurus dapat ditambahkan melalui modul monitoring.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  Belum ada catatan absensi untuk periode ini.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Financial - Gabungkan Bantuan Yayasan di sini */}
        <TabsContent value="financial" className="space-y-4 mt-4">
          {/* Bantuan Yayasan - Only for Binaan */}
          {isBantuanRecipient && (
            <Card className="border shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <HandCoins className="w-5 h-5 text-green-600" />
                  Bantuan Yayasan
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  Transparansi bantuan dan distribusi yang diterima santri {santri?.kategori === 'Binaan Mukim' ? 'Mukim' : 'Non-Mukim'}
                </p>
              </CardHeader>
              <CardContent className="pt-0">
                <BantuanYayasanTab
                  key={`bantuan-${activeTab}-${Date.now()}`}
                  santriId={santriId || ''}
                  santriName={santri?.nama_lengkap}
                  santriNisn={santri?.nisn}
                  santriIdSantri={santri?.id_santri}
                />
              </CardContent>
            </Card>
          )}

          {/* Financial summary for Reguler/Mahasantri */}
          {!isBantuanRecipient && (
            <Card className="border shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <CreditCard className="w-5 h-5 text-blue-600" />
                  Tagihan & Pembayaran
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  Ringkasan tagihan dan pembayaran untuk santri mandiri
                </p>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="text-center py-6">
                  <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <CreditCard className="w-7 h-7 text-blue-600" />
                  </div>
                  <h3 className="text-base font-semibold mb-2">Tagihan & Pembayaran</h3>
                  <p className="text-muted-foreground mb-3 text-sm">
                    Fitur tagihan otomatis akan segera tersedia
                  </p>
                  <Button variant="outline" disabled>
                    <CreditCard className="w-4 h-4 mr-2" />
                    Lihat Tagihan
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Tabungan */}
          <Card className="border shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <DollarSign className="w-5 h-5 text-purple-600" />
                Tabungan
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Saldo terakhir yang tercatat pada sistem tabungan yayasan.
              </p>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-center py-6">
                <div className="w-14 h-14 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <DollarSign className="w-7 h-7 text-purple-600" />
                </div>
                <h3 className="text-base font-semibold mb-2">Saldo Tabungan</h3>
                <p className="text-xl font-bold text-purple-600 mb-3">
                  {formatRupiah(financialSummary?.saldo_tabungan || 0)}
                </p>
                <div className="flex flex-col sm:flex-row gap-2 justify-center">
                  <Button 
                    variant="outline"
                    onClick={() => navigateToTabungan('riwayat')}
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    Lihat Detail & Riwayat
                  </Button>
                  <Button 
                    onClick={() => navigateToTabungan('withdraw')}
                    disabled={(financialSummary?.saldo_tabungan || 0) <= 0}
                  >
                    <HandCoins className="w-4 h-4 mr-2" />
                    Ajukan Penarikan
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Monitoring */}
        <TabsContent value="monitoring" className="space-y-4 mt-4">
          <SantriDataValidationPanel 
            santriId={santriId || ''}
            santriName={santri?.nama_lengkap || ''}
            onRefresh={loadSantriData}
          />
        </TabsContent>
      </Tabs>

      {/* Santri Form Modal */}
      {showForm && (
        <SantriFormWizard
          santriId={editingSantri || undefined}
          initialTab={editTab}
          onClose={() => {
            setShowForm(false);
            setEditingSantri(null);
          }}
          onSave={() => {
            setShowForm(false);
            setEditingSantri(null);
            loadSantriData();
          }}
        />
      )}

      {/* Settings Panel */}
      {showSettings && santri && (
        <SantriSettingsPanel
          santriId={santriId || ''}
          santriName={santri.nama_lengkap}
          santriCategory={santri.kategori}
          isOpen={showSettings}
          onClose={() => setShowSettings(false)}
        />
      )}
    </div>
  );
};

export default SantriProfileMaster;
