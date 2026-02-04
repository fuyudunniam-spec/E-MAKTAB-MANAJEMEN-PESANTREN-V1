import React from 'react';
import { 
  Crown, 
  HeartHandshake, 
  GraduationCap, 
  CheckCircle2, 
  ArrowRight 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface ProgramSelectionViewProps {
  onSelect: (category: string) => void;
  isLoading: boolean;
}

const ProgramSelectionView: React.FC<ProgramSelectionViewProps> = ({ onSelect, isLoading }) => {
  const programs = [
    {
      id: 'Reguler',
      title: 'Program Reguler',
      description: 'Program pendidikan pesantren standar dengan biaya mandiri.',
      icon: Crown,
      color: 'bg-blue-50 text-blue-600',
      features: [
        'Kurikulum Pesantren Modern',
        'Fasilitas Asrama Standar',
        'Makan 3x Sehari',
        'Ekstrakurikuler Pilihan'
      ]
    },
    {
      id: 'Binaan Mukim',
      title: 'Program Beasiswa (Binaan)',
      description: 'Khusus untuk yatim & dhuafa dengan subsidi biaya penuh.',
      icon: HeartHandshake,
      color: 'bg-gold-50 text-gold-600',
      features: [
        'Bebas Biaya Pendidikan',
        'Prioritas Program Tahfidz',
        'Pembinaan Intensif',
        'Wajib Mukim (Asrama)'
      ]
    },
    {
      id: 'Mahasiswa',
      title: 'Program Mahasiswa',
      description: 'Untuk mahasiswa yang ingin mondok sambil kuliah.',
      icon: GraduationCap,
      color: 'bg-purple-50 text-purple-600',
      features: [
        'Fleksibilitas Jadwal Kuliah',
        'Kajian Kitab Kuning',
        'Lingkungan Akademis',
        'Jaringan Alumni'
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 font-body">
      <div className="max-w-6xl w-full">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-heading font-bold text-royal-950 mb-4">
            Pilih Program Pendidikan
          </h1>
          <p className="text-xl text-slate-500 max-w-2xl mx-auto">
            Silakan pilih program yang sesuai dengan kebutuhan dan kualifikasi Anda untuk melanjutkan proses pendaftaran.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {programs.map((program) => (
            <Card 
              key={program.id}
              className="border-0 shadow-xl hover:shadow-2xl transition-all duration-300 rounded-[32px] overflow-hidden group relative"
            >
              <CardContent className="p-8 flex flex-col h-full">
                <div className={`w-16 h-16 rounded-2xl ${program.color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                  <program.icon className="w-8 h-8" />
                </div>
                
                <h3 className="text-2xl font-bold text-royal-950 mb-3">
                  {program.title}
                </h3>
                <p className="text-slate-500 mb-8 font-medium leading-relaxed">
                  {program.description}
                </p>

                <div className="space-y-4 mb-8 flex-1">
                  {program.features.map((feature, idx) => (
                    <div key={idx} className="flex items-center gap-3 text-slate-600">
                      <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
                      <span className="text-sm font-medium">{feature}</span>
                    </div>
                  ))}
                </div>

                <Button
                  onClick={() => onSelect(program.id)}
                  disabled={isLoading}
                  className="w-full py-6 rounded-xl bg-royal-950 hover:bg-royal-900 text-white font-bold shadow-lg shadow-royal-950/20 group-hover:bg-gold-500 group-hover:text-royal-950 transition-all"
                >
                  Pilih Program
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ProgramSelectionView;
