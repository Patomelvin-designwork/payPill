import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Pill, Mail, Lock, Eye, EyeOff, Shield, Sparkles, CheckCircle,
  ArrowRight, ChevronLeft, ChevronRight, Wallet, FileText, Heart,
  Activity, Settings, Bell, Search, Menu, LogOut, Brain,
  Calendar, TrendingUp, Clock, CreditCard, HelpCircle, Info,
  Plus, RefreshCw, ExternalLink, Copy,
  AlertCircle, Zap, BarChart3, Layers, Download
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import AIQuestionnaire from './AIQuestionnaire';
import { usePaypillStore, userInitials } from '@/store/paypill-store';
import { supabase } from '@/lib/supabase';
import { Toaster } from '@/components/ui/sonner';
import { toast } from 'sonner';

// ============================================
// ROUTE GUARDS (single global store via Zustand)
// ============================================
function GuestOnly({ children }: { children: React.ReactNode }) {
  const isAuthenticated = usePaypillStore((s) => s.isAuthenticated);
  const authHydrated = usePaypillStore((s) => s.authHydrated);
  const onboardingComplete = usePaypillStore((s) => s.onboardingComplete);
  if (!authHydrated) return <LoadingScreen />;
  if (isAuthenticated) {
    return <Navigate to={onboardingComplete ? '/dashboard' : '/onboarding'} replace />;
  }
  return <>{children}</>;
}

function RequireDashboard({ children }: { children: React.ReactNode }) {
  const isAuthenticated = usePaypillStore((s) => s.isAuthenticated);
  const authHydrated = usePaypillStore((s) => s.authHydrated);
  const onboardingComplete = usePaypillStore((s) => s.onboardingComplete);
  if (!authHydrated) return <LoadingScreen />;
  if (!isAuthenticated) return <Navigate to="/signin" replace />;
  if (!onboardingComplete) return <Navigate to="/onboarding" replace />;
  return <>{children}</>;
}

function RequireOnboarding({ children }: { children: React.ReactNode }) {
  const isAuthenticated = usePaypillStore((s) => s.isAuthenticated);
  const authHydrated = usePaypillStore((s) => s.authHydrated);
  const onboardingComplete = usePaypillStore((s) => s.onboardingComplete);
  if (!authHydrated) return <LoadingScreen />;
  if (!isAuthenticated) return <Navigate to="/signin" replace />;
  if (onboardingComplete) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}

// ISO country list with dial codes (common subset for signup phone input).
// Sorted by name; extend freely without touching consumer logic.
const COUNTRY_DIAL_CODES: Array<{ code: string; name: string; dial: string; flag: string }> = [
  { code: 'NG', name: 'Nigeria', dial: '+234', flag: '🇳🇬' },
  { code: 'US', name: 'United States', dial: '+1', flag: '🇺🇸' },
  { code: 'CA', name: 'Canada', dial: '+1', flag: '🇨🇦' },
  { code: 'GB', name: 'United Kingdom', dial: '+44', flag: '🇬🇧' },
  { code: 'IE', name: 'Ireland', dial: '+353', flag: '🇮🇪' },
  { code: 'AU', name: 'Australia', dial: '+61', flag: '🇦🇺' },
  { code: 'NZ', name: 'New Zealand', dial: '+64', flag: '🇳🇿' },
  { code: 'ZA', name: 'South Africa', dial: '+27', flag: '🇿🇦' },
  { code: 'GH', name: 'Ghana', dial: '+233', flag: '🇬🇭' },
  { code: 'KE', name: 'Kenya', dial: '+254', flag: '🇰🇪' },
  { code: 'EG', name: 'Egypt', dial: '+20', flag: '🇪🇬' },
  { code: 'IN', name: 'India', dial: '+91', flag: '🇮🇳' },
  { code: 'PK', name: 'Pakistan', dial: '+92', flag: '🇵🇰' },
  { code: 'BD', name: 'Bangladesh', dial: '+880', flag: '🇧🇩' },
  { code: 'PH', name: 'Philippines', dial: '+63', flag: '🇵🇭' },
  { code: 'ID', name: 'Indonesia', dial: '+62', flag: '🇮🇩' },
  { code: 'MY', name: 'Malaysia', dial: '+60', flag: '🇲🇾' },
  { code: 'SG', name: 'Singapore', dial: '+65', flag: '🇸🇬' },
  { code: 'JP', name: 'Japan', dial: '+81', flag: '🇯🇵' },
  { code: 'KR', name: 'South Korea', dial: '+82', flag: '🇰🇷' },
  { code: 'CN', name: 'China', dial: '+86', flag: '🇨🇳' },
  { code: 'HK', name: 'Hong Kong', dial: '+852', flag: '🇭🇰' },
  { code: 'AE', name: 'United Arab Emirates', dial: '+971', flag: '🇦🇪' },
  { code: 'SA', name: 'Saudi Arabia', dial: '+966', flag: '🇸🇦' },
  { code: 'TR', name: 'Turkey', dial: '+90', flag: '🇹🇷' },
  { code: 'DE', name: 'Germany', dial: '+49', flag: '🇩🇪' },
  { code: 'FR', name: 'France', dial: '+33', flag: '🇫🇷' },
  { code: 'IT', name: 'Italy', dial: '+39', flag: '🇮🇹' },
  { code: 'ES', name: 'Spain', dial: '+34', flag: '🇪🇸' },
  { code: 'PT', name: 'Portugal', dial: '+351', flag: '🇵🇹' },
  { code: 'NL', name: 'Netherlands', dial: '+31', flag: '🇳🇱' },
  { code: 'BE', name: 'Belgium', dial: '+32', flag: '🇧🇪' },
  { code: 'CH', name: 'Switzerland', dial: '+41', flag: '🇨🇭' },
  { code: 'SE', name: 'Sweden', dial: '+46', flag: '🇸🇪' },
  { code: 'NO', name: 'Norway', dial: '+47', flag: '🇳🇴' },
  { code: 'DK', name: 'Denmark', dial: '+45', flag: '🇩🇰' },
  { code: 'FI', name: 'Finland', dial: '+358', flag: '🇫🇮' },
  { code: 'PL', name: 'Poland', dial: '+48', flag: '🇵🇱' },
  { code: 'RU', name: 'Russia', dial: '+7', flag: '🇷🇺' },
  { code: 'UA', name: 'Ukraine', dial: '+380', flag: '🇺🇦' },
  { code: 'BR', name: 'Brazil', dial: '+55', flag: '🇧🇷' },
  { code: 'AR', name: 'Argentina', dial: '+54', flag: '🇦🇷' },
  { code: 'MX', name: 'Mexico', dial: '+52', flag: '🇲🇽' },
  { code: 'CL', name: 'Chile', dial: '+56', flag: '🇨🇱' },
  { code: 'CO', name: 'Colombia', dial: '+57', flag: '🇨🇴' },
  { code: 'PE', name: 'Peru', dial: '+51', flag: '🇵🇪' },
];

function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 via-white to-emerald-50">
      <p className="text-green-700 font-medium">Loading your session...</p>
    </div>
  );
}

// ============================================
// TOOLTIP WRAPPER COMPONENT
// ============================================
const HelpTooltip = ({ content, children }: { content: string; children: React.ReactNode }) => (
  <TooltipProvider>
    <Tooltip>
      <TooltipTrigger asChild>
        {children}
      </TooltipTrigger>
      <TooltipContent 
        side="top" 
        className="bg-green-900 text-white px-3 py-2 rounded-lg text-sm max-w-xs z-50"
      >
        <p>{content}</p>
      </TooltipContent>
    </Tooltip>
  </TooltipProvider>
);

// Dashboard loaders: aligned with the Supabase schema defined in
// supabase/migrations/20260413190000_paypill_core_schema.sql
// Tables: user_medications, smart_contracts, medication_doses (all keyed by user_id).
async function loadDashboardMedications(userId: string): Promise<{ rows: any[]; error: unknown | null }> {
  const r = await supabase
    .from('user_medications')
    .select('id,name,dosage,frequency,is_active')
    .eq('user_id', userId)
    .eq('is_active', true)
    .limit(5);
  return { rows: r.data ?? [], error: r.error };
}

async function loadDashboardContracts(userId: string): Promise<{ rows: any[]; error: unknown | null }> {
  const r = await supabase
    .from('smart_contracts')
    .select('id,period_end,locked_price_cents,quantity_description,status')
    .eq('user_id', userId)
    .eq('status', 'active');
  return { rows: r.data ?? [], error: r.error };
}

async function loadDashboardAdherence(userId: string, sinceIso: string): Promise<{ rows: any[]; error: unknown | null }> {
  const r = await supabase
    .from('medication_doses')
    .select('status,scheduled_for')
    .eq('user_id', userId)
    .gte('scheduled_for', sinceIso)
    .order('scheduled_for', { ascending: false })
    .limit(200);
  return { rows: r.data ?? [], error: r.error };
}

async function loadDashboardSections(
  userId: string,
  sinceIso: string
): Promise<
  [
    { rows: any[]; error: unknown | null },
    { rows: any[]; error: unknown | null },
    { rows: any[]; error: unknown | null },
  ]
> {
  return Promise.all([
    loadDashboardMedications(userId),
    loadDashboardContracts(userId),
    loadDashboardAdherence(userId, sinceIso),
  ]);
}

// ============================================
// SIGN IN PAGE
// ============================================
function SignInPage() {
  const navigate = useNavigate();
  const signIn = usePaypillStore((s) => s.signIn);
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await signIn({ email, password });
      toast.success('Signed in successfully');
      navigate('/onboarding');
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unable to sign in. Please verify your credentials.';
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 flex">
      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <div className="absolute inset-0 bg-grid opacity-50" />
        <div className="absolute top-20 left-20 w-64 h-64 bg-green-200/30 rounded-full blur-3xl float" />
        <div className="absolute bottom-20 right-20 w-80 h-80 bg-emerald-200/30 rounded-full blur-3xl float" style={{ animationDelay: '2s' }} />
        
        <div className="relative z-10 flex flex-col justify-center px-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="flex items-center gap-3 mb-8">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-green">
                <Pill className="w-7 h-7 text-white" />
              </div>
              <span className="text-3xl font-bold gradient-text">PayPill</span>
            </div>
            
            <h1 className="text-4xl font-bold text-green-900 mb-6 leading-tight">
              Welcome back to<br />
              <span className="gradient-text">better health</span>
            </h1>
            
            <p className="text-green-700 text-lg mb-10 max-w-md">
              Access your personalized medication recommendations, track adherence, and manage your prescriptions all in one place.
            </p>
            
            <div className="space-y-4">
              {[
                { icon: Shield, text: 'HIPAA-compliant & secure' },
                { icon: Sparkles, text: 'AI-powered treatment analysis' },
                { icon: CheckCircle, text: 'Save up to 50% on medications' }
              ].map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + i * 0.1 }}
                  className="flex items-center gap-3"
                >
                  <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
                    <item.icon className="w-5 h-5 text-green-600" />
                  </div>
                  <span className="text-green-800 font-medium">{item.text}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center justify-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
              <Pill className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold gradient-text">PayPill</span>
          </div>

          <Card className="border-green-100 shadow-xl bg-white/80 backdrop-blur-sm">
            <CardContent className="p-8">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-green-900 mb-2">Sign in to your account</h2>
                <p className="text-green-600">
                  Don't have an account?{' '}
                  <button 
                    onClick={() => navigate('/signup')}
                    className="text-green-600 font-semibold hover:text-green-700 underline underline-offset-2"
                  >
                    Sign up
                  </button>
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Email Field */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="email" className="text-green-800 font-medium">Email address</Label>
                    <HelpTooltip content="Enter the email address you used to register with PayPill">
                      <button type="button" className="w-5 h-5 rounded-full bg-green-100 text-green-600 hover:bg-green-200 transition-colors flex items-center justify-center">
                        <Info className="w-3 h-3" />
                      </button>
                    </HelpTooltip>
                  </div>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-green-400" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-11 h-12 bg-green-50/50 border-green-200 text-green-900 placeholder:text-green-400 focus:border-green-500 focus:ring-green-500/20"
                      required
                    />
                  </div>
                </div>

                {/* Password Field */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password" className="text-green-800 font-medium">Password</Label>
                    <HelpTooltip content="Your password must be at least 8 characters with uppercase, lowercase, and numbers">
                      <button type="button" className="w-5 h-5 rounded-full bg-green-100 text-green-600 hover:bg-green-200 transition-colors flex items-center justify-center">
                        <Info className="w-3 h-3" />
                      </button>
                    </HelpTooltip>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-green-400" />
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-11 pr-11 h-12 bg-green-50/50 border-green-200 text-green-900 placeholder:text-green-400 focus:border-green-500 focus:ring-green-500/20"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-green-400 hover:text-green-600 transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                {/* Remember Me & Forgot Password */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="remember"
                      checked={rememberMe}
                      onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                      className="border-green-300 data-[state=checked]:bg-green-500 data-[state=checked]:border-green-500"
                    />
                    <Label htmlFor="remember" className="text-sm text-green-700 cursor-pointer">Remember me</Label>
                  </div>
                  <button
                    type="button"
                    onClick={() => navigate('/forgot-password')}
                    className="text-sm text-green-600 hover:text-green-700 font-medium"
                  >
                    Forgot password?
                  </button>
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full h-12 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold rounded-xl shadow-green transition-all duration-200 hover:shadow-lg"
                >
                  {isSubmitting ? 'Signing in...' : 'Sign in'}
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>

                {/* Divider */}
                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-green-200" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-4 bg-white text-green-500">Or continue with</span>
                  </div>
                </div>

                {/* Social Login */}
                <div className="grid grid-cols-2 gap-4">
                  <Button
                    type="button"
                    variant="outline"
                    className="h-12 border-green-200 hover:bg-green-50 text-green-700"
                  >
                    <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                      <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                      <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                    </svg>
                    Google
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="h-12 border-green-200 hover:bg-green-50 text-green-700"
                  >
                    <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.22 7.13-.57 1.5-1.31 2.99-2.27 4.08zm-5.85-15.1c.07-2.04 1.76-3.79 3.78-3.94.29 2.32-1.93 4.48-3.78 3.94z" />
                    </svg>
                    Apple
                  </Button>
                </div>
              </form>

              {/* Security Badges */}
              <div className="mt-6 flex items-center justify-center gap-4 text-xs text-green-600">
                <div className="flex items-center gap-1">
                  <Shield className="w-3 h-3" />
                  <span>HIPAA Secure</span>
                </div>
                <div className="flex items-center gap-1">
                  <Lock className="w-3 h-3" />
                  <span>256-bit SSL</span>
                </div>
              </div>

              <p className="mt-4 text-center text-xs text-green-500">
                By signing in, you agree to our{' '}
                <a href="#" className="underline hover:text-green-700">Terms of Service</a> and{' '}
                <a href="#" className="underline hover:text-green-700">Privacy Policy</a>
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}

// ============================================
// PASSWORD RECOVERY PAGES
// ============================================
function ForgotPasswordPage() {
  const navigate = useNavigate();
  const requestPasswordReset = usePaypillStore((s) => s.requestPasswordReset);
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mailSent, setMailSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const redirectTo = `${window.location.origin}/reset-password`;
      await requestPasswordReset(email, redirectTo);
      setMailSent(true);
      toast.success('Reset email sent. Check your inbox and spam folder.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to send reset email.';
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <Card className="border-green-100 shadow-xl bg-white/90 backdrop-blur-sm">
          <CardContent className="p-8 space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-green-900 mb-2">Reset your password</h2>
              <p className="text-green-600">Enter your account email to receive a secure reset link.</p>
            </div>

            {mailSent ? (
              <div className="rounded-xl border border-green-100 bg-green-50 p-4 text-sm text-green-700">
                If an account exists for <span className="font-semibold">{email}</span>, a reset link has been sent.
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="recoveryEmail" className="text-green-800 font-medium">Email address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-green-400" />
                    <Input
                      id="recoveryEmail"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="pl-11 h-12 bg-green-50/50 border-green-200 text-green-900 placeholder:text-green-400"
                      required
                    />
                  </div>
                </div>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full h-12 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white"
                >
                  {isSubmitting ? 'Sending reset link...' : 'Send reset link'}
                </Button>
              </form>
            )}

            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/signin')}
              className="w-full border-green-200 text-green-700 hover:bg-green-50"
            >
              Back to sign in
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function ResetPasswordPage() {
  const navigate = useNavigate();
  const updatePassword = usePaypillStore((s) => s.updatePassword);
  const [nextPassword, setNextPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasRecoverySession, setHasRecoverySession] = useState(false);

  useEffect(() => {
    let mounted = true;
    void supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setHasRecoverySession(Boolean(data.session?.user));
    });
    return () => {
      mounted = false;
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (nextPassword.length < 8) {
      toast.error('Password must be at least 8 characters.');
      return;
    }
    if (nextPassword !== confirmPassword) {
      toast.error('Passwords do not match.');
      return;
    }

    setIsSubmitting(true);
    try {
      await updatePassword(nextPassword);
      toast.success('Password updated successfully. Please sign in.');
      await supabase.auth.signOut();
      navigate('/signin');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to update password.';
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <Card className="border-green-100 shadow-xl bg-white/90 backdrop-blur-sm">
          <CardContent className="p-8 space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-green-900 mb-2">Set a new password</h2>
              <p className="text-green-600">Create a strong password for your PayPill account.</p>
            </div>

            {!hasRecoverySession && (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                <span>Recovery session not found. Open the reset link from your email again.</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="newPassword" className="text-green-800 font-medium">New password</Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={nextPassword}
                  onChange={(e) => setNextPassword(e.target.value)}
                  placeholder="At least 8 characters"
                  className="h-12 bg-green-50/50 border-green-200 text-green-900"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-green-800 font-medium">Confirm password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter password"
                  className="h-12 bg-green-50/50 border-green-200 text-green-900"
                  required
                />
              </div>
              <Button
                type="submit"
                disabled={!hasRecoverySession || isSubmitting}
                className="w-full h-12 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white"
              >
                {isSubmitting ? 'Updating password...' : 'Update password'}
              </Button>
            </form>

            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/signin')}
              className="w-full border-green-200 text-green-700 hover:bg-green-50"
            >
              Back to sign in
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ============================================
// SIGN UP PAGE
// ============================================
function SignUpPage() {
  const navigate = useNavigate();
  const signUp = usePaypillStore((s) => s.signUp);
  const verifySignUpCode = usePaypillStore((s) => s.verifySignUpCode);
  const [step, setStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [awaitingVerification, setAwaitingVerification] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [verificationEmail, setVerificationEmail] = useState('');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    dobMonth: '',
    dobDay: '',
    dobYear: '',
    countryCode: 'US',
    phoneNumber: '',
    conditions: [] as string[],
    allergies: [] as string[],
    acceptedConsent: false,
  });

  const selectedDial =
    COUNTRY_DIAL_CODES.find((c) => c.code === formData.countryCode)?.dial ?? '+1';

  /** Prefer a new tab (keeps signup state). If blocked, `window.open` may be null or a immediately-closed window — fall back in-app. */
  const openLegalDoc = (path: '/terms' | '/hipaa') => {
    // #region agent log
    const _agentLog = (
      message: string,
      data: Record<string, unknown>,
      hypothesisId: string,
      runId: string = 'legal-doc-debug-1'
    ) => {
      void fetch('http://127.0.0.1:7259/ingest/7c275fcd-f7d5-40bd-913a-f20dfce11162', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': 'acc874' },
        body: JSON.stringify({
          sessionId: 'acc874',
          location: 'App.tsx:SignUpPage.openLegalDoc',
          message,
          data,
          timestamp: Date.now(),
          hypothesisId,
          runId,
        }),
      }).catch(() => {});
    };
    // #endregion
    const url = `${window.location.origin}${path}`;
    _agentLog('openLegalDoc entry', { path }, 'H4');

    let didFallback = false;
    const runFallback = (reason: string) => {
      if (didFallback) {
        _agentLog('runFallback skipped (already)', { path, reason }, 'H2', 'legal-doc-verify');
        return;
      }
      didFallback = true;
      _agentLog('runFallback', { path, reason }, 'H1', 'legal-doc-verify');
      toast.warning(
        'Pop-up blocked by your browser. Opening the document in this tab — use the browser Back button to return to signup.',
        { duration: 9000 }
      );
      navigate(path);
      _agentLog('navigate after fallback', { path, reason }, 'H2', 'legal-doc-verify');
    };

    let win: Window | null = null;
    try {
      win = window.open(url, '_blank', 'noopener,noreferrer');
    } catch (e) {
      _agentLog('window.open threw', { path, err: String(e) }, 'H3');
      runFallback('open-threw');
      return;
    }
    _agentLog(
      'after window.open (sync)',
      { path, winIsNull: win === null, winClosed: win?.closed },
      'H1'
    );
    if (win == null || win.closed) {
      runFallback(win == null ? 'win-null' : 'win-closed-sync');
      return;
    }
    queueMicrotask(() => {
      _agentLog('after window.open (microtask)', { path, winClosed: win.closed }, 'H1');
      if (win.closed) {
        runFallback('win-closed-microtask');
      } else {
        _agentLog('new tab assumed open', { path }, 'H1');
      }
    });
  };

  const handleContinue = async () => {
    if (step === 1 && !formData.acceptedConsent) {
      toast.error('Please accept the Terms of Service and HIPAA Notice of Privacy Practices to continue.');
      return;
    }
    if (step < 3) {
      setStep(step + 1);
    } else {
      setIsSubmitting(true);
      try {
        const name = `${formData.firstName} ${formData.lastName}`.trim() || 'New User';
        const result = await signUp({ email: formData.email, password: formData.password, name });

        // Persist consent timestamps (Epic 1 Story 1.1 / PRD F-001). Best-effort —
        // the profile row is created by the on_auth_user_created trigger; if it
        // is not there yet (email verification flow), the update is a no-op.
        const consentIso = new Date().toISOString();
        const {
          data: { session: postSignUpSession },
        } = await supabase.auth.getSession();
        const postSignUpUserId = postSignUpSession?.user?.id;
        if (postSignUpUserId) {
          await supabase
            .from('profiles')
            .update({ hipaa_consent_at: consentIso, terms_accepted_at: consentIso })
            .eq('id', postSignUpUserId);
        }

        if (result.requiresVerification) {
          setVerificationEmail(formData.email.trim().toLowerCase());
          setAwaitingVerification(true);
          toast.success('Account created. Enter the verification code sent to your email.');
        } else {
          toast.success('Account created successfully');
          navigate('/onboarding');
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unable to create account.';
        toast.error(message);
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const handleVerifyCode = async () => {
    setIsSubmitting(true);
    try {
      await verifySignUpCode(verificationEmail, verificationCode);
      toast.success('Email verified successfully');
      navigate('/onboarding');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to verify code.';
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const steps = [
    { number: 1, label: 'Account' },
    { number: 2, label: 'Profile' },
    { number: 3, label: 'Health' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 flex">
      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <div className="absolute inset-0 bg-grid opacity-50" />
        <div className="absolute top-20 left-20 w-64 h-64 bg-green-200/30 rounded-full blur-3xl float" />
        <div className="absolute bottom-20 right-20 w-80 h-80 bg-emerald-200/30 rounded-full blur-3xl float" style={{ animationDelay: '2s' }} />
        
        <div className="relative z-10 flex flex-col justify-center px-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="flex items-center gap-3 mb-8">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-green">
                <Pill className="w-7 h-7 text-white" />
              </div>
              <span className="text-3xl font-bold gradient-text">PayPill</span>
            </div>
            
            <h1 className="text-4xl font-bold text-green-900 mb-6 leading-tight">
              Start your journey to<br />
              <span className="gradient-text">affordable medications</span>
            </h1>
            
            <p className="text-green-700 text-lg mb-10 max-w-md">
              Join thousands of patients saving up to 50% on their prescriptions with AI-powered recommendations and transparent pricing.
            </p>
            
            <div className="space-y-4">
              {[
                { icon: Heart, text: 'Personalized treatment plans' },
                { icon: Sparkles, text: 'AI-powered medication analysis' },
                { icon: Shield, text: 'Secure, HIPAA-compliant platform' }
              ].map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + i * 0.1 }}
                  className="flex items-center gap-3"
                >
                  <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
                    <item.icon className="w-5 h-5 text-green-600" />
                  </div>
                  <span className="text-green-800 font-medium">{item.text}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center justify-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
              <Pill className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold gradient-text">PayPill</span>
          </div>

          <Card className="border-green-100 shadow-xl bg-white/80 backdrop-blur-sm">
            <CardContent className="p-8">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-green-900 mb-2">Create your account</h2>
                <p className="text-green-600">
                  Already have an account?{' '}
                  <button 
                    onClick={() => navigate('/signin')}
                    className="text-green-600 font-semibold hover:text-green-700 underline underline-offset-2"
                  >
                    Sign in
                  </button>
                </p>
              </div>

              {awaitingVerification && (
                <div className="space-y-5">
                  <div className="rounded-xl border border-green-100 bg-green-50/50 p-4">
                    <p className="text-sm text-green-700">
                      Enter the verification code sent to <span className="font-semibold">{verificationEmail}</span>.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="verificationCode" className="text-green-800 font-medium">
                      Verification Code
                    </Label>
                    <Input
                      id="verificationCode"
                      type="text"
                      value={verificationCode}
                      onChange={(e) => setVerificationCode(e.target.value)}
                      placeholder="Enter your verification code"
                      className="h-12 bg-green-50/50 border-green-200 text-green-900 placeholder:text-green-400 focus:border-green-500 focus:ring-green-500/20"
                    />
                  </div>
                  <Button
                    type="button"
                    onClick={handleVerifyCode}
                    disabled={isSubmitting || verificationCode.trim().length === 0}
                    className="w-full h-12 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold rounded-xl shadow-green transition-all duration-200 hover:shadow-lg"
                  >
                    {isSubmitting ? 'Verifying...' : 'Verify Code'}
                    <CheckCircle className="w-5 h-5 ml-2" />
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    disabled={isSubmitting}
                    onClick={() => {
                      setAwaitingVerification(false);
                      setVerificationCode('');
                    }}
                    className="w-full border-green-200 text-green-700 hover:bg-green-50"
                  >
                    Back to Signup
                  </Button>
                </div>
              )}

              {!awaitingVerification && (
                <>
              {/* Progress Steps */}
              <div className="mb-8">
                <div className="flex items-center justify-between">
                  {steps.map((s, i) => (
                    <div key={s.number} className="flex items-center">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                        step >= s.number 
                          ? 'bg-green-500 text-white' 
                          : 'bg-green-100 text-green-400'
                      }`}>
                        {s.number}
                      </div>
                      <span className={`ml-2 text-sm ${
                        step >= s.number ? 'text-green-700 font-medium' : 'text-green-400'
                      }`}>
                        {s.label}
                      </span>
                      {i < steps.length - 1 && (
                        <div className={`w-12 h-0.5 mx-2 ${
                          step > s.number ? 'bg-green-500' : 'bg-green-200'
                        }`} />
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Step 1: Account Info */}
              {step === 1 && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="space-y-5"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="email" className="text-green-800 font-medium">Email address</Label>
                      <HelpTooltip content="We'll use this email for account notifications and important updates">
                        <button type="button" className="w-5 h-5 rounded-full bg-green-100 text-green-600 hover:bg-green-200 transition-colors flex items-center justify-center">
                          <Info className="w-3 h-3" />
                        </button>
                      </HelpTooltip>
                    </div>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-green-400" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="you@example.com"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="pl-11 h-12 bg-green-50/50 border-green-200 text-green-900 placeholder:text-green-400 focus:border-green-500 focus:ring-green-500/20"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="password" className="text-green-800 font-medium">Create password</Label>
                      <HelpTooltip content="Use 8+ characters with uppercase, lowercase, and numbers for security">
                        <button type="button" className="w-5 h-5 rounded-full bg-green-100 text-green-600 hover:bg-green-200 transition-colors flex items-center justify-center">
                          <Info className="w-3 h-3" />
                        </button>
                      </HelpTooltip>
                    </div>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-green-400" />
                      <Input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Create a strong password"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        className="pl-11 pr-11 h-12 bg-green-50/50 border-green-200 text-green-900 placeholder:text-green-400 focus:border-green-500 focus:ring-green-500/20"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-green-400 hover:text-green-600 transition-colors"
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                    <div className="flex gap-1 mt-2">
                      {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="h-1 flex-1 rounded-full bg-green-200" />
                      ))}
                    </div>
                    <p className="text-xs text-green-500">Use 8+ characters with uppercase, lowercase, and numbers</p>
                  </div>

                  <div className="flex items-start gap-3 rounded-xl border border-green-100 bg-green-50/50 p-3">
                    <Checkbox
                      id="consent"
                      checked={formData.acceptedConsent}
                      onCheckedChange={(value) =>
                        setFormData({ ...formData, acceptedConsent: value === true })
                      }
                      aria-label="I accept the Terms of Service and HIPAA Notice of Privacy Practices"
                      className="mt-1 border-green-300 data-[state=checked]:bg-green-500"
                    />
                    {/* Do not wrap Links in <Label htmlFor="consent"> — that captures clicks and toggles the checkbox instead of navigating. */}
                    <div className="text-sm font-normal leading-relaxed text-green-800 min-w-0 flex-1">
                      I acknowledge the{' '}
                      <button
                        type="button"
                        className="font-semibold text-green-700 underline hover:text-green-900 p-0 h-auto min-h-0 bg-transparent border-0 shadow-none cursor-pointer inline text-left"
                        onClick={() => openLegalDoc('/terms')}
                      >
                        Terms of Service
                      </button>{' '}
                      and the{' '}
                      <button
                        type="button"
                        className="font-semibold text-green-700 underline hover:text-green-900 p-0 h-auto min-h-0 bg-transparent border-0 shadow-none cursor-pointer inline text-left"
                        onClick={() => openLegalDoc('/hipaa')}
                      >
                        HIPAA Notice of Privacy Practices
                      </button>
                      , and I consent to the secure handling of my health information as described.
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Step 2: Profile Info */}
              {step === 2 && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="space-y-5"
                >
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName" className="text-green-800 font-medium">First name</Label>
                      <Input
                        id="firstName"
                        placeholder="John"
                        value={formData.firstName}
                        onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                        className="h-12 bg-green-50/50 border-green-200 text-green-900 placeholder:text-green-400 focus:border-green-500 focus:ring-green-500/20"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName" className="text-green-800 font-medium">Last name</Label>
                      <Input
                        id="lastName"
                        placeholder="Doe"
                        value={formData.lastName}
                        onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                        className="h-12 bg-green-50/50 border-green-200 text-green-900 placeholder:text-green-400 focus:border-green-500 focus:ring-green-500/20"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-green-800 font-medium">Date of Birth</Label>
                    <div className="grid grid-cols-3 gap-2">
                      <Input
                        placeholder="MM"
                        inputMode="numeric"
                        maxLength={2}
                        value={formData.dobMonth}
                        onChange={(e) =>
                          setFormData({ ...formData, dobMonth: e.target.value.replace(/\D/g, '') })
                        }
                        className="h-12 bg-green-50/50 border-green-200 text-green-900 placeholder:text-green-400"
                      />
                      <Input
                        placeholder="DD"
                        inputMode="numeric"
                        maxLength={2}
                        value={formData.dobDay}
                        onChange={(e) =>
                          setFormData({ ...formData, dobDay: e.target.value.replace(/\D/g, '') })
                        }
                        className="h-12 bg-green-50/50 border-green-200 text-green-900 placeholder:text-green-400"
                      />
                      <Input
                        placeholder="YYYY"
                        inputMode="numeric"
                        maxLength={4}
                        value={formData.dobYear}
                        onChange={(e) =>
                          setFormData({ ...formData, dobYear: e.target.value.replace(/\D/g, '') })
                        }
                        className="h-12 bg-green-50/50 border-green-200 text-green-900 placeholder:text-green-400"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-green-800 font-medium">Phone Number</Label>
                    <div className="flex gap-2">
                      <Select
                        value={formData.countryCode}
                        onValueChange={(value) =>
                          setFormData({ ...formData, countryCode: value })
                        }
                      >
                        <SelectTrigger
                          aria-label="Country code"
                          className="w-32 h-12 bg-green-50/50 border-green-200 text-green-900 focus:ring-green-500/20"
                        >
                          <SelectValue>
                            {(() => {
                              const c = COUNTRY_DIAL_CODES.find(
                                (x) => x.code === formData.countryCode
                              );
                              return c ? (
                                <span className="flex items-center gap-1">
                                  <span>{c.flag}</span>
                                  <span className="font-medium">{c.dial}</span>
                                </span>
                              ) : (
                                '+1'
                              );
                            })()}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent className="max-h-72">
                          {COUNTRY_DIAL_CODES.map((c) => (
                            <SelectItem key={c.code} value={c.code}>
                              <span className="flex items-center gap-2">
                                <span>{c.flag}</span>
                                <span>{c.name}</span>
                                <span className="text-green-600">({c.dial})</span>
                              </span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Input
                        type="tel"
                        inputMode="tel"
                        placeholder="(555) 000-0000"
                        value={formData.phoneNumber}
                        onChange={(e) =>
                          setFormData({ ...formData, phoneNumber: e.target.value })
                        }
                        className="flex-1 h-12 bg-green-50/50 border-green-200 text-green-900 placeholder:text-green-400"
                      />
                    </div>
                    {formData.phoneNumber && (
                      <p className="text-xs text-green-500">
                        Will be saved as{' '}
                        <span className="font-medium">
                          {selectedDial} {formData.phoneNumber}
                        </span>
                      </p>
                    )}
                  </div>
                </motion.div>
              )}

              {/* Step 3: Health Profile */}
              {step === 3 && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="space-y-5"
                >
                  <div className="space-y-2">
                    <Label className="text-green-800 font-medium">Medical Conditions</Label>
                    <HelpTooltip content="Select all conditions that apply to you. This helps our AI provide better recommendations.">
                      <button type="button" className="w-5 h-5 rounded-full bg-green-100 text-green-600 hover:bg-green-200 transition-colors flex items-center justify-center mb-2">
                        <Info className="w-3 h-3" />
                      </button>
                    </HelpTooltip>
                    <div className="flex flex-wrap gap-2">
                      {['Type 2 Diabetes', 'Hypertension', 'High Cholesterol', 'Asthma', 'Arthritis'].map((condition) => (
                        <button
                          key={condition}
                          type="button"
                          onClick={() => {
                            const newConditions = formData.conditions.includes(condition)
                              ? formData.conditions.filter(c => c !== condition)
                              : [...formData.conditions, condition];
                            setFormData({ ...formData, conditions: newConditions });
                          }}
                          className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                            formData.conditions.includes(condition)
                              ? 'bg-green-500 text-white'
                              : 'bg-green-100 text-green-700 hover:bg-green-200'
                          }`}
                        >
                          {condition}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-green-800 font-medium">Allergies</Label>
                    <div className="flex flex-wrap gap-2">
                      {['Penicillin', 'Sulfa drugs', 'NSAIDs', 'Latex', 'None'].map((allergy) => (
                        <button
                          key={allergy}
                          type="button"
                          onClick={() => {
                            const newAllergies = formData.allergies.includes(allergy)
                              ? formData.allergies.filter(a => a !== allergy)
                              : [...formData.allergies, allergy];
                            setFormData({ ...formData, allergies: newAllergies });
                          }}
                          className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                            formData.allergies.includes(allergy)
                              ? 'bg-green-500 text-white'
                              : 'bg-green-100 text-green-700 hover:bg-green-200'
                          }`}
                        >
                          {allergy}
                        </button>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Navigation Buttons */}
              <div className="flex gap-3 mt-6">
                {step > 1 && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setStep(step - 1)}
                    className="flex-1 h-12 border-green-200 text-green-700 hover:bg-green-50"
                  >
                    <ChevronLeft className="w-5 h-5 mr-2" />
                    Back
                  </Button>
                )}
                <Button
                  type="button"
                  disabled={isSubmitting}
                  onClick={handleContinue}
                  className="flex-1 h-12 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold rounded-xl shadow-green transition-all duration-200 hover:shadow-lg"
                >
                  {step === 3 ? (isSubmitting ? 'Creating Account...' : 'Create Account') : 'Continue'}
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </div>

              <p className="mt-4 text-center text-xs text-green-500">
                By creating an account, you agree to our{' '}
                <a href="#" className="underline hover:text-green-700">Terms</a> and{' '}
                <a href="#" className="underline hover:text-green-700">Privacy Policy</a>
              </p>
                </>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}

// ============================================
// ONBOARDING PAGE
// ============================================
function OnboardingPage() {
  const navigate = useNavigate();
  const completeOnboarding = usePaypillStore((s) => s.completeOnboarding);
  const [step, setStep] = useState(0);

  const steps = [
    {
      title: 'Welcome to PayPill',
      description: 'Let\'s set up your profile to get personalized medication recommendations and transparent pricing through our AI-powered platform.',
      icon: Sparkles,
      features: [
        { icon: Shield, text: 'HIPAA-compliant secure platform' },
        { icon: Brain, text: 'AI-powered treatment analysis' },
        { icon: FileText, text: 'Blockchain-secured smart contracts' }
      ]
    },
    {
      title: 'Connect Your Wallet',
      description: 'Link your XRP Ledger wallet to enable secure smart contracts for medication pricing and automatic refills.',
      icon: Wallet,
      features: [
        { icon: Lock, text: 'Secure blockchain transactions' },
        { icon: CheckCircle, text: 'Fixed pricing for 30 days' },
        { icon: RefreshCw, text: 'Automatic monthly renewals' }
      ]
    },
    {
      title: 'Add Your Medications',
      description: 'Tell us about your current prescriptions so we can analyze them and find better alternatives.',
      icon: Pill,
      features: [
        { icon: Search, text: 'Search 10,000+ medications' },
        { icon: TrendingUp, text: 'Compare prices instantly' },
        { icon: Heart, text: 'Find generic alternatives' }
      ]
    },
    {
      title: 'Get AI Analysis',
      description: 'Our AI will analyze your health profile and recommend the most effective, cost-efficient treatments.',
      icon: Brain,
      features: [
        { icon: Activity, text: 'Personalized recommendations' },
        { icon: BarChart3, text: 'Success probability scores' },
        { icon: Zap, text: 'Results in under 30 seconds' }
      ]
    },
    {
      title: 'You\'re All Set!',
      description: 'Your PayPill dashboard is ready. Start exploring your personalized medication management experience.',
      icon: CheckCircle,
      features: [
        { icon: Calendar, text: 'Track medication schedule' },
        { icon: TrendingUp, text: 'Monitor adherence' },
        { icon: CreditCard, text: 'Save on prescriptions' }
      ]
    }
  ];

  const handleNext = async () => {
    if (step < steps.length - 1) {
      setStep(step + 1);
    } else {
      try {
        await completeOnboarding();
        navigate('/dashboard');
      } catch {
        toast.error('Unable to complete onboarding right now.');
      }
    }
  };

  const handleSkip = async () => {
    try {
      await completeOnboarding();
      navigate('/dashboard');
    } catch {
      toast.error('Unable to skip onboarding right now.');
    }
  };

  const currentStep = steps[step];
  const Icon = currentStep.icon;

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
            <Pill className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold gradient-text">PayPill</span>
        </div>
        <button
          onClick={handleSkip}
          className="text-green-600 hover:text-green-700 font-medium text-sm"
        >
          Skip for now
        </button>
      </header>

      {/* Progress Bar */}
      <div className="px-6 mb-8">
        <div className="h-1 bg-green-100 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-green-500 to-emerald-500"
            initial={{ width: 0 }}
            animate={{ width: `${((step + 1) / steps.length) * 100}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
        <div className="flex justify-between mt-2 text-xs text-green-500">
          {steps.map((_, i) => (
            <span key={i} className={i <= step ? 'text-green-700 font-medium' : ''}>
              {['Welcome', 'Wallet', 'Meds', 'AI', 'Done'][i]}
            </span>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center px-6 pb-8">
        <motion.div
          key={step}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
          className="w-full max-w-lg"
        >
          <Card className="border-green-100 shadow-xl bg-white/90 backdrop-blur-sm">
            <CardContent className="p-8 text-center">
              {/* Icon */}
              <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-green">
                <Icon className="w-10 h-10 text-white" />
              </div>

              {/* Title & Description */}
              <h2 className="text-2xl font-bold text-green-900 mb-3">{currentStep.title}</h2>
              <p className="text-green-600 mb-8">{currentStep.description}</p>

              {/* Features */}
              <div className="space-y-3 mb-8">
                {currentStep.features.map((feature, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 + i * 0.1 }}
                    className="flex items-center gap-3 justify-center"
                  >
                    <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center">
                      <feature.icon className="w-4 h-4 text-green-600" />
                    </div>
                    <span className="text-green-700">{feature.text}</span>
                  </motion.div>
                ))}
              </div>

              {/* Action Button */}
              <Button
                onClick={handleNext}
                className="w-full h-12 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold rounded-xl shadow-green transition-all duration-200 hover:shadow-lg"
              >
                {step === steps.length - 1 ? 'Get Started' : 'Continue'}
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}

// ============================================
// DASHBOARD LAYOUT
// ============================================
function DashboardLayout({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const signOut = usePaypillStore((s) => s.signOut);
  const user = usePaypillStore((s) => s.user);
  const displayName = user?.name ?? 'Guest';
  const ppll = user?.ppllBalance ?? 0;
  const initials = userInitials(displayName);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navItems = [
    { path: '/dashboard', label: 'Overview', icon: Layers },
    { path: '/dashboard/ai-analysis', label: 'AI Analysis', icon: Brain, badge: 'AI' },
    { path: '/dashboard/treatments', label: 'My Treatments', icon: Pill },
    { path: '/dashboard/contracts', label: 'Smart Contracts', icon: FileText },
    { path: '/dashboard/adherence', label: 'Adherence', icon: Activity },
    { path: '/dashboard/settings', label: 'Settings', icon: Settings },
  ];

  const handleLogout = async () => {
    await signOut();
    navigate('/signin');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 flex">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/20 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-50 w-64 bg-white border-r border-green-100 flex flex-col
        transform transition-transform duration-300 lg:transform-none
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Logo */}
        <div className="p-6 border-b border-green-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
              <Pill className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold gradient-text">PayPill</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <HelpTooltip key={item.path} content={`View your ${item.label.toLowerCase()} and manage related settings`}>
                <button
                  onClick={() => {
                    navigate(item.path);
                    setSidebarOpen(false);
                  }}
                  className={`
                    w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all
                    ${isActive 
                      ? 'bg-green-100 text-green-800 font-medium' 
                      : 'text-green-600 hover:bg-green-50'
                    }
                  `}
                >
                  <item.icon className="w-5 h-5" />
                  <span>{item.label}</span>
                  {item.badge && (
                    <Badge className="ml-auto bg-green-500 text-white text-xs">{item.badge}</Badge>
                  )}
                </button>
              </HelpTooltip>
            );
          })}
        </nav>

        {/* Bottom Section */}
        <div className="p-4 border-t border-green-100 space-y-2">
          <HelpTooltip content="Get help with using PayPill and contact support">
            <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-green-600 hover:bg-green-50 transition-all text-left">
              <HelpCircle className="w-5 h-5" />
              <span>Help & Support</span>
            </button>
          </HelpTooltip>

          <div className="flex items-center gap-3 px-4 py-3">
            <Avatar className="w-10 h-10 bg-green-100">
              <AvatarFallback className="bg-green-100 text-green-700 font-semibold">{initials}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-green-900 truncate">{displayName}</p>
              <p className="text-xs text-green-500">{ppll.toLocaleString()} PPLL</p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-2 rounded-xl text-red-500 hover:bg-red-50 transition-all text-left text-sm"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="h-16 bg-white/80 backdrop-blur-sm border-b border-green-100 flex items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-lg hover:bg-green-50 text-green-600"
            >
              <Menu className="w-6 h-6" />
            </button>
            <div>
              <h1 className="text-lg font-semibold text-green-900">Dashboard</h1>
              <p className="text-xs text-green-500">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <HelpTooltip content="Your PPLL token balance - earn more by taking medications on time">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-100">
                <Sparkles className="w-4 h-4 text-green-600" />
                <span className="text-sm font-medium text-green-700">{ppll.toLocaleString()} PPLL</span>
              </div>
            </HelpTooltip>

            <HelpTooltip content="View your notifications">
              <button className="p-2 rounded-lg hover:bg-green-50 text-green-600 relative">
                <Bell className="w-5 h-5" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
              </button>
            </HelpTooltip>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-6 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}

// ============================================
// DASHBOARD OVERVIEW PAGE
// ============================================
function DashboardOverview() {
  const navigate = useNavigate();
  const user = usePaypillStore((s) => s.user);
  const firstName = (user?.name ?? 'there').split(/\s+/)[0] || 'there';
  const [isLoading, setIsLoading] = useState(true);
  const [medications, setMedications] = useState<Array<{ id: string; name: string; dosage: string; frequency: string; status: 'taken' | 'due' }>>([]);
  const [contracts, setContracts] = useState<Array<{ id: string; endDate: string | null; lockedPrice: number | null; quantity: string | null }>>([]);
  const [adherenceRate, setAdherenceRate] = useState(0);
  const [activities, setActivities] = useState<Array<{ text: string; time: string; reward: string }>>([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!user?.id) {
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      const sinceIso = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      try {
        let {
          data: { session },
        } = await supabase.auth.getSession();
        if (!session) {
          await supabase.auth.refreshSession();
          ({
            data: { session },
          } = await supabase.auth.getSession());
        }
        const effectiveUserId = session?.user?.id ?? user.id;

        let [medWrap, contractWrap, adherWrap] = await loadDashboardSections(effectiveUserId, sinceIso);

        const allFailed = (w: { error: unknown | null }) => Boolean(w.error);
        if (allFailed(medWrap) && allFailed(contractWrap) && allFailed(adherWrap)) {
          await supabase.auth.refreshSession();
          [medWrap, contractWrap, adherWrap] = await loadDashboardSections(effectiveUserId, sinceIso);
        }

        const meds = (medWrap.rows ?? []).map((m: any) => ({
          id: m.id,
          name: m.name ?? 'Medication',
          dosage: m.dosage,
          frequency: m.frequency,
          status: 'due' as const,
        }));
        setMedications(meds);

        const activeContracts = (contractWrap.rows ?? []).map((c: any) => ({
          id: c.id,
          endDate: c.period_end ?? null,
          lockedPrice:
            typeof c.locked_price_cents === 'number' ? c.locked_price_cents / 100 : null,
          quantity: c.quantity_description ?? null,
        }));
        setContracts(activeContracts);

        const events = adherWrap.rows ?? [];
        const taken = events.filter((e: any) => e.status === 'taken').length;
        const rate = events.length ? Math.round((taken / events.length) * 100) : 0;
        setAdherenceRate(rate);

        setActivities(
          events.slice(0, 4).map((e: any) => ({
            text: `Medication marked as ${e.status}`,
            time: e.scheduled_for ? new Date(e.scheduled_for).toLocaleString() : '',
            reward: '',
          }))
        );

        const failures = [medWrap.error, contractWrap.error, adherWrap.error].filter(Boolean);
        if (failures.length > 0 && failures.length < 3) {
          toast.warning('Some dashboard data could not be loaded.');
        }
        // Full failure after retry: keep UI calm — no technical PostgREST/JWT strings in a toast on reload.
        if (failures.length === 3) {
          console.warn('[PayPill] dashboard metrics unavailable', failures[0]);
        }
      } catch (error) {
        console.warn('[PayPill] dashboard load exception', error);
      } finally {
        setIsLoading(false);
      }
    };

    void fetchDashboardData();
  }, [user?.id]);

  // PRD token economics: 1 PPLL is pegged at $0.01 USD (see PRD §Blockchain Integration).
  const ppllBalance = user?.ppllBalance ?? 0;
  const ppllUsdValue = ppllBalance * 0.01;

  const stats = [
    {
      label: 'PPLL Balance',
      value: `${ppllBalance.toLocaleString()}`,
      subtext: `≈ $${ppllUsdValue.toFixed(2)} (1 PPLL = $0.01)`,
      change: '',
      icon: Sparkles,
      color: 'green',
    },
    { label: 'Adherence Rate', value: `${adherenceRate}%`, subtext: 'Last 30 days', change: '', icon: Activity, color: 'emerald' },
    { label: 'Active Contracts', value: `${contracts.length}`, subtext: 'Live smart contracts', change: '', icon: FileText, color: 'teal' },
    { label: 'Cost Savings', value: '$0', subtext: 'vs. retail price on locked quotes', change: '', icon: TrendingUp, color: 'green' },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Welcome Banner */}
      <Card className="border-green-100 bg-gradient-to-r from-green-500/10 to-emerald-500/10">
        <CardContent className="p-6 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-4 h-4 text-green-600" />
              <span className="text-sm text-green-600 font-medium">Welcome back</span>
            </div>
            <h2 className="text-2xl font-bold text-green-900">Good morning, {firstName}!</h2>
            <p className="text-green-600 mt-1">
              You're on a <span className="font-semibold text-green-700">12-day streak</span>. Keep it up!
            </p>
          </div>
          <HelpTooltip content="Get personalized AI treatment recommendations based on your health profile">
            <Button 
              onClick={() => navigate('/dashboard/ai-analysis')}
              className="bg-green-500 hover:bg-green-600 text-white"
            >
              <Brain className="w-4 h-4 mr-2" />
              Get AI Analysis
            </Button>
          </HelpTooltip>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <HelpTooltip key={i} content={`Your ${stat.label.toLowerCase()} - click for more details`}>
            <Card className="border-green-100 hover:shadow-green transition-shadow cursor-pointer">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-green-500">{stat.label}</p>
                    <p className="text-2xl font-bold text-green-900 mt-1">{stat.value}</p>
                    <p className="text-xs text-green-400 mt-0.5">{stat.subtext}</p>
                  </div>
                  <div className={`w-10 h-10 rounded-xl bg-${stat.color}-100 flex items-center justify-center`}>
                    <stat.icon className={`w-5 h-5 text-${stat.color}-600`} />
                  </div>
                </div>
                {stat.change && (
                  <div className="mt-3 flex items-center gap-1">
                    <span className="text-xs font-medium text-green-600">{stat.change}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          </HelpTooltip>
        ))}
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Today's Medications */}
        <Card className="border-green-100">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-green-900 flex items-center gap-2">
                  <Pill className="w-5 h-5 text-green-500" />
                  Today's Medications
                </CardTitle>
                <CardDescription>Your scheduled doses for today</CardDescription>
              </div>
              <HelpTooltip content="View all your medications and their schedules">
                <button 
                  onClick={() => navigate('/dashboard/treatments')}
                  className="text-sm text-green-600 hover:text-green-700 flex items-center gap-1"
                >
                  View all
                  <ChevronRight className="w-4 h-4" />
                </button>
              </HelpTooltip>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {isLoading && <p className="text-sm text-green-600">Loading medications...</p>}
            {!isLoading && medications.length === 0 && (
              <p className="text-sm text-green-600">No active medications yet.</p>
            )}
            {medications.map((med, i) => (
              <div key={i} className={`flex items-center gap-4 p-4 rounded-xl ${
                med.status === 'due' ? 'bg-amber-50 border border-amber-200' : 'bg-green-50/50'
              }`}>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  med.status === 'taken' ? 'bg-green-100' : med.status === 'due' ? 'bg-amber-100' : 'bg-green-100'
                }`}>
                  {med.status === 'taken' ? (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  ) : (
                    <Clock className="w-5 h-5 text-amber-600" />
                  )}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-green-900">{med.name}</p>
                  <p className="text-sm text-green-500">{med.dosage} • {med.frequency}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-green-700">Scheduled</p>
                  {med.status === 'due' && (
                    <Badge className="mt-1 bg-amber-500 text-white text-xs">Due now</Badge>
                  )}
                </div>
              </div>
            ))}
            <Button
              type="button"
              className="w-full bg-green-500 hover:bg-green-600 text-white"
              onClick={async () => {
                if (!user?.id || medications.length === 0) return;
                try {
                  const takenAt = new Date().toISOString();
                  const startOfDay = new Date();
                  startOfDay.setHours(0, 0, 0, 0);
                  const scheduledFor = startOfDay.toISOString();
                  const inserts = medications.map((m) => ({
                    user_id: user.id,
                    user_medication_id: m.id,
                    scheduled_for: scheduledFor,
                    status: 'taken' as const,
                    taken_at: takenAt,
                  }));
                  const { error } = await supabase.from('medication_doses').insert(inserts);
                  if (error) throw error;
                  toast.success('Doses recorded successfully');
                } catch (error) {
                  toast.error(error instanceof Error ? error.message : 'Failed to record doses.');
                }
              }}
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Mark Today's Doses as Taken
            </Button>
          </CardContent>
        </Card>

        {/* Upcoming Refills */}
        <Card className="border-green-100">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-green-900 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-green-500" />
                  Upcoming Refills
                </CardTitle>
                <CardDescription>Your medication delivery schedule</CardDescription>
              </div>
              <HelpTooltip content="Manage your refill schedule and smart contracts">
                <button 
                  onClick={() => navigate('/dashboard/contracts')}
                  className="text-sm text-green-600 hover:text-green-700 flex items-center gap-1"
                >
                  Manage
                  <ChevronRight className="w-4 h-4" />
                </button>
              </HelpTooltip>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {contracts.length === 0 && (
              <p className="text-sm text-green-600">No upcoming refills from active contracts.</p>
            )}
            {contracts.map((refill, i) => (
              <div key={i} className="p-4 rounded-xl bg-green-50/50 border border-green-100">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-medium text-green-900">Contract #{refill.id.slice(0, 8)}</p>
                    <p className="text-sm text-green-500">{refill.endDate ? new Date(refill.endDate).toLocaleDateString() : 'N/A'}</p>
                  </div>
                  <Badge className="bg-green-100 text-green-700">
                    Active
                  </Badge>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-green-500">{refill.quantity ?? 'N/A'}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-green-400">Locked price</span>
                    <span className="font-semibold text-green-700">${Number(refill.lockedPrice ?? 0).toFixed(2)}</span>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* AI Analysis CTA */}
      <Card className="border-green-100 bg-gradient-to-r from-green-500/5 to-emerald-500/5">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row items-center gap-6">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-green flex-shrink-0">
              <Brain className="w-8 h-8 text-white" />
            </div>
            <div className="flex-1 text-center md:text-left">
              <h3 className="text-xl font-bold text-green-900 mb-2">Get Your Personalized Treatment Analysis</h3>
              <p className="text-green-600 mb-4">
                Our AI analyzes your health profile to recommend the most effective medications with 92%+ accuracy. Takes less than 30 seconds!
              </p>
              <div className="flex flex-wrap gap-3 justify-center md:justify-start">
                <Badge variant="outline" className="border-green-200 text-green-600">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  500+ health factors analyzed
                </Badge>
                <Badge variant="outline" className="border-green-200 text-green-600">
                  <Shield className="w-3 h-3 mr-1" />
                  ADA Guidelines aligned
                </Badge>
                <Badge variant="outline" className="border-green-200 text-green-600">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  Cost-optimized recommendations
                </Badge>
              </div>
            </div>
            <HelpTooltip content="Start your AI-powered treatment analysis now">
              <Button 
                onClick={() => navigate('/dashboard/ai-analysis')}
                className="bg-green-500 hover:bg-green-600 text-white px-6"
              >
                Start Analysis
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </HelpTooltip>
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card className="border-green-100">
        <CardHeader>
          <CardTitle className="text-green-900">Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {activities.length === 0 && (
              <p className="text-sm text-green-600">No activity recorded yet.</p>
            )}
            {activities.map((activity, i) => (
              <div key={i} className="flex items-center justify-between py-2">
                <div>
                  <p className="text-green-900">{activity.text}</p>
                  <p className="text-sm text-green-500">{activity.time}</p>
                </div>
                {activity.reward && (
                  <Badge className="bg-green-100 text-green-700">
                    <Sparkles className="w-3 h-3 mr-1" />
                    {activity.reward}
                  </Badge>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ============================================
// AI ANALYSIS PAGE
// ============================================
function AIAnalysisPage() {
  return <AIQuestionnaire />;
}

// ============================================
// SMART CONTRACTS PAGE
// ============================================
function SmartContractsPage() {
  const navigate = useNavigate();
  const user = usePaypillStore((s) => s.user);
  const [contracts, setContracts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchContracts = async () => {
      if (!user?.id) return;
      setIsLoading(true);
      // Canonical schema: supabase/migrations/20260413190000_paypill_core_schema.sql
      // (user_id, medication_label, period_start/period_end, locked_price_cents, quantity_description, …)
      const { data, error }: any = await supabase
        .from('smart_contracts')
        .select(
          'id,medication_label,status,period_start,period_end,locked_price_cents,quantity_description,tx_hash,external_contract_ref,blockchain_network,created_at'
        )
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (error) {
        toast.error(error.message);
      } else {
        setContracts(data ?? []);
      }
      setIsLoading(false);
    };
    void fetchContracts();
  }, [user?.id]);

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-green-900">Smart Contracts</h2>
          <p className="text-green-600">Blockchain-secured medication agreements</p>
        </div>
      </div>

      {/* No Treatment Selected State */}
      <Card className="border-green-100">
        <CardContent className="p-12 text-center">
          <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-green-100 flex items-center justify-center">
            <FileText className="w-10 h-10 text-green-500" />
          </div>
          <h3 className="text-xl font-bold text-green-900 mb-3">No Treatment Selected</h3>
          <p className="text-green-600 mb-6 max-w-md mx-auto">
            Select a treatment recommendation from the AI Analysis page to create a smart contract with locked-in pricing.
          </p>
          <HelpTooltip content="Go to AI Analysis to find personalized treatment recommendations">
            <Button 
              onClick={() => navigate('/dashboard/ai-analysis')}
              className="bg-green-500 hover:bg-green-600 text-white"
            >
              Go to AI Analysis
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </HelpTooltip>
        </CardContent>
      </Card>

      {/* How Smart Contracts Work */}
      <Card className="border-green-100">
        <CardHeader>
          <CardTitle className="text-green-900 flex items-center gap-2">
            <Info className="w-5 h-5 text-green-500" />
            How Smart Contracts Work
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { icon: Lock, title: 'Fixed Pricing', desc: 'Your medication price is locked for 30 days, protecting you from price fluctuations' },
              { icon: Shield, title: 'Blockchain Secured', desc: 'Agreements are stored on the XRP Ledger, making them transparent and immutable' },
              { icon: RefreshCw, title: 'Auto-Renewal', desc: 'Contracts automatically renew each month with the same locked price' },
            ].map((feature, i) => (
              <div key={i} className="p-4 rounded-xl bg-green-50/50 border border-green-100">
                <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center mb-3">
                  <feature.icon className="w-5 h-5 text-green-600" />
                </div>
                <h4 className="font-semibold text-green-900 mb-2">{feature.title}</h4>
                <p className="text-sm text-green-600">{feature.desc}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Active Contracts */}
      <h3 className="text-lg font-bold text-green-900">Active Contracts</h3>
      <div className="space-y-4">
        {isLoading && <p className="text-sm text-green-600">Loading contracts...</p>}
        {!isLoading && contracts.length === 0 && (
          <p className="text-sm text-green-600">No smart contracts found for this account.</p>
        )}
        {contracts.map((contract, i) => {
          const lockedUsd =
            typeof contract.locked_price_cents === 'number'
              ? contract.locked_price_cents / 100
              : Number(contract.locked_price ?? 0);
          const validUntil =
            contract.period_end ?? contract.end_date ?? contract.end_at ?? null;
          const displayName =
            contract.external_contract_ref ??
            contract.medication_label ??
            contract.medication_name ??
            contract.contract_ref ??
            `Contract ${String(contract.id).slice(0, 8)}`;
          const qty =
            contract.quantity_description ?? contract.quantity ?? '—';
          const chainLabel =
            contract.blockchain_network ?? contract.blockchain ?? contract.chain ?? 'XRP Ledger';
          return (
          <Card key={i} className="border-green-100">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h4 className="font-bold text-green-900">{displayName}</h4>
                    <Badge className="bg-green-500 text-white">{contract.status}</Badge>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-green-500">Contract ID</p>
                      <p className="font-medium text-green-900">{String(contract.id).slice(0, 8)}</p>
                    </div>
                    <div>
                      <p className="text-green-500">Locked Price</p>
                      <p className="font-medium text-green-900">${lockedUsd.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-green-500">Valid Until</p>
                      <p className="font-medium text-green-900">
                        {validUntil ? new Date(validUntil).toLocaleDateString() : 'N/A'}
                      </p>
                    </div>
                    <div>
                      <p className="text-green-500">Quantity</p>
                      <p className="font-medium text-green-900">{qty}</p>
                    </div>
                  </div>
                </div>
                <HelpTooltip content="View the blockchain transaction details for this contract">
                  <Button variant="outline" className="border-green-200 text-green-600">
                    <ExternalLink className="w-4 h-4 mr-2" />
                    View on XRP
                  </Button>
                </HelpTooltip>
              </div>
              <div className="mt-4 pt-4 border-t border-green-100 flex items-center gap-2 text-sm text-green-500">
                <Shield className="w-4 h-4" />
                <span>Secured on {chainLabel}</span>
                <span className="text-green-300">|</span>
                <span className="font-mono">{contract.tx_hash || 'Pending confirmation'}</span>
                <button className="ml-2 text-green-600 hover:text-green-700">
                  <Copy className="w-4 h-4" />
                </button>
              </div>
            </CardContent>
          </Card>
          );
        })}
      </div>
    </div>
  );
}

// ============================================
// ADHERENCE PAGE
// ============================================
function AdherencePage() {
  const user = usePaypillStore((s) => s.user);
  const [, setSelectedDate] = useState(new Date());
  const [adherenceEvents, setAdherenceEvents] = useState<Array<{ status: string; occurred_at: string }>>([]);
  const [isLoading, setIsLoading] = useState(true);

  const calendarDays = Array.from({ length: 30 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - 15 + i);
    return date;
  });

  useEffect(() => {
    const fetchAdherence = async () => {
      if (!user?.id) return;
      setIsLoading(true);
      const { data, error }: any = await supabase
        .from('medication_doses')
        .select('status,scheduled_for,taken_at')
        .eq('user_id', user.id)
        .order('scheduled_for', { ascending: false })
        .limit(200);
      if (error) {
        toast.error(error.message);
      } else {
        setAdherenceEvents(
          (data ?? []).map((row: { status: string; scheduled_for?: string; taken_at?: string | null }) => ({
            status: row.status,
            occurred_at: row.taken_at ?? row.scheduled_for ?? new Date().toISOString(),
          }))
        );
      }
      setIsLoading(false);
    };
    void fetchAdherence();
  }, [user?.id]);

  const weeklyDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const adherenceData = weeklyDays.map((day, dayIndex) => {
    const dayEvents = adherenceEvents.filter((event) => new Date(event.occurred_at).getDay() === dayIndex);
    const takenCount = dayEvents.filter((event) => event.status === 'taken').length;
    const rate = dayEvents.length > 0 ? Math.round((takenCount / dayEvents.length) * 100) : 0;
    return { day, rate };
  });

  const currentStreak = adherenceEvents.reduce((count, event, index) => {
    if (index !== count) return count;
    return event.status === 'taken' ? count + 1 : count;
  }, 0);
  const monthlyTaken = adherenceEvents.filter((event) => event.status === 'taken').length;
  const monthlyRate = adherenceEvents.length ? Math.round((monthlyTaken / adherenceEvents.length) * 100) : 0;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-green-900">Adherence Tracker</h2>
        <p className="text-green-600">Monitor your medication compliance and earn rewards</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: 'Current Streak', value: `${currentStreak} doses`, icon: TrendingUp, color: 'green' },
          { label: 'Monthly Rate', value: `${monthlyRate}%`, icon: Activity, color: 'emerald' },
          { label: 'Events Logged', value: `${adherenceEvents.length}`, icon: Sparkles, color: 'teal' },
        ].map((stat, i) => (
          <Card key={i} className="border-green-100">
            <CardContent className="p-5">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl bg-${stat.color}-100 flex items-center justify-center`}>
                  <stat.icon className={`w-6 h-6 text-${stat.color}-600`} />
                </div>
                <div>
                  <p className="text-sm text-green-500">{stat.label}</p>
                  <p className="text-2xl font-bold text-green-900">{stat.value}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Weekly Chart */}
      <Card className="border-green-100">
        <CardHeader>
          <CardTitle className="text-green-900">Weekly Adherence</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading && <p className="text-sm text-green-600 mb-4">Loading adherence metrics...</p>}
          <div className="flex items-end justify-between h-40 gap-4">
            {adherenceData.map((data, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-2">
                <div className="w-full bg-green-100 rounded-t-lg relative overflow-hidden" style={{ height: '100%' }}>
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: `${data.rate}%` }}
                    transition={{ duration: 0.5, delay: i * 0.1 }}
                    className={`absolute bottom-0 w-full rounded-t-lg ${
                      data.rate >= 80 ? 'bg-green-500' : data.rate >= 50 ? 'bg-amber-500' : 'bg-red-500'
                    }`}
                  />
                </div>
                <span className="text-sm text-green-600">{data.day}</span>
                <span className="text-xs font-semibold text-green-700">{data.rate}%</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Calendar */}
      <Card className="border-green-100">
        <CardHeader>
          <CardTitle className="text-green-900">Medication Calendar</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-2">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="text-center text-sm font-medium text-green-500 py-2">
                {day}
              </div>
            ))}
            {calendarDays.map((date, i) => {
              const isToday = date.toDateString() === new Date().toDateString();
              const dailyEvents = adherenceEvents.filter((event) => new Date(event.occurred_at).toDateString() === date.toDateString());
              const takenCount = dailyEvents.filter((event) => event.status === 'taken').length;
              const adherence = dailyEvents.length === 0 ? 'missed' : takenCount === dailyEvents.length ? 'full' : 'partial';
              return (
                <button
                  key={i}
                  onClick={() => setSelectedDate(date)}
                  className={`
                    aspect-square rounded-lg flex flex-col items-center justify-center text-sm transition-all
                    ${isToday ? 'ring-2 ring-green-500' : ''}
                    ${adherence === 'full' ? 'bg-green-100 text-green-700' : 
                      adherence === 'partial' ? 'bg-amber-100 text-amber-700' : 
                      'bg-red-100 text-red-700'}
                  `}
                >
                  <span className="font-medium">{date.getDate()}</span>
                  {adherence === 'full' && <CheckCircle className="w-3 h-3 mt-1" />}
                  {adherence === 'partial' && <Clock className="w-3 h-3 mt-1" />}
                  {adherence === 'missed' && <AlertCircle className="w-3 h-3 mt-1" />}
                </button>
              );
            })}
          </div>
          <div className="flex items-center justify-center gap-6 mt-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-green-100" />
              <span className="text-green-600">All taken</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-amber-100" />
              <span className="text-green-600">Partial</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-red-100" />
              <span className="text-green-600">Missed</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ============================================
// TREATMENTS PAGE
// ============================================
function TreatmentsPage() {
  const user = usePaypillStore((s) => s.user);
  const [treatments, setTreatments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchTreatments = async () => {
      if (!user?.id) return;
      setIsLoading(true);
      // Canonical: public.user_medications (user_id, name, dosage, frequency, is_active)
      const { data, error }: any = await supabase
        .from('user_medications')
        .select('id,name,dosage,frequency,is_active,created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (error) {
        toast.error(error.message);
      } else {
        setTreatments(data ?? []);
      }
      setIsLoading(false);
    };
    void fetchTreatments();
  }, [user?.id]);

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-green-900">My Treatments</h2>
          <p className="text-green-600">Manage your current medications and prescriptions</p>
        </div>
        <HelpTooltip content="Add a new medication to your treatment plan">
          <Button className="bg-green-500 hover:bg-green-600 text-white">
            <Plus className="w-4 h-4 mr-2" />
            Add Medication
          </Button>
        </HelpTooltip>
      </div>

      {/* Treatments List */}
      <div className="space-y-4">
        {isLoading && <p className="text-sm text-green-600">Loading treatments...</p>}
        {!isLoading && treatments.length === 0 && (
          <p className="text-sm text-green-600">No treatments found. Add your first medication from AI Analysis.</p>
        )}
        {treatments.map((treatment, i) => {
          const treatmentActive =
            typeof treatment.is_active === 'boolean'
              ? treatment.is_active
              : treatment.status === 'active' || Boolean(treatment.active);
          const medName = treatment.name ?? treatment.medications?.name ?? 'Medication';
          return (
          <Card key={i} className="border-green-100">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                    treatmentActive ? 'bg-green-100' : 'bg-amber-100'
                  }`}>
                    <Pill className={`w-6 h-6 ${
                      treatmentActive ? 'text-green-600' : 'text-amber-600'
                    }`} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="text-lg font-bold text-green-900">{medName}</h4>
                      <Badge className={treatmentActive ? 'bg-green-100 text-green-700' : 'bg-amber-500 text-white'}>
                        {treatmentActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                    <p className="text-green-600">{treatment.dosage} • {treatment.frequency}</p>
                    <div className="flex items-center gap-4 mt-2 text-sm text-green-500">
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        Scheduled
                      </span>
                      <span className="flex items-center gap-1">
                        <Layers className="w-4 h-4" />
                        Linked to your profile
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="text-sm text-green-500">Status</p>
                    <p className="font-medium text-green-900">{treatmentActive ? 'Current' : 'Not active'}</p>
                  </div>
                  <HelpTooltip content="Edit medication details or schedule">
                    <Button variant="outline" size="icon" className="border-green-200 text-green-600">
                      <Settings className="w-4 h-4" />
                    </Button>
                  </HelpTooltip>
                </div>
              </div>
            </CardContent>
          </Card>
          );
        })}
      </div>

      {/* Add Medication CTA */}
      <Card className="border-green-100 border-dashed">
        <CardContent className="p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-green-50 flex items-center justify-center">
            <Plus className="w-8 h-8 text-green-400" />
          </div>
          <h4 className="text-lg font-medium text-green-900 mb-2">Add Another Medication</h4>
          <p className="text-green-500 mb-4">Keep track of all your prescriptions in one place</p>
          <Button variant="outline" className="border-green-200 text-green-600">
            <Search className="w-4 h-4 mr-2" />
            Search Medications
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

// ============================================
// SETTINGS PAGE
// ============================================
// 2025 U.S. Federal Poverty Level thresholds (HHS, 48 contiguous states & DC).
// Used for PRD Epic 3 Story 3.2 Foundation Support eligibility screening.
const FPL_BASE_2025_USD = 15060;
const FPL_PER_PERSON_2025_USD = 5380;

function calculateFplPercent(
  annualIncomeUsd: number | null,
  householdSize: number | null
): number | null {
  if (!annualIncomeUsd || annualIncomeUsd <= 0) return null;
  const size = householdSize && householdSize > 0 ? householdSize : 1;
  const threshold = FPL_BASE_2025_USD + FPL_PER_PERSON_2025_USD * (size - 1);
  return Math.round((annualIncomeUsd / threshold) * 100);
}

function SettingsPage() {
  const user = usePaypillStore((s) => s.user);
  const [profileName, setProfileName] = useState(user?.name ?? '');
  const [profileEmail, setProfileEmail] = useState(user?.email ?? '');

  // Coverage state (PRD Epic 1 Story 1.2 + Epic 3 Story 3.2)
  const [insuranceName, setInsuranceName] = useState('');
  const [insurancePlanType, setInsurancePlanType] = useState('');
  const [insuranceMemberId, setInsuranceMemberId] = useState('');
  const [insuranceGroupNumber, setInsuranceGroupNumber] = useState('');
  const [annualIncomeUsd, setAnnualIncomeUsd] = useState('');
  const [householdSize, setHouseholdSize] = useState('1');
  const [foundationSupportRequested, setFoundationSupportRequested] = useState(false);
  const [isLoadingCoverage, setIsLoadingCoverage] = useState(true);
  const [isSavingCoverage, setIsSavingCoverage] = useState(false);

  useEffect(() => {
    const load = async () => {
      if (!user?.id) {
        setIsLoadingCoverage(false);
        return;
      }
      const { data, error } = await supabase
        .from('patient_profile')
        .select(
          'insurance_name,insurance_plan_type,insurance_member_id,insurance_group_number,annual_income_usd,household_size,foundation_support_requested'
        )
        .eq('user_id', user.id)
        .maybeSingle();
      if (!error && data) {
        setInsuranceName(data.insurance_name ?? '');
        setInsurancePlanType(data.insurance_plan_type ?? '');
        setInsuranceMemberId(data.insurance_member_id ?? '');
        setInsuranceGroupNumber(data.insurance_group_number ?? '');
        setAnnualIncomeUsd(
          typeof data.annual_income_usd === 'number' ? String(data.annual_income_usd) : ''
        );
        setHouseholdSize(
          typeof data.household_size === 'number' && data.household_size > 0
            ? String(data.household_size)
            : '1'
        );
        setFoundationSupportRequested(Boolean(data.foundation_support_requested));
      }
      setIsLoadingCoverage(false);
    };
    void load();
  }, [user?.id]);

  const fplPercent = calculateFplPercent(
    annualIncomeUsd ? Number(annualIncomeUsd) : null,
    householdSize ? Number(householdSize) : null
  );
  const foundationEligible = fplPercent !== null && fplPercent <= 250;

  const saveCoverage = async () => {
    if (!user?.id) {
      toast.error('You must be signed in to update coverage.');
      return;
    }
    setIsSavingCoverage(true);
    try {
      const payload = {
        user_id: user.id,
        insurance_name: insuranceName.trim() || null,
        insurance_plan_type: insurancePlanType.trim() || null,
        insurance_member_id: insuranceMemberId.trim() || null,
        insurance_group_number: insuranceGroupNumber.trim() || null,
        annual_income_usd: annualIncomeUsd ? Number(annualIncomeUsd) : null,
        household_size: householdSize ? Number(householdSize) : null,
        foundation_support_requested: foundationSupportRequested,
        foundation_support_requested_at: foundationSupportRequested ? new Date().toISOString() : null,
      };
      const { error } = await supabase
        .from('patient_profile')
        .upsert(payload, { onConflict: 'user_id' });
      if (error) throw error;
      toast.success('Coverage information saved.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to save coverage.';
      toast.error(message);
    } finally {
      setIsSavingCoverage(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-green-900">Settings</h2>
        <p className="text-green-600">Manage your account, notifications, and preferences</p>
      </div>

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="bg-green-50 border border-green-100">
          <TabsTrigger value="profile" className="data-[state=active]:bg-white data-[state=active]:text-green-700">Profile</TabsTrigger>
          <TabsTrigger value="coverage" className="data-[state=active]:bg-white data-[state=active]:text-green-700">Coverage</TabsTrigger>
          <TabsTrigger value="notifications" className="data-[state=active]:bg-white data-[state=active]:text-green-700">Notifications</TabsTrigger>
          <TabsTrigger value="wallet" className="data-[state=active]:bg-white data-[state=active]:text-green-700">Wallet</TabsTrigger>
          <TabsTrigger value="privacy" className="data-[state=active]:bg-white data-[state=active]:text-green-700">Privacy</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="mt-6">
          <Card className="border-green-100">
            <CardHeader>
              <CardTitle className="text-green-900">Profile Information</CardTitle>
              <CardDescription>Update your personal details and health information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center gap-6">
                <Avatar className="w-20 h-20 bg-green-100">
                  <AvatarFallback className="bg-green-100 text-green-700 text-2xl font-semibold">JD</AvatarFallback>
                </Avatar>
                <div>
                  <Button variant="outline" className="border-green-200 text-green-600">
                    Change Photo
                  </Button>
                  <p className="text-sm text-green-500 mt-2">JPG, PNG or GIF. Max 2MB.</p>
                </div>
              </div>

              <Separator className="bg-green-100" />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-green-800">First Name</Label>
                  <Input
                    value={profileName.split(' ')[0] ?? ''}
                    onChange={(e) => setProfileName(`${e.target.value} ${profileName.split(' ').slice(1).join(' ')}`.trim())}
                    className="bg-green-50/50 border-green-200"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-green-800">Last Name</Label>
                  <Input
                    value={profileName.split(' ').slice(1).join(' ')}
                    onChange={(e) => setProfileName(`${profileName.split(' ')[0] ?? ''} ${e.target.value}`.trim())}
                    className="bg-green-50/50 border-green-200"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-green-800">Email</Label>
                  <Input value={profileEmail} onChange={(e) => setProfileEmail(e.target.value)} className="bg-green-50/50 border-green-200" />
                </div>
                <div className="space-y-2">
                  <Label className="text-green-800">Phone</Label>
                  <Input placeholder="No phone on file" className="bg-green-50/50 border-green-200" />
                </div>
              </div>

              <div className="flex justify-end">
                <Button
                  type="button"
                  className="bg-green-500 hover:bg-green-600 text-white"
                  onClick={() => toast.success('Profile update request captured')}
                >
                  Save Changes
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="coverage" className="mt-6 space-y-6">
          {/* Insurance — PRD Epic 1 Story 1.2 / F-002 */}
          <Card className="border-green-100">
            <CardHeader>
              <CardTitle className="text-green-900 flex items-center gap-2">
                <Shield className="w-5 h-5 text-green-500" />
                Insurance Information
              </CardTitle>
              <CardDescription>
                Enter your coverage so PayPill can verify eligibility and calculate your out-of-pocket
                cost. Supports Medicare, Medicaid, and commercial insurance.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {isLoadingCoverage ? (
                <p className="text-sm text-green-600">Loading your coverage…</p>
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-green-800">Insurance carrier</Label>
                      <Input
                        value={insuranceName}
                        onChange={(e) => setInsuranceName(e.target.value)}
                        placeholder="e.g. Blue Cross Blue Shield"
                        className="bg-green-50/50 border-green-200"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-green-800">Plan type</Label>
                      <Select value={insurancePlanType || 'unspecified'} onValueChange={(v) => setInsurancePlanType(v === 'unspecified' ? '' : v)}>
                        <SelectTrigger className="bg-green-50/50 border-green-200 text-green-900">
                          <SelectValue placeholder="Select plan type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="unspecified">Not specified</SelectItem>
                          <SelectItem value="commercial">Commercial (HMO/PPO/EPO)</SelectItem>
                          <SelectItem value="medicare">Medicare</SelectItem>
                          <SelectItem value="medicare_advantage">Medicare Advantage</SelectItem>
                          <SelectItem value="medicaid">Medicaid</SelectItem>
                          <SelectItem value="marketplace">ACA Marketplace</SelectItem>
                          <SelectItem value="uninsured">Uninsured</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-green-800">Member ID</Label>
                      <Input
                        value={insuranceMemberId}
                        onChange={(e) => setInsuranceMemberId(e.target.value)}
                        placeholder="Member ID from your insurance card"
                        className="bg-green-50/50 border-green-200"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-green-800">Group number</Label>
                      <Input
                        value={insuranceGroupNumber}
                        onChange={(e) => setInsuranceGroupNumber(e.target.value)}
                        placeholder="Group number (if applicable)"
                        className="bg-green-50/50 border-green-200"
                      />
                    </div>
                  </div>
                  <p className="text-xs text-green-500">
                    Encrypted at rest and in transit. PayPill is HIPAA-compliant and never sells your
                    data.
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          {/* Foundation Support — PRD Epic 3 Story 3.2 */}
          <Card className="border-green-100">
            <CardHeader>
              <CardTitle className="text-green-900 flex items-center gap-2">
                <Heart className="w-5 h-5 text-green-500" />
                PayPill Foundation support
              </CardTitle>
              <CardDescription>
                If cost is a barrier, the PayPill Foundation funds medications for qualifying
                patients — 10% of our profits go directly to this program. Screening uses the U.S.
                Federal Poverty Level (FPL); patients at or below 250% FPL typically qualify.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-green-800">Annual household income (USD)</Label>
                  <Input
                    type="number"
                    inputMode="numeric"
                    min={0}
                    value={annualIncomeUsd}
                    onChange={(e) => setAnnualIncomeUsd(e.target.value.replace(/[^0-9]/g, ''))}
                    placeholder="e.g. 42000"
                    className="bg-green-50/50 border-green-200"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-green-800">Household size</Label>
                  <Input
                    type="number"
                    inputMode="numeric"
                    min={1}
                    max={20}
                    value={householdSize}
                    onChange={(e) => setHouseholdSize(e.target.value.replace(/[^0-9]/g, ''))}
                    placeholder="1"
                    className="bg-green-50/50 border-green-200"
                  />
                </div>
              </div>

              {fplPercent !== null && (
                <div
                  className={`rounded-xl border p-4 ${
                    foundationEligible
                      ? 'border-green-200 bg-green-50'
                      : 'border-amber-200 bg-amber-50'
                  }`}
                >
                  <p className="text-sm font-medium text-green-900">
                    Your household is at approximately{' '}
                    <span className="font-bold">{fplPercent}% of the Federal Poverty Level</span>.
                  </p>
                  <p className="text-xs text-green-600 mt-1">
                    {foundationEligible
                      ? 'You likely qualify for Foundation-funded medication support ($0 out-of-pocket for eligible drugs). Request screening below.'
                      : 'You are above the 250% FPL cutoff today, but PayPill still locks in transparent NADAC-based pricing on every quote.'}
                  </p>
                </div>
              )}

              <div className="flex items-start gap-3 pt-2">
                <Checkbox
                  id="foundation-support"
                  checked={foundationSupportRequested}
                  onCheckedChange={(v) => setFoundationSupportRequested(v === true)}
                  className="mt-1 border-green-300 data-[state=checked]:bg-green-500"
                />
                <Label htmlFor="foundation-support" className="text-sm font-normal text-green-800 leading-relaxed">
                  Request a Foundation support screening. A care navigator will review your income
                  and insurance status within 48 hours (PRD Epic 3.2 acceptance criteria).
                </Label>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button
              type="button"
              onClick={saveCoverage}
              disabled={isSavingCoverage || isLoadingCoverage}
              className="bg-green-500 hover:bg-green-600 text-white"
            >
              {isSavingCoverage ? 'Saving…' : 'Save coverage'}
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="notifications" className="mt-6">
          <Card className="border-green-100">
            <CardHeader>
              <CardTitle className="text-green-900">Notification Preferences</CardTitle>
              <CardDescription>Choose how you want to be notified</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { label: 'Medication Reminders', desc: 'Get reminded when it\'s time to take your medications', default: true },
                { label: 'Refill Alerts', desc: 'Be notified when your medications are running low', default: true },
                { label: 'Adherence Reports', desc: 'Receive weekly adherence summary reports', default: true },
                { label: 'Price Drop Alerts', desc: 'Get notified when medication prices decrease', default: false },
                { label: 'New AI Recommendations', desc: 'Be informed when new treatment options are available', default: true },
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between py-3">
                  <div>
                    <p className="font-medium text-green-900">{item.label}</p>
                    <p className="text-sm text-green-500">{item.desc}</p>
                  </div>
                  <Checkbox defaultChecked={item.default} className="border-green-300 data-[state=checked]:bg-green-500" />
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="wallet" className="mt-6">
          <Card className="border-green-100">
            <CardHeader>
              <CardTitle className="text-green-900">Blockchain Wallet</CardTitle>
              <CardDescription>Manage your XRP Ledger wallet connection</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="p-4 rounded-xl bg-green-50 border border-green-100">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-green-500 flex items-center justify-center">
                      <Wallet className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="font-medium text-green-900">XRP Ledger Wallet</p>
                      <p className="text-sm text-green-500">Not connected</p>
                    </div>
                  </div>
                  <Badge className="bg-amber-500 text-white">Inactive</Badge>
                </div>
                <div className="flex items-center gap-2 p-3 rounded-lg bg-white">
                  <span className="font-mono text-sm text-green-700">No wallet connected</span>
                  <button className="ml-auto text-green-600 hover:text-green-700">
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-green-50 text-center">
                  <p className="text-sm text-green-500">PPLL Balance</p>
                  <p className="text-2xl font-bold text-green-900">{user?.ppllBalance ?? 0}</p>
                  <p className="text-xs text-green-400">From profile</p>
                </div>
                <div className="p-4 rounded-xl bg-green-50 text-center">
                  <p className="text-sm text-green-500">XRP Balance</p>
                  <p className="text-2xl font-bold text-green-900">0</p>
                  <p className="text-xs text-green-400">No wallet data</p>
                </div>
              </div>

              <div className="flex gap-3">
                <Button variant="outline" className="flex-1 border-green-200 text-green-600">
                  <ExternalLink className="w-4 h-4 mr-2" />
                  View on XRP
                </Button>
                <Button variant="outline" className="flex-1 border-red-200 text-red-600 hover:bg-red-50">
                  Disconnect
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="privacy" className="mt-6">
          <Card className="border-green-100">
            <CardHeader>
              <CardTitle className="text-green-900">Privacy & Security</CardTitle>
              <CardDescription>Manage your data sharing and security preferences</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between py-3">
                <div>
                  <p className="font-medium text-green-900">Share Health Data for AI Improvements</p>
                  <p className="text-sm text-green-500">Anonymously share data to improve AI recommendations</p>
                </div>
                <Checkbox defaultChecked className="border-green-300 data-[state=checked]:bg-green-500" />
              </div>
              <Separator className="bg-green-100" />
              <div className="flex items-center justify-between py-3">
                <div>
                  <p className="font-medium text-green-900">Two-Factor Authentication</p>
                  <p className="text-sm text-green-500">Add an extra layer of security to your account</p>
                </div>
                <Button variant="outline" className="border-green-200 text-green-600">
                  Enable
                </Button>
              </div>
              <Separator className="bg-green-100" />
              <div className="flex items-center justify-between py-3">
                <div>
                  <p className="font-medium text-green-900">Download Your Data</p>
                  <p className="text-sm text-green-500">Export all your health data and records</p>
                </div>
                <Button variant="outline" className="border-green-200 text-green-600">
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ============================================
// PUBLIC LEGAL PAGES (signup consent links)
// ============================================
function TermsOfServicePage() {
  const navigate = useNavigate();
  // #region agent log
  useEffect(() => {
    void fetch('http://127.0.0.1:7259/ingest/7c275fcd-f7d5-40bd-913a-f20dfce11162', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': 'acc874' },
      body: JSON.stringify({
        sessionId: 'acc874',
        location: 'App.tsx:TermsOfServicePage',
        message: 'legal page mounted',
        data: {},
        timestamp: Date.now(),
        hypothesisId: 'H6',
        runId: 'legal-doc-debug-1',
      }),
    }).catch(() => {});
  }, []);
  // #endregion
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 p-6">
      <div className="max-w-2xl mx-auto">
        <Card className="border-green-100 shadow-lg">
          <CardHeader>
            <CardTitle className="text-green-900">Terms of Service</CardTitle>
            <CardDescription>PayPill — summary placeholder</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-green-800 leading-relaxed">
            <p>
              This page is a <strong>placeholder</strong> for your final Terms of Service. Replace this
              content with counsel-approved legal text before production launch.
            </p>
            <p>
              By using PayPill you agree to use the service only for lawful purposes, to provide accurate
              health and coverage information where requested, and to keep your account credentials secure.
            </p>
            <div className="flex gap-3 pt-2">
              <Button type="button" variant="outline" className="border-green-200 text-green-700" onClick={() => navigate(-1)}>
                Back
              </Button>
              <Button type="button" className="bg-green-500 hover:bg-green-600 text-white" onClick={() => navigate('/signup')}>
                Return to signup
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function HipaaNoticePage() {
  const navigate = useNavigate();
  // #region agent log
  useEffect(() => {
    void fetch('http://127.0.0.1:7259/ingest/7c275fcd-f7d5-40bd-913a-f20dfce11162', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': 'acc874' },
      body: JSON.stringify({
        sessionId: 'acc874',
        location: 'App.tsx:HipaaNoticePage',
        message: 'legal page mounted',
        data: {},
        timestamp: Date.now(),
        hypothesisId: 'H6',
        runId: 'legal-doc-debug-1',
      }),
    }).catch(() => {});
  }, []);
  // #endregion
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 p-6">
      <div className="max-w-2xl mx-auto">
        <Card className="border-green-100 shadow-lg">
          <CardHeader>
            <CardTitle className="text-green-900">HIPAA Notice of Privacy Practices</CardTitle>
            <CardDescription>PayPill — summary placeholder</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-green-800 leading-relaxed">
            <p>
              This page is a <strong>placeholder</strong> for your HIPAA Notice of Privacy Practices (NPP).
              Replace with your organization&apos;s official NPP, including permitted uses and disclosures of
              PHI, individual rights, and contact information for your Privacy Officer.
            </p>
            <p>
              PayPill is designed so health information you enter is used to provide medication transparency,
              pricing, and adherence features you request. Do not include unnecessary sensitive information.
            </p>
            <div className="flex gap-3 pt-2">
              <Button type="button" variant="outline" className="border-green-200 text-green-700" onClick={() => navigate(-1)}>
                Back
              </Button>
              <Button type="button" className="bg-green-500 hover:bg-green-600 text-white" onClick={() => navigate('/signup')}>
                Return to signup
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ============================================
// MAIN APP COMPONENT
// ============================================
function App() {
  const initializeAuth = usePaypillStore((s) => s.initializeAuth);

  useEffect(() => {
    let cancelled = false;
    let unsubscribe: (() => void) | undefined;

    void initializeAuth()
      .then(() => {
        if (cancelled) return;
        const {
          data: { subscription },
        } = supabase.auth.onAuthStateChange(() => {
          // Token refresh / focus must not run the initial (non-silent) path or guards will show LoadingScreen and unmount the route tree.
          void initializeAuth({ silent: true });
        });
        unsubscribe = () => subscription.unsubscribe();
      });

    return () => {
      cancelled = true;
      unsubscribe?.();
    };
  }, [initializeAuth]);

  return (
    <TooltipProvider>
      <Toaster richColors position="top-center" />
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/signin" element={<GuestOnly><SignInPage /></GuestOnly>} />
          <Route path="/signup" element={<GuestOnly><SignUpPage /></GuestOnly>} />
          <Route path="/forgot-password" element={<GuestOnly><ForgotPasswordPage /></GuestOnly>} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/terms" element={<TermsOfServicePage />} />
          <Route path="/hipaa" element={<HipaaNoticePage />} />

          {/* Onboarding */}
          <Route path="/onboarding" element={<RequireOnboarding><OnboardingPage /></RequireOnboarding>} />

          {/* Dashboard Routes */}
          <Route path="/dashboard" element={
            <RequireDashboard>
              <DashboardLayout>
                <DashboardOverview />
              </DashboardLayout>
            </RequireDashboard>
          } />
          <Route path="/dashboard/ai-analysis" element={
            <RequireDashboard>
              <DashboardLayout>
                <AIAnalysisPage />
              </DashboardLayout>
            </RequireDashboard>
          } />
          <Route path="/dashboard/treatments" element={
            <RequireDashboard>
              <DashboardLayout>
                <TreatmentsPage />
              </DashboardLayout>
            </RequireDashboard>
          } />
          <Route path="/dashboard/contracts" element={
            <RequireDashboard>
              <DashboardLayout>
                <SmartContractsPage />
              </DashboardLayout>
            </RequireDashboard>
          } />
          <Route path="/dashboard/adherence" element={
            <RequireDashboard>
              <DashboardLayout>
                <AdherencePage />
              </DashboardLayout>
            </RequireDashboard>
          } />
          <Route path="/dashboard/settings" element={
            <RequireDashboard>
              <DashboardLayout>
                <SettingsPage />
              </DashboardLayout>
            </RequireDashboard>
          } />

          {/* Default Redirect */}
          <Route path="/" element={<Navigate to="/signin" replace />} />
          <Route path="*" element={<Navigate to="/signin" replace />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  );
}

export default App;
