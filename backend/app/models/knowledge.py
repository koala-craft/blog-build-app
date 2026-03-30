import uuid
from sqlalchemy import String, Text, Integer, Boolean, Float, ForeignKey
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship
from pgvector.sqlalchemy import Vector
from .base import Base, TimestampMixin

class KnowledgeSpiritual(Base, TimestampMixin):
    """
    霊媒師の霊的体験（霊視、オーラ、守護霊、前世など）を蓄積するモデル。
    """
    __tablename__ = 'knowledge_spiritual'
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    vision_text: Mapped[str | None] = mapped_column(Text, nullable=True) # 霊視内容
    aura_color: Mapped[str | None] = mapped_column(String, nullable=True) # オーラの色
    energy_color: Mapped[str | None] = mapped_column(String, nullable=True) # エネルギーの色
    energy_sensation: Mapped[str | None] = mapped_column(String, nullable=True) # 質感・温度
    guardian_spirit: Mapped[str | None] = mapped_column(String, nullable=True) # 守護霊
    guardian_spirit_feature: Mapped[str | None] = mapped_column(Text, nullable=True) # 守護霊の容姿・特徴
    past_life_context: Mapped[str | None] = mapped_column(Text, nullable=True) # 前世の断片
    atmosphere_vibe: Mapped[str | None] = mapped_column(String, nullable=True) # 空間の雰囲気
    spiritual_symbol: Mapped[str | None] = mapped_column(String, nullable=True) # 象徴
    synchronicity_sign: Mapped[str | None] = mapped_column(String, nullable=True) # 兆し・シンクロ
    spiritual_message: Mapped[str | None] = mapped_column(Text, nullable=True) # 具体的なメッセージ
    is_ng: Mapped[bool] = mapped_column(Boolean, default=False)
    embedding = mapped_column(Vector(1536), nullable=True)

class KnowledgeMindfulness(Base, TimestampMixin):
    __tablename__ = 'knowledge_mindfulness'
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    philosophy_concept: Mapped[str | None] = mapped_column(String, nullable=True)
    encouragement_text: Mapped[str | None] = mapped_column(Text, nullable=True)
    is_ng: Mapped[bool] = mapped_column(Boolean, default=False)
    embedding = mapped_column(Vector(1536), nullable=True)

class KnowledgePersona(Base, TimestampMixin):
    __tablename__ = 'knowledge_persona'
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    trait_name: Mapped[str | None] = mapped_column(String, nullable=True)
    trait_description: Mapped[str | None] = mapped_column(Text, nullable=True)
    is_ng: Mapped[bool] = mapped_column(Boolean, default=False)
    embedding = mapped_column(Vector(1536), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    priority_order: Mapped[int] = mapped_column(Integer, default=0)

class KnowledgeEmpathy(Base, TimestampMixin):
    __tablename__ = 'knowledge_empathy'
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    abstract_situation: Mapped[str | None] = mapped_column(String, nullable=True)
    empathy_approach: Mapped[str | None] = mapped_column(Text, nullable=True)
    warmth_level: Mapped[int] = mapped_column(Integer, default=3)
    is_ng: Mapped[bool] = mapped_column(Boolean, default=False)
    embedding = mapped_column(Vector(1536), nullable=True)

class KnowledgeReframing(Base, TimestampMixin):
    __tablename__ = 'knowledge_reframing'
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    negative_state: Mapped[str | None] = mapped_column(String, nullable=True)
    positive_perspective: Mapped[str | None] = mapped_column(Text, nullable=True)
    is_ng: Mapped[bool] = mapped_column(Boolean, default=False)
    embedding = mapped_column(Vector(1536), nullable=True)

class KnowledgeAction(Base, TimestampMixin):
    __tablename__ = 'knowledge_action'
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    situation: Mapped[str | None] = mapped_column(String, nullable=True)
    small_step_proposal: Mapped[str | None] = mapped_column(Text, nullable=True)
    is_ng: Mapped[bool] = mapped_column(Boolean, default=False)
    embedding = mapped_column(Vector(1536), nullable=True)

class KnowledgeCopywriting(Base, TimestampMixin):
    __tablename__ = 'knowledge_copywriting'
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    structure_type: Mapped[str | None] = mapped_column(String, nullable=True)
    suggested_text_pattern: Mapped[str | None] = mapped_column(Text, nullable=True)
    is_ng: Mapped[bool] = mapped_column(Boolean, default=False)
    embedding = mapped_column(Vector(1536), nullable=True)

class KnowledgeFormat(Base, TimestampMixin):
    __tablename__ = 'knowledge_format'
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    format_rule: Mapped[str | None] = mapped_column(String, nullable=True)
    layout_example: Mapped[str | None] = mapped_column(Text, nullable=True)
    is_ng: Mapped[bool] = mapped_column(Boolean, default=False)
    embedding = mapped_column(Vector(1536), nullable=True)

class KnowledgeTheme(Base, TimestampMixin):
    """
    トピック（ブログタイトル）自動生成時の方向性・テーマを決めるモデル
    内容の構成や切り口（「心理コラム」「12星座占い」など）を保存する
    """
    __tablename__ = 'knowledge_theme'
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    theme_name: Mapped[str] = mapped_column(String, index=True) # 表示用テーマ名（例：「読者に寄り添う心理コラム」）
    theme_description: Mapped[str] = mapped_column(Text, nullable=False) # 具体的なLLMへのプロンプト指示
    is_active: Mapped[bool] = mapped_column(Boolean, default=False) # 有効フラグ

class KnowledgeStyle(Base, TimestampMixin):
    """
    AIの不自然な表現、自語り、論理の弱さなどの「表現スタイル」を規制・推奨するためのナレッジ。
    """
    __tablename__ = 'knowledge_style'
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    style_pattern: Mapped[str | None] = mapped_column(Text, nullable=True) # 対象の文体・パターン
    preferred_style: Mapped[str | None] = mapped_column(Text, nullable=True) # 推奨されるスタイル（あれば）
    rejection_reason: Mapped[str | None] = mapped_column(Text, nullable=True) # 理由・文脈
    is_ng: Mapped[bool] = mapped_column(Boolean, default=True) # 基本的にStyleは規制のためのものなのでデフォルトTrue
    embedding = mapped_column(Vector(1536), nullable=True)

class KnowledgeExperience(Base, TimestampMixin):
    """
    noteなどの外部ソースから抽出した「生々しい人生経験・エピソード」を蓄積するモデル。
    """
    __tablename__ = 'knowledge_experience'
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    experience_summary: Mapped[str | None] = mapped_column(String, nullable=True) # 経験の要約
    story_detail: Mapped[str | None] = mapped_column(Text, nullable=True) # 具体的なエピソード内容
    emotional_point: Mapped[str | None] = mapped_column(Text, nullable=True) # 感情的なフック・気づき
    instruction_worry: Mapped[str | None] = mapped_column(Text, nullable=True) # 仮想の相談・悩み (Instruction)
    ideal_response: Mapped[str | None] = mapped_column(Text, nullable=True) # 理想的な回答 (Output)
    source_url: Mapped[str | None] = mapped_column(String, nullable=True) # 出典URL
    is_ng: Mapped[bool] = mapped_column(Boolean, default=False) # 自動抽出時はデフォルトOK
    embedding = mapped_column(Vector(1536), nullable=True)
