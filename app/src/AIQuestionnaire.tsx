import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Pill, Shield, Sparkles, CheckCircle, ArrowRight, ChevronLeft,
  Heart, Activity, Brain, TrendingUp, Search, User,
  Ruler, Weight, Droplets, Wind, Moon,
  Wine, Cigarette, Dumbbell, Utensils, Zap,
  Plus, X, Check, AlertCircle, FileText,
  Stethoscope, Camera, Loader2,
  Award, Users, DollarSign, Lock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/lib/supabase';

// ============================================
// TYPES
// ============================================
interface HealthProfile {
  identity: {
    firstName: string;
    lastName: string;
    dob: string;
    gender: string;
    location: string;
  };
  body: {
    height: string;
    weight: string;
    bmi: number;
    bloodPressure: { systolic: string; diastolic: string };
    heartRate: string;
  };
  conditions: Array<{
    id: string;
    name: string;
    category: string;
    diagnosedDate: string;
    treatment: string;
    controlled: string;
  }>;
  medications: Array<{
    name: string;
    dosage: string;
    frequency: string;
    startDate: string;
  }>;
  allergies: Array<{
    allergen: string;
    severity: string;
    reaction: string;
  }>;
  lifestyle: {
    exercise: string;
    alcohol: string;
    smoking: string;
    diet: string;
    sleep: string;
    stress: string;
  };
  providers: {
    primaryCare: string;
    insurance: string;
    planType: string;
  };
}

// ============================================
// BODY SYSTEMS DATA
// ============================================
const bodySystems = [
  { id: 'cardiovascular', name: 'Cardiovascular', icon: Heart, color: 'text-red-500', bg: 'bg-red-50', conditions: ['Hypertension', 'Heart Failure', 'Coronary Artery Disease', 'Arrhythmia', 'High Cholesterol'] },
  { id: 'endocrine', name: 'Endocrine & Metabolic', icon: Activity, color: 'text-purple-500', bg: 'bg-purple-50', conditions: ['Type 1 Diabetes', 'Type 2 Diabetes', 'Prediabetes', 'Thyroid Disorders', 'Obesity', 'Metabolic Syndrome'] },
  { id: 'respiratory', name: 'Respiratory', icon: Wind, color: 'text-blue-500', bg: 'bg-blue-50', conditions: ['Asthma', 'COPD', 'Sleep Apnea', 'Chronic Bronchitis'] },
  { id: 'neurological', name: 'Neurological', icon: Brain, color: 'text-indigo-500', bg: 'bg-indigo-50', conditions: ['Migraine', 'Epilepsy', 'Parkinson\'s Disease', 'Multiple Sclerosis', 'Neuropathy'] },
  { id: 'mental', name: 'Mental Health', icon: Sparkles, color: 'text-pink-500', bg: 'bg-pink-50', conditions: ['Anxiety Disorder', 'Depression', 'Bipolar Disorder', 'PTSD', 'ADHD'] },
  { id: 'kidney', name: 'Kidney & Urinary', icon: Droplets, color: 'text-cyan-500', bg: 'bg-cyan-50', conditions: ['Chronic Kidney Disease', 'Kidney Stones', 'Urinary Tract Disorders'] },
  { id: 'musculoskeletal', name: 'Musculoskeletal', icon: Activity, color: 'text-orange-500', bg: 'bg-orange-50', conditions: ['Arthritis', 'Fibromyalgia', 'Osteoporosis', 'Joint Replacement History'] },
  { id: 'cancer', name: 'Cancer/Oncology', icon: AlertCircle, color: 'text-rose-500', bg: 'bg-rose-50', conditions: ['Breast Cancer', 'Prostate Cancer', 'Colon Cancer', 'Lung Cancer', 'Cancer Survivor'] },
];

const medicationDatabase = [
  'Metformin', 'Lisinopril', 'Atorvastatin', 'Amlodipine', 'Omeprazole',
  'Levothyroxine', 'Metoprolol', 'Aspirin', 'Insulin', 'Ozempic',
  'Jardiance', 'Losartan', 'Gabapentin', 'Sertraline', 'Albuterol'
];

const allergiesList = [
  { name: 'Penicillin', type: 'drug' },
  { name: 'Sulfa Drugs', type: 'drug' },
  { name: 'NSAIDs', type: 'drug' },
  { name: 'Aspirin', type: 'drug' },
  { name: 'Peanuts', type: 'food' },
  { name: 'Shellfish', type: 'food' },
  { name: 'Dairy', type: 'food' },
  { name: 'Eggs', type: 'food' },
  { name: 'Latex', type: 'other' },
];

// ============================================
// WELCOME SCREEN
// ============================================
function WelcomeScreen({ onStart }: { onStart: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 flex items-center justify-center p-6"
    >
      <Card className="w-full max-w-2xl border-green-100 shadow-2xl bg-white/90 backdrop-blur-sm">
        <CardContent className="p-12 text-center">
          {/* Animated Avatar */}
          <div className="relative w-32 h-32 mx-auto mb-8">
            <motion.div
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="w-32 h-32 rounded-full bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center shadow-green glow-green"
            >
              <Sparkles className="w-16 h-16 text-white" />
            </motion.div>
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
              className="absolute inset-0 rounded-full border-2 border-dashed border-green-300"
            />
          </div>

          <h1 className="text-3xl font-bold text-green-900 mb-4">
            Meet Your AI Health Assistant
          </h1>
          <p className="text-xl text-green-700 mb-2">Hi, I'm Aria! 👋</p>
          <p className="text-green-600 mb-8 max-w-md mx-auto">
            I'll help you discover the best medication options based on your unique health profile. 
            This will take about <span className="font-semibold text-green-700">5 minutes</span>.
          </p>

          {/* Features */}
          <div className="grid grid-cols-3 gap-4 mb-10">
            {[
              { icon: Shield, text: 'HIPAA Compliant' },
              { icon: Lock, text: 'Bank-Level Security' },
              { icon: TrendingUp, text: '92% Accuracy' }
            ].map((item, i) => (
              <div key={i} className="flex flex-col items-center gap-2 p-4 rounded-xl bg-green-50">
                <item.icon className="w-6 h-6 text-green-600" />
                <span className="text-xs text-green-700 font-medium">{item.text}</span>
              </div>
            ))}
          </div>

          <Button
            onClick={onStart}
            className="h-14 px-10 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold text-lg rounded-xl shadow-green transition-all hover:shadow-lg"
          >
            <Sparkles className="w-5 h-5 mr-2" />
            Start My Health Profile
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>

          <p className="mt-6 text-sm text-green-500">
            Your data is encrypted and never shared without consent
          </p>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// ============================================
// IDENTITY MODULE
// ============================================
function IdentityModule({ data, onUpdate, onNext }: { data: any; onUpdate: (d: any) => void; onNext: () => void }) {
  const [localData, setLocalData] = useState(data.identity || {});

  const handleNext = () => {
    onUpdate({ ...data, identity: localData });
    onNext();
  };

  const isComplete = localData.firstName && localData.lastName && localData.dob && localData.gender;

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <div className="text-center mb-8">
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-green-100 flex items-center justify-center">
          <User className="w-8 h-8 text-green-600" />
        </div>
        <h2 className="text-2xl font-bold text-green-900">Who Are You?</h2>
        <p className="text-green-600">Let's start with the basics</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="text-green-800">First Name</Label>
          <Input
            value={localData.firstName || ''}
            onChange={(e) => setLocalData({ ...localData, firstName: e.target.value })}
            placeholder="John"
            className="h-12 bg-green-50/50 border-green-200"
          />
        </div>
        <div className="space-y-2">
          <Label className="text-green-800">Last Name</Label>
          <Input
            value={localData.lastName || ''}
            onChange={(e) => setLocalData({ ...localData, lastName: e.target.value })}
            placeholder="Doe"
            className="h-12 bg-green-50/50 border-green-200"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-green-800">Date of Birth</Label>
        <Input
          type="date"
          value={localData.dob || ''}
          onChange={(e) => setLocalData({ ...localData, dob: e.target.value })}
          className="h-12 bg-green-50/50 border-green-200"
        />
      </div>

      <div className="space-y-2">
        <Label className="text-green-800">Sex at Birth</Label>
        <div className="grid grid-cols-3 gap-3">
          {['Female', 'Male', 'Intersex'].map((option) => (
            <button
              key={option}
              onClick={() => setLocalData({ ...localData, gender: option })}
              className={`p-3 rounded-xl border-2 text-sm font-medium transition-all ${
                localData.gender === option
                  ? 'border-green-500 bg-green-50 text-green-700'
                  : 'border-green-200 text-green-600 hover:border-green-300'
              }`}
            >
              {option}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-green-800">ZIP Code</Label>
        <Input
          value={localData.location || ''}
          onChange={(e) => setLocalData({ ...localData, location: e.target.value })}
          placeholder="12345"
          className="h-12 bg-green-50/50 border-green-200"
        />
      </div>

      <Button
        onClick={handleNext}
        disabled={!isComplete}
        className="w-full h-12 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold rounded-xl disabled:opacity-50"
      >
        Continue
        <ArrowRight className="w-5 h-5 ml-2" />
      </Button>
    </motion.div>
  );
}

// ============================================
// BODY METRICS MODULE
// ============================================
function BodyMetricsModule({ data, onUpdate, onNext, onBack }: { data: any; onUpdate: (d: any) => void; onNext: () => void; onBack: () => void }) {
  const [localData, setLocalData] = useState(data.body || { height: '', weight: '', bmi: 0, bloodPressure: { systolic: '', diastolic: '' }, heartRate: '' });

  const calculateBMI = () => {
    const heightInM = parseFloat(localData.height) * 0.0254;
    const weightInKg = parseFloat(localData.weight) * 0.453592;
    if (heightInM && weightInKg) {
      return (weightInKg / (heightInM * heightInM)).toFixed(1);
    }
    return 0;
  };

  useEffect(() => {
    const bmi = calculateBMI();
    setLocalData((prev: any) => ({ ...prev, bmi }));
  }, [localData.height, localData.weight]);

  const handleNext = () => {
    onUpdate({ ...data, body: localData });
    onNext();
  };

  const getBMIColor = (bmi: number) => {
    if (bmi < 18.5) return 'text-blue-500';
    if (bmi < 25) return 'text-green-500';
    if (bmi < 30) return 'text-amber-500';
    return 'text-red-500';
  };

  const getBMILabel = (bmi: number) => {
    if (bmi < 18.5) return 'Underweight';
    if (bmi < 25) return 'Healthy';
    if (bmi < 30) return 'Overweight';
    return 'Obese';
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <div className="text-center mb-8">
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-green-100 flex items-center justify-center">
          <Activity className="w-8 h-8 text-green-600" />
        </div>
        <h2 className="text-2xl font-bold text-green-900">Your Body Metrics</h2>
        <p className="text-green-600">Help us understand your physical health</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="text-green-800 flex items-center gap-2">
            <Ruler className="w-4 h-4" /> Height (inches)
          </Label>
          <Input
            type="number"
            value={localData.height || ''}
            onChange={(e) => setLocalData({ ...localData, height: e.target.value })}
            placeholder="68"
            className="h-12 bg-green-50/50 border-green-200"
          />
        </div>
        <div className="space-y-2">
          <Label className="text-green-800 flex items-center gap-2">
            <Weight className="w-4 h-4" /> Weight (lbs)
          </Label>
          <Input
            type="number"
            value={localData.weight || ''}
            onChange={(e) => setLocalData({ ...localData, weight: e.target.value })}
            placeholder="170"
            className="h-12 bg-green-50/50 border-green-200"
          />
        </div>
      </div>

      {/* BMI Display */}
      {localData.bmi > 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="p-4 rounded-xl bg-green-50 border border-green-200"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-600">Your BMI</p>
              <p className={`text-3xl font-bold ${getBMIColor(localData.bmi)}`}>{localData.bmi}</p>
            </div>
            <Badge className={`${getBMIColor(localData.bmi).replace('text-', 'bg-').replace('500', '100')} ${getBMIColor(localData.bmi)}`}>
              {getBMILabel(localData.bmi)}
            </Badge>
          </div>
          <div className="mt-3 h-2 bg-green-200 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.min((localData.bmi / 40) * 100, 100)}%` }}
              className={`h-full ${getBMIColor(localData.bmi).replace('text-', 'bg-')}`}
            />
          </div>
        </motion.div>
      )}

      <div className="space-y-2">
        <Label className="text-green-800 flex items-center gap-2">
          <Heart className="w-4 h-4" /> Blood Pressure
        </Label>
        <div className="flex items-center gap-3">
          <Input
            type="number"
            value={localData.bloodPressure?.systolic || ''}
            onChange={(e) => setLocalData({ ...localData, bloodPressure: { ...localData.bloodPressure, systolic: e.target.value } })}
            placeholder="120"
            className="h-12 bg-green-50/50 border-green-200 text-center"
          />
          <span className="text-green-400 text-xl">/</span>
          <Input
            type="number"
            value={localData.bloodPressure?.diastolic || ''}
            onChange={(e) => setLocalData({ ...localData, bloodPressure: { ...localData.bloodPressure, diastolic: e.target.value } })}
            placeholder="80"
            className="h-12 bg-green-50/50 border-green-200 text-center"
          />
          <span className="text-green-500 text-sm">mmHg</span>
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-green-800">Resting Heart Rate</Label>
        <Input
          type="number"
          value={localData.heartRate || ''}
          onChange={(e) => setLocalData({ ...localData, heartRate: e.target.value })}
          placeholder="72"
          className="h-12 bg-green-50/50 border-green-200"
        />
      </div>

      <div className="flex gap-3">
        <Button
          onClick={onBack}
          variant="outline"
          className="flex-1 h-12 border-green-200 text-green-700"
        >
          <ChevronLeft className="w-5 h-5 mr-2" />
          Back
        </Button>
        <Button
          onClick={handleNext}
          className="flex-1 h-12 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-semibold"
        >
          Continue
          <ArrowRight className="w-5 h-5 ml-2" />
        </Button>
      </div>
    </motion.div>
  );
}

// ============================================
// CONDITIONS MODULE (BODY MAP)
// ============================================
function ConditionsModule({ data, onUpdate, onNext, onBack }: { data: any; onUpdate: (d: any) => void; onNext: () => void; onBack: () => void }) {
  const [selectedSystem, setSelectedSystem] = useState<string | null>(null);
  const [selectedConditions, setSelectedConditions] = useState(data.conditions || []);

  const toggleCondition = (condition: string, systemId: string) => {
    const exists = selectedConditions.find((c: any) => c.name === condition);
    if (exists) {
      setSelectedConditions(selectedConditions.filter((c: any) => c.name !== condition));
    } else {
      setSelectedConditions([...selectedConditions, { id: Date.now().toString(), name: condition, category: systemId, diagnosedDate: '', treatment: '', controlled: '' }]);
    }
  };

  const updateConditionDetail = (name: string, field: string, value: string) => {
    setSelectedConditions(selectedConditions.map((c: any) => 
      c.name === name ? { ...c, [field]: value } : c
    ));
  };

  const handleNext = () => {
    onUpdate({ ...data, conditions: selectedConditions });
    onNext();
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <div className="text-center mb-6">
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-green-100 flex items-center justify-center">
          <Stethoscope className="w-8 h-8 text-green-600" />
        </div>
        <h2 className="text-2xl font-bold text-green-900">Health Conditions</h2>
        <p className="text-green-600">Select any conditions you have</p>
      </div>

      {/* Selected Conditions Tags */}
      {selectedConditions.length > 0 && (
        <div className="flex flex-wrap gap-2 p-3 rounded-xl bg-green-50 border border-green-200">
          <span className="text-sm text-green-600 w-full mb-1">Selected:</span>
          {selectedConditions.map((c: any) => (
            <Badge key={c.name} className="bg-green-500 text-white pl-2 pr-1 py-1">
              {c.name}
              <button onClick={() => toggleCondition(c.name, c.category)} className="ml-1 p-0.5 hover:bg-green-600 rounded">
                <X className="w-3 h-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}

      {/* Body Systems Grid */}
      <div className="grid grid-cols-2 gap-3">
        {bodySystems.map((system) => {
          const Icon = system.icon;
          const hasSelected = selectedConditions.some((c: any) => c.category === system.id);
          return (
            <button
              key={system.id}
              onClick={() => setSelectedSystem(selectedSystem === system.id ? null : system.id)}
              className={`p-4 rounded-xl border-2 text-left transition-all ${
                selectedSystem === system.id
                  ? 'border-green-500 bg-green-50'
                  : hasSelected
                  ? 'border-green-300 bg-green-50/50'
                  : 'border-green-100 bg-white hover:border-green-200'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg ${system.bg} flex items-center justify-center`}>
                  <Icon className={`w-5 h-5 ${system.color}`} />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-green-900 text-sm">{system.name}</p>
                  <p className="text-xs text-green-500">
                    {selectedConditions.filter((c: any) => c.category === system.id).length} selected
                  </p>
                </div>
                {hasSelected && <CheckCircle className="w-5 h-5 text-green-500" />}
              </div>
            </button>
          );
        })}
      </div>

      {/* Expanded System Conditions */}
      <AnimatePresence>
        {selectedSystem && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="p-4 rounded-xl bg-green-50 border border-green-200"
          >
            <p className="font-medium text-green-800 mb-3">
              {bodySystems.find(s => s.id === selectedSystem)?.name} Conditions:
            </p>
            <div className="flex flex-wrap gap-2">
              {bodySystems.find(s => s.id === selectedSystem)?.conditions.map((condition) => {
                const isSelected = selectedConditions.some((c: any) => c.name === condition);
                return (
                  <button
                    key={condition}
                    onClick={() => toggleCondition(condition, selectedSystem)}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                      isSelected
                        ? 'bg-green-500 text-white'
                        : 'bg-white text-green-700 border border-green-200 hover:border-green-300'
                    }`}
                  >
                    {isSelected && <Check className="w-3 h-3 inline mr-1" />}
                    {condition}
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Condition Details */}
      {selectedConditions.length > 0 && (
        <div className="space-y-3">
          <p className="font-medium text-green-800">Condition Details:</p>
          {selectedConditions.map((condition: any) => (
            <div key={condition.name} className="p-4 rounded-xl bg-white border border-green-200">
              <div className="flex items-center justify-between mb-3">
                <p className="font-medium text-green-900">{condition.name}</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs text-green-600">Diagnosed Date</Label>
                  <Input
                    type="date"
                    value={condition.diagnosedDate}
                    onChange={(e) => updateConditionDetail(condition.name, 'diagnosedDate', e.target.value)}
                    className="h-9 bg-green-50/50 border-green-200 text-sm"
                  />
                </div>
                <div>
                  <Label className="text-xs text-green-600">How Controlled?</Label>
                  <select
                    value={condition.controlled}
                    onChange={(e) => updateConditionDetail(condition.name, 'controlled', e.target.value)}
                    className="w-full h-9 px-3 rounded-md bg-green-50/50 border border-green-200 text-sm text-green-900"
                  >
                    <option value="">Select...</option>
                    <option value="very-well">Very Well</option>
                    <option value="moderately">Moderately</option>
                    <option value="poorly">Poorly</option>
                    <option value="not-sure">Not Sure</option>
                  </select>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-3">
        <Button onClick={onBack} variant="outline" className="flex-1 h-12 border-green-200 text-green-700">
          <ChevronLeft className="w-5 h-5 mr-2" />
          Back
        </Button>
        <Button onClick={handleNext} className="flex-1 h-12 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-semibold">
          Continue
          <ArrowRight className="w-5 h-5 ml-2" />
        </Button>
      </div>
    </motion.div>
  );
}

// ============================================
// MEDICATIONS MODULE
// ============================================
function MedicationsModule({ data, onUpdate, onNext, onBack }: { data: any; onUpdate: (d: any) => void; onNext: () => void; onBack: () => void }) {
  const [medications, setMedications] = useState(data.medications || []);
  const [searchTerm, setSearchTerm] = useState('');
  const [showSearch, setShowSearch] = useState(false);

  const filteredMeds = medicationDatabase.filter(med => 
    med.toLowerCase().includes(searchTerm.toLowerCase()) &&
    !medications.some((m: any) => m.name === med)
  );

  const addMedication = (name: string) => {
    setMedications([...medications, { name, dosage: '', frequency: '1x daily', startDate: '' }]);
    setSearchTerm('');
    setShowSearch(false);
  };

  const updateMedication = (index: number, field: string, value: string) => {
    setMedications(medications.map((m: any, i: number) => 
      i === index ? { ...m, [field]: value } : m
    ));
  };

  const removeMedication = (index: number) => {
    setMedications(medications.filter((_: any, i: number) => i !== index));
  };

  const handleNext = () => {
    onUpdate({ ...data, medications });
    onNext();
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <div className="text-center mb-6">
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-green-100 flex items-center justify-center">
          <Pill className="w-8 h-8 text-green-600" />
        </div>
        <h2 className="text-2xl font-bold text-green-900">Current Medications</h2>
        <p className="text-green-600">What medications are you taking?</p>
      </div>

      {/* Search */}
      <div className="relative">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-green-400" />
            <Input
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setShowSearch(true);
              }}
              onFocus={() => setShowSearch(true)}
              placeholder="Search medications..."
              className="pl-10 h-12 bg-green-50/50 border-green-200"
            />
          </div>
          <Button
            onClick={() => setShowSearch(!showSearch)}
            variant="outline"
            className="h-12 border-green-200 text-green-600"
          >
            <Camera className="w-5 h-5" />
          </Button>
        </div>

        {/* Search Results */}
        {showSearch && searchTerm && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute top-full left-0 right-0 mt-2 p-2 rounded-xl bg-white border border-green-200 shadow-lg z-10"
          >
            {filteredMeds.length > 0 ? (
              filteredMeds.map((med) => (
                <button
                  key={med}
                  onClick={() => addMedication(med)}
                  className="w-full text-left px-3 py-2 rounded-lg hover:bg-green-50 text-green-700"
                >
                  <Plus className="w-4 h-4 inline mr-2" />
                  {med}
                </button>
              ))
            ) : (
              <p className="text-sm text-green-500 px-3 py-2">No medications found</p>
            )}
          </motion.div>
        )}
      </div>

      {/* Quick Add */}
      <div className="flex flex-wrap gap-2">
        <span className="text-sm text-green-600 w-full">Popular:</span>
        {['Metformin', 'Lisinopril', 'Atorvastatin'].map((med) => (
          <button
            key={med}
            onClick={() => addMedication(med)}
            disabled={medications.some((m: any) => m.name === med)}
            className="px-3 py-1.5 rounded-full text-sm bg-green-100 text-green-700 hover:bg-green-200 disabled:opacity-50"
          >
            + {med}
          </button>
        ))}
      </div>

      {/* Medications List */}
      <div className="space-y-3">
        {medications.map((med: any, index: number) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 rounded-xl bg-green-50 border border-green-200"
          >
            <div className="flex items-center justify-between mb-3">
              <p className="font-medium text-green-900">{med.name}</p>
              <button onClick={() => removeMedication(index)} className="text-green-400 hover:text-red-500">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <Label className="text-xs text-green-600">Dosage</Label>
                <Input
                  value={med.dosage}
                  onChange={(e) => updateMedication(index, 'dosage', e.target.value)}
                  placeholder="500mg"
                  className="h-9 bg-white border-green-200 text-sm"
                />
              </div>
              <div>
                <Label className="text-xs text-green-600">Frequency</Label>
                <select
                  value={med.frequency}
                  onChange={(e) => updateMedication(index, 'frequency', e.target.value)}
                  className="w-full h-9 px-2 rounded-md bg-white border border-green-200 text-sm text-green-900"
                >
                  <option>1x daily</option>
                  <option>2x daily</option>
                  <option>3x daily</option>
                  <option>Weekly</option>
                  <option>As needed</option>
                </select>
              </div>
              <div>
                <Label className="text-xs text-green-600">Started</Label>
                <Input
                  type="date"
                  value={med.startDate}
                  onChange={(e) => updateMedication(index, 'startDate', e.target.value)}
                  className="h-9 bg-white border-green-200 text-sm"
                />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {medications.length === 0 && (
        <div className="text-center p-8 rounded-xl bg-green-50 border border-dashed border-green-200">
          <Pill className="w-12 h-12 text-green-300 mx-auto mb-3" />
          <p className="text-green-600">No medications added yet</p>
          <p className="text-sm text-green-400">Search above or tap "None" to skip</p>
        </div>
      )}

      <div className="flex gap-3">
        <Button onClick={onBack} variant="outline" className="flex-1 h-12 border-green-200 text-green-700">
          <ChevronLeft className="w-5 h-5 mr-2" />
          Back
        </Button>
        <Button onClick={handleNext} className="flex-1 h-12 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-semibold">
          Continue
          <ArrowRight className="w-5 h-5 ml-2" />
        </Button>
      </div>
    </motion.div>
  );
}

// ============================================
// ALLERGIES MODULE
// ============================================
function AllergiesModule({ data, onUpdate, onNext, onBack }: { data: any; onUpdate: (d: any) => void; onNext: () => void; onBack: () => void }) {
  const [allergies, setAllergies] = useState(data.allergies || []);

  const toggleAllergy = (allergen: string, type: string) => {
    const exists = allergies.find((a: any) => a.allergen === allergen);
    if (exists) {
      setAllergies(allergies.filter((a: any) => a.allergen !== allergen));
    } else {
      setAllergies([...allergies, { allergen, type, severity: 'moderate', reaction: '' }]);
    }
  };

  const updateAllergy = (allergen: string, field: string, value: string) => {
    setAllergies(allergies.map((a: any) => 
      a.allergen === allergen ? { ...a, [field]: value } : a
    ));
  };

  const handleNext = () => {
    onUpdate({ ...data, allergies });
    onNext();
  };

  const drugAllergies = allergiesList.filter(a => a.type === 'drug');
  const foodAllergies = allergiesList.filter(a => a.type === 'food');
  const otherAllergies = allergiesList.filter(a => a.type === 'other');

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <div className="text-center mb-6">
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-amber-100 flex items-center justify-center">
          <AlertCircle className="w-8 h-8 text-amber-600" />
        </div>
        <h2 className="text-2xl font-bold text-green-900">Allergies</h2>
        <p className="text-green-600">Any allergies we should know about?</p>
      </div>

      {/* Drug Allergies */}
      <div>
        <p className="font-medium text-green-800 mb-3">Drug Allergies</p>
        <div className="flex flex-wrap gap-2">
          {drugAllergies.map((allergy) => {
            const isSelected = allergies.some((a: any) => a.allergen === allergy.name);
            return (
              <button
                key={allergy.name}
                onClick={() => toggleAllergy(allergy.name, allergy.type)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  isSelected
                    ? 'bg-amber-500 text-white'
                    : 'bg-amber-50 text-amber-700 border border-amber-200 hover:border-amber-300'
                }`}
              >
                {isSelected && <AlertCircle className="w-3 h-3 inline mr-1" />}
                {allergy.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* Food Allergies */}
      <div>
        <p className="font-medium text-green-800 mb-3">Food Allergies</p>
        <div className="flex flex-wrap gap-2">
          {foodAllergies.map((allergy) => {
            const isSelected = allergies.some((a: any) => a.allergen === allergy.name);
            return (
              <button
                key={allergy.name}
                onClick={() => toggleAllergy(allergy.name, allergy.type)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  isSelected
                    ? 'bg-orange-500 text-white'
                    : 'bg-orange-50 text-orange-700 border border-orange-200 hover:border-orange-300'
                }`}
              >
                {isSelected && <AlertCircle className="w-3 h-3 inline mr-1" />}
                {allergy.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* Other */}
      <div>
        <p className="font-medium text-green-800 mb-3">Other</p>
        <div className="flex flex-wrap gap-2">
          {otherAllergies.map((allergy) => {
            const isSelected = allergies.some((a: any) => a.allergen === allergy.name);
            return (
              <button
                key={allergy.name}
                onClick={() => toggleAllergy(allergy.name, allergy.type)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  isSelected
                    ? 'bg-green-500 text-white'
                    : 'bg-green-50 text-green-700 border border-green-200 hover:border-green-300'
                }`}
              >
                {isSelected && <AlertCircle className="w-3 h-3 inline mr-1" />}
                {allergy.name}
              </button>
            );
          })}
          <button className="px-3 py-2 rounded-lg text-sm font-medium bg-gray-50 text-gray-600 border border-gray-200 hover:border-gray-300">
            + Other
          </button>
        </div>
      </div>

      {/* Selected Allergies Details */}
      {allergies.length > 0 && (
        <div className="space-y-3">
          <p className="font-medium text-green-800">Allergy Details:</p>
          {allergies.map((allergy: any) => (
            <div key={allergy.allergen} className="p-4 rounded-xl bg-amber-50 border border-amber-200">
              <div className="flex items-center justify-between mb-2">
                <p className="font-medium text-amber-900">{allergy.allergen}</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs text-amber-600">Severity</Label>
                  <select
                    value={allergy.severity}
                    onChange={(e) => updateAllergy(allergy.allergen, 'severity', e.target.value)}
                    className="w-full h-9 px-2 rounded-md bg-white border border-amber-200 text-sm text-amber-900"
                  >
                    <option value="mild">Mild</option>
                    <option value="moderate">Moderate</option>
                    <option value="severe">Severe</option>
                  </select>
                </div>
                <div>
                  <Label className="text-xs text-amber-600">Reaction</Label>
                  <Input
                    value={allergy.reaction}
                    onChange={(e) => updateAllergy(allergy.allergen, 'reaction', e.target.value)}
                    placeholder="Rash, hives, etc."
                    className="h-9 bg-white border-amber-200 text-sm"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-3">
        <Button onClick={onBack} variant="outline" className="flex-1 h-12 border-green-200 text-green-700">
          <ChevronLeft className="w-5 h-5 mr-2" />
          Back
        </Button>
        <Button onClick={handleNext} className="flex-1 h-12 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-semibold">
          Continue
          <ArrowRight className="w-5 h-5 ml-2" />
        </Button>
      </div>
    </motion.div>
  );
}

// ============================================
// LIFESTYLE MODULE
// ============================================
function LifestyleModule({ data, onUpdate, onNext, onBack }: { data: any; onUpdate: (d: any) => void; onNext: () => void; onBack: () => void }) {
  const [lifestyle, setLifestyle] = useState(data.lifestyle || {
    exercise: 'sometimes',
    alcohol: 'never',
    smoking: 'never',
    diet: 'omnivore',
    sleep: '7',
    stress: 'moderate'
  });

  const handleNext = () => {
    onUpdate({ ...data, lifestyle });
    onNext();
  };

  const SliderControl = ({ label, value, options, onChange, icon: Icon }: any) => (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Icon className="w-5 h-5 text-green-600" />
        <Label className="text-green-800 font-medium">{label}</Label>
      </div>
      <div className="flex gap-2">
        {options.map((option: any) => (
          <button
            key={option.value}
            onClick={() => onChange(option.value)}
            className={`flex-1 py-2 px-1 rounded-lg text-xs font-medium transition-all ${
              value === option.value
                ? 'bg-green-500 text-white'
                : 'bg-green-50 text-green-600 hover:bg-green-100'
            }`}
          >
            {option.emoji && <span className="block text-lg mb-1">{option.emoji}</span>}
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <div className="text-center mb-6">
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-green-100 flex items-center justify-center">
          <Heart className="w-8 h-8 text-green-600" />
        </div>
        <h2 className="text-2xl font-bold text-green-900">Lifestyle & Habits</h2>
        <p className="text-green-600">Tell us about your daily routine</p>
      </div>

      <SliderControl
        label="Exercise Frequency"
        value={lifestyle.exercise}
        icon={Dumbbell}
        options={[
          { value: 'never', label: 'Never', emoji: '🛋️' },
          { value: 'rarely', label: 'Rarely', emoji: '🚶' },
          { value: 'sometimes', label: 'Sometimes', emoji: '🏃' },
          { value: 'often', label: 'Often', emoji: '🏋️' },
          { value: 'daily', label: 'Daily', emoji: '💪' },
        ]}
        onChange={(v: string) => setLifestyle({ ...lifestyle, exercise: v })}
      />

      <SliderControl
        label="Alcohol Consumption"
        value={lifestyle.alcohol}
        icon={Wine}
        options={[
          { value: 'never', label: 'Never', emoji: '🚫' },
          { value: 'rarely', label: 'Rarely', emoji: '🍷' },
          { value: 'sometimes', label: 'Sometimes', emoji: '🍺' },
          { value: 'often', label: 'Often', emoji: '🥂' },
        ]}
        onChange={(v: string) => setLifestyle({ ...lifestyle, alcohol: v })}
      />

      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Cigarette className="w-5 h-5 text-green-600" />
          <Label className="text-green-800 font-medium">Smoking</Label>
        </div>
        <div className="flex gap-2">
          {['never', 'former', 'current'].map((option) => (
            <button
              key={option}
              onClick={() => setLifestyle({ ...lifestyle, smoking: option })}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                lifestyle.smoking === option
                  ? 'bg-green-500 text-white'
                  : 'bg-green-50 text-green-600 hover:bg-green-100'
              }`}
            >
              {option.charAt(0).toUpperCase() + option.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Utensils className="w-5 h-5 text-green-600" />
          <Label className="text-green-800 font-medium">Diet</Label>
        </div>
        <div className="flex gap-2">
          {[
            { value: 'omnivore', label: 'Omnivore' },
            { value: 'vegetarian', label: 'Vegetarian' },
            { value: 'vegan', label: 'Vegan' },
            { value: 'other', label: 'Other' },
          ].map((option) => (
            <button
              key={option.value}
              onClick={() => setLifestyle({ ...lifestyle, diet: option.value })}
              className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all ${
                lifestyle.diet === option.value
                  ? 'bg-green-500 text-white'
                  : 'bg-green-50 text-green-600 hover:bg-green-100'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Moon className="w-5 h-5 text-green-600" />
          <Label className="text-green-800 font-medium">Average Sleep (hours/night)</Label>
        </div>
        <div className="flex items-center gap-4">
          <input
            type="range"
            min="4"
            max="12"
            value={lifestyle.sleep}
            onChange={(e) => setLifestyle({ ...lifestyle, sleep: e.target.value })}
            className="flex-1 h-2 bg-green-200 rounded-lg appearance-none cursor-pointer"
          />
          <span className="w-12 text-center font-bold text-green-700">{lifestyle.sleep}h</span>
        </div>
      </div>

      <SliderControl
        label="Stress Level"
        value={lifestyle.stress}
        icon={Zap}
        options={[
          { value: 'low', label: 'Low', emoji: '😌' },
          { value: 'moderate', label: 'Moderate', emoji: '😐' },
          { value: 'high', label: 'High', emoji: '😰' },
        ]}
        onChange={(v: string) => setLifestyle({ ...lifestyle, stress: v })}
      />

      <div className="flex gap-3">
        <Button onClick={onBack} variant="outline" className="flex-1 h-12 border-green-200 text-green-700">
          <ChevronLeft className="w-5 h-5 mr-2" />
          Back
        </Button>
        <Button onClick={handleNext} className="flex-1 h-12 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-semibold">
          Continue
          <ArrowRight className="w-5 h-5 ml-2" />
        </Button>
      </div>
    </motion.div>
  );
}

// ============================================
// PROCESSING SCREEN
// ============================================
function ProcessingScreen({ onComplete }: { onComplete: () => void }) {
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    'Validating health profile...',
    'Cross-referencing conditions...',
    'Checking medication interactions...',
    'Analyzing genetic compatibility...',
    'Comparing with 50,000+ patient outcomes...',
    'Evaluating insurance coverage...',
    'Calculating cost-effectiveness...',
    'Generating recommendations...',
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(onComplete, 500);
          return 100;
        }
        return prev + 2;
      });
    }, 80);

    return () => clearInterval(interval);
  }, [onComplete]);

  useEffect(() => {
    const stepIndex = Math.floor((progress / 100) * steps.length);
    setCurrentStep(Math.min(stepIndex, steps.length - 1));
  }, [progress]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 flex items-center justify-center p-6"
    >
      <Card className="w-full max-w-lg border-green-100 shadow-2xl bg-white/90 backdrop-blur-sm">
        <CardContent className="p-12 text-center">
          {/* Animated Brain */}
          <div className="relative w-32 h-32 mx-auto mb-8">
            <motion.div
              animate={{ scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="w-32 h-32 rounded-full bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center shadow-green"
            >
              <Brain className="w-16 h-16 text-white" />
            </motion.div>
            {[...Array(3)].map((_, i) => (
              <motion.div
                key={i}
                animate={{ 
                  scale: [1, 1.5, 1],
                  opacity: [0.5, 0, 0.5]
                }}
                transition={{ duration: 2, repeat: Infinity, delay: i * 0.3 }}
                className="absolute inset-0 rounded-full border-2 border-green-400"
              />
            ))}
          </div>

          <h2 className="text-2xl font-bold text-green-900 mb-2">
            Analyzing Your Health Profile...
          </h2>
          <p className="text-green-600 mb-8">
            Our AI is processing 500+ health factors to find your best medication options
          </p>

          {/* Progress Bar */}
          <div className="mb-6">
            <Progress value={progress} className="h-3 bg-green-100" />
            <p className="mt-2 text-sm font-medium text-green-700">{progress}%</p>
          </div>

          {/* Current Step */}
          <div className="p-4 rounded-xl bg-green-50 border border-green-200">
            <div className="flex items-center gap-3">
              <Loader2 className="w-5 h-5 text-green-600 animate-spin" />
              <p className="text-green-700">{steps[currentStep]}</p>
            </div>
          </div>

          {/* Fun Fact */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            className="mt-6 p-4 rounded-xl bg-amber-50 border border-amber-200"
          >
            <p className="text-sm text-amber-700">
              💡 Did you know? People with similar profiles have saved an average of <span className="font-bold">$1,240/year</span> using our recommendations!
            </p>
          </motion.div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// ============================================
// RESULTS SCREEN
// ============================================
function ResultsScreen({ data }: { data: HealthProfile }) {
  const navigate = useNavigate();
  const [recommendations, setRecommendations] = useState<Array<{
    id: string;
    medication_name: string;
    confidence: number | null;
    rationale: string | null;
    estimated_monthly_savings: number | null;
  }>>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadRecommendations = async () => {
      setIsLoading(true);
      const { data: userResult } = await supabase.auth.getUser();
      const userId = userResult.user?.id;
      if (!userId) {
        setRecommendations([]);
        setIsLoading(false);
        return;
      }

      const { data: latestAnalysis, error: analysisError } = await supabase
        .from('ai_analyses')
        .select('id')
        .eq('profile_id', userId)
        .order('generated_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (analysisError || !latestAnalysis) {
        setRecommendations([]);
        setIsLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('ai_recommendations')
        .select('id,recommendation_text,medications(name),confidence,estimated_monthly_cost,estimated_savings')
        .eq('analysis_id', latestAnalysis.id)
        .order('confidence', { ascending: false });
      if (error) {
        setRecommendations([]);
      } else {
        setRecommendations(
          (data ?? []).map((row: Record<string, unknown>) => ({
            id: row.id as string,
            medication_name: (row.medications as { name?: string } | null)?.name ?? 'Recommendation',
            confidence: row.confidence as number | null,
            rationale: (row.recommendation_text as string) || null,
            estimated_monthly_savings: (row.estimated_savings as number | null) ?? (row.estimated_monthly_cost as number | null),
          }))
        );
      }
      setIsLoading(false);
    };

    void loadRecommendations();
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 p-6"
    >
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', delay: 0.2 }}
            className="w-20 h-20 mx-auto mb-4 rounded-full bg-green-500 flex items-center justify-center"
          >
            <CheckCircle className="w-10 h-10 text-white" />
          </motion.div>
          <h1 className="text-3xl font-bold text-green-900 mb-2">
            Your Recommendations Are Ready!
          </h1>
          <p className="text-green-600">
            Based on your health profile, we found {recommendations.length} personalized options
          </p>
        </div>

        {/* Profile Summary */}
        <Card className="mb-8 border-green-100">
          <CardContent className="p-6">
            <h3 className="text-lg font-bold text-green-900 mb-4">Your Health Profile Summary</h3>
            <div className="grid grid-cols-4 gap-4">
              <div className="text-center p-4 rounded-xl bg-green-50">
                <Activity className="w-6 h-6 text-green-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-green-900">{data.conditions?.length || 0}</p>
                <p className="text-xs text-green-600">Conditions</p>
              </div>
              <div className="text-center p-4 rounded-xl bg-green-50">
                <Pill className="w-6 h-6 text-green-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-green-900">{data.medications?.length || 0}</p>
                <p className="text-xs text-green-600">Medications</p>
              </div>
              <div className="text-center p-4 rounded-xl bg-green-50">
                <Users className="w-6 h-6 text-green-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-green-900">
                  {recommendations.length > 0 ? `${Math.round(Number(recommendations[0]?.confidence ?? 0))}%` : '0%'}
                </p>
                <p className="text-xs text-green-600">Top confidence</p>
              </div>
              <div className="text-center p-4 rounded-xl bg-green-50">
                <DollarSign className="w-6 h-6 text-green-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-green-900">
                  ${recommendations.reduce((sum, item) => sum + Number(item.estimated_monthly_savings ?? 0), 0).toFixed(0)}
                </p>
                <p className="text-xs text-green-600">Est. monthly total</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recommendations */}
        <div className="space-y-6">
          <h3 className="text-xl font-bold text-green-900">Top Recommendations For You:</h3>
          {isLoading && <p className="text-sm text-green-600">Loading recommendations...</p>}
          {!isLoading && recommendations.length === 0 && (
            <p className="text-sm text-green-600">No saved recommendations yet.</p>
          )}
          
          {recommendations.map((rec, index) => (
            <motion.div
              key={rec.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + index * 0.1 }}
            >
              <Card className={`border-green-100 ${index === 0 ? 'ring-2 ring-green-500' : ''}`}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <Badge className={index === 0 ? 'bg-green-500 text-white' : 'bg-green-100 text-green-700'}>
                          #{index + 1} {index === 0 ? 'RECOMMENDED' : 'ALTERNATIVE'}
                        </Badge>
                        <span className="text-sm text-green-500">Persisted analysis</span>
                      </div>
                      <h4 className="text-xl font-bold text-green-900">{rec.medication_name}</h4>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm text-green-600">Confidence:</span>
                        <span className="font-bold text-green-700">{Math.round(Number(rec.confidence ?? 0))}%</span>
                      </div>
                      <Progress value={Math.round(Number(rec.confidence ?? 0))} className="w-24 h-2 bg-green-100" />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <p className="font-medium text-green-800 mb-2">Why this is recommended:</p>
                      <p className="text-sm text-green-600">{rec.rationale || 'No rationale recorded.'}</p>
                    </div>
                    <div>
                      <p className="font-medium text-green-800 mb-2">Estimated monthly savings:</p>
                      <div className="mt-3 p-3 rounded-lg bg-amber-50 border border-amber-200">
                        <p className="text-sm text-amber-700">
                          Potential savings: <span className="font-bold">${Number(rec.estimated_monthly_savings ?? 0).toFixed(2)}</span>
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 flex gap-3">
                    <Button variant="outline" className="flex-1 border-green-200 text-green-600">
                      <FileText className="w-4 h-4 mr-2" />
                      View Details
                    </Button>
                    <Button className="flex-1 bg-green-500 hover:bg-green-600 text-white">
                      <Lock className="w-4 h-4 mr-2" />
                      Lock Price
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Actions */}
        <div className="mt-8 flex gap-4">
          <Button
            onClick={() => navigate('/dashboard')}
            variant="outline"
            className="flex-1 h-14 border-green-200 text-green-700"
          >
            <ChevronLeft className="w-5 h-5 mr-2" />
            Back to Dashboard
          </Button>
          <Button
            onClick={() => navigate('/dashboard/contracts')}
            className="flex-1 h-14 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-semibold"
          >
            <Award className="w-5 h-5 mr-2" />
            Create Smart Contract
          </Button>
        </div>
      </div>
    </motion.div>
  );
}

// ============================================
// MAIN AI QUESTIONNAIRE COMPONENT
// ============================================
export default function AIQuestionnaire() {
  const [step, setStep] = useState<'welcome' | 'form' | 'processing' | 'results'>('welcome');
  const [currentModule, setCurrentModule] = useState(0);
  const [formData, setFormData] = useState<Partial<HealthProfile>>({});

  const modules = [
    { id: 'identity', name: 'Identity', component: IdentityModule },
    { id: 'body', name: 'Body Metrics', component: BodyMetricsModule },
    { id: 'conditions', name: 'Conditions', component: ConditionsModule },
    { id: 'medications', name: 'Medications', component: MedicationsModule },
    { id: 'allergies', name: 'Allergies', component: AllergiesModule },
    { id: 'lifestyle', name: 'Lifestyle', component: LifestyleModule },
  ];

  const CurrentModule = modules[currentModule].component;
  const progress = ((currentModule + 1) / modules.length) * 100;

  const handleNext = () => {
    if (currentModule < modules.length - 1) {
      setCurrentModule(currentModule + 1);
    } else {
      setStep('processing');
    }
  };

  const handleBack = () => {
    if (currentModule > 0) {
      setCurrentModule(currentModule - 1);
    }
  };

  const handleProcessingComplete = () => {
    setStep('results');
  };

  if (step === 'welcome') {
    return <WelcomeScreen onStart={() => setStep('form')} />;
  }

  if (step === 'processing') {
    return <ProcessingScreen onComplete={handleProcessingComplete} />;
  }

  if (step === 'results') {
    return <ResultsScreen data={formData as HealthProfile} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Progress Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
                <Brain className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="font-bold text-green-900">Health Profile Builder</p>
                <p className="text-sm text-green-500">Step {currentModule + 1} of {modules.length}</p>
              </div>
            </div>
            <Badge className="bg-green-100 text-green-700">
              {Math.round(progress)}%
            </Badge>
          </div>
          <Progress value={progress} className="h-2 bg-green-100" />
          
          {/* Module Indicators */}
          <div className="flex justify-between mt-3">
            {modules.map((m, i) => (
              <div
                key={m.id}
                className={`flex flex-col items-center ${
                  i <= currentModule ? 'text-green-600' : 'text-green-300'
                }`}
              >
                <div className={`w-2 h-2 rounded-full mb-1 ${
                  i <= currentModule ? 'bg-green-500' : 'bg-green-200'
                }`} />
                <span className="text-xs">{m.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Module Content */}
        <Card className="border-green-100 shadow-xl bg-white/90 backdrop-blur-sm">
          <CardContent className="p-8">
            <AnimatePresence mode="wait">
              <CurrentModule
                key={currentModule}
                data={formData}
                onUpdate={setFormData}
                onNext={handleNext}
                onBack={handleBack}
              />
            </AnimatePresence>
          </CardContent>
        </Card>

        {/* Save Progress */}
        <p className="text-center text-sm text-green-500 mt-4">
          Your progress is automatically saved
        </p>
      </div>
    </div>
  );
}
