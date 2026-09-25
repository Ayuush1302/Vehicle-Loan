import { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAppStore } from '../../store/useAppStore';
import { calculateEMI } from '../../config/loanLogic';
import { FileText, ChevronDown, Download, Smartphone, Check, Wallet } from 'lucide-react';

export default function OfferStep() {
  const navigate = useNavigate();
  const { currentAppId, applications, updateApplication } = useAppStore();
  
  const currentApp = applications.find(a => a.id === currentAppId);
  if (!currentApp || !currentApp.decision) {
    return <Navigate to="/apply/decision" replace />;
  }

  const { decision } = currentApp;

  // Sections unlocking state
  const [kfsOpened, setKfsOpened] = useState(false);
  const [kfsAccepted, setKfsAccepted] = useState(false);
  
  const [signStatus, setSignStatus] = useState<'idle' | 'signing' | 'signed'>('idle');
  const [mandateStatus, setMandateStatus] = useState<'idle' | 'setting' | 'set'>('idle');

  // Computed Values
  const amount = decision.finalAmount;
  const tenure = decision.finalTenure;
  const rate = decision.finalRate;
  const emi = calculateEMI(amount, rate, tenure);
  
  const processingFee = Math.round(amount * 0.015); // 1.5% PF
  const gstOnPf = Math.round(processingFee * 0.18);
  const totalInterest = (emi * tenure) - amount;
  
  // APR Approximation (Rough for demo purposes)
  const apr = rate + ((processingFee / amount) * 12);
  
  const firstEmiDate = new Date();
  firstEmiDate.setMonth(firstEmiDate.getMonth() + 1);
  firstEmiDate.setDate(5); // 5th of every month

  const onSign = () => {
    setSignStatus('signing');
    setTimeout(() => {
      setSignStatus('signed');
    }, 1500);
  };

  const onMandate = () => {
    setMandateStatus('setting');
    setTimeout(() => {
      setMandateStatus('set');
      
      // Update app status and navigate
      updateApplication(currentApp.id, {
        offer: {
          accepted: true,
          processingFee,
          apr,
          firstEmiDate: firstEmiDate.toISOString()
        },
        status: 'Mandate Set'
      });
      setTimeout(() => navigate('/apply/disbursal'), 1000);
    }, 2000);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900">Offer & Key Fact Statement</h2>
        <p className="text-gray-500 mt-2">Review your final loan terms and complete the agreement.</p>
      </div>

      {/* 9a. Offer Summary */}
      <div className="bg-white rounded-2xl shadow-sm border border-brand-200 overflow-hidden">
        <div className="bg-brand-50 p-5 border-b border-brand-100 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-brand-900 text-lg">Your Approved Offer</h3>
            <p className="text-sm text-brand-700">Valid until {new Date(Date.now() + 7 * 86400000).toLocaleDateString()}</p>
          </div>
          <div className="bg-white px-4 py-2 rounded-lg border border-brand-200 shadow-sm text-center">
            <p className="text-xs text-gray-500 uppercase font-semibold">Monthly EMI</p>
            <p className="text-xl font-bold font-financial text-brand-600">₹{emi.toLocaleString()}</p>
          </div>
        </div>
        
        <div className="p-6 grid grid-cols-2 gap-y-6 gap-x-4">
          <div>
            <p className="text-sm text-gray-500 mb-1">Loan Amount</p>
            <p className="text-lg font-semibold font-financial text-gray-900">₹{amount.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500 mb-1">Tenure</p>
            <p className="text-lg font-semibold text-gray-900">{tenure} Months</p>
          </div>
          <div>
            <p className="text-sm text-gray-500 mb-1">Interest Rate</p>
            <p className="text-lg font-semibold text-gray-900">{rate.toFixed(2)}% p.a.</p>
            <p className="text-xs text-gray-400">Fixed Rate</p>
          </div>
          <div>
            <p className="text-sm text-gray-500 mb-1">Annual Percentage Rate (APR)</p>
            <p className="text-lg font-semibold text-gray-900">{apr.toFixed(2)}%</p>
            <p className="text-xs text-gray-400">Inclusive of all fees</p>
          </div>
        </div>

        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Processing Fee</span>
            <span className="font-medium font-financial text-gray-900">₹{processingFee.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">GST on PF (18%)</span>
            <span className="font-medium font-financial text-gray-900">₹{gstOnPf.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Total Interest Payable</span>
            <span className="font-medium font-financial text-gray-900">₹{totalInterest.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-sm pt-2 border-t border-gray-200 font-semibold">
            <span className="text-gray-900">Total Amount Payable (over {tenure} months)</span>
            <span className="text-gray-900 font-financial">₹{(amount + totalInterest + processingFee + gstOnPf).toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* 9b. Key Fact Statement (KFS) */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <button 
          onClick={() => setKfsOpened(!kfsOpened)}
          className="w-full p-5 flex items-center justify-between text-left hover:bg-gray-50 transition"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Key Fact Statement (KFS)</h3>
              <p className="text-sm text-gray-500">Read and download the regulatory summary.</p>
            </div>
          </div>
          <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${kfsOpened ? 'rotate-180' : ''}`} />
        </button>
        
        {kfsOpened && (
          <div className="p-6 border-t border-gray-100 bg-gray-50">
            <div className="bg-white border border-gray-200 rounded-xl p-5 mb-5 space-y-4 text-sm text-gray-700">
              <p><strong>1. Loan Type:</strong> {currentApp.asset?.condition} Vehicle Loan ({currentApp.asset?.type})</p>
              <p><strong>2. Cooling-off Period:</strong> 3 days from the date of disbursal. During this period, you may exit the loan by repaying the principal and proportionate interest without any pre-payment penalty.</p>
              <p><strong>3. Penal Charges:</strong> <span className="font-financial">₹500</span> per instance of EMI bounce. Penal charges are strictly flat and are not compounded.</p>
              <p><strong>4. Foreclosure Charges:</strong> Nil. As per RBI guidelines for floating/fixed individual vehicle loans, no pre-payment penalties apply.</p>
              
              <div className="mt-4 pt-4 border-t border-gray-100">
                <p className="font-semibold text-gray-900 mb-2">Amortisation Schedule (Summary)</p>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead>
                      <tr className="bg-gray-50 text-gray-500">
                        <th className="py-2 px-3">Month</th>
                        <th className="py-2 px-3">Opening Bal</th>
                        <th className="py-2 px-3">EMI</th>
                        <th className="py-2 px-3">Interest</th>
                        <th className="py-2 px-3">Principal</th>
                        <th className="py-2 px-3">Closing Bal</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b border-gray-100">
                        <td className="py-2 px-3">1</td>
                        <td className="py-2 px-3 font-financial">₹{amount.toLocaleString()}</td>
                        <td className="py-2 px-3 font-financial">₹{emi.toLocaleString()}</td>
                        <td className="py-2 px-3 font-financial">₹{Math.round(amount * (rate/12/100)).toLocaleString()}</td>
                        <td className="py-2 px-3 font-financial">₹{(emi - Math.round(amount * (rate/12/100))).toLocaleString()}</td>
                        <td className="py-2 px-3 font-financial">₹{(amount - (emi - Math.round(amount * (rate/12/100)))).toLocaleString()}</td>
                      </tr>
                      <tr>
                        <td colSpan={6} className="py-3 text-center text-gray-400 italic">... schedule continues for {tenure} months ...</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-brand-600 hover:bg-brand-50 transition shadow-sm">
                <Download className="w-4 h-4" /> Sanction Letter
              </button>
              <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-brand-600 hover:bg-brand-50 transition shadow-sm">
                <Download className="w-4 h-4" /> Key Fact Statement
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 9c. Accept, Sign, Mandate */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 space-y-6">
        
        <label className={`flex items-start gap-3 cursor-pointer group p-4 rounded-xl transition ${kfsOpened ? 'bg-gray-50 border border-gray-200' : 'opacity-50 pointer-events-none'}`}>
          <input 
            type="checkbox" 
            checked={kfsAccepted}
            onChange={(e) => setKfsAccepted(e.target.checked)}
            className="mt-1 w-5 h-5 text-brand-600 rounded border-gray-300 focus:ring-brand-500" 
          />
          <div className="flex-1">
            <span className="block font-medium text-gray-900">I have read the Key Fact Statement and accept the loan terms.</span>
            {!kfsOpened && <span className="block text-xs text-brand-600 mt-1">Please expand and read the KFS above to enable.</span>}
          </div>
        </label>

        <div className={`space-y-4 transition-opacity ${!kfsAccepted ? 'opacity-50 pointer-events-none' : ''}`}>
          
          {/* E-Sign */}
          <div className="flex items-center justify-between p-4 border border-gray-200 rounded-xl">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${signStatus === 'signed' ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-500'}`}>
                {signStatus === 'signed' ? <Check className="w-5 h-5" /> : <Smartphone className="w-5 h-5" />}
              </div>
              <div>
                <p className="font-semibold text-gray-900">E-Sign Loan Agreement</p>
                <p className="text-xs text-gray-500">Sign digitally using Aadhaar OTP</p>
              </div>
            </div>
            <button 
              onClick={onSign}
              disabled={signStatus !== 'idle'}
              className={`px-5 py-2 rounded-lg font-medium text-sm transition ${signStatus === 'signed' ? 'bg-green-50 text-green-700' : signStatus === 'signing' ? 'bg-gray-100 text-gray-500' : 'bg-brand-600 text-white hover:bg-brand-700'}`}
            >
              {signStatus === 'signed' ? 'Signed' : signStatus === 'signing' ? 'Signing...' : 'Sign Now'}
            </button>
          </div>

          {/* Mandate */}
          <div className={`flex items-center justify-between p-4 border rounded-xl transition ${signStatus !== 'signed' ? 'opacity-50 pointer-events-none border-gray-100' : 'border-gray-200'}`}>
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${mandateStatus === 'set' ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-500'}`}>
                {mandateStatus === 'set' ? <Check className="w-5 h-5" /> : <Wallet className="w-5 h-5" />}
              </div>
              <div>
                <p className="font-semibold text-gray-900">Setup Auto-Debit (e-NACH)</p>
                <p className="text-xs text-gray-500">First EMI: {firstEmiDate.toLocaleDateString()}</p>
              </div>
            </div>
            <button 
              onClick={onMandate}
              disabled={mandateStatus !== 'idle'}
              className={`px-5 py-2 rounded-lg font-medium text-sm transition ${mandateStatus === 'set' ? 'bg-green-50 text-green-700' : mandateStatus === 'setting' ? 'bg-gray-100 text-gray-500' : 'bg-brand-600 text-white hover:bg-brand-700'}`}
            >
              {mandateStatus === 'set' ? 'Setup Complete' : mandateStatus === 'setting' ? 'Processing...' : 'Setup Now'}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
