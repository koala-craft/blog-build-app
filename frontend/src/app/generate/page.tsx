'use client';

import { useState } from 'react';
import useSWR, { mutate } from 'swr';
import { fetcher, api } from '@/lib/api';
import { Card } from '@/components/ui/Card';
import { Table, Th, Td } from '@/components/ui/Table';
import { Button } from '@/components/ui/Button';
import { Sparkles, PenTool, RefreshCw, AlertCircle, Zap, Activity, Info, ArrowUpRight, Lock, Unlock, X, Pencil } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function TopicsPage() {
  const router = useRouter();
  const { data, error, isLoading } = useSWR('/api/topics', fetcher);
  const { data: themesData } = useSWR('/api/theme-templates/', fetcher);

  const [isGenerating, setIsGenerating] = useState(false);
  // 有効なテーマを初期値としてセット
  const [selectedTheme, setSelectedTheme] = useState<string>('');
  const [isThemeInit, setIsThemeInit] = useState(false);

  if (themesData?.data && !isThemeInit) {
    const activeTheme = themesData.data.find((t: any) => t.is_active);
    if (activeTheme) {
      setSelectedTheme(activeTheme.id);
    }
    setIsThemeInit(true);
  }
  const [targetChars, setTargetChars] = useState<string>('1500');
  const [isPaid, setIsPaid] = useState(false);
  const [customTheme, setCustomTheme] = useState<string>('');
  const [manualTitle, setManualTitle] = useState<string>('');
  const [isAddingManual, setIsAddingManual] = useState(false);
  const [editingTopicId, setEditingTopicId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState<string>('');
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const handleGenerateTopics = async () => {
    setIsGenerating(true);
    try {
      await api.post('/api/topics/generate', {
        theme_id: customTheme.trim() ? null : (selectedTheme || null),
        custom_theme: customTheme.trim() || null,
      });
      mutate('/api/topics');
    } catch (err) {
      alert('トピックの生成に失敗しました');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAddManualTopic = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualTitle.trim()) return;
    setIsAddingManual(true);
    try {
      await api.post('/api/topics/manual', { topic_title: manualTitle.trim() });
      mutate('/api/topics');
      setManualTitle('');
    } catch {
      alert('トピックの追加に失敗しました');
    } finally {
      setIsAddingManual(false);
    }
  };

  const handleSaveEdit = async (id: string) => {
    if (!editingTitle.trim()) return;
    setIsSavingEdit(true);
    try {
      await api.patch(`/api/topics/${id}`, { topic_title: editingTitle.trim() });
      mutate('/api/topics');
      setEditingTopicId(null);
    } catch {
      alert('タイトルの更新に失敗しました');
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleStartWriting = (topicId: string) => {
    const chars = parseInt(targetChars, 10);
    const validChars = (!isNaN(chars) && chars >= 100) ? chars : 1500;
    router.push(`/articles/stream/${topicId}?target_chars=${validChars}&is_paid=${isPaid}`);
  };

  return (
    <div className="animate-fade-in space-y-10 pb-20 max-w-[1200px] mx-auto p-4 md:p-0">
      
      {/* --- HEADER --- */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 bg-secondary-100 dark:bg-secondary-900/40 text-secondary-700 dark:text-secondary-300 rounded text-[10px] font-black uppercase tracking-widest border border-secondary-200 dark:border-secondary-800 flex items-center gap-1.5">
              <Sparkles size={12} />
              Topic Discovery
            </span>
          </div>
          <h1 className="text-4xl font-black tracking-tight text-gray-900 dark:text-white leading-tight">
            Blog Topic <span className="text-gradient">Synthesis</span>
          </h1>
          <p className="text-base text-gray-600 dark:text-gray-400 max-w-2xl font-medium leading-relaxed">
             DBに蓄積された「悩み（Worry Seeds）」を抽出し、LLMが読者の深層心理に響くブログの構成案とタイトルを自動生成します。
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-center gap-3">
           <select 
             value={selectedTheme} 
             onChange={(e) => setSelectedTheme(e.target.value)}
             disabled={!!customTheme.trim()}
             className="h-14 px-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-sm font-bold text-gray-700 dark:text-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 w-full sm:w-auto min-w-[200px] disabled:opacity-40"
           >
              <option value="">テーマ指定なし（通常生成）</option>
              {themesData?.data?.map((theme: any) => (
                <option key={theme.id} value={theme.id}>
                  {theme.theme_name}
                </option>
              ))}
           </select>

           {/* 文字数入力 */}
           <div className="flex items-center gap-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl px-4 h-14 shadow-sm w-full sm:w-auto">
             <span className="text-xs font-black text-gray-400 uppercase tracking-widest whitespace-nowrap">文字数</span>
             <input
               type="number"
               min={100}
               max={10000}
               step={100}
               value={targetChars}
               onChange={(e) => setTargetChars(e.target.value)}
               className="w-24 bg-transparent border-none outline-none text-sm font-black text-gray-700 dark:text-gray-300 text-right"
               placeholder="1500"
             />
             <span className="text-xs font-bold text-gray-400">字</span>
           </div>

           {/* 有料/無料トグル */}
           <button
             onClick={() => setIsPaid((v) => !v)}
             className={`h-14 px-5 rounded-xl border font-black text-sm flex items-center gap-2 transition-all shadow-sm w-full sm:w-auto justify-center ${
               isPaid
                 ? 'bg-amber-500 border-amber-400 text-white shadow-amber-500/30'
                 : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 text-gray-500 hover:border-amber-400 hover:text-amber-500'
             }`}
           >
             {isPaid ? <Lock size={16} /> : <Unlock size={16} />}
             {isPaid ? '有料記事モード' : '無料記事モード'}
           </button>
           
           <Button 
             onClick={handleGenerateTopics} 
             isLoading={isGenerating}
             className="h-14 px-8 font-black shadow-lg shadow-primary-500/20 bg-primary-600 hover:bg-primary-700 w-full sm:w-auto"
           >
             <RefreshCw size={20} className={`mr-2 ${isGenerating ? 'animate-spin' : ''}`} />
             新規トピックを生成
           </Button>
        </div>
      </div>

      {/* --- CUSTOM THEME INPUT --- */}
      <div className="bento-card p-5">
        <div className="flex items-center gap-3 mb-3">
          <Sparkles size={16} className="text-primary-500" />
          <span className="text-xs font-black text-gray-500 uppercase tracking-widest">カスタムテーマを直接入力（任意）</span>
          {customTheme.trim() && (
            <span className="px-2 py-0.5 bg-primary-100 dark:bg-primary-900/40 text-primary-600 dark:text-primary-400 text-[10px] font-black rounded uppercase tracking-wider">
              テーマDB の選択より優先
            </span>
          )}
        </div>
        <div className="flex gap-3">
          <input
            type="text"
            value={customTheme}
            onChange={(e) => setCustomTheme(e.target.value)}
            placeholder="例: 職場の人間関係に疲れた30代女性へ、星から学ぶ距離の取り方"
            className="flex-1 h-12 px-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-sm font-bold text-gray-700 dark:text-gray-300 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
          {customTheme && (
            <button
              onClick={() => setCustomTheme('')}
              className="h-12 w-12 flex items-center justify-center rounded-xl border border-gray-200 dark:border-gray-800 text-gray-400 hover:text-red-500 hover:border-red-200 bg-white dark:bg-gray-900 transition-all"
            >
              <X size={16} />
            </button>
          )}
        </div>
        {customTheme.trim() && (
          <p className="text-xs font-bold text-primary-500 mt-2.5 flex items-center gap-1.5">
            <Info size={12} /> このテーマをそのまま生成プロンプトに使用します。上の「テーマDB」選択は無視されます。
          </p>
        )}
      </div>

      {/* --- MANUAL TOPIC INPUT --- */}
      <div className="bento-card p-5">
        <div className="flex items-center gap-3 mb-3">
          <PenTool size={16} className="text-secondary-500" />
          <span className="text-xs font-black text-gray-500 uppercase tracking-widest">トピックタイトルを直接入力して追加</span>
        </div>
        <form onSubmit={handleAddManualTopic} className="flex gap-3">
          <input
            type="text"
            value={manualTitle}
            onChange={(e) => setManualTitle(e.target.value)}
            placeholder="例: 感情的になってしまう自分が嫌。水星逆行が教えてくれること"
            className="flex-1 h-12 px-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-sm font-bold text-gray-700 dark:text-gray-300 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-secondary-500"
          />
          <Button
            type="submit"
            isLoading={isAddingManual}
            disabled={!manualTitle.trim()}
            className="h-12 px-6 font-black bg-secondary-500 hover:bg-secondary-600 shadow-secondary-500/20 shadow-lg whitespace-nowrap"
          >
            追加
          </Button>
        </form>
        <p className="text-xs text-gray-400 font-bold mt-2.5">
          ✏️ 入力したタイトルがそのままトピック候補に追加されます。AIによるタイトルの生成は行いません。
        </p>
      </div>

      {/* --- TOPIC CANDIDATES --- */}
      <div className="bento-card !p-0 overflow-hidden shadow-2xl">
        <div className="bento-header justify-between p-6 bg-white dark:bg-gray-900/40 border-b border-gray-100 dark:border-gray-800">
           <div className="flex items-center gap-3">
              <Zap className="text-secondary-500" size={24} />
              <h2 className="text-xl font-black tracking-tight text-gray-900 dark:text-white">Topic Candidates</h2>
              <span className="bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded text-[10px] font-black text-gray-500 uppercase tracking-widest border border-gray-200 dark:border-gray-700">
                Awaiting Content
              </span>
           </div>
        </div>

        {isLoading ? (
          <div className="p-24 flex flex-col items-center justify-center space-y-4">
             <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-500/20 border-t-primary-500"></div>
             <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Synthesizing Ideas...</p>
          </div>
        ) : error ? (
          <div className="p-24 text-center">
             <Activity className="mx-auto mb-4 text-red-500" size={48} />
             <p className="text-lg font-black text-gray-900 dark:text-white">Retrieval Failed</p>
             <p className="text-sm text-gray-500 mt-1">トピック候補の取得に失敗しました。</p>
          </div>
        ) : (
          <Table className="border-none">
            <thead>
              <tr className="bg-gray-50/50 dark:bg-black/10">
                <Th className="pl-6 py-4">Status</Th>
                <Th className="py-4">Proposed Editorial Title</Th>
                <Th className="py-4">Generated At</Th>
                <Th className="pr-6 py-4 text-right">Action</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
              {data?.data?.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((topic: any) => (
                <tr key={topic.id} className="group hover:bg-primary-500/[0.02] transition-colors">
                  <Td className="pl-6 py-6">
                    <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border ${
                      topic.status === 'pending' 
                        ? 'bg-blue-50 text-blue-600 border-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800' 
                        : 'bg-green-50 text-green-600 border-green-100 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800'
                    }`}>
                      {topic.status}
                    </span>
                  </Td>
                   <Td className="py-6 max-w-xl">
                    {editingTopicId === topic.id ? (
                      <div className="flex items-center gap-2">
                        <input
                          autoFocus
                          type="text"
                          value={editingTitle}
                          onChange={(e) => setEditingTitle(e.target.value)}
                          onKeyDown={(e) => { if (e.key === 'Enter') handleSaveEdit(topic.id); if (e.key === 'Escape') setEditingTopicId(null); }}
                          className="flex-1 h-10 px-3 rounded-lg border border-primary-400 bg-white dark:bg-gray-900 text-sm font-bold text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                        <Button size="sm" isLoading={isSavingEdit} onClick={() => handleSaveEdit(topic.id)} className="h-8 px-3 text-xs font-black">保存</Button>
                        <button onClick={() => setEditingTopicId(null)} className="h-8 w-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-red-500 border border-gray-200 dark:border-gray-700"><X size={14} /></button>
                      </div>
                    ) : (
                      <div className="flex items-start gap-2 group/title">
                        <p className="font-black text-gray-900 dark:text-white text-lg leading-tight group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors flex-1">
                          {topic.topic_title}
                        </p>
                        <button
                          onClick={() => { setEditingTopicId(topic.id); setEditingTitle(topic.topic_title); }}
                          className="opacity-0 group-hover/title:opacity-100 transition-opacity p-1 rounded text-gray-400 hover:text-primary-500"
                        >
                          <Pencil size={14} />
                        </button>
                      </div>
                    )}
                   </Td>
                    <Td className="py-6 font-bold text-gray-500 text-xs">
                     {topic.created_at ? new Date(topic.created_at).toLocaleString('ja-JP', { 
                       month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' 
                     }) : '-'}
                   </Td>
                   <Td className="pr-6 py-6 text-right">
                     <Button 
                       onClick={() => handleStartWriting(topic.id)}
                       disabled={editingTopicId === topic.id}
                       className="h-10 px-5 font-black text-xs uppercase tracking-widest flex items-center gap-2 ml-auto shadow-md"
                     >
                       <PenTool size={14} />
                       執筆開始
                     </Button>
                   </Td>
                </tr>
              ))}
              {(!data?.data || data.data.length === 0) && (
                <tr>
                  <Td colSpan={4} className="text-center py-32">
                    <div className="flex flex-col items-center opacity-20">
                       <Zap size={64} className="mb-4" />
                       <p className="text-sm font-black uppercase tracking-[0.3em]">No Pending Topics</p>
                       <Button onClick={handleGenerateTopics} variant="outline" className="mt-6 font-black h-12 uppercase tracking-widest opacity-100">
                          First Generation
                       </Button>
                    </div>
                  </Td>
                </tr>
              )}
            </tbody>
          </Table>
        )}
        
        <div className="p-6 bg-gray-50 dark:bg-gray-900/40 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Info size={14} className="text-primary-500" />
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                Titles are optimized for SEO and engagement based on seed analysis.
              </p>
            </div>

            {/* Pagination Controls */}
            {data?.data?.length > itemsPerPage && (
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(v => v - 1)}
                  className="h-8 px-3 text-[10px] font-black uppercase tracking-widest border border-gray-200 dark:border-gray-700 disabled:opacity-30"
                >
                  Prev
                </Button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.ceil(data.data.length / itemsPerPage) }).map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setCurrentPage(i + 1)}
                      className={`w-8 h-8 rounded-lg text-[10px] font-black transition-all ${
                        currentPage === i + 1
                          ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/30'
                          : 'text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                      }`}
                    >
                      {i + 1}
                    </button>
                  ))}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={currentPage >= Math.ceil(data.data.length / itemsPerPage)}
                  onClick={() => setCurrentPage(v => v + 1)}
                  className="h-8 px-3 text-[10px] font-black uppercase tracking-widest border border-gray-200 dark:border-gray-700 disabled:opacity-30"
                >
                  Next
                </Button>
              </div>
            )}
        </div>
      </div>

      {/* --- INFO BENTO --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bento-card border-l-4 border-l-primary-500">
          <div className="flex items-center gap-3 mb-4">
             <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900/40 rounded-xl flex items-center justify-center text-primary-600">
                <Sparkles size={20} />
             </div>
             <h3 className="text-base font-black uppercase tracking-tight">アルゴリズムの仕組み</h3>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed font-medium">
            DB内の「未解決の悩み（Worry Seeds）」を LLM が統合解析し、読者の解決欲求を最大化するタイトルを生成します。トピックは一時保存され、いつでも執筆を開始できます。
          </p>
        </div>

        <div className="bento-card border-l-4 border-l-secondary-500">
          <div className="flex items-center gap-3 mb-4">
             <div className="w-10 h-10 bg-secondary-100 dark:bg-secondary-900/40 rounded-xl flex items-center justify-center text-secondary-600">
                <PenTool size={20} />
             </div>
             <h3 className="text-base font-black uppercase tracking-tight">自動執筆フロー</h3>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed font-medium">
             「執筆開始」をクリックすると、RAG（関連物理・心理知識検索）とペルソナ設定を組み合わせた、独自のAIライティングがストリーミング形式で開始されます。
          </p>
        </div>
      </div>
    </div>
  );
}
