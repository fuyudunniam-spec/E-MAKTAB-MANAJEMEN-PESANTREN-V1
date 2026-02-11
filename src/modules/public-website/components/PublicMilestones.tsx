import React from 'react';

const defaultMilestones = [
  { year: '1998', title: 'Perintisan', description: 'Pendirian Panti Asuhan & Pesantren Yatim pertama.' },
  { year: '2010', title: 'Legalitas Madin', description: 'Izin operasional resmi Madrasah Diniyah & Program Asrama.' },
  { year: '2024', title: 'Ekosistem Baru', description: 'Peluncuran unit usaha mandiri & Pesantren Mahasiswa.' },
  { year: '2026', title: 'Kemandirian', description: 'Target operasional mandiri penuh & Universitas.' },
];

interface PublicMilestonesProps {
  data?: any[];
}

const PublicMilestones: React.FC<PublicMilestonesProps> = ({ data }) => {
  const milestones = data && data.length > 0 ? data : defaultMilestones;
  const milestonesList = data && data.length > 0 ? data : milestones;

  return (
    <section className="py-24 bg-royal-900 text-white relative overflow-hidden">
      <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "url('https://www.transparenttextures.com/patterns/arabesque.png')" }}></div>
      <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-black/20 to-transparent"></div>

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="text-center mb-20">
          <span className="text-gold-400 font-bold uppercase tracking-[0.2em] text-xs">Milestones</span>
          <h2 className="text-3xl md:text-4xl font-display text-white mt-3">Jejak Langkah Pengabdian</h2>
        </div>

        <div className="relative">
          <div className="absolute top-12 left-0 w-full h-px bg-gradient-to-r from-transparent via-gold-500/50 to-transparent hidden md:block"></div>

          <div className="flex overflow-x-auto snap-x snap-mandatory gap-4 pb-8 md:grid md:grid-cols-4 md:gap-12 relative [-ms-overflow-style:'none'] [scrollbar-width:'none'] [&::-webkit-scrollbar]:hidden -mx-6 px-6 md:mx-0 md:px-0">
            {milestonesList.map((m: any, i: number) => (
              <div key={m.year} className="flex-shrink-0 w-[85%] md:w-auto snap-center relative group text-center" style={{ animationDelay: `${i * 100}ms` }}>
                <div className="hidden md:flex justify-center items-center absolute top-12 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
                  <div className="w-4 h-4 bg-royal-900 border-2 border-gold-500 rounded-full group-hover:scale-125 group-hover:bg-gold-500 transition duration-500 shadow-[0_0_15px_rgba(212,175,55,0.5)]"></div>
                </div>

                <div className="mb-8 md:mb-16 transform transition duration-500 group-hover:-translate-y-2">
                  <span className="text-5xl md:text-6xl font-display text-transparent bg-clip-text bg-gradient-to-b from-gold-300 to-gold-600 font-bold opacity-80">
                    {m.year}
                  </span>
                </div>

                <div className="bg-white/5 p-6 rounded-2xl border border-white/10 hover:bg-white/10 hover:border-gold-500/30 transition duration-500 relative overflow-hidden group-hover:shadow-2xl h-full">
                  <h4 className="text-xl font-display text-white mb-3 relative z-10">{m.title}</h4>
                  <p className="text-sm text-royal-200 leading-relaxed font-light relative z-10">{m.description || m.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default PublicMilestones;
