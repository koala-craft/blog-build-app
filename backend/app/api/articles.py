from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from uuid import UUID
from typing import Dict, Any

from ..database import get_db
from ..models.content import Article, BlogTopicCandidate, ArticleVersion
from ..schemas.article import ArticleListResponse, ArticleItemResponse, ArticleFeedbackUpdate, ArticleResponseData
from ..services.generator import stream_article_generation

router = APIRouter()

@router.get("/", response_model=ArticleListResponse)
def list_articles(db: Session = Depends(get_db), limit: int = 50, skip: int = 0):
    """
    生成済みの記事一覧を取得する（スコア順 又は 最新順）
    """
    articles = db.query(Article).order_by(Article.created_at.desc()).offset(skip).limit(limit).all()
    
    data = []
    for a in articles:
        data.append(ArticleResponseData(
            id=str(a.id),
            topic_id=str(a.topic_id) if a.topic_id else "",
            content=a.content[:200] + "..." if len(a.content) > 200 else a.content,
            status=a.status,
            likes_count=a.likes_count,
            comments_count=a.comments_count,
            total_score=a.total_score
        ))
    return ArticleListResponse(data=data, message="取得成功")

@router.get("/{id}")
def get_article(id: UUID, db: Session = Depends(get_db)):
    """
    指定IDの記事の全文を返す。
    """
    article = db.query(Article).filter(Article.id == id).first()
    if not article:
        raise HTTPException(status_code=404, detail="Article not found")

    # トピックタイトルも返す
    topic_title = ""
    if article.topic_id:
        from ..models.content import BlogTopicCandidate
        topic = db.query(BlogTopicCandidate).filter(BlogTopicCandidate.id == article.topic_id).first()
        if topic:
            topic_title = topic.topic_title

    return {
        "status": "success",
        "data": {
            "id": str(article.id),
            "topic_id": str(article.topic_id) if article.topic_id else "",
            "topic_title": topic_title,
            "content": article.content,
            "status": article.status,
            "likes_count": article.likes_count,
            "comments_count": article.comments_count,
            "total_score": article.total_score,
            "created_at": article.created_at.isoformat() if article.created_at else None,
        }
    }


@router.patch("/{id}")
def update_article(id: UUID, payload: Dict[str, Any], db: Session = Depends(get_db)):
    """
    記事の内容（本文やステータス）を更新する。
    """
    article = db.query(Article).filter(Article.id == id).first()
    if not article:
        raise HTTPException(status_code=404, detail="Article not found")
    
    if "content" in payload:
        article.content = payload["content"]
    if "status" in payload:
        article.status = payload["status"]
    
    db.commit()
    return {"status": "success", "message": "記事を更新しました"}


@router.patch("/{id}/feedback", response_model=ArticleItemResponse)
def update_feedback(id: UUID, payload: ArticleFeedbackUpdate, db: Session = Depends(get_db)):
    """
    SNS連携や手動入力による反響スコア（スキ、コメント数）を更新する。
    """
    article = db.query(Article).filter(Article.id == id).first()
    if not article:
        raise HTTPException(status_code=404, detail="Article not found")

    if payload.likes_count is not None:
        article.likes_count = payload.likes_count
    if payload.comments_count is not None:
        article.comments_count = payload.comments_count
    if payload.is_published is not None:
        article.status = "published" if payload.is_published else "draft"
        
    # スコア計算（例: いいねは1点、コメントは2点）
    article.total_score = float((article.likes_count * 1) + (article.comments_count * 2))
    
    db.commit()
    db.refresh(article)
    
    data = ArticleResponseData(
        id=str(article.id),
        topic_id=str(article.topic_id) if article.topic_id else "",
        content=article.content[:200] + "...",
        status=article.status,
        likes_count=article.likes_count,
        comments_count=article.comments_count,
        total_score=article.total_score
    )
    return ArticleItemResponse(data=data, message="フィードバックを反映しました")

@router.delete("/{id}")
def delete_article(id: UUID, db: Session = Depends(get_db)):
    """
    指定IDの記事を削除する。
    """
    article = db.query(Article).filter(Article.id == id).first()
    if not article:
        raise HTTPException(status_code=404, detail="Article not found")
    
    db.delete(article)
    db.commit()
    return {"status": "success", "message": "記事を削除しました"}

@router.get("/{id}/regenerate")
async def regenerate_article(id: UUID, db: Session = Depends(get_db)):
    """
    既存の生成記事のテーマ（トピック）を使用して再生成を行う。
    元の記事は論理削除（または上書き）され、新たにストリーミング生成を開始する。
    便宜上、元のArticleを削除し、同じtopic_idで再生成関数を呼び出します。
    """
    article = db.query(Article).filter(Article.id == id).first()
    if not article:
        raise HTTPException(status_code=404, detail="Article not found")

    topic_id = article.topic_id
    if not topic_id:
        raise HTTPException(status_code=400, detail="元のトピックが存在しません")
        
    topic = db.query(BlogTopicCandidate).filter(BlogTopicCandidate.id == topic_id).first()
    if topic:
        # トピックのステータスを一時的にrevert
        topic.status = "regenerating"
        
    # 元の記事データを削除する
    db.delete(article)
    db.commit()

    # StreamingResponseはgenerateのエンドポイントと同じ関数を再利用
    from .generate import sse_wrap
    headers = {
        "Cache-Control": "no-cache",
        "X-Accel-Buffering": "no",
    }
    return StreamingResponse(
        sse_wrap(stream_article_generation(db, str(topic_id))), 
        media_type="text/event-stream",
        headers=headers,
    )

@router.post("/{id}/refine-init")
def initialize_article_refinement(id: UUID, db: Session = Depends(get_db)):
    """
    保存済みの記事を元に、リファイン（磨き上げ）セッションを開始するための準備を行う。
    現在の記事内容を ArticleVersion の最初のバージョンとして登録し、topic_id を返す。
    """
    article = db.query(Article).filter(Article.id == id).first()
    if not article:
        raise HTTPException(status_code=404, detail="Article not found")
    
    if not article.topic_id:
        raise HTTPException(status_code=400, detail="Topic ID is missing for this article")

    # 既存の履歴をクリーンアップし、現在の記事をベースに Ver 1 を作成
    db.query(ArticleVersion).filter(ArticleVersion.topic_id == article.topic_id).delete()

    new_version = ArticleVersion(
        topic_id=article.topic_id,
        content=article.content,
        version_number=1
    )
    db.add(new_version)
    
    # トピックのステータスを更新
    topic = db.query(BlogTopicCandidate).filter(BlogTopicCandidate.id == article.topic_id).first()
    if topic:
        topic.status = "drafting"

    db.commit()
    return {
        "status": "success", 
        "topic_id": str(article.topic_id), 
        "version_id": str(new_version.id)
    }
