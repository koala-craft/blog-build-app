'use client';

import { useState } from 'react';
import useSWR, { mutate } from 'swr';
import { fetcher, api } from '@/lib/api';
import { Card } from '@/components/ui/Card';
import { Table, Th, Td } from '@/components/ui/Table';
import { Button } from '@/components/ui/Button';
import { Input, Textarea } from '@/components/ui/Input';
import { Database, Plus, Trash2, X, Search, Filter, ShieldCheck, Activity, Info, Layers } from 'lucide-react';
import { ConfirmModal } from '@/components/ui/ConfirmModal';

const categories = [
  { id: 'spiritual', name: '霊的体験', icon: '🔮', color: 'text-purple-600' },
  { id: 'mindfulness', name: 'マインドフルネス', icon: '🧘', color: 'text-blue-500' },
  { id: 'reframing', name: 'リフレーミング', icon: '🔄', color: 'text-green-500' },
  { id: 'action', name: '具体アクション', icon: '🏃', color: 'text-orange-500' },
  { id: 'empathy', name: '共感テキスト', icon: '❤️', color: 'text-red-500' },
  { id: 'persona', name: 'ペルソナ設定', icon: '👤', color: 'text-indigo-500' },
  { id: 'format', name: '構成・フォーマット', icon: '📝', color: 'text-emerald-500' },
  { id: 'expression', name: '表現ルール', icon: '🛡️', color: 'text-orange-500' },
  { id: 'experience', name: '人生経験', icon: '🌱', color: 'text-lime-500' },
];

export default function KnowledgePage() {
  const [activeTab, setActiveTab ] = useState('spiritual');
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState<any>({});
  const [editId, setEditId] = useState<string | null>(null);
  const [isLoadingSave, setIsLoadingSave] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const { data, error, isLoading } = useSWR(`/api/knowledge/${activeTab}`, fetcher);

  // 検索フィルタリング
  const filteredData = data?.data?.filter((item: any) => {
    const searchTarget = [
      item.vision_text,
      item.aura_color,
      item.energy_color,
      item.energy_sensation,
      item.guardian_spirit,
      item.guardian_spirit_feature,
      item.past_life_context,
      item.atmosphere_vibe,
      item.spiritual_symbol,
      item.synchronicity_sign,
      item.spiritual_message,
      item.philosophy_concept,
      item.encouragement_text,
      item.trait_name,
      item.trait_description,
      item.format_rule,
      item.layout_example,
      item.negative_state,
      item.positive_perspective,
      item.situation,
      item.small_step_proposal,
      item.abstract_situation,
      item.empathy_approach,
      item.style_pattern,
      item.preferred_style,
      item.rejection_reason,
      item.experience_summary,
      item.story_detail,
      item.emotional_point,
      item.instruction_worry,
      item.ideal_response
    ].join(' ').toLowerCase();
    return searchTarget.includes(searchQuery.toLowerCase());
  }) || [];

  const handleOpenAdd = () => {
    setFormData({});
    setEditId(null);
    setShowModal(true);
  };

  const handleEdit = (item: any) => {
    setFormData(item);
    setEditId(item.id);
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoadingSave(true);
    try {
      if (editId) {
        await api.put(`/api/knowledge/${activeTab}/${editId}`, formData);
      } else {
        await api.post(`/api/knowledge/${activeTab}`, formData);
      }
      mutate(`/api/knowledge/${activeTab}`);
      setShowModal(false);
      setFormData({});
      setEditId(null);
    } catch (err: any) {
      const detail = err.response?.data?.detail;
      const errorMsg = typeof detail === 'string' 
        ? detail 
        : (Array.isArray(detail) ? detail.map(e => e.msg).join(', ') : JSON.stringify(detail));
      alert('保存に失敗しました: ' + (errorMsg || err.message));
    } finally {
      setIsLoadingSave(false);
    }
  };

  const handleDelete = (id: string) => {
    setDeleteId(id);
  };

  const handleConfirmDelete = async () => {
    if (!deleteId) return;
    setIsDeleting(true);
    try {
      await api.delete(`/api/knowledge/${activeTab}/${deleteId}`);
      mutate(`/api/knowledge/${activeTab}`);
      setDeleteId(null);
    } catch (err) {
      alert('削除に失敗しました');
    } finally {
      setIsDeleting(false);
    }
  };

  const getFields = () => {
    switch(activeTab) {
      case 'spiritual':
        return [
          { key: 'vision_text', label: '霊視内容 (ベクトル化対象)', type: 'textarea', placeholder: 'どのような情景が見えたか...' },
          { key: 'aura_color', label: 'オーラの色', type: 'text', placeholder: '青色, 金色など' },
          { key: 'energy_color', label: 'エネルギーの色', type: 'text', placeholder: '' },
          { key: 'energy_sensation', label: '質感・温度', type: 'text', placeholder: '暖かい, 重いなど' },
          { key: 'guardian_spirit', label: '守護霊', type: 'text', placeholder: '武士, 巫女など' },
          { key: 'guardian_spirit_feature', label: '守護霊の特徴', type: 'textarea', placeholder: 'どのような雰囲気か...' },
          { key: 'past_life_context', label: '前世の断片', type: 'textarea', placeholder: '見えた過去の場面...' },
          { key: 'atmosphere_vibe', label: '空間の雰囲気', type: 'text', placeholder: '澄んでいるなど' },
          { key: 'spiritual_symbol', label: '象徴', type: 'text', placeholder: '枯れた花など' },
          { key: 'synchronicity_sign', label: '兆し・シンクロ', type: 'text', placeholder: 'ゾロ目など' },
          { key: 'spiritual_message', label: 'メッセージ', type: 'textarea', placeholder: '伝えられた言葉など' },
        ];
      case 'mindfulness':
        return [
          { key: 'philosophy_concept', label: 'コンセプト', type: 'text', placeholder: '自己受容など' },
          { key: 'encouragement_text', label: '励ましテキスト (ベクトル化対象)', type: 'textarea', placeholder: 'ありのままの自分で大丈夫...' },
        ];
      case 'persona':
        return [
          { key: 'trait_name', label: '特性名', type: 'text', placeholder: '例: 辛口, 寄り添い系' },
          { key: 'trait_description', label: '詳細説明 (ベクトル化対象)', type: 'textarea', placeholder: 'どのような口調や性格か...' },
          { key: 'priority_order', label: '優先順位', type: 'number', placeholder: '0' },
          { key: 'is_active', label: '有効化する', type: 'checkbox', placeholder: '' },
        ];
      case 'copywriting':
        return [
          { key: 'structure_type', label: '構成タイプ', type: 'text', placeholder: '例: 悩み導入, ストーリーテリング, CTA' },
          { key: 'suggested_text_pattern', label: '推奨テキストパターン (ベクトル化対象)', type: 'textarea', placeholder: '「最近、○○で悩んでいませんか？」から始まる...' },
        ];
      case 'format':
        return [
          { key: 'format_rule', label: 'フォーマットルール', type: 'text', placeholder: '例: 3行短文, 箇条書き多用' },
          { key: 'layout_example', label: 'レイアウト例 (ベクトル化対象)', type: 'textarea', placeholder: '1文は短く切り、必ず空行を入れる...' },
        ];
      case 'reframing':
        return [
          { key: 'negative_state', label: 'ネガティブな状態', type: 'text', placeholder: '例: 失敗を引きずっている' },
          { key: 'positive_perspective', label: 'ポジティブな視点 (ベクトル化対象)', type: 'textarea', placeholder: '失敗は成長のための貴重なデータであり...' },
        ];
      case 'action':
        return [
          { key: 'situation', label: '想定状況', type: 'text', placeholder: '例: 朝起きてやる気が出ない時' },
          { key: 'small_step_proposal', label: '具体的な小さな一歩 (ベクトル化対象)', type: 'textarea', placeholder: 'まずはお気に入りのコップで水を一杯飲むことから...' },
        ];
      case 'empathy':
        return [
          { key: 'abstract_situation', label: '抽象的な悩み状況', type: 'text', placeholder: '例: 将来への漠然とした不安' },
          { key: 'empathy_approach', label: '共感的アプローチ (ベクトル化対象)', type: 'textarea', placeholder: 'その不安は、あなたが未来を大切にしたいと願っている証拠ですね...' },
          { key: 'warmth_level', label: '温かみレベル (1-5)', type: 'number', placeholder: '3' },
        ];
      case 'expression':
        return [
          { key: 'style_pattern', label: '対象の文体・パターン (ベクトル化対象)', type: 'textarea', placeholder: '例: 「私自身、〜」で始まる過度な自語り。脈絡のない「疲れてしまうから」という締め。' },
          { key: 'preferred_style', label: '推奨されるスタイル', type: 'textarea', placeholder: '例: 読者の体験に意識を向けさせ、解決策を提示するスタイル。' },
          { key: 'rejection_reason', label: 'NG理由・文脈 (ベクトル化対象)', type: 'textarea', placeholder: 'なぜこの表現がダメなのか。どのような場面で発生しやすいか。' },
        ];
      case 'experience':
        return [
          { key: 'experience_summary', label: '経験の要約 (ベクトル化対象)', type: 'text', placeholder: '例: 完璧主義による燃え尽き症候群' },
          { key: 'story_detail', label: 'エピソード詳細 (ベクトル化対象)', type: 'textarea', placeholder: 'どのような状況で、何が起きたか。筆者の感情の動き。' },
          { key: 'emotional_point', label: '気づき・感情のピーク', type: 'textarea', placeholder: 'その経験から得られた教訓や、最も心が揺れ動いた瞬間。' },
          { key: 'instruction_worry', label: '相談者の悩み (Instruction)', type: 'textarea', placeholder: 'この経験が解決策になるような、ユーザーからの相談内容。' },
          { key: 'ideal_response', label: '理想的な回答 (Output)', type: 'textarea', placeholder: '経験を交えた共感的で具体的なアドバイス。' },
          { key: 'source_url', label: '出典URL', type: 'text', placeholder: 'https://note.com/...' },
        ];
      default:
        return [
          { key: 'title', label: 'タイトル', type: 'text', placeholder: '' },
          { key: 'content', label: '内容 (ベクトル化対象)', type: 'textarea', placeholder: '' },
        ];
    }
  };

  const getFullFields = () => {
    const baseFields = getFields();
    // 全てのカテゴリに is_ng (ガードレール設定) を追加 (personaのis_activeと重複しないように調整)
    const filteredBase = baseFields.filter(f => f.key !== 'is_ng');
    return [
      ...filteredBase,
      { key: 'is_ng', label: 'NG設定 (ガードレールとして使用)', type: 'checkbox', placeholder: '' }
    ];
  };

  return (
    <div className="animate-fade-in space-y-10 pb-20 max-w-[1200px] mx-auto p-4 md:p-0">
      
      {/* --- HEADER --- */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300 rounded text-[10px] font-black uppercase tracking-widest border border-primary-200 dark:border-primary-800 flex items-center gap-1.5">
              <Database size={12} />
              Vault Management
            </span>
          </div>
          <h1 className="text-4xl font-black tracking-tight text-gray-900 dark:text-white leading-tight">
            Knowledge <span className="text-gradient">Engine DB</span>
          </h1>
          <p className="text-base text-gray-600 dark:text-gray-400 max-w-2xl font-medium leading-relaxed">
            AIエンジンの「知能」を構成するデータの管理センターです。各カテゴリのデータは自動でベクトル化され、記事生成時の Semantic Search（意味検索）に使用されます。
          </p>
        </div>
        
        <div className="flex items-center gap-3">
           <Button onClick={handleOpenAdd} className="h-12 px-6 font-black shadow-lg shadow-primary-500/20">
             <Plus className="mr-2" size={20} /> 新規ナレッジ追加
           </Button>
        </div>
      </div>

      {/* --- CATEGORY TABS --- */}
      <div className="bento-card p-4 !bg-gray-50/50 dark:!bg-gray-900/50">
        <div className="flex overflow-x-auto pb-1 gap-2 scrollbar-hide">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveTab(cat.id)}
              className={`flex items-center gap-3 px-6 py-3 rounded-xl whitespace-nowrap transition-all font-black text-sm border-2 ${
                activeTab === cat.id 
                  ? 'bg-white dark:bg-gray-800 border-primary-500 text-primary-600 dark:text-primary-400 shadow-md scale-[1.02]' 
                  : 'bg-transparent border-transparent text-gray-500 dark:text-gray-400 hover:bg-white/50 dark:hover:bg-gray-800/50 hover:text-gray-700 dark:hover:text-gray-200'
              }`}
            >
              <span className="text-lg">{cat.icon}</span>
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* --- DATA TABLE --- */}
      <div className="bento-card !p-0 overflow-hidden shadow-2xl">
        <div className="bento-header justify-between p-6 bg-white dark:bg-gray-900/40 border-b border-gray-100 dark:border-gray-800">
           <div className="flex items-center gap-3">
              <Layers className="text-primary-500" size={24} />
              <h2 className="text-xl font-black tracking-tight">Stored Knowledge</h2>
              <span className="bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded text-[10px] font-black text-gray-500 uppercase tracking-widest border border-gray-200 dark:border-gray-700">
                {filteredData.length} Records
              </span>
           </div>
           <div className="flex items-center gap-2">
              <div className="bg-gray-50 dark:bg-black/20 px-3 py-1.5 rounded-lg flex items-center gap-2 border border-gray-100 dark:border-gray-800">
                 <Search size={14} className="text-gray-400" />
                 <input 
                   className="bg-transparent border-none outline-none text-xs font-bold text-gray-600 dark:text-gray-300 placeholder:text-gray-400" 
                   placeholder="Quick Search..." 
                   value={searchQuery}
                   onChange={(e) => setSearchQuery(e.target.value)}
                 />
              </div>
              <button className="p-2 bg-gray-50 dark:bg-black/20 rounded-lg hover:text-primary-500 transition-colors border border-gray-100 dark:border-gray-800">
                 <Filter size={18} />
              </button>
           </div>
        </div>

        {isLoading ? (
          <div className="p-24 flex flex-col items-center justify-center space-y-4">
             <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-500/20 border-t-primary-500"></div>
             <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Accessing Vault...</p>
          </div>
        ) : error ? (
          <div className="p-24 text-center">
             <Activity className="mx-auto mb-4 text-red-500" size={48} />
             <p className="text-lg font-black text-gray-900 dark:text-white">Connection Error</p>
             <p className="text-sm text-gray-500 mt-1">データの読み込みに失敗しました。サーバーの状態を確認してください。</p>
          </div>
        ) : (
          <Table className="border-none">
            <thead>
              <tr className="bg-gray-50/50 dark:bg-black/10">
                <Th className="pl-6 py-4">Knowledge Metadata</Th>
                <Th className="py-4">Core Structured Data</Th>
                <Th className="pr-6 py-4 text-right">Control</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
              {filteredData.map((item: any) => (
                <tr key={item.id} className="group hover:bg-primary-500/[0.02] transition-colors">
                  <Td className="pl-6 py-6">
                    <div className="flex items-start gap-3">
                       <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg text-gray-400 group-hover:text-primary-500 transition-colors">
                          <Database size={16} />
                       </div>
                       <div className="flex flex-col">
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono text-[10px] font-bold text-gray-400 tracking-tight">#{item.id.slice(0,8)}</span>
                            {item.is_ng && (
                              <span className="bg-red-500 text-white text-[8px] font-black px-1.5 py-0.5 rounded-sm uppercase tracking-tighter">NG</span>
                            )}
                          </div>
                          <span className="text-xs font-black text-gray-700 dark:text-gray-300 mt-0.5">{new Date(item.created_at).toLocaleDateString()}</span>
                       </div>
                    </div>
                  </Td>
                  <Td className="py-6">
                    <div className="max-w-2xl">
                      <p className="font-black text-gray-900 dark:text-white text-base leading-tight mb-2">
                        {item.vision_text?.slice(0, 30) || item.philosophy_concept || item.trait_name || item.format_rule || item.negative_state || item.situation || item.abstract_situation || item.style_pattern || item.experience_summary || "Undefined Entity"}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 font-medium leading-relaxed">
                        {item.spiritual_message || item.encouragement_text || item.trait_description || item.layout_example || item.positive_perspective || item.small_step_proposal || item.empathy_approach || item.rejection_reason || item.story_detail || "No content summary available."}
                      </p>
                      {(item.preferred_style || item.emotional_point || item.instruction_worry) && (
                        <div className="mt-1 flex flex-wrap gap-2 text-[10px] font-black uppercase tracking-widest">
                          {item.preferred_style && <span className="text-primary-500">Style: {item.preferred_style}</span>}
                          {item.emotional_point && <span className="text-orange-500">Insight: {item.emotional_point.slice(0, 40)}...</span>}
                          {item.instruction_worry && <span className="text-emerald-500">Dataset Ready</span>}
                        </div>
                      )}
                    </div>
                  </Td>
                  <Td className="pr-6 py-6 text-right">
                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all">
                      <Button variant="ghost" size="sm" onClick={() => handleEdit(item)} className="h-10 w-10 p-0 text-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-xl">
                        <Activity size={18} />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(item.id)} className="h-10 w-10 p-0 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl">
                        <Trash2 size={18} />
                      </Button>
                    </div>
                  </Td>
                </tr>
              ))}
              {(!data?.data || data.data.length === 0) && (
                <tr>
                  <Td colSpan={3} className="text-center py-32">
                    <div className="flex flex-col items-center opacity-20">
                       <ShieldCheck size={64} className="mb-4" />
                       <p className="text-sm font-black uppercase tracking-[0.3em]">Vault is Empty</p>
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
                All changes are synced with the vector index immediately.
              </p>
            </div>
        </div>
      </div>

      {/* --- ADD MODAL --- */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
          <div className="w-full max-w-xl animate-in zoom-in-95 slide-in-from-bottom-4 duration-300">
            <div className="bento-card border-none shadow-2xl relative max-h-[85vh] overflow-y-auto custom-scrollbar">
              <button 
                onClick={() => setShowModal(false)}
                className="absolute -top-3 -right-3 w-10 h-10 bg-white dark:bg-gray-800 shadow-xl rounded-full flex items-center justify-center text-gray-400 hover:text-primary-500 transition-all border border-gray-100 dark:border-gray-700 z-10"
              >
                <X size={20} />
              </button>
              
              <div className="p-8">
                <div className="flex items-center gap-4 mb-8">
                   <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/40 rounded-2xl flex items-center justify-center text-2xl">
                     {categories.find(c => c.id === activeTab)?.icon}
                   </div>
                   <div>
                      <h3 className="text-2xl font-black tracking-tight">{categories.find(c => c.id === activeTab)?.name} {editId ? 'を修正' : 'に追加'}</h3>
                      <p className="text-[10px] font-black uppercase tracking-widest text-primary-500 mt-0.5">Knowledge {editId ? 'Refinement' : 'Injection'}</p>
                   </div>
                </div>
                
                <form onSubmit={handleSave} className="space-y-6">
                  {getFullFields().map((field, index) => (
                    <div key={field.key} className="space-y-2">
                      {field.type === 'checkbox' ? (
                        <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-gray-100 dark:border-gray-800">
                           <input 
                            type="checkbox" 
                            id={`field-${field.key}`}
                            checked={formData[field.key] || false}
                            onChange={(e) => setFormData({...formData, [field.key]: e.target.checked})}
                            className="w-5 h-5 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                           />
                           <label htmlFor={`field-${field.key}`} className="text-xs font-black text-gray-700 dark:text-gray-300 uppercase tracking-widest cursor-pointer">
                             {field.label}
                           </label>
                        </div>
                      ) : (
                        <>
                          <label className="text-xs font-black text-gray-500 uppercase tracking-widest ml-1">{field.label}</label>
                          {field.type === 'textarea' ? (
                            <Textarea 
                              rows={5}
                              placeholder={field.placeholder}
                              value={formData[field.key] || ''}
                              onChange={(e) => setFormData({...formData, [field.key]: e.target.value})}
                              required={index === 0}
                              className="text-base font-bold"
                            />
                          ) : (
                            <Input 
                              type={field.type}
                              placeholder={field.placeholder}
                              value={formData[field.key] || ''}
                              onChange={(e) => setFormData({...formData, [field.key]: e.target.value})}
                              required={index === 0}
                              className="h-12 text-base font-bold"
                            />
                          )}
                        </>
                      )}
                    </div>
                  ))}
                  
                  <div className="flex justify-end gap-3 pt-8 border-t border-gray-100 dark:border-gray-800 mt-8">
                    <Button variant="ghost" type="button" onClick={() => setShowModal(false)} className="h-12 px-6">キャンセル</Button>
                    <Button variant="primary" type="submit" isLoading={isLoadingSave} className="h-12 px-8 font-black">
                       知識を保存・ベクトル化
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
        title="データの削除"
        message="このナレッジデータを完全に削除してもよろしいですか？（この操作は取り消せません）"
        confirmText="削除する"
        variant="danger"
        isLoading={isDeleting}
      />
    </div>
  );
}
