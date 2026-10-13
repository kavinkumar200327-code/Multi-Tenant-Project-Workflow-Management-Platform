from sqlalchemy.orm import Session

from app.models.audit_log import AuditLog


class AuditService:

    @staticmethod
    def create_log(
        db: Session,
        organization_id: int,
        user_id: int | None,
        action: str,
        entity_type: str,
        entity_id: int | None = None,
        description: str | None = None,
        old_values: dict | None = None,
        new_values: dict | None = None,
    ) -> AuditLog:

        audit_log = AuditLog(
            organization_id=organization_id,
            user_id=user_id,
            action=action,
            entity_type=entity_type,
            entity_id=entity_id,
            description=description,
            old_values=old_values,
            new_values=new_values,
        )

        db.add(audit_log)
        db.commit()
        db.refresh(audit_log)

        return audit_log