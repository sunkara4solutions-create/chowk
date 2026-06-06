"""
Sends WhatsApp job notifications to matched workers and updates DB records.
Designed to run as a FastAPI BackgroundTask — no Celery needed for MVP.
"""
import logging
from datetime import datetime
from sqlalchemy.orm import Session
from app.models import Worker, Job, Notification, NotificationStatus, WhatsAppSession, BotState
from app.services.whatsapp_service import whatsapp_service

logger = logging.getLogger(__name__)


def _build_job_message(job: Job) -> str:
    skill_display = job.skill.value.replace("_", " ").title()
    date_str = job.job_date.strftime("%d %B %Y (%A)")
    time_str = job.start_time.strftime("%I:%M %p") if job.start_time else "To be confirmed"
    return (
        f"*New Job Alert!*\n\n"
        f"Skill: {skill_display}\n"
        f"Location: {job.location}, {job.city}\n"
        f"Date: {date_str}\n"
        f"Start Time: {time_str}\n"
        f"Rate: Rs.{job.rate}/day\n\n"
        f"Reply:\n"
        f"*1* - Interested\n"
        f"*2* - Not Interested"
    )


async def send_job_notifications(job_id, db: Session) -> int:
    from app.services.matching import find_matching_workers

    job = db.query(Job).filter(Job.job_id == job_id).first()
    if not job:
        return 0

    workers = find_matching_workers(db, job.skill, job.city, job_id)
    message = _build_job_message(job)
    sent_count = 0

    for worker in workers:
        notification = Notification(
            worker_id=worker.worker_id,
            job_id=job.job_id,
            status=NotificationStatus.pending,
        )
        db.add(notification)
        db.flush()

        try:
            msg_id = await whatsapp_service.send_text(worker.phone, message)
            notification.status = NotificationStatus.sent
            notification.whatsapp_message_id = msg_id
            notification.sent_at = datetime.utcnow()

            # Update bot session so worker's next reply is matched to this job
            session = db.query(WhatsAppSession).filter(WhatsAppSession.phone == worker.phone).first()
            if session:
                session.bot_state = BotState.awaiting_job_response
                session.pending_job_id = job.job_id
            else:
                session = WhatsAppSession(
                    phone=worker.phone,
                    bot_state=BotState.awaiting_job_response,
                    pending_job_id=job.job_id,
                    context={},
                )
                db.add(session)

            sent_count += 1
        except Exception as e:
            logger.error("Failed to notify worker %s: %s", worker.phone, e)
            notification.status = NotificationStatus.failed

    db.commit()
    return sent_count
