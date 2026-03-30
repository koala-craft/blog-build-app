from typing import Optional
from pydantic import BaseModel, UUID4
from .common import BaseResponseModel

# --- Base Schemas ---
class KnowledgeCreateBase(BaseModel):
    pass

class KnowledgeUpdateBase(BaseModel):
    pass

class KnowledgeResponseBase(BaseModel):
    id: UUID4

# --- Spiritual (霊的体験) ---
class SpiritualCreate(KnowledgeCreateBase):
    vision_text: Optional[str] = None
    aura_color: Optional[str] = None
    energy_color: Optional[str] = None
    energy_sensation: Optional[str] = None
    guardian_spirit: Optional[str] = None
    guardian_spirit_feature: Optional[str] = None
    past_life_context: Optional[str] = None
    atmosphere_vibe: Optional[str] = None
    spiritual_symbol: Optional[str] = None
    synchronicity_sign: Optional[str] = None
    spiritual_message: Optional[str] = None

class SpiritualUpdate(KnowledgeUpdateBase):
    vision_text: Optional[str] = None
    aura_color: Optional[str] = None
    energy_color: Optional[str] = None
    energy_sensation: Optional[str] = None
    guardian_spirit: Optional[str] = None
    guardian_spirit_feature: Optional[str] = None
    past_life_context: Optional[str] = None
    atmosphere_vibe: Optional[str] = None
    spiritual_symbol: Optional[str] = None
    synchronicity_sign: Optional[str] = None
    spiritual_message: Optional[str] = None

class SpiritualResponse(SpiritualCreate, KnowledgeResponseBase):
    pass

# --- Mindfulness ---
class MindfulnessCreate(KnowledgeCreateBase):
    philosophy_concept: str
    encouragement_text: str

class MindfulnessResponse(MindfulnessCreate, KnowledgeResponseBase):
    pass

# --- Persona ---
class PersonaCreate(KnowledgeCreateBase):
    trait_name: str
    trait_description: str
    is_active: bool = True
    priority_order: int = 0

class PersonaResponse(PersonaCreate, KnowledgeResponseBase):
    pass

# --- Empathy ---
class EmpathyCreate(KnowledgeCreateBase):
    abstract_situation: str
    empathy_approach: str
    warmth_level: int = 3

class EmpathyResponse(EmpathyCreate, KnowledgeResponseBase):
    pass

# --- Reframing ---
class ReframingCreate(KnowledgeCreateBase):
    negative_state: str
    positive_perspective: str

class ReframingResponse(ReframingCreate, KnowledgeResponseBase):
    pass

# --- Action ---
class ActionCreate(KnowledgeCreateBase):
    situation: str
    small_step_proposal: str

class ActionResponse(ActionCreate, KnowledgeResponseBase):
    pass

# --- Copywriting ---
class CopywritingCreate(KnowledgeCreateBase):
    structure_type: str
    suggested_text_pattern: str

class CopywritingResponse(CopywritingCreate, KnowledgeResponseBase):
    pass

# --- API Response Wrappers ---
class KnowledgeListResponse(BaseResponseModel):
    data: list

class KnowledgeItemResponse(BaseResponseModel):
    data: dict
