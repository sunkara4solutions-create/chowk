"""
WhatsApp conversation state machine for worker registration and job responses.

State flow:
  new → reg_name → reg_skill → reg_experience → reg_daily_rate → reg_city → registered

When a job notification is sent, session transitions to awaiting_job_response.
Worker replies "1" (accept) or "2" (reject).
"""
import logging
from datetime import datetime
from sqlalchemy.orm import Session
from app.models import Worker, WhatsAppSession, BotState, SkillEnum, Notification, Application, Job, NotificationStatus, ApplicationStatus, JobStatus
from app.services.whatsapp_service import whatsapp_service

logger = logging.getLogger(__name__)

AP_CITIES = [
    "Vijayawada", "Guntur", "Visakhapatnam", "Tirupati", "Kakinada",
    "Rajahmundry", "Nellore", "Kurnool", "Kadapa", "Anantapur",
    "Ongole", "Eluru", "Machilipatnam", "Tenali", "Proddatur",
    "Chittoor", "Bhimavaram", "Srikakulam", "Vizianagaram", "Hindupur",
]

SKILL_MENU = (
    "What is your skill? Reply with number:\n"
    "1. Painter\n"
    "2. Mason\n"
    "3. Electrician\n"
    "4. Plumber\n"
    "5. Carpenter\n"
    "6. Welder\n"
    "7. Tiles Worker\n"
    "8. Helper\n"
    "9. Construction Laborer"
)

SKILL_MAP = {
    "1": SkillEnum.painter,
    "2": SkillEnum.mason,
    "3": SkillEnum.electrician,
    "4": SkillEnum.plumber,
    "5": SkillEnum.carpenter,
    "6": SkillEnum.welder,
    "7": SkillEnum.tiles_worker,
    "8": SkillEnum.helper,
    "9": SkillEnum.construction_laborer,
}


async def handle_incoming(phone: str, body: str, db: Session) -> None:
    session = db.query(WhatsAppSession).filter(WhatsAppSession.phone == phone).first()

    if not session:
        session = WhatsAppSession(phone=phone, bot_state=BotState.new, context={})
        db.add(session)
        db.commit()

    state = session.bot_state
    text = body.strip()

    if text.upper() in ("STOP", "UNSUBSCRIBE"):
        worker = db.query(Worker).filter(Worker.phone == phone).first()
        if worker:
            worker.is_active = False
            db.commit()
        await whatsapp_service.send_text(phone, "You have been unsubscribed from Chowk notifications. Reply Hi to re-register.")
        return

    if state == BotState.new or text.upper() == "HI":
        existing_worker = db.query(Worker).filter(Worker.phone == phone).first()
        if existing_worker and existing_worker.is_active:
            await whatsapp_service.send_text(
                phone,
                f"Welcome back, {existing_worker.name}!\n"
                f"Skill: {existing_worker.skill.value.replace('_', ' ').title()}\n"
                f"City: {existing_worker.city}\n\n"
                "Reply STOP to unsubscribe or AVAILABLE to mark yourself available."
            )
            session.bot_state = BotState.registered
        else:
            await whatsapp_service.send_text(
                phone,
                "Welcome to *Chowk*!\n\nI help you find daily work as a skilled worker.\n\nWhat is your name?"
            )
            session.bot_state = BotState.reg_name
            session.context = {}
        db.commit()
        return

    if state == BotState.reg_name:
        if len(text) < 2:
            await whatsapp_service.send_text(phone, "Please enter your full name.")
            return
        session.context = {**session.context, "name": text}
        session.bot_state = BotState.reg_skill
        db.commit()
        await whatsapp_service.send_text(phone, f"Nice to meet you, {text}!\n\n{SKILL_MENU}")
        return

    if state == BotState.reg_skill:
        skill = SKILL_MAP.get(text)
        if not skill:
            await whatsapp_service.send_text(phone, f"Please reply with a number 1-9.\n\n{SKILL_MENU}")
            return
        session.context = {**session.context, "skill": skill.value}
        session.bot_state = BotState.reg_experience
        db.commit()
        await whatsapp_service.send_text(phone, "How many years of experience do you have? (Reply with a number, e.g. 3)")
        return

    if state == BotState.reg_experience:
        if not text.isdigit():
            await whatsapp_service.send_text(phone, "Please reply with a number (e.g. 3 for 3 years, 0 if fresher).")
            return
        session.context = {**session.context, "experience": int(text)}
        session.bot_state = BotState.reg_daily_rate
        db.commit()
        await whatsapp_service.send_text(phone, "What is your daily rate? (in rupees, e.g. 800)")
        return

    if state == BotState.reg_daily_rate:
        if not text.isdigit() or int(text) < 100:
            await whatsapp_service.send_text(phone, "Please enter a valid daily rate in rupees (e.g. 800).")
            return
        session.context = {**session.context, "daily_rate": int(text)}
        session.bot_state = BotState.reg_city
        db.commit()
        cities_list = "\n".join(f"{i+1}. {c}" for i, c in enumerate(AP_CITIES))
        await whatsapp_service.send_text(
            phone,
            f"Which city are you from?\n\n{cities_list}\n\nOr type your city name."
        )
        return

    if state == BotState.reg_city:
        city = _resolve_city(text)
        ctx = session.context

        existing = db.query(Worker).filter(Worker.phone == phone).first()
        if existing:
            existing.name = ctx["name"]
            existing.skill = SkillEnum(ctx["skill"])
            existing.experience = ctx.get("experience", 0)
            existing.daily_rate = ctx["daily_rate"]
            existing.city = city
            existing.is_active = True
        else:
            worker = Worker(
                name=ctx["name"],
                phone=phone,
                skill=SkillEnum(ctx["skill"]),
                experience=ctx.get("experience", 0),
                daily_rate=ctx["daily_rate"],
                city=city,
            )
            db.add(worker)

        session.bot_state = BotState.registered
        session.context = {}
        db.commit()

        skill_display = ctx["skill"].replace("_", " ").title()
        await whatsapp_service.send_text(
            phone,
            f"*You are registered on Chowk!*\n\n"
            f"Name: {ctx['name']}\n"
            f"Skill: {skill_display}\n"
            f"City: {city}\n"
            f"Daily Rate: Rs.{ctx['daily_rate']}\n\n"
            f"You will receive job notifications when work is available in {city}.\n\n"
            "Reply STOP to unsubscribe anytime."
        )
        return

    if state == BotState.awaiting_job_response:
        await _handle_job_response(phone, text, session, db)
        return

    if text.upper() == "AVAILABLE":
        worker = db.query(Worker).filter(Worker.phone == phone).first()
        if worker:
            worker.is_available = True
            db.commit()
            await whatsapp_service.send_text(phone, "You are now marked as available for work!")
        return

    # Fallback for registered workers
    await whatsapp_service.send_text(
        phone,
        "Reply *Hi* to see your profile or *STOP* to unsubscribe."
    )


async def _handle_job_response(phone: str, text: str, session: WhatsAppSession, db: Session) -> None:
    if text not in ("1", "2"):
        await whatsapp_service.send_text(phone, "Please reply *1* for Interested or *2* for Not Interested.")
        return

    job_id = session.pending_job_id
    if not job_id:
        await whatsapp_service.send_text(phone, "Sorry, this job offer has expired.")
        session.bot_state = BotState.registered
        db.commit()
        return

    worker = db.query(Worker).filter(Worker.phone == phone).first()
    job = db.query(Job).filter(Job.job_id == job_id).first()

    if not worker or not job or job.status != JobStatus.open:
        await whatsapp_service.send_text(phone, "Sorry, this job is no longer available.")
        session.bot_state = BotState.registered
        session.pending_job_id = None
        db.commit()
        return

    application = db.query(Application).filter(
        Application.job_id == job_id,
        Application.worker_id == worker.worker_id
    ).first()

    if text == "1":
        if job.confirmed_count >= job.required_count:
            await whatsapp_service.send_text(
                phone,
                "Sorry, all positions for this job have been filled. We'll notify you about the next opportunity!"
            )
        else:
            if application:
                application.status = ApplicationStatus.accepted
            else:
                application = Application(
                    job_id=job_id,
                    worker_id=worker.worker_id,
                    status=ApplicationStatus.accepted,
                )
                db.add(application)
            job.confirmed_count += 1
            if job.confirmed_count >= job.required_count:
                job.status = JobStatus.filled

            notification = db.query(Notification).filter(
                Notification.job_id == job_id,
                Notification.worker_id == worker.worker_id
            ).first()
            if notification:
                notification.status = NotificationStatus.delivered

            await whatsapp_service.send_text(
                phone,
                f"*Confirmed!* You are booked for this job.\n\n"
                f"Date: {job.job_date.strftime('%d %B %Y')}\n"
                f"Location: {job.location}, {job.city}\n"
                f"Rate: Rs.{job.rate}/day\n"
                + (f"Start Time: {job.start_time.strftime('%I:%M %p')}\n" if job.start_time else "")
                + "\nThe contractor may contact you if needed. Good luck!"
            )
    else:
        if application:
            application.status = ApplicationStatus.rejected
        else:
            application = Application(
                job_id=job_id,
                worker_id=worker.worker_id,
                status=ApplicationStatus.rejected,
            )
            db.add(application)
        await whatsapp_service.send_text(phone, "No problem! We'll notify you about the next job opportunity.")

    session.bot_state = BotState.registered
    session.pending_job_id = None
    db.commit()


def _resolve_city(text: str) -> str:
    text_lower = text.lower().strip()
    # Try numbered selection from menu
    if text.isdigit():
        idx = int(text) - 1
        if 0 <= idx < len(AP_CITIES):
            return AP_CITIES[idx]
    # Try fuzzy match
    for city in AP_CITIES:
        if city.lower() == text_lower or city.lower().startswith(text_lower[:4]):
            return city
    # Accept whatever they typed (title-cased)
    return text.strip().title()
