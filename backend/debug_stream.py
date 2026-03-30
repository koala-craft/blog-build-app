
import asyncio
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.api.generate import sse_wrap
from app.services.generator import stream_article_generation
from app.database import DATABASE_URL
from uuid import uuid4

async def debug_stream():
    engine = create_engine(DATABASE_URL)
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    db = SessionLocal()
    
    # Get a valid topic ID
    from app.models.content import BlogTopicCandidate
    topic = db.query(BlogTopicCandidate).first()
    if not topic:
        print("No topics found in DB. Please create one.")
        return
    
    print(f"Testing stream for topic: {topic.id}")
    
    try:
        generator = stream_article_generation(db, str(topic.id), target_chars=500, is_paid=False)
        async for sse_chunk in sse_wrap(generator):
            print(f"Chunk: {sse_chunk[:50]}...")
    except Exception as e:
        import traceback
        traceback.print_exc()
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    asyncio.run(debug_stream())
