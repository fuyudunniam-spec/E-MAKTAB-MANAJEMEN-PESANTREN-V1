import React, { useState, useEffect } from 'react';
import { ShieldCheck, Check, Globe, Feather, ArrowRight, BookOpen, GraduationCap, Building2 } from 'lucide-react';
import PublicNavbar from '../components/PublicNavbar';
import PublicFooter from '../components/PublicFooter';
import { useQuery } from '@tanstack/react-query';
import { SanityService } from '../services/sanity.service';

const defaultPrograms = [
  {
    id: 'kader',
    title: 'Beasiswa Kader Ulama',
    desc: 'Mencetak santri yang menguasai Turats (Kitab Kuning) sekaligus Sains Modern. Menanggung biaya riset dan kitab.',
    img: 'https://images.unsplash.com/photo-1532012197267-da84d127e765?q=80&w=200&auto=format&fit=crop',
    progress: 60,
    target: '200 Santri',
    current: '150 Santri',
    icon: <GraduationCap className="w-6 h-6" />
  },
  {
    id: 'riset',
    title: 'Wakaf Riset & Kurikulum',
    desc: 'Pengembangan modul ajar Islam, digitalisasi manuskrip, dan platform E-Learning gratis untuk umat.',
    img: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?q=80&w=200&auto=format&fit=crop',
    progress: 40,
    target: '50 Modul',
    current: '20 Modul',
    icon: <BookOpen className="w-6 h-6" />
  },
  {
    id: 'studi',
    title: 'Pembangunan Pusat Studi',
    desc: 'Wakaf fisik untuk Perpustakaan Digital dan Asrama Mahasantri (Ma\'had Aly).',
    img: 'https://images.unsplash.com/photo-1505664194779-8beaceb93744?q=80&w=200&auto=format&fit=crop',
    progress: 30,
    target: 'Rp 5 M',
    current: 'Rp 1.5 M',
    icon: <Building2 className="w-6 h-6" />
  }
];

const DonasiPage: React.FC = () => {
  const { data: sanityData } = useQuery({
    queryKey: ['donationPage'],
    queryFn: SanityService.getDonationPageData
  });

  const programs = sanityData?.programs || defaultPrograms;
  const [selectedProgram, setSelectedProgram] = useState(programs[0]);

  useEffect(() => {
    if (sanityData?.programs && sanityData.programs.length > 0) {
      setSelectedProgram(sanityData.programs[0]);
    }
  }, [sanityData]);

  const [amount, setAmount] = useState<number>(0);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [doa, setDoa] = useState('');
  const [hideName, setHideName] = useState(false);
  const [activeTab, setActiveTab] = useState<'updates' | 'donors'>('updates');

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const handleDonation = (e: React.FormEvent) => {
    e.preventDefault();
    const displayName = hideName ? name + " (Mohon disamarkan)" : name;
    const formattedAmount = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);

    const message = `Assalamu'alaikum Admin Al-Bisri,%0A%0ABismillah, saya ingin berpartisipasi dalam *Investasi Peradaban*:%0A%0A📚 Program: *${selectedProgram.title}*%0A💰 Komitmen Wakaf: *${formattedAmount}*%0A👤 Nama Wakif: *${displayName}*%0A📝 Pesan/Doa: ${doa || "-"}%0A%0AMohon panduan untuk penyaluran dana wakaf ini. Terima kasih.`;

    window.open(`https://wa.me/6281234567890?text=${message}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-stone-50 font-body selection:bg-gold-200 selection:text-royal-950">
      <PublicNavbar />

      <main className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid lg:grid-cols-12 gap-12">

          {/* LEFT COLUMN: PROGRAMS */}
          <div className="lg:col-span-7 space-y-10">
            <div>
              <span className="text-gold-600 font-bold uppercase tracking-[0.2em] text-xs mb-2 block">Filantropi Pendidikan</span>
              <h1 className="text-4xl md:text-5xl font-display text-royal-900 mb-4">Investasi Intelektual</h1>
              <p className="text-stone-600 text-lg">
                Berbeda dengan donasi konvensional, dana Anda di sini digunakan untuk <strong>mencetak ulama</strong> dan <strong>mengembangkan kurikulum Islam</strong> yang relevan dengan zaman.
              </p>
            </div>

            <div className="space-y-4">
              {programs.map((p: any) => {
                const progress = p.target ? Math.round((p.collected / p.target) * 100) : p.progress || 0;
                return (
                  <label key={p.id || p._id} className="cursor-pointer block group">
                    <input
                      type="radio"
                      name="program"
                      className="hidden peer"
                      checked={selectedProgram.id === p.id || selectedProgram._id === p._id}
                      onChange={() => setSelectedProgram(p)}
                    />
                    <div className="border-2 border-stone-200 rounded-[2rem] p-6 transition-all duration-300 relative overflow-hidden bg-white hover:border-gold-400 peer-checked:border-royal-900 peer-checked:bg-royal-50/30 peer-checked:shadow-lg">
                      <div className="flex gap-6">
                        <div className="w-24 h-24 rounded-xl overflow-hidden shrink-0 bg-stone-200 relative">
                          <img src={p.image?.asset ? SanityService.imageUrl(p.image) : p.img} className="w-full h-full object-cover" alt={p.title} />
                          <div className="absolute inset-0 bg-royal-900/20"></div>
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between items-start mb-2">
                            <h3 className="font-display text-xl text-royal-900 font-bold group-hover:text-gold-600 transition">
                              {p.title}
                            </h3>
                            <div className={`w-6 h-6 bg-royal-900 text-white rounded-full flex items-center justify-center transition-all transform ${selectedProgram.id === p.id || selectedProgram._id === p._id ? 'scale-100 opacity-100' : 'scale-50 opacity-0'}`}>
                              <Check className="w-4 h-4" />
                            </div>
                          </div>
                          <p className="text-sm text-stone-500 mb-4 line-clamp-2">{p.description || p.desc}</p>
                          <div className="w-full bg-stone-100 rounded-full h-2 mb-2">
                            <div className="bg-gold-400 h-2 rounded-full" style={{ width: `${progress}%` }}></div>
                          </div>
                          <div className="flex justify-between text-xs font-bold text-stone-400 uppercase tracking-wider">
                            <span>Dukungan: {p.current || (p.collected ? `Rp ${p.collected.toLocaleString('id-ID')}` : '-')}</span>
                            <span>Target: {p.targetString || (typeof p.target === 'number' ? `Rp ${p.target.toLocaleString('id-ID')}` : p.target)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </label>
                );
              })}
            </div>

            {/* INFO TABS */}
            <div className="bg-white rounded-[2rem] border border-stone-200 overflow-hidden shadow-sm">
              <div className="flex border-b border-stone-100">
                <button
                  onClick={() => setActiveTab('updates')}
                  className={`flex-1 py-4 text-center text-sm font-bold uppercase tracking-wider transition ${activeTab === 'updates' ? 'border-b-2 border-gold-500 text-royal-900 bg-stone-50' : 'text-stone-400 hover:bg-stone-50'}`}
                >
                  Laporan Dampak
                </button>
                <button
                  onClick={() => setActiveTab('donors')}
                  className={`flex-1 py-4 text-center text-sm font-bold uppercase tracking-wider transition ${activeTab === 'donors' ? 'border-b-2 border-gold-500 text-royal-900 bg-stone-50' : 'text-stone-400 hover:bg-stone-50'}`}
                >
                  Para Pewakaf
                </button>
              </div>

              <div className="p-8">
                {activeTab === 'updates' ? (
                  <div className="relative pl-8 border-l-2 border-stone-200 space-y-10">
                    <div className="relative">
                      <div className="absolute -left-[39px] top-0 w-5 h-5 rounded-full border-4 border-white bg-royal-900"></div>
                      <span className="text-xs font-bold text-stone-400 uppercase tracking-widest block mb-1">20 Oktober 2024</span>
                      <h5 className="font-bold text-royal-900 text-lg mb-2">Peluncuran Modul Fiqih Kontemporer</h5>
                      <p className="text-sm text-stone-600 leading-relaxed mb-4">
                        Tim riset Al-Bisri telah menyelesaikan penyusunan Kitab Fiqih Muamalah Digital. Dana wakaf digunakan untuk riset, penulisan, dan distribusi digital gratis.
                      </p>
                      <span className="bg-gold-100 text-gold-700 px-2 py-1 rounded text-xs font-bold uppercase tracking-wider">Hasil Riset</span>
                    </div>
                    <div className="relative">
                      <div className="absolute -left-[39px] top-0 w-5 h-5 rounded-full border-4 border-white bg-stone-300"></div>
                      <span className="text-xs font-bold text-stone-400 uppercase tracking-widest block mb-1">15 September 2024</span>
                      <h5 className="font-bold text-royal-900 text-lg mb-2">5 Santri Lolos ke Al-Azhar Kairo</h5>
                      <p className="text-sm text-stone-600 leading-relaxed">
                        Beasiswa Kader Ulama telah memberangkatkan 5 santri terbaik untuk melanjutkan studi jenjang S1 di Mesir.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="divide-y divide-stone-100 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                    {[
                      { initial: 'HA', name: 'Hamba Allah', type: 'Wakaf Kurikulum', amount: 'Rp 10.000.000', color: 'bg-gold-50 text-gold-600', msg: 'Semoga lahir ulama-ulama besar dari Al-Bisri yang mencerahkan umat.' },
                      { initial: 'DR', name: 'Dr. Rahmat Sp.A', type: 'Beasiswa Kader', amount: 'Rp 1.500.000', color: 'bg-royal-50 text-royal-700', msg: 'Untuk biaya kitab santri takhassus. Mohon doanya.' },
                      { initial: 'SN', name: 'Siti Nurhaliza', type: 'Pusat Studi', amount: 'Rp 500.000', color: 'bg-gold-50 text-gold-600', msg: 'Sedekah subuh untuk almarhum ayah.' },

                    ].map((d, i) => (
                      <div key={i} className="py-6 first:pt-0">
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${d.color}`}>{d.initial}</div>
                            <div>
                              <p className="font-bold text-royal-900 text-sm">{d.name}</p>
                              <p className="text-xs text-stone-400">{d.type}</p>
                            </div>
                          </div>
                          <span className="font-bold text-royal-900 text-sm">{d.amount}</span>
                        </div>
                        <div className="bg-stone-50 p-3 rounded-xl rounded-tl-none border border-stone-100">
                          <p className="text-xs text-stone-600 italic">"{d.msg}"</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: STICKY FORM */}
          <div className="lg:col-span-5 relative">
            <div className="sticky top-28 bg-white p-8 rounded-[2.5rem] shadow-2xl border border-stone-100">
              <div className="text-center mb-8">
                <p className="text-xs font-bold text-gold-600 uppercase tracking-widest mb-2">Akad Wakaf Ilmu</p>
                <h2 className="text-2xl font-display text-royal-900 leading-tight">
                  {selectedProgram.title}
                </h2>
              </div>

              <form className="space-y-6" onSubmit={handleDonation}>
                <div>
                  <label className="block text-xs font-bold text-stone-500 uppercase tracking-wider mb-3">Nominal Investasi</label>
                  <div className="grid grid-cols-3 gap-3 mb-4">
                    {[100000, 500000, 1000000].map((amt) => (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => setAmount(amt)}
                        className={`py-3 rounded-xl border text-sm font-bold transition ${amount === amt ? 'bg-royal-900 text-white border-royal-900' : 'border-stone-200 text-royal-900 hover:border-royal-900'}`}
                      >
                        {amt / 1000}rb
                      </button>
                    ))}
                  </div>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-royal-900 font-bold">Rp</span>
                    <input
                      type="number"
                      value={amount || ''}
                      onChange={(e) => setAmount(Number(e.target.value))}
                      className="w-full bg-stone-50 border border-stone-200 rounded-xl py-3 pl-12 font-bold text-royal-900 focus:outline-none focus:border-royal-900 focus:ring-1 focus:ring-royal-900 transition"
                      placeholder="Nominal Lainnya..."
                      required
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-stone-500 uppercase tracking-wider mb-2">Nama Wakif</label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full bg-white border border-stone-200 rounded-xl py-3 px-4 font-medium text-royal-900 focus:outline-none focus:border-gold-400 transition"
                      placeholder="Nama Lengkap"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-stone-500 uppercase tracking-wider mb-2">Kontak (WhatsApp)</label>
                    <input
                      type="text"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full bg-white border border-stone-200 rounded-xl py-3 px-4 font-medium text-royal-900 focus:outline-none focus:border-gold-400 transition"
                      placeholder="08..."
                      required
                    />
                  </div>
                </div>

                <div className="bg-gold-50 p-4 rounded-2xl border border-gold-200">
                  <label className="block text-xs font-bold text-gold-700 uppercase tracking-wider mb-2 flex items-center gap-2">
                    <Feather className="w-4 h-4" /> Pesan / Hajat Khusus
                  </label>
                  <textarea
                    rows={3}
                    value={doa}
                    onChange={(e) => setDoa(e.target.value)}
                    className="w-full bg-white border border-gold-200 rounded-xl py-3 px-4 text-sm text-royal-900 placeholder-stone-400 focus:outline-none focus:border-gold-500 transition resize-none"
                    placeholder="Semoga menjadi amal jariyah ilmu yang bermanfaat..."
                  ></textarea>
                  <div className="mt-2 flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="hideName"
                      checked={hideName}
                      onChange={(e) => setHideName(e.target.checked)}
                      className="w-4 h-4 text-royal-900 border-gray-300 rounded focus:ring-royal-900"
                    />
                    <label htmlFor="hideName" className="text-xs text-stone-500 font-medium">Sembunyikan nama (Hamba Allah)</label>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-4 bg-royal-900 text-white rounded-full shadow-lg hover:bg-royal-800 transition transform hover:-translate-y-1 relative overflow-hidden group"
                >
                  <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                  <span className="relative font-display font-bold uppercase tracking-widest text-sm flex items-center justify-center gap-2">
                    Tunaikan Wakaf <ArrowRight className="w-4 h-4 text-gold-400" />
                  </span>
                </button>

                <div className="flex items-center justify-center gap-2 text-[10px] text-stone-400 font-bold uppercase tracking-widest">
                  <ShieldCheck className="w-3 h-3 text-gold-500" /> Secure Payment via WhatsApp
                </div>

              </form>
            </div>
          </div>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
};

export default DonasiPage;
