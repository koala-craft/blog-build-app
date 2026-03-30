from typing import Any, Dict, List
from pydantic import BaseModel, Field
from .common import BaseResponseModel

class ExtractRequest(BaseModel):
    raw_text: str = Field(..., description="抽出元となる書籍やメモのテキスト素材")
    enabled_categories: List[str] = Field(default=["persona", "action", "mindfulness", "reframing", "copywriting", "format"], description="抽出対象とするカテゴリのリスト")

class ExtractResponse(BaseResponseModel):
    data: List[Dict[str, Any]] = Field(..., description="カテゴリごとの抽出結果JSONのリスト")
