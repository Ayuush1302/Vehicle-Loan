import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store/useAppStore';
import { FileText, Plus, ChevronRight, AlertCircle } from 'lucide-react';

export default function Home() {
  const navigate = useNavigate();
  const { user, applications, createApplication, setCurrentAppId } = useAppStore();

  useEffect(() => {
    if (!user) {
      navigate('/apply/access');
    }
  }, [user, navigate]);

  if (!user) return null;

  const handleNewLoan = () => {
    createApplication();
    navigate(`/apply/asset`);
  };

  const handleResume = (id: string) => {
    setCurrentAppId(id);
    // In a real flow, we would determine the last completed step and navigate there.
    // For now, let's just go to the asset step as the entry point.
    navigate(`/apply/asset`);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto w-full">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[var(--bg-surface)] p-6 rounded-2xl shadow-sm border border-[var(--border-subtle)]">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Welcome back, {(user.nameOnPan || 'User').split(' ')[0]}</h1>
          <p className="text-[var(--text-secondary)] mt-1">Manage your vehicle loan applications</p>
        </div>
        <button
          onClick={handleNewLoan}
          className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-[var(--accent-primary)] hover:opacity-90 text-white font-medium rounded-xl transition-colors shadow-sm"
        >
          <Plus className="w-5 h-5" />
          New Loan
        </button>
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-[var(--text-primary)]">Your Applications</h2>
        
        {applications.length === 0 ? (
          <div className="bg-[var(--bg-surface)] p-8 rounded-2xl border border-[var(--border-subtle)] border-dashed flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 bg-[var(--bg-elevated)] rounded-full flex items-center justify-center mb-4">
              <FileText className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-[var(--text-primary)] mb-1">No applications yet</h3>
            <p className="text-[var(--text-secondary)] max-w-sm mb-6">
              You haven't started any vehicle loan applications. Click the button above to get started.
            </p>
            <button
              onClick={handleNewLoan}
              className="text-[var(--accent-primary)] font-medium hover:underline inline-flex items-center gap-1"
            >
              Start new application <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="grid gap-4">
            {applications.map((app) => (
              <div 
                key={app.id} 
                onClick={() => handleResume(app.id)}
                className="bg-[var(--bg-surface)] p-5 rounded-2xl border border-[var(--border-subtle)] shadow-sm hover:border-[var(--accent-primary)] hover:shadow-md transition-all cursor-pointer flex flex-col md:flex-row md:items-center gap-4"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-sm font-medium text-[var(--text-secondary)]">{app.id}</span>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-[var(--bg-elevated)] text-[var(--text-primary)] border border-[var(--border-subtle)]">
                      {app.status}
                    </span>
                  </div>
                  <h3 className="text-lg font-semibold text-[var(--text-primary)]">
                    {app.asset?.condition || 'Vehicle'} {app.asset?.type || 'Loan'}
                  </h3>
                  <p className="text-sm text-[var(--text-secondary)] mt-1">
                    Last updated: {new Date(app.lastUpdated).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center text-[var(--accent-primary)] font-medium">
                  Resume <ChevronRight className="w-5 h-5 ml-1" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Grievance Card */}
      <div className="bg-amber-50 rounded-2xl p-5 border border-amber-100 flex gap-4 items-start">
        <AlertCircle className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />
        <div>
          <h3 className="font-semibold text-amber-900 mb-1">Grievance Redressal</h3>
          <p className="text-amber-800 text-sm mb-3">
            If you have any complaints or issues, you can reach out to our grievance officer or use the RBI Complaint Management System.
          </p>
          <div className="flex flex-wrap gap-4 text-sm font-medium text-amber-900">
            <span>Email: grievances@cruxauto.demo</span>
            <span>Phone: 1800-000-0000</span>
          </div>
        </div>
      </div>
    </div>
  );
}
