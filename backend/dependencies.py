from backend.config.database import SessionLocal, SqlConfig


def get_sql_db():
    db = SqlConfig.session()
    try:
        yield db
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()