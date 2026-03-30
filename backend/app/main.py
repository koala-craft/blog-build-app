from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title="Fortune Telling Engine API",
    description="AI自律進化型占いコンテンツ生成エンジンのバックエンドAPI",
    version="0.1.0"
)

# CORS設定
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from .database import engine
from .models.base import Base
# モデルをインポートしないとmetadataに登録されず作成されない
from .models import knowledge, content 
Base.metadata.create_all(bind=engine)

from .api import collect, topics, knowledge, extract, generate, articles, analysis, persona_template, theme_template

@app.get("/")
async def root():
    return {"message": "Welcome to Fortune Telling Engine API"}

@app.get("/health")
async def health_check():
    return {"status": "ok"}

app.include_router(collect.router, prefix="/api/collect", tags=["collect"])
app.include_router(topics.router, prefix="/api/topics", tags=["topics"])
app.include_router(knowledge.router, prefix="/api/knowledge", tags=["knowledge"])
app.include_router(extract.router, prefix="/api/extract", tags=["extract"])
app.include_router(generate.router, prefix="/api/generate", tags=["generate"])
app.include_router(articles.router, prefix="/api/articles", tags=["articles"])
app.include_router(analysis.router, prefix="/api/analysis", tags=["analysis"])
app.include_router(persona_template.router, prefix="/api/persona-templates", tags=["persona-templates"])
app.include_router(theme_template.router, prefix="/api/theme-templates", tags=["theme-templates"])
