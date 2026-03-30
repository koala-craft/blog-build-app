'use client';

import { useState } from 'react';
import useSWR, { mutate } from 'swr';
import { fetcher, api } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Input, Textarea } from '@/components/ui/Input';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { User, Plus, Trash2, X, CheckCircle, Radio, Activity, Layers, Sparkles, Info, Pencil, Heart, BookOpen, Settings2 } from 'lucide-react';

interface PersonaTemplate {
  id: string;
  name: string;
  system_prompt: string;
  is_active: boolean;
  knowledge_settings?: Record<string, boolean>;
  created_at: string;
}

const KNOWLEDGE_CATEGORIES = [
  { key: 'spiritual', label: '霊的体験', icon: <Sparkles size={14} /> },
  { key: 'mindfulness', label: 'マインドフルネス', icon: <Activity size={14} /> },
  { key: 'empathy', label: '共感アプローチ', icon: <Heart size={14} /> },
  { key: 'reframing', label: 'リフレーミング', icon: <Layers size={14} /> },
  { key: 'style', label: '表現スタイル', icon: <Pencil size={14} /> },
  { key: 'experience', label: '人生経験', icon: <BookOpen size={14} /> },
];

const DEFAULT_SETTINGS: Record<string, boolean> = {
  spiritual: true,
  mindfulness: true,
  empathy: true,
  reframing: true,
  style: true,
  experience: true,
};

export default function PersonaPage() {
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState('');
  const [systemPrompt, setSystemPrompt] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isActivating, setIsActivating] = useState<string | null>(null);
  const [editingTemplate, setEditingTemplate] = useState<PersonaTemplate | null>(null);
  const [editName, setEditName] = useState('');
  const [editPrompt, setEditPrompt] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [knowledgeSettings, setKnowledgeSettings] = useState<Record<string, boolean>>(DEFAULT_SETTINGS);
  const [editSettings, setEditSettings] = useState<Record<string, boolean>>(DEFAULT_SETTINGS);

  const { data, error, isLoading } = useSWR('/api/persona-templates/', fetcher);
  const templates: PersonaTemplate[] = data?.data || [];

  const showFeedback = (msg: string, isError = false) => {
    if (isError) setErrorMsg(msg);
    else setSuccessMsg(msg);
    setTimeout(() => { setSuccessMsg(null); setErrorMsg(null); }, 4000);
  };

  const handleOpenEdit = (t: PersonaTemplate) => {
    setEditingTemplate(t);
    setEditName(t.name);
    setEditPrompt(t.system_prompt);
    setEditSettings(t.knowledge_settings || DEFAULT_SETTINGS);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTemplate) return;
    setIsUpdating(true);
    try {
      await api.patch(`/api/persona-templates/${editingTemplate.id}`, {
        name: editName,
        system_prompt: editPrompt,
        knowledge_settings: editSettings
      });
      mutate('/api/persona-templates/');
      setEditingTemplate(null);
      showFeedback(`「${editName}」を更新しました`);
    } catch (err: any) {
      showFeedback(err.response?.data?.detail || '更新に失敗しました', true);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !systemPrompt.trim()) return;
    setIsSaving(true);
    try {
      await api.post('/api/persona-templates/', { 
        name, 
        system_prompt: systemPrompt,
        knowledge_settings: knowledgeSettings
      });
      mutate('/api/persona-templates/');
      setName('');
      setSystemPrompt('');
      setShowModal(false);
      showFeedback('テンプレートを作成しました');
    } catch (err: any) {
      showFeedback(err.response?.data?.detail || '作成に失敗しました', true);
    } finally {
      setIsSaving(false);
    }
  };

  const handleActivate = async (id: string, name: string) => {
    setIsActivating(id);
    try {
      await api.post(`/api/persona-templates/${id}/activate`);
      mutate('/api/persona-templates/');
      showFeedback(`「${name}」を有効化しました`);
    } catch (err: any) {
      showFeedback('有効化に失敗しました', true);
    } finally {
      setIsActivating(null);
    }
  };

  const handleDeactivate = async (id: string, name: string) => {
    setIsActivating(id);
    try {
      await api.post(`/api/persona-templates/${id}/deactivate`);
      mutate('/api/persona-templates/');
      showFeedback(`「${name}」を無効化しました`);
    } catch (err: any) {
      showFeedback('無効化に失敗しました', true);
    } finally {
      setIsActivating(null);
    }
  };

  const handleDelete = (id: string) => {
    setDeleteId(id);
  };

  const handleConfirmDelete = async () => {
    if (!deleteId) return;
    setIsDeleting(true);
    try {
      await api.delete(`/api/persona-templates/${deleteId}`);
      mutate('/api/persona-templates/');
      showFeedback('テンプレートを削除しました');
      setDeleteId(null);
    } catch {
      showFeedback('削除に失敗しました', true);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="animate-fade-in space-y-10 pb-20 max-w-[900px] mx-auto p-4 md:p-0">

      {/* --- HEADER --- */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300 rounded text-[10px] font-black uppercase tracking-widest border border-primary-200 dark:border-primary-800 flex items-center gap-1.5">
              <User size={12} />
              Persona Management
            </span>
          </div>
          <h1 className="text-4xl font-black tracking-tight text-gray-900 dark:text-white leading-tight">
            Persona <span className="text-gradient">Templates</span>
          </h1>
          <p className="text-base text-gray-600 dark:text-gray-400 max-w-2xl font-medium leading-relaxed">
            記事生成に使用するペルソナをプロンプトで定義・切り替えできます。有効なテンプレートが優先され、未設定の場合はナレッジDBのペルソナデータが使用されます。
          </p>
        </div>
        <Button onClick={() => setShowModal(true)} className="h-12 px-6 font-black shadow-lg shadow-primary-500/20">
          <Plus className="mr-2" size={20} /> 新規テンプレート追加
        </Button>
      </div>

      {/* --- FEEDBACK MESSAGES --- */}
      {successMsg && (
        <div className="glass p-5 rounded-2xl border-l-4 border-l-green-500 text-green-700 dark:text-green-400 flex items-center gap-4 font-black shadow-sm animate-in slide-in-from-bottom-4">
          <CheckCircle size={24} />
          <span className="text-sm font-bold">{successMsg}</span>
        </div>
      )}
      {errorMsg && (
        <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-5 rounded-2xl border border-red-200 dark:border-red-800 flex items-center gap-4 animate-in slide-in-from-top-4">
          <Activity size={24} className="shrink-0" />
          <div className="text-sm font-bold">{errorMsg}</div>
        </div>
      )}

      {/* --- INFO BAR --- */}
      <div className="bento-card p-5 flex items-start gap-3">
        <Info size={18} className="text-primary-500 mt-0.5 shrink-0" />
        <div className="space-y-1">
          <p className="text-sm font-black text-gray-900 dark:text-white">ペルソナの優先順位</p>
          <p className="text-xs text-gray-500 font-medium leading-relaxed">
            <span className="text-primary-500 font-black">① 有効なテンプレート</span>（このページで設定）→
            <span className="font-black"> ② ナレッジDB のペルソナ</span>（Extract で学習）→
            <span className="font-black"> ③ デフォルト設定</span>（共感的なカウンセラー）
          </p>
        </div>
      </div>

      {/* --- TEMPLATE LIST --- */}
      {isLoading ? (
        <div className="bento-card p-24 flex flex-col items-center justify-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-500/20 border-t-primary-500" />
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Loading Templates...</p>
        </div>
      ) : error ? (
        <div className="bento-card p-24 text-center">
          <Activity className="mx-auto mb-4 text-red-500" size={48} />
          <p className="font-black text-gray-900 dark:text-white">Connection Error</p>
        </div>
      ) : templates.length === 0 ? (
        <div className="bento-card p-24 flex flex-col items-center justify-center opacity-30">
          <User size={64} className="mb-4" />
          <p className="text-sm font-black uppercase tracking-[0.3em]">No Templates</p>
          <p className="text-xs mt-2 font-medium">「新規テンプレート追加」でペルソナを作成してください</p>
        </div>
      ) : (
        <div className="space-y-4">
          {templates.map((t) => (
            <div
              key={t.id}
              className={`bento-card p-6 relative transition-all ${
                t.is_active
                  ? 'border-2 border-primary-500 shadow-xl shadow-primary-500/10 !bg-primary-50 dark:!bg-primary-900/10'
                  : 'opacity-80 hover:opacity-100'
              }`}
            >
              {/* Active Badge */}
              {t.is_active && (
                <div className="absolute top-4 right-4">
                  <span className="px-2 py-1 bg-primary-500 text-white text-[10px] font-black uppercase tracking-widest rounded-full flex items-center gap-1.5">
                    <Radio size={10} className="animate-pulse" /> ACTIVE
                  </span>
                </div>
              )}

              <div className="flex items-start gap-4">
                <div className={`p-3 rounded-xl ${t.is_active ? 'bg-primary-500 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-400'}`}>
                  <User size={20} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-black text-gray-900 dark:text-white">{t.name}</h3>
                  <p className="text-xs font-mono text-gray-400 mt-0.5">#{t.id.slice(0, 8)} · {new Date(t.created_at).toLocaleDateString('ja-JP')}</p>
                  <div className="mt-4 bg-gray-900/5 dark:bg-white/5 rounded-xl p-4 border border-gray-100 dark:border-gray-800">
                    <p className="text-sm text-gray-700 dark:text-gray-300 font-medium whitespace-pre-wrap leading-relaxed line-clamp-4">
                      {t.system_prompt}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleOpenEdit(t)}
                  className="text-gray-500 hover:text-primary-500 text-xs font-bold h-8 px-3"
                >
                  <Pencil size={13} className="mr-1.5" /> 編集
                </Button>
                {t.is_active ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeactivate(t.id, t.name)}
                    disabled={isActivating === t.id}
                    className="text-gray-500 hover:text-gray-700 text-xs font-bold"
                  >
                    無効化
                  </Button>
                ) : (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => handleActivate(t.id, t.name)}
                    disabled={isActivating === t.id}
                    className="text-xs font-black px-4 shadow-md shadow-primary-500/20"
                  >
                    <Sparkles size={12} className="mr-1.5" /> 有効化
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(t.id)}
                  className="h-8 w-8 p-0 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                >
                  <Trash2 size={14} />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* --- CREATE MODAL --- */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
          <div className="w-full max-w-2xl animate-in zoom-in-95 slide-in-from-bottom-4 duration-300">
            <div className="bento-card border-none shadow-2xl relative overflow-visible">
              <button
                onClick={() => setShowModal(false)}
                className="absolute -top-3 -right-3 w-10 h-10 bg-white dark:bg-gray-800 shadow-xl rounded-full flex items-center justify-center text-gray-400 hover:text-primary-500 transition-all border border-gray-100 dark:border-gray-700 z-10"
              >
                <X size={20} />
              </button>

              <div className="p-8">
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/40 rounded-2xl flex items-center justify-center">
                    <User className="text-primary-500" size={24} />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black tracking-tight">新しいペルソナテンプレート</h3>
                    <p className="text-[10px] font-black uppercase tracking-widest text-primary-500 mt-0.5">Persona Injection</p>
                  </div>
                </div>

                <form onSubmit={handleCreate} className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-xs font-black text-gray-500 uppercase tracking-widest ml-1">テンプレート名</label>
                    <Input
                      type="text"
                      placeholder="例: ミニマリスト占い師, 温かい相談相手"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      className="h-12 text-base font-bold"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black text-gray-500 uppercase tracking-widest ml-1">ペルソナプロンプト本文</label>
                    <Textarea
                      rows={10}
                      placeholder={`あなたは、自然体で語りかけるような温かい文体を持つ占い師です。
専門用語は極力避け、生活に密着した例えを使いながら、読者の悩みに共感した上でそっと背中を押すようなアドバイスを心がけます。
一人称は「私」を使い、読者への呼びかけは「あなた」とします。`}
                      value={systemPrompt}
                      onChange={(e) => setSystemPrompt(e.target.value)}
                      required
                      className="text-base font-medium"
                    />
                  </div>

                  {/* Knowledge Toggles */}
                  <div className="space-y-4">
                    <label className="text-xs font-black text-gray-500 uppercase tracking-widest ml-1 flex items-center gap-2">
                       <Settings2 size={14} /> 参考にするナレッジの選択
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      {KNOWLEDGE_CATEGORIES.map((cat) => (
                        <div 
                          key={cat.key}
                          onClick={() => setKnowledgeSettings(prev => ({ ...prev, [cat.key]: !prev[cat.key] }))}
                          className={`flex items-center justify-between p-3 rounded-xl border-2 transition-all cursor-pointer ${
                            knowledgeSettings[cat.key] 
                              ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300' 
                              : 'border-gray-100 dark:border-gray-800 text-gray-400 opacity-60'
                          }`}
                        >
                          <div className="flex items-center gap-2 font-bold text-sm">
                            {cat.icon}
                            {cat.label}
                          </div>
                          <div className={`w-10 h-5 rounded-full relative transition-colors ${knowledgeSettings[cat.key] ? 'bg-primary-500' : 'bg-gray-200 dark:bg-gray-700'}`}>
                            <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${knowledgeSettings[cat.key] ? 'left-6' : 'left-1'}`} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-6 border-t border-gray-100 dark:border-gray-800">
                    <Button variant="ghost" type="button" onClick={() => setShowModal(false)} className="h-12 px-6">
                      キャンセル
                    </Button>
                    <Button variant="primary" type="submit" isLoading={isSaving} className="h-12 px-8 font-black">
                      テンプレートを作成
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- EDIT MODAL --- */}
      {editingTemplate && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
          <div className="w-full max-w-2xl animate-in zoom-in-95 slide-in-from-bottom-4 duration-300">
            <div className="bento-card border-none shadow-2xl relative overflow-visible">
              <button
                onClick={() => setEditingTemplate(null)}
                className="absolute -top-3 -right-3 w-10 h-10 bg-white dark:bg-gray-800 shadow-xl rounded-full flex items-center justify-center text-gray-400 hover:text-primary-500 transition-all border border-gray-100 dark:border-gray-700 z-10"
              >
                <X size={20} />
              </button>

              <div className="p-8">
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900/40 rounded-2xl flex items-center justify-center">
                    <Pencil className="text-amber-500" size={22} />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black tracking-tight">テンプレートを編集</h3>
                    <p className="text-[10px] font-black uppercase tracking-widest text-amber-500 mt-0.5">Edit Template</p>
                  </div>
                </div>

                <form onSubmit={handleUpdate} className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-xs font-black text-gray-500 uppercase tracking-widest ml-1">テンプレート名</label>
                    <Input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      required
                      className="h-12 text-base font-bold"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black text-gray-500 uppercase tracking-widest ml-1">ペルソナプロンプト本文</label>
                    <Textarea
                      rows={10}
                      value={editPrompt}
                      onChange={(e) => setEditPrompt(e.target.value)}
                      required
                      className="text-base font-medium"
                    />
                  </div>

                  {/* Knowledge Toggles (Edit) */}
                  <div className="space-y-4">
                    <label className="text-xs font-black text-gray-500 uppercase tracking-widest ml-1 flex items-center gap-2">
                       <Settings2 size={14} /> 参考にするナレッジの選択
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      {KNOWLEDGE_CATEGORIES.map((cat) => (
                        <div 
                          key={cat.key}
                          onClick={() => setEditSettings(prev => ({ ...prev, [cat.key]: !prev[cat.key] }))}
                          className={`flex items-center justify-between p-3 rounded-xl border-2 transition-all cursor-pointer ${
                            editSettings[cat.key] 
                              ? 'border-amber-500 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300' 
                              : 'border-gray-100 dark:border-gray-800 text-gray-400 opacity-60'
                          }`}
                        >
                          <div className="flex items-center gap-2 font-bold text-sm">
                            {cat.icon}
                            {cat.label}
                          </div>
                          <div className={`w-10 h-5 rounded-full relative transition-colors ${editSettings[cat.key] ? 'bg-amber-500' : 'bg-gray-200 dark:bg-gray-700'}`}>
                            <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${editSettings[cat.key] ? 'left-6' : 'left-1'}`} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-6 border-t border-gray-100 dark:border-gray-800">
                    <Button variant="ghost" type="button" onClick={() => setEditingTemplate(null)} className="h-12 px-6">
                      キャンセル
                    </Button>
                    <Button variant="primary" type="submit" isLoading={isUpdating} className="h-12 px-8 font-black bg-amber-500 hover:bg-amber-600 shadow-amber-500/20">
                      変更を保存
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleConfirmDelete}
        title="テンプレートの削除"
        message="このペルソナテンプレートを完全に削除してもよろしいですか？（現在このペルソナが有効な場合、記事生成に影響が出る可能性があります）"
        confirmText="削除する"
        variant="danger"
        isLoading={isDeleting}
      />
    </div>
  );
}
