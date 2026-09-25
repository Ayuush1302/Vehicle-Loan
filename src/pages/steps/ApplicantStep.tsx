import { useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAppStore } from '../../store/useAppStore';
import { ArrowRight, Building, Home, CreditCard, AlertCircle, Shield } from 'lucide-react';

const applicantSchema = z.object({
  dob: z.string().min(1, 'Date of birth is required'),
  email: z.string().email('Enter a valid email'),
  employmentType: z.enum(['Salaried', 'Self-employed'], { required_error: 'Select employment type' }),
  employerName: z.string().min(2, 'Enter employer or business name'),
  netMonthlyIncome: z.coerce.number().min(1000, 'Minimum income is 1000'),
  existingEmis: z.coerce.number().min(0),
  residenceType: z.enum(['Owned', 'Rented', 'Living with parents'], { required_error: 'Select residence type' }),
  addressLine1: z.string().min(5, 'Enter address'),
  addressLine2: z.string().optional(),
  pincode: z.string().regex(/^[1-9][0-9]{5}$/, 'Invalid 6-digit pincode'),
  city: z.string().min(2, 'Enter city'),
  state: z.string().min(2, 'Enter state'),
  bankAccountNo: z.string().min(9, 'Valid account number required'),
  bankIfsc: z.string().regex(/^[A-Z]{4}0[A-Z0-9]{6}$/, 'Invalid IFSC code'),
});

export default function ApplicantStep() {
  const navigate = useNavigate();
  const { user, currentAppId, applications, updateApplication } = useAppStore();
  
  const currentApp = applications.find(a => a.id === currentAppId);
  if (!currentApp || !currentApp.loanSetup) {
    return <Navigate to="/apply/loan-setup" replace />;
  }

  const { loanSetup, applicant: existing } = currentApp;
  const [ageError, setAgeError] = useState<string | null>(null);

  const form = useForm({
    resolver: zodResolver(applicantSchema),
    defaultValues: {
      dob: existing?.dob || '',
      email: existing?.email || '',
      employmentType: existing?.employmentType || undefined,
      employerName: existing?.employerName || '',
      netMonthlyIncome: existing?.netMonthlyIncome || undefined,
      existingEmis: existing?.existingEmis || 0,
      residenceType: existing?.residenceType || undefined,
      addressLine1: existing?.addressLine1 || '',
      addressLine2: existing?.addressLine2 || '',
      pincode: existing?.pincode || '',
      city: existing?.city || '',
      state: existing?.state || '',
      bankAccountNo: existing?.bankAccountNo || '',
      bankIfsc: existing?.bankIfsc || '',
    }
  });

  const empType = useWatch({ control: form.control, name: 'employmentType' });

  const onSubmit = (data: any) => {
    // Age Gate Check
    const dob = new Date(data.dob);
    const today = new Date();
    const ageAtApp = (today.getTime() - dob.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
    
    if (ageAtApp < 21) {
      setAgeError("Minimum age requirement is 21 years at the time of application.");
      return;
    }

    const maturityDate = new Date(today);
    maturityDate.setMonth(maturityDate.getMonth() + loanSetup.tenureMonths);
    const ageAtMaturity = (maturityDate.getTime() - dob.getTime()) / (1000 * 60 * 60 * 24 * 365.25);

    const maxAge = data.employmentType === 'Salaried' ? 65 : 70;
    if (ageAtMaturity > maxAge) {
      setAgeError(`Age at loan maturity (${ageAtMaturity.toFixed(1)} years) exceeds the maximum allowed ${maxAge} years for ${data.employmentType} individuals. Please reduce loan tenure.`);
      return;
    }
    setAgeError(null);

    // Merge with user profile data captured during onboarding
    const currentApplicantData = applications.find(a => a.id === currentAppId)?.applicant;
    
    updateApplication(currentApp.id, {
      applicant: {
        ...currentApplicantData,
        ...data,
        pan: user?.pan,
        nameOnPan: user?.nameOnPan,
        consentKyc: true,
        consentBureau: true,
        consentData: true,
        bankName: 'HDFC Bank', // Mocked based on IFSC in a real app
        kycCompleted: true,
        kycMethod: 'Aadhaar e-KYC'
      }
    });

    navigate('/apply/decision');
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900">Applicant Details</h2>
        <p className="text-gray-500 mt-2">Provide your details to complete the application</p>
      </div>

      {ageError && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl flex gap-3">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <p className="text-sm font-medium">{ageError}</p>
        </div>
      )}

      {/* Verified Profile Summary */}
      <div className="bg-white rounded-2xl shadow-sm border border-green-200 overflow-hidden">
        <div className="bg-green-50 p-4 border-b border-green-100">
          <h3 className="font-semibold text-green-900">Verified Profile</h3>
        </div>
        <div className="p-6 flex items-center justify-between">
          <div className="flex gap-6 items-center">
             <div className="w-16 h-16 bg-white border border-green-100 rounded-xl overflow-hidden shrink-0 shadow-sm">
                <img src={`https://api.dicebear.com/7.x/initials/svg?seed=${user?.nameOnPan}&backgroundColor=e5e4e7`} alt="Profile" />
              </div>
              <div className="space-y-1">
                <p className="font-bold text-gray-900 text-lg">{user?.nameOnPan}</p>
                <p className="text-sm text-gray-500">PAN: <span className="font-financial">{user?.pan?.replace(/.(?=.{4})/g, '*')}</span></p>
                <p className="text-xs font-medium text-green-700 bg-green-100 inline-block px-2 py-1 rounded">KYC Completed via Onboarding</p>
              </div>
          </div>
        </div>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        
        {/* Personal & Employment */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="bg-gray-50 p-4 border-b border-gray-100 flex items-center gap-2">
            <Building className="w-5 h-5 text-gray-500" />
            <h3 className="font-semibold text-gray-900">Personal & Employment</h3>
          </div>
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
              <input {...form.register('dob')} type="date" className="w-full border border-gray-300 rounded-xl p-3 focus:ring-brand-500" />
              {form.formState.errors.dob && <p className="text-sm text-red-600 mt-1">{form.formState.errors.dob.message as string}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
              <input {...form.register('email')} type="email" className="w-full border border-gray-300 rounded-xl p-3 focus:ring-brand-500" placeholder="john@example.com" />
              {form.formState.errors.email && <p className="text-sm text-red-600 mt-1">{form.formState.errors.email.message as string}</p>}
            </div>
            
            <div className="md:col-span-2 pt-2 border-t border-gray-100">
              <label className="block text-sm font-medium text-gray-700 mb-2">Employment Type</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => form.setValue('employmentType', 'Salaried')}
                  className={`p-3 border rounded-xl font-medium transition ${empType === 'Salaried' ? 'border-brand-600 bg-brand-50 text-brand-700' : 'border-gray-200 hover:border-gray-300 bg-white text-gray-700'}`}
                >
                  Salaried
                </button>
                <button
                  type="button"
                  onClick={() => form.setValue('employmentType', 'Self-employed')}
                  className={`p-3 border rounded-xl font-medium transition ${empType === 'Self-employed' ? 'border-brand-600 bg-brand-50 text-brand-700' : 'border-gray-200 hover:border-gray-300 bg-white text-gray-700'}`}
                >
                  Self-employed
                </button>
              </div>
              {form.formState.errors.employmentType && <p className="text-sm text-red-600 mt-1">{form.formState.errors.employmentType.message as string}</p>}
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Employer / Business Name</label>
              <input {...form.register('employerName')} type="text" className="w-full border border-gray-300 rounded-xl p-3 focus:ring-brand-500" placeholder="Acme Corp" />
              {form.formState.errors.employerName && <p className="text-sm text-red-600 mt-1">{form.formState.errors.employerName.message as string}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Net Monthly Income (<span className="font-financial">₹</span>)</label>
              <input {...form.register('netMonthlyIncome')} type="number" className="w-full border border-gray-300 rounded-xl p-3 focus:ring-brand-500" placeholder="50000" />
              {form.formState.errors.netMonthlyIncome && <p className="text-sm text-red-600 mt-1">{form.formState.errors.netMonthlyIncome.message as string}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Total Existing EMIs (<span className="font-financial">₹</span>/month)</label>
              <input {...form.register('existingEmis')} type="number" className="w-full border border-gray-300 rounded-xl p-3 focus:ring-brand-500" placeholder="0" />
              {form.formState.errors.existingEmis && <p className="text-sm text-red-600 mt-1">{form.formState.errors.existingEmis.message as string}</p>}
            </div>
          </div>
        </div>

        {/* Address */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="bg-gray-50 p-4 border-b border-gray-100 flex items-center gap-2">
            <Home className="w-5 h-5 text-gray-500" />
            <h3 className="font-semibold text-gray-900">Current Residence</h3>
          </div>
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Residence Type</label>
              <select {...form.register('residenceType')} className="w-full border border-gray-300 rounded-xl p-3 focus:ring-brand-500">
                <option value="">Select Type</option>
                <option value="Owned">Owned</option>
                <option value="Rented">Rented</option>
                <option value="Living with parents">Living with parents</option>
              </select>
              {form.formState.errors.residenceType && <p className="text-sm text-red-600 mt-1">{form.formState.errors.residenceType.message as string}</p>}
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Address Line 1</label>
              <input {...form.register('addressLine1')} type="text" className="w-full border border-gray-300 rounded-xl p-3 focus:ring-brand-500" />
              {form.formState.errors.addressLine1 && <p className="text-sm text-red-600 mt-1">{form.formState.errors.addressLine1.message as string}</p>}
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Address Line 2 (Optional)</label>
              <input {...form.register('addressLine2')} type="text" className="w-full border border-gray-300 rounded-xl p-3 focus:ring-brand-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
              <input {...form.register('city')} list="cities" type="text" className="w-full border border-gray-300 rounded-xl p-3 focus:ring-brand-500" placeholder="e.g. Mumbai" />
              <datalist id="cities">
                <option value="Mumbai" />
                <option value="Delhi" />
                <option value="Bangalore" />
                <option value="Hyderabad" />
                <option value="Pune" />
                <option value="Chennai" />
                <option value="Kolkata" />
                <option value="Ahmedabad" />
              </datalist>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
              <input {...form.register('state')} list="states" type="text" className="w-full border border-gray-300 rounded-xl p-3 focus:ring-brand-500" placeholder="e.g. Maharashtra" />
              <datalist id="states">
                <option value="Maharashtra" />
                <option value="Delhi" />
                <option value="Karnataka" />
                <option value="Telangana" />
                <option value="Tamil Nadu" />
                <option value="West Bengal" />
                <option value="Gujarat" />
              </datalist>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Pincode</label>
              <input {...form.register('pincode')} type="text" className="w-full border border-gray-300 rounded-xl p-3 focus:ring-brand-500" />
              {form.formState.errors.pincode && <p className="text-sm text-red-600 mt-1">{form.formState.errors.pincode.message as string}</p>}
            </div>
          </div>
        </div>

        {/* Bank Account */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="bg-gray-50 p-4 border-b border-gray-100 flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-gray-500" />
            <h3 className="font-semibold text-gray-900">Primary Bank Account</h3>
          </div>
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="md:col-span-2 text-sm text-gray-500 mb-2">
              This account will be used for setting up your monthly EMI auto-debit mandate. The name on the account must match your PAN.
            </div>
            <div>
              <div className="flex justify-between items-end mb-1">
                <label className="block text-sm font-medium text-gray-700">Account Number</label>
                <div className="flex items-center gap-1 text-[10px] text-green-700 font-medium">
                  <Shield className="w-3 h-3" /> Encrypted
                </div>
              </div>
              <input {...form.register('bankAccountNo')} type="password" placeholder="••••••••" className="w-full border border-gray-300 rounded-xl p-3 focus:ring-brand-500" />
              {form.formState.errors.bankAccountNo && <p className="text-sm text-red-600 mt-1">{form.formState.errors.bankAccountNo.message as string}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">IFSC Code</label>
              <input {...form.register('bankIfsc')} type="text" placeholder="HDFC0001234" className="w-full border border-gray-300 rounded-xl p-3 uppercase focus:ring-brand-500" />
              {form.formState.errors.bankIfsc && <p className="text-sm text-red-600 mt-1">{form.formState.errors.bankIfsc.message as string}</p>}
            </div>
          </div>
        </div>

        <button 
          type="submit" 
          className="w-full bg-brand-600 text-white p-4 rounded-xl font-medium hover:bg-brand-700 transition flex justify-center items-center gap-2"
        >
          Submit for Decision <ArrowRight className="w-5 h-5" />
        </button>
      </form>
    </div>
  );
}
