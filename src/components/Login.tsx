import React, { useState } from 'react';
import { signIn, signUp } from '../lib/auth';
import {
  GraduationCap, Mail, Lock, User, Shield,
  Eye, EyeOff, TrendingUp, Users,
  FileText, CheckCircle, Award, ChevronRight,
  Zap, BookOpen,
} from 'lucide-react';
import toast from 'react-hot-toast';

const ROLES = [
  { label: 'Administrator',       value: 'admin'   as const },
  { label: 'HOD',                 value: 'admin'   as const },
  { label: 'Faculty',             value: 'teacher' as const },
  { label: 'Program Coordinator', value: 'teacher' as const },
  { label: 'Department Staff',    value: 'teacher' as const },
];

const STATS = [
  { icon: Users,      value: '15,000+', label: 'Students Analyzed'  },
  { icon: BookOpen,   value: '20+',     label: 'Departments'         },
  { icon: FileText,   value: '50,000+', label: 'Reports Generated'   },
  { icon: TrendingUp, value: '98%',     label: 'Accuracy Rate'       },
];

const BADGES = [
  { label: 'OBE Ready',          color: 'from-emerald-500 to-teal-500'  },
  { label: 'NBA Accreditation',  color: 'from-blue-400 to-indigo-500'   },
  { label: 'CO-PO Analytics',    color: 'from-violet-500 to-purple-500' },
  { label: 'AI-Powered Insights',color: 'from-cyan-500 to-blue-500'     },
];

/* ── Floating orb ── */
const Orb = ({ cls }: { cls: string }) => (
  <div className={`absolute rounded-full blur-3xl opacity-[0.15] pointer-events-none ${cls}`} />
);

/* ── Labelled input ── */
interface FIProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string; icon: React.ElementType; rightEl?: React.ReactNode; error?: string;
}
const FInput: React.FC<FIProps> = ({ label, icon: Icon, rightEl, error, id, ...rest }) => (
  <div>
    <label htmlFor={id} className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
      {label}
    </label>
    <div className="relative">
      <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <Icon className="h-4 w-4 text-slate-400" />
      </span>
      <input
        id={id} {...rest}
        className={`w-full pl-9 ${rightEl ? 'pr-10' : 'pr-3'} py-2.5 rounded-lg border text-sm
          bg-slate-50 text-slate-800 placeholder-slate-400 transition-all duration-200
          focus:outline-none focus:border-blue-500 focus:bg-white
          focus:ring-2 focus:ring-blue-500/20
          ${error ? 'border-red-400 bg-red-50' : 'border-slate-200'}`}
      />
      {rightEl && (
        <span className="absolute inset-y-0 right-0 pr-3 flex items-center">{rightEl}</span>
      )}
    </div>
    {error && <p className="text-[11px] text-red-500 mt-1">{error}</p>}
  </div>
);

/* ════════════════════════════════════════════════════════
   Main Component
════════════════════════════════════════════════════════ */
export const Login = () => {
  const [isSignUp, setIsSignUp]     = useState(false);
  const [email, setEmail]           = useState('');
  const [password, setPassword]     = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [name, setName]             = useState('');
  const [roleLabel, setRoleLabel]   = useState(ROLES[0].label);
  const [showPwd, setShowPwd]       = useState(false);
  const [showCPwd, setShowCPwd]     = useState(false);
  const [loading, setLoading]       = useState(false);
  const [errors, setErrors]         = useState<Record<string,string>>({});

  const selectedRole = ROLES.find(r => r.label === roleLabel)?.value ?? 'teacher';

  const validate = () => {
    const e: Record<string,string> = {};
    if (isSignUp && !name.trim())               e.name       = 'Full name is required.';
    if (!email.trim())                           e.email      = 'Email is required.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = 'Enter a valid email.';
    if (!password)                               e.password   = 'Password is required.';
    else if (isSignUp && password.length < 8)   e.password   = 'Minimum 8 characters.';
    if (isSignUp && password !== confirmPwd)     e.confirmPwd = 'Passwords do not match.';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      if (isSignUp) {
        await signUp(email, password, name, selectedRole);
        toast.success('Account created! Please sign in.');
        setIsSignUp(false);
        setPassword(''); setConfirmPwd(''); setName('');
      } else {
        await signIn(email, password);
        window.location.reload();
      }
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const switchMode = () => { setIsSignUp(v => !v); setErrors({}); setPassword(''); setConfirmPwd(''); };

  /* ══════════════════════════════════════════════════════ */
  return (
    <div className="min-h-screen flex overflow-hidden" style={{ fontFamily: "'Inter','Manrope',sans-serif" }}>

      {/* ══════════════════ LEFT PANEL (65%) ═════════════════════ */}
      <div className="hidden lg:flex lg:w-[65%] relative flex-col justify-between py-10 px-14
                      bg-gradient-to-br from-[#0F172A] via-[#1E3A8A] to-[#1E40AF]">

        {/* Orbs */}
        <Orb cls="w-[500px] h-[500px] bg-blue-400 top-[-120px] left-[-120px]" />
        <Orb cls="w-96 h-96 bg-indigo-500 bottom-[-80px] right-[-80px]" />
        <Orb cls="w-72 h-72 bg-cyan-400 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />

        {/* ── TOP: Logo + headline ── */}
        <div className="relative z-10">
          {/* Logo bar */}
          <div className="flex items-center gap-3 mb-8">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-400 to-indigo-500
                            flex items-center justify-center shadow-lg shadow-blue-900/50">
              <GraduationCap className="h-5 w-5 text-white" />
            </div>
            <span className="text-white font-bold text-base tracking-tight">EduAnalytics</span>
          </div>

          {/* Headline */}
          <h1 className="text-4xl xl:text-5xl font-extrabold text-white leading-[1.15] mb-3">
            Student Performance
            <span className="block bg-gradient-to-r from-cyan-300 to-blue-300 bg-clip-text text-transparent">
              Analytics Platform
            </span>
          </h1>
          <p className="text-blue-200 text-sm xl:text-base leading-relaxed max-w-xl">
            Empowering institutions with data-driven insights, outcome assessment,
            and academic excellence monitoring.
          </p>
        </div>

        {/* ── MIDDLE: Stats + Chart ── */}
        <div className="relative z-10 flex flex-col gap-5 flex-1 justify-center py-6">

          {/* Stat cards 2×2 */}
          <div className="grid grid-cols-4 gap-3">
            {STATS.map(({ icon: Icon, value, label }) => (
              <div key={label}
                className="rounded-xl p-4 hover:scale-[1.03] transition-transform duration-300
                           bg-white/10 backdrop-blur-md border border-white/15">
                <div className="flex items-center gap-2 mb-1.5">
                  <div className="h-7 w-7 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
                    <Icon className="h-3.5 w-3.5 text-cyan-300" />
                  </div>
                  <span className="text-white font-black text-lg leading-none">{value}</span>
                </div>
                <p className="text-blue-200 text-xs font-medium leading-tight">{label}</p>
              </div>
            ))}
          </div>

          {/* CO-PO chart card */}
          <div className="rounded-2xl p-5 bg-white/10 backdrop-blur-md border border-white/15">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-white font-semibold text-sm">CO-PO Attainment Overview</p>
                <p className="text-blue-300 text-xs mt-0.5">Current Semester · All Departments</p>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-semibold border border-emerald-500/30">
                ↑ 12% vs Last Sem
              </span>
            </div>

            {/* Bar chart */}
            <div className="flex items-end gap-1.5 h-14 mb-2">
              {[65,80,72,91,58,85,77,88].map((h,i) => (
                <div key={i} className="flex-1">
                  <div className="w-full rounded-t-md bg-gradient-to-t from-blue-500 to-cyan-400 opacity-80"
                    style={{ height: `${h}%` }} />
                </div>
              ))}
            </div>
            <div className="flex justify-between mb-4">
              {['CO1','CO2','CO3','CO4','PO1','PO2','PO3','PO4'].map(l => (
                <span key={l} className="text-blue-300 text-[10px] font-medium flex-1 text-center">{l}</span>
              ))}
            </div>

            {/* Progress bars */}
            <div className="space-y-2.5">
              {[
                { label:'NAAC Readiness', pct:87, color:'from-emerald-400 to-teal-400' },
                { label:'NBA Compliance',  pct:73, color:'from-blue-400 to-indigo-400'  },
              ].map(({ label, pct, color }) => (
                <div key={label} className="flex items-center gap-3">
                  <span className="text-blue-200 text-xs w-32 flex-shrink-0">{label}</span>
                  <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full bg-gradient-to-r ${color}`} style={{ width:`${pct}%` }} />
                  </div>
                  <span className="text-white text-xs font-bold w-8 text-right">{pct}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── BOTTOM: Badges + Trusted by ── */}
        <div className="relative z-10">
          <div className="flex flex-wrap gap-2 mb-4">
            {BADGES.map(({ label, color }) => (
              <span key={label}
                className={`px-3 py-1 rounded-full bg-gradient-to-r ${color}
                            text-white text-xs font-semibold flex items-center gap-1.5 shadow-md`}>
                <CheckCircle className="h-3 w-3" />{label}
              </span>
            ))}
          </div>
          <div className="flex items-center gap-1.5 mb-1">
            <p className="text-blue-300 text-[11px] font-bold uppercase tracking-widest">Trusted By</p>
          </div>
          <div className="flex items-center gap-5">
            {['Engineering Colleges','Universities','Autonomous Institutes'].map(t => (
              <div key={t} className="flex items-center gap-1.5">
                <Award className="h-3.5 w-3.5 text-cyan-300 flex-shrink-0" />
                <span className="text-blue-100 text-xs">{t}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ══════════════════ RIGHT PANEL (35%) ════════════════════ */}
      <div className="flex-1 lg:w-[35%] flex items-center justify-center
                      bg-[#F1F5F9] px-6 py-8">

        <div className="w-full max-w-sm">

          {/* Mobile logo */}
          <div className="flex lg:hidden items-center gap-2 mb-6 justify-center">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center">
              <GraduationCap className="h-5 w-5 text-white" />
            </div>
            <span className="font-bold text-[#0F172A] text-lg">EduAnalytics Pro</span>
          </div>

          {/* Card */}
          <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/80 border border-slate-100 p-7">

            {/* Header */}
            <div className="mb-5">
              <div className="flex items-center gap-1.5 mb-1.5">
                <Zap className="h-3.5 w-3.5 text-blue-600" />
                <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">
                  Academic Analytics Suite
                </span>
              </div>
              <h2 className="text-xl font-extrabold text-[#0F172A]">
                {isSignUp ? 'Create Your Account' : 'Welcome Back'}
              </h2>
              <p className="text-xs text-[#64748B] mt-1 leading-relaxed">
                {isSignUp
                  ? 'Access comprehensive student performance analytics and reporting tools.'
                  : 'Sign in to your institutional analytics dashboard.'}
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} noValidate className="space-y-3.5">

              {isSignUp && (
                <FInput id="name" label="Full Name" icon={User}
                  type="text" placeholder="Dr. Rajesh Kumar"
                  value={name} onChange={e => setName(e.target.value)}
                  autoComplete="name" error={errors.name} />
              )}

              <FInput id="email" label="Institutional Email" icon={Mail}
                type="email" placeholder="you@university.edu"
                value={email} onChange={e => setEmail(e.target.value)}
                autoComplete="email" error={errors.email} />

              <FInput id="password" label="Password" icon={Lock}
                type={showPwd ? 'text' : 'password'} placeholder="••••••••"
                value={password} onChange={e => setPassword(e.target.value)}
                autoComplete={isSignUp ? 'new-password' : 'current-password'}
                error={errors.password}
                rightEl={
                  <button type="button" tabIndex={-1} onClick={() => setShowPwd(v => !v)}
                    className="text-slate-400 hover:text-blue-600 transition-colors"
                    aria-label={showPwd ? 'Hide password' : 'Show password'}>
                    {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                } />

              {isSignUp && (
                <>
                  <FInput id="confirmPwd" label="Confirm Password" icon={Lock}
                    type={showCPwd ? 'text' : 'password'} placeholder="••••••••"
                    value={confirmPwd} onChange={e => setConfirmPwd(e.target.value)}
                    autoComplete="new-password" error={errors.confirmPwd}
                    rightEl={
                      <button type="button" tabIndex={-1} onClick={() => setShowCPwd(v => !v)}
                        className="text-slate-400 hover:text-blue-600 transition-colors"
                        aria-label={showCPwd ? 'Hide' : 'Show'}>
                        {showCPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    } />

                  <div>
                    <label htmlFor="role"
                      className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                      Role
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Shield className="h-4 w-4 text-slate-400" />
                      </span>
                      <select id="role" value={roleLabel} onChange={e => setRoleLabel(e.target.value)}
                        className="w-full pl-9 pr-8 py-2.5 rounded-lg border border-slate-200
                                   bg-slate-50 text-slate-800 text-sm appearance-none cursor-pointer
                                   transition-all duration-200 focus:outline-none
                                   focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/20">
                        {ROLES.map(r => (
                          <option key={r.label} value={r.label}>{r.label}</option>
                        ))}
                      </select>
                      <span className="absolute inset-y-0 right-2.5 flex items-center pointer-events-none">
                        <ChevronRight className="h-4 w-4 text-slate-400 rotate-90" />
                      </span>
                    </div>
                  </div>
                </>
              )}

              {/* Submit */}
              <button type="submit" disabled={loading}
                className="w-full py-3 rounded-xl text-sm font-bold text-white mt-1
                           bg-gradient-to-r from-[#2563EB] to-[#4338CA]
                           hover:from-[#1D4ED8] hover:to-[#3730A3]
                           hover:-translate-y-0.5 hover:shadow-lg hover:shadow-blue-500/30
                           active:translate-y-0 disabled:opacity-60 disabled:cursor-not-allowed
                           transition-all duration-200 flex items-center justify-center gap-2">
                {loading ? (
                  <>
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"/>
                    </svg>
                    {isSignUp ? 'Creating Account…' : 'Signing In…'}
                  </>
                ) : (
                  <>{isSignUp ? 'Create Account' : 'Sign In'} <ChevronRight className="h-4 w-4" /></>
                )}
              </button>
            </form>

            {/* Switch */}
            <p className="mt-4 text-center text-xs text-[#64748B]">
              {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
              <button type="button" onClick={switchMode}
                className="font-semibold text-blue-600 hover:text-indigo-600
                           underline underline-offset-2 decoration-transparent
                           hover:decoration-indigo-400 transition-all duration-200">
                {isSignUp ? 'Sign In' : 'Sign Up'}
              </button>
            </p>

            {/* Trust footer */}
            <div className="mt-5 pt-4 border-t border-slate-100">
              <p className="text-center text-[10px] text-slate-400 leading-relaxed">
                Powered by Outcome-Based Education Framework<br/>
                <span className="text-blue-400 font-medium">NBA & NAAC Assessment Ready</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
