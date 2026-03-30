'use client';

import { Card } from '@/components/ui/Card';
import { 
  Search, 
  Sparkles, 
  Database, 
  Zap, 
  FileText, 
  TrendingUp,
  ArrowRight,
  ShieldCheck,
  Activity,
  Info,
  Layers,
  CheckCircle,
  Play,
  Send,
  MousePointer2,
  Workflow,
  Target
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';

export default function GuidePage() {
  const manualSections = [
    {
      title: "01. 収集 (Data Ingestion)",
      role: "世の中の『悩み』をデータ化し、コンテンツの種を蒔く場所です。",
      operation: "note のハッシュタグ（例：『悩み』『エンジニア 転職』等）を入力し、取得件数を指定して「収集を開始」をクリックします。",
      result: "RSSから記事を取得し、AIが「個人の特定を避けた悩み」のみを抽出。データベース上の『悩みの種（Worry Seeds）』としてストックされます。進捗はリアルタイムで表示され、履歴は画面下部で確認可能です。",
      icon: Search,
      color: "text-blue-500",
      bg: "bg-blue-500/10",
      link: "/collect"
    },
    {
      title: "02. 抽出 (Manual Extraction)",
      role: "外部の優れた知恵を「構造分解」し、あなたの AI の糧にする場所です。",
      operation: "既存の人気占い記事や、参考になる心理学・コーチングの文章をコピペして「解析」を実行します。",
      result: "AIが文章を分析し、最適な知識カテゴリ（占術、マインドフルネス、コピー構成案など）に構造化してプレビューします。保存すると、データは自動でベクトル化され『知識DB』に蓄積されます。",
      icon: Sparkles,
      color: "text-purple-500",
      bg: "bg-purple-500/10",
      link: "/extract"
    },
    {
      title: "03. 蓄積 (Knowledge Management)",
      role: "AI 占い師の『記憶と言葉』を自ら管理・編集する司令塔です。",
      operation: "各カテゴリのタブを切り替えてデータの閲覧・検索・削除を行います。クイック検索で目的の知識を即座に探せます。",
      result: "蓄積されたナレッジは、記事生成時の Semantic Search（意味検索）の対象となります。ここを充実させることで、AIの回答に深みと独自の個性が生まれます。",
      icon: Database,
      color: "text-indigo-500",
      bg: "bg-indigo-500/10",
      link: "/knowledge"
    },
    {
      title: "04. 生成 (Synthesis & Writing)",
      role: "ストックした『悩み』と『知識』を錬金術のように掛け合わせ、記事を執筆します。",
      operation: "「新規トピックを生成」で記事のネタ（タイトル案）を作り、気に入ったものの「執筆開始」ボタンをクリックします。",
      result: "AIが入力された悩みに対して、知識DBから最適な回答パターンを検索。タイトルとお題を確定させた後、そのままブログ記事（note等）に最適な文章をリアルタイムで執筆します。",
      icon: Zap,
      color: "text-amber-500",
      bg: "bg-blue-500/10",
      link: "/generate"
    }
  ];

  return (
    <div className="animate-fade-in space-y-16 pb-24 max-w-[1200px] mx-auto p-4 md:p-0">
      
      {/* --- HEADER --- */}
      <div className="space-y-6 pt-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300 rounded border border-primary-200 dark:border-primary-800">
          <ShieldCheck size={14} />
          <span className="text-[10px] font-black uppercase tracking-[0.2em]">Operational Manual v3.5</span>
        </div>
        <h1 className="text-5xl font-black tracking-tighter text-gray-900 dark:text-white leading-tight">
          System <span className="text-gradient font-black">Operation Guide</span>
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl font-medium leading-relaxed">
          Aura Engine の各機能の役割、操作手順、およびその結果何が起こるのか。
          システムを使いこなし、自分専用の AI 占い師を構築するためのロードマップです。
        </p>
      </div>

      {/* --- WORKFLOW DIAGRAM --- */}
      <div className="bento-card border-none bg-primary-600 text-white shadow-2xl p-10 overflow-hidden relative">
        <div className="absolute right-0 top-0 opacity-10 -rotate-12 translate-x-20 translate-y-[-50px]">
           <Workflow size={400} />
        </div>
        
        <div className="relative z-10 space-y-12">
          <div className="flex items-center gap-3">
             <Target size={28} />
             <h2 className="text-2xl font-black uppercase tracking-tight">Main Logic Workflow</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="space-y-3 text-center md:text-left">
               <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center font-black text-xl mx-auto md:mx-0">1</div>
               <h3 className="font-black text-sm uppercase tracking-widest text-white/50">悩みを取得</h3>
               <p className="text-xs font-bold leading-relaxed px-4 md:px-0">RSSからリアルな課題（素材）を収集・ストックする。</p>
            </div>
            <div className="space-y-3 text-center md:text-left border-white/10 md:border-l pl-0 md:pl-8">
               <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center font-black text-xl mx-auto md:mx-0">2</div>
               <h3 className="font-black text-sm uppercase tracking-widest text-white/50">知恵を蓄積</h3>
               <p className="text-xs font-bold leading-relaxed px-4 md:px-0">書籍や名作コンテンツを分解し、AIの知能を強化する。</p>
            </div>
            <div className="space-y-3 text-center md:text-left border-white/10 md:border-l pl-0 md:pl-8">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center font-black text-xl mx-auto md:mx-0">3</div>
               <h3 className="font-black text-sm uppercase tracking-widest text-white/50">意味で検索</h3>
               <p className="text-xs font-bold leading-relaxed px-4 md:px-0">悩みに最も「効く」知恵を、ベクトル検索で瞬時に見つけ出す。</p>
            </div>
            <div className="space-y-3 text-center md:text-left border-white/10 md:border-l pl-0 md:pl-8">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center font-black text-xl mx-auto md:mx-0">4</div>
               <h3 className="font-black text-sm uppercase tracking-widest text-white/50">記事の執筆</h3>
               <p className="text-xs font-bold leading-relaxed px-4 md:px-0">抽出した知恵と悩みを合成し、独自の占い記事を出力する。</p>
            </div>
          </div>
        </div>
      </div>

      {/* --- DETAILED MODULES --- */}
      <div className="grid grid-cols-1 gap-12">
        {manualSections.map((section, idx) => (
          <div key={idx} className="bento-card overflow-hidden group hover:border-primary-500/50 transition-all duration-500">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-0">
              {/* Module Header/Icon */}
              <div className={`lg:col-span-1 flex items-start justify-center p-8 bg-gray-50 dark:bg-black/20 ${section.color}`}>
                <section.icon size={32} />
              </div>

              {/* Module Details */}
              <div className="lg:col-span-11 p-8 lg:p-10 space-y-8">
                <div>
                   <h3 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tight">{section.title}</h3>
                   <div className="h-1 w-20 bg-primary-500 mt-2" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                   <div className="space-y-3">
                      <div className="flex items-center gap-2 text-[10px] font-black uppercase text-gray-400 tracking-[0.2em]">
                         <Activity size={12} /> Role
                      </div>
                      <p className="text-sm font-bold text-gray-900 dark:text-white leading-relaxed">
                        {section.role}
                      </p>
                   </div>
                   
                   <div className="space-y-3 border-gray-100 dark:border-gray-800 md:border-l pl-0 md:pl-8">
                      <div className="flex items-center gap-2 text-[10px] font-black uppercase text-gray-400 tracking-[0.2em]">
                         <MousePointer2 size={12} /> Operation
                      </div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400 leading-relaxed">
                        {section.operation}
                      </p>
                   </div>

                   <div className="space-y-3 border-gray-100 dark:border-gray-800 md:border-l pl-0 md:pl-8">
                      <div className="flex items-center gap-2 text-[10px] font-black uppercase text-gray-400 tracking-[0.2em]">
                         <CheckCircle size={12} className="text-green-500" /> Result
                      </div>
                      <p className="text-xs font-bold text-gray-500 dark:text-gray-500 leading-relaxed">
                        {section.result}
                      </p>
                   </div>
                </div>

                <div className="flex justify-end pt-4 border-t border-gray-50 dark:border-gray-800">
                   <Link href={section.link}>
                     <Button variant="ghost" className="group font-black text-xs uppercase tracking-widest flex items-center gap-2 hover:text-primary-500">
                        Go to this Page
                        <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                     </Button>
                   </Link>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* --- FOOTER FAQ/ACTION --- */}
      <div className="bento-card p-12 text-center space-y-8 !bg-gray-50/50 dark:!bg-gray-900/50 border-dashed border-2">
         <div className="flex items-center justify-center gap-3">
            <Info className="text-primary-500" size={24} />
            <h2 className="text-xl font-black uppercase tracking-tighter">Any Questions?</h2>
         </div>
         <p className="text-sm text-gray-500 dark:text-gray-400 font-bold max-w-xl mx-auto leading-relaxed">
           システムの動作に不明点がある場合は、各画面にある「Info」アイコンの内容も参照してください。
           現在は note RSS に最適化されていますが、今後は X/Twitter やその他の API 連携も順次拡大予定です。
         </p>
         <div className="flex justify-center">
            <Link href="/">
               <Button className="h-14 px-10 font-black text-lg shadow-xl hover:shadow-primary-500/20">
                  Dashboard へ戻る
               </Button>
            </Link>
         </div>
      </div>
    </div>
  );
}
