from backend.config.sql import SessionLocal, SqlConfig


def get_sql_db():
    db = SqlConfig.session()
    try:
        yield db
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()