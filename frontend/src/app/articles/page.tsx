'use client';

import { useState } from 'react';
import useSWR, { mutate } from 'swr';
import { fetcher, api } from '@/lib/api';
import { Card } from '@/components/ui/Card';
import { Table, Th, Td } from '@/components/ui/Table';
import { Button } from '@/components/ui/Button';
import { PenTool, Heart, MessageCircle, RefreshCw, ExternalLink, Activity, Info, TrendingUp, BarChart3, Layers, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ConfirmModal } from '@/components/ui/ConfirmModal';

export default function ArticlesListPage() {
  const router = useRouter();
  const { data, error, isLoading } = useSWR('/api/articles/', fetcher);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [regenerateId, setRegenerateId] = useState<string | null>(null);

  const handleUpdateFeedback = async (id: string, currentLikes: number, currentComments: number) => {
    const likes = prompt('新しい「スキ」の数を入力してください', currentLikes.toString());
    const comments = prompt('新しい「コメント」の数を入力してください', currentComments.toString());
    
    if (likes === null || comments === null) return;

    setUpdatingId(id);
    try {
      await api.patch(`/api/articles/${id}/feedback`, {
        likes_count: parseInt(likes),
        comments_count: parseInt(comments)
      });
      mutate('/api/articles/');
      mutate('/api/analysis/'); // ダッシュボードの集計も更新
    } catch (err) {
      alert('フィードバックの更新に失敗しました');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleConfirmRegenerate = () => {
    if (regenerateId) {
      router.push(`/articles/stream/regenerate?source_id=${regenerateId}`);
      setRegenerateId(null);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteId) return;
    setUpdatingId(deleteId);
    try {
      await api.delete(`/api/articles/${deleteId}`);
      mutate('/api/articles/');
      mutate('/api/analysis/');
      setDeleteId(null);
    } catch (err) {
      alert('記事の削除に失敗しました');
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="animate-fade-in space-y-10 pb-20 max-w-[1200px] mx-auto p-4 md:p-0">
      
      {/* --- HEADER --- */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300 rounded text-[10px] font-black uppercase tracking-widest border border-primary-200 dark:border-primary-800 flex items-center gap-1.5">
              <PenTool size={12} />
              Content Management
            </span>
          </div>
          <h1 className="text-4xl font-black tracking-tight text-gray-900 dark:text-white leading-tight">
            Article <span className="text-gradient">Library</span>
          </h1>
          <p className="text-base text-gray-600 dark:text-gray-400 max-w-2xl font-medium leading-relaxed">
            生成されたブログ記事のアーカイブです。SNS等の「スキ」や「コメント」をフィードバックすることで、AIエンジンはより評価の高い記事を書けるよう学習（RAG重み付け）を続けます。
          </p>
        </div>
        
        <div className="flex items-center gap-4">
           <div className="glass px-6 py-3 rounded-2xl flex items-center gap-3 border border-gray-100 dark:border-gray-800 shadow-sm">
              <TrendingUp className="text-green-500" size={20} />
              <div>
                 <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Total Score</p>
                 <p className="text-xl font-black text-gray-900 dark:text-white leading-none">
                    {data?.data?.reduce((acc: number, curr: any) => acc + curr.total_score, 0) || 0}
                 </p>
              </div>
           </div>
        </div>
      </div>

      {/* --- ARTICLE LIST --- */}
      <div className="bento-card !p-0 overflow-hidden shadow-2xl">
        <div className="bento-header justify-between p-6 bg-white dark:bg-gray-900/40 border-b border-gray-100 dark:border-gray-800">
           <div className="flex items-center gap-3">
              <BarChart3 className="text-primary-500" size={24} />
              <h2 className="text-xl font-black tracking-tight text-gray-900 dark:text-white">Generated Content</h2>
              <span className="bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded text-[10px] font-black text-gray-500 uppercase tracking-widest border border-gray-200 dark:border-gray-700">
                {data?.data?.length || 0} Articles
              </span>
           </div>
        </div>

        {isLoading ? (
          <div className="p-24 flex flex-col items-center justify-center space-y-4">
             <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-500/20 border-t-primary-500"></div>
             <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Opening Library...</p>
          </div>
        ) : error ? (
          <div className="p-24 text-center">
             <Activity className="mx-auto mb-4 text-red-500" size={48} />
             <p className="text-lg font-black text-gray-900 dark:text-white">Failed to Load Articles</p>
             <p className="text-sm text-gray-500 mt-1">記事データの取得に失敗しました。</p>
          </div>
        ) : (
          <Table className="border-none">
            <thead>
              <tr className="bg-gray-50/50 dark:bg-black/10">
                <Th className="pl-6 py-4">Status</Th>
                <Th className="py-4">Article Content Preview</Th>
                <Th className="py-4">Engagement &amp; Score</Th>
                <Th className="pr-6 py-4 text-right">Actions</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
              {data?.data?.map((article: any) => (
                <tr key={article.id} className="group hover:bg-primary-500/[0.02] transition-colors">
                  <Td className="pl-6 py-6">
                    <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border ${
                      article.status === 'published' 
                        ? 'bg-green-50 text-green-700 border-green-100 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800' 
                        : 'bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700'
                    }`}>
                      {article.status}
                    </span>
                  </Td>
                  <Td className="py-6">
                    <div className="max-w-md">
                      <p className="text-base text-gray-800 dark:text-gray-200 line-clamp-2 font-medium leading-relaxed group-hover:text-gray-900 dark:group-hover:text-white transition-colors">
                        {article.content}
                      </p>
                    </div>
                  </Td>
                  <Td className="py-6">
                    <div className="flex items-center gap-6">
                      <div className="flex flex-col">
                         <div className="flex items-center gap-1.5 text-pink-500 font-black mb-1">
                           <Heart size={14} fill={article.likes_count > 0 ? "currentColor" : "none"} />
                           <span className="text-sm">{article.likes_count}</span>
                         </div>
                         <div className="flex items-center gap-1.5 text-blue-500 font-black">
                           <MessageCircle size={14} fill={article.comments_count > 0 ? "currentColor" : "none"} />
                           <span className="text-sm">{article.comments_count}</span>
                         </div>
                      </div>
                      <div className="h-10 w-[1px] bg-gray-100 dark:bg-gray-800" />
                      <div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">AI Evaluation</p>
                        <p className="text-lg font-black text-gray-900 dark:text-white leading-none">{article.total_score}</p>
                      </div>
                    </div>
                  </Td>
                  <Td className="pr-6 py-6 text-right">
                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleUpdateFeedback(article.id, article.likes_count, article.comments_count)}
                        isLoading={updatingId === article.id}
                        className="h-10 w-10 p-0 hover:bg-pink-50 dark:hover:bg-pink-900/10 text-pink-600 rounded-xl border border-transparent hover:border-pink-100 dark:hover:border-pink-900"
                        title="Update Feedback"
                      >
                        <Heart size={18} fill={article.likes_count > 0 ? "currentColor" : "none"} />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => setRegenerateId(article.id)}
                        className="h-10 w-10 p-0 hover:bg-primary-50 dark:hover:bg-primary-900/10 text-primary-600 rounded-xl border border-transparent hover:border-primary-100 dark:hover:border-primary-900"
                        title="Regenerate from this seed"
                      >
                        <RefreshCw size={18} />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => setDeleteId(article.id)}
                        isLoading={updatingId === article.id}
                        className="h-10 w-10 p-0 hover:bg-red-50 dark:hover:bg-red-900/10 text-red-600 rounded-xl border border-transparent hover:border-red-100 dark:hover:border-red-900"
                        title="Delete Article"
                      >
                        <Trash2 size={18} />
                      </Button>
                      <Link href={`/articles/${article.id}`}>
                        <Button variant="outline" size="sm" className="h-10 px-4 flex items-center gap-2 font-black text-xs uppercase tracking-widest transition-all hover:translate-y-[-2px] shadow-sm">
                           <ExternalLink size={14} />記事を見る
                        </Button>
                      </Link>
                    </div>
                  </Td>
                </tr>
              ))}
              {(!data?.data || data.data.length === 0) && (
                <tr>
                  <Td colSpan={4} className="text-center py-32">
                    <div className="flex flex-col items-center opacity-20">
                       <Layers size={64} className="mb-4" />
                       <p className="text-sm font-black uppercase tracking-[0.3em]">No Articles Published</p>
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
                Daily synthesis completes at midnight UTC. All scores normalized.
              </p>
            </div>
        </div>
      </div>

      <ConfirmModal
        isOpen={!!regenerateId}
        onClose={() => setRegenerateId(null)}
        onConfirm={handleConfirmRegenerate}
        title="記事の再生成"
        message="この記事を削除し、同じテーマで新しく書き直しますか？（この操作は取り消せません）"
        confirmText="再生成を開始"
        variant="warning"
      />

      <ConfirmModal
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleConfirmDelete}
        title="記事の削除"
        message="この記事を完全に削除してもよろしいですか？この操作は取り消せません。"
        confirmText="削除する"
        variant="danger"
        isLoading={updatingId === deleteId}
      />
    </div>
  );
}
