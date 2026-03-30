from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from ..models import knowledge as models
from .embedding import generate_embedding

async def retrieve_relevant_knowledge(db: Session, query: str, top_k: int = 2, settings: Optional[Dict[str, bool]] = None) -> Dict[str, List[Dict[str, Any]]]:
    """
    クエリ（トピックのタイトル等）をベクトル化し、関連するナレッジをpgvectorで検索する。
    対象: Astrology, Mindfulness, Empathy, Reframing
    """
    query_vector = await generate_embedding(query)
    
    # helper for querying
    def search_table(Model, vector, limit=2):
        # is_ng=False (OK) のものだけを抽出
        results = db.query(Model)\
            .filter(Model.is_ng == False)\
            .order_by(Model.embedding.cosine_distance(vector))\
            .limit(limit)\
            .all()
        # embedding を除外してディクショナリ化
        return [{c.name: getattr(r, c.name) for c in r.__table__.columns if c.name != "embedding"} for r in results]

    return {
        "spiritual": search_table(models.KnowledgeSpiritual, query_vector, top_k) if not settings or settings.get("spiritual", True) else [],
        "mindfulness": search_table(models.KnowledgeMindfulness, query_vector, top_k) if not settings or settings.get("mindfulness", True) else [],
        "empathy": search_table(models.KnowledgeEmpathy, query_vector, top_k) if not settings or settings.get("empathy", True) else [],
        "reframing": search_table(models.KnowledgeReframing, query_vector, top_k) if not settings or settings.get("reframing", True) else [],
        "style": search_table(models.KnowledgeStyle, query_vector, top_k) if not settings or settings.get("style", True) else [],
        "experience": search_table(models.KnowledgeExperience, query_vector, top_k) if not settings or settings.get("experience", True) else []
    }

async def retrieve_guardrails(db: Session, query: Optional[str] = None) -> List[Dict[str, Any]]:
    """
    全カテゴリから is_ng=True の項目を取得。
    クエリがある場合はベクトル検索を行い、ない場合は最新のNG項目を取得する。
    """
    guardrails = []
    
    # 検索対象モデル
    ng_models = [
        models.KnowledgeSpiritual,
        models.KnowledgeMindfulness,
        models.KnowledgePersona,
        models.KnowledgeEmpathy,
        models.KnowledgeReframing,
        models.KnowledgeAction,
        models.KnowledgeCopywriting,
        models.KnowledgeFormat,
        models.KnowledgeStyle,
        models.KnowledgeExperience
    ]
    
    for Model in ng_models:
        # とりあえず各カテゴリから最新のNGを数件取得（あるいは全取得）
        # 量が多い場合はベクトル検索(query)に切り替えることも検討
        items = db.query(Model).filter(Model.is_ng == True).limit(5).all()
        for item in items:
            data = {c.name: getattr(item, c.name) for c in item.__table__.columns if c.name != "embedding"}
            data["category"] = Model.__tablename__.replace("knowledge_", "")
            guardrails.append(data)
            
    return guardrails

def get_active_persona(db: Session) -> Dict[str, Any]:
    """
    ペルソナ取得の優先順位:
    1. PersonaTemplate テーブルに is_active=True のものがあればそれを優先
    2. なければ KnowledgePersona から is_active=True で優先度の高いものを取得
    3. どちらもなければデフォルト値を返す
    """
    from ..models.content import PersonaTemplate
    
    # 1. まずペルソナテンプレートを確認
    active_template = db.query(PersonaTemplate)\
        .filter(PersonaTemplate.is_active == True)\
        .first()
    if active_template:
        return {
            "name": active_template.name,
            "description": active_template.system_prompt,  # prompt_builder が description を使うため
            "system_prompt": active_template.system_prompt,  # テンプレートとして識別するキー
            "knowledge_settings": active_template.knowledge_settings,
            "is_template": True
        }
    
    # 2. フォールバック: 学習済みペルソナナレッジを参照
    persona = db.query(models.KnowledgePersona)\
        .filter(models.KnowledgePersona.is_active == True)\
        .order_by(models.KnowledgePersona.priority_order.desc())\
        .first()
    if persona:
        return {"name": persona.trait_name, "description": persona.trait_description}
    
    # 3. デフォルト
    return {"name": "共感的なカウンセラー", "description": "ユーザーの痛みに寄り添い、優しく肯定する。"}

def get_active_theme(db: Session) -> Dict[str, Any]:
    """
    ブログテーマ取得の優先順位:
    1. KnowledgeTheme テーブルに is_active=True のものがあればそれを優先
    2. なければ最新の更新日付のテーマを取得
    3. どちらもなければデフォルト値を返す
    """
    # 1. 有効なテーマを検索
    theme = db.query(models.KnowledgeTheme)\
        .filter(models.KnowledgeTheme.is_active == True)\
        .first()
        
    # 2. なければ最新のものを取得
    if not theme:
        theme = db.query(models.KnowledgeTheme)\
            .order_by(models.KnowledgeTheme.updated_at.desc())\
            .first()
            
    if theme:
        return {"title": theme.theme_name, "structure": theme.theme_description}
    
    # 3. デフォルト
    return {"title": "心に響くエッセイ", "structure": "1.共感的な導入 -> 2.霊的体験に基づく気づき -> 3.前向きな結び"}
