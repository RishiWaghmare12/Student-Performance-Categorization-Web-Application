import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { FileUpload } from './FileUpload';
import { AnalysisResults } from './AnalysisResults';
import { signOut } from '../lib/auth';
import {
  LayoutDashboard,
  Users,
  BookOpen,
  FileSpreadsheet,
  LogOut,
  GraduationCap,
  TrendingUp,
  Award,
  Search,
  Trash2,
  Edit,
  UserPlus,
  Shield,
  Bell,
  Download,
  BarChart2,
  X,
  ChevronRight,
  Activity,
} from 'lucide-react';
import toast from 'react-hot-toast';

interface DashboardProps {
  user: User;
}

interface OverviewData {
  totalStudents: number;
  averageCGPA: number;
  passRate: number;
  totalSubjects: number;
}

interface ActivityItem {
  id: string;
  action: string;
  subject: string;
  time: string;
  icon: React.ElementType;
  color: string;
  timestamp: number;
}

type TimeFilter = 'all' | 'today' | 'week' | 'month';

interface Teacher {
  id: number;
  name: string;
  email: string;
  department: string;
  subjects: string[];
}

interface Student {
  id: number;
  name: string;
  prn: string;
  course: string;
  semester: number;
  cgpa: number;
}

// ─── Sample data ──────────────────────────────────────────────────────────────
const sampleTeachers: Teacher[] = [
  { id: 1, name: 'Dr. Robert Chen',    email: 'robert.chen@example.com',  department: 'Computer Science', subjects: ['Advanced Programming', 'Software Engineering'] },
  { id: 2, name: 'Dr. Sarah Miller',   email: 'sarah.miller@example.com', department: 'Computer Science', subjects: ['Database Systems'] },
  { id: 3, name: 'Prof. David Wilson', email: 'david.wilson@example.com', department: 'Computer Science', subjects: ['Computer Networks'] },
];

const sampleSubjects = [
  { id: 1, code: 'CS401', name: 'Advanced Programming',  faculty: 'Dr. Robert Chen',   students: 150, avgScore: 82 },
  { id: 2, code: 'CS402', name: 'Database Systems',       faculty: 'Dr. Sarah Miller',  students: 145, avgScore: 78 },
  { id: 3, code: 'CS403', name: 'Computer Networks',      faculty: 'Prof. David Wilson', students: 155, avgScore: 75 },
  { id: 4, code: 'CS404', name: 'Operating Systems',      faculty: 'Dr. Emily Brown',   students: 148, avgScore: 80 },
  { id: 5, code: 'CS405', name: 'Software Engineering',   faculty: 'Prof. Michael Lee', students: 152, avgScore: 85 },
];

// ─── Shared UI helpers ────────────────────────────────────────────────────────

const ProgressBar: React.FC<{ value: number; color?: string; showTarget?: boolean }> = ({
  value, color = 'bg-blue-500', showTarget = false,
}) => (
  <div className="relative w-full h-2 bg-slate-100 rounded-full overflow-hidden">
    <div className={`h-full rounded-full transition-all duration-700 ${color}`} style={{ width: `${Math.min(value, 100)}%` }} />
    {showTarget && (
      <div className="absolute top-0 bottom-0 w-0.5 bg-slate-400/60" style={{ left: '75%' }} title="Target: 75%" />
    )}
  </div>
);

const Avatar: React.FC<{ name: string; size?: 'sm' | 'md' | 'lg' }> = ({ name, size = 'md' }) => {
  const initials = name.split(' ').slice(0, 2).map((p) => p[0]).join('').toUpperCase();
  const sz = size === 'sm' ? 'h-7 w-7 text-xs' : size === 'lg' ? 'h-12 w-12 text-base' : 'h-9 w-9 text-sm';
  return (
    <div className={`${sz} rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-semibold flex-shrink-0`}>
      {initials}
    </div>
  );
};

const StatCard: React.FC<{
  label: string; value: string | number; icon: React.ElementType;
  iconBg: string; iconColor: string; delta?: string; deltaColor?: string; sparkline?: boolean;
  accent?: string;
}> = ({ label, value, icon: Icon, iconBg, iconColor, delta, deltaColor = 'text-emerald-600', sparkline, accent = 'border-blue-400' }) => (
  <div className={`bg-white rounded-xl border border-slate-100 border-l-4 ${accent} shadow-sm hover:-translate-y-1 hover:shadow-md transition-all duration-200 p-3`}>
    <div className="flex items-start justify-between mb-1.5">
      <div className={`${iconBg} p-1.5 rounded-lg`}>
        <Icon className={`h-3.5 w-3.5 ${iconColor}`} />
      </div>
      {sparkline && (
        <svg width="44" height="16" viewBox="0 0 44 16" className="opacity-70">
          {[40,55,48,65,72,68,80].map((h, i) => (
            <rect key={i} x={i * 6.5} y={16 - (h / 100) * 16} width="4" height={(h / 100) * 16} rx="1" className="fill-blue-400" />
          ))}
        </svg>
      )}
    </div>
    <p className="text-lg font-bold text-slate-900 mt-0.5">{value}</p>
    <p className="text-[11px] text-slate-500 mt-0.5">{label}</p>
    {delta && <p className={`text-[11px] font-semibold mt-0.5 ${deltaColor}`}>{delta}</p>}
  </div>
);

const Modal: React.FC<{ title: string; onClose: () => void; children: React.ReactNode }> = ({ title, onClose, children }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
    <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold text-slate-900">{title}</h3>
        <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors">
          <X className="h-5 w-5 text-slate-500" />
        </button>
      </div>
      {children}
    </div>
  </div>
);

const FInput: React.FC<{
  label: string; type?: string; value: string | number;
  onChange: (v: string) => void; placeholder?: string; min?: string; max?: string;
}> = ({ label, type = 'text', value, onChange, placeholder, min, max }) => (
  <div>
    <label className="block text-sm font-medium text-slate-700 mb-1.5">{label}</label>
    <input
      type={type} value={value} onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder} min={min} max={max}
      className="w-full px-3.5 py-2.5 text-sm text-slate-900 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-slate-50 placeholder:text-slate-400"
    />
  </div>
);

// ─── Main Dashboard ───────────────────────────────────────────────────────────
export const Dashboard: React.FC<DashboardProps> = ({ user }) => {
  const [activeTab, setActiveTab]                     = useState('overview');
  const [analysisResults, setAnalysisResults]         = useState<any>(null);
  const [searchTerm, setSearchTerm]                   = useState('');
  const [students, setStudents]                       = useState<any[]>([]);
  const [subjects, setSubjects]                       = useState<any[]>([]);
  const [overview, setOverview]                       = useState<OverviewData>({ totalStudents: 0, averageCGPA: 0, passRate: 0, totalSubjects: 0 });
  const [activities, setActivities]                   = useState<ActivityItem[]>([]);
  const [timeFilter, setTimeFilter]                   = useState<TimeFilter>('week');
  const [teachers, setTeachers]                       = useState<Teacher[]>([]);
  const [showAddTeacherModal, setShowAddTeacherModal] = useState(false);
  const [showAddStudentModal, setShowAddStudentModal] = useState(false);
  const [newTeacher, setNewTeacher]                   = useState<Partial<Teacher>>({ name: '', email: '', department: '', subjects: [] });
  const [newStudent, setNewStudent]                   = useState<Partial<Student>>({ name: '', prn: '', course: '', semester: 1, cgpa: 0 });
  const [trendFilter, setTrendFilter]                 = useState<'weekly' | 'monthly' | 'semester'>('semester');

  const addActivity = (action: string, subject: string, icon: React.ElementType, color: string) => {
    setActivities((prev) => [{
      id: Math.random().toString(36).substr(2, 9),
      action, subject, time: 'Just now', icon, color, timestamp: Date.now(),
    }, ...prev]);
  };

  const getFilteredActivities = () => {
    const now = Date.now(), oneDay = 86400000, oneWeek = oneDay * 7, oneMonth = oneDay * 30;
    return activities.filter((a) => {
      const age = now - a.timestamp;
      if (timeFilter === 'today') return age < oneDay;
      if (timeFilter === 'week')  return age < oneWeek;
      if (timeFilter === 'month') return age < oneMonth;
      return true;
    });
  };

  const getTimeAgo = (timestamp: number): string => {
    const s = Math.floor((Date.now() - timestamp) / 1000);
    if (s < 60)    return 'Just now';
    if (s < 3600)  return `${Math.floor(s / 60)}m ago`;
    if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
    return `${Math.floor(s / 86400)}d ago`;
  };

  useEffect(() => {
    const interval = setInterval(() => {
      setActivities((prev) => prev.map((a) => ({ ...a, time: getTimeAgo(a.timestamp) })));
    }, 60_000);
    return () => clearInterval(interval);
  }, []);

  const handleFileProcess = (data: { analysisResults: any; students: any[]; subjects: any[]; overview: OverviewData }) => {
    setAnalysisResults(data.analysisResults);
    setStudents(data.students);
    setSubjects(data.subjects);
    setOverview(data.overview);
    addActivity('Analysis Generated', `${data.students.length} Students Data`, FileSpreadsheet, 'text-purple-600');
  };

  const handleSignOut = async () => {
    try { await signOut(); } catch (error: any) { toast.error(error.message); }
  };

  const handleDeleteTeacher = (teacherId: number) => {
    setTeachers((prev) => prev.filter((t) => t.id !== teacherId));
    addActivity('Teacher Deleted', 'Teacher account removed', Trash2, 'text-red-600');
    toast.success('Teacher account deleted successfully');
  };

  const handleAddTeacher = () => {
    if (!newTeacher.name || !newTeacher.email || !newTeacher.department) {
      toast.error('Please fill in all required fields'); return;
    }
    const teacher: Teacher = { id: Date.now(), name: newTeacher.name!, email: newTeacher.email!, department: newTeacher.department!, subjects: newTeacher.subjects || [] };
    setTeachers((prev) => [...prev, teacher]);
    setShowAddTeacherModal(false);
    setNewTeacher({ name: '', email: '', department: '', subjects: [] });
    addActivity('Teacher Added', teacher.name, UserPlus, 'text-green-600');
    toast.success('Teacher added successfully');
  };

  const handleAddStudent = () => {
    if (!newStudent.name || !newStudent.prn || !newStudent.course) {
      toast.error('Please fill in all required fields'); return;
    }
    const student: Student = { id: Date.now(), name: newStudent.name!, prn: newStudent.prn!, course: newStudent.course!, semester: newStudent.semester || 1, cgpa: newStudent.cgpa || 0 };
    setStudents((prev) => [...prev, student]);
    setShowAddStudentModal(false);
    setNewStudent({ name: '', prn: '', course: '', semester: 1, cgpa: 0 });
    addActivity('Student Added', student.name, UserPlus, 'text-green-600');
    toast.success('Student added successfully');
  };

  const handleStudentAction = (action: string, studentName: string) => {
    addActivity(action, studentName,
      action.includes('Added') ? UserPlus : action.includes('Deleted') ? Trash2 : Edit,
      action.includes('Deleted') ? 'text-red-600' : 'text-blue-600');
  };

  const handleSubjectAction = (action: string, subjectName: string) => {
    addActivity(action, subjectName,
      action.includes('Added') ? BookOpen : action.includes('Deleted') ? Trash2 : Edit,
      action.includes('Deleted') ? 'text-red-600' : 'text-blue-600');
  };

  const navigation = [
    { name: 'Overview', icon: LayoutDashboard, tab: 'overview' },
    { name: 'Students', icon: Users,            tab: 'students' },
    { name: 'Subjects', icon: BookOpen,          tab: 'subjects' },
    { name: 'Analysis', icon: FileSpreadsheet,   tab: 'analysis' },
    ...(user.role === 'admin' ? [{ name: 'Teachers', icon: Shield, tab: 'teachers' }] : []),
  ];

  const filteredStudents = students.filter((s) =>
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.prn.toLowerCase().includes(searchTerm.toLowerCase()));

  const filteredSubjects = subjects.filter((s) =>
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.code.toLowerCase().includes(searchTerm.toLowerCase()));

  const filteredTeachers = sampleTeachers.filter((t) =>
    t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.email.toLowerCase().includes(searchTerm.toLowerCase()));

  const pageMeta: Record<string, { title: string; subtitle: string }> = {
    overview: { title: 'Academic Performance Dashboard', subtitle: 'Monitor institutional performance, student outcomes, and accreditation readiness.' },
    students: { title: 'Student Management',   subtitle: 'Manage and track student records across all departments.' },
    subjects: { title: 'Subject Catalog',       subtitle: 'Course and subject-wise performance overview.' },
    analysis: { title: 'Performance Analysis',  subtitle: 'Upload data and generate CO-PO analytics and insights.' },
    teachers: { title: 'Faculty Management',    subtitle: 'Manage teaching staff and faculty performance.' },
  };
  const { title: pageTitle, subtitle: pageSubtitle } = pageMeta[activeTab] || pageMeta.overview;

  // ─── RENDER ───────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F1F5F9', fontFamily: 'Inter, system-ui, sans-serif' }}>

      {/* ════ SIDEBAR ════ */}
      <aside className="fixed inset-y-0 left-0 w-64 flex flex-col z-30 bg-white border-r border-slate-200 shadow-md">
        {/* Brand */}
        <div className="px-5 pt-6 pb-4 border-b border-slate-100 bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-2 rounded-xl shadow-lg shadow-blue-200">
              <GraduationCap className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900 leading-tight">Student Performance</p>
              <p className="text-xs font-semibold text-blue-500 leading-tight">Academic Intelligence Suite</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navigation.map((item) => {
            const active = activeTab === item.tab;
            return (
              <button key={item.name}
                onClick={() => { setActiveTab(item.tab); setSearchTerm(''); }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                  active
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/30'
                    : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
                }`}>
                <item.icon className="flex-shrink-0" style={{ height: 18, width: 18 }} />
                {item.name}
                {active && <ChevronRight className="ml-auto h-3.5 w-3.5 opacity-70" />}
              </button>
            );
          })}
        </nav>

        {/* User footer */}
        <div className="px-3 pb-4">
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
            <div className="flex items-center gap-2.5 mb-3">
              <div className="relative">
                <Avatar name={user.name} size="md" />
                <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-400 border-2 border-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-900 truncate">{user.name}</p>
                <span className={`inline-block mt-0.5 px-1.5 py-0.5 text-[10px] font-semibold rounded-full ${
                  user.role === 'admin' ? 'bg-purple-100 text-purple-600' : 'bg-blue-100 text-blue-600'
                }`}>
                  {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                </span>
              </div>
            </div>
            <button onClick={handleSignOut}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-white border border-slate-200 hover:bg-red-50 hover:text-red-500 hover:border-red-200 text-slate-500 text-xs font-medium transition-all duration-150">
              <LogOut className="h-3.5 w-3.5" />Sign out
            </button>
          </div>
        </div>
      </aside>

      {/* ════ MAIN CONTENT ════ */}
      <div className="pl-64 flex flex-col min-h-screen">

        {/* Header */}
        <header className="sticky top-0 z-20 bg-white border-b border-slate-100 shadow-sm">
          <div className="flex items-center justify-between px-6 h-16">
            <div>
              <h1 className="text-lg font-bold text-slate-900">{pageTitle}</h1>
              <p className="text-xs text-slate-400 hidden sm:block">{pageSubtitle}</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative hidden md:block">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input type="text" placeholder="Search…" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white w-52 text-slate-900 placeholder:text-slate-400" />
              </div>
              <button className="relative p-2 rounded-full hover:bg-slate-100 transition-colors">
                <Bell style={{ height: 18, width: 18 }} className="text-slate-600" />
                <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white" />
              </button>
              <button className="hidden sm:flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-gradient-to-r from-violet-600 to-indigo-600 rounded-full hover:opacity-90 shadow transition-all">
                <Download className="h-3.5 w-3.5" />Export
              </button>
              <Avatar name={user.name} size="sm" />
            </div>
          </div>
        </header>

        {/* Page body */}
        <main className="flex-1 px-6 py-6 w-full max-w-[1400px] mx-auto">

          {/* ═══ OVERVIEW ═══ */}
          {activeTab === 'overview' && (
            <div className="space-y-4">

              {/* ROW 1: KPI 2×2 + Quick Actions */}
              <div className="grid grid-cols-3 gap-4">
                {/* KPI 2×2 */}
                <div className="col-span-2 grid grid-cols-2 gap-4">
                  {/* Total Students */}
                  <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-2">
                      <div className="bg-blue-50 p-2 rounded-xl"><Users className="h-4 w-4 text-blue-500" /></div>
                      <svg width="60" height="24" viewBox="0 0 60 24">
                        {[6,9,7,11,10,13,12,15].map((h,i)=><rect key={i} x={i*8} y={24-h} width="5" height={h} rx="1.5" fill="#93c5fd" opacity="0.8"/>)}
                      </svg>
                    </div>
                    <p className="text-2xl font-bold text-slate-900">{overview.totalStudents || 1248}</p>
                    <p className="text-xs text-slate-400 mt-0.5">Total Students</p>
                    <p className="text-xs font-semibold text-emerald-500 mt-1">↑ 12% from last semester</p>
                  </div>
                  {/* Average CGPA */}
                  <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-2">
                      <div className="bg-emerald-50 p-2 rounded-xl"><TrendingUp className="h-4 w-4 text-emerald-500" /></div>
                      <svg width="60" height="24" viewBox="0 0 60 24" fill="none">
                        <polyline points="0,20 10,16 20,13 30,10 40,7 50,4 60,2" stroke="#34d399" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                    <p className="text-2xl font-bold text-slate-900">{overview.averageCGPA || '7.84'}</p>
                    <p className="text-xs text-slate-400 mt-0.5">Average CGPA</p>
                    <p className="text-xs font-semibold text-emerald-500 mt-1">↑ 0.4 improvement</p>
                  </div>
                  {/* Pass Rate */}
                  <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-2">
                      <div className="bg-amber-50 p-2 rounded-xl"><Award className="h-4 w-4 text-amber-500" /></div>
                      <svg width="60" height="24" viewBox="0 0 60 24" fill="none">
                        <polyline points="0,18 10,15 20,16 30,11 40,8 50,9 60,5" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                    <p className="text-2xl font-bold text-slate-900">{overview.passRate || 87}%</p>
                    <p className="text-xs text-slate-400 mt-0.5">Pass Rate</p>
                    <p className="text-xs font-semibold text-emerald-500 mt-1">↑ 5% this semester</p>
                  </div>
                  {/* Total Subjects */}
                  <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-2">
                      <div className="bg-purple-50 p-2 rounded-xl"><BookOpen className="h-4 w-4 text-purple-500" /></div>
                      <svg width="60" height="24" viewBox="0 0 60 24">
                        {[4,8,6,12,9,14,11,16].map((h,i)=><rect key={i} x={i*8} y={24-h} width="5" height={h} rx="1.5" fill="#c4b5fd" opacity="0.8"/>)}
                      </svg>
                    </div>
                    <p className="text-2xl font-bold text-slate-900">{overview.totalSubjects || 24}</p>
                    <p className="text-xs text-slate-400 mt-0.5">Total Subjects</p>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
                  <h3 className="text-sm font-bold text-slate-900 mb-3">Quick Actions</h3>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { label:'Upload Results',  icon:FileSpreadsheet, bg:'bg-blue-50',    border:'border-blue-200',    text:'text-blue-600',    onClick:()=>setActiveTab('analysis')     },
                      { label:'Generate Report', icon:Download,         bg:'bg-indigo-50',  border:'border-indigo-200',  text:'text-indigo-600',  onClick:()=>{}                           },
                      { label:'CO-PO Analysis',  icon:BarChart2,        bg:'bg-cyan-50',    border:'border-cyan-200',    text:'text-cyan-600',    onClick:()=>setActiveTab('analysis')     },
                      { label:'Add Student',     icon:UserPlus,         bg:'bg-emerald-50', border:'border-emerald-200', text:'text-emerald-600', onClick:()=>setShowAddStudentModal(true) },
                      { label:'Add Faculty',     icon:Shield,           bg:'bg-violet-50',  border:'border-violet-200',  text:'text-violet-600',  onClick:()=>setShowAddTeacherModal(true) },
                      { label:'Export Report',   icon:Download,         bg:'bg-amber-50',   border:'border-amber-200',   text:'text-amber-600',   onClick:()=>{}                           },
                    ].map((a) => (
                      <button key={a.label} onClick={a.onClick}
                        className={`flex flex-col items-center justify-center gap-2 p-3 rounded-xl border ${a.bg} ${a.border} hover:shadow-sm hover:-translate-y-0.5 transition-all duration-150`}>
                        <a.icon className={`h-5 w-5 ${a.text}`} />
                        <span className={`text-[10px] font-semibold text-center leading-tight ${a.text}`}>{a.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* ROW 2: Trend chart (left) + Academic Health Score (right) */}
              <div className="grid grid-cols-3 gap-4">
                {/* Trend chart */}
                <div className="col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-bold text-slate-900">Student Performance Trend</h3>
                    <div className="flex gap-1">
                      {(['Weekly','Monthly','Semester'] as const).map((f) => (
                        <button key={f} onClick={() => setTrendFilter(f.toLowerCase() as typeof trendFilter)}
                          className={`px-3 py-1 text-xs font-semibold rounded-full transition-colors ${
                            trendFilter === f.toLowerCase() ? 'bg-violet-600 text-white shadow' : 'text-slate-500 hover:bg-slate-100'}`}>
                          {f}
                        </button>
                      ))}
                    </div>
                  </div>
                  <TrendChart />
                </div>

                {/* Academic Health Score */}
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                  <h3 className="text-sm font-bold text-slate-900 mb-4">Academic Health Score</h3>
                  <div className="flex items-center gap-4">
                    <div className="flex-shrink-0"><CircleProgress value={87} /></div>
                    <div className="flex-1 space-y-3">
                      {[
                        { label:'Attendance', value:91, color:'bg-blue-500',    icon:'📅' },
                        { label:'Results',    value:87, color:'bg-emerald-500', icon:'📋' },
                        { label:'Engagement', value:79, color:'bg-amber-500',   icon:'🤝' },
                        { label:'Faculty',    value:84, color:'bg-violet-500',  icon:'🎓' },
                      ].map((item) => (
                        <div key={item.label}>
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-slate-600 font-medium">{item.label}</span>
                            <span className="font-bold text-slate-800">{item.value}%</span>
                          </div>
                          <ProgressBar value={item.value} color={item.color} />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* ROW 3: Dept Comparison (left) + Accreditation Readiness (right) */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                  <h3 className="text-sm font-bold text-slate-900 mb-4">Department Comparison</h3>
                  <DeptComparisonChart />
                </div>
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                  <h3 className="text-sm font-bold text-slate-900 mb-4">Accreditation Readiness</h3>
                  <div className="space-y-3">
                    {[
                      { label:'NBA Readiness',  value:85, color:'bg-violet-500' },
                      { label:'NAAC Readiness', value:90, color:'bg-emerald-500'},
                      { label:'OBE Compliance', value:94, color:'bg-cyan-500'   },
                      { label:'CO-PO Mapping',  value:89, color:'bg-indigo-500' },
                    ].map((item) => (
                      <div key={item.label}>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-slate-600 font-medium">{item.label}</span>
                          <span className="font-bold text-slate-700">{item.value}%</span>
                        </div>
                        <ProgressBar value={item.value} color={item.color} />
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* ROW 4: CO-PO Analytics */}
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                <h3 className="text-sm font-bold text-slate-900 mb-4">OBE & CO-PO Analytics</h3>
                <div className="grid grid-cols-2 gap-8">
                  <div>
                    <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest mb-3">CO Attainment</p>
                    <div className="space-y-3">
                      {[{label:'CO1',value:78},{label:'CO2',value:82},{label:'CO3',value:75},{label:'CO4',value:88}].map((co) => (
                        <div key={co.label}>
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-slate-700 font-medium">{co.label}</span>
                            <span className="text-slate-500">{co.value}%</span>
                          </div>
                          <ProgressBar value={co.value} color="bg-cyan-500" showTarget />
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest mb-3">PO Attainment</p>
                    <div className="space-y-3">
                      {[{label:'PO1',value:80},{label:'PO2',value:76},{label:'PO3',value:83},{label:'PO4',value:71}].map((po) => (
                        <div key={po.label}>
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-slate-700 font-medium">{po.label}</span>
                            <span className="text-slate-500">{po.value}%</span>
                          </div>
                          <ProgressBar value={po.value} color="bg-indigo-500" showTarget />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <p className="text-[10px] text-slate-400 mt-4 flex items-center gap-1">
                  <span className="inline-block w-4 border-t border-dashed border-slate-300" />
                  Dashed line indicates target threshold (75%)
                </p>
              </div>

              {/* ROW 5: Recent Activity */}
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold text-slate-900">Recent Activity</h3>
                  <div className="flex gap-1">
                    {(['Today','Week','Month','All'] as const).map((f) => {
                      const val = f.toLowerCase() as TimeFilter;
                      return (
                        <button key={f} onClick={() => setTimeFilter(val)}
                          className={`px-2.5 py-1 text-xs font-semibold rounded-full transition-colors ${
                            timeFilter === val ? 'bg-violet-600 text-white shadow' : 'text-slate-500 hover:bg-slate-100'}`}>
                          {f}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div className="divide-y divide-slate-50">
                  {getFilteredActivities().length > 0 ? getFilteredActivities().map((activity) => {
                    const bgMap: Record<string,string> = {
                      'text-purple-600':'bg-purple-50','text-red-600':'bg-red-50',
                      'text-green-600':'bg-emerald-50','text-blue-600':'bg-blue-50',
                    };
                    return (
                      <div key={activity.id} className="flex items-center gap-3 py-3">
                        <div className={`${bgMap[activity.color] || 'bg-slate-50'} p-2 rounded-xl flex-shrink-0`}>
                          <activity.icon className={`h-4 w-4 ${activity.color}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-900">{activity.action}</p>
                          <p className="text-xs text-slate-400 truncate">{activity.subject}</p>
                        </div>
                        <span className="text-xs bg-slate-100 text-slate-500 px-2.5 py-1 rounded-full whitespace-nowrap">{activity.time}</span>
                      </div>
                    );
                  }) : (
                    <div className="py-10 text-center">
                      <Activity className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                      <p className="text-sm text-slate-400">No activity in this period</p>
                    </div>
                  )}
                </div>
              </div>

            </div>
          )}

          {/* ═══ STUDENTS ═══ */}
          {activeTab === 'students' && (
            <div className="space-y-6">
              <div className="flex justify-end">
                {user.role === 'admin' && (
                  <button onClick={() => setShowAddStudentModal(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-semibold rounded-xl shadow hover:shadow-md transition-all">
                    <UserPlus className="h-4 w-4" />Add Student
                  </button>
                )}
              </div>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:max-w-3xl">
                <StatCard label="Total Students" value={overview.totalStudents || students.length} icon={Users}      iconBg="bg-blue-50"    iconColor="text-blue-600" />
                <StatCard label="Average CGPA"   value={overview.averageCGPA   || '—'}             icon={TrendingUp} iconBg="bg-emerald-50" iconColor="text-emerald-600" />
                <StatCard label="Pass Rate"      value={`${overview.passRate   || 0}%`}            icon={Award}      iconBg="bg-amber-50"   iconColor="text-amber-600" />
                <StatCard label="Total Subjects" value={overview.totalSubjects || 0}               icon={BookOpen}   iconBg="bg-purple-50"  iconColor="text-purple-600" />
              </div>
              <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
                <table className="min-w-full">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100">
                      {['Student','PRN','Course','Semester','CGPA','Status',...(user.role==='admin'?['Actions']:[])].map((h) => (
                        <th key={h} className={`px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500 ${h==='Actions'?'text-right':''}`}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {filteredStudents.map((student) => {
                      const cgpa = Number(student.cgpa);
                      const cgpaBadge = cgpa >= 8 ? 'bg-emerald-50 text-emerald-700' : cgpa >= 6 ? 'bg-amber-50 text-amber-700' : 'bg-red-50 text-red-700';
                      return (
                        <tr key={student.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-5 py-3.5">
                            <div className="flex items-center gap-3">
                              <Avatar name={student.name} size="sm" />
                              <span className="text-sm font-medium text-slate-900">{student.name}</span>
                            </div>
                          </td>
                          <td className="px-5 py-3.5 text-sm text-slate-500">{student.prn}</td>
                          <td className="px-5 py-3.5 text-sm text-slate-500">{student.course}</td>
                          <td className="px-5 py-3.5 text-sm text-slate-500">Sem {student.semester}</td>
                          <td className="px-5 py-3.5"><span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${cgpaBadge}`}>{cgpa}</span></td>
                          <td className="px-5 py-3.5">
                            <span className={`px-2.5 py-0.5 text-xs font-semibold rounded-full ${cgpa >= 6 ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                              {cgpa >= 6 ? 'Pass' : 'Fail'}
                            </span>
                          </td>
                          {user.role === 'admin' && (
                            <td className="px-5 py-3.5 text-right">
                              <button onClick={() => handleStudentAction('Student Updated', student.name)} className="p-1.5 rounded-lg hover:bg-blue-50 text-slate-400 hover:text-blue-600 transition-colors mr-1"><Edit className="h-4 w-4" /></button>
                              <button onClick={() => handleStudentAction('Student Deleted', student.name)} className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors"><Trash2 className="h-4 w-4" /></button>
                            </td>
                          )}
                        </tr>
                      );
                    })}
                    {filteredStudents.length === 0 && (
                      <tr><td colSpan={7} className="px-5 py-12 text-center text-sm text-slate-400">No students found. Upload an Excel file on the Analysis tab.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ═══ SUBJECTS ═══ */}
          {activeTab === 'subjects' && (
            <div className="space-y-6">
              <div className="flex justify-end">
                {user.role === 'admin' && (
                  <button className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-semibold rounded-xl shadow hover:shadow-md transition-all">
                    <BookOpen className="h-4 w-4" />Add Subject
                  </button>
                )}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {(filteredSubjects.length > 0 ? filteredSubjects : sampleSubjects.filter((s) => s.name.toLowerCase().includes(searchTerm.toLowerCase()) || s.code.toLowerCase().includes(searchTerm.toLowerCase()))).map((subject) => {
                  const score = subject.avgScore as number;
                  const barColor = score >= 80 ? 'bg-emerald-500' : score >= 65 ? 'bg-amber-500' : 'bg-red-500';
                  const badgeColor = score >= 80 ? 'text-emerald-700 bg-emerald-50' : score >= 65 ? 'text-amber-700 bg-amber-50' : 'text-red-700 bg-red-50';
                  return (
                    <div key={subject.id} className="bg-white rounded-xl border border-slate-100 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 p-5">
                      <div className="flex items-start justify-between mb-3">
                        <span className="px-2.5 py-0.5 text-xs font-bold text-blue-700 bg-blue-50 rounded-lg">{subject.code}</span>
                        <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${badgeColor}`}>{score}%</span>
                      </div>
                      <h4 className="text-sm font-bold text-slate-900 mb-1">{subject.name}</h4>
                      <p className="text-xs text-slate-500 mb-1">{subject.faculty}</p>
                      <p className="text-xs text-slate-400 mb-3">{subject.students} students</p>
                      <div className="flex justify-between text-xs text-slate-500 mb-1.5">
                        <span>Avg. Score</span>
                        <span className="font-semibold text-slate-700">{score}%</span>
                      </div>
                      <ProgressBar value={score} color={barColor} />
                      {user.role === 'admin' && (
                        <div className="flex gap-2 mt-4 pt-3 border-t border-slate-50">
                          <button onClick={() => handleSubjectAction('Subject Updated', subject.name)} className="flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"><Edit className="h-3.5 w-3.5" />Edit</button>
                          <button onClick={() => handleSubjectAction('Subject Deleted', subject.name)} className="flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"><Trash2 className="h-3.5 w-3.5" />Delete</button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ═══ ANALYSIS ═══ */}
          {activeTab === 'analysis' && (
            <div className="space-y-6">
              <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6">
                <FileUpload onFileProcess={handleFileProcess} />
              </div>
              {analysisResults && <AnalysisResults results={analysisResults} />}
            </div>
          )}

          {/* ═══ TEACHERS ═══ */}
          {activeTab === 'teachers' && user.role === 'admin' && (
            <div className="space-y-6">
              <div className="flex justify-end">
                <button onClick={() => setShowAddTeacherModal(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-semibold rounded-xl shadow hover:shadow-md transition-all">
                  <UserPlus className="h-4 w-4" />Add Teacher
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {(teachers.length > 0
                  ? teachers.filter((t) => t.name.toLowerCase().includes(searchTerm.toLowerCase()) || t.email.toLowerCase().includes(searchTerm.toLowerCase()))
                  : filteredTeachers
                ).map((teacher) => (
                  <div key={teacher.id} className="bg-white rounded-xl border border-slate-100 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 p-5">
                    <div className="flex items-start gap-3 mb-3">
                      <Avatar name={teacher.name} size="lg" />
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-bold text-slate-900 truncate">{teacher.name}</h4>
                        <p className="text-xs text-slate-500 truncate">{teacher.email}</p>
                        <span className="mt-1 inline-block px-2 py-0.5 text-[10px] font-semibold text-blue-700 bg-blue-50 rounded-full">{teacher.department}</span>
                      </div>
                    </div>
                    <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1.5">Subjects</p>
                    <div className="flex flex-wrap gap-1 mb-4">
                      {teacher.subjects.map((s) => (
                        <span key={s} className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">{s}</span>
                      ))}
                    </div>
                    <div className="flex gap-2 pt-3 border-t border-slate-50">
                      <button className="flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"><Edit className="h-3.5 w-3.5" />Edit</button>
                      <button onClick={() => handleDeleteTeacher(teacher.id)} className="flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"><Trash2 className="h-3.5 w-3.5" />Delete</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </main>
      </div>

      {/* ════ MODALS ════ */}
      {showAddTeacherModal && (
        <Modal title="Add New Teacher" onClose={() => setShowAddTeacherModal(false)}>
          <div className="space-y-4">
            <FInput label="Full Name"      value={newTeacher.name       || ''} onChange={(v) => setNewTeacher((p) => ({ ...p, name: v }))}       placeholder="Dr. John Doe" />
            <FInput label="Email Address"  type="email" value={newTeacher.email || ''} onChange={(v) => setNewTeacher((p) => ({ ...p, email: v }))} placeholder="john.doe@university.edu" />
            <FInput label="Department"     value={newTeacher.department  || ''} onChange={(v) => setNewTeacher((p) => ({ ...p, department: v }))} placeholder="Computer Science" />
            <div className="flex gap-3 pt-2">
              <button onClick={() => setShowAddTeacherModal(false)} className="flex-1 px-4 py-2.5 text-sm font-semibold text-slate-600 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors">Cancel</button>
              <button onClick={handleAddTeacher} className="flex-1 px-4 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl hover:opacity-90 shadow">Add Teacher</button>
            </div>
          </div>
        </Modal>
      )}

      {showAddStudentModal && (
        <Modal title="Add New Student" onClose={() => setShowAddStudentModal(false)}>
          <div className="space-y-4">
            <FInput label="Full Name"  value={newStudent.name   || ''} onChange={(v) => setNewStudent((p) => ({ ...p, name: v }))}   placeholder="Jane Smith" />
            <FInput label="PRN Number" value={newStudent.prn    || ''} onChange={(v) => setNewStudent((p) => ({ ...p, prn: v }))}    placeholder="PRN2024XXX" />
            <FInput label="Course"     value={newStudent.course || ''} onChange={(v) => setNewStudent((p) => ({ ...p, course: v }))} placeholder="B.Tech CSE" />
            <div className="grid grid-cols-2 gap-4">
              <FInput label="Semester" type="number" min="1" max="8" value={newStudent.semester || 1} onChange={(v) => setNewStudent((p) => ({ ...p, semester: parseInt(v) || 1 }))} />
              <FInput label="CGPA"     type="number" min="0" max="10" value={newStudent.cgpa    || 0} onChange={(v) => setNewStudent((p) => ({ ...p, cgpa: parseFloat(v) || 0 }))} />
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={() => setShowAddStudentModal(false)} className="flex-1 px-4 py-2.5 text-sm font-semibold text-slate-600 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors">Cancel</button>
              <button onClick={handleAddStudent} className="flex-1 px-4 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl hover:opacity-90 shadow">Add Student</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

// ─── Chart components ─────────────────────────────────────────────────────────

const TrendChart: React.FC = () => {
  const data = [
    { label:'S1', cgpa:5.0, pass:60 },
    { label:'S2', cgpa:5.5, pass:65 },
    { label:'S3', cgpa:6.2, pass:70 },
    { label:'S4', cgpa:6.8, pass:75 },
    { label:'S5', cgpa:7.2, pass:82 },
    { label:'S6', cgpa:7.8, pass:90 },
  ];
  const W=500, H=160, PL=40, PR=44, PT=16, PB=28;
  const CW = W - PL - PR, CH = H - PT - PB;
  // CGPA: 0–10, Pass: 0–100
  const toX = (i: number) => PL + (i / (data.length - 1)) * CW;
  const toYcgpa = (v: number) => PT + CH - (v / 10) * CH;
  const toYpass = (v: number) => PT + CH - (v / 100) * CH;
  const cgpaPts = data.map((d,i) => `${toX(i)},${toYcgpa(d.cgpa)}`).join(' ');
  const passPts = data.map((d,i) => `${toX(i)},${toYpass(d.pass)}`).join(' ');
  const area = `M${toX(0)},${toYcgpa(data[0].cgpa)} `+data.map((d,i)=>`L${toX(i)},${toYcgpa(d.cgpa)}`).join(' ')+` L${toX(data.length-1)},${PT+CH} L${toX(0)},${PT+CH}Z`;
  const cgpaYTicks = [0,2.5,5,7.5,10];
  const passYTicks = [0,25,50,75,100];
  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H+PB}`} className="w-full" style={{minWidth:260}}>
        <defs>
          <linearGradient id="tg2" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#818cf8" stopOpacity="0.25"/>
            <stop offset="100%" stopColor="#818cf8" stopOpacity="0"/>
          </linearGradient>
        </defs>
        {/* Grid lines */}
        {cgpaYTicks.map(v=>(
          <line key={v} x1={PL} x2={W-PR} y1={toYcgpa(v)} y2={toYcgpa(v)} stroke="#f1f5f9" strokeWidth="1"/>
        ))}
        {/* Area fill */}
        <path d={area} fill="url(#tg2)"/>
        {/* CGPA line */}
        <polyline points={cgpaPts} fill="none" stroke="#6366f1" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
        {/* Pass% line */}
        <polyline points={passPts} fill="none" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="6 3"/>
        {/* Dots */}
        {data.map((d,i)=>(
          <React.Fragment key={i}>
            <circle cx={toX(i)} cy={toYcgpa(d.cgpa)} r="4" fill="white" stroke="#6366f1" strokeWidth="2"/>
            <circle cx={toX(i)} cy={toYpass(d.pass)} r="4" fill="white" stroke="#22c55e" strokeWidth="2"/>
          </React.Fragment>
        ))}
        {/* X labels */}
        {data.map((d,i)=>(
          <text key={i} x={toX(i)} y={H+PB-4} textAnchor="middle" fontSize="11" fill="#94a3b8">{d.label}</text>
        ))}
        {/* Left Y-axis labels (CGPA) */}
        {cgpaYTicks.map(v=>(
          <text key={v} x={PL-6} y={toYcgpa(v)+4} textAnchor="end" fontSize="10" fill="#94a3b8">{v}</text>
        ))}
        {/* Right Y-axis labels (Pass%) */}
        {passYTicks.map(v=>(
          <text key={v} x={W-PR+8} y={toYpass(v)+4} textAnchor="start" fontSize="10" fill="#94a3b8">{v}%</text>
        ))}
        {/* Axis labels */}
        <text x={PL-28} y={PT+CH/2} textAnchor="middle" fontSize="10" fill="#6366f1" transform={`rotate(-90,${PL-28},${PT+CH/2})`}>CGPA</text>
        <text x={W-PR+36} y={PT+CH/2} textAnchor="middle" fontSize="10" fill="#22c55e" transform={`rotate(90,${W-PR+36},${PT+CH/2})`}>Pass %</text>
      </svg>
      <div className="flex items-center gap-5 mt-1 px-1">
        <div className="flex items-center gap-1.5"><div className="h-0.5 w-5 bg-indigo-500 rounded"/><span className="text-xs text-slate-500">CGPA Trend</span></div>
        <div className="flex items-center gap-1.5"><div className="h-0.5 w-5 bg-emerald-500 rounded"/><span className="text-xs text-slate-500">Pass %</span></div>
      </div>
    </div>
  );
};

const DeptComparisonChart: React.FC = () => (
  <div className="space-y-3">
    {[
      {name:'CSE',        value:87, color:'bg-blue-500'   },
      {name:'IT',         value:82, color:'bg-indigo-500' },
      {name:'ECE',        value:78, color:'bg-cyan-500'   },
      {name:'Mechanical', value:74, color:'bg-amber-500'  },
      {name:'Civil',      value:71, color:'bg-violet-500' },
    ].map((dept) => (
      <div key={dept.name} className="flex items-center gap-3">
        <span className="text-xs font-semibold text-slate-600 w-20 text-right flex-shrink-0">{dept.name}</span>
        <div className="flex-1 h-5 bg-slate-100 rounded-full overflow-hidden relative">
          <div className={`h-full rounded-full ${dept.color} transition-all duration-700`} style={{width:`${dept.value}%`}}/>
        </div>
        <span className="text-xs font-bold text-slate-600 w-8 flex-shrink-0">{dept.value}%</span>
      </div>
    ))}
  </div>
);

const CircleProgress: React.FC<{ value: number }> = ({ value }) => {
  const r = 44, c = 2 * Math.PI * r, offset = c - (value / 100) * c;
  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width="108" height="108" viewBox="0 0 108 108">
        <defs>
          <linearGradient id="rg" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%"   stopColor="#6366f1"/>
            <stop offset="100%" stopColor="#a855f7"/>
          </linearGradient>
        </defs>
        <circle cx="54" cy="54" r={r} fill="none" stroke="#e2e8f0" strokeWidth="10"/>
        <circle cx="54" cy="54" r={r} fill="none" stroke="url(#rg)" strokeWidth="10"
          strokeLinecap="round" strokeDasharray={c} strokeDashoffset={offset}
          transform="rotate(-90 54 54)" style={{transition:'stroke-dashoffset 0.6s ease'}}/>
      </svg>
      <div className="absolute text-center">
        <p className="text-xl font-bold text-slate-900">{value}%</p>
        <p className="text-[10px] text-slate-400">Health</p>
      </div>
    </div>
  );
};
