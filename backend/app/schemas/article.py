from pydantic import BaseModel, UUID4
from typing import Optional, List
from .common import BaseResponseModel

class ArticleFeedbackUpdate(BaseModel):
    likes_count: Optional[int] = None
    comments_count: Optional[int] = None
    is_published: Optional[bool] = None

class ArticleResponseData(BaseModel):
    id: str
    topic_id: str
    content: str
    status: str
    likes_count: int
    comments_count: int
    total_score: float

class ArticleListResponse(BaseResponseModel):
    data: List[ArticleResponseData]

class ArticleItemResponse(BaseResponseModel):
    data: ArticleResponseData
