from sqlalchemy import create_engine, Column, Integer, ForeignKey
from sqlalchemy.orm import sessionmaker, relationship
from sqlalchemy.ext.declarative import declarative_base

Base = declarative_base()

class User(Base):
    __tablename__ = 'users'
    id = Column(Integer, primary_key=True)

class SubscriptionPlan(Base):
    __tablename__ = 'subscription_plans'
    id = Column(Integer, primary_key=True)

class UserSubscriptionPlan(Base):
    __tablename__ = 'user_subscription_plans'
    user_id = Column(Integer, ForeignKey('users.id'), primary_key=True)
    plan_id = Column(Integer, ForeignKey('subscription_plans.id'), primary_key=True)

    subscription = relationship("SubscriptionPlan", primaryjoin="UserSubscriptionPlan.plan_id == SubscriptionPlan.id")

engine = create_engine('sqlite:///:memory:')
Base.metadata.create_all(engine)
Session = sessionmaker(bind=engine)
session = Session()
