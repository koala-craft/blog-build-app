from typing import Any, Dict
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from uuid import UUID

from ..database import get_db
from ..models import knowledge as models
from ..schemas.knowledge import KnowledgeListResponse, KnowledgeItemResponse
from ..services.embedding import generate_embedding

router = APIRouter()

# 各カテゴリーのエンドポイントマッピングと対象テキスト（ベクトル化用）
CATEGORY_CONFIG = {
    "spiritual": {
        "model": models.KnowledgeSpiritual,
        "embed_field": "vision_text"
    },
    "mindfulness": {
        "model": models.KnowledgeMindfulness,
        "embed_field": "encouragement_text"
    },
    "persona": {
        "model": models.KnowledgePersona,
        "embed_field": "trait_description"
    },
    "empathy": {
        "model": models.KnowledgeEmpathy,
        "embed_field": "empathy_approach"
    },
    "reframing": {
        "model": models.KnowledgeReframing,
        "embed_field": "positive_perspective"
    },
    "action": {
        "model": models.KnowledgeAction,
        "embed_field": "small_step_proposal"
    },
    "copywriting": {
        "model": models.KnowledgeCopywriting,
        "embed_field": "suggested_text_pattern"
    },
    "format": {
        "model": models.KnowledgeFormat,
        "embed_field": "layout_example"
    },
    "expression": {
        "model": models.KnowledgeStyle,
        "embed_field": "rejection_reason"
    },
    "experience": {
        "model": models.KnowledgeExperience,
        "embed_field": "experience_summary"
    }
}

@router.get("/{category}", response_model=KnowledgeListResponse)
def list_knowledge(category: str, db: Session = Depends(get_db)):
    if category not in CATEGORY_CONFIG:
        raise HTTPException(status_code=404, detail="Category not found")
        
    Model = CATEGORY_CONFIG[category]["model"]
    items = db.query(Model).order_by(Model.created_at.desc()).all()
    
    # SQLAlchemy Modelをdictに変換（embeddingなどはフロントへ不要なら除外可能）
    results = []
    for item in items:
        data = {c.name: getattr(item, c.name) for c in item.__table__.columns if c.name != "embedding"}
        results.append(data)
        
    return KnowledgeListResponse(data=results, message="取得成功")

@router.post("/{category}", response_model=KnowledgeItemResponse)
async def create_knowledge(category: str, payload: Dict[str, Any], db: Session = Depends(get_db)):
    if category not in CATEGORY_CONFIG:
        raise HTTPException(status_code=404, detail="Category not found")
        
    config = CATEGORY_CONFIG[category]
    Model = config["model"]
    embed_field = config["embed_field"]
    
    # embeddingの生成が必要なカテゴリかチェック
    embedding_vector = None
    if embed_field and payload.get(embed_field):
        embedding_vector = await generate_embedding(payload[embed_field])
        if embedding_vector:
            payload["embedding"] = embedding_vector
            
    # LLMの出力に余計なフィールドが含まれている場合があるため、モデルのフィールドのみに制限する
    model_columns = {c.name for c in Model.__table__.columns}
    valid_payload = {k: v for k, v in payload.items() if k in model_columns}
    
    try:
        new_item = Model(**valid_payload)
        db.add(new_item)
        db.commit()
        db.refresh(new_item)
    except Exception as e:
        print(f"Error creating knowledge: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail="Internal Server Error")
    
    data = {c.name: getattr(new_item, c.name) for c in new_item.__table__.columns if c.name != "embedding"}
    return KnowledgeItemResponse(data=data, message="作成しました")

@router.put("/{category}/{id}", response_model=KnowledgeItemResponse)
async def update_knowledge(category: str, id: UUID, payload: Dict[str, Any], db: Session = Depends(get_db)):
    if category not in CATEGORY_CONFIG:
        raise HTTPException(status_code=404, detail="Category not found")
        
    config = CATEGORY_CONFIG[category]
    Model = config["model"]
    embed_field = config["embed_field"]
    
    item = db.query(Model).filter(Model.id == id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
        
    # embeddingの再生成が必要かチェック（対象フィールドが変更された場合）
    if embed_field and payload.get(embed_field) and payload[embed_field] != getattr(item, embed_field):
        embedding_vector = await generate_embedding(payload[embed_field])
        if embedding_vector:
            item.embedding = embedding_vector
            
    # フィールドの更新
    model_columns = {c.name for c in Model.__table__.columns if c.name not in ["id", "embedding", "created_at", "updated_at"]}
    for key, value in payload.items():
        if key in model_columns:
            setattr(item, key, value)
            
    try:
        db.commit()
        db.refresh(item)
    except Exception as e:
        print(f"Error updating knowledge: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail="Internal Server Error")
    
    data = {c.name: getattr(item, c.name) for c in item.__table__.columns if c.name != "embedding"}
    return KnowledgeItemResponse(data=data, message="更新しました")

@router.delete("/{category}/{id}", response_model=KnowledgeItemResponse)
def delete_knowledge(category: str, id: UUID, db: Session = Depends(get_db)):
    if category not in CATEGORY_CONFIG:
        raise HTTPException(status_code=404, detail="Category not found")
        
    Model = CATEGORY_CONFIG[category]["model"]
    item = db.query(Model).filter(Model.id == id).first()
    
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
        
    db.delete(item)
    db.commit()
    
    return KnowledgeItemResponse(data={"deleted_id": str(id)}, message="削除しました")
