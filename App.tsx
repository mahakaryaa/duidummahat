
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
  Users,
  User,
  Target,
  CalendarDays,
  HandHeart,
  Trash2,
  Recycle,
  Pencil,
  Plus,
  X,
  FileSpreadsheet,
  FileText
} from 'lucide-react';
import { PROJECT_DATA, ProjectData } from './constants';
import GiftBoxAnimation from './GiftBoxAnimation';

declare const gsap: any;
const hasGsap = () => typeof gsap !== 'undefined' && typeof gsap?.to === 'function' && typeof gsap?.fromTo === 'function';

const COLORS = {
  projects: ['#7C9B93', '#4A5568', '#A68B8B', '#718096', '#C9D6D9']
};
const PRIMARY_SOLID = '#7C9B93';
const CHART_UNIQUE_PALETTE = ['#7C9B93', '#CDCC78', '#A68B8B', '#718096', '#C9D6D9', '#4A5568', '#8EB1A7'];
const PROJECT_BACKGROUND_THEME: Record<'Semua' | 'Resik' | 'Hadeyya' | 'Siyar' | 'Haru', { bg: string; grid: string }> = {
  Semua: { bg: '#E2E7EA', grid: '#DEE4E8' },
  Resik: { bg: '#E8F1F2', grid: '#E8F1F2' },
  Hadeyya: { bg: '#F6E7EE', grid: '#F3E2EA' },
  Siyar: { bg: '#EFE8CE', grid: '#ECE3C3' },
  Haru: { bg: '#E6EEF9', grid: '#E1EAF6' }
};
const PROJECT_MENU_THEME: Record<'Semua' | 'Resik' | 'Hadeyya' | 'Siyar' | 'Haru', string> = {
  Semua: '#8E98A3',
  Resik: '#7C9B93',
  Hadeyya: '#B9899D',
  Siyar: '#A58B42',
  Haru: '#6F8FBE'
};

type ProjectType = 'Semua' | 'Resik' | 'Hadeyya' | 'Siyar' | 'Haru';
type ProjectKey = Exclude<ProjectType, 'Semua'>;
type ProjectProfile = ProjectData['profile'];

const PROJECT_KEYS: ProjectKey[] = ['Resik', 'Hadeyya', 'Siyar', 'Haru'];
const PROFILE_STORAGE_KEY = 'ummahat_profiles_v1';
const MANUAL_REPORT_STORAGE_KEY = 'ummahat_manual_reports_v1';
const VOLUNTEER_STORAGE_KEY = 'ummahat_volunteer_apply_v1';

const ADMIN_ACCOUNTS: Array<{ username: string; password: string; project: ProjectKey | 'all' }> = [
  { username: 'resik.admin', password: 'resik123', project: 'Resik' },
  { username: 'hadeyya.admin', password: 'hadeyya123', project: 'Hadeyya' },
  { username: 'siyar.admin', password: 'siyar123', project: 'Siyar' },
  { username: 'haru.admin', password: 'haru123', project: 'Haru' },
  { username: 'superadmin', password: 'ummahat2026', project: 'all' }
];

const cloneProfile = (profile: ProjectProfile): ProjectProfile => JSON.parse(JSON.stringify(profile));
const LEGACY_RESIK_TEAM_NAMES = new Set(['Ummu Nabila', 'Ummu Aisha', 'Ummu Safa', 'Kak Ratna Wulan', 'Kak Rini', 'Bu Nyai']);

type ManualReportRow = {
  id: number;
  date: string;
  type: 'Masuk' | 'Keluar' | 'Tabungan';
  description: string;
  amount: number;
  category: string;
  note: string;
};

type ManualReportDraft = {
  date: string;
  type: 'Masuk' | 'Keluar' | 'Tabungan';
  description: string;
  amountInput: string;
  category: string;
  note: string;
};

type VolunteerApply = {
  id: number;
  project: ProjectKey;
  name: string;
  skill: string;
  commitment: string;
  createdAt: string;
};

const getDefaultProfiles = (): Record<ProjectKey, ProjectProfile> => ({
  Resik: cloneProfile(PROJECT_DATA.Resik.profile),
  Hadeyya: cloneProfile(PROJECT_DATA.Hadeyya.profile),
  Siyar: cloneProfile(PROJECT_DATA.Siyar.profile),
  Haru: cloneProfile(PROJECT_DATA.Haru.profile)
});

const createEmptyManualRow = (): ManualReportRow => ({
  id: 0,
  date: '',
  type: 'Masuk',
  description: '',
  amount: 0,
  category: '',
  note: ''
});

const createEmptyManualDraft = (): ManualReportDraft => ({
  date: new Date().toISOString().slice(0, 10),
  type: 'Masuk',
  description: '',
  amountInput: '',
  category: '',
  note: ''
});

const getDefaultManualReports = (): Record<ProjectType, ManualReportRow[]> => ({
  Semua: [],
  Resik: [],
  Hadeyya: [],
  Siyar: [],
  Haru: []
});

const getDefaultVolunteerApply = (): Record<ProjectKey, VolunteerApply[]> => ({
  Resik: [],
  Hadeyya: [],
  Siyar: [],
  Haru: []
});

const parseRupiahInput = (raw: string): number => {
  const digits = raw.replace(/[^\d]/g, '');
  if (!digits) return 0;
  return Number.parseInt(digits, 10);
};

const formatRupiah = (value: number): string => `Rp ${Math.max(0, Math.round(value)).toLocaleString('id-ID')}`;

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
  variant = 'default',
  accentColor = '#7C9B93'
}: { 
  title: string, 
  numericValue: number, 
  icon: any, 
  type: 'balance' | 'count' | 'income' | 'expense', 
  className?: string, 
  subtitle?: string,
  variant?: 'default' | 'special',
  accentColor?: string
}) => {
  const valueRef = useRef<HTMLParagraphElement>(null);
  
  useLayoutEffect(() => {
    if (valueRef.current) {
      if (!hasGsap()) {
        valueRef.current.textContent =
          type === 'count'
            ? Math.floor(numericValue).toString()
            : `Rp ${Math.floor(numericValue).toLocaleString('id-ID')}`;
        return;
      }
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
            <Icon className={`w-7 h-7 ${isSpecial ? 'text-[#A68B8B]' : ''}`} style={!isSpecial ? { color: accentColor } : undefined} strokeWidth={2.5} />
          </div>
      </div>
      <div className="flex flex-col items-center w-full">
        <p className="text-[10px] md:text-[12px] font-black uppercase tracking-widest mb-1 text-muted">{title}</p>
        <p ref={valueRef} className={`text-[18px] md:text-[20px] font-black tracking-tight leading-tight ${isSpecial ? 'text-[#A68B8B]' : 'text-main'}`}>Rp 0</p>
        {subtitle && (
          <div
            className={`mt-2.5 px-3 py-0.5 rounded-full border shadow-sm ${isSpecial ? 'bg-[#A68B8B]/10 border-[#A68B8B]/25' : ''}`}
            style={!isSpecial ? { backgroundColor: `${accentColor}1A`, borderColor: `${accentColor}55` } : undefined}
          >
            <p className={`text-[8px] font-black uppercase tracking-widest ${isSpecial ? 'text-[#A68B8B]' : ''}`} style={!isSpecial ? { color: accentColor } : undefined}>{subtitle}</p>
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

const ProjectProfileSection = ({
  projectName,
  vision,
  missions,
  agenda,
  team,
  onVolunteerApply,
  accentColor = '#7C9B93',
  isAdminMode,
  onEditVision,
  onEditMissions,
  onEditTeam,
  onEditAgenda,
  isProfileMinimized,
  onToggleProfileMinimize,
  isAgendaMinimized,
  onToggleAgendaMinimize,
  isJoinMinimized,
  onToggleJoinMinimize
}: {
  projectName: string;
  vision: string;
  missions: string[];
  agenda: string[];
  team: Array<{ name: string; role: string; photo: string }>;
  onVolunteerApply?: (payload: { project: ProjectKey; name: string; skill: string; commitment: string }) => void;
  accentColor?: string;
  isAdminMode?: boolean;
  onEditVision?: () => void;
  onEditMissions?: () => void;
  onEditTeam?: () => void;
  onEditAgenda?: () => void;
  isProfileMinimized: boolean;
  onToggleProfileMinimize: () => void;
  isAgendaMinimized: boolean;
  onToggleAgendaMinimize: () => void;
  isJoinMinimized: boolean;
  onToggleJoinMinimize: () => void;
}) => {
  const [commitmentType, setCommitmentType] = useState<'1 bulan' | '4 bulan' | 'permanen'>('1 bulan');
  const [volunteerName, setVolunteerName] = useState('');
  const [volunteerNote, setVolunteerNote] = useState('');
  const [joinMessage, setJoinMessage] = useState('');

  const TeamIdentityIcon = () => (
    <div className="relative w-11 h-11 md:w-12 md:h-12 flex-shrink-0">
      <span
        className="absolute -top-1 left-1/2 -translate-x-1/2 w-2.5 h-2.5 rounded-full bg-white border-2"
        style={{ borderColor: accentColor }}
      />
      <span
        className="absolute inset-0 rounded-full border-[3px]"
        style={{ borderColor: accentColor }}
      />
      <span
        className="absolute inset-[5px] rounded-full border-2 bg-white/80 flex items-center justify-center"
        style={{ borderColor: `${accentColor}AA` }}
      >
        <User size={17} style={{ color: accentColor }} strokeWidth={2.2} />
      </span>
    </div>
  );

  useEffect(() => {
    setCommitmentType('1 bulan');
    setVolunteerName('');
    setVolunteerNote('');
    setJoinMessage('');
  }, [projectName]);

  const handleJoinSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const duration = commitmentType;
    const name = volunteerName.trim() || 'Calon relawan';
    setJoinMessage(`${name} siap join project ${projectName} dengan komitmen ${duration}. Tim akan menindaklanjuti.`);
    if (projectName !== 'Semua') {
      onVolunteerApply?.({
        project: projectName as ProjectKey,
        name,
        skill: volunteerNote.trim() || '-',
        commitment: duration
      });
    }
  };

  return (
    <div className="clay-card p-8 md:p-10 fade-in-section">
      <div className="space-y-6">
        <div>
          <div className="flex items-center justify-between gap-4 mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 clay-inset">
                <Users size={18} style={{ color: accentColor }} />
              </div>
              <h3 className="text-[12px] font-black uppercase tracking-widest text-main">Profil Project</h3>
            </div>
            <button
              onClick={onToggleProfileMinimize}
              className="clay-button !px-4 !py-2 !rounded-2xl text-[10px] md:text-[11px] font-black uppercase !tracking-[0.18em] flex items-center gap-1.5"
              style={{ color: accentColor }}
            >
              {isProfileMinimized ? <><ChevronDown size={14} /> Expand</> : <><ChevronUp size={14} /> Minimize</>}
            </button>
          </div>

          {!isProfileMinimized && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 md:gap-10">
              <div className="lg:col-span-2 space-y-6">
                <div className="clay-inset p-5 md:p-6">
                  <div className="flex items-center justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      <Target size={18} style={{ color: accentColor }} />
                      <h3 className="text-[12px] font-black uppercase tracking-widest text-main">Visi</h3>
                    </div>
                    {isAdminMode && (
                      <button onClick={onEditVision} className="clay-button !px-3 !py-1.5 !rounded-xl text-[9px] font-black uppercase !tracking-widest !text-[#7C9B93]">
                        Edit
                      </button>
                    )}
                  </div>
                  <p className="text-[13px] md:text-[15px] font-semibold leading-relaxed text-main">{vision}</p>
                </div>

                <div className="clay-inset p-5 md:p-6">
                  <div className="flex items-center justify-between gap-3 mb-4">
                    <div className="flex items-center gap-3">
                      <ShieldCheck size={18} style={{ color: accentColor }} />
                      <h3 className="text-[12px] font-black uppercase tracking-widest text-main">Misi</h3>
                    </div>
                    {isAdminMode && (
                      <button onClick={onEditMissions} className="clay-button !px-3 !py-1.5 !rounded-xl text-[9px] font-black uppercase !tracking-widest !text-[#7C9B93]">
                        Edit
                      </button>
                    )}
                  </div>
                  <ul className="space-y-2.5">
                    {missions.map((mission, idx) => (
                      <li key={idx} className="text-[12px] md:text-[14px] font-semibold text-main flex items-start gap-2.5">
                        <span className="font-black" style={{ color: accentColor }}>{idx + 1}.</span>
                        <span className="leading-relaxed">{mission}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="clay-inset p-5 md:p-6">
                <div className="flex items-center justify-between gap-3 mb-4">
                  <div className="flex items-center gap-3">
                    <Users size={18} style={{ color: accentColor }} />
                    <h3 className="text-[12px] font-black uppercase tracking-widest text-main">Our Best Team</h3>
                  </div>
                  {isAdminMode && (
                    <button onClick={onEditTeam} className="clay-button !px-3 !py-1.5 !rounded-xl text-[9px] font-black uppercase !tracking-widest !text-[#7C9B93]">
                      Edit
                    </button>
                  )}
                </div>
                <div className="max-h-[200px] md:max-h-[230px] overflow-y-auto pr-1.5 space-y-0">
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-5 md:gap-x-6 gap-y-4 md:gap-y-5">
                  {team.map((member) => (
                    <div key={member.name} className="min-h-[58px] flex items-center gap-3">
                      <TeamIdentityIcon />
                      <div className="min-w-0 flex flex-col gap-1">
                        <span className="text-[11px] font-black text-main leading-tight truncate">{member.name}</span>
                        <span className="text-[9px] font-black uppercase tracking-widest text-muted truncate">{member.role}</span>
                      </div>
                    </div>
                  ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="py-1">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="p-2 clay-inset">
                  <CalendarDays size={18} style={{ color: accentColor }} />
                </div>
                <h3 className="text-[12px] font-black uppercase tracking-widest text-main">Agenda Project</h3>
              </div>
              <button
                type="button"
                onClick={onToggleAgendaMinimize}
                className="clay-button !px-4 !py-2 !rounded-2xl text-[10px] md:text-[11px] font-black uppercase !tracking-[0.18em] flex items-center gap-1.5"
                style={{ color: accentColor }}
              >
                {isAgendaMinimized ? <><ChevronDown size={14} /> Expand</> : <><ChevronUp size={14} /> Minimize</>}
              </button>
            </div>
            {isAdminMode && !isAgendaMinimized && (
              <div className="mb-3">
                <button onClick={onEditAgenda} className="clay-button !px-3 !py-1.5 !rounded-xl text-[9px] font-black uppercase !tracking-widest !text-[#7C9B93]">
                  Edit Agenda
                </button>
              </div>
            )}
            {!isAgendaMinimized && (
              <ul className="space-y-2.5 mt-4 pl-1">
                {agenda.map((item, idx) => (
                  <li key={idx} className="text-[12px] md:text-[14px] font-semibold text-main flex items-start gap-2.5">
                    <span className="font-black" style={{ color: accentColor }}>{idx + 1}.</span>
                    <span className="leading-relaxed">{item}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="py-1">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="p-2 clay-inset">
                  <HandHeart size={18} style={{ color: accentColor }} />
                </div>
                <h3 className="text-[12px] font-black uppercase tracking-widest text-main">Join Project / Relawan</h3>
              </div>
              <button
                type="button"
                onClick={onToggleJoinMinimize}
                className="clay-button !px-4 !py-2 !rounded-2xl text-[10px] md:text-[11px] font-black uppercase !tracking-[0.18em] flex items-center gap-1.5"
                style={{ color: accentColor }}
              >
                {isJoinMinimized ? <><ChevronDown size={14} /> Expand</> : <><ChevronUp size={14} /> Minimize</>}
              </button>
            </div>

            {!isJoinMinimized && (
              <form className="space-y-4 mt-4 pl-1" onSubmit={handleJoinSubmit}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <input
                    value={volunteerName}
                    onChange={(e) => setVolunteerName(e.target.value)}
                    placeholder="Nama relawan (opsional)"
                    className="w-full rounded-2xl px-4 py-3 text-[12px] font-semibold text-main placeholder:text-muted outline-none bg-transparent border border-[#7C9B93]/20 focus:border-[#7C9B93]/45 transition-colors"
                  />
                  <input
                    value={volunteerNote}
                    onChange={(e) => setVolunteerNote(e.target.value)}
                    placeholder="Minat/keahlian (opsional)"
                    className="w-full rounded-2xl px-4 py-3 text-[12px] font-semibold text-main placeholder:text-muted outline-none bg-transparent border border-[#7C9B93]/20 focus:border-[#7C9B93]/45 transition-colors"
                  />
                </div>

                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted mb-2">Durasi Komitmen</p>
                  <div className="grid grid-cols-3 gap-2">
                    {(['1 bulan', '4 bulan', 'permanen'] as const).map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => setCommitmentType(opt)}
                        className={`px-3 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${
                          commitmentType === opt
                            ? 'bg-[#7C9B93]/90 text-white'
                            : 'bg-transparent text-muted border border-[#7C9B93]/20'
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full px-4 py-3 rounded-2xl bg-[#7C9B93]/90 text-white text-[11px] font-black uppercase tracking-[0.14em]"
                >
                  Kirim Minat Join
                </button>

                {joinMessage && (
                  <p className="text-[11px] font-black text-[#7C9B93] leading-relaxed">{joinMessage}</p>
                )}
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const ContributionGridSection = ({
  contributions,
  isAdminMode,
  onEditContribution,
  title = 'Kontribusi Project',
  accentColor = '#7C9B93'
}: {
  contributions: Array<{
    title: string;
    value: string;
    description: string;
    illustration: 'reduction' | 'sorted' | 'utilized';
  }>;
  isAdminMode?: boolean;
  onEditContribution?: (index: number) => void;
  title?: string;
  accentColor?: string;
}) => {
  const renderIllustration = (type: 'reduction' | 'sorted' | 'utilized') => {
    const iconMap = {
      reduction: Leaf,
      sorted: Trash2,
      utilized: Recycle
    };
    const colorMap = {
      reduction: '#7C9B93',
      sorted: '#A68B8B',
      utilized: '#718096'
    };
    const IconComp = iconMap[type];
    const color = colorMap[type];

    return (
      <div className={`relative w-14 h-14 contrib-illust contrib-${type}`}>
        <div className="absolute inset-0 rounded-2xl opacity-20 contrib-bg" style={{ backgroundColor: color }} />
        <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full opacity-40 contrib-dot" style={{ backgroundColor: color }} />
        <div
          className="absolute inset-0 m-auto w-10 h-10 rounded-xl flex items-center justify-center contrib-core"
          style={{ color, backgroundColor: 'rgba(255,255,255,0.72)', border: `1px solid ${color}33` }}
        >
          <IconComp size={18} className="contrib-icon" />
        </div>
      </div>
    );
  };

  return (
    <div
      className="fade-in-section rounded-[34px] p-4 md:p-6 border"
      style={{ backgroundColor: `${accentColor}14`, borderColor: `${accentColor}22` }}
    >
      <div className="mb-4 md:mb-5 flex items-center gap-3">
        <div
          className="p-2 rounded-xl"
          style={{ backgroundColor: 'rgba(255,255,255,0.72)', border: `1px solid ${accentColor}2E` }}
        >
          <Leaf size={17} style={{ color: accentColor }} />
        </div>
        <h3 className="text-[14px] md:text-[16px] font-black uppercase tracking-[0.14em] text-main">
          {title}
        </h3>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 md:gap-5">
        {contributions.map((item, idx) => (
          <div
            key={idx}
            className="rounded-[28px] p-3 md:p-5 card-anim border"
            style={{ backgroundColor: 'rgba(255,255,255,0.62)', borderColor: `${accentColor}2E` }}
          >
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
              <div className="flex flex-col">
                <span className="text-[8px] md:text-[10px] font-black uppercase tracking-widest text-muted">{item.title}</span>
                <span className="text-[18px] md:text-[26px] font-black text-[#7C9B93] leading-none mt-1">{item.value}</span>
              </div>
              <div className="flex flex-col items-end gap-2">
                {isAdminMode && (
                  <button onClick={() => onEditContribution?.(idx)} className="clay-button !px-3 !py-1.5 !rounded-xl text-[9px] font-black uppercase !tracking-widest !text-[#7C9B93]">
                    Edit
                  </button>
                )}
                {renderIllustration(item.illustration)}
              </div>
            </div>
            <p className="text-[10px] md:text-[13px] font-semibold text-main leading-relaxed mt-3">
              {item.description}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

const AdminPanel = ({
  profiles,
  onSaveProfiles,
  onBack
}: {
  profiles: Record<ProjectKey, ProjectProfile>;
  onSaveProfiles: (profiles: Record<ProjectKey, ProjectProfile>) => void;
  onBack: () => void;
}) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [session, setSession] = useState<{ username: string; project: ProjectKey | 'all' } | null>(null);
  const [editingProject, setEditingProject] = useState<ProjectKey>('Resik');
  const [draftProfiles, setDraftProfiles] = useState<Record<ProjectKey, ProjectProfile>>(profiles);
  const [saveMessage, setSaveMessage] = useState('');

  useEffect(() => {
    setDraftProfiles(profiles);
  }, [profiles]);

  const handleLogin = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const found = ADMIN_ACCOUNTS.find((a) => a.username === username.trim() && a.password === password);
    if (!found) {
      setLoginError('Username atau password salah.');
      return;
    }
    setSession({ username: found.username, project: found.project });
    setEditingProject(found.project === 'all' ? 'Resik' : found.project);
    setLoginError('');
  };

  const updateCurrentProfile = (updater: (p: ProjectProfile) => ProjectProfile) => {
    setDraftProfiles((prev) => ({
      ...prev,
      [editingProject]: updater(prev[editingProject])
    }));
  };

  const handleSave = () => {
    onSaveProfiles(draftProfiles);
    setSaveMessage(`Konten project ${editingProject} berhasil disimpan.`);
    setTimeout(() => setSaveMessage(''), 2500);
  };

  if (!session) {
    return (
      <div className="clay-card p-8 md:p-10 max-w-xl mx-auto fade-in-section">
        <h2 className="text-[16px] font-black uppercase tracking-widest text-main mb-6">Admin Panel Login</h2>
        <form className="space-y-4" onSubmit={handleLogin}>
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Username"
            className="w-full rounded-2xl px-4 py-3 text-[13px] font-semibold text-main bg-transparent border border-[#7C9B93]/20 outline-none"
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            className="w-full rounded-2xl px-4 py-3 text-[13px] font-semibold text-main bg-transparent border border-[#7C9B93]/20 outline-none"
          />
          {loginError && <p className="text-[12px] font-black text-[#A68B8B]">{loginError}</p>}
          <button type="submit" className="w-full px-4 py-3 rounded-2xl bg-[#7C9B93] text-white text-[12px] font-black uppercase tracking-widest">
            Login
          </button>
          <button type="button" onClick={onBack} className="w-full px-4 py-3 rounded-2xl clay-button text-[12px] font-black uppercase">
            Kembali ke Dashboard
          </button>
        </form>
      </div>
    );
  }

  const current = draftProfiles[editingProject];

  return (
    <div className="space-y-6 fade-in-section">
      <div className="clay-card p-6 md:p-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex flex-col gap-2">
          <h2 className="text-[14px] md:text-[16px] font-black uppercase tracking-widest text-main">Admin Panel</h2>
          <p className="text-[11px] font-black uppercase tracking-widest text-muted">
            Login: {session.username} {session.project !== 'all' ? `| Akses: ${session.project}` : '| Super Admin'}
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={onBack} className="px-4 py-2 rounded-2xl clay-button text-[10px] md:text-[11px] font-black uppercase tracking-widest">
            Dashboard
          </button>
          <button onClick={() => setSession(null)} className="px-4 py-2 rounded-2xl clay-button text-[10px] md:text-[11px] font-black uppercase tracking-widest">
            Logout
          </button>
        </div>
      </div>

      <div className="clay-card p-6 md:p-8 space-y-5">
        <div className="flex flex-col md:flex-row md:items-center gap-3">
          <label className="text-[11px] font-black uppercase tracking-widest text-muted">Project</label>
          <select
            value={editingProject}
            onChange={(e) => setEditingProject(e.target.value as ProjectKey)}
            disabled={session.project !== 'all'}
            className="rounded-2xl px-4 py-2 text-[12px] font-black uppercase tracking-widest text-main bg-transparent border border-[#7C9B93]/25 outline-none"
          >
            {PROJECT_KEYS.map((k) => (
              <option key={k} value={k}>{k}</option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <textarea
            value={current.vision}
            onChange={(e) => updateCurrentProfile((p) => ({ ...p, vision: e.target.value }))}
            rows={4}
            className="rounded-2xl px-4 py-3 text-[12px] font-semibold text-main bg-transparent border border-[#7C9B93]/20 outline-none"
            placeholder="Visi"
          />
          <textarea
            value={current.missions.join('\n')}
            onChange={(e) => updateCurrentProfile((p) => ({ ...p, missions: e.target.value.split('\n').map((s) => s.trim()).filter(Boolean) }))}
            rows={4}
            className="rounded-2xl px-4 py-3 text-[12px] font-semibold text-main bg-transparent border border-[#7C9B93]/20 outline-none"
            placeholder="Misi (1 baris = 1 misi)"
          />
          <textarea
            value={current.agenda.join('\n')}
            onChange={(e) => updateCurrentProfile((p) => ({ ...p, agenda: e.target.value.split('\n').map((s) => s.trim()).filter(Boolean) }))}
            rows={4}
            className="rounded-2xl px-4 py-3 text-[12px] font-semibold text-main bg-transparent border border-[#7C9B93]/20 outline-none"
            placeholder="Agenda (1 baris = 1 agenda)"
          />
          <textarea
            value={current.team.map((t) => `${t.name}|${t.role}`).join('\n')}
            onChange={(e) =>
              updateCurrentProfile((p) => ({
                ...p,
                team: e.target.value
                  .split('\n')
                  .map((line) => line.trim())
                  .filter(Boolean)
                  .map((line, idx) => {
                    const [name, role] = line.split('|');
                    return {
                      name: (name || '').trim() || `Tim ${idx + 1}`,
                      role: (role || '').trim() || 'Relawan',
                      photo: p.team[idx]?.photo || ''
                    };
                  })
              }))
            }
            rows={4}
            className="rounded-2xl px-4 py-3 text-[12px] font-semibold text-main bg-transparent border border-[#7C9B93]/20 outline-none"
            placeholder="Tim (format: Nama|Role)"
          />
        </div>

        <div className="space-y-3">
          <p className="text-[11px] font-black uppercase tracking-widest text-muted">Kontribusi (3 Item)</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {current.contributions.map((c, idx) => (
              <div key={idx} className="rounded-2xl border border-[#7C9B93]/20 p-3 space-y-2">
                <input
                  value={c.title}
                  onChange={(e) =>
                    updateCurrentProfile((p) => ({
                      ...p,
                      contributions: p.contributions.map((item, i) => i === idx ? { ...item, title: e.target.value } : item)
                    }))
                  }
                  className="w-full rounded-xl px-3 py-2 text-[11px] font-black uppercase tracking-wider text-main bg-transparent border border-[#7C9B93]/20 outline-none"
                  placeholder="Judul"
                />
                <input
                  value={c.value}
                  onChange={(e) =>
                    updateCurrentProfile((p) => ({
                      ...p,
                      contributions: p.contributions.map((item, i) => i === idx ? { ...item, value: e.target.value } : item)
                    }))
                  }
                  className="w-full rounded-xl px-3 py-2 text-[12px] font-black text-[#7C9B93] bg-transparent border border-[#7C9B93]/20 outline-none"
                  placeholder="Nilai"
                />
                <textarea
                  value={c.description}
                  onChange={(e) =>
                    updateCurrentProfile((p) => ({
                      ...p,
                      contributions: p.contributions.map((item, i) => i === idx ? { ...item, description: e.target.value } : item)
                    }))
                  }
                  rows={3}
                  className="w-full rounded-xl px-3 py-2 text-[11px] font-semibold text-main bg-transparent border border-[#7C9B93]/20 outline-none"
                  placeholder="Deskripsi"
                />
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button onClick={handleSave} className="px-5 py-3 rounded-2xl bg-[#7C9B93] text-white text-[11px] font-black uppercase tracking-widest">
            Simpan Konten
          </button>
          {saveMessage && <p className="text-[11px] font-black text-[#7C9B93]">{saveMessage}</p>}
        </div>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  const [viewMode, setViewMode] = useState<'dashboard' | 'admin'>(() => {
    if (typeof window === 'undefined') return 'dashboard';
    return window.location.pathname === '/admin' ? 'admin' : 'dashboard';
  });
  const [activeProject, setActiveProject] = useState<ProjectType>('Semua');
  const [editableProfiles, setEditableProfiles] = useState<Record<ProjectKey, ProjectProfile>>(() => {
    const defaults = getDefaultProfiles();
    try {
      const raw = localStorage.getItem(PROFILE_STORAGE_KEY);
      if (!raw) return defaults;
      const parsed = JSON.parse(raw) as Partial<Record<ProjectKey, ProjectProfile>>;
      PROJECT_KEYS.forEach((key) => {
        if (parsed[key]) {
          defaults[key] = { ...defaults[key], ...parsed[key] };
        }
      });
      const activeResikTeam = defaults.Resik.team || [];
      if (activeResikTeam.some((member) => LEGACY_RESIK_TEAM_NAMES.has((member?.name || '').trim()))) {
        defaults.Resik.team = cloneProfile(PROJECT_DATA.Resik.profile).team;
      }
      return defaults;
    } catch {
      return defaults;
    }
  });
  const [manualReportsByProject, setManualReportsByProject] = useState<Record<ProjectType, ManualReportRow[]>>(() => {
    const defaults = getDefaultManualReports();
    try {
      const raw = localStorage.getItem(MANUAL_REPORT_STORAGE_KEY);
      if (!raw) return defaults;
      const parsed = JSON.parse(raw) as Partial<Record<ProjectType, ManualReportRow[]>>;
      (Object.keys(defaults) as ProjectType[]).forEach((key) => {
        if (Array.isArray(parsed[key]) && parsed[key]!.length > 0) {
          defaults[key] = parsed[key]!
            .filter(Boolean)
            .map((row, idx) => {
              const legacyIncome = (row as any).income ? parseRupiahInput(String((row as any).income)) : 0;
              const legacyExpense = (row as any).expense ? parseRupiahInput(String((row as any).expense)) : 0;
              const legacySavings = (row as any).savings ? parseRupiahInput(String((row as any).savings)) : 0;
              const legacyTotal = legacyIncome + legacyExpense + legacySavings;

              return {
                id: typeof row.id === 'number' ? row.id : idx + 1,
                date: row.date || new Date().toISOString().slice(0, 10),
                type: row.type === 'Keluar' || row.type === 'Tabungan' ? row.type : 'Masuk',
                description: row.description || '',
                amount: typeof row.amount === 'number' ? Math.max(0, row.amount) : legacyTotal,
                category: row.category || '',
                note: row.note || ''
              };
            });
        }
      });
      return defaults;
    } catch {
      return defaults;
    }
  });
  const [filter, setFilter] = useState<'all' | 'income' | 'expense'>('all');
  const [isDark, setIsDark] = useState(false);
  const [isProfileMinimized, setIsProfileMinimized] = useState(false);
  const [isAgendaMinimized, setIsAgendaMinimized] = useState(true);
  const [isJoinMinimized, setIsJoinMinimized] = useState(true);
  const [selectedAllocation, setSelectedAllocation] = useState<{
    name: string;
    x: number;
    y: number;
    side: 'left' | 'right';
  } | null>(null);
  const [adminSession, setAdminSession] = useState<{ username: string; project: ProjectKey | 'all' } | null>(null);
  const [adminUsername, setAdminUsername] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [adminLoginError, setAdminLoginError] = useState('');
  const [adminNotice, setAdminNotice] = useState('');
  const [manualDraft, setManualDraft] = useState<ManualReportDraft>(createEmptyManualDraft());
  const [isTxModalOpen, setIsTxModalOpen] = useState(false);
  const [txModalMode, setTxModalMode] = useState<'create' | 'edit'>('create');
  const [editingTxId, setEditingTxId] = useState<number | null>(null);
  const [txValidationError, setTxValidationError] = useState('');
  const [txPage, setTxPage] = useState(1);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [volunteerApplyByProject, setVolunteerApplyByProject] = useState<Record<ProjectKey, VolunteerApply[]>>(() => {
    const defaults = getDefaultVolunteerApply();
    try {
      const raw = localStorage.getItem(VOLUNTEER_STORAGE_KEY);
      if (!raw) return defaults;
      const parsed = JSON.parse(raw) as Partial<Record<ProjectKey, VolunteerApply[]>>;
      PROJECT_KEYS.forEach((key) => {
        if (Array.isArray(parsed[key])) defaults[key] = parsed[key] as VolunteerApply[];
      });
      return defaults;
    } catch {
      return defaults;
    }
  });
  const [adminTab, setAdminTab] = useState<'profil' | 'keuangan' | 'kontribusi' | 'setting'>('profil');
  const [adminTargetProject, setAdminTargetProject] = useState<ProjectKey>('Resik');
  const [profileDraft, setProfileDraft] = useState<{ vision: string; missionsText: string; agendaText: string; teamText: string }>({
    vision: '',
    missionsText: '',
    agendaText: '',
    teamText: ''
  });
  const [contributionDraft, setContributionDraft] = useState<ProjectProfile['contributions']>([]);
  const activeMenuColor = PROJECT_MENU_THEME[activeProject];

  const handleToggleProfileMinimize = () => {
    setIsProfileMinimized((prev) => {
      const next = !prev;
      if (!next) {
        setIsAgendaMinimized(true);
        setIsJoinMinimized(true);
      }
      return next;
    });
  };

  const handleToggleAgendaMinimize = () => {
    setIsAgendaMinimized((prev) => {
      const next = !prev;
      if (!next) {
        setIsProfileMinimized(true);
        setIsJoinMinimized(true);
      }
      return next;
    });
  };

  const handleToggleJoinMinimize = () => {
    setIsJoinMinimized((prev) => {
      const next = !prev;
      if (!next) {
        setIsProfileMinimized(true);
        setIsAgendaMinimized(true);
      }
      return next;
    });
  };

  useEffect(() => {
    if (isDark) document.body.classList.add('dark-mode');
    else document.body.classList.remove('dark-mode');
  }, [isDark]);

  useEffect(() => {
    const theme = PROJECT_BACKGROUND_THEME[activeProject];
    if (isDark) {
      document.body.style.setProperty('--bg-color', '#1A1A1A');
      document.body.style.setProperty('--grid-base', '#1A1A1A');
      document.body.style.setProperty('--project-menu-color', activeMenuColor);
      return;
    }
    document.body.style.setProperty('--bg-color', theme.bg);
    document.body.style.setProperty('--grid-base', theme.grid);
    document.body.style.setProperty('--project-menu-color', activeMenuColor);
  }, [activeProject, isDark, activeMenuColor]);

  useEffect(() => {
    try {
      localStorage.setItem(MANUAL_REPORT_STORAGE_KEY, JSON.stringify(manualReportsByProject));
    } catch {
      // ignore storage write errors in restricted browser modes
    }
  }, [manualReportsByProject]);

  useEffect(() => {
    try {
      localStorage.setItem(VOLUNTEER_STORAGE_KEY, JSON.stringify(volunteerApplyByProject));
    } catch {
      // ignore storage write errors in restricted browser modes
    }
  }, [volunteerApplyByProject]);

  useEffect(() => {
    const onPopState = () => {
      setViewMode(window.location.pathname === '/admin' ? 'admin' : 'dashboard');
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

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

  useEffect(() => {
    setIsProfileMinimized(false);
    setIsAgendaMinimized(true);
    setIsJoinMinimized(true);
    setManualDraft(createEmptyManualDraft());
    setTxPage(1);
  }, [activeProject]);

  useEffect(() => {
    if (!adminSession) return;
    const managed: ProjectKey = adminSession.project === 'all' ? adminTargetProject : adminSession.project;
    const p = editableProfiles[managed];
    setProfileDraft({
      vision: p.vision,
      missionsText: p.missions.join('\n'),
      agendaText: p.agenda.join('\n'),
      teamText: p.team.map((t) => `${t.name}|${t.role}`).join('\n')
    });
    setContributionDraft(p.contributions);
    setManualDraft(createEmptyManualDraft());
  }, [adminSession, adminTargetProject, editableProfiles]);

  useLayoutEffect(() => {
    if (!hasGsap()) return;
    gsap.fromTo(".card-anim", { y: 20, opacity: 0, scale: 0.9 }, { y: 0, opacity: 1, scale: 1, duration: 0.5, ease: "back.out(1.7)", stagger: 0.08 });
    gsap.fromTo(".fade-in-section", { opacity: 0 }, { opacity: 1, duration: 1 });
  }, [activeProject]);

  const projects: ProjectType[] = ['Semua', 'Resik', 'Hadeyya', 'Siyar', 'Haru'];
  const managedProject: ProjectKey = adminSession?.project === 'all' ? adminTargetProject : (adminSession?.project || 'Resik');
  const activeProjectProfile = activeProject === 'Semua' ? null : editableProfiles[activeProject as ProjectKey];
  const activeProjectContributions = activeProject === 'Semua' ? null : editableProfiles[activeProject as ProjectKey].contributions;
  const currentProjectKey = activeProject === 'Semua' ? null : (activeProject as ProjectKey);
  const canEditCurrentProject = Boolean(
    viewMode === 'admin' &&
    adminSession &&
    currentProjectKey &&
    (adminSession.project === 'all' || adminSession.project === currentProjectKey)
  );

  const filteredTransactions = currentData.transactions.filter(t => {
    if (filter === 'all') return true;
    return filter === 'income' ? t.income !== null : t.expense !== null;
  });

  const manualRows = manualReportsByProject[activeProject];
  const sortedManualRows = useMemo(
    () =>
      [...manualRows].sort((a, b) => {
        const da = new Date(a.date).getTime();
        const db = new Date(b.date).getTime();
        if (db !== da) return db - da;
        return b.id - a.id;
      }),
    [manualRows]
  );

  const manualIncomeTotal = sortedManualRows.reduce((acc, row) => acc + (row.type === 'Masuk' ? row.amount : 0), 0);
  const manualExpenseTotal = sortedManualRows.reduce((acc, row) => acc + (row.type === 'Keluar' ? row.amount : 0), 0);
  const manualSavingsTotal = sortedManualRows.reduce((acc, row) => acc + (row.type === 'Tabungan' ? row.amount : 0), 0);
  const manualBalance = manualIncomeTotal - manualExpenseTotal - manualSavingsTotal;

  const rowsPerPage = 10;
  const totalPages = Math.max(1, Math.ceil(sortedManualRows.length / rowsPerPage));
  const pagedRows = sortedManualRows.slice((txPage - 1) * rowsPerPage, txPage * rowsPerPage);

  useEffect(() => {
    if (txPage > totalPages) setTxPage(totalPages);
  }, [txPage, totalPages]);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 2200);
  };

  const updateManualDraftField = (field: keyof ManualReportDraft, value: string) => {
    if (field === 'amountInput') {
      const amount = parseRupiahInput(value);
      setManualDraft((prev) => ({ ...prev, amountInput: amount ? formatRupiah(amount) : '' }));
      return;
    }
    setManualDraft((prev) => ({ ...prev, [field]: value }));
  };

  const openCreateTransactionModal = () => {
    setTxModalMode('create');
    setEditingTxId(null);
    setManualDraft(createEmptyManualDraft());
    setTxValidationError('');
    setIsTxModalOpen(true);
  };

  const openEditTransactionModal = (tx: ManualReportRow) => {
    setTxModalMode('edit');
    setEditingTxId(tx.id);
    setManualDraft({
      date: tx.date,
      type: tx.type,
      description: tx.description,
      amountInput: tx.amount ? formatRupiah(tx.amount) : '',
      category: tx.category || '',
      note: tx.note || ''
    });
    setTxValidationError('');
    setIsTxModalOpen(true);
  };

  const validateTransactionDraft = (): string | null => {
    if (manualDraft.description.trim().length < 3) return 'Uraian minimal 3 karakter.';
    const amount = parseRupiahInput(manualDraft.amountInput);
    if (!amount) return 'Jumlah tidak boleh kosong.';
    if (amount < 0) return 'Jumlah tidak boleh minus.';
    if (!manualDraft.date) return 'Tanggal wajib diisi.';
    if (manualDraft.category.trim().length < 2) return 'Kategori minimal 2 karakter.';
    return null;
  };

  const saveTransactionDraft = (keepAdding: boolean) => {
    const error = validateTransactionDraft();
    if (error) {
      setTxValidationError(error);
      showToast(error, 'error');
      return;
    }
    const amount = parseRupiahInput(manualDraft.amountInput);

    setManualReportsByProject((prev) => {
      const list = prev[activeProject];
      if (txModalMode === 'edit' && editingTxId !== null) {
        return {
          ...prev,
          [activeProject]: list.map((tx) =>
            tx.id === editingTxId
              ? {
                  ...tx,
                  date: manualDraft.date,
                  type: manualDraft.type,
                  description: manualDraft.description.trim(),
                  amount,
                  category: manualDraft.category.trim(),
                  note: manualDraft.note.trim()
                }
              : tx
          )
        };
      }

      const nextId = list.length ? Math.max(...list.map((x) => x.id)) + 1 : 1;
      return {
        ...prev,
        [activeProject]: [
          ...list,
          {
            id: nextId,
            date: manualDraft.date,
            type: manualDraft.type,
            description: manualDraft.description.trim(),
            amount,
            category: manualDraft.category.trim(),
            note: manualDraft.note.trim()
          }
        ]
      };
    });

    showToast(txModalMode === 'edit' ? 'Transaksi berhasil diperbarui.' : 'Transaksi berhasil ditambahkan.');
    setTxValidationError('');
    if (keepAdding) {
      setManualDraft((prev) => ({ ...createEmptyManualDraft(), date: prev.date }));
      setTxModalMode('create');
      setEditingTxId(null);
      return;
    }
    setIsTxModalOpen(false);
  };

  const deleteManualTransaction = (id: number) => {
    const ok = window.confirm('Hapus transaksi ini?');
    if (!ok) return;
    setManualReportsByProject((prev) => ({
      ...prev,
      [activeProject]: prev[activeProject].filter((tx) => tx.id !== id)
    }));
    showToast('Transaksi berhasil dihapus.');
  };

  const saveAdminProfileDraft = () => {
    updateProjectProfile(managedProject, (p) => ({
      ...p,
      vision: profileDraft.vision.trim() || p.vision,
      missions: profileDraft.missionsText.split('\n').map((s) => s.trim()).filter(Boolean),
      agenda: profileDraft.agendaText.split('\n').map((s) => s.trim()).filter(Boolean),
      team: profileDraft.teamText
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean)
        .map((line, idx) => {
          const [name, role] = line.split('|');
          return {
            name: (name || '').trim() || `Tim ${idx + 1}`,
            role: (role || '').trim() || 'Relawan',
            photo: ''
          };
        })
    }));
    showToast('Profil project tersimpan.');
  };

  const saveAdminContributionDraft = () => {
    updateProjectProfile(managedProject, (p) => ({
      ...p,
      contributions: contributionDraft.filter((c) => c.title.trim() && c.value.trim())
    }));
    showToast('Kontribusi tersimpan.');
  };

  const resetProjectData = () => {
    const ok = window.confirm(`Reset konten project ${managedProject} ke default?`);
    if (!ok) return;
    const defaults = getDefaultProfiles();
    setEditableProfiles((prev) => {
      const next = { ...prev, [managedProject]: defaults[managedProject] };
      localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(next));
      return next;
    });
    setManualReportsByProject((prev) => ({ ...prev, [managedProject]: [] }));
    setVolunteerApplyByProject((prev) => ({ ...prev, [managedProject]: [] }));
    showToast(`Data ${managedProject} direset.`);
  };

  const exportExcelTransactions = () => {
    const rows = sortedManualRows
      .map(
        (r, i) =>
          `<tr><td>${i + 1}</td><td>${r.date}</td><td>${r.description}</td><td>${r.type}</td><td>${r.category}</td><td>${formatRupiah(
            r.amount
          )}</td></tr>`
      )
      .join('');
    const html = `<table><thead><tr><th>#</th><th>Tanggal</th><th>Uraian</th><th>Jenis</th><th>Kategori</th><th>Jumlah</th></tr></thead><tbody>${rows}</tbody></table>`;
    const blob = new Blob([html], { type: 'application/vnd.ms-excel' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ringkasan-${activeProject.toLowerCase()}.xls`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportPdfTransactions = () => {
    const win = window.open('', '_blank');
    if (!win) return;
    const rows = sortedManualRows
      .map(
        (r, i) =>
          `<tr><td>${i + 1}</td><td>${r.date}</td><td>${r.description}</td><td>${r.type}</td><td>${r.category}</td><td>${formatRupiah(
            r.amount
          )}</td></tr>`
      )
      .join('');
    win.document.write(`
      <html><head><title>Ringkasan ${activeProject}</title>
      <style>body{font-family:Arial;padding:20px}table{border-collapse:collapse;width:100%}th,td{border:1px solid #ddd;padding:8px;font-size:12px;text-align:left}</style>
      </head><body>
      <h3>Ringkasan Keuangan - ${activeProject}</h3>
      <table><thead><tr><th>#</th><th>Tanggal</th><th>Uraian</th><th>Jenis</th><th>Kategori</th><th>Jumlah</th></tr></thead><tbody>${rows}</tbody></table>
      </body></html>
    `);
    win.document.close();
    win.focus();
    win.print();
  };

  const updateProjectProfile = (project: ProjectKey, updater: (p: ProjectProfile) => ProjectProfile) => {
    setEditableProfiles((prev) => {
      const next = { ...prev, [project]: updater(prev[project]) };
      localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(next));
      return next;
    });
    setAdminNotice(`Perubahan ${project} tersimpan.`);
    setTimeout(() => setAdminNotice(''), 1500);
  };

  const handleVolunteerApply = (payload: { project: ProjectKey; name: string; skill: string; commitment: string }) => {
    setVolunteerApplyByProject((prev) => {
      const nextId = prev[payload.project].length ? Math.max(...prev[payload.project].map((x) => x.id)) + 1 : 1;
      return {
        ...prev,
        [payload.project]: [
          {
            id: nextId,
            project: payload.project,
            name: payload.name,
            skill: payload.skill,
            commitment: payload.commitment,
            createdAt: new Date().toISOString()
          },
          ...prev[payload.project]
        ]
      };
    });
  };

  const editVision = () => {
    if (!currentProjectKey) return;
    const current = editableProfiles[currentProjectKey].vision;
    const next = window.prompt('Edit Visi', current);
    if (next !== null) updateProjectProfile(currentProjectKey, (p) => ({ ...p, vision: next.trim() || p.vision }));
  };

  const editMissions = () => {
    if (!currentProjectKey) return;
    const current = editableProfiles[currentProjectKey].missions.join('\n');
    const next = window.prompt('Edit Misi (1 baris = 1 item)', current);
    if (next !== null) {
      const missions = next.split('\n').map((s) => s.trim()).filter(Boolean);
      if (missions.length) updateProjectProfile(currentProjectKey, (p) => ({ ...p, missions }));
    }
  };

  const editTeam = () => {
    if (!currentProjectKey) return;
    const current = editableProfiles[currentProjectKey].team.map((t) => `${t.name}|${t.role}`).join('\n');
    const next = window.prompt('Edit Team (format: Nama|Role, 1 baris = 1 anggota)', current);
    if (next !== null) {
      const team = next
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean)
        .map((line, idx) => {
          const [name, role] = line.split('|');
          return {
            name: (name || '').trim() || `Tim ${idx + 1}`,
            role: (role || '').trim() || 'Relawan',
            photo: ''
          };
        });
      if (team.length) updateProjectProfile(currentProjectKey, (p) => ({ ...p, team }));
    }
  };

  const editAgenda = () => {
    if (!currentProjectKey) return;
    const current = editableProfiles[currentProjectKey].agenda.join('\n');
    const next = window.prompt('Edit Agenda (1 baris = 1 agenda)', current);
    if (next !== null) {
      const agenda = next.split('\n').map((s) => s.trim()).filter(Boolean);
      if (agenda.length) updateProjectProfile(currentProjectKey, (p) => ({ ...p, agenda }));
    }
  };

  const editContribution = (index: number) => {
    if (!currentProjectKey) return;
    const contribution = editableProfiles[currentProjectKey].contributions[index];
    const title = window.prompt('Judul kontribusi', contribution.title);
    if (title === null) return;
    const value = window.prompt('Nilai kontribusi', contribution.value);
    if (value === null) return;
    const description = window.prompt('Deskripsi kontribusi', contribution.description);
    if (description === null) return;
    updateProjectProfile(currentProjectKey, (p) => ({
      ...p,
      contributions: p.contributions.map((c, i) =>
        i === index ? { ...c, title: title.trim() || c.title, value: value.trim() || c.value, description: description.trim() || c.description } : c
      )
    }));
  };

  const handleAdminLogin = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const found = ADMIN_ACCOUNTS.find((a) => a.username === adminUsername.trim() && a.password === adminPassword);
    if (!found) {
      setAdminLoginError('Username atau password salah.');
      return;
    }
    setAdminSession({ username: found.username, project: found.project });
    setAdminTargetProject(found.project === 'all' ? 'Resik' : found.project);
    setActiveProject(found.project === 'all' ? 'Resik' : found.project);
    setAdminTab('profil');
    setAdminLoginError('');
    setAdminPassword('');
  };

  const openDashboard = () => {
    setViewMode('dashboard');
    if (window.location.pathname !== '/') {
      window.history.pushState({}, '', '/');
    }
  };

  if (viewMode === 'admin' && !adminSession) {
    return (
      <div className="min-h-screen p-4 md:p-10 max-w-7xl mx-auto pb-24">
        <div className="max-w-xl mx-auto rounded-2xl border border-[#7C9B93]/20 bg-white/80 shadow-lg p-8 md:p-10">
          <p className="text-[10px] font-black uppercase tracking-widest text-[#7C9B93] mb-2">Admin Access</p>
          <h2 className="text-[16px] font-black uppercase tracking-widest text-main mb-6">Admin Login</h2>
          <form className="space-y-4" onSubmit={handleAdminLogin}>
            <input
              value={adminUsername}
              onChange={(e) => setAdminUsername(e.target.value)}
              placeholder="Username"
              className="w-full rounded-2xl px-4 py-3 text-[13px] font-semibold text-main bg-transparent border border-[#7C9B93]/20 outline-none"
            />
            <input
              type="password"
              value={adminPassword}
              onChange={(e) => setAdminPassword(e.target.value)}
              placeholder="Password"
              className="w-full rounded-2xl px-4 py-3 text-[13px] font-semibold text-main bg-transparent border border-[#7C9B93]/20 outline-none"
            />
            {adminLoginError && <p className="text-[12px] font-black text-[#A68B8B]">{adminLoginError}</p>}
            <button type="submit" className="w-full px-4 py-3 rounded-2xl bg-[#7C9B93] text-white text-[12px] font-black uppercase tracking-widest">
              Login Admin
            </button>
            <button type="button" onClick={openDashboard} className="w-full px-4 py-3 rounded-2xl clay-button text-[12px] font-black uppercase">
              Kembali Dashboard
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (viewMode === 'admin' && adminSession) {
    const volunteerList = volunteerApplyByProject[managedProject] || [];
    return (
      <div className="min-h-screen p-4 md:p-10 max-w-6xl mx-auto space-y-6 pb-24">
        <div className="clay-card p-6 md:p-8 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <h2 className="text-[16px] font-black uppercase tracking-widest text-main">Admin Panel {managedProject}</h2>
            <p className="text-[10px] font-black uppercase tracking-widest text-muted">Login: {adminSession.username}</p>
          </div>
          <div className="flex gap-2">
            {adminSession.project === 'all' && (
              <select
                value={managedProject}
                onChange={(e) => {
                  const p = e.target.value as ProjectKey;
                  setAdminTargetProject(p);
                  setActiveProject(p);
                  setAdminTab('profil');
                }}
                className="rounded-xl px-3 py-2 text-[11px] font-black uppercase tracking-widest border border-[#7C9B93]/20 bg-transparent"
              >
                {PROJECT_KEYS.map((k) => (
                  <option key={k} value={k}>{k}</option>
                ))}
              </select>
            )}
            <button onClick={openDashboard} className="clay-button !px-4 !py-2 !rounded-xl text-[10px] font-black uppercase !tracking-widest !text-[#7C9B93]">Dashboard</button>
            <button onClick={() => setAdminSession(null)} className="clay-button !px-4 !py-2 !rounded-xl text-[10px] font-black uppercase !tracking-widest !text-[#A68B8B]">Logout</button>
          </div>
        </div>

        <div className="clay-inset p-2 flex flex-wrap gap-2">
          {(['profil', 'keuangan', 'kontribusi', 'setting'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setAdminTab(tab)}
              className={`px-4 py-2 rounded-xl text-[11px] font-black uppercase tracking-widest ${adminTab === tab ? 'bg-[#7C9B93] text-white' : 'text-muted'}`}
            >
              {tab}
            </button>
          ))}
        </div>

        {adminTab === 'profil' && (
          <div className="clay-card p-6 md:p-8 space-y-4">
            <textarea value={profileDraft.vision} onChange={(e) => setProfileDraft((d) => ({ ...d, vision: e.target.value }))} rows={3} className="w-full rounded-xl px-4 py-3 text-[12px] font-semibold border border-[#7C9B93]/20 bg-transparent" placeholder="Visi" />
            <textarea value={profileDraft.missionsText} onChange={(e) => setProfileDraft((d) => ({ ...d, missionsText: e.target.value }))} rows={4} className="w-full rounded-xl px-4 py-3 text-[12px] font-semibold border border-[#7C9B93]/20 bg-transparent" placeholder="Misi (1 baris = 1 item)" />
            <textarea value={profileDraft.agendaText} onChange={(e) => setProfileDraft((d) => ({ ...d, agendaText: e.target.value }))} rows={4} className="w-full rounded-xl px-4 py-3 text-[12px] font-semibold border border-[#7C9B93]/20 bg-transparent" placeholder="Agenda project" />
            <textarea value={profileDraft.teamText} onChange={(e) => setProfileDraft((d) => ({ ...d, teamText: e.target.value }))} rows={4} className="w-full rounded-xl px-4 py-3 text-[12px] font-semibold border border-[#7C9B93]/20 bg-transparent" placeholder="Tim (Nama|Role)" />
            <button onClick={saveAdminProfileDraft} className="px-4 py-2 rounded-xl bg-[#7C9B93] text-white text-[11px] font-black uppercase tracking-widest">Simpan Profil</button>

            <div className="pt-4 border-t border-[#7C9B93]/15">
              <h3 className="text-[12px] font-black uppercase tracking-widest text-main mb-2">List Relawan Apply</h3>
              <div className="space-y-2">
                {volunteerList.length === 0 && <p className="text-[11px] font-semibold text-muted">Belum ada relawan apply.</p>}
                {volunteerList.map((v) => (
                  <div key={v.id} className="rounded-xl border border-[#7C9B93]/15 p-3 text-[11px] font-semibold">
                    <p className="font-black text-main">{v.name} - {v.commitment}</p>
                    <p className="text-muted">Keahlian: {v.skill}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {adminTab === 'kontribusi' && (
          <div className="clay-card p-6 md:p-8 space-y-3">
            {contributionDraft.map((c, idx) => (
              <div key={idx} className="grid grid-cols-1 md:grid-cols-12 gap-2 rounded-xl border border-[#7C9B93]/15 p-3">
                <input value={c.title} onChange={(e) => setContributionDraft((prev) => prev.map((x, i) => i === idx ? { ...x, title: e.target.value } : x))} className="md:col-span-3 rounded-lg px-3 py-2 text-[11px] font-black uppercase border border-[#7C9B93]/20 bg-transparent" placeholder="Judul" />
                <input value={c.value} onChange={(e) => setContributionDraft((prev) => prev.map((x, i) => i === idx ? { ...x, value: e.target.value } : x))} className="md:col-span-2 rounded-lg px-3 py-2 text-[11px] font-black border border-[#7C9B93]/20 bg-transparent" placeholder="Jumlah" />
                <input value={c.description} onChange={(e) => setContributionDraft((prev) => prev.map((x, i) => i === idx ? { ...x, description: e.target.value } : x))} className="md:col-span-5 rounded-lg px-3 py-2 text-[11px] font-semibold border border-[#7C9B93]/20 bg-transparent" placeholder="Deskripsi" />
                <button onClick={() => setContributionDraft((prev) => prev.filter((_, i) => i !== idx))} className="md:col-span-2 rounded-lg px-3 py-2 text-[10px] font-black uppercase text-[#A68B8B] border border-[#A68B8B]/25">Hapus</button>
              </div>
            ))}
            <div className="flex gap-2">
              <button onClick={() => setContributionDraft((prev) => [...prev, { title: '', value: '', description: '', illustration: 'reduction' }])} className="clay-button !px-4 !py-2 !rounded-xl text-[10px] font-black uppercase !tracking-widest !text-[#7C9B93]">Tambah Item</button>
              <button onClick={saveAdminContributionDraft} className="px-4 py-2 rounded-xl bg-[#7C9B93] text-white text-[10px] font-black uppercase tracking-widest">Simpan Kontribusi</button>
            </div>
          </div>
        )}

        {adminTab === 'keuangan' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div className="rounded-xl bg-[#7C9B93]/10 p-3"><p className="text-[10px] font-black uppercase tracking-widest text-muted">Pemasukan</p><p className="text-[16px] font-black text-[#7C9B93]">{formatRupiah(manualIncomeTotal)}</p></div>
              <div className="rounded-xl bg-[#A68B8B]/10 p-3"><p className="text-[10px] font-black uppercase tracking-widest text-muted">Pengeluaran</p><p className="text-[16px] font-black text-[#A68B8B]">{formatRupiah(manualExpenseTotal)}</p></div>
              <div className="rounded-xl bg-[#718096]/10 p-3"><p className="text-[10px] font-black uppercase tracking-widest text-muted">Tabungan</p><p className="text-[16px] font-black text-[#718096]">{formatRupiah(manualSavingsTotal)}</p></div>
              <div className="rounded-xl bg-[#7C9B93]/10 p-3"><p className="text-[10px] font-black uppercase tracking-widest text-muted">Saldo Akhir</p><p className="text-[16px] font-black text-main">{formatRupiah(Math.max(0, manualBalance))}</p></div>
            </div>
            <div className="clay-card p-4">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-[12px] font-black uppercase tracking-widest text-main">Transaksi</h3>
                <div className="flex gap-2">
                  <button onClick={exportExcelTransactions} className="clay-button !px-3 !py-1.5 !rounded-xl text-[9px] font-black uppercase !tracking-widest !text-[#7C9B93] flex items-center gap-1"><FileSpreadsheet size={12}/>Excel</button>
                  <button onClick={exportPdfTransactions} className="clay-button !px-3 !py-1.5 !rounded-xl text-[9px] font-black uppercase !tracking-widest !text-[#7C9B93] flex items-center gap-1"><FileText size={12}/>PDF</button>
                  <button onClick={openCreateTransactionModal} className="px-3 py-1.5 rounded-xl bg-[#7C9B93] text-white text-[9px] font-black uppercase tracking-widest flex items-center gap-1"><Plus size={12}/>Tambah</button>
                </div>
              </div>
              <div className="overflow-auto rounded-xl border border-[#7C9B93]/15">
                <table className="w-full min-w-[820px]">
                  <thead><tr className="text-[10px] font-black uppercase tracking-widest text-muted bg-[#7C9B93]/7"><th className="px-3 py-2 text-left">#</th><th className="px-3 py-2 text-left">Tanggal</th><th className="px-3 py-2 text-left">Uraian</th><th className="px-3 py-2 text-left">Jenis</th><th className="px-3 py-2 text-left">Kategori</th><th className="px-3 py-2 text-right">Jumlah</th><th className="px-3 py-2 text-center">Aksi</th></tr></thead>
                  <tbody>
                    {pagedRows.map((row, idx) => (
                      <tr key={row.id} className="border-t border-[#7C9B93]/10 text-[11px] font-semibold text-main">
                        <td className="px-3 py-2">{(txPage - 1) * rowsPerPage + idx + 1}</td>
                        <td className="px-3 py-2">{row.date}</td>
                        <td className="px-3 py-2">{row.description}</td>
                        <td className="px-3 py-2">{row.type}</td>
                        <td className="px-3 py-2">{row.category || '-'}</td>
                        <td className={`px-3 py-2 text-right font-black ${row.type === 'Masuk' ? 'text-[#7C9B93]' : row.type === 'Keluar' ? 'text-[#A68B8B]' : 'text-[#718096]'}`}>{row.type === 'Masuk' ? '+ ' : '- '}{formatRupiah(row.amount)}</td>
                        <td className="px-3 py-2">
                          <div className="flex justify-center gap-2">
                            <button onClick={() => openEditTransactionModal(row)} className="text-[#7C9B93]"><Pencil size={14}/></button>
                            <button onClick={() => deleteManualTransaction(row.id)} className="text-[#A68B8B]"><Trash2 size={14}/></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex items-center justify-between mt-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-muted">Halaman {txPage}/{totalPages}</span>
                <div className="flex gap-2">
                  <button onClick={() => setTxPage((p) => Math.max(1, p - 1))} className="clay-button !px-3 !py-1.5 !rounded-xl text-[9px] font-black uppercase !tracking-widest !text-[#7C9B93]">Prev</button>
                  <button onClick={() => setTxPage((p) => Math.min(totalPages, p + 1))} className="clay-button !px-3 !py-1.5 !rounded-xl text-[9px] font-black uppercase !tracking-widest !text-[#7C9B93]">Next</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {adminTab === 'setting' && (
          <div className="clay-card p-6 md:p-8 space-y-3">
            <p className="text-[12px] font-semibold text-main">Pengaturan data project aktif: <span className="font-black">{managedProject}</span></p>
            <button onClick={resetProjectData} className="px-4 py-2 rounded-xl border border-[#A68B8B]/35 text-[#A68B8B] text-[10px] font-black uppercase tracking-widest">
              Reset Data Project
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-10 max-w-7xl mx-auto space-y-12 pb-40">
      
      <header className="flex justify-between items-center fade-in-section">
        <div className="flex items-center space-x-6">
            <div className="w-16 h-16 clay-card flex items-center justify-center">
                <Icon size={32} style={{ color: activeMenuColor }} />
            </div>
            <div>
                <h1 className="text-[12px] font-black uppercase tracking-[0.25em] text-muted mb-1">Project Ummahat</h1>
                <div className="flex flex-col">
                  <p className="text-[28px] md:text-[36px] font-black text-main leading-none">{activeProject}</p>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] mt-1" style={{ color: activeMenuColor }}>{Timeline}</p>
                </div>
            </div>
        </div>
        <div className="flex items-center gap-3">
          <SkyToggle isDark={isDark} onToggle={() => setIsDark(!isDark)} />
        </div>
      </header>

      <nav className="hidden md:flex justify-center fade-in-section">
        <div className="clay-inset p-3 flex gap-3" style={{ backgroundColor: `${activeMenuColor}1A` }}>
          {projects.map((proj) => (
            <button key={proj} onClick={() => setActiveProject(proj)}
              className={`clay-button ${activeProject === proj ? 'active' : ''}`}
              style={
                activeProject === proj
                  ? {
                      background: activeMenuColor,
                      color: '#FFFFFF',
                      boxShadow: '0 6px 14px rgba(0,0,0,0.14), inset 1px 1px 0 rgba(255,255,255,0.28)'
                    }
                  : {
                      color: activeMenuColor
                    }
              }
            >
              {proj}
            </button>
          ))}
        </div>
      </nav>

      {viewMode === 'admin' && adminSession && adminNotice && (
        <div className="fade-in-section text-center">
          <span className="text-[11px] font-black uppercase tracking-widest text-[#7C9B93]">{adminNotice}</span>
        </div>
      )}

      {activeProject === 'Semua' && <WelcomeSection />}
      {activeProjectProfile && (
        <ProjectProfileSection
          projectName={activeProject}
          vision={activeProjectProfile.vision}
          missions={activeProjectProfile.missions}
          agenda={activeProjectProfile.agenda}
          team={activeProjectProfile.team}
          onVolunteerApply={handleVolunteerApply}
          accentColor={activeMenuColor}
          isAdminMode={canEditCurrentProject}
          onEditVision={editVision}
          onEditMissions={editMissions}
          onEditTeam={editTeam}
          onEditAgenda={editAgenda}
          isProfileMinimized={isProfileMinimized}
          onToggleProfileMinimize={handleToggleProfileMinimize}
          isAgendaMinimized={isAgendaMinimized}
          onToggleAgendaMinimize={handleToggleAgendaMinimize}
          isJoinMinimized={isJoinMinimized}
          onToggleJoinMinimize={handleToggleJoinMinimize}
        />
      )}

      {activeProjectContributions && (
        <ContributionGridSection
          contributions={activeProjectContributions}
          isAdminMode={canEditCurrentProject}
          onEditContribution={editContribution}
          title="Kontribusi Project"
          accentColor={activeMenuColor}
        />
      )}

      <div className="fade-in-section text-center">
        <h2 className="text-[16px] md:text-[18px] font-black uppercase tracking-[0.2em]" style={{ color: activeMenuColor }}>
          Ringkasan Keuangan
        </h2>
      </div>

      {activeProject === 'Resik' ? (
        <div className="grid grid-cols-2 gap-4 sm:gap-8">
          <SummaryCard title="Total Saldo" numericValue={currentData.summary.balance} icon={Wallet} type="balance" className="card-anim" accentColor={activeMenuColor} />
          <SummaryCard title="Transaksi" numericValue={currentData.transactions.length} icon={History} type="count" className="card-anim" accentColor={activeMenuColor} />
          <SummaryCard title="Disalurkan" numericValue={resikStats.distributed} icon={Heart} type="expense" variant="special" className="card-anim" subtitle="Ramadhan Lalu" />
          <SummaryCard title="Tabungan Cinta Guru" numericValue={resikStats.savings} icon={Heart} type="expense" variant="special" className="card-anim" subtitle="Di Bendahara" />
          <SummaryCard title="Total Masuk" numericValue={currentData.summary.income} icon={TrendingUp} type="income" className="card-anim" accentColor={activeMenuColor} />
          <SummaryCard title="Total Keluar" numericValue={currentData.summary.expense} icon={TrendingDown} type="expense" className="card-anim" accentColor={activeMenuColor} />
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-8">
          <SummaryCard title="Total Saldo" numericValue={currentData.summary.balance} icon={Wallet} type="balance" className="card-anim" accentColor={activeMenuColor} />
          <SummaryCard title="Transaksi" numericValue={currentData.transactions.length} icon={History} type="count" className="card-anim" accentColor={activeMenuColor} />
          <SummaryCard title="Total Masuk" numericValue={currentData.summary.income} icon={TrendingUp} type="income" className="card-anim" accentColor={activeMenuColor} />
          <SummaryCard title="Total Keluar" numericValue={currentData.summary.expense} icon={TrendingDown} type="expense" className="card-anim" accentColor={activeMenuColor} />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 fade-in-section">
        <div className="lg:col-span-2 clay-card p-10">
            <h3 className="text-[12px] font-black uppercase tracking-widest text-main flex items-center gap-3 mb-12">
                <div className="p-2 clay-inset"><BarChart3 size={18} style={{ color: activeMenuColor }} /></div>
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
             <h3 className="text-[12px] font-black uppercase tracking-widest text-main mb-6 md:mb-12 flex items-center gap-3">
                 <div className="p-2 clay-inset"><PieIcon size={18} style={{ color: activeMenuColor }} /></div>
                 {activeProject === 'Semua' ? 'Alokasi Dana Semua Project' : activeProject === 'Haru' ? 'Ramadhan Ceria' : 'Penyaluran'}
             </h3>
             
             {activeProject === 'Haru' ? (
               <div className="h-[300px] w-full relative flex items-center justify-center">
                 <div className="flex flex-col items-center gap-8">
                   <GiftBoxAnimation />
                   <div className="text-center">
                     <p className="text-[12px] font-black uppercase tracking-widest text-muted mb-2">Hadiah Yang Siap Diserahkan Untuk Para Guru</p>
                     <p className="text-[24px] font-black" style={{ color: activeMenuColor }}>Rp {currentData.summary.balance.toLocaleString('id-ID')}</p>
                     <p className="text-[10px] font-black uppercase tracking-widest text-muted mt-3">Progress dana yang sudah terkumpul</p>
                   </div>
                 </div>
               </div>
             ) : (
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
             </div>
             )}
             
             {activeProject !== 'Haru' && (
             <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
                {pieDisplayData.map((p: any, i: number) => (
                    <div key={i} className="clay-card p-5 md:p-6 flex flex-col gap-4 hover:shadow-md transition-shadow">
                        <div className="flex items-start gap-3">
                            <div className="w-4 h-4 rounded-full shadow-[0_2px_8px_rgba(0,0,0,0.18)] flex-shrink-0 mt-1" style={{ background: normalizeChartColor(p.renderColor || p.color || COLORS.projects[i % COLORS.projects.length]) }} />
                            <div className="flex flex-col flex-1 gap-1">
                              <span className="text-[12px] md:text-[13px] font-black uppercase text-main leading-tight">{p.name}</span>
                              {activeProject === 'Semua' && (
                                <span className="text-[10px] font-black uppercase text-muted">
                                  {allocationProjectsMap[p.name] || '-'}
                                </span>
                              )}
                            </div>
                        </div>
                        <div className="flex items-end justify-between gap-3 pt-2 border-t border-[#7C9B93]/10">
                          <div className="flex flex-col">
                            <span className="text-[10px] font-black uppercase text-muted mb-1">Nominal</span>
                            <span className="text-[14px] md:text-[16px] font-black text-main">{formatCompactCurrency(activeProject === 'Semua' ? p.value : p.nominal)}</span>
                          </div>
                          <div className="flex flex-col items-end">
                            <span className="text-[10px] font-black uppercase text-muted mb-1">Persentase</span>
                            <span className="badge-clay text-main text-[13px] md:text-[14px] font-black">
                              {activeProject === 'Semua'
                                ? `${Math.round(((p.value || 0) / Math.max(pieTotal, 1)) * 100)}%`
                                : `${p.value}%`}
                            </span>
                          </div>
                        </div>
                    </div>
                ))}
             </div>
             )}
        </div>
      </div>

      <div className="clay-card p-6 md:p-10 fade-in-section">
        <div className="flex flex-col md:flex-row justify-between items-center mb-12 gap-6">
          <h3 className="text-[16px] font-black uppercase tracking-widest text-main flex items-center gap-3">
            <History size={20} style={{ color: activeMenuColor }} /> Riwayat Transaksi
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

      {isTxModalOpen && canEditCurrentProject && (
        <div className="fixed inset-0 z-[90] bg-black/25 backdrop-blur-[1px] flex items-center justify-center p-4">
          <div className="clay-card w-full max-w-xl p-6 md:p-8 rounded-[16px]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[14px] font-black uppercase tracking-widest text-main">
                {txModalMode === 'create' ? 'Tambah Transaksi' : 'Edit Transaksi'}
              </h3>
              <button onClick={() => setIsTxModalOpen(false)} className="text-muted">
                <X size={18} />
              </button>
            </div>
            <div className="space-y-3">
              <input
                type="date"
                value={manualDraft.date}
                onChange={(e) => updateManualDraftField('date', e.target.value)}
                className="w-full rounded-[16px] px-4 py-3 text-[12px] font-semibold text-main bg-transparent border border-[#7C9B93]/20 outline-none"
              />
              <select
                value={manualDraft.type}
                onChange={(e) => updateManualDraftField('type', e.target.value as 'Masuk' | 'Keluar' | 'Tabungan')}
                className="w-full rounded-[16px] px-4 py-3 text-[12px] font-semibold text-main bg-transparent border border-[#7C9B93]/20 outline-none"
              >
                <option value="Masuk">Masuk</option>
                <option value="Keluar">Keluar</option>
                <option value="Tabungan">Tabungan</option>
              </select>
              <input
                value={manualDraft.description}
                onChange={(e) => updateManualDraftField('description', e.target.value)}
                placeholder="Uraian transaksi"
                className="w-full rounded-[16px] px-4 py-3 text-[12px] font-semibold text-main bg-transparent border border-[#7C9B93]/20 outline-none"
              />
              <input
                value={manualDraft.amountInput}
                onChange={(e) => updateManualDraftField('amountInput', e.target.value)}
                placeholder="Jumlah (Rp)"
                className="w-full rounded-[16px] px-4 py-3 text-[12px] font-semibold text-main bg-transparent border border-[#7C9B93]/20 outline-none"
              />
              <input
                value={manualDraft.category}
                onChange={(e) => updateManualDraftField('category', e.target.value)}
                placeholder="Kategori (contoh: Donasi, Operasional, Tabungan)"
                className="w-full rounded-[16px] px-4 py-3 text-[12px] font-semibold text-main bg-transparent border border-[#7C9B93]/20 outline-none"
              />
              <input
                value={manualDraft.note}
                onChange={(e) => updateManualDraftField('note', e.target.value)}
                placeholder="Keterangan (opsional)"
                className="w-full rounded-[16px] px-4 py-3 text-[12px] font-semibold text-main bg-transparent border border-[#7C9B93]/20 outline-none"
              />
            </div>
            {txValidationError && <p className="mt-3 text-[11px] font-black text-[#A68B8B]">{txValidationError}</p>}
            <div className="mt-4 flex flex-wrap gap-2">
              <button onClick={() => saveTransactionDraft(false)} className="px-4 py-2 rounded-[16px] bg-[#7C9B93] text-white text-[10px] font-black uppercase tracking-widest">
                Simpan
              </button>
              <button onClick={() => saveTransactionDraft(true)} className="px-4 py-2 rounded-[16px] bg-[#7C9B93]/85 text-white text-[10px] font-black uppercase tracking-widest">
                Simpan & Tambah Lagi
              </button>
              <button onClick={() => setIsTxModalOpen(false)} className="clay-button !px-4 !py-2 !rounded-[16px] text-[10px] font-black uppercase !tracking-widest !text-[#A68B8B]">
                Batal
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className="fixed top-6 right-6 z-[95] px-4 py-3 rounded-[16px] shadow-lg bg-white border border-[#7C9B93]/20 text-[11px] font-black uppercase tracking-widest text-[#7C9B93]">
          {toast.message}
        </div>
      )}

      <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-50 md:hidden w-[90%]">
        <div
          className="mobile-nav-dock p-2 flex items-center justify-between gap-1 overflow-x-auto no-scrollbar"
          style={{ background: activeMenuColor }}
        >
          {projects.map((proj) => {
            const ProjIcon = ProjectIcons[proj];
            const isActive = activeProject === proj;
            return (
              <button
                key={proj}
                onClick={() => setActiveProject(proj)}
                className={`mobile-menu-btn flex flex-col items-center justify-center p-3 flex-1 min-w-[60px] ${isActive ? 'active' : ''}`}
                style={!isActive ? { color: 'rgba(255,255,255,0.85)' } : undefined}
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
