
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
  Shield,
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
  FileText,
  Lock,
  LogOut,
  Layout,
  Settings,
  Home,
  ChevronLeft,
  ChevronRight,
  Info,
  AlertCircle,
  AlertTriangle,
  KeyRound
} from 'lucide-react';
import { PROJECT_DATA, ProjectData } from './constants';
import GiftBoxAnimation from './GiftBoxAnimation';
import { supabase } from './supabase';

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
const PROFILE_PROJECTS: ProjectType[] = ['Semua', ...PROJECT_KEYS];
const ADMIN_ACCOUNTS: Array<{ username: string; password: string; project: ProjectKey | 'all' }> = [];
const PROFILE_STORAGE_KEY = 'ummahat_profiles_v1';
const MANUAL_REPORT_STORAGE_KEY = 'ummahat_manual_reports_v1';
const VOLUNTEER_STORAGE_KEY = 'ummahat_volunteer_apply_v1';
const ADMIN_OTP_PENDING_KEY = 'ummahat_admin_otp_pending_v1';
const ADMIN_OTP_PENDING_MS = 5 * 60 * 1000;
const ADMIN_OTP_LENGTH = 6;

const cloneProfile = (profile: ProjectProfile): ProjectProfile => JSON.parse(JSON.stringify(profile));
const withProfileDefaults = (profile: ProjectProfile): ProjectProfile => ({
  ...profile,
  joinEnabled: profile.joinEnabled !== false
});
const LEGACY_RESIK_TEAM_NAMES = new Set(['Ummu Nabila', 'Ummu Aisha', 'Ummu Safa', 'Kak Ratna Wulan', 'Kak Rini', 'Bu Nyai']);

type ManualReportRow = {
  id: string | number;
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

type PdfImportRow = ManualReportRow & {
  selected: boolean;
  sourceLine: string;
  balance: number;
  weightKg: number | null;
  confidence: number;
  status: 'valid' | 'perlu_review';
  reviewAcknowledged: boolean;
};

type PdfImportSummary = {
  total_rows_detected: number;
  valid_transactions: number;
  need_review: number;
  ignored_rows: number;
};

type PdfIgnoredRow = {
  raw_text: string;
  reason: string;
};

type AdminActivityLog = {
  id: string;
  actor_email: string;
  project: string;
  action: string;
  description: string;
  metadata?: Record<string, any> | null;
  created_at: string;
};

type VolunteerApply = {
  id: string | number;
  project: ProjectKey;
  name: string;
  skill: string;
  commitment: string;
  createdAt: string;
};

const getDefaultProfiles = (): Record<ProjectType, ProjectProfile> => ({
  Semua: {
    vision: 'Setiap data dan angka yang kami tampilkan di halaman sederhana ini disajikan secara terbuka sebagai bentuk penjagaan amanah. Transparansi ini kami hadirkan sebagai wujud tanggung jawab atas setiap titipan yang dikelola, sebelum semuanya kelak dipertanggungjawabkan di hadapan Allah ta\'ala.',
    missions: ['"Jazakumullahu khairan atas kepercayaan dan infak yang telah dititipkan. Semoga setiap rupiah menjadi amal jariyah yang terus mengalir pahalanya, serta menjadi bagian dari keberkahan bagi generasi yang sedang kita jaga bersama."'],
    agenda: [],
    joinEnabled: false,
    contributions: [],
    team: []
  },
  Resik: withProfileDefaults(cloneProfile(PROJECT_DATA.Resik.profile)),
  Hadeyya: withProfileDefaults(cloneProfile(PROJECT_DATA.Hadeyya.profile)),
  Siyar: withProfileDefaults(cloneProfile(PROJECT_DATA.Siyar.profile)),
  Haru: withProfileDefaults(cloneProfile(PROJECT_DATA.Haru.profile))
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

const parsePdfAmount = (raw: string): number => {
  const cleaned = raw.replace(/[^\d.,-]/g, '');
  const withoutDecimal =
    /,\d{2}$/.test(cleaned) ? cleaned.replace(/,\d{2}$/, '') :
    /\.\d{2}$/.test(cleaned) ? cleaned.replace(/\.\d{2}$/, '') :
    cleaned;
  return parseRupiahInput(withoutDecimal);
};

const normalizePdfDate = (raw: string): string => {
  const parts = raw.split(/[./-]/).map(Number);
  if (parts.length !== 3 || parts.some(Number.isNaN)) return '';
  const isValid = (year: number, month: number, day: number) => {
    if (year < 2000 || month < 1 || month > 12 || day < 1 || day > 31) return false;
    const date = new Date(year, month - 1, day);
    return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
  };
  if (parts[0] > 1900) {
    return isValid(parts[0], parts[1], parts[2])
      ? `${parts[0]}-${String(parts[1]).padStart(2, '0')}-${String(parts[2]).padStart(2, '0')}`
      : '';
  }
  const year = parts[2] < 100 ? 2000 + parts[2] : parts[2];
  return isValid(year, parts[1], parts[0])
    ? `${year}-${String(parts[1]).padStart(2, '0')}-${String(parts[0]).padStart(2, '0')}`
    : '';
};

const isValidDateInput = (value: string): boolean => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
};

const cleanPdfDescription = (value: string): string => {
  return value
    .replace(/\b\d{1,3}(?:[.,]\d{3})*(?:[.,]\d{2})?\b/g, ' ')
    .replace(/\b\d+(?:[.,]\d+)?\s*(kg|gr|g|pcs|pc|buah|lembar|unit)\b/gi, ' ')
    .replace(/\b(kg|gr|g|pcs|pc|buah|lembar|unit)\s+\d+\b/gi, '$1')
    .replace(/\b\d+\s*:\s*\d+\b/g, ' ')
    .replace(/\b\d+\b$/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
};

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

const WelcomeSection = ({ description, quote }: { description: string; quote: string }) => {
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
          {description}
        </p>
        <div className="p-6 clay-inset bg-[#7C9B93]/5 rounded-3xl">
          <p className="italic text-muted font-medium">
            {quote}
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
  isJoinEnabled = true,
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
  isJoinEnabled?: boolean;
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
  const themeBorder = `${accentColor}33`;
  const themeFocusBorder = `${accentColor}73`;

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
                      <button onClick={onEditVision} className="clay-button !px-3 !py-1.5 !rounded-xl text-[9px] font-black uppercase !tracking-widest" style={{ color: accentColor }}>
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
                      <button onClick={onEditMissions} className="clay-button !px-3 !py-1.5 !rounded-xl text-[9px] font-black uppercase !tracking-widest" style={{ color: accentColor }}>
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
                    <button onClick={onEditTeam} className="clay-button !px-3 !py-1.5 !rounded-xl text-[9px] font-black uppercase !tracking-widest" style={{ color: accentColor }}>
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

        <div className={`grid grid-cols-1 ${isJoinEnabled ? 'lg:grid-cols-2' : ''} gap-6`}>
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
                <button onClick={onEditAgenda} className="clay-button !px-3 !py-1.5 !rounded-xl text-[9px] font-black uppercase !tracking-widest" style={{ color: accentColor }}>
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

          {isJoinEnabled && (
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
                    className="w-full rounded-2xl px-4 py-3 text-[12px] font-semibold text-main placeholder:text-muted outline-none bg-transparent border transition-colors"
                    style={{ borderColor: themeBorder }}
                    onFocus={(e) => { e.currentTarget.style.borderColor = themeFocusBorder; }}
                    onBlur={(e) => { e.currentTarget.style.borderColor = themeBorder; }}
                  />
                  <input
                    value={volunteerNote}
                    onChange={(e) => setVolunteerNote(e.target.value)}
                    placeholder="Minat/keahlian (opsional)"
                    className="w-full rounded-2xl px-4 py-3 text-[12px] font-semibold text-main placeholder:text-muted outline-none bg-transparent border transition-colors"
                    style={{ borderColor: themeBorder }}
                    onFocus={(e) => { e.currentTarget.style.borderColor = themeFocusBorder; }}
                    onBlur={(e) => { e.currentTarget.style.borderColor = themeBorder; }}
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
                          commitmentType === opt ? 'text-white' : 'bg-transparent text-muted border'
                        }`}
                        style={
                          commitmentType === opt
                            ? { backgroundColor: accentColor }
                            : { borderColor: themeBorder }
                        }
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full px-4 py-3 rounded-2xl text-white text-[11px] font-black uppercase tracking-[0.14em]"
                  style={{ backgroundColor: accentColor }}
                >
                  Kirim Minat Join
                </button>

                {joinMessage && (
                  <p className="text-[11px] font-black leading-relaxed" style={{ color: accentColor }}>{joinMessage}</p>
                )}
              </form>
            )}
          </div>
          )}
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
    const IconComp = iconMap[type];
    const color = accentColor;

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
                <span className="text-[18px] md:text-[26px] font-black leading-none mt-1" style={{ color: accentColor }}>{item.value}</span>
              </div>
              <div className="flex flex-col items-end gap-2">
                {isAdminMode && (
                  <button onClick={() => onEditContribution?.(idx)} className="clay-button !px-3 !py-1.5 !rounded-xl text-[9px] font-black uppercase !tracking-widest" style={{ color: accentColor }}>
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
          <div className="relative">
            <select
              value={editingProject}
              onChange={(e) => setEditingProject(e.target.value as ProjectKey)}
              disabled={session.project !== 'all'}
              className="appearance-none rounded-2xl px-4 pr-10 py-2 text-[12px] font-black uppercase tracking-widest text-main bg-transparent border border-[#7C9B93]/25 outline-none cursor-pointer"
            >
              {PROJECT_KEYS.map((k) => (
                <option key={k} value={k}>{k}</option>
              ))}
            </select>
            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7C9B93] pointer-events-none" />
          </div>
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
  const [editableProfiles, setEditableProfiles] = useState<Record<ProjectType, ProjectProfile>>(() => {
    const defaults = getDefaultProfiles();
    try {
      const raw = localStorage.getItem(PROFILE_STORAGE_KEY);
      if (!raw) return defaults;
      const parsed = JSON.parse(raw) as Partial<Record<ProjectType, ProjectProfile>>;
      PROFILE_PROJECTS.forEach((key) => {
        if (parsed[key]) {
          defaults[key] = withProfileDefaults({ ...defaults[key], ...parsed[key] });
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
  const [adminPasscode, setAdminPasscode] = useState('');
  const [isAdminSubmitting, setIsAdminSubmitting] = useState(false);
  const [isPasscodeSent, setIsPasscodeSent] = useState(false);
  const [adminLoginError, setAdminLoginError] = useState('');
  const [adminNotice, setAdminNotice] = useState('');
  const [manualDraft, setManualDraft] = useState<ManualReportDraft>(createEmptyManualDraft());
  const [isTxModalOpen, setIsTxModalOpen] = useState(false);
  const [txModalMode, setTxModalMode] = useState<'create' | 'edit'>('create');
  const [editingTxId, setEditingTxId] = useState<string | number | null>(null);
  const [txValidationError, setTxValidationError] = useState('');
  const [txPage, setTxPage] = useState(1);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [pdfImportRows, setPdfImportRows] = useState<PdfImportRow[]>([]);
  const [isPdfImportOpen, setIsPdfImportOpen] = useState(false);
  const [isPdfParsing, setIsPdfParsing] = useState(false);
  const [pdfImportError, setPdfImportError] = useState('');
  const [pdfSourceName, setPdfSourceName] = useState('');
  const [pdfImportId, setPdfImportId] = useState<string | null>(null);
  const [pdfImportSummary, setPdfImportSummary] = useState<PdfImportSummary | null>(null);
  const [pdfIgnoredRows, setPdfIgnoredRows] = useState<PdfIgnoredRow[]>([]);
  const [pdfImportWarnings, setPdfImportWarnings] = useState<string[]>([]);
  const [isPdfApproving, setIsPdfApproving] = useState(false);
  const pdfFileInputRef = useRef<HTMLInputElement>(null);
  const [user, setUser] = useState<any>(null);
  const [adminRoles, setAdminRoles] = useState<Array<{ email: string, project: string }>>([]);
  const [adminActivityLogs, setAdminActivityLogs] = useState<AdminActivityLog[]>([]);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [newAdminProject, setNewAdminProject] = useState<ProjectKey | 'all'>('Resik');
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
  const loggedLoginEmailsRef = useRef<Set<string>>(new Set());

  const readPendingAdminOtp = () => {
    try {
      const raw = sessionStorage.getItem(ADMIN_OTP_PENDING_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as { email?: string; sentAt?: number };
      if (!parsed.email || !parsed.sentAt) return null;
      if (Date.now() - parsed.sentAt > ADMIN_OTP_PENDING_MS) {
        sessionStorage.removeItem(ADMIN_OTP_PENDING_KEY);
        return null;
      }
      return { email: parsed.email, sentAt: parsed.sentAt };
    } catch {
      return null;
    }
  };

  const rememberPendingAdminOtp = (email: string) => {
    sessionStorage.setItem(ADMIN_OTP_PENDING_KEY, JSON.stringify({ email, sentAt: Date.now() }));
  };

  const clearPendingAdminOtp = () => {
    sessionStorage.removeItem(ADMIN_OTP_PENDING_KEY);
  };

  const getAppOrigin = () => {
    const configuredUrl = String(import.meta.env.VITE_APP_URL || '').trim().replace(/\/+$/, '');
    return configuredUrl || window.location.origin;
  };

  const getAdminRedirectUrl = () => `${getAppOrigin()}/admin`;

  const readOAuthErrorFromUrl = () => {
    const params = new URLSearchParams(window.location.search);
    const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''));
    const error = params.get('error_description') || params.get('error') || hashParams.get('error_description') || hashParams.get('error');
    if (!error) return '';
    return error.replace(/\+/g, ' ');
  };

  // Supabase Data Fetching
  useEffect(() => {
    async function fetchSupabaseData() {
      try {
        const { data: profiles } = await supabase.from('project_profiles').select('*');
        if (profiles && profiles.length > 0) {
          setEditableProfiles(prev => {
            const next = { ...prev };
            profiles.forEach(p => {
              if (PROFILE_PROJECTS.includes(p.project_key as ProjectType)) {
                next[p.project_key as ProjectType] = {
                  vision: p.vision || '',
                  missions: p.missions || [],
                  agenda: p.agenda || [],
                  joinEnabled: p.join_enabled !== false,
                  team: p.team || [],
                  contributions: p.contributions || []
                };
              }
            });
            return next;
          });
        }

        const { data: tx } = await supabase.from('transactions').select('*');
        if (tx && tx.length > 0) {
          setManualReportsByProject(prev => {
            const next = { ...prev };
            PROJECT_KEYS.forEach(k => next[k] = []);
            tx.forEach(t => {
              if (next[t.project as ProjectType]) {
                next[t.project as ProjectType].push({
                  id: t.id,
                  date: t.date,
                  type: t.type,
                  description: t.description,
                  amount: t.amount,
                  category: t.category,
                  note: t.note
                });
              }
            });
            return next;
          });
        }

        const { data: vols } = await supabase.from('volunteers').select('*');
        if (vols && vols.length > 0) {
          setVolunteerApplyByProject(prev => {
            const next = { ...prev };
            PROJECT_KEYS.forEach(k => next[k as ProjectKey] = []);
            vols.forEach(v => {
              if (next[v.project as ProjectKey]) {
                next[v.project as ProjectKey].push({
                  id: v.id,
                  project: v.project as ProjectKey,
                  name: v.name,
                  skill: v.skill,
                  commitment: v.commitment,
                  createdAt: v.created_at
                });
              }
            });
            return next;
          });
        }
      } catch (err) {
        console.error('Failed to fetch from supabase', err);
      }
    }
    fetchSupabaseData();
  }, []);

  // Auth & Roles Sync
  useEffect(() => {
    const oauthError = readOAuthErrorFromUrl();
    if (oauthError) {
      setAdminLoginError(oauthError);
      window.history.replaceState({}, '', window.location.pathname);
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      handleUserSession(session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setTimeout(() => {
        handleUserSession(session?.user ?? null);
      }, 0);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const pending = readPendingAdminOtp();
    if (!pending) return;
    setAdminUsername(pending.email);
    setIsPasscodeSent(true);
  }, []);

  const handleUserSession = async (user: any) => {
    setUser(user);
    if (user) {
      const userEmail = String(user.email || '').toLowerCase();
      const { data: roleData, error } = await supabase
        .from('admin_roles')
        .select('*')
        .ilike('email', userEmail)
        .maybeSingle();

      if (error || !roleData) {
        await supabase.auth.signOut();
        setAdminLoginError('Email ini tidak terdaftar sebagai admin.');
        setAdminSession(null);
      } else {
        setAdminSession({ username: user.user_metadata.full_name || user.email, project: roleData.project });
        setAdminTargetProject(roleData.project === 'all' ? 'Resik' : roleData.project);
        const loginEmail = userEmail;
        if (loginEmail && !loggedLoginEmailsRef.current.has(loginEmail)) {
          loggedLoginEmailsRef.current.add(loginEmail);
          supabase.from('admin_activity_logs').insert({
            actor_email: loginEmail,
            project: roleData.project,
            action: 'login',
            description: `Login admin sebagai ${roleData.project === 'all' ? 'superadmin' : roleData.project}.`,
            metadata: {
              provider: user.app_metadata?.provider || 'unknown',
              name: user.user_metadata?.full_name || null
            }
          }).then(({ error }) => {
            if (error) console.error('Supabase error saving login log:', error);
          });
        }
        if (roleData.project === 'all') {
          fetchAdminRoles();
          fetchAdminActivityLogs();
        }
      }
    } else {
      setAdminSession(null);
    }
    setIsAuthLoading(false);
  };

  const fetchAdminRoles = async () => {
    const { data } = await supabase.from('admin_roles').select('*');
    if (data) setAdminRoles(data);
  };

  const fetchAdminActivityLogs = async () => {
    const { data, error } = await supabase
      .from('admin_activity_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(80);
    if (!error && data) setAdminActivityLogs(data as AdminActivityLog[]);
  };

  const logAdminActivity = async (
    action: string,
    description: string,
    metadata: Record<string, any> = {},
    projectOverride?: ProjectType | ProjectKey | 'all'
  ) => {
    const actorEmail = (user?.email || adminUsername || '').toLowerCase();
    if (!actorEmail) return;
    const project = String(projectOverride || managedProject || adminSession?.project || 'Semua');
    const { error } = await supabase.from('admin_activity_logs').insert({
      actor_email: actorEmail,
      project,
      action,
      description,
      metadata
    });
    if (error) {
      console.error('Supabase error saving activity log:', error);
      return;
    }
    if (adminSession?.project === 'all') fetchAdminActivityLogs();
  };

  const addAdminRole = async () => {
    if (!newAdminEmail.trim()) return;
    const email = newAdminEmail.trim().toLowerCase();
    const { error } = await supabase.from('admin_roles').insert({
      email,
      project: newAdminProject
    });
    if (!error) {
      showToast('Admin berhasil ditambahkan');
      logAdminActivity('admin_role_added', `Menambahkan admin ${email} untuk project ${newAdminProject}.`, { email, project: newAdminProject }, 'all');
      setNewAdminEmail('');
      fetchAdminRoles();
    } else {
      showToast('Gagal menambah admin', 'error');
    }
  };

  const deleteAdminRole = async (email: string) => {
    if (email === user?.email) {
      showToast('Tidak bisa menghapus diri sendiri', 'error');
      return;
    }
    if (!window.confirm(`Hapus akses untuk ${email}?`)) return;
    const { error } = await supabase.from('admin_roles').delete().eq('email', email);
    if (!error) {
      showToast('Akses dihapus');
      logAdminActivity('admin_role_deleted', `Menghapus akses admin ${email}.`, { email }, 'all');
      fetchAdminRoles();
    }
  };

  const getAdminEmailInput = () => adminUsername.trim().toLowerCase();
  const normalizeAdminPasscode = (value: string) => value.replace(/\D/g, '').slice(0, ADMIN_OTP_LENGTH);

  const handleSendAdminPasscode = async () => {
    const email = getAdminEmailInput();
    if (!email) {
      setAdminLoginError('Isi email terlebih dahulu untuk menerima kode.');
      return;
    }

    setIsAdminSubmitting(true);
    setAdminLoginError('');
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: false,
        emailRedirectTo: getAdminRedirectUrl()
      }
    });
    setIsAdminSubmitting(false);

    if (error) {
      const pending = readPendingAdminOtp();
      if (pending?.email === email) {
        setIsPasscodeSent(true);
      }
      setAdminLoginError(error.message);
      return;
    }

    rememberPendingAdminOtp(email);
    setIsPasscodeSent(true);
    setAdminPasscode('');
    showToast('Kode masuk dikirim ke email.');
  };

  const handleVerifyAdminPasscode = async () => {
    const email = getAdminEmailInput();
    const passcode = normalizeAdminPasscode(adminPasscode);
    if (passcode !== adminPasscode) {
      setAdminPasscode(passcode);
    }
    if (!email) {
      setAdminLoginError('Isi email terlebih dahulu.');
      return;
    }
    if (passcode.length !== ADMIN_OTP_LENGTH) {
      setAdminLoginError(`Kode passcode harus ${ADMIN_OTP_LENGTH} angka.`);
      return;
    }

    setIsAdminSubmitting(true);
    setAdminLoginError('');
    const verifyByType = (type: 'email' | 'magiclink') => supabase.auth.verifyOtp({
      email,
      token: passcode,
      type
    });
    let { error } = await verifyByType('email');
    if (error?.message?.toLowerCase().includes('expired or is invalid')) {
      const fallback = await verifyByType('magiclink');
      error = fallback.error;
    }
    setIsAdminSubmitting(false);

    if (error) {
      setAdminLoginError(error.message);
      return;
    }

    clearPendingAdminOtp();
  };

  const handleGoogleLogin = async () => {
    setIsAdminSubmitting(true);
    setAdminLoginError('');
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: getAdminRedirectUrl(),
        queryParams: {
          prompt: 'select_account'
        }
      }
    });
    if (error) {
      setIsAdminSubmitting(false);
      setAdminLoginError(error.message);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setAdminSession(null);
    setUser(null);
    setViewMode('dashboard');
  };

  const [adminTab, setAdminTab] = useState<'profil' | 'keuangan' | 'kontribusi' | 'admin_management'>('profil');
  const [adminTargetProject, setAdminTargetProject] = useState<ProjectType>('Resik');
  const [profileDraft, setProfileDraft] = useState<{ vision: string; missions: string[]; agenda: string[]; joinEnabled: boolean; team: Array<{ name: string; role: string }> }>({
    vision: '',
    missions: [],
    agenda: [],
    joinEnabled: true,
    team: []
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

  const dynamicProjectData = useMemo(() => {
    const data: Record<string, any> = {};
    
    PROJECT_KEYS.forEach(key => {
      const manualRows = manualReportsByProject[key] || [];
      const income = manualRows.reduce((acc, r) => acc + (r.type === 'Masuk' ? r.amount : 0), 0);
      const expense = manualRows.reduce((acc, r) => acc + (r.type === 'Keluar' ? r.amount : 0), 0);
      const savings = manualRows.reduce((acc, r) => acc + (r.type === 'Tabungan' ? r.amount : 0), 0);
      const balance = income - expense - savings;

      const transactions = manualRows.map(r => ({
        id: r.id,
        date: r.date.split('-').reverse().join('/'),
        description: r.description,
        income: r.type === 'Masuk' ? r.amount : null,
        expense: (r.type === 'Keluar' || r.type === 'Tabungan') ? r.amount : null,
        category: r.category || 'Tanpa Kategori',
        balance: 0 
      })).sort((a, b) => {
        const da = new Date(a.date.split('/').reverse().join('-')).getTime();
        const db = new Date(b.date.split('/').reverse().join('-')).getTime();
        return db - da;
      });

      const monthlyMap: Record<string, { income: number, expense: number }> = {};
      manualRows.forEach(r => {
        const m = r.date.slice(0, 7); 
        if (!monthlyMap[m]) monthlyMap[m] = { income: 0, expense: 0 };
        if (r.type === 'Masuk') monthlyMap[m].income += r.amount;
        else if (r.type === 'Keluar') monthlyMap[m].expense += r.amount;
      });

      const monthlyFlow = Object.entries(monthlyMap).map(([m, val]) => ({
        month: m,
        income: val.income,
        expense: val.expense
      })).sort((a, b) => a.month.localeCompare(b.month));

      data[key] = {
        ...PROJECT_DATA[key],
        profile: editableProfiles[key],
        summary: { balance, income, expense },
        transactions: transactions.length > 0 ? transactions : PROJECT_DATA[key].transactions,
        monthlyFlow: monthlyFlow.length > 0 ? monthlyFlow : PROJECT_DATA[key].monthlyFlow
      };
    });

    return data;
  }, [manualReportsByProject, editableProfiles]);

  const aggregatedData = useMemo(() => {
    const allProjects = PROJECT_KEYS;
    let totalBalance = 0, totalIncome = 0, totalExpense = 0;
    let allTransactions: any[] = [];
    const projectBalanceContributions: any[] = [];

    allProjects.forEach((key, idx) => {
      const p = dynamicProjectData[key];
      totalBalance += p.summary.balance;
      totalIncome += p.summary.income;
      totalExpense += p.summary.expense;
      allTransactions = [...allTransactions, ...p.transactions.map((t: any) => ({ ...t, project: key }))];
      
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

    const masterMonthly: Record<string, { income: number, expense: number }> = {};
    allProjects.forEach(key => {
      dynamicProjectData[key].monthlyFlow.forEach((f: any) => {
        if (!masterMonthly[f.month]) masterMonthly[f.month] = { income: 0, expense: 0 };
        masterMonthly[f.month].income += f.income;
        masterMonthly[f.month].expense += f.expense;
      });
    });

    const combinedMonthlyFlow = Object.entries(masterMonthly).map(([m, val]) => ({
      month: m,
      income: val.income,
      expense: val.expense
    })).sort((a, b) => a.month.localeCompare(b.month));

    return {
      summary: { balance: totalBalance, income: totalIncome, expense: totalExpense },
      transactions: allTransactions,
      projectBalanceContributions,
      monthlyFlow: combinedMonthlyFlow
    };
  }, [dynamicProjectData]);

  const resikStats = useMemo(() => {
    const resikTransactions = dynamicProjectData['Resik'].transactions;
    
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
  }, [dynamicProjectData]);

  const currentData = activeProject === 'Semua' ? aggregatedData : dynamicProjectData[activeProject];
  const Icon = ProjectIcons[activeProject];
  const Timeline = ProjectTimelines[activeProject];

  const pieData = useMemo(() => {
    if (activeProject === 'Semua') {
      const resikCintaGuru = dynamicProjectData['Resik'].transactions.reduce((acc: number, tx: any) => {
        const desc = tx.description.toLowerCase();
        return desc.includes('cinta guru') && tx.expense ? acc + tx.expense : acc;
      }, 0);
      const haruForCintaGuru = dynamicProjectData['Haru'].summary.balance;
      const bilistiwa = dynamicProjectData['Siyar'].transactions.reduce((acc: number, tx: any) => {
        const desc = tx.description.toLowerCase();
        return (desc.includes('blistiwa') || desc.includes('bilistiwa')) && tx.expense ? acc + tx.expense : acc;
      }, 0);
      const situasional = dynamicProjectData['Hadeyya'].summary.balance;

      return [
        { name: 'Dana Cinta Guru', value: resikCintaGuru + haruForCintaGuru, color: '#7C9B93' },
        { name: 'Bilistiwa', value: bilistiwa, color: '#A68B8B' },
        { name: 'Situasional', value: situasional, color: '#638079' }
      ];
    }
    
    // Dynamic categories calculation based on actual transactions
    const expenseTx = currentData.transactions.filter((tx: any) => tx.expense && tx.expense > 0);
    const categoryMap: Record<string, number> = {};
    let totalCatExpense = 0;
    
    expenseTx.forEach((tx: any) => {
      const cat = tx.category || 'Tanpa Kategori';
      if (!categoryMap[cat]) categoryMap[cat] = 0;
      categoryMap[cat] += tx.expense;
      totalCatExpense += tx.expense;
    });

    const categories = Object.entries(categoryMap).map(([name, value], index) => ({
      name,
      value: totalCatExpense > 0 ? Math.round((value / totalCatExpense) * 100) : 0,
      nominal: value,
      color: CHART_UNIQUE_PALETTE[index % CHART_UNIQUE_PALETTE.length]
    })).sort((a, b) => b.nominal - a.nominal);

    return categories.length > 0 ? categories : (currentData as any).expenseCategories.map((c: any) => ({...c, nominal: Math.round((c.value / 100) * currentData.summary.expense)}));

  }, [activeProject, currentData, aggregatedData, dynamicProjectData]);

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
    const managed: ProjectType = adminSession.project === 'all' ? adminTargetProject : adminSession.project;
    if (managed === 'Semua') return;
    const p = editableProfiles[managed];
    setProfileDraft({
      vision: p.vision,
      missions: [...p.missions],
      agenda: [...p.agenda],
      joinEnabled: p.joinEnabled !== false,
      team: p.team
        .map((t: any) => {
          if (typeof t === 'string') {
            const parts = t.split('|');
            return { name: parts[0] || '', role: parts[1] || '' };
          }
          return { name: t.name || '', role: t.role || '' };
        })
        .filter(t => t.name.trim() !== '' || t.role.trim() !== '')
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
  const managedProject: ProjectType = adminSession?.project === 'all' ? adminTargetProject : (adminSession?.project || 'Resik');
  const activeProjectProfile = activeProject === 'Semua' ? null : editableProfiles[activeProject as ProjectKey];
  const activeProjectContributions = activeProject === 'Semua' ? null : editableProfiles[activeProject as ProjectKey].contributions;
  const currentProjectKey = activeProject === 'Semua' ? null : (activeProject as ProjectKey);
  const canEditCurrentProject = Boolean(
    viewMode === 'admin' &&
    adminSession &&
    managedProject !== 'Semua' &&
    (adminSession.project === 'all' || adminSession.project === managedProject)
  );

  const filteredTransactions = currentData.transactions.filter(t => {
    if (filter === 'all') return true;
    return filter === 'income' ? t.income !== null : t.expense !== null;
  });

  const sortedManualRows = useMemo(() => {
    if (managedProject === 'Semua') {
      const all: any[] = [];
      PROJECT_KEYS.forEach(k => {
        const rows = (manualReportsByProject[k] || []).map(r => ({ ...r, projectSource: k }));
        all.push(...rows);
      });
      return all.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }
    const list = manualReportsByProject[managedProject as ProjectKey] || [];
    return [...list].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [manualReportsByProject, managedProject]);

  const manualIncomeTotal = sortedManualRows.reduce((acc, row) => acc + (row.type === 'Masuk' ? row.amount : 0), 0);
  const manualExpenseTotal = sortedManualRows.reduce((acc, row) => acc + (row.type === 'Keluar' ? row.amount : 0), 0);
  const manualSavingsTotal = sortedManualRows.reduce((acc, row) => acc + (row.type === 'Tabungan' ? row.amount : 0), 0);
  const manualBalance = manualIncomeTotal - manualExpenseTotal - manualSavingsTotal;
  
  const manualDistributedTotal = sortedManualRows.reduce((acc, row) => {
    const desc = row.description.toLowerCase();
    if ((desc.includes('salur') || (desc.includes('cinta guru') && !desc.includes('tabungan'))) && row.type === 'Keluar') {
      return acc + row.amount;
    }
    return acc;
  }, 0);

  const rowsPerPage = 10;
  const totalPages = Math.max(1, Math.ceil(sortedManualRows.length / rowsPerPage));
  const pagedRows = sortedManualRows.slice((txPage - 1) * rowsPerPage, txPage * rowsPerPage);

  useEffect(() => {
    if (txPage > totalPages) setTxPage(totalPages);
  }, [txPage, totalPages]);

  useEffect(() => {
    if (managedProject === 'Semua' && adminTab === 'kontribusi') {
      setAdminTab('profil');
    }
  }, [managedProject, adminTab]);

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

  const extractPdfText = async (file: File) => {
    const [pdfjsLib, workerModule] = await Promise.all([
      import('pdfjs-dist'),
      import('pdfjs-dist/build/pdf.worker.mjs?url')
    ]);
    pdfjsLib.GlobalWorkerOptions.workerSrc = workerModule.default;

    const data = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data }).promise;
    const pages: string[] = [];

    for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
      const page = await pdf.getPage(pageNumber);
      const content = await page.getTextContent();
      const text = content.items
        .map((item: any) => ('str' in item ? item.str : ''))
        .filter(Boolean)
        .join(' ');
      pages.push(text);
    }

    return pages.join('\n');
  };

  const guessTransactionType = (line: string): ManualReportRow['type'] => {
    const lower = line.toLowerCase();
    if (/(tabungan|simpan|saving)/.test(lower)) return 'Tabungan';
    if (/(masuk|kredit|credit|cr\b|pemasukan|donasi|infaq|infak|transfer masuk)/.test(lower)) return 'Masuk';
    if (/(keluar|debit|db\b|pengeluaran|bayar|pembayaran|operasional|transfer keluar)/.test(lower)) return 'Keluar';
    if (/[+-]\s*(rp\s*)?\d/.test(lower)) return lower.includes('-') ? 'Keluar' : 'Masuk';
    return 'Masuk';
  };

  const guessTransactionCategory = (line: string, type: ManualReportRow['type']) => {
    const lower = line.toLowerCase();
    if (type === 'Tabungan') return 'Tabungan';
    if (/(donasi|infaq|infak|sedekah)/.test(lower)) return 'Donasi';
    if (/(operasional|transport|konsumsi|atk|bayar|pembayaran)/.test(lower)) return 'Operasional';
    if (/(transfer|tf)/.test(lower)) return 'Transfer';
    return type === 'Masuk' ? 'Pemasukan' : 'Pengeluaran';
  };

  const parsePdfTransactions = (text: string, sourceName: string): PdfImportRow[] => {
    const datePattern = /(\d{4}[./-]\d{1,2}[./-]\d{1,2}|\d{1,2}[./-]\d{1,2}[./-]\d{2,4})/;
    const amountPattern = /(?:rp\s*)?[+-]?\d[\d.,]{3,}/gi;

    return text
      .split(/\n|(?=\d{1,2}[./-]\d{1,2}[./-]\d{2,4})|(?=\d{4}[./-]\d{1,2}[./-]\d{1,2})/)
      .map((line) => line.replace(/\s+/g, ' ').trim())
      .filter((line) => datePattern.test(line))
      .map((line) => {
        const dateMatch = line.match(datePattern);
        const amounts = Array.from(line.matchAll(amountPattern)).map((m) => m[0]);
        const isLikelyTableRow = /^\d+\s+/.test(line);
        const tableAmounts = amounts.map(parsePdfAmount).filter((amount) => amount > 0);
        const tableHasExpenseHint = /(cinta guru|taawun|bbm|bersih|sampah|banner|poster|pembelian|bayar|pengeluaran)/i.test(line);
        const tableType: ManualReportRow['type'] =
          isLikelyTableRow && tableAmounts.length >= 2 && tableHasExpenseHint ? 'Keluar' : 'Masuk';
        const fallbackType = guessTransactionType(line);
        const type = isLikelyTableRow && tableAmounts.length >= 2 ? tableType : fallbackType;
        const amountRaw =
          isLikelyTableRow && tableAmounts.length >= 2
            ? String(type === 'Keluar' ? tableAmounts[tableAmounts.length - 2] : tableAmounts[0])
            : (amounts[amounts.length - 1] || '');
        const amount = parsePdfAmount(amountRaw);
        const balance =
          isLikelyTableRow && tableAmounts.length >= 2
            ? tableAmounts[tableAmounts.length - 1]
            : 0;
        const description = cleanPdfDescription(line
          .replace(/^\d+\s+/, '')
          .replace(datePattern, '')
          .replace(amountPattern, ' ')
          .replace(/\b(masuk|keluar|tabungan|kredit|debit|credit|cr|db)\b/gi, '')
          .replace(/[|:;-]+/g, ' ')
          .replace(/\s+/g, ' ')
          .trim());
        const note = sourceName ? `Import PDF: ${sourceName}` : 'Import PDF';

        return {
          id: crypto.randomUUID(),
          selected: true,
          sourceLine: line,
          date: normalizePdfDate(dateMatch?.[0] || ''),
          type,
          description: description || 'Transaksi dari PDF',
          amount,
          balance,
          category: guessTransactionCategory(line, type),
          note,
          weightKg: null,
          confidence: 0.6,
          status: !normalizePdfDate(dateMatch?.[0] || '') || amount <= 0 ? 'perlu_review' : 'valid',
          reviewAcknowledged: false
        };
      })
      .filter((row) => row.amount > 0);
  };

  const mapGeminiTypeToManualType = (jenis: string): ManualReportRow['type'] => {
    return jenis === 'pengeluaran' ? 'Keluar' : 'Masuk';
  };

  const mapGeminiTransactionsToRows = (transactions: any[], fileName: string): PdfImportRow[] => {
    return transactions.map((tx, index) => {
      const type = mapGeminiTypeToManualType(String(tx.jenis || '').toLowerCase());
      const status = tx.status === 'perlu_review' ? 'perlu_review' : 'valid';
      const date = typeof tx.tanggal === 'string' ? tx.tanggal : '';
      const amount = Number(tx.nominal || 0);
      const weightKg = tx.berat_kg === null || tx.berat_kg === undefined || tx.berat_kg === ''
        ? null
        : Number(tx.berat_kg);

      return {
        id: crypto.randomUUID(),
        selected: status === 'valid',
        sourceLine: tx.raw_text || '',
        date,
        type,
        description: String(tx.uraian || '').trim(),
        amount: Number.isFinite(amount) ? amount : 0,
        balance: 0,
        category: type === 'Masuk' ? 'Pemasukan' : 'Pengeluaran',
        note: String(tx.catatan || `Import dari PDF: ${fileName}`).trim(),
        weightKg: Number.isFinite(weightKg as number) ? weightKg : null,
        confidence: typeof tx.confidence === 'number' ? tx.confidence : 0,
        status,
        reviewAcknowledged: status === 'valid',
      };
    });
  };

  const handlePdfImportFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (managedProject === 'Semua') {
      showToast('Pilih project tertentu sebelum import PDF.', 'error');
      return;
    }
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      showToast('File harus berupa PDF.', 'error');
      return;
    }

    setIsPdfParsing(true);
    setPdfImportError('');
    setPdfSourceName(file.name);
    setPdfImportId(null);
    setPdfImportSummary(null);
    setPdfIgnoredRows([]);
    setPdfImportWarnings([]);
    try {
      const text = await extractPdfText(file);
      if (!text.trim()) {
        setPdfImportRows([]);
        setPdfImportError('PDF tidak berisi teks yang bisa dibaca. Gunakan PDF teks, bukan scan gambar.');
        setIsPdfImportOpen(true);
        return;
      }

      const { data, error } = await supabase.functions.invoke('financial-pdf-import', {
        body: {
          action: 'parse',
          project: managedProject,
          fileName: file.name,
          text
        }
      });

      if (error) {
        throw new Error(error.message);
      }

      const result = data?.result;
      const rows = mapGeminiTransactionsToRows(result?.transactions || [], file.name);
      if (!rows.length) {
        setPdfImportRows([]);
        setPdfImportId(data?.importId || null);
        setPdfImportSummary(result?.summary || null);
        setPdfIgnoredRows(result?.ignored_rows || []);
        setPdfImportWarnings(result?.warnings || []);
        setPdfImportError('Sistem tidak menemukan transaksi valid. Periksa baris yang diabaikan atau input manual.');
        setIsPdfImportOpen(true);
        return;
      }
      setPdfImportId(data?.importId || null);
      setPdfImportSummary(result?.summary || null);
      setPdfIgnoredRows(result?.ignored_rows || []);
      setPdfImportWarnings(result?.warnings || []);
      setPdfImportRows(rows);
      setIsPdfImportOpen(true);
    } catch (err) {
      console.error('PDF import failed:', err);
      setPdfImportRows([]);
      setPdfImportError(err instanceof Error ? err.message : 'Gagal membaca PDF. Coba gunakan PDF teks atau input manual.');
      setIsPdfImportOpen(true);
    } finally {
      setIsPdfParsing(false);
    }
  };

  const updatePdfImportRow = (id: string | number, field: keyof PdfImportRow, value: string | boolean) => {
    setPdfImportRows((prev) => prev.map((row) => {
      if (row.id !== id) return row;
      if (field === 'amount') return { ...row, amount: parseRupiahInput(String(value)) };
      if (field === 'balance') return { ...row, balance: parseRupiahInput(String(value)) };
      if (field === 'weightKg') {
        const normalized = String(value).replace(',', '.').trim();
        const weightKg = normalized ? Number(normalized) : null;
        return { ...row, weightKg: Number.isFinite(weightKg as number) ? weightKg : null };
      }
      if (field === 'selected') {
        return {
          ...row,
          selected: Boolean(value),
          reviewAcknowledged: Boolean(value) ? true : row.reviewAcknowledged
        };
      }
      return { ...row, [field]: value };
    }));
  };

  const removePdfImportRow = (id: string | number) => {
    setPdfImportRows((prev) => prev.filter((row) => row.id !== id));
  };

  const approvePdfImportRows = async () => {
    if (managedProject === 'Semua' || !canEditCurrentProject) return;
    const selectedRows = pdfImportRows.filter((row) => row.selected);
    const missingDateRows = selectedRows.filter((row) => !isValidDateInput(row.date));
    const invalidRows = selectedRows.filter((row) => row.description.trim().length < 3 || row.amount <= 0 || !['Masuk', 'Keluar'].includes(row.type));
    const unreviewedRows = selectedRows.filter((row) => row.status === 'perlu_review' && !row.reviewAcknowledged);

    if (missingDateRows.length) {
      setPdfImportError(`${missingDateRows.length} transaksi terpilih belum punya tanggal valid. Isi tanggal pada kolom merah atau hilangkan centangnya sebelum approve.`);
      return;
    }

    if (invalidRows.length) {
      setPdfImportError('Ada transaksi terpilih yang belum valid. Periksa uraian dan jumlah sebelum approve.');
      return;
    }

    if (unreviewedRows.length) {
      setPdfImportError(`${unreviewedRows.length} transaksi perlu review belum dicentang OK. Koreksi dulu, lalu centang OK sebelum approve.`);
      return;
    }

    if (!selectedRows.length) {
      setPdfImportError('Pilih minimal satu transaksi valid untuk diinput.');
      return;
    }

    setIsPdfApproving(true);
    setPdfImportError('');

    const approvedRows = selectedRows.map((row) => ({
      id: row.id,
      tanggal: row.date,
      jenis: row.type === 'Keluar' ? 'pengeluaran' : 'pemasukan',
      uraian: row.description.trim(),
      nominal: row.amount,
      berat_kg: row.weightKg,
      catatan: row.note.trim(),
      confidence: row.confidence,
      status: row.status,
      review_acknowledged: row.reviewAcknowledged
    }));

    try {
      const { data, error } = await supabase.functions.invoke('financial-pdf-import', {
        body: {
          action: 'approve',
          project: managedProject,
          importId: pdfImportId,
          transactions: approvedRows
        }
      });

      if (error) throw new Error(error.message);
      if (!data?.transactions?.length) throw new Error('Tidak ada transaksi yang berhasil disimpan.');

      setManualReportsByProject((prev) => ({
        ...prev,
        [managedProject]: [
          ...(prev[managedProject as ProjectKey] || []),
          ...data.transactions.map((row: any) => ({
            id: row.id,
            date: row.date,
            type: row.type,
            description: row.description,
            amount: row.amount,
            category: row.category,
            note: row.note
          } as ManualReportRow))
        ]
      }));
      setIsPdfImportOpen(false);
      setPdfImportRows([]);
      setPdfImportId(null);
      setPdfImportSummary(null);
      setPdfIgnoredRows([]);
      setPdfImportWarnings([]);
      setPdfImportError('');
      logAdminActivity(
        'pdf_import_approved',
        `Approve import PDF ${pdfSourceName || ''} sebanyak ${data.transactions.length} transaksi.`,
        { fileName: pdfSourceName, count: data.transactions.length, importId: pdfImportId },
        managedProject
      );
      showToast(`${data.transactions.length} transaksi PDF disetujui dan disimpan.`);
    } catch (err) {
      setPdfImportError(err instanceof Error ? err.message : 'Gagal menyimpan transaksi PDF.');
    } finally {
      setIsPdfApproving(false);
    }
  };

  const saveTransactionDraft = (keepAdding: boolean) => {
    const error = validateTransactionDraft();
    if (error) {
      setTxValidationError(error);
      showToast(error, 'error');
      return;
    }
    const amount = parseRupiahInput(manualDraft.amountInput);
    const isEdit = txModalMode === 'edit' && editingTxId !== null;
    const nextId = isEdit ? editingTxId! : crypto.randomUUID();

    const dbPayload = {
      id: nextId,
      project: managedProject,
      date: manualDraft.date,
      type: manualDraft.type,
      description: manualDraft.description.trim(),
      amount,
      category: manualDraft.category.trim(),
      note: manualDraft.note.trim()
    };

    if (isEdit) {
      supabase.from('transactions').update(dbPayload).eq('id', nextId).then(({ error }) => {
        if (error) console.error('Supabase error updating tx:', error);
      });
    } else {
      supabase.from('transactions').insert(dbPayload).then(({ error }) => {
        if (error) console.error('Supabase error inserting tx:', error);
      });
    }

    setManualReportsByProject((prev) => {
      const list = prev[managedProject as ProjectKey] || [];
      const newRow = {
        id: nextId,
        date: manualDraft.date,
        type: manualDraft.type,
        description: manualDraft.description.trim(),
        amount,
        category: manualDraft.category.trim(),
        note: manualDraft.note.trim()
      };
      
      return {
        ...prev,
        [managedProject]: isEdit ? list.map(tx => tx.id === editingTxId ? newRow : tx) : [...list, newRow]
      };
    });

    showToast(txModalMode === 'edit' ? 'Transaksi berhasil diperbarui.' : 'Transaksi berhasil ditambahkan.');
    logAdminActivity(
      isEdit ? 'transaction_updated' : 'transaction_created',
      `${isEdit ? 'Mengubah' : 'Menambahkan'} transaksi ${manualDraft.description.trim()} sebesar ${formatRupiah(amount)}.`,
      { id: nextId, type: manualDraft.type, amount, description: manualDraft.description.trim() },
      managedProject
    );
    setTxValidationError('');
    if (keepAdding) {
      setManualDraft((prev) => ({ ...createEmptyManualDraft(), date: prev.date }));
      setTxModalMode('create');
      setEditingTxId(null);
      return;
    }
    setIsTxModalOpen(false);
  };

  const deleteManualTransaction = (id: string | number) => {
    const ok = window.confirm('Hapus transaksi ini?');
    if (!ok) return;
    
    supabase.from('transactions').delete().eq('id', id).then(({ error }) => {
      if (error) console.error('Supabase error deleting tx:', error);
    });

    setManualReportsByProject((prev) => ({
      ...prev,
      [managedProject]: prev[managedProject as ProjectKey].filter((tx) => tx.id !== id)
    }));
    logAdminActivity('transaction_deleted', `Menghapus transaksi ${String(id)}.`, { id }, managedProject);
    showToast('Transaksi berhasil dihapus.');
  };

  const saveAdminProfileDraft = () => {
    updateProjectProfile(managedProject, (p) => ({
      ...p,
      vision: profileDraft.vision.trim() || p.vision,
      missions: profileDraft.missions.map((s) => s.trim()).filter(Boolean),
      agenda: profileDraft.agenda.map((s) => s.trim()).filter(Boolean),
      joinEnabled: profileDraft.joinEnabled,
      team: profileDraft.team
        .filter(member => member.name?.trim() || member.role?.trim())
        .map((member, idx) => ({
          name: member.name?.trim() || `Tim ${idx + 1}`,
          role: member.role?.trim() || 'Relawan',
          photo: ''
        }))
    }));
    logAdminActivity('profile_updated', `Mengubah profil project ${managedProject}.`, {
      fields: ['vision', 'missions', 'agenda', 'joinEnabled', 'team']
    }, managedProject);
    showToast('Profil project tersimpan.');
  };

  const saveAdminContributionDraft = () => {
    updateProjectProfile(managedProject, (p) => ({
      ...p,
      contributions: contributionDraft.filter((c) => c.title.trim() && c.value.trim())
    }));
    logAdminActivity('contribution_updated', `Mengubah kontribusi project ${managedProject}.`, {
      count: contributionDraft.filter((c) => c.title.trim() && c.value.trim()).length
    }, managedProject);
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

  const updateProjectProfile = (project: ProjectType, updater: (p: ProjectProfile) => ProjectProfile) => {
    setEditableProfiles((prev) => {
      const next = { ...prev, [project]: updater(prev[project]) };
      const profile = next[project];
      
      supabase.from('project_profiles').upsert({
        project_key: project,
        vision: profile.vision,
        missions: profile.missions,
        agenda: profile.agenda,
        join_enabled: profile.joinEnabled !== false,
        team: profile.team,
        contributions: profile.contributions,
        updated_at: new Date().toISOString()
      }).then(({ error }) => {
        if (error) console.error('Supabase error saving profile:', error);
      });

      localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(next));
      return next;
    });
    setAdminNotice(`Perubahan ${project} tersimpan.`);
    setTimeout(() => setAdminNotice(''), 1500);
  };

  const handleVolunteerApply = (payload: { project: ProjectKey; name: string; skill: string; commitment: string }) => {
    const nextId = crypto.randomUUID();
    const newVol = {
      id: nextId,
      project: payload.project,
      name: payload.name,
      skill: payload.skill,
      commitment: payload.commitment,
      created_at: new Date().toISOString()
    };
    
    supabase.from('volunteers').insert(newVol).then(({ error }) => {
      if (error) console.error('Supabase error saving volunteer:', error);
    });

    setVolunteerApplyByProject((prev) => {
      return {
        ...prev,
        [payload.project]: [
          {
            id: nextId,
            project: payload.project,
            name: payload.name,
            skill: payload.skill,
            commitment: payload.commitment,
            createdAt: newVol.created_at
          },
          ...(prev[payload.project] || [])
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
    handleSendAdminPasscode();
  };

  const openDashboard = () => {
    setViewMode('dashboard');
    if (window.location.pathname !== '/') {
      window.history.pushState({}, '', '/');
    }
  };

  const transactionModalJSX = isTxModalOpen && canEditCurrentProject ? (
    <div className="fixed inset-0 z-[90] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#F8FAFA] shadow-2xl border border-[#7C9B93]/20 w-full max-w-xl p-6 md:p-8 rounded-[24px]">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-[14px] font-black uppercase tracking-widest text-main">
            {txModalMode === 'create' ? 'Tambah Transaksi' : 'Edit Transaksi'}
          </h3>
          <button onClick={() => setIsTxModalOpen(false)} className="text-muted hover:text-main transition-colors p-1">
            <X size={20} strokeWidth={2.5} />
          </button>
        </div>
        <div className="space-y-3">
          <input type="date" value={manualDraft.date} onChange={(e) => updateManualDraftField('date', e.target.value)} className="w-full rounded-[16px] px-4 py-3 text-[12px] font-bold text-main bg-white border border-[#7C9B93]/20 outline-none focus:border-[#7C9B93]/60 focus:ring-2 focus:ring-[#7C9B93]/10 transition-all shadow-sm" />
          <div className="relative">
            <select value={manualDraft.type} onChange={(e) => updateManualDraftField('type', e.target.value as 'Masuk' | 'Keluar' | 'Tabungan')} className="appearance-none w-full rounded-[16px] px-4 pr-12 py-3 text-[12px] font-bold text-main bg-white border border-[#7C9B93]/20 outline-none focus:border-[#7C9B93]/60 focus:ring-2 focus:ring-[#7C9B93]/10 transition-all shadow-sm cursor-pointer">
              <option value="Masuk">Masuk</option>
              <option value="Keluar">Keluar</option>
              <option value="Tabungan">Tabungan</option>
            </select>
            <ChevronDown size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-[#7C9B93] pointer-events-none" />
          </div>
          <input value={manualDraft.description} onChange={(e) => updateManualDraftField('description', e.target.value)} placeholder="Uraian transaksi" className="w-full rounded-[16px] px-4 py-3 text-[12px] font-bold text-main bg-white border border-[#7C9B93]/20 outline-none focus:border-[#7C9B93]/60 focus:ring-2 focus:ring-[#7C9B93]/10 transition-all shadow-sm" />
          <input value={manualDraft.amountInput} onChange={(e) => updateManualDraftField('amountInput', e.target.value)} placeholder="Jumlah (Rp)" className="w-full rounded-[16px] px-4 py-3 text-[12px] font-bold text-main bg-white border border-[#7C9B93]/20 outline-none focus:border-[#7C9B93]/60 focus:ring-2 focus:ring-[#7C9B93]/10 transition-all shadow-sm" />
          <input value={manualDraft.category} onChange={(e) => updateManualDraftField('category', e.target.value)} placeholder="Kategori (contoh: Donasi, Operasional, Tabungan)" className="w-full rounded-[16px] px-4 py-3 text-[12px] font-bold text-main bg-white border border-[#7C9B93]/20 outline-none focus:border-[#7C9B93]/60 focus:ring-2 focus:ring-[#7C9B93]/10 transition-all shadow-sm" />
          <input value={manualDraft.note} onChange={(e) => updateManualDraftField('note', e.target.value)} placeholder="Keterangan (opsional)" className="w-full rounded-[16px] px-4 py-3 text-[12px] font-bold text-main bg-white border border-[#7C9B93]/20 outline-none focus:border-[#7C9B93]/60 focus:ring-2 focus:ring-[#7C9B93]/10 transition-all shadow-sm" />
        </div>
        {txValidationError && <p className="mt-3 text-[11px] font-black text-red-500">{txValidationError}</p>}
        <div className="mt-5 flex flex-wrap gap-2">
          <button onClick={() => saveTransactionDraft(false)} className="px-5 py-2.5 rounded-[14px] bg-[#7C9B93] text-white text-[10px] font-black uppercase tracking-widest shadow-md hover:bg-[#638079] transition-colors">Simpan</button>
          <button onClick={() => saveTransactionDraft(true)} className="px-5 py-2.5 rounded-[14px] bg-[#7C9B93]/20 text-[#7C9B93] text-[10px] font-black uppercase tracking-widest hover:bg-[#7C9B93]/30 transition-colors">Simpan & Tambah Lagi</button>
          <button onClick={() => setIsTxModalOpen(false)} className="px-5 py-2.5 rounded-[14px] bg-white border border-[#A68B8B]/20 text-[10px] font-black uppercase tracking-widest text-[#A68B8B] hover:bg-gray-50 transition-colors">Batal</button>
        </div>
      </div>
    </div>
  ) : null;

  const pdfImportModalJSX = isPdfImportOpen ? (
    <div className="fixed inset-0 z-[92] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#F8FAFA] shadow-2xl border border-[#7C9B93]/20 w-[calc(100vw-2rem)] max-w-7xl max-h-[90vh] overflow-hidden rounded-[24px] flex flex-col">
        <div className="p-6 border-b border-[#7C9B93]/10 flex items-start justify-between gap-4">
          <div>
            <h3 className="text-[14px] font-black uppercase tracking-widest text-main">Review Import PDF</h3>
            <p className="mt-2 text-[11px] font-bold text-muted leading-relaxed">
              Periksa transaksi dari {pdfSourceName || 'PDF'} sebelum disetujui masuk ke project {managedProject}.
            </p>
          </div>
          <button onClick={() => setIsPdfImportOpen(false)} className="text-muted hover:text-main transition-colors p-1">
            <X size={20} strokeWidth={2.5} />
          </button>
        </div>

        <div className="p-6 overflow-auto overscroll-contain space-y-4">
          {pdfImportRows.some((row) => row.selected && !isValidDateInput(row.date)) && (
            <div className="flex items-start gap-2 rounded-2xl bg-[#A68B8B]/10 border border-[#A68B8B]/20 px-4 py-3 text-[#A68B8B]">
              <AlertTriangle size={16} className="mt-0.5 flex-shrink-0" />
              <p className="text-[11px] font-black leading-relaxed">
                Ada {pdfImportRows.filter((row) => row.selected && !isValidDateInput(row.date)).length} transaksi terpilih tanpa tanggal valid. Isi tanggal pada kolom merah atau hilangkan centangnya sebelum approve.
              </p>
            </div>
          )}

          {pdfImportError && (
            <div className="flex items-start gap-2 rounded-2xl bg-[#A68B8B]/10 border border-[#A68B8B]/20 px-4 py-3 text-[#A68B8B]">
              <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
              <p className="text-[11px] font-black leading-relaxed">{pdfImportError}</p>
            </div>
          )}

          {pdfImportSummary && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: 'Baris Terdeteksi', value: pdfImportSummary.total_rows_detected },
                { label: 'Transaksi Valid', value: pdfImportSummary.valid_transactions },
                { label: 'Perlu Review', value: pdfImportSummary.need_review },
                { label: 'Diabaikan', value: pdfImportSummary.ignored_rows },
              ].map((item) => (
                <div key={item.label} className="rounded-2xl bg-white border border-[#7C9B93]/10 px-4 py-3">
                  <p className="text-[18px] font-black text-main">{item.value}</p>
                  <p className="mt-1 text-[9px] font-black uppercase tracking-widest text-muted">{item.label}</p>
                </div>
              ))}
            </div>
          )}

          {pdfImportWarnings.length > 0 && (
            <div className="rounded-2xl bg-[#F6E7C8]/50 border border-[#C5A45E]/25 px-4 py-3 text-[#8A6A1F]">
              <p className="text-[10px] font-black uppercase tracking-widest">Peringatan Sistem</p>
              <ul className="mt-2 space-y-1 text-[11px] font-bold leading-relaxed">
                {pdfImportWarnings.map((warning, index) => (
                  <li key={`${warning}-${index}`}>{warning}</li>
                ))}
              </ul>
            </div>
          )}

          {pdfImportRows.length > 0 && (
            <div className="max-w-full overflow-x-auto overscroll-x-contain [touch-action:pan-x] rounded-2xl border border-[#7C9B93]/10 bg-white">
              <table className="w-full min-w-[920px] text-left">
                <thead>
                  <tr className="bg-[#7C9B93]/5 text-[9px] font-black uppercase tracking-widest text-muted">
                    <th className="px-3 py-3">No</th>
                    <th className="px-3 py-3">OK</th>
                    <th className="px-3 py-3">Tanggal</th>
                    <th className="px-3 py-3">Jenis</th>
                    <th className="px-3 py-3">Uraian</th>
                    <th className="px-3 py-3 text-right">Pemasukan</th>
                    <th className="px-3 py-3 text-right">Berat KG</th>
                    <th className="px-3 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#7C9B93]/10">
                  {pdfImportRows.map((row, index) => (
                    <tr key={row.id} className={`${!row.selected ? 'opacity-50' : ''} ${row.status === 'perlu_review' ? 'bg-[#F6E7C8]/20' : ''}`}>
                      <td className="px-3 py-3 align-top text-[11px] font-black text-muted">
                        {index + 1}
                      </td>
                      <td className="px-3 py-3 align-top">
                        <input
                          type="checkbox"
                          checked={row.selected}
                          onChange={(e) => updatePdfImportRow(row.id, 'selected', e.target.checked)}
                          className="w-4 h-4 accent-[#7C9B93]"
                        />
                      </td>
                      <td className="px-3 py-3 align-top">
                        <input
                          type="date"
                          value={row.date}
                          onChange={(e) => updatePdfImportRow(row.id, 'date', e.target.value)}
                          className={`w-[130px] rounded-xl px-3 py-2 text-[11px] font-bold border outline-none ${
                            isValidDateInput(row.date) ? 'border-[#7C9B93]/15' : 'border-[#A68B8B] bg-[#A68B8B]/5'
                          }`}
                        />
                        {!isValidDateInput(row.date) && (
                          <p className="mt-1 text-[9px] font-black text-[#A68B8B] uppercase tracking-tight">Tanggal wajib diisi</p>
                        )}
                      </td>
                      <td className="px-3 py-3 align-top">
                        <div className="relative w-[140px]">
                          <select
                            value={row.type === 'Keluar' ? 'Keluar' : 'Masuk'}
                            onChange={(e) => {
                              const nextType = e.target.value as 'Masuk' | 'Keluar';
                              updatePdfImportRow(row.id, 'type', nextType);
                              updatePdfImportRow(row.id, 'category', nextType === 'Masuk' ? 'Pemasukan' : 'Pengeluaran');
                            }}
                            className={`w-full appearance-none rounded-xl px-3 py-2 pr-9 text-[11px] font-black border outline-none shadow-sm transition-colors cursor-pointer ${
                              row.type === 'Keluar'
                                ? 'bg-[#EAF2FF] border-[#6E8FBF]/25 text-[#355C91]'
                                : 'bg-[#EEF7F3] border-[#7C9B93]/25 text-[#4F756B]'
                            }`}
                          >
                            <option value="Masuk">Pemasukan</option>
                            <option value="Keluar">Pengeluaran</option>
                          </select>
                          <ChevronDown
                            size={14}
                            strokeWidth={3}
                            className={`pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 ${
                              row.type === 'Keluar' ? 'text-[#355C91]' : 'text-[#4F756B]'
                            }`}
                          />
                        </div>
                      </td>
                      <td className="px-3 py-3 align-top">
                        <input
                          value={row.description}
                          onChange={(e) => updatePdfImportRow(row.id, 'description', e.target.value)}
                          className={`w-full min-w-[300px] rounded-xl px-3 py-2 text-[11px] font-bold border outline-none ${
                            row.description.trim().length >= 3 ? 'border-[#7C9B93]/15' : 'border-[#A68B8B] bg-[#A68B8B]/5'
                          }`}
                        />
                      </td>
                      <td className="px-3 py-3 align-top text-right">
                        <input
                          value={formatRupiah(row.amount)}
                          onChange={(e) => updatePdfImportRow(row.id, 'amount', e.target.value)}
                          placeholder="Rp 0"
                          className={`w-[135px] rounded-xl px-3 py-2 text-[11px] font-bold border outline-none text-right ${
                            row.amount > 0 ? 'border-[#7C9B93]/15' : 'border-[#A68B8B] bg-[#A68B8B]/5'
                          }`}
                        />
                      </td>
                      <td className="px-3 py-3 align-top text-right">
                        <input
                          value={row.weightKg ?? ''}
                          onChange={(e) => updatePdfImportRow(row.id, 'weightKg', e.target.value)}
                          placeholder="-"
                          className="w-[90px] rounded-xl px-3 py-2 text-[11px] font-bold border border-[#7C9B93]/15 outline-none text-right"
                        />
                      </td>
                      <td className="px-3 py-3 align-top text-right">
                        <button
                          type="button"
                          onClick={() => removePdfImportRow(row.id)}
                          className="p-2 text-[#A68B8B] hover:bg-[#A68B8B]/10 rounded-lg transition-all"
                          aria-label="Hapus transaksi dari review"
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {pdfIgnoredRows.length > 0 && (
            <details className="rounded-2xl bg-white border border-[#7C9B93]/10 px-4 py-3">
              <summary className="cursor-pointer text-[10px] font-black uppercase tracking-widest text-muted">
                {pdfIgnoredRows.length} baris diabaikan
              </summary>
              <div className="mt-3 max-h-40 overflow-y-auto space-y-2">
                {pdfIgnoredRows.slice(0, 80).map((row, index) => (
                  <div key={`${row.raw_text}-${index}`} className="rounded-xl bg-[#F8FAFA] px-3 py-2">
                    <p className="text-[11px] font-bold text-main">{row.raw_text}</p>
                    <p className="mt-1 text-[10px] font-bold text-muted">{row.reason}</p>
                  </div>
                ))}
              </div>
            </details>
          )}
        </div>

        <div className="p-6 border-t border-[#7C9B93]/10 flex flex-col md:flex-row justify-between gap-3">
          <p className="text-[10px] font-bold text-muted uppercase tracking-widest">
            {pdfImportRows.filter((row) => row.selected).length} dari {pdfImportRows.length} transaksi dipilih
          </p>
          <div className="flex flex-wrap gap-2">
            <button onClick={() => setIsPdfImportOpen(false)} className="px-5 py-2.5 rounded-[14px] bg-white border border-[#A68B8B]/20 text-[10px] font-black uppercase tracking-widest text-[#A68B8B] hover:bg-gray-50 transition-colors">Batal</button>
            <button
              onClick={approvePdfImportRows}
              disabled={isPdfApproving || !pdfImportRows.some((row) => row.selected)}
              className={`px-5 py-2.5 rounded-[14px] text-[10px] font-black uppercase tracking-widest shadow-md transition-colors ${
                pdfImportRows.some((row) => row.selected && !isValidDateInput(row.date))
                  ? 'bg-[#A68B8B] text-white hover:bg-[#927575]'
                  : 'bg-[#7C9B93] text-white hover:bg-[#638079]'
              } disabled:opacity-60 disabled:cursor-not-allowed`}
            >
              {isPdfApproving ? 'Menyimpan...' : 'Approve & Input'}
            </button>
          </div>
        </div>
      </div>
    </div>
  ) : null;

  const pdfParsingOverlayJSX = isPdfParsing ? (
    <div className="fixed inset-0 z-[110] bg-black/45 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-sm rounded-[28px] bg-[#F8FAFA] border border-[#7C9B93]/20 shadow-2xl p-7 text-center">
        <div className="mx-auto h-12 w-12 rounded-full border-4 border-[#7C9B93]/20 border-t-[#7C9B93] animate-spin" />
        <h3 className="mt-5 text-[14px] font-black uppercase tracking-widest text-main">Sistem Sedang Membaca Data</h3>
        <p className="mt-2 text-[11px] font-bold leading-relaxed text-muted">
          Data laporan sedang diproses menjadi transaksi terstruktur. Jangan tutup halaman ini.
        </p>
      </div>
    </div>
  ) : null;

  const toastJSX = toast ? (
    <div className={`fixed top-6 right-6 z-[95] px-4 py-3 rounded-[16px] shadow-lg bg-white border ${toast.type === 'error' ? 'border-[#A68B8B]/30' : 'border-[#7C9B93]/20'} text-[11px] font-black uppercase tracking-widest ${toast.type === 'error' ? 'text-[#A68B8B]' : 'text-[#7C9B93]'}`}>
      {toast.message}
    </div>
  ) : null;

  if (viewMode === 'admin' && !adminSession) {
    return (
      <div className="min-h-screen p-4 flex items-center justify-center bg-[#F8FAFA]">
        <div className="w-full max-w-md fade-in-section">
          <div className="clay-card p-10 space-y-8 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1.5 bg-[#7C9B93]/30" />
            
            <div className="text-center space-y-2">
              <div className="inline-flex p-4 rounded-3xl clay-inset mb-4">
                <Lock size={32} className="text-[#7C9B93]" />
              </div>
              <h1 className="text-[20px] font-black uppercase tracking-[0.2em] text-main">Admin Access</h1>
              <p className="text-[11px] font-bold uppercase tracking-widest text-muted">Akses Khusus Pengelola Project</p>
            </div>

            <form className="space-y-4" onSubmit={handleAdminLogin}>
              <input
                type="email"
                value={adminUsername}
                onChange={(e) => {
                  setAdminUsername(e.target.value);
                  setIsPasscodeSent(false);
                  setAdminPasscode('');
                  clearPendingAdminOtp();
                }}
                placeholder="Email admin"
                autoComplete="email"
                className="w-full rounded-2xl px-4 py-4 text-[13px] font-bold text-main bg-white border border-[#7C9B93]/20 outline-none focus:border-[#7C9B93]/60 focus:ring-2 focus:ring-[#7C9B93]/10 transition-all shadow-sm"
              />
              <button
                type="submit"
                disabled={isAdminSubmitting}
                className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl bg-[#7C9B93] text-white text-[12px] font-black uppercase tracking-[0.1em] shadow-md hover:bg-[#638079] active:scale-[0.98] transition-all disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <KeyRound size={18} />
                {isAdminSubmitting ? 'Mengirim...' : 'Kirim Kode Login'}
              </button>
            </form>

            {adminLoginError && (
              <div className="flex items-start gap-2 rounded-2xl bg-[#A68B8B]/10 border border-[#A68B8B]/20 px-4 py-3 text-[#A68B8B]">
                <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
                <p className="text-[11px] font-black leading-relaxed">{adminLoginError}</p>
              </div>
            )}

            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-px flex-1 bg-[#7C9B93]/15" />
                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-muted">atau</span>
                <div className="h-px flex-1 bg-[#7C9B93]/15" />
              </div>

              <button 
                onClick={handleGoogleLogin} 
                disabled={isAdminSubmitting}
                className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl bg-white border border-[#7C9B93]/20 text-main text-[12px] font-black uppercase tracking-[0.1em] shadow-md hover:bg-gray-50 active:scale-[0.98] transition-all"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Masuk dengan Gmail
              </button>
              
              <button 
                type="button" 
                onClick={openDashboard} 
                className="w-full py-4 rounded-2xl text-muted text-[11px] font-black uppercase tracking-widest hover:text-main transition-colors"
              >
                Kembali ke Dashboard
              </button>
            </div>
          </div>
          <p className="text-center mt-8 text-[10px] font-black uppercase tracking-[0.2em] text-muted">Project Ummahat &copy; 2026</p>
        </div>
        {isPasscodeSent && (
          <div className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="w-full max-w-sm rounded-[28px] bg-[#F8FAFA] border border-[#7C9B93]/20 shadow-2xl p-6 space-y-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-[15px] font-black uppercase tracking-[0.16em] text-main">Kode Login</h2>
                  <p className="mt-2 text-[11px] font-bold leading-relaxed text-muted">
                    Masukkan {ADMIN_OTP_LENGTH} angka yang dikirim ke {getAdminEmailInput()}.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setIsPasscodeSent(false);
                    setAdminPasscode('');
                    setAdminLoginError('');
                    clearPendingAdminOtp();
                  }}
                  className="p-2 rounded-xl text-muted hover:bg-[#7C9B93]/10 hover:text-main transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              <input
                autoFocus
                value={adminPasscode}
                onChange={(e) => {
                  setAdminPasscode(normalizeAdminPasscode(e.target.value));
                  setAdminLoginError('');
                }}
                placeholder="000000"
                inputMode="numeric"
                maxLength={ADMIN_OTP_LENGTH}
                autoComplete="one-time-code"
                className="w-full rounded-2xl px-4 py-4 text-center text-[24px] font-black tracking-[0.55em] text-main bg-white border border-[#7C9B93]/20 outline-none focus:border-[#7C9B93]/60 focus:ring-2 focus:ring-[#7C9B93]/10 transition-all shadow-sm"
              />

              {adminLoginError && (
                <div className="flex items-start gap-2 rounded-2xl bg-[#A68B8B]/10 border border-[#A68B8B]/20 px-4 py-3 text-[#A68B8B]">
                  <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
                  <p className="text-[11px] font-black leading-relaxed">{adminLoginError}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={handleSendAdminPasscode}
                  disabled={isAdminSubmitting}
                  className="py-3.5 rounded-2xl bg-white border border-[#7C9B93]/20 text-[#7C9B93] text-[10px] font-black uppercase tracking-widest hover:bg-[#7C9B93]/10 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  Kirim Ulang
                </button>
                <button
                  type="button"
                  onClick={handleVerifyAdminPasscode}
                  disabled={isAdminSubmitting}
                  className="py-3.5 rounded-2xl bg-[#7C9B93] text-white text-[10px] font-black uppercase tracking-widest shadow-md hover:bg-[#638079] transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isAdminSubmitting ? 'Cek...' : 'Verifikasi'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (viewMode === 'admin' && adminSession) {
    const volunteerList = volunteerApplyByProject[managedProject] || [];

    return (
      <div className="min-h-screen bg-[#F8FAFA] pb-32">
        {/* Admin Top Header */}
        <div className="bg-white border-b border-[#7C9B93]/10 sticky top-0 z-[60]">
          <div className="max-w-6xl mx-auto px-4 md:px-8 py-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-2xl bg-[#7C9B93]/10 flex items-center justify-center text-[#7C9B93]">
                <ShieldCheck size={24} />
              </div>
              <div>
                <h2 className="text-[14px] font-black uppercase tracking-widest text-main">Console Admin</h2>
                <p className="text-[10px] font-bold text-muted uppercase tracking-tight">{managedProject} | {adminSession.username}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={openDashboard} className="p-2.5 rounded-xl clay-button text-[#7C9B93] hidden md:flex items-center gap-2">
                <Home size={18} /> <span className="text-[10px] font-black uppercase tracking-widest">Live View</span>
              </button>
              <button onClick={handleLogout} className="p-2.5 rounded-xl clay-button text-[#A68B8B] flex items-center gap-2">
                <LogOut size={18} /> <span className="text-[10px] font-black uppercase tracking-widest hidden md:inline">Logout</span>
              </button>
            </div>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-4 md:px-8 py-6 space-y-6">
          {/* Admin Project Switcher (Only for SuperAdmin) */}
          {adminSession.project === 'all' && (
            <div className="clay-card p-4 flex items-center justify-between gap-4">
               <div className="flex items-center gap-3">
                 <span className="text-[10px] font-black uppercase tracking-widest text-muted">Switch Project:</span>
                 <div className="flex flex-wrap gap-2">
                    <button 
                      onClick={() => { setAdminTargetProject('Semua'); setActiveProject('Semua'); }}
                      className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${managedProject === 'Semua' ? 'bg-[#7C9B93] text-white' : 'bg-[#7C9B93]/5 text-[#7C9B93] hover:bg-[#7C9B93]/10'}`}
                    >
                      SEMUA
                    </button>
                    {PROJECT_KEYS.map(k => (
                      <button 
                        key={k} 
                        onClick={() => { setAdminTargetProject(k); setActiveProject(k); }}
                        className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${managedProject === k ? 'bg-[#7C9B93] text-white' : 'bg-[#7C9B93]/5 text-[#7C9B93] hover:bg-[#7C9B93]/10'}`}
                      >
                        {k}
                      </button>
                    ))}
                 </div>
               </div>
            </div>
          )}

          {/* Navigation Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-2">
            {[
              { id: 'profil', icon: Layout },
              { id: 'keuangan', icon: Wallet },
              ...(managedProject === 'Semua' ? [] : [{ id: 'kontribusi', icon: Heart }]),
              ...(adminSession.project === 'all' ? [{ id: 'admin_management', icon: ShieldCheck }] : []),
              { id: 'setting', icon: Settings }
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = adminTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setAdminTab(tab.id as any)}
                  className={`flex items-center gap-2 px-6 py-3.5 rounded-[20px] text-[11px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                    isActive ? 'bg-[#7C9B93] text-white shadow-[0_8px_15px_rgba(124,155,147,0.25)]' : 'bg-white text-muted border border-[#7C9B93]/10 hover:border-[#7C9B93]/30'
                  }`}
                >
                  <Icon size={16} />
                  {tab.id.replace('_', ' ')}
                </button>
              );
            })}
          </div>

          {/* Content Area */}
          <div className="fade-in-section">
            {managedProject === 'Semua' && adminTab === 'profil' && (
              <div className="space-y-8 max-w-4xl mx-auto">
                <div className="clay-card p-10 md:p-14 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                  <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
                    <div className="w-16 h-16 rounded-3xl clay-inset flex items-center justify-center text-[#7C9B93] flex-shrink-0">
                      <Shield size={32} />
                    </div>
                    <div className="space-y-4 text-center md:text-left flex-1">
                      <div className="flex items-center justify-between border-b-4 border-[#7C9B93]/20 pb-2 mb-4">
                        <h3 className="text-[18px] md:text-[22px] font-black uppercase tracking-[0.2em] text-main">
                          Transparansi & Amanah
                        </h3>
                        <span className="text-[10px] font-black text-[#7C9B93] uppercase bg-[#7C9B93]/10 px-3 py-1 rounded-full">Superadmin Edit Mode</span>
                      </div>
                      
                      <div className="space-y-6">
                        <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-widest text-muted ml-1">Deskripsi Narasi</label>
                          <textarea 
                            value={editableProfiles['Semua'].vision}
                            onChange={(e) => setEditableProfiles(prev => ({ ...prev, Semua: { ...prev.Semua, vision: e.target.value } }))}
                            rows={4}
                            className="w-full rounded-2xl px-4 py-4 text-[14px] font-semibold text-main border border-[#7C9B93]/15 bg-white/50 focus:bg-white outline-none focus:border-[#7C9B93]/40 transition-all"
                            placeholder="Ketik narasi transparansi di sini..."
                          />
                        </div>

                        <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-widest text-muted ml-1">Kutipan / Quote</label>
                          <textarea 
                            value={editableProfiles['Semua'].missions[0] || ''}
                            onChange={(e) => setEditableProfiles(prev => ({ ...prev, Semua: { ...prev.Semua, missions: [e.target.value] } }))}
                            rows={3}
                            className="w-full rounded-2xl px-4 py-4 text-[13px] md:text-[14px] font-black italic text-main border border-[#7C9B93]/15 bg-white/50 focus:bg-white outline-none focus:border-[#7C9B93]/40 transition-all"
                            placeholder="Ketik kutipan di sini..."
                          />
                        </div>

                        <button 
                          onClick={() => {
                            updateProjectProfile('Semua', (p) => ({
                              ...p,
                              vision: editableProfiles.Semua.vision.trim() || p.vision,
                              missions: editableProfiles.Semua.missions.map((mission) => mission.trim()).filter(Boolean)
                            }));
                            logAdminActivity('global_profile_updated', 'Mengubah narasi global Semua Project.', {
                              fields: ['vision', 'quote']
                            }, 'Semua');
                            showToast('Narasi global berhasil disimpan.');
                          }}
                          className="px-8 py-4 rounded-2xl bg-[#7C9B93] text-white text-[11px] font-black uppercase tracking-widest shadow-lg active:scale-95 transition-all"
                        >
                          Simpan Narasi Global
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="text-center">
                  <p className="text-[11px] font-black uppercase tracking-widest text-muted bg-[#7C9B93]/5 inline-block px-6 py-3 rounded-full border border-[#7C9B93]/10">
                    Perubahan ini akan langsung muncul di halaman depan dashboard publik
                  </p>
                </div>
              </div>
            )}

            {adminTab === 'admin_management' && adminSession.project === 'all' && (
              <div className="space-y-6">
                <div className="clay-card p-8 space-y-8">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-[#7C9B93]/10 text-[#7C9B93]"><ShieldCheck size={20} /></div>
                    <h3 className="text-[14px] font-black uppercase tracking-widest text-main">Daftar Admin Terdaftar</h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4 border border-[#7C9B93]/10 p-6 rounded-3xl bg-[#7C9B93]/5">
                      <p className="text-[10px] font-black uppercase tracking-widest text-muted">Tambah Admin Baru</p>
                      <div className="space-y-3">
                        <input 
                          value={newAdminEmail}
                          onChange={(e) => setNewAdminEmail(e.target.value)}
                          placeholder="Email Gmail Admin..."
                          className="w-full rounded-2xl px-4 py-4 text-[13px] font-semibold text-main border border-[#7C9B93]/15 bg-white outline-none focus:border-[#7C9B93]/40"
                        />
                        <select 
                          value={newAdminProject}
                          onChange={(e) => setNewAdminProject(e.target.value as any)}
                          className="w-full rounded-2xl px-4 py-4 text-[13px] font-semibold text-main border border-[#7C9B93]/15 bg-white outline-none focus:border-[#7C9B93]/40"
                        >
                          <option value="all">Superadmin (Semua)</option>
                          {PROJECT_KEYS.map(k => <option key={k} value={k}>{k}</option>)}
                        </select>
                        <button 
                          onClick={addAdminRole}
                          className="w-full py-4 rounded-2xl bg-[#7C9B93] text-white text-[11px] font-black uppercase tracking-widest shadow-lg active:scale-95 transition-all"
                        >
                          Daftarkan Admin
                        </button>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <p className="text-[10px] font-black uppercase tracking-widest text-muted">Daftar Akses</p>
                      <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
                        {adminRoles.map((role) => (
                          <div key={role.email} className="flex items-center justify-between p-4 rounded-2xl border border-[#7C9B93]/10 bg-white hover:bg-gray-50 transition-colors">
                            <div>
                              <p className="text-[12px] font-black text-main">{role.email}</p>
                              <p className="text-[9px] font-black uppercase tracking-widest text-[#7C9B93] mt-0.5">{role.project}</p>
                            </div>
                            <button 
                              onClick={() => deleteAdminRole(role.email)}
                              className="p-2.5 text-[#A68B8B] hover:bg-red-50 rounded-xl transition-all"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="clay-card p-8 space-y-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-xl bg-[#7C9B93]/10 text-[#7C9B93]"><History size={20} /></div>
                      <div>
                        <h3 className="text-[14px] font-black uppercase tracking-widest text-main">Log Aktivitas Admin</h3>
                        <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-muted">Login terakhir dan perubahan yang dilakukan admin</p>
                      </div>
                    </div>
                    <button
                      onClick={fetchAdminActivityLogs}
                      className="px-4 py-2.5 rounded-xl bg-white border border-[#7C9B93]/15 text-[10px] font-black uppercase tracking-widest text-[#7C9B93] hover:bg-[#7C9B93]/5 transition-colors"
                    >
                      Refresh Log
                    </button>
                  </div>

                  <div className="space-y-2 max-h-[520px] overflow-y-auto pr-2">
                    {adminActivityLogs.length === 0 ? (
                      <div className="rounded-2xl bg-white border border-[#7C9B93]/10 p-5 text-[11px] font-bold text-muted">
                        Belum ada log aktivitas.
                      </div>
                    ) : adminActivityLogs.map((log) => (
                      <div key={log.id} className="rounded-2xl bg-white border border-[#7C9B93]/10 p-4 flex flex-col md:flex-row md:items-start justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-[11px] font-black uppercase tracking-widest text-main">{log.action.replaceAll('_', ' ')}</span>
                            <span className="rounded-full bg-[#7C9B93]/10 px-2 py-1 text-[9px] font-black uppercase tracking-widest text-[#7C9B93]">{log.project}</span>
                          </div>
                          <p className="text-[12px] font-bold text-main leading-relaxed">{log.description}</p>
                          <p className="text-[10px] font-bold text-muted">{log.actor_email}</p>
                        </div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted whitespace-nowrap">
                          {new Date(log.created_at).toLocaleString('id-ID', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {adminTab === 'profil' && managedProject !== 'Semua' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-8 space-y-6">
                  <div className="clay-card p-6 md:p-8 space-y-6">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 rounded-xl bg-[#7C9B93]/10 text-[#7C9B93]"><Info size={18} /></div>
                      <h3 className="text-[13px] font-black uppercase tracking-widest text-main">Identitas & Narasi</h3>
                    </div>
                    <div className="space-y-6">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-3xl border border-[#7C9B93]/10 bg-[#7C9B93]/5">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-xl bg-white text-[#7C9B93] shadow-sm">
                            <HandHeart size={18} />
                          </div>
                          <div>
                            <p className="text-[11px] font-black uppercase tracking-widest text-main">Card Join Project</p>
                            <p className="text-[10px] font-bold text-muted uppercase tracking-wider mt-0.5">
                              {profileDraft.joinEnabled ? 'Aktif di halaman project' : 'Nonaktif di halaman project'}
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          role="switch"
                          aria-checked={profileDraft.joinEnabled}
                          onClick={() => setProfileDraft((d) => ({ ...d, joinEnabled: !d.joinEnabled }))}
                          className={`relative w-20 h-10 rounded-full p-1 transition-all ${
                            profileDraft.joinEnabled ? 'bg-[#7C9B93]' : 'bg-[#D6DEDF]'
                          }`}
                        >
                          <span
                            className={`absolute top-1 h-8 w-8 rounded-full bg-white shadow-md transition-all ${
                              profileDraft.joinEnabled ? 'left-11' : 'left-1'
                            }`}
                          />
                          <span className={`absolute inset-y-0 flex items-center text-[8px] font-black uppercase tracking-widest text-white ${profileDraft.joinEnabled ? 'left-3' : 'right-3 text-muted'}`}>
                            {profileDraft.joinEnabled ? 'On' : 'Off'}
                          </span>
                        </button>
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-muted ml-1">Visi Project</label>
                        <textarea value={profileDraft.vision} onChange={(e) => setProfileDraft((d) => ({ ...d, vision: e.target.value }))} rows={3} className="w-full rounded-2xl px-4 py-4 text-[13px] font-semibold text-main border border-[#7C9B93]/15 bg-white outline-none focus:border-[#7C9B93]/40" placeholder="Apa visi besar project ini?" />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                        <div className="space-y-3 border border-[#7C9B93]/10 p-4 rounded-3xl bg-[#7C9B93]/5">
                          <div className="flex items-center justify-between mb-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-muted ml-1">Misi Project</label>
                            <button onClick={() => setProfileDraft(d => ({ ...d, missions: [...d.missions, ''] }))} className="px-3 py-1.5 rounded-xl bg-white text-[#7C9B93] text-[9px] font-black uppercase tracking-widest hover:bg-[#7C9B93]/10 flex items-center gap-1 shadow-sm"><Plus size={12}/> Tambah</button>
                          </div>
                          <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                            {profileDraft.missions.map((m, idx) => (
                              <div key={`misi-${idx}`} className="flex gap-2">
                                <input value={m} onChange={(e) => setProfileDraft(d => ({ ...d, missions: d.missions.map((x, i) => i === idx ? e.target.value : x) }))} className="flex-1 rounded-xl px-3 py-2.5 text-[12px] font-semibold text-main border border-[#7C9B93]/15 bg-white outline-none focus:border-[#7C9B93]/40" placeholder={`Misi ${idx + 1}`} />
                                <button onClick={() => setProfileDraft(d => ({ ...d, missions: d.missions.filter((_, i) => i !== idx) }))} className="p-2.5 text-[#A68B8B] hover:bg-white rounded-xl transition-colors"><Trash2 size={14}/></button>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="space-y-3 border border-[#7C9B93]/10 p-4 rounded-3xl bg-[#7C9B93]/5">
                          <div className="flex items-center justify-between mb-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-muted ml-1">Agenda Rutin</label>
                            <button onClick={() => setProfileDraft(d => ({ ...d, agenda: [...d.agenda, ''] }))} className="px-3 py-1.5 rounded-xl bg-white text-[#7C9B93] text-[9px] font-black uppercase tracking-widest hover:bg-[#7C9B93]/10 flex items-center gap-1 shadow-sm"><Plus size={12}/> Tambah</button>
                          </div>
                          <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                            {profileDraft.agenda.map((a, idx) => (
                              <div key={`agenda-${idx}`} className="flex gap-2">
                                <input value={a} onChange={(e) => setProfileDraft(d => ({ ...d, agenda: d.agenda.map((x, i) => i === idx ? e.target.value : x) }))} className="flex-1 rounded-xl px-3 py-2.5 text-[12px] font-semibold text-main border border-[#7C9B93]/15 bg-white outline-none focus:border-[#7C9B93]/40" placeholder={`Agenda ${idx + 1}`} />
                                <button onClick={() => setProfileDraft(d => ({ ...d, agenda: d.agenda.filter((_, i) => i !== idx) }))} className="p-2.5 text-[#A68B8B] hover:bg-white rounded-xl transition-colors"><Trash2 size={14}/></button>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="space-y-3 border border-[#7C9B93]/10 p-5 rounded-3xl bg-[#7C9B93]/5 pt-4">
                        <div className="flex items-center justify-between mb-2">
                          <label className="text-[10px] font-black uppercase tracking-widest text-muted ml-1">Struktur Tim Project</label>
                          <button 
                            type="button" 
                            disabled={profileDraft.team.some(t => !t.name?.trim() || !t.role?.trim())}
                            onClick={(e) => { 
                              e.preventDefault(); 
                              if (profileDraft.team.some(t => !t.name?.trim() || !t.role?.trim())) return;
                              setProfileDraft(d => ({ ...d, team: [...d.team, { name: '', role: '' }] })); 
                            }} 
                            className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center gap-1 shadow-sm transition-colors ${
                              profileDraft.team.some(t => !t.name?.trim() || !t.role?.trim())
                                ? 'bg-gray-100 text-[#A68B8B]/60 cursor-not-allowed border border-transparent'
                                : 'bg-white text-[#7C9B93] hover:bg-[#7C9B93]/10 border border-transparent'
                            }`}
                          >
                            <Plus size={12}/> Tambah Anggota
                          </button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {profileDraft.team.map((t, idx) => (
                            <div key={`team-${idx}`} className="flex flex-col gap-3 p-4 rounded-2xl bg-white border border-[#7C9B93]/20 shadow-md relative group animate-in fade-in zoom-in duration-300">
                              <button type="button" onClick={(e) => { e.preventDefault(); setProfileDraft(d => ({ ...d, team: d.team.filter((_, i) => i !== idx) })); }} className="absolute -top-2 -right-2 p-1.5 bg-red-100 text-red-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-200 z-10 shadow-sm"><X size={14}/></button>
                              <div className="space-y-1.5">
                                <label className="text-[9px] font-black uppercase tracking-widest text-muted ml-1">Nama Relawan</label>
                                <input value={t.name || ''} onChange={(e) => setProfileDraft(d => ({ ...d, team: d.team.map((x, i) => i === idx ? { ...x, name: e.target.value } : x) }))} className="w-full rounded-xl px-3 py-2.5 text-[13px] font-bold text-main border border-[#7C9B93]/10 bg-[#F8FAFA] focus:bg-white focus:border-[#7C9B93]/40 focus:ring-2 focus:ring-[#7C9B93]/10 outline-none transition-all shadow-inner" placeholder="Ketik nama..." />
                              </div>
                              <div className="space-y-1.5">
                                <label className="text-[9px] font-black uppercase tracking-widest text-muted ml-1">Posisi / Peran</label>
                                <input value={t.role || ''} onChange={(e) => setProfileDraft(d => ({ ...d, team: d.team.map((x, i) => i === idx ? { ...x, role: e.target.value } : x) }))} className="w-full rounded-xl px-3 py-2.5 text-[13px] font-bold text-[#7C9B93] border border-[#7C9B93]/10 bg-[#F8FAFA] focus:bg-white focus:border-[#7C9B93]/40 focus:ring-2 focus:ring-[#7C9B93]/10 outline-none uppercase transition-all shadow-inner" placeholder="Contoh: KETUA" />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                    <button onClick={saveAdminProfileDraft} className="w-full md:w-auto px-8 py-4 rounded-2xl bg-[#7C9B93] text-white text-[11px] font-black uppercase tracking-widest shadow-lg active:scale-95 transition-all">
                      Simpan Perubahan Profil
                    </button>
                  </div>
                </div>
                
                <div className="lg:col-span-4">
                  <div className="clay-card p-6 md:p-8 h-full">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="p-2 rounded-xl bg-[#A68B8B]/10 text-[#A68B8B]"><Users size={18} /></div>
                      <h3 className="text-[13px] font-black uppercase tracking-widest text-main">Relawan Pendaftar</h3>
                    </div>
                    <div className="space-y-3">
                      {volunteerList.length === 0 ? (
                        <div className="p-8 text-center border-2 border-dashed border-[#7C9B93]/10 rounded-2xl">
                          <p className="text-[11px] font-bold text-muted uppercase">Belum ada pendaftar</p>
                        </div>
                      ) : (
                        volunteerList.map((v) => (
                          <div key={v.id} className="p-4 rounded-2xl border border-[#7C9B93]/10 bg-[#7C9B93]/5 hover:bg-white transition-colors">
                            <p className="text-[12px] font-black text-main uppercase">{v.name}</p>
                            <p className="text-[10px] font-bold text-[#7C9B93] uppercase tracking-tighter mt-0.5">{v.commitment}</p>
                            <div className="mt-2 pt-2 border-t border-[#7C9B93]/10">
                              <p className="text-[10px] text-muted leading-relaxed italic">"{v.skill}"</p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {adminTab === 'keuangan' && (
              // Aggregated View Logic
              <div className="space-y-6">
                {managedProject === 'Semua' ? (
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                    <div className="clay-card p-5 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="p-2 rounded-xl clay-inset text-[#7C9B93]"><Wallet size={18} /></div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-muted">Total Saldo</span>
                      </div>
                      <p className="text-[18px] md:text-[22px] font-black text-main">{formatRupiah(aggregatedData.summary.balance)}</p>
                    </div>
                    <div className="clay-card p-5 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="p-2 rounded-xl clay-inset text-[#638079]"><History size={18} /></div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-muted">Transaksi</span>
                      </div>
                      <p className="text-[18px] md:text-[22px] font-black text-main">{aggregatedData.transactions.length}</p>
                    </div>
                    <div className="clay-card p-5 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="p-2 rounded-xl clay-inset text-[#7C9B93]"><TrendingUp size={18} /></div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-muted">Total Masuk</span>
                      </div>
                      <p className="text-[18px] md:text-[22px] font-black text-[#7C9B93]">{formatRupiah(aggregatedData.summary.income)}</p>
                    </div>
                    <div className="clay-card p-5 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="p-2 rounded-xl clay-inset text-[#A68B8B]"><TrendingDown size={18} /></div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-muted">Total Keluar</span>
                      </div>
                      <p className="text-[18px] md:text-[22px] font-black text-[#A68B8B]">{formatRupiah(aggregatedData.summary.expense)}</p>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                    {[
                      { label: 'Pemasukan', val: formatRupiah(manualIncomeTotal), color: '#7C9B93', icon: TrendingUp },
                      { label: 'Pengeluaran', val: formatRupiah(manualExpenseTotal), color: '#A68B8B', icon: TrendingDown },
                      { label: 'Tabungan', val: formatRupiah(manualSavingsTotal), color: '#718096', icon: Heart },
                      { label: 'Disalurkan', val: formatRupiah(manualDistributedTotal), color: '#A68B8B', icon: Heart },
                      { label: 'Total Transaksi', val: `${sortedManualRows.length} item`, color: '#638079', icon: History },
                      { label: 'Saldo Akhir', val: formatRupiah(Math.max(0, manualBalance)), color: '#334155', icon: Wallet, highlight: true }
                    ].map((stat, i) => (
                      <div key={i} className={`clay-card p-5 space-y-3 ${stat.highlight ? 'bg-[#7C9B93]/5 border-[#7C9B93]/20' : ''}`}>
                        <div className="flex items-center justify-between">
                          <div className="p-2 rounded-xl clay-inset" style={{ color: stat.color }}><stat.icon size={16} /></div>
                          <span className="text-[9px] font-black uppercase tracking-widest text-muted">{stat.label}</span>
                        </div>
                        <p className="text-[15px] md:text-[18px] font-black tracking-tight" style={{ color: stat.color }}>{stat.val}</p>
                      </div>
                    ))}
                  </div>
                )}

                {managedProject === 'Semua' && (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="clay-card p-8">
                      <h3 className="text-[12px] font-black uppercase tracking-widest text-main flex items-center gap-3 mb-8">
                        <BarChart3 size={18} className="text-[#7C9B93]" />
                        Saldo Tersisa per Project
                      </h3>
                      <div className="h-[250px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={aggregatedData.projectBalanceContributions} layout="vertical">
                            <XAxis type="number" hide />
                            <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 800, fill: 'var(--text-main)' }} width={80} />
                            <Tooltip content={<CustomTooltip isDark={isDark} />} cursor={{ fill: 'transparent' }} />
                            <Bar dataKey="value" radius={[0, 10, 10, 0]} barSize={25}>
                              {aggregatedData.projectBalanceContributions.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    <div className="clay-card p-8">
                      <h3 className="text-[12px] font-black uppercase tracking-widest text-main flex items-center gap-3 mb-8">
                        <PieIcon size={18} className="text-[#7C9B93]" />
                        Alokasi Dana Semua Project
                      </h3>
                      <div className="h-[250px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <RePieChart>
                            <Pie
                              data={pieDisplayData}
                              cx="50%"
                              cy="50%"
                              innerRadius="55%"
                              outerRadius="80%"
                              dataKey="value"
                              paddingAngle={5}
                              cornerRadius={10}
                              stroke="none"
                            >
                              {pieDisplayData.map((e: any, i: number) => (
                                <Cell key={i} fill={normalizeChartColor(e.renderColor || e.color)} />
                              ))}
                            </Pie>
                            <Tooltip content={<CustomTooltip isDark={isDark} />} />
                          </RePieChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>
                )}

                <div className="clay-card p-6 md:p-8">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-xl bg-[#7C9B93]/10 text-[#7C9B93]"><History size={18} /></div>
                      <h3 className="text-[13px] font-black uppercase tracking-widest text-main">
                        {managedProject === 'Semua' ? 'Log Transaksi Semua Project' : 'Log Transaksi'}
                      </h3>
                    </div>
                    <div className="flex flex-wrap gap-2 w-full md:w-auto">
                      <button onClick={exportExcelTransactions} className="flex-1 md:flex-none px-4 py-2.5 rounded-xl border border-[#7C9B93]/20 text-[10px] font-black uppercase tracking-widest text-[#7C9B93] flex items-center justify-center gap-2 hover:bg-[#7C9B93]/5">
                        <FileSpreadsheet size={14} /> Export
                      </button>
                      {managedProject !== 'Semua' && (
                        <>
                          <input
                            ref={pdfFileInputRef}
                            type="file"
                            accept="application/pdf,.pdf"
                            onChange={handlePdfImportFile}
                            className="hidden"
                          />
                          <button
                            onClick={() => pdfFileInputRef.current?.click()}
                            disabled={isPdfParsing}
                            className="flex-1 md:flex-none px-4 py-2.5 rounded-xl border border-[#7C9B93]/20 text-[10px] font-black uppercase tracking-widest text-[#7C9B93] flex items-center justify-center gap-2 hover:bg-[#7C9B93]/5 disabled:opacity-60 disabled:cursor-not-allowed"
                          >
                            <FileText size={14} /> {isPdfParsing ? 'Membaca...' : 'Import PDF'}
                          </button>
                          <button onClick={openCreateTransactionModal} className="flex-1 md:flex-none px-4 py-2.5 rounded-xl bg-[#7C9B93] text-white text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 shadow-md">
                            <Plus size={14} /> Transaksi Baru
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="hidden md:block overflow-x-auto rounded-2xl border border-[#7C9B93]/10">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="bg-[#7C9B93]/5 text-[10px] font-black uppercase tracking-widest text-muted">
                          <th className="px-6 py-4">Tgl</th>
                          <th className="px-6 py-4">Uraian</th>
                          <th className="px-6 py-4">Jenis</th>
                          <th className="px-6 py-4">{managedProject === 'Semua' ? 'Project' : 'Kategori'}</th>
                          <th className="px-6 py-4 text-right">Jumlah</th>
                          {managedProject !== 'Semua' && <th className="px-6 py-4 text-center">Aksi</th>}
                        </tr>
                      </thead>
                      <tbody className="text-[12px] font-semibold text-main divide-y divide-[#7C9B93]/10">
                        {pagedRows.map((row) => (
                          <tr key={row.id} className="hover:bg-[#7C9B93]/2 transition-colors">
                            <td className="px-6 py-4 whitespace-nowrap">{row.date}</td>
                            <td className="px-6 py-4 font-bold">{row.description}</td>
                            <td className="px-6 py-4">
                              <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase ${
                                row.type === 'Masuk' ? 'bg-[#7C9B93]/10 text-[#7C9B93]' : 'bg-[#A68B8B]/10 text-[#A68B8B]'
                              }`}>{row.type}</span>
                            </td>
                            <td className="px-6 py-4 text-muted">
                              {managedProject === 'Semua' ? (
                                <span className="font-black text-[#7C9B93]">{row.projectSource}</span>
                              ) : (
                                row.category || '-'
                              )}
                            </td>
                            <td className={`px-6 py-4 text-right font-black ${row.type === 'Masuk' ? 'text-[#7C9B93]' : 'text-[#A68B8B]'}`}>
                              {row.type === 'Masuk' ? '+' : '-'} {formatRupiah(row.amount)}
                            </td>
                            {managedProject !== 'Semua' && (
                              <td className="px-6 py-4 text-center">
                                <div className="flex items-center justify-center gap-2">
                                  <button onClick={() => openEditTransactionModal(row)} className="p-2 text-[#7C9B93] hover:bg-[#7C9B93]/10 rounded-lg transition-all"><Pencil size={14} /></button>
                                  <button onClick={() => deleteManualTransaction(row.id)} className="p-2 text-[#A68B8B] hover:bg-[#A68B8B]/10 rounded-lg transition-all"><Trash2 size={14} /></button>
                                </div>
                              </td>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="md:hidden space-y-3">
                    {pagedRows.map((row) => (
                      <div key={row.id} className="p-4 rounded-2xl border border-[#7C9B93]/15 bg-white space-y-3 shadow-sm">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="text-[10px] font-black text-muted uppercase">{row.date} | {row.category || 'No Category'}</p>
                            <p className="text-[13px] font-black text-main uppercase mt-1 leading-tight">{row.description}</p>
                          </div>
                          <span className={`px-2 py-0.5 rounded-lg text-[8px] font-black uppercase ${
                            row.type === 'Masuk' ? 'bg-[#7C9B93]/10 text-[#7C9B93]' : 'bg-[#A68B8B]/10 text-[#A68B8B]'
                          }`}>{row.type}</span>
                        </div>
                        <div className="flex justify-between items-center pt-2 border-t border-[#7C9B93]/5">
                          <p className={`text-[14px] font-black ${row.type === 'Masuk' ? 'text-[#7C9B93]' : 'text-[#A68B8B]'}`}>
                            {row.type === 'Masuk' ? '+' : '-'} {formatRupiah(row.amount)}
                          </p>
                          {managedProject === 'Semua' ? (
                            <span className="text-[10px] font-black text-[#7C9B93] uppercase">{row.projectSource}</span>
                          ) : (
                            <div className="flex gap-2">
                              <button onClick={() => openEditTransactionModal(row)} className="p-2.5 rounded-xl clay-button text-[#7C9B93]"><Pencil size={14} /></button>
                              <button onClick={() => deleteManualTransaction(row.id)} className="p-2.5 rounded-xl clay-button text-[#A68B8B]"><Trash2 size={14} /></button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center justify-between mt-6 pt-6 border-t border-[#7C9B93]/10">
                    <span className="text-[10px] font-black uppercase tracking-widest text-muted">Page {txPage} of {totalPages}</span>
                    <div className="flex gap-2">
                      <button onClick={() => setTxPage((p) => Math.max(1, p - 1))} className="p-2.5 rounded-xl clay-button text-muted" disabled={txPage === 1}><ChevronLeft size={16} /></button>
                      <button onClick={() => setTxPage((p) => Math.min(totalPages, p + 1))} className="p-2.5 rounded-xl clay-button text-muted" disabled={txPage === totalPages}><ChevronRight size={16} /></button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {adminTab === 'kontribusi' && managedProject !== 'Semua' && (
              <div className="max-w-4xl mx-auto clay-card p-6 md:p-8 space-y-8">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-[#7C9B93]/10 text-[#7C9B93]"><Heart size={18} /></div>
                    <h3 className="text-[13px] font-black uppercase tracking-widest text-main">Capaian & Kontribusi</h3>
                  </div>
                  <button onClick={() => setContributionDraft((prev) => [...prev, { title: '', value: '', description: '', illustration: 'reduction' }])} className="px-4 py-2 rounded-xl bg-[#7C9B93]/10 text-[#7C9B93] text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                    <Plus size={14} /> Tambah Item
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {contributionDraft.map((c, idx) => (
                    <div key={idx} className="p-5 rounded-2xl border border-[#7C9B93]/15 bg-white space-y-4 shadow-sm group">
                      <div className="flex justify-between items-start">
                        <span className="w-8 h-8 rounded-xl bg-[#7C9B93]/10 flex items-center justify-center text-[11px] font-black text-[#7C9B93]">{idx + 1}</span>
                        <button onClick={() => setContributionDraft((prev) => prev.filter((_, i) => i !== idx))} className="p-2 text-red-300 hover:text-red-500 transition-colors"><Trash2 size={14} /></button>
                      </div>
                      <div className="space-y-3">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <label className="text-[9px] font-black uppercase tracking-widest text-muted ml-1">Judul Singkat</label>
                            <input value={c.title} onChange={(e) => setContributionDraft((prev) => prev.map((x, i) => i === idx ? { ...x, title: e.target.value } : x))} className="w-full rounded-xl px-3 py-2.5 text-[12px] font-black uppercase border border-[#7C9B93]/15 bg-[#F8FAFA]" placeholder="Contoh: Pengurangan Limbah" />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[9px] font-black uppercase tracking-widest text-muted ml-1">Nilai/Jumlah</label>
                            <input value={c.value} onChange={(e) => setContributionDraft((prev) => prev.map((x, i) => i === idx ? { ...x, value: e.target.value } : x))} className="w-full rounded-xl px-3 py-2.5 text-[12px] font-black border border-[#7C9B93]/15 bg-[#F8FAFA]" placeholder="Contoh: 40 kg" />
                          </div>
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] font-black uppercase tracking-widest text-muted ml-1">Deskripsi Dampak</label>
                          <textarea value={c.description} onChange={(e) => setContributionDraft((prev) => prev.map((x, i) => i === idx ? { ...x, description: e.target.value } : x))} rows={2} className="w-full rounded-xl px-3 py-2.5 text-[12px] font-medium border border-[#7C9B93]/15 bg-[#F8FAFA]" placeholder="Jelaskan dampak dari capaian ini..." />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {contributionDraft.length > 0 && (
                  <button onClick={saveAdminContributionDraft} className="w-full md:w-auto px-8 py-4 rounded-2xl bg-[#7C9B93] text-white text-[11px] font-black uppercase tracking-widest shadow-lg active:scale-95 transition-all">
                    Update Kontribusi Project
                  </button>
                )}
              </div>
            )}

            {adminTab === 'setting' && (
              <div className="clay-card p-8 md:p-10 space-y-8 text-center max-w-2xl mx-auto">
                <div className="inline-flex p-5 rounded-3xl bg-red-50 text-red-400 mb-2">
                  <AlertTriangle size={40} />
                </div>
                <div className="space-y-3">
                  <h3 className="text-[18px] font-black uppercase tracking-widest text-main">Pusat Kendali Data</h3>
                  <p className="text-[13px] font-medium text-muted">Berhati-hatilah saat melakukan reset data. Tindakan ini akan menghapus seluruh update profil dan transaksi manual yang telah Anda buat untuk project <span className="font-black text-main">{managedProject}</span>.</p>
                </div>
                <div className="pt-4 flex flex-col md:flex-row items-center justify-center gap-4">
                  <button onClick={resetProjectData} className="w-full md:w-auto px-8 py-4 rounded-2xl border-2 border-red-100 text-red-400 text-[11px] font-black uppercase tracking-widest hover:bg-red-50 transition-colors">
                    Reset Seluruh Data Project
                  </button>
                  <button onClick={() => setAdminTab('profil')} className="w-full md:w-auto px-8 py-4 rounded-2xl bg-[#F8FAFA] text-main text-[11px] font-black uppercase tracking-widest">
                    Batalkan & Kembali
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="fixed bottom-0 left-0 w-full bg-white/80 backdrop-blur-xl border-t border-[#7C9B93]/10 z-[60] md:hidden">
          <div className="flex justify-around items-center p-2">
            {((managedProject === 'Semua' ? ['profil', 'keuangan', 'setting'] : ['profil', 'keuangan', 'kontribusi', 'setting']) as const).map((tab) => {
              const Icon = { profil: Layout, keuangan: Wallet, kontribusi: Heart, setting: Settings }[tab];
              const isActive = adminTab === tab;
              return (
                <button key={tab} onClick={() => setAdminTab(tab)} className={`flex flex-col items-center p-3 gap-1 transition-all ${isActive ? 'text-[#7C9B93]' : 'text-muted'}`}>
                  <Icon size={20} className={isActive ? 'scale-110' : ''} />
                  <span className="text-[8px] font-black uppercase tracking-tighter">{tab}</span>
                </button>
              );
            })}
          </div>
        </div>

        {transactionModalJSX}
        {pdfImportModalJSX}
        {pdfParsingOverlayJSX}
        {toastJSX}
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
          isJoinEnabled={activeProjectProfile.joinEnabled !== false}
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

      {transactionModalJSX}
      {pdfImportModalJSX}
      {pdfParsingOverlayJSX}
      {toastJSX}

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
