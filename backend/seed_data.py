# main.py
from fastapi import FastAPI
from sqlalchemy.orm import Session
from sqlalchemy import select
from database import SessionLocal, engine
import models

app = FastAPI()

# Make sure tables exist
models.Base.metadata.create_all(bind=engine)

def seed_initial_data(db: Session) -> None:
    """
    Insert initial Users and UserCreds if they don't exist.
    This function is idempotent: safe to run multiple times.
    """

    # 1) Seed Users (use a unique field like email to check existence)
    users_to_seed = [
        {"email": "pedro@gmail.com", "name": "Pedro", "role": "manager"},
        {"email": "alice@gmail.com", "name": "Alice", "role": "contributor"},
        {"email": "bob@gmail.com",   "name": "Bob",   "role": "contributor"},

    ]

    email_to_user = {}

    for data in users_to_seed:
        stmt = select(models.Users).where(models.Users.email == data["email"])
        user = db.execute(stmt).scalar_one_or_none()
        if not user:
            user = models.Users(**data)
            db.add(user)
            # flush so `user.id` is available for foreign keys
            db.flush()
        email_to_user[data["email"]] = user

    creds_to_seed = [
        {"email": "pedro@gmail.com", "password": "pedro_abc123"},
        {"email": "alice@gmail.com", "password": "alice_abc123"},
        {"email": "bob@gmail.com", "password": "bob_abc123"},
    ]

    for c in creds_to_seed:
        user = email_to_user[c["email"]]
        stmt = select(models.UserCreds).where(models.UserCreds.user_id == user.id)
        creds = db.execute(stmt).scalar_one_or_none()
        if not creds:
            creds = models.UserCreds(user_id=user.id, password=c["password"])
            db.add(creds)

    db.commit()