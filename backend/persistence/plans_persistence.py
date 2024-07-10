from sqlalchemy.orm import Session



class PlansPersistence:
    def __init__(self, db: Session):
        self.db = db
