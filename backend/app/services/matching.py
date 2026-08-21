"""
Matching engine: finds eligible workers for a job.
Phase 1: skill (JSON list) + city exact match.
Phase 2 (TODO): add radius-based geo matching with PostGIS.
"""
from sqlalchemy.orm import Session
from app.models import Worker, Notification, SkillEnum


def find_matching_workers(db: Session, skill: SkillEnum, city: str, job_id) -> list[Worker]:
    already_notified = (
        db.query(Notification.worker_id)
        .filter(Notification.job_id == job_id)
        .subquery()
    )
    candidates = (
        db.query(Worker)
        .filter(
            Worker.city.ilike(city),
            Worker.is_available == True,
            Worker.is_active == True,
            Worker.worker_id.notin_(already_notified),
        )
        .all()
    )
    return [w for w in candidates if skill.value in (w.skills or [])]
