import React from 'react';
import { Link, Outlet, useNavigate } from 'react-router-dom';
import { Compass, Menu, X, ArrowRight } from 'lucide-react';
import { useAuth } from '../AuthContext';

export function MarketingLayout() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-slate-900 text-slate-100 font-sans">
      <header className="sticky top-0 z-50 bg-slate-900/80 backdrop-blur-md border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/" className="flex items-center space-x-2">
              <Compass className="w-8 h-8 text-blue-500" />
              <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-400">
                BrandForge
              </span>
            </Link>
            
            <nav className="hidden md:flex space-x-8">
              <Link to="/how-it-works" className="text-slate-300 hover:text-white transition-colors">How it Works</Link>
              <Link to="/case-study" className="text-slate-300 hover:text-white transition-colors">Case Study</Link>
              <Link to="/about" className="text-slate-300 hover:text-white transition-colors">About</Link>
              <Link to="/contact" className="text-slate-300 hover:text-white transition-colors">Contact</Link>
            </nav>

            <div className="hidden md:flex items-center space-x-4">
              {user ? (
                <button 
                  onClick={() => navigate('/app')}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center space-x-2"
                >
                  <span>Go to App</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <button 
                  onClick={() => navigate('/app')}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                >
                  Start for Free
                </button>
              )}
            </div>

            <div className="md:hidden flex items-center">
              <button 
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="text-slate-400 hover:text-white p-2"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-slate-800 border-b border-white/10">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
              <Link to="/how-it-works" onClick={() => setMobileMenuOpen(false)} className="block px-3 py-2 text-base font-medium text-slate-300 hover:text-white hover:bg-slate-700 rounded-md">How it Works</Link>
              <Link to="/case-study" onClick={() => setMobileMenuOpen(false)} className="block px-3 py-2 text-base font-medium text-slate-300 hover:text-white hover:bg-slate-700 rounded-md">Case Study</Link>
              <Link to="/about" onClick={() => setMobileMenuOpen(false)} className="block px-3 py-2 text-base font-medium text-slate-300 hover:text-white hover:bg-slate-700 rounded-md">About</Link>
              <Link to="/contact" onClick={() => setMobileMenuOpen(false)} className="block px-3 py-2 text-base font-medium text-slate-300 hover:text-white hover:bg-slate-700 rounded-md">Contact</Link>
              <button 
                onClick={() => { setMobileMenuOpen(false); navigate('/app'); }}
                className="w-full text-left px-3 py-2 text-base font-medium text-blue-400 hover:text-blue-300 hover:bg-slate-700 rounded-md"
              >
                {user ? 'Go to Dashboard' : 'Start for Free'}
              </button>
            </div>
          </div>
        )}
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="bg-slate-950 border-t border-white/10 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center">
          <div className="flex items-center space-x-2 mb-4 md:mb-0">
            <Compass className="w-6 h-6 text-slate-500" />
            <span className="text-slate-400 font-semibold">BrandForge</span>
          </div>
          <div className="flex space-x-6 text-sm text-slate-500">
            <Link to="/privacy" className="hover:text-slate-300 transition-colors">Privacy Policy</Link>
            <Link to="/terms" className="hover:text-slate-300 transition-colors">Terms of Service</Link>
          </div>
          <p className="mt-4 md:mt-0 text-sm text-slate-600">
            &copy; {new Date().getFullYear()} BrandForge. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
