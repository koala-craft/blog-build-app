from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Dict, Any
from uuid import UUID

from ..database import get_db
from ..models.content import BlogTopicCandidate
from ..models.knowledge import KnowledgeTheme
from ..schemas.topic import TopicListResponse, GenerateTopicsResponse, TopicResponseData, GenerateTopicRequest
from ..services.topic_generator import get_unused_worry_seeds, generate_topics_from_seeds

router = APIRouter()

@router.get("/", response_model=TopicListResponse)
async def list_topics(db: Session = Depends(get_db)):
    """
    保存されている提案中(`suggested`)のトピック候補一覧を返す。
    優先順位（priority降順）と作成日時（created_at降順）でソート。
    """
    topics = db.query(BlogTopicCandidate)\
        .filter(BlogTopicCandidate.status == "suggested")\
        .order_by(BlogTopicCandidate.priority.desc(), BlogTopicCandidate.created_at.desc())\
        .limit(20)\
        .all()
        
    data = [
        TopicResponseData(
            id=str(t.id),
            topic_title=t.topic_title,
            status=t.status,
            priority=t.priority,
            created_at=t.created_at.isoformat() if t.created_at else None
        ) for t in topics
    ]
    return TopicListResponse(message="取得成功", data=data)

@router.patch("/{topic_id}")
async def update_topic(topic_id: UUID, payload: Dict[str, Any], db: Session = Depends(get_db)):
    """
    トピックタイトルを更新する。
    """
    topic = db.query(BlogTopicCandidate).filter(BlogTopicCandidate.id == topic_id).first()
    if not topic:
        raise HTTPException(status_code=404, detail="トピックが見つかりません")
    title = (payload.get("topic_title") or "").strip()
    if not title:
        raise HTTPException(status_code=400, detail="topic_title は必須です")
    topic.topic_title = title
    db.commit()
    return {"status": "success", "message": f"「{title}」に更新しました"}


@router.post("/manual")
async def create_manual_topic(payload: Dict[str, Any], db: Session = Depends(get_db)):
    """
    ユーザーが直接入力したタイトルをトピック候補としてDBに保存する。
    """
    from typing import Dict, Any
    title = (payload.get("topic_title") or "").strip()
    if not title:
        raise HTTPException(status_code=400, detail="topic_title は必須です")

    new_topic = BlogTopicCandidate(
        topic_title=title,
        source_data_ids=[],
        status="suggested"
    )
    db.add(new_topic)
    db.commit()
    db.refresh(new_topic)

    return {"status": "success", "message": f"「{title}」を追加しました", "id": str(new_topic.id)}


@router.post("/generate", response_model=GenerateTopicsResponse)
async def generate_new_topics(request: GenerateTopicRequest = None, db: Session = Depends(get_db)):
    """
    worry_seeds から未使用の悩みデータを抽出し、LLMで新しいトピックタイトルを生成してDBへ保存するエンドポイント。
    """
    theme_description = None
    
    # カスタムテーマが直接入力された場合は最優先で使用する
    if request and request.custom_theme and request.custom_theme.strip():
        theme_description = request.custom_theme.strip()
    elif request and request.theme_id:
        theme = db.query(KnowledgeTheme).filter(KnowledgeTheme.id == request.theme_id).first()
        if theme:
            theme_description = theme.theme_description
    
    # どちらも指定がなければ「現在有効なテーマ」をデフォルトとして使用
    if not theme_description:
        from ..services.retriever import get_active_theme
        active_theme = get_active_theme(db)
        theme_description = active_theme.get("structure")

    seeds = get_unused_worry_seeds(db, limit=5)
    
    generated_count = await generate_topics_from_seeds(db, seeds, theme_description)
    return GenerateTopicsResponse(
        message="トピック候補の自動生成が完了しました。",
        data={"generated_count": generated_count}
    )
