'use client';

import { useState, useEffect, useRef } from 'react';
import useSWR, { mutate } from 'swr';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { 
    Sparkles, CheckCircle, RefreshCw, ArrowLeft, Terminal, 
    Activity, Zap, Layers, Send, Info, History, Save, Trash2, 
    ArrowUpRight, MessageSquare, Wand2, Edit3, X
} from 'lucide-react';
import { fetcher, api, API_BASE_URL } from '@/lib/api';
import { useRouter, useParams, useSearchParams } from 'next/navigation';

type StreamStatus = 'connecting' | 'streaming' | 'completed' | 'error' | 'finalizing';

export default function ArticleStreamPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const topicId = params.topic_id as string;
  const targetChars = searchParams.get('target_chars') || '1500';
  const isPaid = searchParams.get('is_paid') || 'false';

  const [content, setContent] = useState('');
  const [currentVersionId, setCurrentVersionId] = useState<string | null>(null);
  const [status, setStatus] = useState<StreamStatus>('connecting');
  const [errorMsg, setErrorMsg] = useState('');
  const [isRefining, setIsRefining] = useState(false);
  const [customRefinement, setCustomRefinement] = useState('');
  
  // Manual edit state
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState('');
  
  const streamRef = useRef<EventSource | null>(null);

  // 履歴と設定の取得
  const { data: versionsData, isLoading: isLoadingVersions, error: versionsError } = useSWR(topicId ? `/api/generate/${topicId}/versions` : null, fetcher);
  const { data: patternsData } = useSWR('/api/generate/config/refinement-patterns', fetcher);

  // コンポーネント破棄時にストリームをクローズ
  useEffect(() => {
    return () => {
      if (streamRef.current) {
          console.log("[StreamPage] Closing EventSource on unmount");
          streamRef.current.close();
      }
    };
  }, []);

  // 初回生成の開始
  useEffect(() => {
    // 履歴の読み込みを待つ
    if (isLoadingVersions) {
        console.log("[StreamPage] Loading versions...");
        return;
    }

    if (versionsError) {
        console.error("[StreamPage] Error loading versions:", versionsError);
        setStatus('error');
        setErrorMsg('履歴の取得に失敗しました。');
        return;
    }

    // すでに履歴がある場合は、最新バージョンを表示して待機
    if (versionsData?.data && versionsData.data.length > 0 && status === 'connecting') {
        console.log("[StreamPage] Found existing versions, loading latest.");
        const latest = versionsData.data[0];
        setContent(latest.content);
        setCurrentVersionId(latest.id);
        setStatus('completed');
        return;
    }

    // まだ生成が始まっていない（履歴がない）場合のみストリーミングを開始
    if (status === 'connecting') {
        console.log("[StreamPage] No history found, starting initial stream.");
        startStreaming(`/api/generate/${topicId}/stream?target_chars=${encodeURIComponent(targetChars)}&is_paid=${encodeURIComponent(isPaid)}`);
    }
  }, [topicId, versionsData, status, isLoadingVersions, versionsError]);

  const startStreaming = (url: string) => {
    if (streamRef.current) streamRef.current.close();

    const fullUrl = `${API_BASE_URL}${url}`;
    console.log("[StreamPage] startStreaming (Full URL):", fullUrl);

    const eventSource = new EventSource(fullUrl);
    streamRef.current = eventSource;
    setStatus('streaming');
    setContent('');

    eventSource.onopen = () => {
        console.log("[StreamPage] EventSource opened");
    };

    eventSource.onmessage = (event) => {
      console.log("[StreamPage] Message received");
      const text = event.data.replace(/\\n/g, '\n');
      if (text.includes('[VERSION_ID]:')) {
          console.log("[StreamPage] Version ID received");
          const parts = text.split('[VERSION_ID]:');
          if (parts[0]) setContent((prev) => prev + parts[0]);
          const vid = parts[1].trim();
          setCurrentVersionId(vid);
          return;
      }
      setContent((prev) => prev + text);
    };

    eventSource.onerror = (err) => {
      console.error("[StreamPage] EventSource error/close:", err);
      eventSource.close();
      setIsRefining(false);
      
      if (content.length > 10 || currentVersionId) {
        setStatus('completed');
        mutate(`/api/generate/${topicId}/versions`);
      } else {
        setStatus('error');
        setErrorMsg('接続エラーまたはタイムアウトが発生しました。');
      }
    };
  };

  const handleRefine = (type: string) => {
    if (!currentVersionId || status === 'streaming') return;
    const promptValue = type === 'custom' ? customRefinement : type;
    if (type === 'custom' && !customRefinement.trim()) return;
    
    setIsRefining(true);
    // パラメータを安全にエンコードして送信
    const url = `/api/generate/${topicId}/refine/stream?version_id=${encodeURIComponent(currentVersionId)}&refinement_type=${encodeURIComponent(promptValue)}`;
    startStreaming(url);
    if (type === 'custom') setCustomRefinement('');
  };

  const handleReset = async () => {
    if (!confirm('履歴を全て削除して最初からやり直しますか？')) return;
    try {
        await api.post(`/api/generate/${topicId}/reset`);
        setContent('');
        setCurrentVersionId(null);
        setStatus('connecting');
        mutate(`/api/generate/${topicId}/versions`);
    } catch {
        alert('リセットに失敗しました');
    }
  };

  const handleFinalize = async () => {
    if (!currentVersionId) return;
    setStatus('finalizing');
    try {
        const res = await api.post(`/api/generate/${topicId}/finalize`, { version_id: currentVersionId });
        router.push(`/articles/${res.data.article_id}`);
    } catch {
        alert('保存に失敗しました');
        setStatus('completed');
    }
  };

  const handleManualSave = async () => {
      if (!editContent.trim()) return;
      try {
          const res = await api.post(`/api/generate/${topicId}/versions`, { content: editContent });
          setIsEditing(false);
          await mutate(`/api/generate/${topicId}/versions`);
          // Note: SWR mutate is async but we can optimistic update or wait
          setCurrentVersionId(res.data.version_id);
          setContent(editContent);
      } catch (err) {
          console.error(err);
          alert('手動保存に失敗しました');
      }
  };

  const selectVersion = (v: any) => {
      if (status === 'streaming') return;
      setContent(v.content);
      setCurrentVersionId(v.id);
  };

  return (
    <div className="animate-fade-in space-y-10 pb-20 max-w-[1200px] mx-auto p-4 md:p-0">
      
      {/* --- HEADER --- */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
           <Button variant="ghost" size="sm" onClick={() => router.push('/generate')} className="h-10 w-10 p-0 rounded-full border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm">
               <ArrowLeft size={18} />
           </Button>
           <div>
              <h1 className="text-2xl font-black tracking-tight text-gray-900 dark:text-white leading-none">
                 AI Refinement Workspace
              </h1>
              <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mt-1.5 flex items-center gap-2">
                 <Terminal size={10} className="text-primary-500" />
                 TOPIC_ID: {topicId.slice(0, 8)}... {currentVersionId && ` / VER_ID: ${currentVersionId.slice(0, 8)}`}
              </p>
           </div>
        </div>

        <div className="flex items-center gap-3">
          {status === 'streaming' && (
            <div className="px-4 py-2 bg-primary-50 dark:bg-primary-900/20 border border-primary-100 dark:border-primary-800 rounded-xl flex items-center gap-3 animate-pulse">
               <div className="w-2 h-2 bg-primary-500 rounded-full animate-ping" />
               <span className="text-xs font-black text-primary-600 dark:text-primary-400 uppercase tracking-widest">AI Polishing...</span>
            </div>
          )}
          {status === 'completed' && (
            <div className="flex items-center gap-3">
                {!isEditing ? (
                  <>
                    <Button 
                      variant="outline" 
                      onClick={() => { setEditContent(content); setIsEditing(true); }}
                      className="h-10 px-4 text-xs font-black border-secondary-100 text-secondary-600 hover:bg-secondary-50"
                    >
                        <Edit3 size={14} className="mr-2" /> 直接編集
                    </Button>
                    <Button variant="outline" onClick={handleReset} className="h-10 px-4 text-xs font-black border-red-100 text-red-500 hover:bg-red-50">
                        <Trash2 size={14} className="mr-2" /> 最初からやり直す
                    </Button>
                    <Button onClick={handleFinalize} className="h-10 px-6 text-xs font-black shadow-lg shadow-primary-500/20 bg-primary-600 hover:bg-primary-700">
                        <Save size={14} className="mr-2" /> 記事を完成させる
                    </Button>
                  </>
                ) : (
                  <>
                    <Button variant="outline" onClick={() => setIsEditing(false)} className="h-10 px-4 text-xs font-black border-gray-100 text-gray-400">
                        <X size={14} className="mr-2" /> キャンセル
                    </Button>
                    <Button onClick={handleManualSave} className="h-10 px-6 text-xs font-black bg-secondary-600 hover:bg-secondary-700">
                        <Save size={14} className="mr-2" /> 編集内容を保存（新Ver）
                    </Button>
                  </>
                )}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* --- LEFT: VERSION HISTORY & MENU --- */}
        <div className="lg:col-span-1 space-y-6 sticky top-8 self-start">
            <div className="bento-card p-4">
                <div className="flex items-center gap-2 mb-4 px-2">
                    <History size={16} className="text-gray-400" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Version History</span>
                </div>
                <div className="space-y-2 max-h-[calc(100vh-400px)] overflow-y-auto pr-2 custom-scrollbar">
                    {versionsData?.data?.map((v: any, index: number) => (
                        <button
                            key={v.id}
                            onClick={() => selectVersion(v)}
                            className={`w-full text-left p-3 rounded-xl border transition-all ${
                                currentVersionId === v.id 
                                    ? 'bg-primary-500 border-primary-400 text-white shadow-lg shadow-primary-500/20' 
                                    : 'bg-white dark:bg-gray-900 border-gray-100 dark:border-gray-800 text-gray-600 dark:text-gray-400 hover:border-primary-200'
                            }`}
                        >
                            <div className="flex items-center justify-between mb-1">
                                <span className="text-[10px] font-black uppercase tracking-tighter">
                                    Version {versionsData.data.length - index}
                                </span>
                                <span className="text-[8px] opacity-60 font-bold uppercase">
                                    {new Date(v.created_at).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            </div>
                            <p className="text-[11px] font-bold truncate opacity-90">
                                {v.refinement_prompt ? `Refine: ${v.refinement_prompt}` : 'Initial Draft'}
                            </p>
                        </button>
                    ))}
                    {(!versionsData?.data || versionsData.data.length === 0) && (
                        <div className="py-10 text-center opacity-20">
                            <History size={32} className="mx-auto mb-2" />
                            <p className="text-[10px] font-black uppercase">No History</p>
                        </div>
                    )}
                </div>
            </div>

            {/* BRUSH UP MENU */}
            <div className="bento-card p-4 bg-secondary-50/30 dark:bg-secondary-900/10 border-secondary-100 dark:border-secondary-900/30">
                <div className="flex items-center gap-2 mb-4 px-2 text-secondary-600">
                    <Wand2 size={16} />
                    <span className="text-[10px] font-black uppercase tracking-widest">Brush-up Actions</span>
                </div>
                <div className="space-y-2">
                    {patternsData?.data && Object.entries(patternsData.data).map(([key, label]: [string, any]) => (
                        <button
                            key={key}
                            disabled={status !== 'completed' || isRefining}
                            onClick={() => handleRefine(key)}
                            className="w-full text-left px-4 py-3 rounded-xl bg-white dark:bg-gray-900 border border-secondary-100 dark:border-secondary-800 hover:border-secondary-400 hover:shadow-md transition-all group disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-black text-gray-700 dark:text-gray-300 group-hover:text-secondary-600">
                                    {key === 'natural_fix' ? '不自然な表現を直す' : 
                                     key === 'ai_correction' ? 'AI感を抜く' : 
                                     key === 'readability_fix' ? 'よりわかりやすくする' :
                                     key === 'push' ? '背中を押す' : '整える'}
                                </span>
                                <ArrowUpRight size={12} className="text-gray-300 group-hover:text-secondary-400" />
                            </div>
                        </button>
                    ))}

                    <div className="pt-4 mt-4 border-t border-secondary-100 dark:border-secondary-900/30">
                        <textarea
                            value={customRefinement}
                            onChange={(e) => setCustomRefinement(e.target.value)}
                            placeholder="独自の修正指示を入力..."
                            disabled={status !== 'completed' || isRefining}
                            className="w-full h-24 p-3 text-xs font-medium bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl focus:ring-2 focus:ring-secondary-500 outline-none resize-none placeholder:text-gray-300"
                        />
                        <Button
                            size="sm"
                            disabled={status !== 'completed' || isRefining || !customRefinement.trim()}
                            onClick={() => handleRefine('custom')}
                            className="mt-2 h-10 w-full bg-secondary-600 hover:bg-secondary-700 font-black text-[10px] uppercase tracking-widest"
                        >
                            <Send size={12} className="mr-2" /> 指示を実行
                        </Button>
                    </div>
                </div>
                <p className="mt-4 px-2 text-[9px] font-medium text-gray-400 leading-relaxed">
                    選択した指示に基づいてAIが本文を再構築します。修正前後の内容は履歴から比較可能です。
                </p>
            </div>
        </div>

        {/* --- RIGHT: CONTENT VIEW --- */}
        <div className="lg:col-span-3">
          <div className="bento-card !p-0 overflow-hidden shadow-2xl min-h-[800px] flex flex-col bg-white dark:bg-gray-900/50">
            <div className="bento-header justify-between p-6 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-black/10">
               <div className="flex items-center gap-3">
                  <Layers className="text-primary-500" size={20} />
                  <h2 className="text-sm font-black tracking-widest uppercase text-gray-500">Draft Content</h2>
               </div>
               <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1.5 px-2 py-0.5 bg-gray-100 dark:bg-gray-800 rounded text-[10px] font-black text-gray-400 border border-gray-200 dark:border-gray-700 uppercase">
                     <Zap size={10} /> {content.length} chars
                  </div>
               </div>
            </div>

            <div className="flex-1 p-8 md:p-14 overflow-y-auto min-h-[600px]">
              {isEditing ? (
                <textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="w-full h-full min-h-[500px] p-6 text-[15px] font-medium leading-relaxed bg-gray-50/50 dark:bg-black/20 border-2 border-dashed border-secondary-200 dark:border-secondary-900 rounded-2xl outline-none focus:border-secondary-500 transition-colors resize-none"
                  placeholder="記事本文を編集できます..."
                />
              ) : content ? (
                <div 
                  className="animate-in fade-in duration-700 max-w-none prose prose-gray dark:prose-invert text-gray-800 dark:text-gray-200 leading-relaxed whitespace-pre-wrap font-medium text-[15px] prose-headings:font-black prose-headings:tracking-tight prose-a:text-primary-500 prose-img:rounded-2xl"
                  dangerouslySetInnerHTML={{ __html: content.replace(/\n/g, '<br />') }}
                />
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center space-y-8 py-20">
                   {status === 'error' ? (
                      <div className="space-y-6">
                         <div className="w-20 h-20 bg-red-100 dark:bg-red-900/20 rounded-3xl flex items-center justify-center text-red-500 mx-auto">
                            <Activity size={40} />
                         </div>
                         <div className="space-y-2">
                            <h3 className="text-xl font-black text-gray-900 dark:text-white">Connection Interrupted</h3>
                            <p className="text-sm text-gray-500 font-medium max-w-sm mx-auto leading-relaxed">{errorMsg}</p>
                         </div>
                         <Button variant="outline" onClick={() => window.location.reload()} className="h-12 px-8 font-black uppercase tracking-widest border-red-200 dark:border-red-800 text-red-500">
                            Retry Connection
                         </Button>
                      </div>
                   ) : (
                      <div className="space-y-8">
                         <div className="relative">
                            <div className="w-24 h-24 border-4 border-primary-500/10 rounded-full animate-spin border-t-primary-500" />
                            <div className="absolute inset-0 flex items-center justify-center text-primary-500">
                               <Sparkles size={32} />
                            </div>
                         </div>
                         <div className="space-y-2">
                            <p className="text-lg font-black text-gray-900 dark:text-white uppercase tracking-tighter">Initial Synthesis In Progress</p>
                            <p className="text-xs text-gray-400 font-bold uppercase tracking-[0.3em] animate-pulse">Building core narrative from RAG data...</p>
                         </div>
                      </div>
                   )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* --- STATUS FOOTER --- */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 px-2">
         <div className="flex items-center gap-2">
            <Info size={14} className="text-primary-500" />
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
               Drafting Mode: Interactive Refinement Active / Versions persist until Finalization.
            </p>
         </div>
      </div>
    </div>
  );
}
