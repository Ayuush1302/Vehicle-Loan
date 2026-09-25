import { useNavigate, Navigate } from 'react-router-dom';
import { useAppStore } from '../../store/useAppStore';
import { computeValuation } from '../../config/valuation';
import { MOCK_CATALOGUE } from '../../config/catalogue';
import { ArrowRight, AlertTriangle, ShieldAlert, CheckCircle, Info } from 'lucide-react';

export default function ValuationStep() {
  const navigate = useNavigate();
  const { currentAppId, applications, updateApplication } = useAppStore();
  
  const currentApp = applications.find(a => a.id === currentAppId);
  if (!currentApp || !currentApp.asset || !currentApp.vehicle) {
    return <Navigate to="/apply/asset" replace />;
  }

  const { asset, vehicle } = currentApp;
  const isNew = asset.condition === 'New';

  // Find base ex-showroom price for used vehicle valuation baseline
  const variant = MOCK_CATALOGUE.variants.find(v => v.id === vehicle.variantId);
  const basePrice = variant?.exShowroom || 0;

  // Compute valuation using the config rules
  const valuation = computeValuation(asset, vehicle, basePrice);

  const onProceed = () => {
    updateApplication(currentApp.id, { valuation });
    navigate('/apply/loan-setup');
  };

  if (!valuation.eligible) {
    return (
      <div className="max-w-xl mx-auto space-y-6">
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center">
          <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-red-900 mb-2">Not Eligible</h2>
          <p className="text-red-700 mb-6">
            Based on the vehicle details provided, we are unable to proceed with this application.
          </p>
          <div className="bg-white rounded-xl p-4 text-left border border-red-100 space-y-2">
            <h4 className="font-semibold text-gray-900 text-sm">Reasons:</h4>
            <ul className="list-disc pl-5 text-sm text-gray-700 space-y-1">
              {valuation.messages.map((msg, i) => <li key={i}>{msg}</li>)}
            </ul>
          </div>
        </div>
        <button 
          onClick={() => navigate('/apply/vehicle')}
          className="w-full text-brand-600 font-medium hover:underline text-center"
        >
          Go back to Vehicle Details
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900">Indicative Valuation</h2>
        <p className="text-gray-500 mt-2">
          Subject to credit assessment and, for used vehicles, physical inspection.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Loan Limits Card */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
          <div className="bg-brand-50 p-4 border-b border-gray-100 flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-brand-600" />
            <h3 className="font-semibold text-brand-900">Maximum Eligibility</h3>
          </div>
          <div className="p-6 flex-1 flex flex-col justify-center space-y-6 text-center">
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">Max Loan Amount</p>
              <p className="text-4xl font-bold font-financial text-gray-900">₹{valuation.maxLoan.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">Max Tenure</p>
              <p className="text-2xl font-bold text-gray-900">{valuation.maxTenure} Months</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">Required Down Payment</p>
              <p className="text-xl font-bold font-financial text-amber-600">₹{valuation.requiredDownPayment.toLocaleString()}</p>
            </div>
          </div>
        </div>

        {/* Breakdown Card */}
        <div className="bg-gray-50 rounded-2xl border border-gray-200 p-6 space-y-4">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Info className="w-4 h-4 text-gray-500" /> Calculation Basis
          </h3>
          
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Asset Category</span>
              <span className="font-medium text-gray-900">{asset.condition} {asset.type}</span>
            </div>
            
            {isNew ? (
              <div className="flex justify-between">
                <span className="text-gray-500">On-Road Price</span>
                <span className="font-medium font-financial text-gray-900">₹{vehicle.onRoadPrice?.toLocaleString()}</span>
              </div>
            ) : (
              <>
                <div className="flex justify-between">
                  <span className="text-gray-500">Agreed Price</span>
                  <span className="font-medium font-financial text-gray-900">₹{vehicle.agreedPrice?.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Age Depreciation</span>
                  <span className="font-medium text-gray-900">{valuation.depreciationStr}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Computed Market Value</span>
                  <span className="font-medium font-financial text-gray-900">₹{valuation.marketValue.toLocaleString()}</span>
                </div>
              </>
            )}

            <div className="pt-3 border-t border-gray-200 flex justify-between">
              <span className="text-gray-500">Funding Base</span>
              <span className="font-semibold font-financial text-gray-900">₹{valuation.fundingBase.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Max LTV Applied</span>
              <span className="font-medium text-gray-900">{(valuation.maxLTV * 100).toFixed(0)}%</span>
            </div>
          </div>

          {!isNew && vehicle.hypothecationStatus === 'Active' && (
            <div className="mt-4 p-3 bg-amber-50 rounded-lg border border-amber-100 flex gap-2 text-xs text-amber-800">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <p>Active loan detected. Disbursal requires NOC from {vehicle.existingFinancier}.</p>
            </div>
          )}
        </div>
      </div>

      <button 
        onClick={onProceed}
        className="w-full bg-brand-600 text-white p-4 rounded-xl font-medium hover:bg-brand-700 transition flex justify-center items-center gap-2"
      >
        Continue to Loan Setup <ArrowRight className="w-5 h-5" />
      </button>
    </div>
  );
}
