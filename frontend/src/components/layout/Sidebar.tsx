'use client';

import React from 'react';
import NextLink from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Home, 
  Search, 
  Database, 
  PenTool, 
  FileText, 
  BarChart3, 
  Sparkles,
  Zap,
  Settings,
  HelpCircle,
  ChevronRight,
  User,
  Layers
} from 'lucide-react';

const NAV_GROUPS = [
  {
    label: "Insights",
    items: [
      { name: 'Dashboard', path: '/', icon: Home },
      { name: 'User Guide', path: '/guide', icon: HelpCircle },
    ]
  },
  {
    label: "Workflow",
    items: [
      { name: 'Collect (RSS)', path: '/collect', icon: Search },
      { name: 'Extract (AI)', path: '/extract', icon: Sparkles },
    ]
  },
  {
    label: "Management",
    items: [
      { name: 'Knowledge DB', path: '/knowledge', icon: Database },
      { name: 'Persona Templates', path: '/persona', icon: User },
      { name: 'Blog Themes', path: '/themes', icon: Layers },
    ]
  },
  {
    label: "Generation",
    items: [
      { name: 'Blog Topics', path: '/generate', icon: Zap },
      { name: 'Articles', path: '/articles', icon: FileText },
    ]
  }
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-72 z-50 p-6 hidden lg:block">
      <div className="h-full glass rounded-2xl flex flex-col border border-gray-100 dark:border-gray-800 shadow-2xl overflow-hidden relative">
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary-500/5 blur-[60px] rounded-full -mr-16 -mt-16" />
        {/* Branding Area */}
        <div className="p-8 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-2xl flex items-center justify-center shadow-lg shadow-primary-500/20">
              <Sparkles className="text-white" size={20} />
            </div>
            <div>
            <h1 className="text-2xl font-black tracking-tighter text-gray-900 dark:text-white leading-none">AuraEngine</h1>
            <div className="flex items-center gap-1.5 mt-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
              <p className="text-[10px] uppercase tracking-[0.15em] font-black text-gray-500">v3.0 Structured</p>
            </div>
            </div>
          </div>
        </div>

        {/* Navigation Area */}
        <nav className="flex-1 overflow-y-auto px-4 py-4 space-y-8 scrollbar-hide">
          {NAV_GROUPS.map((group) => (
            <div key={group.label} className="space-y-3">
              <h3 className="px-5 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 dark:text-gray-500">
                {group.label}
              </h3>
              <div className="space-y-1">
                {group.items.map((item) => {
                  const isActive = pathname === item.path;
                  const Icon = item.icon;
                  return (
                    <NextLink key={item.path} href={item.path} className="block group">
                      <div className={`
                        relative flex items-center justify-between gap-3 px-5 py-3 rounded-xl transition-all duration-300
                        ${isActive 
                          ? 'bg-primary-600 text-white shadow-lg shadow-primary-500/25 translate-x-1' 
                          : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'
                        }
                      `}>
                        <div className="flex items-center gap-3">
                          <Icon size={18} className={`transition-transform duration-300 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`} />
                          <span className={`text-sm font-bold tracking-tight ${isActive ? 'opacity-100' : 'opacity-80'}`}>{item.name}</span>
                        </div>
                        {isActive && <ChevronRight size={14} className="opacity-70 animate-in fade-in slide-in-from-left-2 duration-300" />}
                      </div>
                    </NextLink>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Footer Area / System Status */}
        <div className="p-6 mt-auto border-t border-white/5 bg-black/5 dark:bg-white/5">
            <div className="flex items-center justify-between mb-4">
               <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">System Ready</span>
               </div>
               <button className="text-gray-400 hover:text-primary-500 transition-colors">
                  <Settings size={16} />
               </button>
            </div>
            
            <div className="glass rounded-xl p-3 bg-white/20 dark:bg-black/20 border-white/10">
                <p className="text-[10px] text-gray-500 dark:text-gray-400 font-bold mb-1 uppercase tracking-tighter">AI Load</p>
                <div className="h-1.5 w-full bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
                    <div className="h-full bg-primary-500 w-[42%] transition-all duration-1000" />
                </div>
            </div>
        </div>
      </div>
    </aside>
  );
}
