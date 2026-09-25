import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/Home';
import ApplyLayout from './pages/ApplyLayout';
import { useAppStore } from './store/useAppStore';

function AppContent() {
  const { clearSession } = useAppStore();

  const handleResetDemo = () => {
    if (window.confirm("Are you sure you want to reset the demo? All mock data and drafts will be cleared.")) {
      clearSession();
      window.location.href = '/';
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg-main)] flex flex-col font-sans transition-colors duration-200">
      {/* Navigation Bar Header */}
      <header className="bg-[var(--bg-surface)] border-b border-[var(--border-subtle)] sticky top-0 z-50 transition-colors duration-200">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[var(--accent-primary)] rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl leading-none">A</span>
            </div>
            <span className="font-bold text-xl text-[var(--text-primary)] tracking-tight">AutoFinAI</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 w-full max-w-5xl mx-auto p-4 md:p-6 lg:p-8 flex flex-col">
        <Routes>
          <Route path="/" element={<Navigate to="/home" replace />} />
          <Route path="/home" element={<Home />} />
          <Route path="/apply/*" element={<ApplyLayout />} />
          <Route path="*" element={<div className="text-center mt-12"><h2 className="text-2xl font-bold">404 - Not Found</h2></div>} />
        </Routes>
      </main>

      {/* Footer */}
      <footer className="bg-[var(--bg-surface)] border-t border-[var(--border-subtle)] mt-auto py-6 transition-colors duration-200">
        <div className="max-w-5xl mx-auto px-4 text-center flex flex-col items-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-50 text-amber-700 text-xs font-semibold border border-amber-200 mb-4 dark:bg-amber-900/30 dark:border-amber-800/50 dark:text-amber-400">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
            DEMO: simulated data, no real loan
          </div>
          <p className="text-sm text-[var(--text-secondary)]">
            AutoFinAI Platform | RBI Registration (Placeholder)
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
            Grievance Officer: Jane Doe | grievances@autofin.demo | 1800-000-0000
          </p>
          <button 
            onClick={handleResetDemo}
            className="text-[var(--accent-primary)] text-xs font-medium hover:underline mt-4 cursor-pointer"
          >
            Reset demo
          </button>
        </div>
      </footer>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}

export default App;
