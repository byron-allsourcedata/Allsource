from backend.config.database import SessionLocal
from contextlib import contextmanager
from sqlalchemy.orm import Session
from fastapi import Depends

from backend.services.users import ServiceUsers


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def get_user_service(db: Session = Depends(get_db)):
    return ServiceUsers(db=db)
