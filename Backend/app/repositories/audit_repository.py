from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.audit_log import AuditLog


class AuditRepository:

    @staticmethod
    def get_by_id(
        db: Session,
        audit_log_id: int,
    ) -> AuditLog | None:

        return db.get(
            AuditLog,
            audit_log_id,
        )

    @staticmethod
    def get_by_organization(
        db: Session,
        organization_id: int,
    ) -> list[AuditLog]:

        statement = (
            select(AuditLog)
            .where(
                AuditLog.organization_id
                == organization_id
            )
            .order_by(
                AuditLog.created_at.desc()
            )
        )

        return list(db.scalars(statement).all())

    @staticmethod
    def get_by_user(
        db: Session,
        user_id: int,
    ) -> list[AuditLog]:

        statement = (
            select(AuditLog)
            .where(
                AuditLog.user_id == user_id
            )
            .order_by(
                AuditLog.created_at.desc()
            )
        )

        return list(db.scalars(statement).all())

    @staticmethod
    def get_by_entity(
        db: Session,
        entity_type: str,
        entity_id: int,
    ) -> list[AuditLog]:

        statement = (
            select(AuditLog)
            .where(
                AuditLog.entity_type == entity_type,
                AuditLog.entity_id == entity_id,
            )
            .order_by(
                AuditLog.created_at.desc()
            )
        )

        return list(db.scalars(statement).all())

    @staticmethod
    def create(
        db: Session,
        audit_log: AuditLog,
    ) -> AuditLog:

        db.add(audit_log)
        db.flush()

        return audit_log