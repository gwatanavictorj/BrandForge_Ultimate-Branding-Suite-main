import React, { useState, useEffect, useRef } from 'react';
import { BrandDiscovery, BrandSystem, BrandStrategy, AppNotification } from '../types';
import { Card, Button, Input } from './UI';
import { Palette, Type, CheckCircle2, Sparkles, LayoutGrid, Image as ImageIcon, Box, Ruler } from 'lucide-react';

interface Props {
  discovery: BrandDiscovery;
  strategy: BrandStrategy;
  initialData?: BrandSystem;
  onUpdate?: (data: BrandSystem) => void;
  onComplete: (data: BrandSystem) => Promise<void>;
  addNotification: (n: Omit<AppNotification, 'id' | 'timestamp' | 'read'>) => Promise<void>;
}

const PRESET_PALETTES = [
  ['#0ea5e9', '#0c4a6e', '#f0f9ff', '#64748b'],
  ['#f43f5e', '#881337', '#fff1f2', '#4b5563'],
  ['#10b981', '#064e3b', '#ecfdf5', '#374151'],
  ['#f59e0b', '#78350f', '#fffbeb', '#45474a'],
  ['#8b5cf6', '#4c1d95', '#f5f3ff', '#334155'],
];

const FONTS = [
  'Inter', 'Space Grotesk', 'Playfair Display', 'Outfit', 'Montserrat', 'Roboto', 'Lora'
];

export const BrandSystemDesigner = ({ discovery, strategy, initialData, onUpdate, onComplete, addNotification }: Props) => {
  const [data, setData] = useState<BrandSystem>(initialData || {
    colors: strategy.identitySystem.colors.map(c => c.color).slice(0, 4) || PRESET_PALETTES[0],
    typography: {
      primary: strategy.identitySystem.typography.primary.name || 'Space Grotesk',
      secondary: strategy.identitySystem.typography.secondary.name || 'Inter'
    },
    logoUsage: { clearSpace: '150%', minimumSize: '32px' },
    gridSpacing: { columns: '12-Column', baseUnit: '8px' },
    imagery: { style: 'Authentic & Warm' },
    uiElements: { borderRadius: '8px', shadows: 'Soft & Elevated' }
  });

  const renderRef = useRef(true);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-save whenever data changes (Debounced to save quota)
  useEffect(() => {
    if (renderRef.current) {
      renderRef.current = false;
      return;
    }
    
    if (onUpdate && data) {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = setTimeout(() => {
        onUpdate(data);
      }, 3000); // 3 second debounce
    }

    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, [data, onUpdate]);

  return (
    <div className="max-w-none mx-auto space-y-[var(--space-section)]">
      <div className="text-center space-y-[var(--space-item)]">
        <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">Brand System</h2>
        <p className="text-sm sm:text-base text-slate-500">Define your visual language.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-[var(--space-gap)]">
        <Card title="Color Palette" icon={Palette}>
          <div className="space-y-[var(--space-gap)]">
            <div className="flex gap-[var(--space-item)]">
              {data.colors.map((color, i) => (
                <div key={i} className="flex-1 space-y-2">
                  <div 
                    className="h-16 rounded-xl shadow-inner border border-slate-200" 
                    style={{ backgroundColor: color }}
                  />
                  <Input 
                    value={color} 
                    onChange={e => {
                      const newColors = [...data.colors];
                      newColors[i] = e.target.value;
                      setData({ ...data, colors: newColors });
                    }}
                    className="text-[10px] px-1 py-1 h-8 text-center"
                  />
                </div>
              ))}
            </div>
            
            <div className="space-y-2">
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Presets</p>
              <div className="flex gap-3">
                {PRESET_PALETTES.map((palette, i) => (
                  <button 
                    key={i} 
                    onClick={() => setData({ ...data, colors: palette })}
                    className="flex -space-x-2 hover:scale-110 transition-transform"
                  >
                    {palette.map((c, j) => (
                      <div key={j} className="w-6 h-6 rounded-full border border-white shadow-sm" style={{ backgroundColor: c }} />
                    ))}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </Card>

        <Card title="Typography" icon={Type}>
          <div className="space-y-[var(--space-gap)]">
            <div>
              <label className="text-sm font-medium text-slate-700 mb-2 block">Primary Font (Headings)</label>
              <select 
                className="w-full px-4 py-2 rounded-xl border border-slate-200 bg-slate-50/50 focus:ring-2 focus:ring-brand-500/20"
                value={data.typography.primary}
                onChange={e => setData({ ...data, typography: { ...data.typography, primary: e.target.value } })}
              >
                {FONTS.map(f => <option key={f} value={f}>{f}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 mb-2 block">Secondary Font (Body)</label>
              <select 
                className="w-full px-4 py-2 rounded-xl border border-slate-200 bg-slate-50/50 focus:ring-2 focus:ring-brand-500/20"
                value={data.typography.secondary}
                onChange={e => setData({ ...data, typography: { ...data.typography, secondary: e.target.value } })}
              >
                {FONTS.map(f => <option key={f} value={f}>{f}</option>)}
              </select>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-2">
              <h4 className="text-xl font-bold" style={{ fontFamily: data.typography.primary }}>The quick brown fox</h4>
              <p className="text-sm text-slate-600" style={{ fontFamily: data.typography.secondary }}>
                Jumps over the lazy dog. This is how your brand typography will look in practice.
              </p>
            </div>
          </div>
        </Card>

        <Card title="Logo Usage & Rules" icon={Ruler}>
          <div className="space-y-[var(--space-gap)]">
            <div>
              <label className="text-sm font-medium text-slate-700 mb-2 block">Clear Space Ratio</label>
              <select 
                className="w-full px-4 py-2 rounded-xl border border-slate-200 bg-slate-50/50 focus:ring-2 focus:ring-brand-500/20"
                value={data.logoUsage?.clearSpace || '150%'}
                onChange={e => setData({ ...data, logoUsage: { ...data.logoUsage, clearSpace: e.target.value, minimumSize: data.logoUsage?.minimumSize || '32px' } })}
              >
                {['100%', '150%', '200%', '0.5x Width'].map(f => <option key={f} value={f}>{f}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 mb-2 block">Minimum Digital Size</label>
              <select 
                className="w-full px-4 py-2 rounded-xl border border-slate-200 bg-slate-50/50 focus:ring-2 focus:ring-brand-500/20"
                value={data.logoUsage?.minimumSize || '32px'}
                onChange={e => setData({ ...data, logoUsage: { ...data.logoUsage, minimumSize: e.target.value, clearSpace: data.logoUsage?.clearSpace || '150%' } })}
              >
                {['24px', '32px', '48px', '64px'].map(f => <option key={f} value={f}>{f}</option>)}
              </select>
            </div>
          </div>
        </Card>

        <Card title="Grid & Layout System" icon={LayoutGrid}>
          <div className="space-y-[var(--space-gap)]">
            <div>
              <label className="text-sm font-medium text-slate-700 mb-2 block">Desktop Grid Columns</label>
              <select 
                className="w-full px-4 py-2 rounded-xl border border-slate-200 bg-slate-50/50 focus:ring-2 focus:ring-brand-500/20"
                value={data.gridSpacing?.columns || '12-Column'}
                onChange={e => setData({ ...data, gridSpacing: { ...data.gridSpacing, columns: e.target.value, baseUnit: data.gridSpacing?.baseUnit || '8px' } })}
              >
                {['8-Column', '12-Column', '16-Column', 'Modular'].map(f => <option key={f} value={f}>{f}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 mb-2 block">Base Unit Scale</label>
              <select 
                className="w-full px-4 py-2 rounded-xl border border-slate-200 bg-slate-50/50 focus:ring-2 focus:ring-brand-500/20"
                value={data.gridSpacing?.baseUnit || '8px'}
                onChange={e => setData({ ...data, gridSpacing: { ...data.gridSpacing, baseUnit: e.target.value, columns: data.gridSpacing?.columns || '12-Column' } })}
              >
                {['4px', '8px', '10px', 'Golden Ratio'].map(f => <option key={f} value={f}>{f}</option>)}
              </select>
            </div>
          </div>
        </Card>

        <Card title="Imagery & Photography" icon={ImageIcon}>
          <div className="space-y-[var(--space-gap)]">
            <div>
              <label className="text-sm font-medium text-slate-700 mb-2 block">Visual Style</label>
              <select 
                className="w-full px-4 py-2 rounded-xl border border-slate-200 bg-slate-50/50 focus:ring-2 focus:ring-brand-500/20"
                value={data.imagery?.style || 'Authentic & Warm'}
                onChange={e => setData({ ...data, imagery: { style: e.target.value } })}
              >
                {['Authentic & Warm', 'High-Contrast Studio', 'Minimal & Geometric', 'Abstract 3D', 'Cinematic & Moody'].map(f => <option key={f} value={f}>{f}</option>)}
              </select>
            </div>
            <div className="p-4 bg-slate-50 rounded-2xl border border-dashed border-slate-200 flex items-center justify-center py-6">
               <ImageIcon className="w-8 h-8 text-slate-300" />
            </div>
          </div>
        </Card>

        <Card title="Digital UI Components" icon={Box}>
          <div className="space-y-[var(--space-gap)]">
            <div>
              <label className="text-sm font-medium text-slate-700 mb-2 block">Border Radiuses</label>
              <select 
                className="w-full px-4 py-2 rounded-xl border border-slate-200 bg-slate-50/50 focus:ring-2 focus:ring-brand-500/20"
                value={data.uiElements?.borderRadius || '8px'}
                onChange={e => setData({ ...data, uiElements: { ...data.uiElements, borderRadius: e.target.value, shadows: data.uiElements?.shadows || 'Soft & Elevated' } })}
              >
                {['0px (Sharp)', '4px (Subtle)', '8px (Soft)', '16px (Rounded)', '999px (Pill)'].map(f => <option key={f} value={f}>{f}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 mb-2 block">Elevation Strategy</label>
              <select 
                className="w-full px-4 py-2 rounded-xl border border-slate-200 bg-slate-50/50 focus:ring-2 focus:ring-brand-500/20"
                value={data.uiElements?.shadows || 'Soft & Elevated'}
                onChange={e => setData({ ...data, uiElements: { ...data.uiElements, shadows: e.target.value, borderRadius: data.uiElements?.borderRadius || '8px' } })}
              >
                {['Flat Design (None)', 'Soft & Elevated', 'Hard Brutalist Shadows', 'Neumorphic'].map(f => <option key={f} value={f}>{f}</option>)}
              </select>
            </div>
          </div>
        </Card>
      </div>

      <div className="flex justify-center pt-8">
        <Button 
          className="px-12 py-4 text-lg" 
          onClick={() => onComplete(data)}
        >
          Generate Usage Guide
        </Button>
      </div>
    </div>
  );
};
