from typing import Any, Dict, Optional
from pydantic import BaseModel, ConfigDict

class BaseResponseModel(BaseModel):
    """標準的なAPIレスポンスラッパー"""
    status: str = "success"
    message: Optional[str] = None
    data: Optional[Dict[str, Any] | list | BaseModel] = None
    
class ErrorResponseModel(BaseModel):
    """標準的なエラーレスポンス"""
    status: str = "error"
    message: str
    details: Optional[Any] = None

class PaginatedResponse(BaseModel):
    """ページネーション用のレスポンスベース"""
    status: str = "success"
    data: list
    total_count: int
    page: int
    size: int
