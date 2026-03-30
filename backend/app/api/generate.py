from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from uuid import UUID
from pydantic import BaseModel

class FinalizeRequest(BaseModel):
    version_id: UUID

class ManualVersionRequest(BaseModel):
    content: str

from ..database import get_db
from ..services.generator import stream_article_generation, stream_article_refinement, REFINEMENT_PROMPTS
from ..models.content import ArticleVersion, BlogTopicCandidate, Article, PersonaTemplate

router = APIRouter()

async def sse_wrap(generator):
    """
    ジェネレーターのテキストチャンクを SSE 形式 (data: ...\n\n) に変換するラッパー。
    ブラウザの EventSource はこの形式だけを解釈できる。
    """
    async for chunk in generator:
        # 改行をエスケープして SSE プロトコルの data: ... 形式で送信
        escaped = chunk.replace('\n', '\\n')
        yield f"data: {escaped}\n\n"


@router.get("/{topic_id}/stream")
async def generate_article_stream(topic_id: UUID, target_chars: int = 1500, is_paid: bool = False, db: Session = Depends(get_db)):
    """
    指定されたトピックIDから関連ナレッジ(RAG)を検索し、ペルソナ・コピーライティング設定に基づき
    LLMからブログ記事本文をストリーミング（SSE）で生成する。完了時にDBに自動保存される。
    """
    print(f"[Backend] Initial Stream Start: topic_id={topic_id}, is_paid={is_paid} (type={type(is_paid)})")
    headers = {
        "Cache-Control": "no-cache",
        "X-Accel-Buffering": "no",   # nginxバッファリングを無効化
    }
    topic = db.query(BlogTopicCandidate).filter(BlogTopicCandidate.id == topic_id).first()
    if not topic:
        raise HTTPException(status_code=404, detail="Topic not found")

    return StreamingResponse(
        sse_wrap(stream_article_generation(db, str(topic_id), target_chars=target_chars, is_paid=is_paid)),
        media_type="text/event-stream",
        headers=headers,
    )

@router.get("/{topic_id}/versions")
async def get_topic_versions(topic_id: UUID, db: Session = Depends(get_db)):
    """
    指定トピックの履歴一覧を取得。
    """
    versions = db.query(ArticleVersion).filter(ArticleVersion.topic_id == topic_id).order_by(ArticleVersion.version_number.desc()).all()
    return {"status": "success", "data": versions}

@router.get("/versions/{version_id}")
async def get_version_detail(version_id: UUID, db: Session = Depends(get_db)):
    """
    特定の履歴の内容を取得。
    """
    version = db.query(ArticleVersion).filter(ArticleVersion.id == version_id).first()
    if not version:
        raise HTTPException(status_code=404, detail="Version not found")
    return {"status": "success", "data": version}

@router.get("/{topic_id}/refine/stream")
async def refine_article_stream(topic_id: UUID, version_id: UUID, refinement_type: str, db: Session = Depends(get_db)):
    """
    指定トピック・バージョンの記事に対してブラッシュアップ指示（リファイン）を行い、
    生成結果をストリーミング。完了時に自動的に新バージョンとしてDB保存される。
    """
    print(f"[Backend] Refine Stream Start: topic_id={topic_id}, version_id={version_id}, type={refinement_type}")
    headers = {
        "Cache-Control": "no-cache",
        "X-Accel-Buffering": "no",
    }
    topic = db.query(BlogTopicCandidate).filter(BlogTopicCandidate.id == topic_id).first()
    version = db.query(ArticleVersion).filter(ArticleVersion.id == version_id).first()
    if not topic or not version:
        print(f"[Backend] Refine Error: Topic or Version not found. topic={topic}, version={version}")
        raise HTTPException(status_code=404, detail="Topic or Version not found")

    return StreamingResponse(
        sse_wrap(stream_article_refinement(db, str(topic_id), str(version_id), refinement_type)),
        media_type="text/event-stream",
        headers=headers,
    )

@router.post("/{topic_id}/finalize")
async def finalize_article(topic_id: UUID, req: FinalizeRequest, db: Session = Depends(get_db)):
    """
    特定のバージョンを完成（正式な記事）として『articles』テーブルに保存し、
    そのトピックに紐づくその他の中間履歴（article_versions）を消去する。
    """
    version_id = req.version_id
    version = db.query(ArticleVersion).filter(ArticleVersion.id == version_id).first()
    if not version:
        raise HTTPException(status_code=404, detail="Version not found")
    
    topic = db.query(BlogTopicCandidate).filter(BlogTopicCandidate.id == topic_id).first()
    if not topic:
        raise HTTPException(status_code=404, detail="Topic not found")
    
    # 既存の記事があるか確認
    article = db.query(Article).filter(Article.topic_id == topic_id).first()
    if article:
        article.content = version.content
    else:
        # 正式な記事として新規作成
        article = Article(
            title=topic.topic_title,
            content=version.content,
            topic_id=topic.id,
            status="draft" # 初心者向けにまずは下書き保存
        )
        db.add(article)
    
    # 履歴をクリア
    db.query(ArticleVersion).filter(ArticleVersion.topic_id == topic_id).delete()
    
    topic.status = "published"
    
    db.commit()
    return {"status": "success", "article_id": str(article.id)}

@router.post("/{topic_id}/versions")
async def create_manual_version(topic_id: UUID, req: ManualVersionRequest, db: Session = Depends(get_db)):
    """
    手動編集された内容を新しいバージョンとして保存する。
    """
    new_version = ArticleVersion(
        topic_id=topic_id,
        content=req.content,
        refinement_prompt="直接編集（手動）"
    )
    db.add(new_version)
    db.commit()
    db.refresh(new_version)
    return {"status": "success", "version_id": str(new_version.id)}

@router.post("/{topic_id}/reset")
async def reset_topic_versions(topic_id: UUID, db: Session = Depends(get_db)):
    """
    トピックの履歴を全て削除し、最初からやり直せる状態にする。
    """
    db.query(ArticleVersion).filter(ArticleVersion.topic_id == topic_id).delete()
    topic = db.query(BlogTopicCandidate).filter(BlogTopicCandidate.id == topic_id).first()
    if topic:
        topic.status = "pending"
    db.commit()
    return {"status": "success"}

@router.get("/config/refinement-patterns")
async def get_refinement_patterns():
    """
    利用可能な磨き上げパターンの一覧を取得。
    """
    return {"status": "success", "data": REFINEMENT_PROMPTS}
