'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Textarea } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { api } from '@/lib/api';
import { ScrollText, Wand2, DatabaseZap, Info, CheckCircle, Activity, Sparkles, Layers, CheckSquare, Square } from 'lucide-react';

const CATEGORY_OPTIONS = [
  { id: 'persona', label: 'ペルソナ・悩み' },
  { id: 'action', label: '具体アクション' },
  { id: 'mindfulness', label: 'マインドフルネス' },
  { id: 'reframing', label: 'リフレーミング' },
  { id: 'copywriting', label: 'コピーライティング' },
  { id: 'format', label: '構成・フォーマット' },
  { id: 'expression', label: '表現ルール' },
];

export default function ExtractPage() {
  const [text, setText] = useState('');
  const [enabledCategories, setEnabledCategories] = useState<string[]>(
    CATEGORY_OPTIONS.map(c => c.id)
  );
  const [isExtracting, setIsExtracting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [extractedData, setExtractedData] = useState<any[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [ngSettings, setNgSettings] = useState<Record<number, boolean>>({});

  const toggleCategory = (id: string) => {
    setEnabledCategories(prev => 
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    );
  };

  const [extractStep, setExtractStep] = useState<string>('');
  
  const handleExtract = async () => {
    if (!text.trim() || text.length < 10) {
      setError('テキストが短すぎます。10文字以上入力してください。');
      return;
    }

    setIsExtracting(true);
    setExtractStep('AIモデルを呼び出しています...');
    setError(null);
    setSuccess(null);
    setExtractedData(null);
    
    // 疑似的な進捗ステップを表示するためのタイマー
    const stepTimer = setTimeout(() => {
      setExtractStep('テキストの内容を分析中...');
    }, 2000);

    const stepTimer2 = setTimeout(() => {
      setExtractStep('カテゴリ別に知恵を構造化しています...');
    }, 5000);
    
    try {
      const res = await api.post('/api/extract', {
        raw_text: text,
        enabled_categories: enabledCategories
      });
      setExtractStep('完了！');
      setExtractedData(res.data.data);
      // 初期状態は全て OK (is_ng = false)
      const initialNg: Record<number, boolean> = {};
      res.data.data.forEach((_: any, i: number) => { initialNg[i] = false; });
      setNgSettings(initialNg);
    } catch (err: any) {
      const detail = err.response?.data?.detail;
      const errorMsg = typeof detail === 'string' 
        ? detail 
        : (Array.isArray(detail) ? detail.map((e: any) => e.msg).join(', ') : JSON.stringify(detail));
      
      let friendlyMsg = errorMsg || err.message || 'データ抽出処理に失敗しました';
      if (friendlyMsg.includes('401') || friendlyMsg.includes('API key')) {
        friendlyMsg = 'APIキーの設定が無効です。管理者に確認してください。';
      }
      setError(friendlyMsg);
      setExtractStep('');
    } finally {
      clearTimeout(stepTimer);
      clearTimeout(stepTimer2);
      setIsExtracting(false);
    }
  };

  const handleSaveToDB = async (item: any, index: number) => {
    if (!item || !item.category || !item.data) return;

    setIsSaving(true);
    setError(null);
    
    try {
      const is_ng = ngSettings[index] || false;
      await api.post(`/api/knowledge/${item.category}`, { ...item.data, is_ng });
      setSuccess(`${item.category} に新しいナレッジを ${is_ng ? 'NG設定として' : '保存'}しました！`);
      
      // 保存した項目をリストから除外
      setExtractedData((prev: any[] | null) => {
        if (!prev) return null;
        const newList = prev.filter((_, i) => i !== index);
        return newList.length > 0 ? newList : null;
      });
      
      if (extractedData?.length === 1) {
        setText(''); // 最後の項目を保存したらテキストをクリア
      }
    } catch (err: any) {
      const detail = err.response?.data?.detail;
      const errorMsg = typeof detail === 'string' 
        ? detail 
        : (Array.isArray(detail) ? detail.map(e => e.msg).join(', ') : JSON.stringify(detail));
      setError(errorMsg || err.message || 'DBへの保存に失敗しました');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDismiss = (index: number) => {
    setExtractedData((prev: any[] | null) => {
      if (!prev) return null;
      const newList = prev.filter((_, i) => i !== index);
      return newList.length > 0 ? newList : null;
    });
  };

  return (
    <div className="animate-fade-in space-y-10 pb-20 max-w-[1000px] mx-auto p-4 md:p-0">
      
      {/* --- HEADER --- */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300 rounded text-[10px] font-black uppercase tracking-widest border border-primary-200 dark:border-primary-800 flex items-center gap-1.5">
            <Sparkles size={12} />
            Knowledge Curation
          </span>
        </div>
        <h1 className="text-4xl font-black tracking-tight text-gray-900 dark:text-white leading-tight">
          Manual <span className="text-gradient">AI Extract</span>
        </h1>
        <p className="text-base text-gray-600 dark:text-gray-400 max-w-2xl font-medium leading-relaxed">
          書籍の抜粋、独自のメモ、SNSで見つけた心に響く言葉などを入力してください。AIが自動で「知の断片」として構造化し、データベースへ最適に分類・保存します。
        </p>
      </div>

      {/* --- INPUT AREA --- */}
      <div className="bento-card p-8">
        <div className="bento-header mb-6">
           <ScrollText className="text-primary-500" size={24} />
           <h2 className="text-xl font-black tracking-tight">ナレッジの元データ</h2>
        </div>
        
        <div className="space-y-6">
          <Textarea 
            value={text} 
            onChange={(e) => setText(e.target.value)} 
            placeholder="例: 今日は○○さんに怒られてすごく落ち込んだ。でもよく考えたら自分が新しい事に挑戦してる証拠かもと思い直して、温かいココアを飲んで寝たらスッキリした。"
            className="w-full text-lg font-medium min-h-[220px]"
          />

          <div className="bg-gray-50 dark:bg-gray-900/50 p-6 rounded-2xl border border-gray-100 dark:border-gray-800">
            <div className="mb-4 flex items-center gap-2">
              <Layers className="text-primary-500" size={18} />
              <h3 className="font-bold text-gray-900 dark:text-white">抽出対象のカテゴリを選択</h3>
              <span className="text-xs text-gray-500 ml-2">※OFFにした要素は学習されません</span>
            </div>
            <div className="flex flex-wrap gap-3">
              {CATEGORY_OPTIONS.map(category => {
                const isActive = enabledCategories.includes(category.id);
                return (
                  <button
                    key={category.id}
                    onClick={() => toggleCategory(category.id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold border transition-all ${
                      isActive 
                        ? 'bg-primary-500 text-white border-primary-500 shadow-md shadow-primary-500/20'
                        : 'bg-white dark:bg-gray-800 text-gray-500 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                  >
                    {isActive ? <CheckSquare size={16} /> : <Square size={16} />}
                    {category.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex justify-end">
            <Button 
              onClick={handleExtract} 
              isLoading={isExtracting}
              disabled={enabledCategories.length === 0}
              className="h-14 px-8 text-lg font-black shadow-lg shadow-primary-500/20 disabled:opacity-50"
            >
              <Wand2 className="mr-2" size={20} />
              {isExtracting ? extractStep : 'AIによる解析と整形'}
            </Button>
          </div>
        </div>
        
        <div className="mt-8 pt-6 border-t border-gray-100 dark:border-gray-800/50 flex items-start gap-3">
          <Info size={16} className="text-primary-500 mt-0.5 shrink-0" />
          <p className="text-xs text-gray-500 font-bold uppercase tracking-tight leading-relaxed">
             入力されたテキストは LLM によって匿名化され、汎用的な「占いナレッジ」として抽出されます。長文から複数のナレッジを同時に抽出可能です。
          </p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-6 rounded-2xl border border-red-200 dark:border-red-800 flex items-center gap-4 animate-in slide-in-from-top-4">
          <Activity className="shrink-0" size={24} />
          <div className="text-sm font-bold">{error}</div>
        </div>
      )}

      {success && (
        <div className="glass p-6 rounded-2xl border-l-4 border-l-green-500 text-green-700 dark:text-green-400 flex items-center gap-4 font-black shadow-sm animate-in slide-in-from-bottom-4">
          <CheckCircle size={28} />
          <div className="text-sm font-bold uppercase tracking-tight">
            {success}
          </div>
        </div>
      )}

      {extractedData && extractedData.length > 0 && (
        <div className="animate-in fade-in slide-in-from-bottom-8 duration-500 space-y-8">
          <div className="flex items-center justify-between">
             <h3 className="text-2xl font-black tracking-tight text-gray-900 dark:text-white">
                抽出された {extractedData.length} 件のナレッジ案
             </h3>
          </div>

          <div className="grid grid-cols-1 gap-6">
            {extractedData.map((item: any, idx: number) => (
              <div key={idx} className="bento-card border-none bg-primary-600 text-white shadow-xl shadow-primary-600/10 p-8 group relative overflow-hidden">
                <div className="absolute right-0 top-0 opacity-10 -rotate-12 translate-x-4 translate-y-[-20px]">
                   <DatabaseZap size={120} />
                </div>

                <div className="relative z-10 flex flex-col md:flex-row md:items-start justify-between gap-6">
                   <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                        <Layers size={24} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="bg-white/20 px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest border border-white/20">
                            {item.category}
                          </span>
                        </div>
                        <h4 className="text-white/70 text-sm mt-1 uppercase font-bold tracking-widest">Extracted Fragment #{idx + 1}</h4>
                      </div>
                   </div>

                   <div className="flex flex-col md:flex-row items-center gap-4">
                     <div className="flex bg-white/10 rounded-xl p-1 border border-white/10">
                       <button 
                         onClick={() => setNgSettings({...ngSettings, [idx]: false})}
                         className={`px-4 py-1.5 rounded-lg text-[10px] font-black transition-all ${!ngSettings[idx] ? 'bg-white text-primary-600 shadow-lg' : 'text-white/60 hover:text-white'}`}
                       >
                         参考にする (OK)
                       </button>
                       <button 
                         onClick={() => setNgSettings({...ngSettings, [idx]: true})}
                         className={`px-4 py-1.5 rounded-lg text-[10px] font-black transition-all ${ngSettings[idx] ? 'bg-red-500 text-white shadow-lg' : 'text-white/60 hover:text-white'}`}
                       >
                         NG設定にする (NG)
                       </button>
                     </div>

                     <div className="flex items-center gap-2">
                       <Button 
                        variant="ghost" 
                        onClick={() => handleDismiss(idx)}
                        className="text-white/60 hover:text-white hover:bg-white/10 h-10 px-4 font-black text-[10px] uppercase tracking-widest"
                      >
                        破棄
                      </Button>
                      <Button 
                        disabled={isSaving}
                        onClick={() => handleSaveToDB(item, idx)} 
                        className="bg-white text-primary-600 hover:bg-gray-50 h-10 px-6 font-black text-[10px] uppercase tracking-widest shadow-lg"
                      >
                        DBへ保存
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="mt-8 bg-black/40 rounded-xl p-6 border border-white/5 shadow-inner relative z-10">
                   <pre className="text-sm text-green-400 font-mono scrollbar-hide overflow-x-auto whitespace-pre-wrap">
                     {JSON.stringify(item.data, null, 2)}
                   </pre>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
