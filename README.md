# Blog Build App

自己進化型コンテンツ生成エンジンの実験場です。社会人や家事と向き合う人を想定し、心理的安全性を重視した"体温のある"ライティングをAIで生成し、学習・収集を続けることで、時間とともに深い寄り添いを実現するアプリケーションです。

## 何が入ってる？
- **コンセプト重視の構成**：倫理的ガイドラインと温かさを両立する占い／カウンセリング風コンテンツを狙い、ダークパターンは排除されています（詳細は `docs/アプリ仕様書.md`）。
- **モダンな分離アーキテクチャ**：FastAPI 製の API（バックエンド）と Next.js 製の UI（フロントエンド）を完全分離。将来のベクトルDB拡張やマルチテナント化にも耐えられる構造です。
- **LLM + pgvector**：OpenAI／Anthropic API で知識抽出・記事生成を行いつつ、PostgreSQL + pgvector で知識ベースを保持し、分析・テンプレート管理や記事取得・解析まで網羅しています。
- **提供されている API**：`collect`, `topics`, `knowledge`, `extract`, `generate`, `articles`, `analysis`, `persona-templates`, `theme-templates` の各ルーターが揃い、収集→知識化→生成→分析のワークフローをエンドポイント単位で扱えます。

## 技術スタック
- **Backend**：FastAPI、SQLAlchemy（async）、Alembic、pgvector、Pydantic Settings、OpenAI/Anthropic SDK、httpx。
- **Frontend**：Next.js（app router + src ディレクトリ）、TypeScript、Tailwind CSS、SWR、react-markdown、lucide-react。
- **Database**：PostgreSQL（`pgvector/pgvector:pg16`）、`init-db/01-vector.sql` で pgvector 拡張を自動マウント。
- **補助**：Docker Compose で DB、`setup.py` で初期構成の自動生成、docs 配下で仕様・実装手順を管理。

## クイックスタート

### 0. 事前準備
1. Windows/Mac/Linux に Python 3.11+ をインストール（`python --version` で確認）。
2. Node.js 18+ を用意（`node --version`）。
3. Docker Desktop を動かしておく（`docker --version`）。

### 1. 初期構成の生成（1 回だけ）
```bash
python setup.py
```
これでバックエンド／フロントエンドのディレクトリ・設定ファイル・`init-db/01-vector.sql` などが揃います。

### 2. データベース起動
```bash
docker compose up -d
```
起動時に `init-db/01-vector.sql` が自動実行され、pgvector 拡張も有効化されます。

### 3. バックエンド（FastAPI）
```bash
cd backend
python -m venv .venv
.venv\\Scripts\\activate    # Windows
# source .venv/bin/activate  # macOS/Linux
pip install -r requirements.txt
```
`.env` を開いて `OPENAI_API_KEY` / `ANTHROPIC_API_KEY` を記入し、必要なら `COLLECT_MAX_ARTICLES` や `COLLECT_TOKEN_LIMIT` も調整。
```bash
uvicorn app.main:app --reload --port 8000
```
`http://localhost:8000/docs` で API ドキュメントを確認できます。

### 4. フロントエンド（Next.js）
フロントは `frontend/` に既存プロジェクトがあるので、通常は次の手順だけです。
```bash
cd frontend
pnpm install       # pnpm がなければ npm install -g pnpm 後に
pnpm run dev
```
`http://localhost:3000` で UI を確認。さらに詳しい操作は `frontend/README.md` を参照してください。

## 環境変数
| 変数 | 説明 |
| --- | --- |
| `DATABASE_URL` | PostgreSQL 接続先（例: `postgresql+psycopg2://ftuser:ftpassword@localhost:5432/fortunetelling`） |
| `OPENAI_API_KEY`, `ANTHROPIC_API_KEY` | LLM を呼ぶための API キー |
| `EXTRACTION_MODEL`, `GENERATION_MODEL` | 抽出・生成に使うモデル。既定は `gpt-4o-mini` / `claude-3-5-sonnet-20241022` |
| `COLLECT_MAX_ARTICLES`, `COLLECT_TOKEN_LIMIT` | ブログ収集の上限調整（件数・トークン） |

## よく使うコマンド
- `docker compose down` / `docker compose up -d`：PostgreSQL を再起動。
- `cd backend && pytest`（将来的なテスト追加用）。
- `cd backend && alembic upgrade head`：マイグレーション適用（`alembic.ini` あり）。
- `pnpm run lint` / `pnpm run build`：フロントの品質確認（`frontend/package.json` 内で定義）。

## 参考ドキュメント
- `docs/アプリ仕様書.md`：コンセプト、倫理ルール、API 設計、ディレクトリ構造などの詳細。
- `docs/実装仕様書.md`・`docs/実装ステップ.md`：バックエンド中心の実装方針とステップバイステップ。
- `docs/フロントエンド実装ステップ.md`：Next.js 側の実装ガイド。
- `docs/環境構築手順書.md`：このままの手順に沿った実行環境の組み立て。

## 補足＆次の一歩
- 「SQLAlchemy モデル実装」や「テンプレート設計」など、docs/内のセクションを順にたどると着手しやすいです。
- API の各ルーター（collect 〜 theme-template）は `backend/app/api` 内でまとまっているので、変更する際は `schemas` / `services` も同じく確認してください。
- フロント実装を進めるときは `frontend/src/app` を起点に、api 呼び出し先が `http://localhost:8000/api/...` に向いていることを意識してください。
