from fastapi import APIRouter, HTTPException
from ..schemas.extract import ExtractRequest, ExtractResponse
from ..services.extractor import extract_knowledge_from_text

router = APIRouter()

@router.post("/", response_model=ExtractResponse)
async def extract_knowledge(req: ExtractRequest):
    """
    フリーテキストを受け取り、LLMを使用して「どの知識カテゴリに該当するか」を判断し、
    RAGテーブルへの登録用JSONフォーマットに変換して返す。
    ※この時点ではDB保存は行わず、フロントエンドでプレビュー/修正後に `/api/knowledge/{category}` を叩く想定。
    """
    if not req.raw_text or len(req.raw_text.strip()) < 10:
        raise HTTPException(status_code=400, detail="テキストが短すぎます。詳細を記述してください。")
        
    try:
        extracted_data = await extract_knowledge_from_text(req.raw_text, req.enabled_categories)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
    if not extracted_data or not isinstance(extracted_data, list):
        raise HTTPException(status_code=422, detail="LLMによる抽出結果が不正です。")
            
    return ExtractResponse(
        message="抽出成功",
        data=extracted_data
    )
