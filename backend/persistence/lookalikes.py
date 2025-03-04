from datetime import datetime, timezone
from models.source import Source
from sqlalchemy.orm import Session
from sqlalchemy import func
from fastapi import HTTPException
import re


class LookalikesPersistence:
    def __init__(self, db: Session):
        self.db = db

    def get_source_info(self, uuid_of_source, user):
        return self.db.query(Source).where(Source.uuid == uuid_of_source).first()
