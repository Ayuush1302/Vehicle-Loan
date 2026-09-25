import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../../store/useAppStore';
import { Smartphone, ArrowRight, Shield, Fingerprint, CheckCircle2 } from 'lucide-react';

const mobileSchema = z.object({
  mobile: z.string().regex(/^[6-9]\d{9}$/, 'Enter a valid 10-digit mobile number')
});

const verifySchema = z.object({
  otp: z.string().length(6, 'OTP must be 6 digits'),
  termsAccepted: z.literal(true, { errorMap: () => ({ message: "You must accept the terms to proceed" }) })
});

const kycSchema = z.object({
  pan: z.string().regex(/^[A-Z]{5}[0-9]{4}[A-Z]$/, 'Invalid PAN format'),
  nameOnPan: z.string().min(2, 'Enter name exactly as on PAN'),
  aadhaar: z.string().regex(/^\d{12}$/, 'Enter a valid 12-digit Aadhaar number'),
  consentKyc: z.literal(true, { errorMap: () => ({ message: "Required" }) }),
  consentBureau: z.literal(true, { errorMap: () => ({ message: "Required" }) }),
});

export default function AccessStep() {
  const navigate = useNavigate();
  const { setUser, user } = useAppStore();
  
  const [step, setStep] = useState<'mobile' | 'verify' | 'kyc'>('mobile');
  const [mobileNumber, setMobileNumber] = useState('');
  const [attempts, setAttempts] = useState(0);
  const [locked, setLocked] = useState(false);

  // If already logged in, go to dashboard
  useEffect(() => {
    if (user) {
      navigate('/', { replace: true });
    }
  }, [user, navigate]);

  const mobileForm = useForm({
    resolver: zodResolver(mobileSchema),
    defaultValues: { mobile: '' }
  });

  const verifyForm = useForm({
    resolver: zodResolver(verifySchema),
    defaultValues: { otp: '', termsAccepted: false as any }
  });

  const kycForm = useForm({
    resolver: zodResolver(kycSchema),
    defaultValues: {
      pan: '',
      nameOnPan: '',
      aadhaar: '',
      consentKyc: false as any,
      consentBureau: false as any
    }
  });

  const onMobileSubmit = (data: { mobile: string }) => {
    setMobileNumber(data.mobile);
    setStep('verify');
    setAttempts(0);
    setLocked(false);
  };

  const onVerifySubmit = (data: any) => {
    if (locked) return;

    if (data.otp === '123456') {
      setStep('kyc');
    } else {
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);
      if (newAttempts >= 3) {
        setLocked(true);
        verifyForm.setError('otp', { message: 'Maximum attempts reached. Try again later.' });
      } else {
        verifyForm.setError('otp', { message: `Invalid OTP. ${3 - newAttempts} attempts left.` });
      }
    }
  };

  const onKycSubmit = (data: any) => {
    setUser({
      mobile: mobileNumber,
      pan: data.pan,
      nameOnPan: data.nameOnPan,
      aadhaar: data.aadhaar,
      kycCompleted: true,
      termsAccepted: verifyForm.getValues().termsAccepted
    });
    // Navigate to dashboard immediately as per PRD HOME-6 / AUTH-1
    navigate('/');
  };

  if (user) return null; // Avoid flicker while redirecting

  return (
    <div className="max-w-md mx-auto py-12">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-[var(--text-primary)]">Welcome to AutoFinAI</h2>
        <p className="text-[var(--text-secondary)] mt-2">Sign in or create an account to proceed</p>
      </div>

      <div className="bg-[var(--bg-surface)] p-6 md:p-8 rounded-2xl shadow-sm border border-[var(--border-subtle)]">
        {step === 'mobile' ? (
          <form onSubmit={mobileForm.handleSubmit(onMobileSubmit)} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Mobile Number</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-[var(--text-secondary)] sm:text-sm">+91</span>
                </div>
                <input
                  {...mobileForm.register('mobile')}
                  type="tel"
                  className="w-full pl-12 pr-3 py-3 border border-[var(--border-subtle)] rounded-xl focus:ring-[var(--accent-primary)] focus:border-[var(--accent-primary)] bg-[var(--bg-elevated)] text-[var(--text-primary)]"
                  placeholder="9999999999"
                  maxLength={10}
                />
              </div>
              {mobileForm.formState.errors.mobile && (
                <p className="mt-1 text-sm text-red-500">{mobileForm.formState.errors.mobile.message as string}</p>
              )}
            </div>

            <button
              type="submit"
              className="w-full flex justify-center items-center gap-2 bg-[var(--accent-primary)] text-white p-4 rounded-xl font-medium hover:opacity-90 transition"
            >
              Get OTP <ArrowRight className="w-5 h-5" />
            </button>
          </form>
        ) : step === 'verify' ? (
          <form onSubmit={verifyForm.handleSubmit(onVerifySubmit)} className="space-y-6">
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[var(--bg-elevated)] text-[var(--accent-primary)] mb-3">
                <Smartphone className="w-6 h-6" />
              </div>
              <p className="text-sm text-[var(--text-secondary)]">
                OTP sent to <strong>+91 {mobileNumber}</strong>
                <button type="button" onClick={() => setStep('mobile')} className="ml-2 text-[var(--accent-primary)] font-medium hover:underline">Edit</button>
              </p>
              <p className="text-xs text-gray-400 mt-1">Hint: Use 123456</p>
            </div>

            <div>
              <div className="flex justify-between items-end mb-1">
                <label className="block text-sm font-medium text-[var(--text-secondary)]">Enter OTP</label>
                <div className="flex items-center gap-1 text-xs text-[var(--accent-primary)] bg-[var(--bg-elevated)] px-2 py-0.5 rounded border border-[var(--border-subtle)]">
                  <Shield className="w-3 h-3" /> 256-bit Encrypted
                </div>
              </div>
              <input
                {...verifyForm.register('otp')}
                type="text"
                disabled={locked}
                className="w-full text-center tracking-[0.5em] text-2xl py-3 border border-[var(--border-subtle)] rounded-xl focus:ring-[var(--accent-primary)] disabled:opacity-50 bg-[var(--bg-elevated)] text-[var(--text-primary)]"
                maxLength={6}
                placeholder="------"
              />
              {verifyForm.formState.errors.otp && (
                <p className="mt-1 text-sm text-red-500 text-center">{verifyForm.formState.errors.otp.message as string}</p>
              )}
            </div>

            <div className="bg-[var(--bg-elevated)] p-4 rounded-xl border border-[var(--border-subtle)]">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  {...verifyForm.register('termsAccepted')}
                  className="mt-1 w-4 h-4 text-[var(--accent-primary)] rounded border-[var(--border-subtle)] focus:ring-[var(--accent-primary)]"
                />
                <span className="text-sm text-[var(--text-secondary)]">
                  I agree to the <a href="#" className="text-[var(--accent-primary)] underline">Terms and Conditions</a> and have read the <a href="#" className="text-[var(--accent-primary)] underline">Privacy Notice</a>.
                </span>
              </label>
              {verifyForm.formState.errors.termsAccepted && (
                <p className="mt-2 text-sm text-red-500">{verifyForm.formState.errors.termsAccepted.message as string}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={locked}
              className="w-full flex justify-center items-center gap-2 bg-[var(--accent-primary)] text-white p-4 rounded-xl font-medium hover:opacity-90 transition disabled:opacity-50"
            >
              Verify & Continue
            </button>
          </form>
        ) : (
          <form onSubmit={kycForm.handleSubmit(onKycSubmit)} className="space-y-6">
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[var(--bg-elevated)] text-[var(--accent-primary)] mb-3 border border-[var(--border-subtle)]">
                <Fingerprint className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-[var(--text-primary)]">Personal Details & KYC</h3>
              <p className="text-sm text-[var(--text-secondary)] mt-1">
                Please provide your details to complete onboarding.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-end mb-1">
                  <label className="block text-sm font-medium text-[var(--text-secondary)]">PAN Number</label>
                  <div className="flex items-center gap-1 text-[10px] text-[var(--accent-primary)] font-medium">
                    <Shield className="w-3 h-3" /> Encrypted
                  </div>
                </div>
                <input
                  {...kycForm.register('pan')}
                  type="text"
                  className="w-full border border-[var(--border-subtle)] rounded-xl p-3 focus:ring-[var(--accent-primary)] bg-[var(--bg-elevated)] text-[var(--text-primary)] uppercase"
                  placeholder="ABCDE1234F"
                  maxLength={10}
                />
                {kycForm.formState.errors.pan && <p className="text-sm text-red-500 mt-1">{kycForm.formState.errors.pan.message as string}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Name exactly as on PAN</label>
                <input
                  {...kycForm.register('nameOnPan')}
                  type="text"
                  className="w-full border border-[var(--border-subtle)] rounded-xl p-3 focus:ring-[var(--accent-primary)] bg-[var(--bg-elevated)] text-[var(--text-primary)] uppercase"
                  placeholder="JOHN DOE"
                />
                {kycForm.formState.errors.nameOnPan && <p className="text-sm text-red-500 mt-1">{kycForm.formState.errors.nameOnPan.message as string}</p>}
              </div>

              <div>
                <div className="flex justify-between items-end mb-1">
                  <label className="block text-sm font-medium text-[var(--text-secondary)]">Aadhaar Number</label>
                  <div className="flex items-center gap-1 text-[10px] text-[var(--accent-primary)] font-medium">
                    <Shield className="w-3 h-3" /> Encrypted
                  </div>
                </div>
                <input
                  {...kycForm.register('aadhaar')}
                  type="text"
                  className="w-full border border-[var(--border-subtle)] rounded-xl p-3 focus:ring-[var(--accent-primary)] bg-[var(--bg-elevated)] text-[var(--text-primary)] tracking-widest font-financial"
                  placeholder="0000 0000 0000"
                  maxLength={12}
                />
                {kycForm.formState.errors.aadhaar && <p className="text-sm text-red-500 mt-1">{kycForm.formState.errors.aadhaar.message as string}</p>}
              </div>
            </div>

            <div className="bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-xl p-4 space-y-4">
              <label className="flex items-start gap-3 cursor-pointer group">
                <input type="checkbox" {...kycForm.register('consentKyc')} className="mt-1 w-4 h-4 text-[var(--accent-primary)] rounded border-[var(--border-subtle)] focus:ring-[var(--accent-primary)]" />
                <span className="text-sm text-[var(--text-secondary)] group-hover:text-[var(--text-primary)] transition">I consent to fetching my KYC information from CKYC/UIDAI registries.</span>
              </label>
              {kycForm.formState.errors.consentKyc && <p className="text-xs text-red-500 ml-7">{kycForm.formState.errors.consentKyc.message as string}</p>}
              
              <label className="flex items-start gap-3 cursor-pointer group">
                <input type="checkbox" {...kycForm.register('consentBureau')} className="mt-1 w-4 h-4 text-[var(--accent-primary)] rounded border-[var(--border-subtle)] focus:ring-[var(--accent-primary)]" />
                <span className="text-sm text-[var(--text-secondary)] group-hover:text-[var(--text-primary)] transition">I consent to a credit information pull from Experian/CIBIL to determine eligibility.</span>
              </label>
              {kycForm.formState.errors.consentBureau && <p className="text-xs text-red-500 ml-7">{kycForm.formState.errors.consentBureau.message as string}</p>}
            </div>

            <button
              type="submit"
              className="w-full flex justify-center items-center gap-2 bg-[var(--accent-primary)] text-white p-4 rounded-xl font-medium hover:opacity-90 transition"
            >
              Complete Onboarding <CheckCircle2 className="w-5 h-5" />
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
