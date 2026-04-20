import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import BrandForgeApp from './BrandForgeApp';
import { MarketingLayout } from './marketing/MarketingLayout';
import { Landing } from './marketing/Landing';
import { HowItWorks, CaseStudy, About, Contact, Legal } from './marketing/Pages';
import { Login } from './marketing/Login';

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-slate-900"><p className="text-slate-400">Loading...</p></div>;
  }
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<MarketingLayout />}>
          <Route path="/" element={<Landing />} />
          <Route path="/how-it-works" element={<HowItWorks />} />
          <Route path="/case-study" element={<CaseStudy />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/privacy" element={<Legal type="privacy" />} />
          <Route path="/terms" element={<Legal type="terms" />} />
        </Route>
        
        <Route path="/login" element={<Login />} />
        
        <Route 
          path="/app" 
          element={
            <RequireAuth>
              <BrandForgeApp />
            </RequireAuth>
          } 
        />
      </Routes>
    </BrowserRouter>
  );
}
