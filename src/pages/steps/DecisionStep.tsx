import { useState, useEffect } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAppStore } from '../../store/useAppStore';
import { runDecisionEngine, type DecisionResult } from '../../config/decisionEngine';
import { calculateEMI } from '../../config/loanLogic';
import { Loader2, CheckCircle, XCircle, AlertTriangle, ArrowRight, Download, Home } from 'lucide-react';

export default function DecisionStep() {
  const navigate = useNavigate();
  const { currentAppId, applications, updateApplication } = useAppStore();
  
  const currentApp = applications.find(a => a.id === currentAppId);
  
  const [loading, setLoading] = useState(!currentApp?.decision);
  const [decision, setDecision] = useState<DecisionResult | null>(currentApp?.decision || null);

  useEffect(() => {
    if (!currentApp || currentApp.decision) return;

    // Run the engine
    let isMounted = true;
    runDecisionEngine(currentApp).then(result => {
      if (isMounted) {
        updateApplication(currentApp.id, { 
          decision: result,
          status: result.outcome === 'Referred' ? 'Referred' : 
                  result.outcome === 'Declined' ? 'Declined' : 'In Review' 
        });
        setDecision(result);
        setLoading(false);
      }
    });

    return () => { isMounted = false; };
  }, [currentApp, updateApplication]);

  if (!currentApp || !currentApp.applicant) {
    return <Navigate to="/apply/applicant" replace />;
  }

  if (loading) {
    return (
      <div className="max-w-md mx-auto py-20 text-center space-y-6">
        <div className="relative w-24 h-24 mx-auto">
          <div className="absolute inset-0 border-4 border-gray-100 rounded-full"></div>
          <Loader2 className="w-24 h-24 text-brand-600 animate-spin absolute inset-0" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Assessing Application</h2>
          <p className="text-gray-500 mt-2">Checking bureau and running policy rules...</p>
        </div>
      </div>
    );
  }

  if (!decision) return null;

  const handleAcceptCounter = () => {
    // Update loan setup with new amounts
    updateApplication(currentApp.id, {
      loanSetup: {
        ...currentApp.loanSetup!,
        loanAmount: decision.finalAmount,
        tenureMonths: decision.finalTenure,
        indicativeRate: decision.finalRate,
        emi: calculateEMI(decision.finalAmount, decision.finalRate, decision.finalTenure),
        downPayment: (currentApp.vehicle?.onRoadPrice || currentApp.vehicle?.agreedPrice || 0) - decision.finalAmount
      }
    });
    navigate('/apply/offer');
  };

  const handleWithdraw = () => {
    updateApplication(currentApp.id, { status: 'Withdrawn' });
    navigate('/');
  };

  return (
    <div className="max-w-xl mx-auto space-y-8 animate-in fade-in zoom-in-95 duration-500">
      
      {/* 1. APPROVED */}
      {decision.outcome === 'Approved' && (
        <div className="text-center space-y-6">
          <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto shadow-sm border border-green-200">
            <CheckCircle className="w-10 h-10" />
          </div>
          <div>
            <h2 className="text-3xl font-bold text-gray-900">Congratulations!</h2>
            <p className="text-gray-500 mt-2">Your loan application has been approved.</p>
          </div>
          
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm text-left grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Approved Amount</p>
              <p className="text-xl font-bold font-financial text-gray-900">₹{decision.finalAmount.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Tenure</p>
              <p className="text-xl font-bold text-gray-900">{decision.finalTenure} Months</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Interest Rate</p>
              <p className="text-xl font-bold text-gray-900">{decision.finalRate}% p.a.</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Bureau Score</p>
              <p className="text-xl font-bold text-gray-900">{decision.bureauSummary.score}</p>
            </div>
          </div>

          <button 
            onClick={() => navigate('/apply/offer')}
            className="w-full bg-brand-600 text-white p-4 rounded-xl font-medium hover:bg-brand-700 transition flex justify-center items-center gap-2"
          >
            Review Offer & Sign <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* 2. COUNTER-OFFER */}
      {decision.outcome === 'Counter-offer' && (
        <div className="space-y-6">
          <div className="text-center">
            <div className="w-20 h-20 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto shadow-sm border border-amber-200 mb-4">
              <AlertTriangle className="w-10 h-10" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Action Required</h2>
            <p className="text-gray-500 mt-2">We cannot approve the requested amount, but we have a revised offer for you.</p>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-4">
            <h3 className="font-semibold text-gray-900 text-sm">Reason for revision:</h3>
            <ul className="list-disc pl-5 text-sm text-gray-700 space-y-1 mb-4">
              {decision.reasons.map((r, i) => <li key={i}>{r}</li>)}
            </ul>
            
            <div className="bg-amber-50 p-4 rounded-xl border border-amber-100 grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-amber-800">Requested Amount</p>
                <p className="text-sm font-medium font-financial text-gray-500 line-through">₹{currentApp.loanSetup?.loanAmount.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-xs text-amber-800">Revised Offer</p>
                <p className="text-lg font-bold font-financial text-amber-900">₹{decision.finalAmount.toLocaleString()}</p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <button onClick={handleAcceptCounter} className="w-full bg-brand-600 text-white p-4 rounded-xl font-medium hover:bg-brand-700 transition flex justify-center items-center gap-2">
              Accept Revised Offer <ArrowRight className="w-5 h-5" />
            </button>
            <button onClick={() => navigate('/apply/loan-setup')} className="w-full bg-white text-gray-700 p-4 rounded-xl font-medium border border-gray-200 hover:bg-gray-50 transition">
              Modify Application
            </button>
            <button onClick={handleWithdraw} className="w-full text-gray-500 p-4 rounded-xl font-medium hover:text-gray-700 transition">
              Withdraw Application
            </button>
          </div>
        </div>
      )}

      {/* 3. REFERRED */}
      {decision.outcome === 'Referred' && (
        <div className="text-center space-y-6">
          <div className="w-20 h-20 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto shadow-sm border border-blue-200">
            <Loader2 className="w-10 h-10 animate-spin-slow" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Application Under Review</h2>
            <p className="text-gray-500 mt-2">Your application requires manual verification by our credit team.</p>
          </div>
          
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm text-left">
            <p className="text-sm text-gray-700 leading-relaxed mb-4">
              {decision.reasons[0] || 'Additional checks are required based on your profile.'}
            </p>
            <p className="text-sm font-medium text-gray-900">Expected Turnaround: 24-48 hours.</p>
          </div>

          <button onClick={() => navigate('/')} className="w-full bg-white text-brand-600 p-4 rounded-xl font-medium border border-gray-200 hover:bg-gray-50 transition flex justify-center items-center gap-2">
            <Home className="w-5 h-5" /> Return to Dashboard
          </button>
        </div>
      )}

      {/* 4. DECLINED */}
      {decision.outcome === 'Declined' && (
        <div className="text-center space-y-6">
          <div className="w-20 h-20 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto shadow-sm border border-red-200">
            <XCircle className="w-10 h-10" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Application Declined</h2>
            <p className="text-gray-500 mt-2">We are unable to approve your application at this time.</p>
          </div>
          
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm text-left">
            <h3 className="font-semibold text-gray-900 text-sm mb-3">Principal Reasons:</h3>
            <ul className="list-disc pl-5 text-sm text-gray-700 space-y-2 mb-6">
              {decision.reasons.map((r, i) => <li key={i}>{r}</li>)}
            </ul>

            <button className="text-brand-600 text-sm font-medium hover:underline flex items-center gap-1">
              <Download className="w-4 h-4" /> Download Decision Summary
            </button>
          </div>

          <button onClick={() => navigate('/')} className="w-full bg-white text-gray-700 p-4 rounded-xl font-medium border border-gray-200 hover:bg-gray-50 transition flex justify-center items-center gap-2">
            <Home className="w-5 h-5" /> Return to Dashboard
          </button>
        </div>
      )}

    </div>
  );
}
