import { HashRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
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
import AIQuestionnaire from './AIQuestionnaire';
import { usePaypillStore, userInitials } from '@/store/paypill-store';
import { Toaster } from '@/components/ui/sonner';
import { toast } from 'sonner';

// ============================================
// ROUTE GUARDS (single global store via Zustand)
// ============================================
function GuestOnly({ children }: { children: React.ReactNode }) {
  const isAuthenticated = usePaypillStore((s) => s.isAuthenticated);
  const onboardingComplete = usePaypillStore((s) => s.onboardingComplete);
  if (isAuthenticated) {
    return <Navigate to={onboardingComplete ? '/dashboard' : '/onboarding'} replace />;
  }
  return <>{children}</>;
}

function RequireDashboard({ children }: { children: React.ReactNode }) {
  const isAuthenticated = usePaypillStore((s) => s.isAuthenticated);
  const onboardingComplete = usePaypillStore((s) => s.onboardingComplete);
  if (!isAuthenticated) return <Navigate to="/signin" replace />;
  if (!onboardingComplete) return <Navigate to="/onboarding" replace />;
  return <>{children}</>;
}

function RequireOnboarding({ children }: { children: React.ReactNode }) {
  const isAuthenticated = usePaypillStore((s) => s.isAuthenticated);
  const onboardingComplete = usePaypillStore((s) => s.onboardingComplete);
  if (!isAuthenticated) return <Navigate to="/signin" replace />;
  if (onboardingComplete) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
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

// ============================================
// SIGN IN PAGE
// ============================================
function SignInPage() {
  const navigate = useNavigate();
  const login = usePaypillStore((s) => s.login);
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Mock authentication
    login(email || 'demo@paypill.local', 'John Doe');
    toast.success('Signed in (demo mode)');
    navigate('/onboarding');
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
                  <button type="button" className="text-sm text-green-600 hover:text-green-700 font-medium">
                    Forgot password?
                  </button>
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  className="w-full h-12 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold rounded-xl shadow-green transition-all duration-200 hover:shadow-lg"
                >
                  Sign in
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
// SIGN UP PAGE
// ============================================
function SignUpPage() {
  const navigate = useNavigate();
  const login = usePaypillStore((s) => s.login);
  const [step, setStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    conditions: [] as string[],
    allergies: [] as string[]
  });

  const handleContinue = () => {
    if (step < 3) {
      setStep(step + 1);
    } else {
      const name =
        `${formData.firstName} ${formData.lastName}`.trim() || 'New User';
      login(formData.email || 'demo@paypill.local', name);
      toast.success('Account created (demo mode)');
      navigate('/onboarding');
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
                      <Input placeholder="MM" className="h-12 bg-green-50/50 border-green-200 text-green-900 placeholder:text-green-400" />
                      <Input placeholder="DD" className="h-12 bg-green-50/50 border-green-200 text-green-900 placeholder:text-green-400" />
                      <Input placeholder="YYYY" className="h-12 bg-green-50/50 border-green-200 text-green-900 placeholder:text-green-400" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-green-800 font-medium">Phone Number</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-green-500 font-medium">+1</span>
                      <Input
                        placeholder="(555) 000-0000"
                        className="pl-12 h-12 bg-green-50/50 border-green-200 text-green-900 placeholder:text-green-400"
                      />
                    </div>
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
                  onClick={handleContinue}
                  className="flex-1 h-12 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold rounded-xl shadow-green transition-all duration-200 hover:shadow-lg"
                >
                  {step === 3 ? 'Create Account' : 'Continue'}
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </div>

              <p className="mt-4 text-center text-xs text-green-500">
                By creating an account, you agree to our{' '}
                <a href="#" className="underline hover:text-green-700">Terms</a> and{' '}
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

  const handleNext = () => {
    if (step < steps.length - 1) {
      setStep(step + 1);
    } else {
      completeOnboarding();
      navigate('/dashboard');
    }
  };

  const handleSkip = () => {
    completeOnboarding();
    navigate('/dashboard');
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
  const logout = usePaypillStore((s) => s.logout);
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

  const handleLogout = () => {
    logout();
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

  const stats = [
    { label: 'PPLL Balance', value: '1,250', subtext: '$12.50 USD', change: '+5 today', icon: Sparkles, color: 'green' },
    { label: 'Adherence Rate', value: '92%', subtext: 'Last 30 days', change: 'Great!', icon: Activity, color: 'emerald' },
    { label: 'Active Contracts', value: '2', subtext: 'Next refill in 5 days', change: '', icon: FileText, color: 'teal' },
    { label: 'Cost Savings', value: '$1,240', subtext: 'Since joining PayPill', change: '+12%', icon: TrendingUp, color: 'green' },
  ];

  const medications = [
    { name: 'Metformin 500mg', dosage: '1 tablet', time: '8:00 AM', status: 'taken', icon: CheckCircle },
    { name: 'Metformin 500mg', dosage: '1 tablet', time: '8:00 PM', status: 'due', icon: Clock },
    { name: 'Ozempic 0.5mg', dosage: '1 injection', time: 'Sunday 9:00 AM', status: 'upcoming', icon: Calendar },
  ];

  const refills = [
    { name: 'Metformin 500mg', days: 5, date: 'Dec 15, 2026', quantity: '30 tablets', price: '$8.00' },
    { name: 'Ozempic 0.5mg', days: 10, date: 'Dec 20, 2026', quantity: '4 pens', price: '$350.00' },
  ];

  const activities = [
    { text: 'Took Metformin 500mg', time: '2 hours ago', reward: '+1 PPLL' },
    { text: 'Smart contract executed for Ozempic', time: 'Yesterday', reward: '' },
    { text: 'A1C test results uploaded', time: '3 days ago', reward: '+10 PPLL' },
    { text: 'Weekly adherence bonus earned', time: '1 week ago', reward: '+30 PPLL' },
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
            {medications.map((med, i) => (
              <div key={i} className={`flex items-center gap-4 p-4 rounded-xl ${
                med.status === 'due' ? 'bg-amber-50 border border-amber-200' : 'bg-green-50/50'
              }`}>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  med.status === 'taken' ? 'bg-green-100' : med.status === 'due' ? 'bg-amber-100' : 'bg-green-100'
                }`}>
                  <med.icon className={`w-5 h-5 ${
                    med.status === 'taken' ? 'text-green-600' : med.status === 'due' ? 'text-amber-600' : 'text-green-600'
                  }`} />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-green-900">{med.name}</p>
                  <p className="text-sm text-green-500">{med.dosage}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-green-700">{med.time}</p>
                  {med.status === 'due' && (
                    <Badge className="mt-1 bg-amber-500 text-white text-xs">Due now</Badge>
                  )}
                </div>
              </div>
            ))}
            <Button
              type="button"
              className="w-full bg-green-500 hover:bg-green-600 text-white"
              onClick={() => toast.success('Marked as taken (demo)', { description: '+3 PPLL (simulated)' })}
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
            {refills.map((refill, i) => (
              <div key={i} className="p-4 rounded-xl bg-green-50/50 border border-green-100">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-medium text-green-900">{refill.name}</p>
                    <p className="text-sm text-green-500">{refill.date}</p>
                  </div>
                  <Badge className={refill.days <= 5 ? 'bg-amber-500 text-white' : 'bg-green-100 text-green-700'}>
                    {refill.days} days
                  </Badge>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-green-500">{refill.quantity}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-green-400">Locked price</span>
                    <span className="font-semibold text-green-700">{refill.price}</span>
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

  const contracts = [
    {
      id: 'SC-001',
      medication: 'Metformin 500mg',
      status: 'active',
      startDate: 'Nov 15, 2026',
      endDate: 'Dec 15, 2026',
      lockedPrice: '$8.00',
      quantity: '30 tablets',
      blockchain: 'XRP Ledger',
      txHash: 'rN7n7...8Xk2'
    },
    {
      id: 'SC-002',
      medication: 'Ozempic 0.5mg',
      status: 'active',
      startDate: 'Nov 20, 2026',
      endDate: 'Dec 20, 2026',
      lockedPrice: '$350.00',
      quantity: '4 pens',
      blockchain: 'XRP Ledger',
      txHash: 'rK3m9...2Pq7'
    }
  ];

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
        {contracts.map((contract, i) => (
          <Card key={i} className="border-green-100">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h4 className="font-bold text-green-900">{contract.medication}</h4>
                    <Badge className="bg-green-500 text-white">Active</Badge>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-green-500">Contract ID</p>
                      <p className="font-medium text-green-900">{contract.id}</p>
                    </div>
                    <div>
                      <p className="text-green-500">Locked Price</p>
                      <p className="font-medium text-green-900">{contract.lockedPrice}</p>
                    </div>
                    <div>
                      <p className="text-green-500">Valid Until</p>
                      <p className="font-medium text-green-900">{contract.endDate}</p>
                    </div>
                    <div>
                      <p className="text-green-500">Quantity</p>
                      <p className="font-medium text-green-900">{contract.quantity}</p>
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
                <span>Secured on {contract.blockchain}</span>
                <span className="text-green-300">|</span>
                <span className="font-mono">{contract.txHash}</span>
                <button className="ml-2 text-green-600 hover:text-green-700">
                  <Copy className="w-4 h-4" />
                </button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ============================================
// ADHERENCE PAGE
// ============================================
function AdherencePage() {
  const [, setSelectedDate] = useState(new Date());

  const calendarDays = Array.from({ length: 30 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - 15 + i);
    return date;
  });

  const adherenceData = [
    { day: 'Mon', rate: 100 },
    { day: 'Tue', rate: 100 },
    { day: 'Wed', rate: 80 },
    { day: 'Thu', rate: 100 },
    { day: 'Fri', rate: 100 },
    { day: 'Sat', rate: 50 },
    { day: 'Sun', rate: 100 },
  ];

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
          { label: 'Current Streak', value: '12 days', icon: TrendingUp, color: 'green' },
          { label: 'Monthly Rate', value: '92%', icon: Activity, color: 'emerald' },
          { label: 'PPLL Earned', value: '+156', icon: Sparkles, color: 'teal' },
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
              const adherence = Math.random() > 0.2 ? 'full' : Math.random() > 0.5 ? 'partial' : 'missed';
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
  const treatments = [
    {
      name: 'Metformin',
      dosage: '500mg',
      frequency: 'Twice daily',
      time: '8:00 AM, 8:00 PM',
      remaining: '15 tablets',
      nextRefill: 'Dec 15, 2026',
      status: 'active'
    },
    {
      name: 'Ozempic',
      dosage: '0.5mg',
      frequency: 'Once weekly',
      time: 'Sunday 9:00 AM',
      remaining: '2 pens',
      nextRefill: 'Dec 20, 2026',
      status: 'active'
    },
    {
      name: 'Lisinopril',
      dosage: '10mg',
      frequency: 'Once daily',
      time: '8:00 AM',
      remaining: '8 tablets',
      nextRefill: 'Dec 10, 2026',
      status: 'low'
    }
  ];

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
        {treatments.map((treatment, i) => (
          <Card key={i} className="border-green-100">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                    treatment.status === 'low' ? 'bg-amber-100' : 'bg-green-100'
                  }`}>
                    <Pill className={`w-6 h-6 ${
                      treatment.status === 'low' ? 'text-amber-600' : 'text-green-600'
                    }`} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="text-lg font-bold text-green-900">{treatment.name}</h4>
                      <Badge className={treatment.status === 'low' ? 'bg-amber-500 text-white' : 'bg-green-100 text-green-700'}>
                        {treatment.status === 'low' ? 'Low Stock' : 'Active'}
                      </Badge>
                    </div>
                    <p className="text-green-600">{treatment.dosage} • {treatment.frequency}</p>
                    <div className="flex items-center gap-4 mt-2 text-sm text-green-500">
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {treatment.time}
                      </span>
                      <span className="flex items-center gap-1">
                        <Layers className="w-4 h-4" />
                        {treatment.remaining}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="text-sm text-green-500">Next refill</p>
                    <p className="font-medium text-green-900">{treatment.nextRefill}</p>
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
        ))}
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
function SettingsPage() {
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
                  <Input defaultValue="John" className="bg-green-50/50 border-green-200" />
                </div>
                <div className="space-y-2">
                  <Label className="text-green-800">Last Name</Label>
                  <Input defaultValue="Doe" className="bg-green-50/50 border-green-200" />
                </div>
                <div className="space-y-2">
                  <Label className="text-green-800">Email</Label>
                  <Input defaultValue="john.doe@example.com" className="bg-green-50/50 border-green-200" />
                </div>
                <div className="space-y-2">
                  <Label className="text-green-800">Phone</Label>
                  <Input defaultValue="+1 (555) 123-4567" className="bg-green-50/50 border-green-200" />
                </div>
              </div>

              <div className="flex justify-end">
                <Button
                  type="button"
                  className="bg-green-500 hover:bg-green-600 text-white"
                  onClick={() => toast.success('Saved (demo mode)')}
                >
                  Save Changes
                </Button>
              </div>
            </CardContent>
          </Card>
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
                      <p className="text-sm text-green-500">Connected</p>
                    </div>
                  </div>
                  <Badge className="bg-green-500 text-white">Active</Badge>
                </div>
                <div className="flex items-center gap-2 p-3 rounded-lg bg-white">
                  <span className="font-mono text-sm text-green-700">rN7n7otQF8nE3K8Xk2J8L3M4N5O6P7Q8R</span>
                  <button className="ml-auto text-green-600 hover:text-green-700">
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-green-50 text-center">
                  <p className="text-sm text-green-500">PPLL Balance</p>
                  <p className="text-2xl font-bold text-green-900">1,250</p>
                  <p className="text-xs text-green-400">~$12.50 USD</p>
                </div>
                <div className="p-4 rounded-xl bg-green-50 text-center">
                  <p className="text-sm text-green-500">XRP Balance</p>
                  <p className="text-2xl font-bold text-green-900">45.2</p>
                  <p className="text-xs text-green-400">~$23.80 USD</p>
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
// MAIN APP COMPONENT
// ============================================
function App() {
  // Handle redirect from 404.html
  useEffect(() => {
    const redirectPath = sessionStorage.getItem('redirectPath');
    if (redirectPath) {
      sessionStorage.removeItem('redirectPath');
      window.history.replaceState(null, '', redirectPath);
    }
  }, []);

  return (
    <TooltipProvider>
      <Toaster richColors position="top-center" />
      <HashRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/signin" element={<GuestOnly><SignInPage /></GuestOnly>} />
          <Route path="/signup" element={<GuestOnly><SignUpPage /></GuestOnly>} />

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
      </HashRouter>
    </TooltipProvider>
  );
}

export default App;
