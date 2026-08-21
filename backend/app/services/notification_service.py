"""
Sends WhatsApp job notifications to matched workers and updates DB records.
Designed to run as a FastAPI BackgroundTask — no Celery needed for MVP.
"""
import logging
from datetime import datetime
from sqlalchemy.orm import Session
from app.models import Worker, Job, Notification, NotificationStatus, WhatsAppSession, BotState
from app.services.whatsapp_service import whatsapp_service
from app.services.messages import t

logger = logging.getLogger(__name__)

SKILL_DISPLAY = {
    "en": {
        "painter": "Painter", "mason": "Mason", "electrician": "Electrician",
        "plumber": "Plumber", "carpenter": "Carpenter", "welder": "Welder",
        "tiles_worker": "Tiles Worker", "helper": "Helper", "construction_laborer": "Construction Laborer",
    },
    "te": {
        "painter": "పెయింటర్", "mason": "మేసన్", "electrician": "ఎలక్ట్రీషియన్",
        "plumber": "ప్లంబర్", "carpenter": "కార్పెంటర్", "welder": "వెల్డర్",
        "tiles_worker": "టైల్స్ వర్కర్", "helper": "హెల్పర్", "construction_laborer": "కన్స్ట్రక్షన్ లేబర్",
    },
    "hi": {
        "painter": "पेंटर", "mason": "राजमिस्त्री", "electrician": "इलेक्ट्रीशियन",
        "plumber": "प्लंबर", "carpenter": "बढ़ई", "welder": "वेल्डर",
        "tiles_worker": "टाइल्स वर्कर", "helper": "हेल्पर", "construction_laborer": "निर्माण मजदूर",
    },
}


def _worker_lang(db: Session, phone: str) -> str:
    session = db.query(WhatsAppSession).filter(WhatsAppSession.phone == phone).first()
    return (session.context or {}).get("lang", "en") if session else "en"


def _build_job_message(job: Job, lang: str) -> str:
    skill_label = SKILL_DISPLAY.get(lang, SKILL_DISPLAY["en"]).get(job.skill.value, job.skill.value.replace("_", " ").title())
    date_str = job.job_date.strftime("%d %B %Y (%A)")
    start_time_str = f"\nStart: {job.start_time.strftime('%I:%M %p')}" if job.start_time else ""
    return t("job_notify", lang,
             skill=skill_label, location=job.location, city=job.city,
             date=date_str, rate=job.rate, start_time=start_time_str)


async def send_job_notifications(job_id, db: Session, exclude_worker_ids: set | None = None) -> int:
    from app.services.matching import find_matching_workers

    job = db.query(Job).filter(Job.job_id == job_id).first()
    if not job:
        return 0

    workers = find_matching_workers(db, job.skill, job.city, job_id)
    if exclude_worker_ids:
        workers = [w for w in workers if w.worker_id not in exclude_worker_ids]
    sent_count = 0

    for worker in workers:
        lang = _worker_lang(db, worker.phone)
        message = _build_job_message(job, lang)

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
            if exclude_worker_ids is not None:
                exclude_worker_ids.add(worker.worker_id)
        except Exception as e:
            logger.error("Failed to notify worker %s: %s", worker.phone, e)
            notification.status = NotificationStatus.failed

    db.commit()
    return sent_count


async def notify_jobs_background(job_ids: list[str]) -> None:
    """Runs after webhook response is sent — creates its own DB session."""
    from app.database import SessionLocal
    db = SessionLocal()
    try:
        notified_ids: set = set()
        for job_id in job_ids:
            await send_job_notifications(job_id, db, notified_ids)
    finally:
        db.close()


async def notify_contractor_of_late_worker(worker_id: str) -> None:
    """If a worker registers after a job date, notify the contractor they may still find a match."""
    from app.database import SessionLocal
    from datetime import date, timedelta
    from app.models import JobStatus, SkillEnum, Contractor

    db = SessionLocal()
    try:
        worker = db.query(Worker).filter(Worker.worker_id == worker_id).first()
        if not worker:
            return

        worker_skills = [SkillEnum(s) for s in (worker.skills or [])]
        if not worker_skills:
            return

        today = date.today()
        two_days_ago = today - timedelta(days=2)

        past_open_jobs = (
            db.query(Job)
            .filter(
                Job.status == JobStatus.open,
                Job.job_date >= two_days_ago,
                Job.job_date < today,
                Job.city.ilike(worker.city),
                Job.skill.in_(worker_skills),
            )
            .all()
        )

        for job in past_open_jobs:
            contractor = db.query(Contractor).filter(Contractor.contractor_id == job.contractor_id).first()
            if not contractor:
                continue
            skill_label = SKILL_DISPLAY["en"].get(job.skill.value, job.skill.value.replace("_", " ").title())
            msg = (
                f"👷 *New Worker Available — {skill_label}*\n\n"
                f"A worker just registered on Chowk who matches your job from {job.job_date.strftime('%d %B')}.\n\n"
                f"*Worker:* {worker.name}\n"
                f"*Skill:* {skill_label}\n"
                f"*City:* {worker.city}\n"
                f"*Rate:* ₹{worker.daily_rate}/day\n"
                f"*Experience:* {worker.experience} yrs\n\n"
                f"Are you still looking? Reply *YES* to get their contact or post a new job."
            )
            try:
                await whatsapp_service.send_text(contractor.phone, msg)
            except Exception as e:
                logger.error("Failed to notify contractor %s of late worker: %s", contractor.phone, e)
    finally:
        db.close()


async def notify_worker_of_existing_jobs(worker_id: str) -> None:
    """Notify a newly registered worker about open jobs from tomorrow onwards that match their skill+city."""
    from app.database import SessionLocal
    from datetime import date, timedelta
    from app.models import JobStatus, SkillEnum

    db = SessionLocal()
    try:
        worker = db.query(Worker).filter(Worker.worker_id == worker_id).first()
        if not worker:
            return

        tomorrow = date.today() + timedelta(days=1)
        worker_skills = [SkillEnum(s) for s in (worker.skills or [])]
        if not worker_skills:
            return

        open_jobs = (
            db.query(Job)
            .filter(
                Job.status == JobStatus.open,
                Job.job_date >= tomorrow,
                Job.city.ilike(worker.city),
                Job.skill.in_(worker_skills),
            )
            .order_by(Job.job_date)
            .all()
        )
        if not open_jobs:
            return

        lang = _worker_lang(db, worker.phone)
        session = db.query(WhatsAppSession).filter(WhatsAppSession.phone == worker.phone).first()

        for job in open_jobs:
            already = db.query(Notification).filter(
                Notification.job_id == job.job_id,
                Notification.worker_id == worker.worker_id,
            ).first()
            if already:
                continue

            notification = Notification(
                worker_id=worker.worker_id,
                job_id=job.job_id,
                status=NotificationStatus.pending,
            )
            db.add(notification)
            db.flush()

            try:
                msg_id = await whatsapp_service.send_text(worker.phone, _build_job_message(job, lang))
                notification.status = NotificationStatus.sent
                notification.whatsapp_message_id = msg_id
                notification.sent_at = datetime.utcnow()

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
                    db.flush()
            except Exception as e:
                logger.error("Failed to notify new worker %s for job %s: %s", worker.phone, job.job_id, e)
                notification.status = NotificationStatus.failed

        db.commit()
    finally:
        db.close()
