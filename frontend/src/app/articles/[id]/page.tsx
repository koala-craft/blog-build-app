'use client';

import { useParams, useRouter } from 'next/navigation';
import useSWR, { mutate } from 'swr';
import { fetcher, api } from '@/lib/api';
import {
  FileText, ArrowLeft, Copy, Check, Calendar, Star, MessageCircle, Loader2, Edit3, Save, X, Sparkles
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';

export default function ArticleDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [copied, setCopied] = useState(false);

  const { data, error, isLoading } = useSWR(`/api/articles/${id}`, fetcher);
  const article = data?.data;

  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isRefining, setIsRefining] = useState(false);

  // 初回読み込み時、またはデータ更新時に編集用ステートを同期
  useEffect(() => {
    if (article?.content) {
      setEditContent(article.content);
    }
  }, [article?.content]);

  const handleCopy = async () => {
    if (!article?.content) return;
    await navigator.clipboard.writeText(article.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await api.patch(`/api/articles/${id}`, { content: editContent });
      mutate(`/api/articles/${id}`);
      setIsEditing(false);
    } catch (err) {
      alert('保存に失敗しました');
    } finally {
      setIsSaving(false);
    }
  };

  const handleRefine = async () => {
    setIsRefining(true);
    try {
      const res = await api.post(`/api/articles/${id}/refine-init`);
      // リファイン画面（ストリーム画面）へ遷移
      router.push(`/articles/stream/${res.data.topic_id}`);
    } catch (err) {
      console.error(err);
      alert('磨き上げセッションの開始に失敗しました');
    } finally {
      setIsRefining(false);
    }
  };

  return (
    <div className="animate-fade-in space-y-8 pb-20 max-w-[860px] mx-auto p-4 md:p-0">

      {/* --- HEADER --- */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-3">
          <button
            onClick={() => router.push('/articles')}
            className="flex items-center gap-2 text-xs font-black text-gray-400 hover:text-primary-500 transition-colors uppercase tracking-widest"
          >
            <ArrowLeft size={14} /> 記事一覧に戻る
          </button>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300 rounded text-[10px] font-black uppercase tracking-widest border border-primary-200 dark:border-primary-800 flex items-center gap-1.5">
              <FileText size={12} />
              Article Viewer
            </span>
          </div>
           <h1 className="text-3xl font-black tracking-tight text-gray-900 dark:text-white leading-tight">
            {isLoading ? '読み込み中...' : article?.topic_title || '記事詳細'}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          {!isEditing ? (
            <>
              <Button
                onClick={handleRefine}
                isLoading={isRefining}
                variant="secondary"
                className="h-10 px-4 text-xs font-black shadow-lg shadow-secondary-500/20"
              >
                <Sparkles size={14} className="mr-1.5" />
                AIで磨き上げる
              </Button>
              <Button
                onClick={() => setIsEditing(true)}
                variant="outline"
                className="h-10 px-4 text-xs font-black border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900"
              >
                <Edit3 size={14} className="mr-1.5" />
                編集
              </Button>
              <Button
                onClick={handleCopy}
                variant="ghost"
                className="shrink-0 h-10 px-4 text-xs font-black border border-gray-100 dark:border-gray-800"
                disabled={!article?.content}
              >
                {copied ? <Check size={14} className="mr-1.5 text-green-500" /> : <Copy size={14} className="mr-1.5" />}
                {copied ? 'コピー済み' : 'コピー'}
              </Button>
            </>
          ) : (
            <>
              <Button
                onClick={handleSave}
                isLoading={isSaving}
                className="h-10 px-4 text-xs font-black bg-primary-600 hover:bg-primary-700 shadow-lg shadow-primary-500/20"
              >
                <Save size={14} className="mr-1.5" />
                変更を保存
              </Button>
              <Button
                onClick={() => { setIsEditing(false); setEditContent(article?.content || ''); }}
                variant="ghost"
                className="h-10 px-4 text-xs font-black text-gray-400"
              >
                <X size={14} className="mr-1.5" />
                キャンセル
              </Button>
            </>
          )}
        </div>
      </div>

      {/* --- META --- */}
      {article && (
        <div className="flex flex-wrap items-center gap-4 text-xs font-bold text-gray-400">
          {article.created_at && (
            <span className="flex items-center gap-1.5">
              <Calendar size={12} />
              {new Date(article.created_at).toLocaleString('ja-JP', {
                year: 'numeric', month: 'short', day: 'numeric',
                hour: '2-digit', minute: '2-digit'
              })}
            </span>
          )}
          <span className="flex items-center gap-1.5">
            <Star size={12} /> {article.likes_count ?? 0} いいね
          </span>
          <span className="flex items-center gap-1.5">
            <MessageCircle size={12} /> {article.comments_count ?? 0} コメント
          </span>
          <span className={`px-2 py-0.5 rounded uppercase tracking-wider text-[10px] font-black border ${
            article.status === 'published'
              ? 'bg-green-50 text-green-600 border-green-100 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800'
              : 'bg-gray-100 text-gray-500 border-gray-200 dark:bg-gray-800 dark:border-gray-700'
          }`}>
            {article.status}
          </span>
        </div>
      )}

      {/* --- CONTENT --- */}
      {isLoading ? (
        <div className="bento-card p-24 flex flex-col items-center justify-center space-y-4">
          <Loader2 size={36} className="animate-spin text-primary-500" />
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Loading Article...</p>
        </div>
      ) : error ? (
        <div className="bento-card p-16 text-center">
          <p className="font-black text-red-500">記事の取得に失敗しました</p>
        </div>
      ) : article ? (
        <div className="bento-card p-8">
          {isEditing ? (
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="w-full h-[60vh] p-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-black/20 text-gray-800 dark:text-gray-200 font-medium text-[15px] focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all resize-none"
              placeholder="記事の内容を編集してください..."
            />
          ) : (
            <>
              {/* 有料記事の区切りをスタイリング */}
              {article.content.includes('[ここからは有料記事]') ? (
                <>
                  {article.content.split('[ここからは有料記事]').map((part: string, i: number) => (
                    <div key={i}>
                      <div
                        className="prose prose-gray dark:prose-invert max-w-none text-gray-800 dark:text-gray-200 leading-relaxed whitespace-pre-wrap font-medium text-[15px]"
                        dangerouslySetInnerHTML={{ __html: part.replace(/\n/g, '<br />') }}
                      />
                      {i === 0 && (
                        <div className="my-8 flex items-center gap-4">
                          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-amber-400 to-transparent" />
                          <span className="px-4 py-2 bg-amber-50 dark:bg-amber-900/30 border border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-300 text-sm font-black rounded-xl whitespace-nowrap">
                            🔒 ここからは有料記事
                          </span>
                          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-amber-400 to-transparent" />
                        </div>
                      )}
                    </div>
                  ))}
                </>
              ) : (
                <div
                  className="prose prose-gray dark:prose-invert max-w-none text-gray-800 dark:text-gray-200 leading-relaxed whitespace-pre-wrap font-medium text-[15px]"
                  dangerouslySetInnerHTML={{ __html: article.content.replace(/\n/g, '<br />') }}
                />
              )}
            </>
          )}
        </div>
      ) : null}

    </div>
  );
}
