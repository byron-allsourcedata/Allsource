from sqlalchemy.orm import Session



class PlansPersistence:
    def __init__(self, db: Session):
        self.db = db

    def get_user_plan_and_info(self):
        print('a')
