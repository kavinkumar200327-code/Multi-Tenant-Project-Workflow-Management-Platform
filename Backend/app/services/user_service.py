from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.user import User
from app.schemas.user import UserCreate, UserUpdate


class UserService:

    @staticmethod
    def get_user_by_id(
        db: Session,
        user_id: int,
    ) -> User | None:
        return db.get(User, user_id)

    @staticmethod
    def get_user_by_email(
        db: Session,
        email: str,
    ) -> User | None:
        statement = select(User).where(
            User.email == email.lower()
        )

        return db.scalar(statement)

    @staticmethod
    def create_user(
        db: Session,
        user_data: UserCreate,
        password_hash: str,
    ) -> User:
        user = User(
            full_name=user_data.full_name,
            email=user_data.email.lower(),
            password_hash=password_hash,
            is_active=True,
        )

        db.add(user)
        db.commit()
        db.refresh(user)

        return user

    @staticmethod
    def update_user(
        db: Session,
        user: User,
        user_data: UserUpdate,
    ) -> User:

        update_data = user_data.model_dump(
            exclude_unset=True
        )

        if "email" in update_data and update_data["email"]:
            update_data["email"] = update_data["email"].lower()

        for field, value in update_data.items():
            setattr(user, field, value)

        db.commit()
        db.refresh(user)

        return user