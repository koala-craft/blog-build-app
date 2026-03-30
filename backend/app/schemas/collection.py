from typing import List, Optional
from pydantic import BaseModel
from .common import BaseResponseModel

class RawArticle(BaseModel):
    title: str
    link: str
    published: str
    summary: str
    content: str
    
class AbstractWorryOutput(BaseModel):
    is_unresolved_worry: bool
    is_actionable: bool
    abstract_worry: Optional[str] = None
    reason: str

class CollectRequest(BaseModel):
    hashtag: str
    limit: int = 10

class WorrySeedInfo(BaseModel):
    abstracted_worry: str
    original_text: str

class CollectResponse(BaseResponseModel):
    data: dict # {"processed": 10, "saved": 3, "worry_seeds": [WorrySeedInfo]}
