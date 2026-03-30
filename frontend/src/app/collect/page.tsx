'use client';

import { useState, useEffect } from 'react';
import useSWR, { mutate } from 'swr';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { api, fetcher } from '@/lib/api';
import { useRef } from 'react';
import { DownloadCloud, CheckCircle, Info, Zap, Search, Layers, Activity, RefreshCw, Clock, History, ExternalLink, ChevronDown, Timer } from 'lucide-react';

const PRESET_TAGS = [
  '悩み',
  '人生経験',
  '人生の転換',
  '想像してなかった未来',
  'あの失敗があったから',
  '人生を変えた出会い',
  'エッセイ',
  '日記',
  'あの時の自分へ',
  'カスタム入力'
];

export default function CollectPage() {
  const [tag, setTag] = useState('悩み');
  const [maxArticles, setMaxArticles] = useState(20);
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState('');
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<'worry' | 'experience'>('worry');
  const [isCustomTag, setIsCustomTag] = useState(false);
  const [remainingTime, setRemainingTime] = useState<number | null>(null);
  const [bulkStatus, setBulkStatus] = useState<{current: string, total: number, index: number} | null>(null);
  const startTimeRef = useRef<number | null>(null);

  // 履歴の取得
  const { data: historyData, isLoading: isLoadingHistory } = useSWR('/api/collect/', fetcher);
  const history = historyData?.data || [];

  const handleCollect = async () => {
    setIsLoading(true);
    setError(null);
    setResult(null);
    setProgress(0);
    setStatusMessage('準備中...');
    setRemainingTime(null);
    startTimeRef.current = null;
    
    const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
    
    try {
      const endpoint = mode === 'worry' ? '/api/collect/note' : '/api/collect/experience';
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          hashtag: tag,
          limit: maxArticles
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('ReadableStream not supported');

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            const data = JSON.parse(line);
            if (data.status === 'progress') {
              setProgress(data.progress);
              setStatusMessage(data.message);
              
              if (data.current_index && data.total_count) {
                const now = Date.now();
                if (!startTimeRef.current) {
                  startTimeRef.current = now;
                } else {
                  const elapsed = (now - startTimeRef.current) / 1000;
                  const avgTime = elapsed / data.current_index;
                  const remaining = Math.max(0, Math.round(avgTime * (data.total_count - data.current_index)));
                  setRemainingTime(remaining);
                }
              }
            } else if (data.status === 'done') {
              setResult(data.data);
              setProgress(100);
              setStatusMessage('完了しました');
              // 履歴を更新
              mutate('/api/collect/');
            } else if (data.status === 'error') {
              setError(data.message);
            }
          } catch (e) {
            console.error('JSON parse error line:', line, e);
          }
        }
      }
    } catch (err: any) {
      setError(err.message || 'データ収集中にエラーが発生しました');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBulkCollect = async () => {
    setIsLoading(true);
    setResult(null);
    setError(null);
    setRemainingTime(null);
    
    const tagsToProcess = PRESET_TAGS.filter(t => t !== 'カスタム入力');
    
    for (let i = 0; i < tagsToProcess.length; i++) {
        const currentTag = tagsToProcess[i];
        setBulkStatus({ current: currentTag, total: tagsToProcess.length, index: i + 1 });
        setTag(currentTag);
        
        // 通常の収集処理を実行
        setProgress(0);
        setStatusMessage(`${currentTag} の抽出準備中...`);
        startTimeRef.current = null;

        const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
        try {
            const response = await fetch(`${API_BASE_URL}/api/collect/experience`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ hashtag: currentTag, limit: maxArticles }),
            });

            if (!response.ok) continue;

            const reader = response.body?.getReader();
            if (!reader) continue;

            const decoder = new TextDecoder();
            let buffer = '';

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split('\n');
                buffer = lines.pop() || '';

                for (const line of lines) {
                    if (!line.trim()) continue;
                    try {
                        const data = JSON.parse(line);
                        if (data.status === 'progress') {
                            setProgress(data.progress);
                            setStatusMessage(`[${currentTag}] ${data.message}`);
                            if (data.current_index && data.total_count) {
                                const now = Date.now();
                                if (!startTimeRef.current) startTimeRef.current = now;
                                else {
                                    const elapsed = (now - startTimeRef.current) / 1000;
                                    const avgTime = elapsed / data.current_index;
                                    const remaining = Math.max(0, Math.round(avgTime * (data.total_count - data.current_index)));
                                    setRemainingTime(remaining);
                                }
                            }
                        }
                    } catch (e) {}
                }
            }
            mutate('/api/collect/');
        } catch (err) {
            console.error(`Error processing tag ${currentTag}:`, err);
        }
    }
    
    setBulkStatus(null);
    setIsLoading(false);
    setProgress(100);
    setStatusMessage('全タグの一括抽出が完了しました');
  };

  return (
    <div className="animate-fade-in space-y-12 pb-32 max-w-[1100px] mx-auto p-4 md:p-0">
      
      {/* --- HEADER --- */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 bg-secondary-100 dark:bg-secondary-900/40 text-secondary-700 dark:text-secondary-300 rounded text-[10px] font-black uppercase tracking-widest border border-secondary-200 dark:border-secondary-800 flex items-center gap-1.5">
            <DownloadCloud size={12} />
            Data Ingestion
          </span>
        </div>
        <h1 className="text-4xl font-black tracking-tight text-gray-900 dark:text-white leading-tight">
          RSS Collect <span className="text-gradient">&amp; Filter</span>
        </h1>
        <p className="text-base text-gray-600 dark:text-gray-400 max-w-2xl font-medium leading-relaxed">
          note の特定ハッシュタグRSSから記事を取得し、AIが自動で「未解決の悩み」や「生々しい人生経験」を抽出してデータベースへ収集します。
        </p>
      </div>

      <div className="flex gap-4 p-1 bg-gray-100 dark:bg-gray-800 rounded-2xl w-fit">
        <button 
          onClick={() => setMode('worry')}
          className={`px-8 py-3 rounded-xl font-black transition-all ${mode === 'worry' ? 'bg-white dark:bg-gray-700 shadow-lg text-primary-600' : 'text-gray-500 hover:text-gray-900'}`}
        >
          悩みの種を収集
        </button>
        <button 
          onClick={() => setMode('experience')}
          className={`px-8 py-3 rounded-xl font-black transition-all ${mode === 'experience' ? 'bg-white dark:bg-gray-700 shadow-lg text-primary-600' : 'text-gray-500 hover:text-gray-900'}`}
        >
          人生経験を抽出
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* --- LEFT: CONFIGURATION --- */}
        <div className="lg:col-span-12">
          <div className="bento-card border-l-4 border-l-primary-500 shadow-xl p-8">
            <div className="bento-header mb-8">
               <Search className="text-primary-500" size={24} />
               <h2 className="text-xl font-black tracking-tight text-gray-900 dark:text-white">収集条件の設定</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-end">
              <div className="md:col-span-7 space-y-3">
                <label className="block text-xs font-black text-gray-500 uppercase tracking-widest flex items-center gap-2">
                   <span className="w-4 h-4 rounded-full bg-primary-100 dark:bg-primary-900/50 flex items-center justify-center text-primary-600 text-[10px]">1</span>
                   note ハッシュタグ名
                </label>
                <div className="relative group">
                  {!isCustomTag ? (
                    <div className="relative">
                      <select 
                        value={tag}
                        onChange={(e) => {
                          if (e.target.value === 'カスタム入力') {
                            setIsCustomTag(true);
                            setTag('');
                          } else {
                            setTag(e.target.value);
                          }
                        }}
                        className="w-full h-14 pl-5 pr-12 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-xl font-bold text-lg appearance-none focus:border-primary-500 focus:outline-none transition-all cursor-pointer"
                        disabled={isLoading}
                      >
                        {PRESET_TAGS.map(t => (
                          <option key={t} value={t}>{t}</option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none group-hover:text-primary-500 transition-colors" size={20} />
                    </div>
                  ) : (
                    <div className="relative">
                      <Input 
                        value={tag} 
                        onChange={(e) => setTag(e.target.value)} 
                        placeholder="ハッシュタグを自由に入力"
                        className="h-14 font-bold text-lg pr-12"
                        disabled={isLoading}
                        autoFocus
                      />
                      <button 
                        onClick={() => {
                          setIsCustomTag(false);
                          setTag('悩み');
                        }}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black uppercase text-primary-500 hover:text-primary-600 tracking-widest"
                      >
                        戻る
                      </button>
                    </div>
                  )}
                </div>
              </div>
              <div className="md:col-span-2 space-y-3">
                <label className="block text-xs font-black text-gray-500 uppercase tracking-widest flex items-center gap-2">
                   <span className="w-4 h-4 rounded-full bg-primary-100 dark:bg-primary-900/50 flex items-center justify-center text-primary-600 text-[10px]">2</span>
                   探索最大数
                </label>
                <Input 
                  type="number"
                  min={1}
                  max={50}
                  value={maxArticles} 
                  onChange={(e) => setMaxArticles(parseInt(e.target.value) || 20)} 
                  className="h-14 font-black text-xl text-center"
                  disabled={isLoading}
                />
                <div className="flex items-center gap-1.5 text-[10px] font-black text-primary-500 uppercase tracking-widest mt-1">
                   <Clock size={12} />
                   Est: ~{maxArticles * 2}s
                </div>
              </div>
              <div className="md:col-span-3 flex flex-col gap-2">
                <Button 
                  onClick={handleCollect} 
                  isLoading={isLoading && !bulkStatus}
                  className={`w-full h-14 text-lg font-black ${mode === 'experience' ? 'bg-orange-600 hover:bg-orange-700' : ''}`}
                >
                  {mode === 'worry' ? '収集を開始' : '一括抽出を開始'}
                </Button>
                {mode === 'experience' && (
                  <Button
                    onClick={handleBulkCollect}
                    isLoading={isLoading && !!bulkStatus}
                    variant="ghost"
                    className="w-full h-10 text-xs font-black uppercase tracking-widest border-2 border-orange-200 dark:border-orange-800 text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/20"
                  >
                    全プリセットタグを一括抽出
                  </Button>
                )}
              </div>
            </div>

            {/* PROGRESS AREA */}
            {isLoading && (
              <div className="mt-10 p-6 bg-primary-50 dark:bg-primary-900/20 rounded-2xl border border-primary-100 dark:border-primary-800 animate-in fade-in slide-in-from-top-4">
                <div className="flex items-center justify-between mb-3">
                   <div className="flex items-center gap-3">
                      <RefreshCw className="text-primary-500 animate-spin" size={18} />
                      <div className="flex flex-col text-left">
                           <span className="text-sm font-black text-gray-900 dark:text-white">{statusMessage}</span>
                           {bulkStatus && (
                             <span className="text-[10px] font-black text-primary-500 uppercase tracking-[0.2em] mt-0.5">
                               Bulk Progress: {bulkStatus.index} / {bulkStatus.total} Tags
                             </span>
                           )}
                       </div>
                   </div>
                   <div className="flex items-center gap-4">
                      {remainingTime !== null && (
                        <div className="flex items-center gap-1.5 px-3 py-1 bg-white dark:bg-gray-800 rounded-full shadow-sm border border-primary-100 dark:border-primary-900/50 animate-in slide-in-from-right-2">
                           <Timer size={14} className="text-primary-500" />
                           <span className="text-[11px] font-black text-primary-600 dark:text-primary-400 uppercase tracking-widest">
                             残り約 {remainingTime} 秒
                           </span>
                        </div>
                      )}
                      <span className="text-sm font-black text-primary-600 dark:text-primary-400">{progress}%</span>
                    </div>
                </div>
                <div className="h-2 w-full bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
                   <div 
                     className="h-full bg-primary-500 transition-all duration-500 ease-out"
                     style={{ width: `${progress}%` }}
                   />
                </div>
              </div>
            )}

            {mode === 'experience' && !isLoading && (
              <div className="mt-6 flex items-start gap-3 p-4 bg-orange-50 dark:bg-orange-900/20 border border-orange-100 dark:border-orange-800 rounded-xl">
                <Info size={18} className="text-orange-600 shrink-0 mt-0.5" />
                <p className="text-sm font-bold text-orange-800 dark:text-orange-300">
                  人生経験モードでは、AIが抽出した全データを承認なしで自動的にナレッジDBへ保存します。
                </p>
              </div>
            )}
          </div>
        </div>

        {/* --- ERROR DISPLAY --- */}
        {error && (
          <div className="lg:col-span-12 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-6 rounded-2xl border border-red-200 dark:border-red-800 flex items-center gap-4 animate-in slide-in-from-top-4">
            <Activity className="shrink-0" size={24} />
            <div className="text-sm font-bold">{error}</div>
          </div>
        )}

        {/* --- HISTORY SECTION --- */}
        <div className="lg:col-span-12 space-y-8 mt-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
               <History className="text-primary-500" size={28} />
               <h3 className="text-2xl font-black text-gray-900 dark:text-white tracking-tighter">
                 Collection History
               </h3>
               <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-800 rounded text-[10px] font-black text-gray-500 border border-gray-200 dark:border-gray-700 uppercase tracking-widest">
                 {history.length} Saved Seeds
               </span>
            </div>
          </div>

          {isLoadingHistory ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map(i => (
                <div key={i} className="bento-card h-40 animate-pulse bg-gray-100 dark:bg-gray-800/50"></div>
              ))}
            </div>
          ) : history.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {history.map((seed: any) => (
                <div key={seed.id} className="bento-card group hover:translate-y-[-4px] transition-all flex flex-col justify-between h-full">
                  <div>
                    <div className="flex items-center justify-between mb-4">
                       <span className="px-2 py-0.5 bg-primary-50 dark:bg-primary-900/30 text-[10px] font-black text-primary-600 dark:text-primary-400 rounded uppercase tracking-widest">
                          #{seed.source_tags}
                       </span>
                       <div className="flex items-center gap-1.5 text-[10px] font-bold text-gray-400">
                          <Clock size={12} />
                          {new Date(seed.created_at).toLocaleDateString()}
                       </div>
                    </div>
                    <p className="font-bold text-gray-900 dark:text-white mb-4 leading-relaxed line-clamp-4">
                      {seed.abstract_worry}
                    </p>
                  </div>
                  
                  <div className="pt-4 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between text-[10px] font-black uppercase tracking-widest">
                     <span className={seed.is_used ? "text-green-500" : "text-amber-500"}>
                       {seed.is_used ? "Topic Generated" : "Ready to Use"}
                     </span>
                     <Zap size={14} className={`${seed.is_used ? "text-green-500" : "text-amber-500"}`} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bento-card py-32 text-center opacity-30 border-dashed border-2 flex flex-col items-center gap-4">
               <Layers size={48} />
               <p className="text-sm font-black uppercase tracking-widest font-mono">Vault is empty. Start collecting to fill history.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
