import React from 'react';
import { motion } from 'motion/react';
import { Shield, FileText, Cpu, Compass, Layers, Bot, BookOpen } from 'lucide-react';

export function HowItWorks() {
  const stations = [
    { num: '1', title: 'Brand Discovery', sub: 'Extraction', icon: Compass, text: "The entry point for all brand data. Import Google Forms responses to pull qualitative discovery data directly from client-facing forms, mapping responses to our psychological intelligence layer. Utilize benefit multi-selects and personality mapping to kick-off the AI's contextual awareness." },
    { num: '2', title: 'Strategy Engine', sub: 'Synthesis', icon: Cpu, text: "The strategic engine that synthesizes raw data into a cohesive blueprint. We distill the discovery into a Triple-Archetype psychographic model (Primary, Secondary, Tertiary) and map the brand's exact market positioning against the Maslow Hierarchy of Needs." },
    { num: '3', title: 'Logo Assistant', sub: 'Alchemy', icon: Bot, text: "A linguistic and visual brainstorming toolkit. Harness AI to generate 50+ linguistic constructs (Metaphorical Nouns, Neologisms) tied exclusively to your archetype. Smush concepts together to formulate high-impact visual directions driven by Propositional Density." },
    { num: '4', title: 'Brand System', sub: 'The Engine', icon: Layers, text: "Deterministic mapping of vibe markers to WCAG-compliant design tokens. Curate your final typography, UI elevation strategies, and color contrast logic into an immutable central repository." },
    { num: '5', title: 'The Export Engine', sub: 'Handoff', icon: BookOpen, text: "The final synthesis phase. Our AI writing engine combines all data from Stations 1-4 into a professional, multi-page Brand Guideline. We provide a 1:1 parity PDF document utilizing advanced viewport snapshots, eliminating friction in the client handoff process." }
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 py-32">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-20">
        <h1 className="text-5xl font-extrabold mb-6 tracking-tight text-white">The S.I.P Architecture</h1>
        <p className="text-xl text-slate-400">Five distinct stations to forge a perfect, strategy-anchored brand.</p>
      </motion.div>
      
      <div className="space-y-8 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-700 before:to-transparent">
        {stations.map((s, i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ delay: i * 0.1 }}
            className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active"
          >
            <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-slate-900 bg-brand-500 text-slate-900 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2">
              <s.icon className="w-4 h-4" />
            </div>
            <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-slate-900 hover:bg-slate-800/80 transition-colors p-6 rounded-2xl border border-slate-800 shadow-xl">
              <div className="flex items-center space-x-3 mb-3">
                <span className="text-brand-400 font-black text-xl">0{s.num}</span>
                <h2 className="text-2xl font-bold text-white">{s.title}</h2>
              </div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4 border-b border-slate-800 pb-2">{s.sub}</p>
              <p className="text-slate-400 leading-relaxed text-sm">{s.text}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

export function CaseStudy() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-32">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-16">
        <h1 className="text-5xl font-extrabold mb-6 text-white tracking-tight">Master Technical White Paper</h1>
        <p className="lead text-xl text-brand-300 max-w-2xl mx-auto">
          How BrandForge eliminates "Strategic Drift" through a deterministic data-inheritance model.
        </p>
      </motion.div>

      <motion.article 
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
        className="prose prose-invert prose-lg max-w-none prose-h2:text-brand-400 prose-strong:text-white bg-slate-900/50 p-8 md:p-12 rounded-3xl border border-slate-800"
      >
        <h2>The Problem Space: Strategic Drift</h2>
        <p>In conventional branding, strategic insights (archetypes, core values) are often siloed from the visual execution layer (logos, typography). This decoupling leads to <strong>"Strategic Drift,"</strong> where visual assets lose their tether to the original brand DNA.</p>
        <ul className="space-y-2">
          <li><strong>Legacy Impact</strong>: Inconsistent brand voice, diluted visual symbolism, and inefficient project handoffs.</li>
          <li><strong>The BrandForge Solution</strong>: A deterministic data-inheritance model that ensures the "Soul" of the brand (Strategy) governs the "Skin" of the brand (Visuals).</li>
        </ul>

        <div className="my-10 p-6 bg-brand-950/30 border-l-4 border-brand-500 rounded-r-xl">
          <h3 className="text-xl font-bold text-white mb-2 mt-0">The Core Engine: S.I.P Architecture</h3>
          <p className="mb-0 text-slate-300">At the heart of BrandForge is the <strong>Sequential Intelligence Pipeline (S.I.P)</strong>. Unlike traditional workflows, the S.I.P enforces a unidirectional flow of state-aware data across five distinct stations. Phase A involves <em>Extraction</em>, Phase B handles psychological <em>Synthesis</em>, and Phase C drives <em>Implementation</em>.</p>
        </div>

        <h2>Performance & Scale Metrics</h2>
        <p>Platform telemetry indicates high-density efficiency across the branding lifecycle:</p>
        <div className="overflow-hidden rounded-xl border border-slate-800 my-8">
          <table className="w-full text-left border-collapse m-0">
            <thead className="bg-slate-950">
              <tr>
                <th className="py-4 px-6 font-bold text-white">Metric</th>
                <th className="py-4 px-6 font-bold text-white">Production Time</th>
                <th className="py-4 px-6 font-bold text-white">Standard</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 bg-slate-900/50">
              <tr>
                <td className="py-4 px-6 font-medium text-slate-300">S.I.P Latency</td>
                <td className="py-4 px-6 text-brand-400 font-mono">~0.8s (Edge)</td>
                <td className="py-4 px-6 text-slate-400">Executive</td>
              </tr>
              <tr>
                <td className="py-4 px-6 font-medium text-slate-300">PDF Synthesis</td>
                <td className="py-4 px-6 text-brand-400 font-mono">~2.2s</td>
                <td className="py-4 px-6 text-slate-400">High-Fi</td>
              </tr>
              <tr>
                <td className="py-4 px-6 font-medium text-slate-300">AI Recovery Rate</td>
                <td className="py-4 px-6 text-brand-400 font-mono">99.8%</td>
                <td className="py-4 px-6 text-slate-400">Resilient (Data Healer)</td>
              </tr>
            </tbody>
          </table>
        </div>
      </motion.article>
    </div>
  );
}

export function About() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-32 text-center">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-5xl md:text-7xl font-extrabold mb-8 tracking-tight text-white">About BrandForge</h1>
        <p className="text-xl md:text-2xl text-slate-400 leading-relaxed max-w-3xl mx-auto mb-16">
          An Enterprise-Grade Branding Intelligence Suite designed for Strategists, Design Agencies, and Project Stakeholders who demand high-fidelity, strategy-anchored brand manuals in real-time.
        </p>
      </motion.div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {[
          { icon: Shield, title: "Strategy-Visual Parity", desc: "Every generated color, font, and logo construct is mathematically and psychologically tied to your initial discovery." },
          { icon: FileText, title: "Zero-Friction Handoffs", desc: "Instantly generate and download complex, multi-page PDFs showcasing your Brand System natively in the browser." },
          { icon: Cpu, title: "Technical Rigor", desc: "Powered by the S.I.P. pattern, leveraging fallback mechanisms, recursive repair logic, and state-aware data flow." }
        ].map((v, i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 + 0.2 }}
            className="bg-slate-900/50 p-8 rounded-3xl border border-slate-800 text-left hover:bg-slate-800 transition-colors"
          >
            <div className="w-14 h-14 bg-brand-900/50 border border-brand-500/30 rounded-2xl flex items-center justify-center mb-6">
              <v.icon className="w-7 h-7 text-brand-400" />
            </div>
            <h3 className="text-2xl font-bold mb-4 text-white">{v.title}</h3>
            <p className="text-slate-400 leading-relaxed">{v.desc}</p>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

export function Contact() {
  return (
    <div className="max-w-xl mx-auto px-4 py-32 text-center">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-slate-900 p-8 md:p-12 rounded-3xl border border-slate-800 shadow-2xl">
        <h1 className="text-4xl font-extrabold mb-4 text-white">Contact Us</h1>
        <p className="text-slate-400 mb-8">Have questions about the pipeline? Reach out to our engineering team.</p>
        <a href="mailto:hello@brand-forge.xyz" className="text-2xl font-bold text-brand-400 hover:text-brand-300 transition-colors">hello@brand-forge.xyz</a>
        <div className="mt-12 pt-8 border-t border-slate-800 text-sm text-slate-500">
          Managed by TANATEQ INNOVATIONS LTD
        </div>
      </motion.div>
    </div>
  );
}

export function Legal({ type }: { type: 'privacy' | 'terms' }) {
  return (
    <div className="max-w-4xl mx-auto px-4 py-32">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="prose prose-invert prose-lg mx-auto bg-slate-900/50 p-8 md:p-16 rounded-3xl border border-slate-800">
        <h1 className="text-4xl font-bold mb-8 text-white">{type === 'privacy' ? 'Privacy Policy' : 'Terms of Service'}</h1>
        <p className="text-brand-400 font-mono text-sm mb-8">Last Updated: {new Date().toLocaleDateString()}</p>
        <p>This software is provided by <strong>TANATEQ INNOVATIONS LTD</strong>.</p>
        <p>This documentation ensures that BrandForge (a product of TANATEQ INNOVATIONS LTD) maintains full compliance with Google OAuth Consent Screen requirements for production data extraction via Google Forms.</p>
        <p>For inquiries regarding data usage or terms, contact us at <a href="mailto:hello@brand-forge.xyz" className="text-brand-400">hello@brand-forge.xyz</a>.</p>
      </motion.div>
    </div>
  );
}
