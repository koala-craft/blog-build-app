import os
from pathlib import Path

def create_project_structure():
    # 1. ディレクトリ構成の定義
    dirs = [
        "backend/app/api",
        "backend/app/core",
        "backend/app/models",
        "backend/app/schemas",
        "backend/app/services",
        "backend/migrations",
        "frontend/src/app",
        "init-db",
        "docs",
    ]

    for d in dirs:
        Path(d).mkdir(parents=True, exist_ok=True)
        print(f"Created directory: {d}")

    # 2. backend/requirements.txt の生成
    requirements = """fastapi
uvicorn[standard]
sqlalchemy[asyncio]
psycopg2-binary
pgvector
alembic
pydantic
pydantic-settings
python-dotenv
openai
anthropic
httpx
feedparser
"""
    with open("backend/requirements.txt", "w", encoding="utf-8") as f:
        f.write(requirements)
    print("Generated: backend/requirements.txt")

    # 3. backend/.env (Template) の生成
    backend_env = """# Database
DATABASE_URL=postgresql+psycopg2://ftuser:ftpassword@localhost:5432/fortunetelling

# LLM API Keys (Fill your keys)
OPENAI_API_KEY=
ANTHROPIC_API_KEY=

# Model settings
EXTRACTION_MODEL=gpt-4o-mini
GENERATION_MODEL=claude-3-5-sonnet-20241022

# Collection settings
COLLECT_MAX_ARTICLES=20
COLLECT_TOKEN_LIMIT=800
"""
    with open("backend/.env", "w", encoding="utf-8") as f:
        f.write(backend_env)
    print("Generated: backend/.env (Template)")

    # 4. init-db/01-vector.sql の生成 (DB初期化時に自動実行)
    init_db_sql = "CREATE EXTENSION IF NOT EXISTS vector;"
    with open("init-db/01-vector.sql", "w", encoding="utf-8") as f:
        f.write(init_db_sql)
    print("Generated: init-db/01-vector.sql")

    # 5. docker-compose.yml の生成
    docker_compose = """

services:
  db:
    image: pgvector/pgvector:pg16
    container_name: fortunetelling_db
    environment:
      POSTGRES_USER: ftuser
      POSTGRES_PASSWORD: ftpassword
      POSTGRES_DB: fortunetelling
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data
      - ./init-db:/docker-entrypoint-initdb.d
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ftuser -d fortunetelling"]
      interval: 10s
      timeout: 5s
      retries: 5

volumes:
  pgdata:
"""
    with open("docker-compose.yml", "w", encoding="utf-8") as f:
        f.write(docker_compose)
    print("Generated: docker-compose.yml")

    # 6. .gitignore の生成
    gitignore = """# Python
__pycache__/
.venv/
.env

# Node
node_modules/
.next/
dist/
.env.local

# Docker
pgdata/
"""
    with open(".gitignore", "w", encoding="utf-8") as f:
        f.write(gitignore)
    print("Generated: .gitignore")

    print("\n--- Project initialization complete! ---")
    print("Next steps:")
    print("1. Fill API keys in 'backend/.env'")
    print("2. Run 'docker compose up -d' to start the database")
    print("3. Setup FastAPI and Next.js as described in the documentation")

if __name__ == "__main__":
    create_project_structure()
