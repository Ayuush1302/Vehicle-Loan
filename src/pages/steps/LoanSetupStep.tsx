import { useState, useEffect } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAppStore } from '../../store/useAppStore';
import { calculateEMI, getIndicativeRate } from '../../config/loanLogic';
import { VALUATION_PARAMS } from '../../config/valuation';
import { ArrowRight, Info, ShieldCheck } from 'lucide-react';

export default function LoanSetupStep() {
  const navigate = useNavigate();
  const { currentAppId, applications, updateApplication } = useAppStore();
  
  const currentApp = applications.find(a => a.id === currentAppId);
  if (!currentApp || !currentApp.valuation) {
    return <Navigate to="/apply/valuation" replace />;
  }

  const { asset, vehicle, valuation, loanSetup: existing } = currentApp;
  
  if (!asset || !vehicle) return <Navigate to="/apply/asset" replace />;
  
  const typeStr = `${asset.condition}_${asset.type}`;
  const params = VALUATION_PARAMS[typeStr as keyof typeof VALUATION_PARAMS];

  // Boundaries
  const minAmount = params.minTicket;
  const maxAmount = valuation.maxLoan;
  const maxTenure = valuation.maxTenure;
  
  // States
  const [loanAmount, setLoanAmount] = useState<number>(existing?.loanAmount || maxAmount);
  
  // Tenure increments of 6 months. Cap at maxTenure.
  const [tenure, setTenure] = useState<number>(existing?.tenureMonths || maxTenure);
  
  const [hasInsurance, setHasInsurance] = useState<boolean>(existing?.hasCreditLifeInsurance || false);

  const rate = getIndicativeRate(asset.condition!, asset.type!);
  
  // Adjust bounds if maxLoan changed (e.g. from going back and changing vehicle)
  useEffect(() => {
    if (loanAmount > maxAmount) setLoanAmount(maxAmount);
    if (loanAmount < minAmount) setLoanAmount(minAmount);
    if (tenure > maxTenure) setTenure(maxTenure);
  }, [maxAmount, minAmount, maxTenure]);

  // Calculations
  const emi = calculateEMI(loanAmount, rate, tenure);
  const totalInterest = (emi * tenure) - loanAmount;
  
  // Down payment = (Asset Cost) - (Loan Amount)
  // For New: Asset cost = On-Road Price
  // For Used: Asset cost = Agreed Price
  const assetCost = asset.condition === 'New' ? (vehicle.onRoadPrice || 0) : (vehicle.agreedPrice || 0);
  const downPayment = assetCost - loanAmount;

  const onProceed = () => {
    updateApplication(currentApp.id, {
      loanSetup: {
        loanAmount,
        tenureMonths: tenure,
        indicativeRate: rate,
        emi,
        downPayment,
        hasCreditLifeInsurance: hasInsurance
      }
    });
    navigate('/apply/applicant');
  };

  // Generate tenure options in 6-month steps up to maxTenure
  const tenureOptions: number[] = [];
  for (let t = 6; t <= maxTenure; t += 6) {
    tenureOptions.push(t);
  }
  // Ensure maxTenure is in the list if it's not a multiple of 6
  if (!tenureOptions.includes(maxTenure) && maxTenure > 0) {
    tenureOptions.push(maxTenure);
    tenureOptions.sort((a, b) => a - b);
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900">Customise Your Loan</h2>
        <p className="text-gray-500 mt-2">Adjust the amount and tenure to fit your budget.</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        
        {/* Sliders Area */}
        <div className="p-6 md:p-8 space-y-8 border-b border-gray-100">
          
          {/* Loan Amount Slider */}
          <div>
            <div className="flex justify-between items-end mb-4">
              <label className="font-semibold text-gray-900">Loan Amount</label>
              <div className="text-2xl font-bold font-financial text-brand-600">₹{loanAmount.toLocaleString()}</div>
            </div>
            
            <input 
              type="range" 
              min={minAmount} 
              max={maxAmount} 
              step={1000}
              value={loanAmount}
              onChange={(e) => setLoanAmount(Number(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-brand-600"
            />
            <div className="flex justify-between text-xs text-gray-400 mt-2 font-medium">
              <span className="font-financial">Min: ₹{minAmount.toLocaleString()}</span>
              <span className="font-financial">Max: ₹{maxAmount.toLocaleString()}</span>
            </div>
          </div>

          {/* Tenure Slider */}
          <div>
            <div className="flex justify-between items-end mb-4">
              <label className="font-semibold text-gray-900">Tenure (Months)</label>
              <div className="text-2xl font-bold text-brand-600">{tenure} <span className="text-sm font-medium text-gray-500">Months</span></div>
            </div>
            
            <input 
              type="range" 
              min={6} 
              max={maxTenure} 
              step={6}
              value={tenure}
              onChange={(e) => {
                // Snap to nearest available option
                const val = Number(e.target.value);
                const closest = tenureOptions.reduce((prev, curr) => Math.abs(curr - val) < Math.abs(prev - val) ? curr : prev);
                setTenure(closest);
              }}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-brand-600"
            />
            <div className="flex justify-between text-xs text-gray-400 mt-2 font-medium">
              {tenureOptions.map(t => (
                <span key={t} className={t === tenure ? 'text-brand-600' : 'hidden md:inline-block'}>
                  {t}m
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Results Area */}
        <div className="bg-gray-50 p-6 md:p-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="col-span-2">
              <p className="text-sm font-medium text-gray-500 mb-1">Monthly EMI</p>
              <p className="text-3xl font-bold font-financial text-gray-900">₹{emi.toLocaleString()}</p>
            </div>
            <div className="col-span-2 md:col-span-1">
              <p className="text-sm font-medium text-gray-500 mb-1">Down Payment</p>
              <p className="text-xl font-semibold font-financial text-gray-900">₹{Math.max(0, downPayment).toLocaleString()}</p>
            </div>
            <div className="col-span-2 md:col-span-1">
              <p className="text-sm font-medium text-gray-500 mb-1">Total Interest</p>
              <p className="text-xl font-semibold font-financial text-gray-900">₹{totalInterest.toLocaleString()}</p>
            </div>
          </div>

          <div className="mt-6 p-4 bg-blue-50 text-blue-800 rounded-xl flex gap-3 text-sm border border-blue-100">
            <Info className="w-5 h-5 shrink-0 text-blue-600" />
            <p>
              The interest rate shown is an <strong>indicative rate</strong> of {rate.toFixed(2)}% p.a. 
              The final rate and EMI will be determined after your credit assessment.
            </p>
          </div>
        </div>
      </div>

      {/* Optional Add-ons */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-gray-500" /> Optional Add-ons
        </h3>
        
        <label className="flex items-start gap-4 p-4 border border-gray-200 rounded-xl cursor-pointer hover:bg-gray-50 transition group">
          <input 
            type="checkbox" 
            checked={hasInsurance}
            onChange={(e) => setHasInsurance(e.target.checked)}
            className="mt-1 w-5 h-5 text-brand-600 rounded border-gray-300 focus:ring-brand-500" 
          />
          <div className="flex-1">
            <span className="block font-medium text-gray-900 group-hover:text-brand-700 transition">Credit Life Insurance</span>
            <span className="block text-sm text-gray-500 mt-1">
              Secures your loan in case of unforeseen events. The premium will be added to your loan amount and EMI.
            </span>
            <span className="inline-block mt-2 text-xs font-semibold px-2.5 py-1 bg-gray-100 text-gray-600 rounded">
              Not required for approval
            </span>
          </div>
        </label>
      </div>

      <button 
        onClick={onProceed}
        className="w-full bg-brand-600 text-white p-4 rounded-xl font-medium hover:bg-brand-700 transition flex justify-center items-center gap-2"
      >
        Continue to Applicant Details <ArrowRight className="w-5 h-5" />
      </button>
    </div>
  );
}
