import { useState, useEffect } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAppStore } from '../../store/useAppStore';
import { CheckCircle2, Clock, Check, Building, ArrowRight, ShieldAlert, FileText, Upload } from 'lucide-react';

export default function DisbursalStep() {
  const navigate = useNavigate();
  const { currentAppId, applications, updateApplication } = useAppStore();
  
  const currentApp = applications.find(a => a.id === currentAppId);
  if (!currentApp || !currentApp.offer) {
    return <Navigate to="/apply/offer" replace />;
  }

  const { asset, vehicle, decision } = currentApp;
  
  const isDisbursed = currentApp.status === 'Disbursed' || currentApp.status === 'Closed' || currentApp.status === 'Cooled-off';
  const isCooledOff = currentApp.status === 'Cooled-off';

  // Checklist items based on condition
  const [checklist, setChecklist] = useState([
    { id: 'insurance', label: "Comprehensive insurance with lender's hypothecation noted", status: 'pending' }
  ]);

  useEffect(() => {
    // Build the dynamic checklist
    const items = [
      { id: 'insurance', label: "Comprehensive insurance with lender's hypothecation noted", status: 'pending' }
    ];

    if (asset?.condition === 'New') {
      items.push({ id: 'invoice', label: "Dealer invoice matches quotation", status: 'pending' });
      items.push({ id: 'margin', label: "Margin money (down payment) received by dealer", status: 'pending' });
    } else if (asset?.condition === 'Used') {
      if (asset.sellerType === 'Dealer') {
        items.push({ id: 'inspection', label: "Inspection/valuation report", status: 'pending' });
        items.push({ id: 'invoice', label: "Dealer invoice", status: 'pending' });
      } else {
        items.push({ id: 'seller_kyc', label: "Seller KYC", status: 'pending' });
        items.push({ id: 'transfer', label: "Transfer papers (Forms 29/30) & Seller consent", status: 'pending' });
      }
      if (vehicle?.hypothecationStatus === 'Active') {
        items.push({ id: 'hp_closure', label: "Existing-loan closure proof (NOC + Form 35)", status: 'pending' });
      }
    }

    setChecklist(items);
  }, [asset, vehicle]);

  const [verifying, setVerifying] = useState(false);
  const [allVerified, setAllVerified] = useState(false);
  
  const handleVerifyAll = () => {
    setVerifying(true);
    setTimeout(() => {
      setChecklist(prev => prev.map(item => ({ ...item, status: 'verified' })));
      setAllVerified(true);
      setVerifying(false);
    }, 2000);
  };

  const beneficiaryName = asset?.condition === 'New' || asset?.sellerType === 'Dealer' 
    ? (vehicle?.dealerId || 'Acme Auto Motors Pvt Ltd') 
    : 'Ramesh Kumar (Seller)';
  
  const handleReleaseFunds = () => {
    updateApplication(currentApp.id, {
      status: 'Disbursed',
      disbursal: {
        checklistCompleted: true,
        beneficiaryName,
        beneficiaryAccountMasked: 'XXXX XXXX 5678',
        disbursedAmount: decision?.finalAmount || 0,
        disbursalDate: new Date().toISOString(),
        coolingOffActive: true
      }
    });
  };

  const handleCoolingOffExit = () => {
    if (confirm("Are you sure you want to exit this loan? You will need to repay the principal amount and proportionate interest immediately.")) {
      updateApplication(currentApp.id, { status: 'Cooled-off' });
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900">Pre-Disbursal & Funding</h2>
        <p className="text-gray-500 mt-2">Final checks before releasing funds.</p>
      </div>

      {isCooledOff ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 text-center space-y-4">
          <div className="w-16 h-16 bg-gray-100 text-gray-500 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-gray-900">Loan Cancelled (Cooling-off)</h3>
          <p className="text-gray-600">You have successfully exited the loan without penalty during the cooling-off period.</p>
          <button onClick={() => navigate('/')} className="mt-4 bg-brand-600 text-white px-6 py-2.5 rounded-xl font-medium hover:bg-brand-700">
            Return to Dashboard
          </button>
        </div>
      ) : !isDisbursed ? (
        <>
          {/* Pre-disbursal Checklist */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="bg-gray-50 p-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900">Pre-Disbursal Checklist</h3>
              <p className="text-sm text-gray-500">The following documents must be verified before disbursal.</p>
            </div>
            
            <div className="p-0">
              <ul className="divide-y divide-gray-100">
                {checklist.map((item, idx) => (
                  <li key={idx} className="p-4 flex items-start gap-3">
                    {item.status === 'verified' ? (
                      <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5" />
                    ) : (
                      <Clock className="w-5 h-5 text-gray-400 mt-0.5" />
                    )}
                    <div>
                      <p className={`text-sm font-medium ${item.status === 'verified' ? 'text-gray-900' : 'text-gray-700'}`}>
                        {item.label}
                      </p>
                      {item.status === 'pending' && (
                        <button className="text-xs text-brand-600 font-medium hover:underline flex items-center gap-1 mt-1">
                          <Upload className="w-3 h-3" /> Upload Document
                        </button>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end">
              <button 
                onClick={handleVerifyAll}
                disabled={allVerified || verifying}
                className="bg-gray-900 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 disabled:opacity-50 flex items-center gap-2"
              >
                {verifying ? 'Verifying...' : allVerified ? 'All Verified' : 'Mock Verify All'}
              </button>
            </div>
          </div>

          {/* Disbursal Action */}
          <div className={`bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden transition-opacity ${!allVerified ? 'opacity-50 pointer-events-none' : ''}`}>
            <div className="p-6 text-center space-y-4">
              <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto">
                <Building className="w-8 h-8" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Amount ready for disbursal</p>
                <h3 className="text-3xl font-bold font-financial text-gray-900 my-1">₹{decision?.finalAmount.toLocaleString()}</h3>
                <p className="text-sm font-medium text-gray-700">Beneficiary: {beneficiaryName}</p>
                <p className="text-xs text-gray-500">Account: XXXX XXXX 5678</p>
              </div>
              <button 
                onClick={handleReleaseFunds}
                className="w-full mt-4 bg-green-600 text-white p-4 rounded-xl font-medium hover:bg-green-700 transition flex justify-center items-center gap-2"
              >
                Release Funds <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </>
      ) : (
        <div className="space-y-6">
          {/* Post-Disbursal Timeline */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="bg-green-50 border-b border-green-100 p-6 text-center">
              <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-3">
                <Check className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-green-900">Funds Disbursed Successfully</h3>
              <p className="text-green-800 mt-1"><span className="font-financial">₹{decision?.finalAmount.toLocaleString()}</span> transferred to {beneficiaryName}</p>
            </div>
            
            <div className="p-6">
              <h4 className="font-semibold text-gray-900 mb-4">Post-Disbursal Timeline</h4>
              <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-gray-200 before:to-transparent">
                
                <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-white bg-green-500 text-white shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-sm z-10">
                    <Check className="w-4 h-4" />
                  </div>
                  <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-xl border border-green-200 bg-green-50">
                    <h5 className="font-semibold text-gray-900 text-sm">Disbursed</h5>
                    <p className="text-xs text-gray-600 mt-1">Funds successfully transferred to beneficiary.</p>
                  </div>
                </div>

                <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-white bg-blue-100 text-blue-600 shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-sm z-10">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-xl border border-gray-200 bg-white shadow-sm">
                    <h5 className="font-semibold text-gray-900 text-sm">Hypothecation at RTO (Form 34)</h5>
                    <p className="text-xs text-gray-600 mt-1">Initiated with the regional transport office.</p>
                  </div>
                </div>

                <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-white bg-gray-100 text-gray-400 shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-sm z-10">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-xl border border-gray-100 bg-gray-50">
                    <h5 className="font-medium text-gray-500 text-sm">RC with HP Endorsement</h5>
                    <p className="text-xs text-gray-400 mt-1">Pending receipt of updated RC.</p>
                  </div>
                </div>

              </div>
            </div>
          </div>

          {/* Cooling Off Card */}
          <div className="bg-amber-50 rounded-2xl shadow-sm border border-amber-200 p-6 flex flex-col sm:flex-row items-center gap-4">
            <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center shrink-0">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-amber-900">Cooling-off Period Active</h4>
              <p className="text-sm text-amber-800 mt-1">You have 3 days to exit this loan without any pre-payment penalty. You will only need to pay the principal and proportionate interest.</p>
            </div>
            <button onClick={handleCoolingOffExit} className="shrink-0 bg-white border border-amber-300 text-amber-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-amber-100 transition">
              Exit Without Penalty
            </button>
          </div>

          <button onClick={() => navigate('/')} className="w-full bg-white text-gray-700 p-4 rounded-xl font-medium border border-gray-200 hover:bg-gray-50 transition flex justify-center items-center gap-2">
            Return to Dashboard
          </button>
        </div>
      )}
    </div>
  );
}
