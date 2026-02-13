
import React, { useState, useEffect, useLayoutEffect, useRef, useMemo } from 'react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart as RePieChart, Pie, Cell, BarChart, Bar
} from 'recharts';
import { 
  Wallet, 
  History, 
  TrendingUp, 
  TrendingDown, 
  LayoutDashboard,
  Leaf,
  Gift,
  Smile,
  Plane,
  Sun,
  Moon,
  BarChart3,
  Heart,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  PieChart as PieIcon,
  PiggyBank
} from 'lucide-react';
import { PROJECT_DATA } from './constants';

declare const gsap: any;

const COLORS = {
  projects: ['#7C9B93', '#4A5568', '#A68B8B', '#718096', '#C9D6D9']
};
const PRIMARY_SOLID = '#7C9B93';
const CHART_UNIQUE_PALETTE = ['#7C9B93', '#CDCC78', '#A68B8B', '#718096', '#C9D6D9', '#4A5568', '#8EB1A7'];

type ProjectType = 'Semua' | 'Resik' | 'Hadeyya' | 'Siyar' | 'Haru';

const ProjectIcons: Record<string, any> = {
  'Semua': LayoutDashboard,
  'Resik': Leaf,
  'Hadeyya': Gift,
  'Siyar': Plane,
  'Haru': Smile
};

const ProjectTimelines: Record<string, string> = {
  'Semua': 'Periode 2024 - 2026',
  'Resik': 'Oktober 2024 - Januari 2026',
  'Hadeyya': 'Periode 2025 - 2026',
  'Siyar': 'Januari 2024 - Januari 2026',
  'Haru': 'Desember 2025 - Maret 2026'
};

const SkyToggle = ({ isDark, onToggle }: { isDark: boolean, onToggle: () => void }) => {
  return (
    <div className="sky-toggle" onClick={onToggle} role="button" aria-label="Ganti Tema">
      <div className="toggle-thumb">
        {isDark ? <Moon size={14} color="white" /> : <Sun size={14} color="white" />}
      </div>
    </div>
  );
};

const SummaryCard = ({ 
  title, 
  numericValue, 
  icon: Icon, 
  type, 
  className, 
  subtitle,
  variant = 'default'
}: { 
  title: string, 
  numericValue: number, 
  icon: any, 
  type: 'balance' | 'count' | 'income' | 'expense', 
  className?: string, 
  subtitle?: string,
  variant?: 'default' | 'special'
}) => {
  const valueRef = useRef<HTMLParagraphElement>(null);
  
  useLayoutEffect(() => {
    if (valueRef.current) {
      const obj = { val: 0 };
      gsap.to(obj, {
        val: numericValue,
        duration: 1.5,
        ease: "power3.out",
        onUpdate: () => {
          if (valueRef.current) {
            valueRef.current.textContent = type === 'count' 
              ? Math.floor(obj.val).toString() 
              : `Rp ${Math.floor(obj.val).toLocaleString('id-ID')}`;
          }
        }
      });
    }
  }, [numericValue, type]);

  const isSpecial = variant === 'special';

  return (
    <div className={`clay-card p-6 md:p-8 flex flex-col items-center justify-center text-center ${isSpecial ? 'bg-[#A68B8B]/10' : ''} ${className}`}>
      <div className="relative mb-4">
          <div className={`w-14 h-14 flex items-center justify-center rounded-[22px] clay-inset ${isSpecial ? 'bg-[#A68B8B]/12' : ''}`}>
            <Icon className={`w-7 h-7 ${isSpecial ? 'text-[#A68B8B]' : 'text-[#7C9B93]'}`} strokeWidth={2.5} />
          </div>
      </div>
      <div className="flex flex-col items-center w-full">
        <p className="text-[10px] md:text-[12px] font-black uppercase tracking-widest mb-1 text-muted">{title}</p>
        <p ref={valueRef} className={`text-[18px] md:text-[20px] font-black tracking-tight leading-tight ${isSpecial ? 'text-[#A68B8B]' : 'text-main'}`}>Rp 0</p>
        {subtitle && (
          <div className={`mt-2.5 px-3 py-0.5 rounded-full border shadow-sm ${isSpecial ? 'bg-[#A68B8B]/10 border-[#A68B8B]/25' : 'bg-[#7C9B93]/10 border-[#7C9B93]/20'}`}>
            <p className={`text-[8px] font-black uppercase tracking-widest ${isSpecial ? 'text-[#A68B8B]' : 'text-[#7C9B93]'}`}>{subtitle}</p>
          </div>
        )}
      </div>
    </div>
  );
};

const CustomTooltip = ({ active, payload, isDark }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const value = payload[0].value;
    const displayValue = `Rp ${Math.floor(value).toLocaleString('id-ID')}`;

    return (
      <div className="clay-card p-4 border-none shadow-2xl scale-105">
        <p className="text-[13px] font-bold text-main mb-1.5">{payload[0].name || data.month || data.name}</p>
        <p className="text-[16px] font-black text-[#7C9B93]">
          {displayValue}
        </p>
      </div>
    );
  }
  return null;
};

const WelcomeSection = () => {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="clay-card overflow-hidden p-8 md:p-12 relative fade-in-section">
      <div className="welcome-blob bg-[#7C9B93] w-[300px] h-[300px] -top-20 -left-20"></div>
      <div className="welcome-blob bg-[#A68B8B] w-[200px] h-[200px] -bottom-10 -right-10"></div>
      
      <div className="flex flex-col md:flex-row md:items-center gap-6 mb-8">
        <div className="w-16 h-16 clay-inset flex items-center justify-center text-[#7C9B93]">
          <ShieldCheck size={32} strokeWidth={2.5} />
        </div>
        <div>
            <h2 className="text-[18px] md:text-[22px] font-black uppercase tracking-widest text-main mb-1">Transparansi & Amanah</h2>
            <div className="h-1.5 w-24 bg-[#7C9B93] rounded-full opacity-40" />
        </div>
      </div>
      
      <div className={`text-[15px] md:text-[17px] font-medium leading-relaxed text-main transition-all duration-700 ease-in-out ${!expanded ? 'max-md:max-h-[100px] overflow-hidden' : ''}`}>
        <p className="mb-6 opacity-90">
          Setiap data dan angka yang kami tampilkan di halaman sederhana ini disajikan secara terbuka sebagai bentuk penjagaan amanah. Transparansi ini kami hadirkan sebagai wujud tanggung jawab atas setiap titipan yang dikelola, sebelum semuanya kelak dipertanggungjawabkan di hadapan Allah ta'ala.
        </p>
        <div className="p-6 clay-inset bg-[#7C9B93]/5 rounded-3xl">
          <p className="italic text-muted font-medium">
            "Jazakumullahu khairan atas kepercayaan dan infak yang telah dititipkan. Semoga setiap rupiah menjadi amal jariyah yang terus mengalir pahalanya, serta menjadi bagian dari keberkahan bagi generasi yang sedang kita jaga bersama."
          </p>
        </div>
      </div>
      
      <button 
        onClick={() => setExpanded(!expanded)}
        className="md:hidden mt-6 flex items-center gap-2 px-6 py-3 rounded-full clay-button text-[12px] font-black uppercase text-[#7C9B93]"
      >
        {expanded ? <><ChevronUp size={16}/> Tutup</> : <><ChevronDown size={16}/> Selengkapnya</>}
      </button>
    </div>
  );
};

const App: React.FC = () => {
  const [activeProject, setActiveProject] = useState<ProjectType>('Semua');
  const [filter, setFilter] = useState<'all' | 'income' | 'expense'>('all');
  const [isDark, setIsDark] = useState(false);
  const [selectedAllocation, setSelectedAllocation] = useState<{
    name: string;
    x: number;
    y: number;
    side: 'left' | 'right';
  } | null>(null);

  useEffect(() => {
    if (isDark) document.body.classList.add('dark-mode');
    else document.body.classList.remove('dark-mode');
  }, [isDark]);

  const aggregatedData = useMemo(() => {
    const allProjects = ['Resik', 'Siyar', 'Hadeyya', 'Haru'];
    let totalBalance = 0, totalIncome = 0, totalExpense = 0;
    let allTransactions: any[] = [];
    const projectBalanceContributions: any[] = [];

    allProjects.forEach((key, idx) => {
      const p = PROJECT_DATA[key];
      totalBalance += p.summary.balance;
      totalIncome += p.summary.income;
      totalExpense += p.summary.expense;
      allTransactions = [...allTransactions, ...p.transactions.map(t => ({ ...t, project: key }))];
      
      projectBalanceContributions.push({
        name: key,
        value: p.summary.balance,
        color: COLORS.projects[idx % COLORS.projects.length]
      });
    });

    allTransactions.sort((a, b) => {
      const dateA = new Date(a.date.split('/').reverse().join('-')).getTime();
      const dateB = new Date(b.date.split('/').reverse().join('-')).getTime();
      return dateB - dateA;
    });

    return {
      summary: { balance: totalBalance, income: totalIncome, expense: totalExpense },
      transactions: allTransactions,
      projectBalanceContributions,
      monthlyFlow: PROJECT_DATA['Resik'].monthlyFlow.map((f, i) => ({
        month: f.month,
        income: allProjects.reduce((acc, k) => acc + (PROJECT_DATA[k].monthlyFlow[i]?.income || 0), 0),
        expense: allProjects.reduce((acc, k) => acc + (PROJECT_DATA[k].monthlyFlow[i]?.expense || 0), 0),
      }))
    };
  }, []);

  const resikStats = useMemo(() => {
    const resikTransactions = PROJECT_DATA['Resik'].transactions;
    
    // Perhitungan yang lebih akurat untuk dana 'Disalurkan'
    const distributed = resikTransactions.reduce((acc, tx) => {
      const desc = tx.description.toLowerCase();
      // Mengambil item Penyaluran/Disalurkan yang bukan merupakan alokasi tabungan
      if ((desc.includes('salur') || (desc.includes('cinta guru') && !desc.includes('tabungan'))) && tx.expense) {
        return acc + tx.expense;
      }
      return acc;
    }, 0);

    const savings = resikTransactions.reduce((acc, tx) => {
      const desc = tx.description.toLowerCase();
      if (desc.includes('tabungan') && tx.expense) {
        return acc + tx.expense;
      }
      return acc;
    }, 0);
    
    return { savings, distributed };
  }, []);

  const currentData = activeProject === 'Semua' ? aggregatedData : PROJECT_DATA[activeProject];
  const Icon = ProjectIcons[activeProject];
  const Timeline = ProjectTimelines[activeProject];

  const pieData = useMemo(() => {
    if (activeProject === 'Semua') {
      const resikCintaGuru = PROJECT_DATA['Resik'].transactions.reduce((acc, tx) => {
        const desc = tx.description.toLowerCase();
        return desc.includes('cinta guru') && tx.expense ? acc + tx.expense : acc;
      }, 0);
      const haruForCintaGuru = PROJECT_DATA['Haru'].summary.balance;
      const bilistiwa = PROJECT_DATA['Siyar'].transactions.reduce((acc, tx) => {
        const desc = tx.description.toLowerCase();
        return (desc.includes('blistiwa') || desc.includes('bilistiwa')) && tx.expense ? acc + tx.expense : acc;
      }, 0);
      const situasional = PROJECT_DATA['Hadeyya'].summary.balance;

      return [
        { name: 'Dana Cinta Guru', value: resikCintaGuru + haruForCintaGuru, color: '#7C9B93' },
        { name: 'Bilistiwa', value: bilistiwa, color: '#A68B8B' },
        { name: 'Situasional', value: situasional, color: '#638079' }
      ];
    }
    const categories = (currentData as any).expenseCategories || [];
    const totalAmount = currentData.summary.expense;
    return categories.map((cat: any) => ({
      ...cat,
      nominal: Math.round((cat.value / 100) * totalAmount)
    }));
  }, [activeProject, currentData, aggregatedData]);

  const pieTotal = useMemo(() => {
    return pieData.reduce((acc: number, item: any) => {
      return acc + (activeProject === 'Semua' ? (item.value || 0) : (item.nominal || 0));
    }, 0);
  }, [pieData, activeProject]);

  const formatCompactCurrency = (value: number) => {
    if (value >= 1000000000) return `Rp ${(value / 1000000000).toFixed(2).replace('.', ',')} M`;
    if (value >= 1000000) return `Rp ${(value / 1000000).toFixed(2).replace('.', ',')} jt`;
    return `Rp ${Math.round(value).toLocaleString('id-ID')}`;
  };

  const normalizeChartColor = (color: string) => {
    const c = color.toLowerCase();
    if (c === '#7c9b93' || c === '#a4c1b9' || c === '#8eb1a7' || c === '#638079') return PRIMARY_SOLID;
    if (c === '#d1d1c7') return '#C9D6D9';
    if (c === '#8e8e8e') return '#718096';
    return color;
  };

  const pieDisplayData = useMemo(() => {
    return pieData.map((item: any, index: number) => ({
      ...item,
      renderColor: CHART_UNIQUE_PALETTE[index % CHART_UNIQUE_PALETTE.length]
    }));
  }, [pieData]);

  const allocationProjectsMap: Record<string, string> = {
    'Dana Cinta Guru': 'Haru dan Resik',
    'Bilistiwa': 'Siyar',
    'Situasional': 'Hadeyya'
  };

  useEffect(() => {
    setSelectedAllocation(null);
  }, [activeProject]);

  useLayoutEffect(() => {
    gsap.fromTo(".card-anim", { y: 20, opacity: 0, scale: 0.9 }, { y: 0, opacity: 1, scale: 1, duration: 0.5, ease: "back.out(1.7)", stagger: 0.08 });
    gsap.fromTo(".fade-in-section", { opacity: 0 }, { opacity: 1, duration: 1 });
  }, [activeProject]);

  const projects: ProjectType[] = ['Semua', 'Resik', 'Hadeyya', 'Siyar', 'Haru'];

  const filteredTransactions = currentData.transactions.filter(t => {
    if (filter === 'all') return true;
    return filter === 'income' ? t.income !== null : t.expense !== null;
  });

  return (
    <div className="min-h-screen p-4 md:p-10 max-w-7xl mx-auto space-y-12 pb-40">
      
      <header className="flex justify-between items-center fade-in-section">
        <div className="flex items-center space-x-6">
            <div className="w-16 h-16 clay-card flex items-center justify-center">
                <Icon className="text-[#7C9B93]" size={32} />
            </div>
            <div>
                <h1 className="text-[12px] font-black uppercase tracking-[0.25em] text-muted mb-1">Project Ummahat</h1>
                <div className="flex flex-col">
                  <p className="text-[28px] md:text-[36px] font-black text-main leading-none">{activeProject}</p>
                  <p className="text-[10px] font-black text-[#7C9B93] uppercase tracking-[0.2em] mt-1">{Timeline}</p>
                </div>
            </div>
        </div>
        <SkyToggle isDark={isDark} onToggle={() => setIsDark(!isDark)} />
      </header>

      <nav className="hidden md:flex justify-center fade-in-section">
        <div className="clay-inset p-3 flex gap-3">
          {projects.map((proj) => (
            <button key={proj} onClick={() => setActiveProject(proj)}
              className={`clay-button ${activeProject === proj ? 'active' : ''}`}
            >
              {proj}
            </button>
          ))}
        </div>
      </nav>

      {activeProject === 'Semua' && <WelcomeSection />}

      {activeProject === 'Resik' ? (
        <div className="grid grid-cols-2 gap-4 sm:gap-8">
          <SummaryCard title="Total Saldo" numericValue={currentData.summary.balance} icon={Wallet} type="balance" className="card-anim" />
          <SummaryCard title="Transaksi" numericValue={currentData.transactions.length} icon={History} type="count" className="card-anim" />
          <SummaryCard title="Disalurkan" numericValue={resikStats.distributed} icon={Heart} type="expense" variant="special" className="card-anim" subtitle="Ramadhan Lalu" />
          <SummaryCard title="Tabungan Cinta Guru" numericValue={resikStats.savings} icon={Heart} type="expense" variant="special" className="card-anim" subtitle="Di Bendahara" />
          <SummaryCard title="Total Masuk" numericValue={currentData.summary.income} icon={TrendingUp} type="income" className="card-anim" />
          <SummaryCard title="Total Keluar" numericValue={currentData.summary.expense} icon={TrendingDown} type="expense" className="card-anim" />
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-8">
          <SummaryCard title="Total Saldo" numericValue={currentData.summary.balance} icon={Wallet} type="balance" className="card-anim" />
          <SummaryCard title="Transaksi" numericValue={currentData.transactions.length} icon={History} type="count" className="card-anim" />
          <SummaryCard title="Total Masuk" numericValue={currentData.summary.income} icon={TrendingUp} type="income" className="card-anim" />
          <SummaryCard title="Total Keluar" numericValue={currentData.summary.expense} icon={TrendingDown} type="expense" className="card-anim" />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 fade-in-section">
        <div className="lg:col-span-2 clay-card p-10">
            <h3 className="text-[12px] font-black uppercase tracking-widest text-main flex items-center gap-3 mb-12">
                <div className="p-2 clay-inset text-[#7C9B93]"><BarChart3 size={18} /></div>
                {activeProject === 'Semua' ? 'Saldo Tersisa per Project' : 'Visualisasi Data'}
            </h3>
            <div className="h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                    {activeProject === 'Semua' ? (
                        <BarChart data={aggregatedData.projectBalanceContributions} layout="vertical" margin={{ left: 20 }}>
                            <XAxis type="number" hide />
                            <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: 800, fill: 'var(--text-main)' }} width={80} />
                            <Tooltip content={<CustomTooltip isDark={isDark} />} cursor={{ fill: 'transparent' }} />
                            <Bar dataKey="value" radius={[0, 15, 15, 0]} barSize={30}>
                                {aggregatedData.projectBalanceContributions.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Bar>
                        </BarChart>
                    ) : (
                        <AreaChart data={currentData.monthlyFlow}>
                          <defs>
                            <linearGradient id="colorIn" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#7C9B93" stopOpacity={0.2}/>
                              <stop offset="95%" stopColor="#7C9B93" stopOpacity={0}/>
                            </linearGradient>
                            <linearGradient id="colorOut" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#A68B8B" stopOpacity={0.2}/>
                              <stop offset="95%" stopColor="#A68B8B" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="8 8" vertical={false} stroke="var(--clay-shadow-out-dark)" opacity={0.5} />
                          <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 800, fill: 'var(--text-muted)' }} />
                          <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 800, fill: 'var(--text-muted)' }} tickFormatter={(v) => v >= 1000000 ? `${v/1000000}jt` : v} />
                          <Tooltip content={<CustomTooltip isDark={isDark} />} />
                          <Area type="monotone" dataKey="income" stroke="#7C9B93" strokeWidth={4} fill="url(#colorIn)" />
                          <Area type="monotone" dataKey="expense" stroke="#A68B8B" strokeWidth={4} fill="url(#colorOut)" />
                        </AreaChart>
                    )}
                </ResponsiveContainer>
            </div>
        </div>

        <div className="clay-card p-10 flex flex-col items-center">
             <h3 className="text-[12px] font-black uppercase tracking-widest text-main mb-12 flex items-center gap-3">
                 <div className="p-2 clay-inset text-[#7C9B93]"><PieIcon size={18} /></div>
                 {activeProject === 'Semua' ? 'Alokasi Dana Semua Project' : 'Penyaluran'}
             </h3>
             <div className="h-[300px] w-full relative">
                <ResponsiveContainer width="100%" height="100%">
                    <RePieChart>
                        <defs>
                          {pieDisplayData.map((e: any, i: number) => {
                            const baseColor = normalizeChartColor(e.renderColor || e.color || COLORS.projects[i % COLORS.projects.length]);
                            return (
                              <linearGradient key={`pie-grad-${i}`} id={`pie-grad-${i}`} x1="0" y1="0" x2="1" y2="1">
                                <stop offset="0%" stopColor={baseColor} stopOpacity={1} />
                                <stop offset="100%" stopColor={baseColor} stopOpacity={1} />
                              </linearGradient>
                            );
                          })}
                        </defs>
                        <Pie
                          data={[{ name: 'track', value: 100 }]}
                          dataKey="value"
                          cx="50%"
                          cy="50%"
                          innerRadius="62%"
                          outerRadius="88%"
                          startAngle={90}
                          endAngle={-270}
                          isAnimationActive={false}
                          stroke="none"
                        >
                          <Cell fill={isDark ? 'rgba(255,255,255,0.08)' : 'rgba(124,155,147,0.12)'} />
                        </Pie>
                        <Pie
                          data={pieDisplayData}
                          cx="50%"
                          cy="50%"
                          innerRadius="62%"
                          outerRadius="88%"
                          dataKey="value"
                          paddingAngle={6}
                          cornerRadius={18}
                          startAngle={90}
                          endAngle={-270}
                          stroke="none"
                          onClick={(entry: any) => {
                            if (activeProject === 'Semua') {
                              const cx = entry?.cx ?? 150;
                              const posX = entry?.tooltipPosition?.x ?? cx;
                              const posY = entry?.tooltipPosition?.y ?? (entry?.cy ?? 150);
                              setSelectedAllocation({
                                name: entry?.name || '',
                                x: posX,
                                y: posY,
                                side: posX >= cx ? 'right' : 'left'
                              });
                            }
                          }}
                        >
                            {pieDisplayData.map((e: any, i: number) => (
                              <Cell
                                key={i}
                                fill={`url(#pie-grad-${i})`}
                                style={{ cursor: activeProject === 'Semua' ? 'pointer' : 'default' }}
                                opacity={
                                  activeProject === 'Semua' && selectedAllocation
                                    ? (e.name === selectedAllocation.name ? 1 : 0.35)
                                    : 1
                                }
                              />
                            ))}
                        </Pie>
                    </RePieChart>
                </ResponsiveContainer>
                {activeProject === 'Semua' && selectedAllocation && (
                  <div
                    className="pointer-events-none absolute z-10"
                    style={{
                      left: `${selectedAllocation.x}px`,
                      top: `${selectedAllocation.y}px`,
                      transform: selectedAllocation.side === 'right'
                        ? 'translate(14px, -50%)'
                        : 'translate(calc(-100% - 14px), -50%)'
                    }}
                  >
                    <div className="clay-inset rounded-[18px] px-4 py-2 text-left min-w-[150px]">
                      <p className="text-[9px] font-black uppercase tracking-[0.1em] text-muted">Keterangan</p>
                      <p className="text-[10px] font-black uppercase text-main mt-1">{selectedAllocation.name}</p>
                      <p className="text-[10px] font-black text-[#7C9B93] mt-0.5">{allocationProjectsMap[selectedAllocation.name] || '-'}</p>
                    </div>
                  </div>
                )}
             </div>
             <div className="mt-8 space-y-4 w-full">
                {pieDisplayData.map((p: any, i: number) => (
                    <div key={i} className="flex items-center justify-between p-4 clay-inset rounded-[24px]">
                        <div className="flex items-center gap-3">
                            <div className="w-4 h-4 rounded-full shadow-[0_2px_8px_rgba(0,0,0,0.18)]" style={{ background: normalizeChartColor(p.renderColor || p.color || COLORS.projects[i % COLORS.projects.length]) }} />
                            <div className="flex flex-col">
                              <span className="text-[11px] font-black uppercase text-main">{p.name}</span>
                              {activeProject === 'Semua' && (
                                <span className="text-[9px] font-black uppercase text-muted mt-0.5">
                                  {allocationProjectsMap[p.name] || '-'}
                                </span>
                              )}
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[14px] font-black text-main">{formatCompactCurrency(activeProject === 'Semua' ? p.value : p.nominal)}</span>
                          <span className="badge-clay text-main text-[12px]">
                            {activeProject === 'Semua'
                              ? `${Math.round(((p.value || 0) / Math.max(pieTotal, 1)) * 100)}%`
                              : `${p.value}%`}
                          </span>
                        </div>
                    </div>
                ))}
             </div>
        </div>
      </div>

      <div className="clay-card p-6 md:p-10 fade-in-section">
        <div className="flex flex-col md:flex-row justify-between items-center mb-12 gap-6">
          <h3 className="text-[16px] font-black uppercase tracking-widest text-main flex items-center gap-3">
            <History size={20} className="text-[#7C9B93]" /> Riwayat Transaksi
          </h3>
          <div className="clay-inset p-2 flex gap-2">
            {(['all', 'income', 'expense'] as const).map((m) => (
              <button
                key={m}
                onClick={() => setFilter(m)}
                className={`px-6 py-2 rounded-full text-[11px] font-black uppercase transition-all ${
                  filter === m
                    ? 'bg-[#7C9B93] text-white shadow-[0_3px_10px_rgba(124,155,147,0.22)]'
                    : 'text-muted'
                }`}
              >
                {m === 'all' ? 'Semua' : m === 'income' ? 'Masuk' : 'Keluar'}
              </button>
            ))}
          </div>
        </div>
        <div className="table-scroll-container no-scrollbar">
          <table className="w-full border-separate border-spacing-y-4 min-w-[600px]">
            <thead>
              <tr className="text-[10px] font-black uppercase tracking-widest text-muted">
                <th className="px-6 py-2 text-left w-20">#</th>
                <th className="px-6 py-2 text-left w-32">Tanggal</th>
                <th className="px-6 py-2 text-left">Uraian</th>
                <th className="px-6 py-2 text-right w-48">Jumlah</th>
              </tr>
            </thead>
            <tbody className="text-[14px]">
              {filteredTransactions.slice(0, 100).map((tx, i) => (
                <tr key={i} className="group">
                  <td className="txn-index-chip px-6 py-5 rounded-l-[24px] clay-inset shadow-none bg-white/20"><span className="txn-index-text font-black text-muted">{(i + 1).toString().padStart(2, '0')}</span></td>
                  <td className="px-6 py-5 font-black text-muted text-[12px]">{tx.date}</td>
                  <td className="px-6 py-5 font-black uppercase text-[12px] tracking-tight text-main">{tx.description}</td>
                  <td className="px-6 py-5 text-right rounded-r-[24px] whitespace-nowrap">
                     <span className={`font-black ${tx.income ? 'text-[#7C9B93]' : 'text-[#A68B8B]'}`}>{tx.income ? `+ ${tx.income.toLocaleString('id-ID')}` : `- ${tx.expense?.toLocaleString('id-ID')}`}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-50 md:hidden w-[90%]">
        <div className="mobile-nav-dock p-2 flex items-center justify-between gap-1 overflow-x-auto no-scrollbar">
          {projects.map((proj) => {
            const ProjIcon = ProjectIcons[proj];
            const isActive = activeProject === proj;
            return (
              <button
                key={proj}
                onClick={() => setActiveProject(proj)}
                className={`mobile-menu-btn flex flex-col items-center justify-center p-3 flex-1 min-w-[60px] ${isActive ? 'active' : ''}`}
              >
                <ProjIcon size={18} className="menu-icon" />
                <span className="menu-label text-[12px] font-black uppercase mt-1">{proj}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default App;
