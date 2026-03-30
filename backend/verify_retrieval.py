
import asyncio
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.services.retriever import retrieve_relevant_knowledge
from app.database import DATABASE_URL

async def test_retrieval():
    engine = create_engine(DATABASE_URL)
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    db = SessionLocal()
    
    query = "テストクエリ"
    
    # Test 1: All ON
    settings_all_on = {
        "spiritual": True,
        "mindfulness": True,
        "empathy": True,
        "reframing": True,
        "style": True,
        "experience": True
    }
    print("Testing All ON...")
    results_on = await retrieve_relevant_knowledge(db, query, settings=settings_all_on)
    print(f"Categories retrieved: {list(results_on.keys())}")
    
    # Test 2: Spiritual OFF
    settings_no_spiritual = settings_all_on.copy()
    settings_no_spiritual["spiritual"] = False
    print("\nTesting Spiritual OFF...")
    results_no_sp = await retrieve_relevant_knowledge(db, query, settings=settings_no_spiritual)
    print(f"Categories retrieved: {list(results_no_sp.keys())}")
    if "spiritual" in results_no_sp:
        print("ERROR: spiritual should not be in results")
    else:
        print("SUCCESS: spiritual excluded")

    # Test 3: Only Empathy
    settings_only_empathy = {k: False for k in settings_all_on}
    settings_only_empathy["empathy"] = True
    print("\nTesting Only Empathy ON...")
    results_only_em = await retrieve_relevant_knowledge(db, query, settings=settings_only_empathy)
    print(f"Categories retrieved: {list(results_only_em.keys())}")
    
    db.close()

if __name__ == "__main__":
    asyncio.run(test_retrieval())
