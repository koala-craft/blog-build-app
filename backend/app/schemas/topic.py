from typing import List, Optional
from pydantic import BaseModel, conlist
from .common import BaseResponseModel

class TopicCandidateOutput(BaseModel):
    topic_title: str

class TopicGenerationLLMOutput(BaseModel):
    topics: list[TopicCandidateOutput]

class TopicResponseData(BaseModel):
    id: str
    topic_title: str
    status: str
    priority: int
    created_at: Optional[str] = None

class TopicListResponse(BaseResponseModel):
    data: List[TopicResponseData]
    
class GenerateTopicRequest(BaseModel):
    theme_id: Optional[str] = None
    custom_theme: Optional[str] = None  # 直接入力のカスタムテーマ（theme_idより優先）

class GenerateTopicsResponse(BaseResponseModel):
    data: dict # {"generated_count": 3}
