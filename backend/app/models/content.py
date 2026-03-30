import uuid
from typing import Any
from sqlalchemy import String, Text, Integer, Boolean, Float, ForeignKey
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship
from .base import Base, TimestampMixin

class PersonaTemplate(Base, TimestampMixin):
    """
    ペルソナプロンプトテンプレートを管理するモデル。
    is_active=True のテンプレートが記事生成時に最優先で使用される。
    """
    __tablename__ = 'persona_templates'
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String)  # テンプレート表示名
    system_prompt: Mapped[str] = mapped_column(Text)  # ペルソナを定義するプロンプト本文
    is_active: Mapped[bool] = mapped_column(Boolean, default=False)  # 有効フラグ（最大1件のみ有効）
    knowledge_settings: Mapped[dict] = mapped_column(JSONB, nullable=True) # 使用するナレッジの種類 (spiritual, mindfulness, etc.)


class WorrySeed(Base, TimestampMixin):
    __tablename__ = 'worry_seeds'
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    original_text_hash: Mapped[str] = mapped_column(String, unique=True, index=True)
    abstract_worry: Mapped[str] = mapped_column(Text)
    source_tags: Mapped[str] = mapped_column(String)
    is_used: Mapped[bool] = mapped_column(Boolean, default=False)
    
class BlogTopicCandidate(Base, TimestampMixin):
    __tablename__ = 'blog_topics_candidates'
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    topic_title: Mapped[str] = mapped_column(String)
    source_data_ids: Mapped[dict[str, Any]] = mapped_column(JSONB, default=list) # Array of UUIDs
    status: Mapped[str] = mapped_column(String, default='suggested')
    priority: Mapped[int] = mapped_column(Integer, default=0)

class Article(Base, TimestampMixin):
    __tablename__ = 'articles'
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title: Mapped[str] = mapped_column(String)
    content: Mapped[str] = mapped_column(Text)
    topic_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey('blog_topics_candidates.id'), nullable=True)
    status: Mapped[str] = mapped_column(String, default='draft') # draft, posted
    note_url: Mapped[str | None] = mapped_column(String, nullable=True)
    likes_count: Mapped[int] = mapped_column(Integer, default=0)
    comments_count: Mapped[int] = mapped_column(Integer, default=0)
    total_score: Mapped[float] = mapped_column(Float, default=0.0)
    used_knowledge_ids: Mapped[dict[str, Any]] = mapped_column(JSONB, default=list) # Array of UUIDs
    used_persona_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), nullable=True)
    used_theme_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), nullable=True)
    theme: Mapped[str | None] = mapped_column(String, nullable=True)

class ArticleVersion(Base, TimestampMixin):
    __tablename__ = 'article_versions'
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    topic_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey('blog_topics_candidates.id'), index=True)
    content: Mapped[str] = mapped_column(Text)
    parent_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey('article_versions.id'), nullable=True)
    refinement_prompt: Mapped[str | None] = mapped_column(Text, nullable=True)
    version_number: Mapped[int] = mapped_column(Integer, default=1)

class AnalysisResult(Base, TimestampMixin):
    __tablename__ = 'analysis_results'
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    winning_patterns: Mapped[dict[str, Any]] = mapped_column(JSONB)
