from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from collections import defaultdict

from ..database import get_db
from ..models.content import Article
from ..schemas.common import BaseResponseModel

router = APIRouter()

class AnalysisResponse(BaseResponseModel):
    data: dict

@router.get("/", response_model=AnalysisResponse)
def get_knowledge_analysis(db: Session = Depends(get_db)):
    """
    どのナレッジ（ID）が生成記事の高評価（スコア）に貢献しているかを分析・集計する。
    本番環境ではPostgreSQLの `unnest` を使用すべきですが、今回は簡易的にPython側で集計します。
    """
    articles = db.query(Article).filter(Article.total_score > 0).all()
    
    score_map = defaultdict(float)
    usage_map = defaultdict(int)
    
    for a in articles:
        if not a.used_knowledge_ids:
            continue
            
        for kid in a.used_knowledge_ids:
            if not kid: continue
            score_map[str(kid)] += a.total_score
            usage_map[str(kid)] += 1
            
    # 貢献度ランキング（スコア順に降順ソート）
    ranked_knowledge = sorted(
        [{"knowledge_id": k, "total_score": v, "usage_count": usage_map[k]} for k, v in score_map.items()],
        key=lambda x: x["total_score"],
        reverse=True
    )
    
    return AnalysisResponse(
        message="分析完了",
        data={
            "top_contributing_knowledge": ranked_knowledge[:10],
            "total_analyzed_articles": len(articles)
        }
    )
