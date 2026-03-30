'use client';

import useSWR from 'swr';
import Link from 'next/link';
import { fetcher } from '@/lib/api';
import { Card } from '@/components/ui/Card';
import { Table, Th, Td } from '@/components/ui/Table';
import { 
  Activity, 
  Star, 
  BookOpen, 
  TrendingUp, 
  Zap, 
  Cpu, 
  Layers,
  ArrowUpRight,
  Info
} from 'lucide-react';

export default function Dashboard() {
  const { data, error, isLoading } = useSWR('/api/analysis/', fetcher);

  if (error) return (
    <div className="flex flex-col items-center justify-center py-20 text-center animate-fade-in">
      <div className="p-12 glass rounded-2xl border-red-500/20 max-w-md shadow-2xl">
        <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
          <Activity className="text-red-500" size={40} />
        </div>
        <h2 className="text-3xl font-black text-gray-900 dark:text-white mb-3 tracking-tighter">Connection Lost</h2>
        <p className="text-gray-500 dark:text-gray-400 font-medium leading-relaxed">
           データの取得に失敗しました。サーバーの稼働状況を確認してください。
        </p>
      </div>
    </div>
  );

  const stats = data?.data || {};
  const topKnowledge = stats.top_contributing_knowledge || [];
  const totalArticles = stats.total_analyzed_articles || 0;
  const topScore = topKnowledge?.[0]?.total_score || 0;

  return (
    <div className="animate-fade-in space-y-10 pb-20 max-w-[1400px] mx-auto p-4 md:p-0">
      
      {/* --- HEADER --- */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300 rounded text-[10px] font-black uppercase tracking-widest border border-primary-200 dark:border-primary-800">
              System Dashboard
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
          </div>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight text-gray-900 dark:text-white leading-tight">
            Mystical <span className="text-gradient">Intelligence</span> Center
          </h1>
          <p className="text-base text-gray-600 dark:text-gray-400 max-w-2xl font-medium">
            AIが生成した占いの「知」の評価と進化を統合監視します。データの蓄積状況と評価スコアに基づき、最適なコンテンツ生成を支援します。
          </p>
        </div>
        
        <div className="flex flex-wrap gap-4">
           <div className="glass p-5 rounded-2xl flex flex-col items-center justify-center text-center min-w-[160px] border-l-4 border-l-primary-500 shadow-sm">
              <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Total Articles</p>
              <p className="text-4xl font-black text-gray-900 dark:text-white">{totalArticles}</p>
           </div>
           <div className="glass p-5 rounded-2xl flex flex-col items-center justify-center text-center min-w-[160px] border-l-4 border-l-secondary-500 shadow-sm">
              <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Active Knowledge</p>
              <p className="text-4xl font-black text-gray-900 dark:text-white">{topKnowledge.length}</p>
           </div>
        </div>
      </div>

      {/* --- BENTO GRID LAYOUT --- */}
      <div className="grid grid-cols-12 gap-8">
        
        {/* Main Ranking Table (Structured Bento Piece) */}
        <div className="col-span-12 lg:col-span-8">
          <div className="bento-card h-full flex flex-col">
            <div className="bento-header justify-between">
                <div className="flex items-center gap-3">
                   <TrendingUp className="text-primary-500" size={24} />
                   <h2 className="text-xl font-black tracking-tight text-gray-900 dark:text-white">Ranking Spectrum</h2>
                </div>
                <div className="px-3 py-1 bg-gray-100 dark:bg-gray-800 rounded-lg text-[10px] font-bold text-gray-600 dark:text-gray-400 flex items-center gap-2 border border-gray-200 dark:border-gray-700">
                   <Activity size={12} />
                   Real-time Evaluation
                </div>
            </div>

            <div className="flex-1 overflow-x-auto">
              <Table className="border-none shadow-none">
                <thead>
                  <tr>
                    <Th className="pl-6">Rank</Th>
                    <Th>Knowledge Fragment</Th>
                    <Th className="text-center">Score Momentum</Th>
                    <Th className="pr-6 text-right">Efficiency</Th>
                  </tr>
                </thead>
                <tbody>
                  {topKnowledge.map((item: any, idx: number) => (
                    <tr key={item.knowledge_id} className="group hover:bg-primary-500/[0.03] transition-colors">
                      <Td className="pl-6 py-5">
                         <span className={`text-lg font-black ${idx === 0 ? 'text-secondary-600 dark:text-secondary-400' : 'text-gray-400 dark:text-gray-600'}`}>
                           #{idx + 1}
                         </span>
                      </Td>
                      <Td>
                        <div className="flex flex-col">
                          <span className="font-mono text-xs font-bold text-primary-600 dark:text-primary-400">
                            KID-{item.knowledge_id.slice(0, 8)}
                          </span>
                          <span className="text-[10px] text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-1 uppercase tracking-widest font-bold">
                            <Layers size={10} /> Registered Content
                          </span>
                        </div>
                      </Td>
                      <Td>
                        <div className="flex flex-col items-center gap-2">
                           <div className="flex items-center gap-2 w-full max-w-[120px]">
                              <div className="grow h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                                 <div 
                                   className="h-full bg-primary-500 rounded-full" 
                                   style={{ width: `${Math.min(100, (item.total_score / (topScore || 1)) * 100)}%` }}
                                 />
                              </div>
                              <span className="text-xs font-bold text-gray-900 dark:text-white">{item.total_score}</span>
                           </div>
                        </div>
                      </Td>
                      <Td className="pr-6 text-right font-mono text-sm font-bold text-gray-900 dark:text-white">
                        {(item.total_score / (item.usage_count || 1)).toFixed(2)}
                        <span className="text-[9px] ml-1 text-gray-400 font-normal">pts</span>
                      </Td>
                    </tr>
                  ))}
                  {(!topKnowledge.length && !isLoading) && (
                    <tr>
                      <Td colSpan={4} className="py-24 text-center">
                        <div className="flex flex-col items-center opacity-30">
                           <Zap size={48} className="mb-4 text-gray-400" />
                           <p className="text-sm font-bold uppercase tracking-widest text-gray-500">No Evolution Detected</p>
                        </div>
                      </Td>
                    </tr>
                  )}
                </tbody>
              </Table>
            </div>
            
            <div className="p-6 bg-gray-50 dark:bg-gray-900/40 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Info size={14} className="text-primary-500" />
                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                    Data synced via production API
                  </p>
                </div>
            </div>
          </div>
        </div>

        {/* Action & Insights (Small Bento Pieces) */}
        <div className="col-span-12 lg:col-span-4 space-y-8">
            {/* System Pulse Card - Usability First */}
            <div className="bento-card border-none bg-primary-600 text-white shadow-xl shadow-primary-600/20">
               <div className="absolute top-0 right-0 p-4 opacity-20">
                  <Cpu size={40} />
               </div>
               <div className="relative z-10">
                  <h3 className="text-xl font-black mb-3 leading-tight tracking-tight">AI 知能の継続学習</h3>
                  <p className="text-sm text-white/90 leading-relaxed font-medium mb-6">
                    最近のSNSトレンドとナレッジベースに乖離があります。最新の「悩み」を収集して、占いエンジンの精度を向上させてください。
                  </p>
                  <Link href="/collect" className="block w-full">
                    <button className="w-full py-3.5 bg-white text-primary-600 rounded-xl font-black text-sm hover:bg-gray-50 active:scale-95 transition-all shadow-md uppercase tracking-wider">
                       データの収集を開始
                    </button>
                  </Link>
               </div>
            </div>

            {/* Micro Stats Card */}
            <div className="bento-card flex flex-col justify-between h-[180px]">
               <div className="flex justify-between items-start">
                  <div className="w-10 h-10 bg-secondary-100 dark:bg-secondary-900/30 rounded-xl text-secondary-600 dark:text-secondary-400 flex items-center justify-center">
                    <Star size={20} fill="currentColor" />
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Global Status</p>
                    <p className="text-2xl font-black text-gray-900 dark:text-white uppercase">Optimal</p>
                  </div>
               </div>
               <div>
                  <h4 className="text-xs font-black text-gray-900 dark:text-white mb-2 uppercase tracking-wide flex items-center gap-2">
                    Evaluation Peak
                    <span className="text-[10px] font-normal text-green-500 capitalize">Stable</span>
                  </h4>
                  <div className="h-1.5 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                     <div className="h-full bg-secondary-500 w-[78%]" />
                  </div>
               </div>
            </div>

            {/* Help / Docs Section */}
            <Link href="/guide" className="block group">
              <div className="bento-card flex items-center gap-5 hover:border-primary-500/50 hover:shadow-lg transition-all cursor-pointer">
                  <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-xl text-gray-500 group-hover:text-primary-500 transition-colors flex items-center justify-center">
                    <BookOpen size={20} />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-tighter">User Guide</h4>
                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-0.5">Learn Workflow</p>
                  </div>
                  <ArrowUpRight size={16} className="text-gray-300 group-hover:text-primary-500 transition-colors" />
              </div>
            </Link>
        </div>
      </div>
    </div>
  );
}
