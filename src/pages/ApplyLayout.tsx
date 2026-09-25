import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import AccessStep from './steps/AccessStep';
import AssetStep from './steps/AssetStep';
import VehicleStep from './steps/VehicleStep';
import ValuationStep from './steps/ValuationStep';
import LoanSetupStep from './steps/LoanSetupStep';
import ApplicantStep from './steps/ApplicantStep';
import DecisionStep from './steps/DecisionStep';
import OfferStep from './steps/OfferStep';
import DisbursalStep from './steps/DisbursalStep';

const STEPS = [
  { path: 'access', label: 'Access' },
  { path: 'asset', label: '1 Asset' },
  { path: 'vehicle', label: '2 Vehicle' },
  { path: 'valuation', label: '3 Valuation' },
  { path: 'loan-setup', label: '4 Loan Setup' },
  { path: 'applicant', label: '5 Applicant & KYC' },
  { path: 'decision', label: '6 Decision' },
  { path: 'offer', label: '7 Offer & Sign' },
  { path: 'disbursal', label: '8 Disbursal' },
];



export default function ApplyLayout() {
  const location = useLocation();
  const currentPath = location.pathname.split('/').pop();
  
  // Find current step index (ignoring 'access' in the numbered stepper)
  const stepIndex = STEPS.findIndex(s => s.path === currentPath);
  const progress = stepIndex > 0 ? (stepIndex / (STEPS.length - 1)) * 100 : 0;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
      {/* Stepper Header (Only show for numbered steps) */}
      {stepIndex > 0 && (
        <div className="bg-gray-50 border-b border-gray-100 p-4 md:px-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-brand-600">
              Step {stepIndex} of {STEPS.length - 1}
            </span>
            <span className="text-sm font-medium text-gray-900">
              {STEPS[stepIndex]?.label.replace(/^\d+\s/, '')}
            </span>
          </div>
          <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-brand-600 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Step Content */}
      <div className="p-4 md:p-8">
        <Routes>
          <Route path="/" element={<Navigate to="access" replace />} />
          <Route path="access" element={<AccessStep />} />
          <Route path="asset" element={<AssetStep />} />
          <Route path="vehicle" element={<VehicleStep />} />
          <Route path="valuation" element={<ValuationStep />} />
          <Route path="loan-setup" element={<LoanSetupStep />} />
          <Route path="applicant" element={<ApplicantStep />} />
          <Route path="decision" element={<DecisionStep />} />
          <Route path="offer" element={<OfferStep />} />
          <Route path="disbursal" element={<DisbursalStep />} />
        </Routes>
      </div>
    </div>
  );
}
