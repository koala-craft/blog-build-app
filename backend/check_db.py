
from sqlalchemy import create_engine, inspect
from app.database import DATABASE_URL
from app.models.content import PersonaTemplate

def check_db():
    engine = create_engine(DATABASE_URL)
    inspector = inspect(engine)
    
    # Check columns
    columns = inspector.get_columns('persona_templates')
    col_names = [c['name'] for c in columns]
    print(f"Columns in persona_templates: {col_names}")
    
    if 'knowledge_settings' not in col_names:
        print("ERROR: knowledge_settings column MISSING!")
    else:
        print("SUCCESS: knowledge_settings column exists.")
        
    # Check data
    from sqlalchemy.orm import sessionmaker
    SessionLocal = sessionmaker(bind=engine)
    db = SessionLocal()
    
    active = db.query(PersonaTemplate).filter(PersonaTemplate.is_active == True).first()
    if active:
        print(f"Active Persona: {active.name}")
        print(f"Knowledge Settings: {active.knowledge_settings}")
    else:
        print("No active persona found.")
        
    db.close()

if __name__ == "__main__":
    check_db()
