import React from 'react';
import { ArrowRight, Compass, Sparkles, BookOpen, Layers, Bot, Cpu, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { motion } from 'motion/react';

export function Landing() {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  return (
    <div className="flex flex-col min-h-screen bg-slate-950 font-sans overflow-hidden">
      
      {/* Background Orbs */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[120vw] h-[800px] bg-brand-500/10 blur-[150px] rounded-[100%] pointer-events-none" />
      <div className="fixed top-[40vh] -left-[20vw] w-[60vw] h-[600px] bg-indigo-500/10 blur-[150px] rounded-[100%] pointer-events-none" />

      {/* Hero Section */}
      <section className="relative pt-40 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto flex flex-col items-center text-center z-10">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center space-x-2 bg-brand-900/40 border border-brand-500/30 px-3 py-1 rounded-full text-brand-300 text-sm font-semibold mb-8 backdrop-blur-md"
        >
          <Sparkles className="w-4 h-4" />
          <span>BrandForge v1.0 Production Ready</span>
        </motion.div>
        
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-6xl md:text-8xl font-extrabold tracking-tight mb-8 text-white leading-tight"
        >
          The High-Fidelity <br/>
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-400 to-indigo-400">
            Branding Intelligence
          </span> Engine.
        </motion.h1>
        
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-xl md:text-2xl text-slate-400 max-w-3xl mb-12 font-medium"
        >
          Eliminate the gap between abstract brand theory and visual execution. 
          Orchestrate a <span className="text-brand-300">Sequential Intelligence Pipeline (S.I.P)</span> to ensure every design asset is architecturally anchored in strategic data.
        </motion.p>
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-6"
        >
          <button 
            onClick={() => navigate('/app')}
            className="px-8 py-4 bg-brand-600 hover:bg-brand-500 text-white rounded-xl font-bold text-lg shadow-[0_0_40px_-10px_rgba(37,99,235,0.5)] transition-all flex items-center justify-center space-x-2 hover:-translate-y-1"
          >
            <span>{user ? 'Open Commander Console' : 'Start Processing Brands Free'}</span>
            <ArrowRight className="w-5 h-5" />
          </button>
          
          <button 
            onClick={() => navigate('/how-it-works')}
            className="px-8 py-4 bg-slate-800/80 hover:bg-slate-700 text-white border border-slate-600 rounded-xl font-bold text-lg transition-all backdrop-blur-sm"
          >
            See The Pipeline
          </button>
        </motion.div>
      </section>

      {/* Hero Image Mockup */}
      <section className="relative px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto z-10 w-full mb-32">
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="rounded-2xl border border-slate-700/50 bg-slate-900 overflow-hidden shadow-[0_0_100px_-20px_rgba(0,0,0,0.8)]"
        >
          <div className="h-10 bg-slate-950 border-b border-slate-800 flex items-center px-4 space-x-2">
            <div className="w-3 h-3 rounded-full bg-rose-500/50" />
            <div className="w-3 h-3 rounded-full bg-amber-500/50" />
            <div className="w-3 h-3 rounded-full bg-green-500/50" />
          </div>
          <img 
            src="/brandforge-original.png" 
            alt="BrandForge Interface" 
            className="w-full h-auto object-cover opacity-90"
          />
        </motion.div>
      </section>

      {/* Philosophy Section */}
      <section className="py-24 bg-slate-950/50 border-t border-slate-800/50 relative z-10">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col md:flex-row gap-16 items-center">
            <div className="w-full md:w-1/2 space-y-8">
              <h2 className="text-4xl font-bold text-white tracking-tight">Solving <span className="text-brand-400">Strategic Drift.</span></h2>
              <p className="text-xl text-slate-400 leading-relaxed">
                In conventional branding, psychological insights are often siloed from visual execution layers. This decoupling leads to "Strategic Drift"—visual assets lose their tether to original brand DNA.
              </p>
              <p className="text-xl text-slate-400 leading-relaxed">
                BrandForge provides a deterministic <strong className="text-white">data-inheritance model</strong> that ensures the "Soul" of the brand definitively governs the "Skin" of the brand.
              </p>
              <ul className="space-y-4">
                {['Consistent Brand Voice', 'Undiluted Visual Symbolism', 'Frictionless Handoffs'].map((item, i) => (
                  <li key={i} className="flex items-center space-x-3">
                    <CheckCircle2 className="w-6 h-6 text-brand-400" />
                    <span className="text-slate-300 font-medium">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            
            <div className="w-full md:w-1/2">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-4">
                  <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
                    <Bot className="w-8 h-8 text-indigo-400 mb-4" />
                    <h4 className="text-lg font-bold text-white mb-2">Automated Extraction</h4>
                    <p className="text-sm text-slate-400">Google Forms ingestion instantly mapped to psychographic structures.</p>
                  </div>
                  <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
                    <Cpu className="w-8 h-8 text-brand-400 mb-4" />
                    <h4 className="text-lg font-bold text-white mb-2">Data Healer</h4>
                    <p className="text-sm text-slate-400">Middleware that repairs AI fragmentation and builds context parity.</p>
                  </div>
                </div>
                <div className="space-y-4 mt-8">
                  <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
                    <Layers className="w-8 h-8 text-purple-400 mb-4" />
                    <h4 className="text-lg font-bold text-white mb-2">Triple Archetypes</h4>
                    <p className="text-sm text-slate-400">Primary, Secondary, and Tertiary Jungian analysis applied to tone.</p>
                  </div>
                  <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl border-brand-500/30 shadow-[0_0_30px_-10px_rgba(37,99,235,0.2)]">
                    <BookOpen className="w-8 h-8 text-rose-400 mb-4" />
                    <h4 className="text-lg font-bold text-white mb-2">1:1 PDF Generation</h4>
                    <p className="text-sm text-slate-400">Professional manual handoffs exported in milliseconds.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* S.I.P Visualization */}
      <section className="py-32 relative z-10 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold text-white tracking-tight mb-4">The S.I.P Intelligence Pipeline</h2>
          <p className="text-xl text-slate-400 max-w-2xl mx-auto mb-16">A unidirectional flow of state-aware data across 5 distinct modules.</p>
          
          <div className="flex flex-col lg:flex-row items-center justify-between relative">
            <div className="absolute top-1/2 left-0 w-full h-1 bg-slate-800 -translate-y-1/2 hidden lg:block" />
            <div className="absolute top-1/2 left-0 w-1/3 h-1 bg-gradient-to-r from-brand-500 to-indigo-500 -translate-y-1/2 hidden lg:block animate-pulse" />
            
            {[
              { num: '01', title: 'Discovery', sub: 'Extraction' },
              { num: '02', title: 'Strategy', sub: 'Synthesis' },
              { num: '03', title: 'Logo', sub: 'Alchemy' },
              { num: '04', title: 'System', sub: 'The Engine' },
              { num: '05', title: 'Guide', sub: 'Handoff' }
            ].map((step, i) => (
              <div key={i} className="relative bg-slate-950 border-2 border-slate-800 w-full lg:w-48 h-48 rounded-2xl flex flex-col items-center justify-center p-6 shadow-xl z-10 mb-8 lg:mb-0 hover:border-brand-500 transition-colors group cursor-default">
                <div className="absolute -top-4 -right-4 w-10 h-10 bg-slate-800 rounded-full flex items-center justify-center text-xs font-bold text-white group-hover:bg-brand-500 transition-colors">
                  {step.num}
                </div>
                <h3 className="text-xl font-bold text-white">{step.title}</h3>
                <p className="text-sm text-slate-500 uppercase tracking-widest mt-2">{step.sub}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-b from-transparent to-brand-900/20 relative z-10 border-t border-slate-800">
        <div className="max-w-4xl mx-auto text-center px-4">
          <h2 className="text-5xl font-bold text-white mb-8">Ready to Forge?</h2>
          <p className="text-xl text-slate-300 mb-10">Stop juggling unassociated tools. Consolidate your strategy and visual systems into the commander console.</p>
          <button 
            onClick={() => navigate('/app')}
            className="px-10 py-5 bg-white text-slate-900 hover:bg-slate-100 rounded-xl font-bold text-xl shadow-2xl transition-all inline-flex items-center space-x-3"
          >
            <span>Launch BrandForge Workspace</span>
            <ArrowRight className="w-6 h-6" />
          </button>
        </div>
      </section>
      
    </div>
  );
}
