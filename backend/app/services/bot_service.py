"""
WhatsApp conversation state machine for both workers and contractors.

Worker flow:
  new → reg_language → role_select → reg_name → reg_skill → reg_experience
        → reg_daily_rate → reg_city → registered → (awaiting_job_response)

Contractor flow:
  new → reg_language → role_select → con_name → con_company → con_city
        → contractor → (con_awaiting_confirm)
"""
import logging
import uuid
from datetime import datetime, date as date_type, time as time_type
from fastapi import BackgroundTasks
from sqlalchemy.orm import Session

from app.models import (
    Worker, Contractor, WhatsAppSession, BotState, SkillEnum,
    Notification, Application, Job, NotificationStatus, ApplicationStatus, JobStatus,
)
from app.services.whatsapp_service import whatsapp_service
from app.services.messages import LANGUAGE_MENU, LANG_MAP, t
from app.services.nlp_service import parse_contractor_message, ParsedJob, _normalize_skill
from app.core.auth import hash_password

logger = logging.getLogger(__name__)

AP_CITIES = [
    # Chittoor district
    "Palamaner", "Chittoor", "Tirupati", "Madanapalle", "Puttur",
    "Srikalahasti", "Nagari", "Kuppam", "Punganur", "Piler",
    # Rest of AP
    "Vijayawada", "Guntur", "Visakhapatnam", "Kakinada",
    "Rajahmundry", "Nellore", "Kurnool", "Kadapa", "Anantapur",
    "Ongole", "Eluru", "Machilipatnam", "Tenali", "Proddatur",
    "Bhimavaram", "Srikakulam", "Vizianagaram", "Hindupur", "Nandyal",
]

SKILL_MAP = {
    "1": SkillEnum.painter, "2": SkillEnum.mason, "3": SkillEnum.electrician,
    "4": SkillEnum.plumber, "5": SkillEnum.carpenter, "6": SkillEnum.welder,
    "7": SkillEnum.tiles_worker, "8": SkillEnum.helper, "9": SkillEnum.construction_laborer,
}

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


def _lang(session: WhatsAppSession) -> str:
    return session.context.get("lang", "en")


def _skill_label(skill_value: str, lang: str) -> str:
    return SKILL_DISPLAY.get(lang, SKILL_DISPLAY["en"]).get(skill_value, skill_value.replace("_", " ").title())


async def handle_incoming(phone: str, body: str, db: Session, background_tasks: BackgroundTasks) -> None:
    # SELECT FOR UPDATE prevents duplicate processing when Meta retries arrive concurrently
    session = db.query(WhatsAppSession).filter(WhatsAppSession.phone == phone).with_for_update().first()
    if not session:
        session = WhatsAppSession(phone=phone, bot_state=BotState.new, context={})
        db.add(session)
        db.commit()

    state = session.bot_state
    text = body.strip()
    lang = _lang(session)

    # ── Global commands ───────────────────────────────────────────────────
    if text.upper() in ("STOP", "UNSUBSCRIBE"):
        worker = db.query(Worker).filter(Worker.phone == phone).first()
        if worker:
            worker.is_active = False
            db.commit()
        await whatsapp_service.send_text(phone, t("unsubscribed", lang))
        return

    # ── New / restart ─────────────────────────────────────────────────────
    _GREETINGS = {"HI", "HELLO", "HEY", "HELO", "NAMASTE", "NAMASTHE", "START"}
    if state == BotState.new or text.upper().strip("!. ") in _GREETINGS:
        existing_worker = db.query(Worker).filter(Worker.phone == phone).first()
        if existing_worker and existing_worker.is_active:
            skills_label = ", ".join(_skill_label(s, lang) for s in (existing_worker.skills or []))
            await whatsapp_service.send_text(
                phone, t("welcome_back", lang, name=existing_worker.name,
                         skill=skills_label, city=existing_worker.city)
            )
            session.bot_state = BotState.registered
            db.commit()
            return

        existing_contractor = db.query(Contractor).filter(Contractor.phone == phone).first()
        if existing_contractor and existing_contractor.is_active:
            msg = _build_contractor_welcome(existing_contractor, lang, db)
            await whatsapp_service.send_text(phone, msg)
            session.bot_state = BotState.contractor
            db.commit()
            return

        await whatsapp_service.send_text(phone, LANGUAGE_MENU)
        session.bot_state = BotState.reg_language
        session.context = {}
        db.commit()
        return

    # ── Language selection ────────────────────────────────────────────────
    if state == BotState.reg_language:
        chosen = LANG_MAP.get(text)
        if not chosen:
            await whatsapp_service.send_text(phone, LANGUAGE_MENU)
            return
        session.context = {"lang": chosen}
        session.bot_state = BotState.role_select
        db.commit()
        await whatsapp_service.send_text(phone, t("ask_role", chosen))
        return

    # ── Role selection ────────────────────────────────────────────────────
    if state == BotState.role_select:
        if text == "1":
            session.bot_state = BotState.reg_name
            db.commit()
            await whatsapp_service.send_text(phone, t("welcome", lang))
        elif text == "2":
            session.bot_state = BotState.con_name
            db.commit()
            await whatsapp_service.send_text(phone, t("con_ask_name", lang))
        else:
            await whatsapp_service.send_text(phone, t("role_invalid", lang))
        return

    # ── Worker registration ───────────────────────────────────────────────
    if state == BotState.reg_name:
        if len(text) < 2:
            await whatsapp_service.send_text(phone, t("name_too_short", lang))
            return
        session.context = {**session.context, "name": text}
        session.bot_state = BotState.reg_skill
        db.commit()
        await whatsapp_service.send_text(phone, t("skill_menu", lang))
        return

    if state == BotState.reg_skill:
        parts = text.replace(",", " ").split()
        skills = [SKILL_MAP[p] for p in parts if p in SKILL_MAP]
        if not skills:
            await whatsapp_service.send_text(phone, t("skill_invalid", lang) + "\n\n" + t("skill_menu", lang))
            return
        session.context = {**session.context, "skills": [s.value for s in skills]}
        session.bot_state = BotState.reg_experience
        db.commit()
        await whatsapp_service.send_text(phone, t("ask_experience", lang))
        return

    if state == BotState.reg_experience:
        if not text.isdigit():
            await whatsapp_service.send_text(phone, t("experience_invalid", lang))
            return
        session.context = {**session.context, "experience": int(text)}
        session.bot_state = BotState.reg_daily_rate
        db.commit()
        await whatsapp_service.send_text(phone, t("ask_rate", lang))
        return

    if state == BotState.reg_daily_rate:
        digits = "".join(c for c in text if c.isdigit())
        if not digits or int(digits) < 100:
            await whatsapp_service.send_text(phone, t("rate_invalid", lang))
            return
        session.context = {**session.context, "daily_rate": int(digits)}
        session.bot_state = BotState.reg_city
        db.commit()
        cities_list = "\n".join(f"{i+1}. {c}" for i, c in enumerate(AP_CITIES))
        await whatsapp_service.send_text(phone, t("ask_city", lang, cities=cities_list))
        return

    if state == BotState.reg_city:
        city = _resolve_city(text)
        ctx = session.context
        existing = db.query(Worker).filter(Worker.phone == phone).first()
        if existing:
            existing.name = ctx["name"]
            existing.skills = ctx["skills"]
            existing.experience = ctx.get("experience", 0)
            existing.daily_rate = ctx["daily_rate"]
            existing.city = city
            existing.is_active = True
        else:
            db.add(Worker(
                name=ctx["name"], phone=phone, skills=ctx["skills"],
                experience=ctx.get("experience", 0), daily_rate=ctx["daily_rate"], city=city,
            ))
        session.bot_state = BotState.registered
        session.context = {"lang": lang}
        db.commit()
        skills_label = ", ".join(_skill_label(s, lang) for s in ctx["skills"])
        await whatsapp_service.send_text(
            phone,
            t("registered", lang, name=ctx["name"], skill=skills_label, city=city, rate=ctx["daily_rate"])
        )
        worker = db.query(Worker).filter(Worker.phone == phone).first()
        if worker:
            from app.services.notification_service import notify_worker_of_existing_jobs
            background_tasks.add_task(notify_worker_of_existing_jobs, str(worker.worker_id))
        return

    if state == BotState.registered:
        if text.upper() == "AVAILABLE":
            worker = db.query(Worker).filter(Worker.phone == phone).first()
            if worker:
                worker.is_available = True
                db.commit()
                await whatsapp_service.send_text(phone, t("marked_available", lang))
        else:
            await whatsapp_service.send_text(phone, t("fallback", lang))
        return

    if state == BotState.awaiting_job_response:
        await _handle_job_response(phone, text, session, lang, db)
        return

    # ── Contractor registration ───────────────────────────────────────────
    if state == BotState.con_name:
        if len(text) < 2:
            await whatsapp_service.send_text(phone, t("name_too_short", lang))
            return
        session.context = {**session.context, "name": text}
        session.bot_state = BotState.con_company
        db.commit()
        await whatsapp_service.send_text(phone, t("con_ask_company", lang))
        return

    if state == BotState.con_company:
        company = None if text.upper() == "SKIP" else text
        session.context = {**session.context, "company": company}
        session.bot_state = BotState.con_city
        db.commit()
        await whatsapp_service.send_text(phone, t("con_ask_city", lang))
        return

    if state == BotState.con_city:
        city = _resolve_city(text)
        ctx = session.context
        existing = db.query(Contractor).filter(Contractor.phone == phone).first()
        if existing:
            existing.name = ctx["name"]
            existing.company_name = ctx.get("company")
            existing.city = city
            existing.is_active = True
        else:
            db.add(Contractor(
                name=ctx["name"], phone=phone,
                company_name=ctx.get("company"), city=city,
                password_hash=hash_password(str(uuid.uuid4())),
            ))
        session.bot_state = BotState.contractor
        session.context = {"lang": lang}
        db.commit()
        await whatsapp_service.send_text(phone, t("con_registered", lang, name=ctx["name"], city=city))
        return

    # ── Contractor: NLP job posting ───────────────────────────────────────
    if state == BotState.contractor:
        await _handle_contractor_message(phone, text, session, lang, db, background_tasks)
        return

    if state == BotState.con_awaiting_confirm:
        await _handle_job_confirm(phone, text, session, lang, db, background_tasks)
        return

    # Fallback
    await whatsapp_service.send_text(phone, t("fallback", lang))


MISSING_FIELD_MSG = {
    "city": "ask_missing_city",
    "date": "ask_missing_date",
    "rate": "ask_missing_rate",
    "count": "ask_missing_count",
    "skill": "ask_missing_skill",
}


def _build_contractor_welcome(contractor: Contractor, lang: str, db: Session) -> str:
    today = date_type.today()
    active_jobs = (
        db.query(Job)
        .filter(
            Job.contractor_id == contractor.contractor_id,
            Job.job_date >= today,
            Job.status != JobStatus.cancelled,
        )
        .order_by(Job.job_date)
        .all()
    )
    lang_skills = SKILL_DISPLAY.get(lang, SKILL_DISPLAY["en"])
    if active_jobs:
        lines = []
        for job in active_jobs:
            skill_label = lang_skills.get(job.skill.value, job.skill.value.replace("_", " ").title())
            icon = "✅" if job.status == JobStatus.filled else "🔵"
            lines.append(f"{icon} {skill_label}: {job.confirmed_count}/{job.required_count} — {job.job_date.strftime('%d %b')}")
        jobs_block = "\n".join(lines)
    else:
        jobs_block = {"en": "No active postings.", "te": "క్రియాశీల పోస్టింగ్‌లు లేవు.", "hi": "कोई सक्रिय पोस्टिंग नहीं।"}.get(lang, "No active postings.")

    post_hint = {"en": "Type your requirement to post a new job.", "te": "కొత్త పని పోస్ట్ చేయడానికి మీ అవసరాన్ని టైప్ చేయండి.", "hi": "नया काम पोस्ट करने के लिए अपनी ज़रूरत लिखें।"}.get(lang, "Type your requirement to post a new job.")
    header = {"en": f"Welcome back, {contractor.name}! 👋", "te": f"తిరిగి స్వాగతం, {contractor.name}! 👋", "hi": f"वापसी पर स्वागत है, {contractor.name}! 👋"}.get(lang, f"Welcome back, {contractor.name}! 👋")
    jobs_label = {"en": "Your active jobs:", "te": "మీ క్రియాశీల జాబ్‌లు:", "hi": "आपके सक्रिय काम:"}.get(lang, "Your active jobs:")

    return f"{header}\n\n{jobs_label}\n{jobs_block}\n\n{post_hint}"


async def _handle_contractor_message(
    phone: str, text: str, session: WhatsAppSession, lang: str,
    db: Session, background_tasks: BackgroundTasks
) -> None:
    # ── Post-confirmation worker actions ─────────────────────────────────
    collecting_msg = session.context.get("collecting_message_for")
    if collecting_msg:
        await _send_message_to_worker(phone, text, collecting_msg, session, lang, db)
        return

    worker_action = session.context.get("worker_action")
    if worker_action:
        await _handle_worker_action(phone, text, worker_action, session, lang, db)
        return

    # ── Job posting / missing field collection ───────────────────────────
    ctx_jobs = session.context.get("pending_jobs")
    collecting = session.context.get("collecting_field")
    if ctx_jobs and collecting:
        await _merge_missing_field(phone, text, collecting, ctx_jobs, session, lang, db)
        return

    # Single Claude call: intent + job extraction
    result = await parse_contractor_message(text)

    if result.intent in ("greeting", "status"):
        contractor = db.query(Contractor).filter(Contractor.phone == phone).first()
        if contractor:
            await whatsapp_service.send_text(phone, _build_contractor_welcome(contractor, lang, db))
        return

    if result.intent != "job_post" or not result.jobs:
        await whatsapp_service.send_text(phone, t("con_fallback", lang))
        return

    parsed_list = result.jobs

    # Default city to contractor's registered city when NLP returned None
    contractor = db.query(Contractor).filter(Contractor.phone == phone).first()
    if contractor:
        for p in parsed_list:
            if p.city is None:
                p.city = contractor.city

    first = parsed_list[0]
    missing = first.missing()
    if len(parsed_list) > 1 and any(p.count is None for p in parsed_list):
        await whatsapp_service.send_text(phone, t("con_parse_error", lang))
        return

    if not missing:
        await _show_job_confirmation(phone, parsed_list, session, lang, db)
        return

    session.context = {
        "lang": lang,
        "pending_jobs": [
            {"skill": p.skill, "count": p.count, "city": p.city,
             "date": p.date, "rate": p.rate, "start_time": p.start_time}
            for p in parsed_list
        ],
        "collecting_field": missing[0],
    }
    db.commit()
    await whatsapp_service.send_text(phone, t(MISSING_FIELD_MSG[missing[0]], lang))


async def _merge_missing_field(
    phone: str, text: str, field: str, ctx_jobs: list,
    session: WhatsAppSession, lang: str, db: Session
) -> None:
    try:
        if field == "city":
            for job in ctx_jobs:
                job["city"] = text.strip().title()
        elif field == "date":
            result = await parse_contractor_message(f"workers on {text}")
            if result.jobs and result.jobs[0].date:
                for job in ctx_jobs:
                    job["date"] = result.jobs[0].date
            else:
                await whatsapp_service.send_text(phone, t("ask_missing_date", lang))
                return
        elif field == "rate":
            digits = "".join(c for c in text if c.isdigit())
            if not digits:
                await whatsapp_service.send_text(phone, t("ask_missing_rate", lang))
                return
            for job in ctx_jobs:
                job["rate"] = int(digits)
        elif field == "count" and len(ctx_jobs) == 1:
            digits = "".join(c for c in text if c.isdigit())
            if not digits:
                await whatsapp_service.send_text(phone, t("ask_missing_count", lang))
                return
            ctx_jobs[0]["count"] = int(digits)
        elif field == "skill" and len(ctx_jobs) == 1:
            skill = _normalize_skill(text.strip().lower())
            if not skill:
                await whatsapp_service.send_text(phone, t("ask_missing_skill", lang))
                return
            ctx_jobs[0]["skill"] = skill
    except Exception:
        await whatsapp_service.send_text(phone, t("con_parse_error", lang))
        return

    first = ctx_jobs[0]
    still_missing = ParsedJob(
        skill=first.get("skill"), count=first.get("count"), city=first.get("city"),
        date=first.get("date"), rate=first.get("rate"), start_time=first.get("start_time"),
    ).missing()

    session.context = {"lang": lang, "pending_jobs": ctx_jobs}

    if still_missing:
        session.context["collecting_field"] = still_missing[0]
        db.commit()
        await whatsapp_service.send_text(phone, t(MISSING_FIELD_MSG[still_missing[0]], lang))
    else:
        db.commit()
        parsed_list = [
            ParsedJob(skill=j.get("skill"), count=j.get("count"), city=j.get("city"),
                      date=j.get("date"), rate=j.get("rate"), start_time=j.get("start_time"))
            for j in ctx_jobs
        ]
        await _show_job_confirmation(phone, parsed_list, session, lang, db)


async def _show_job_confirmation(phone: str, parsed_list: list, session: WhatsAppSession, lang: str, db: Session) -> None:
    first = parsed_list[0]
    try:
        job_date = date_type.fromisoformat(first.date)
    except (ValueError, TypeError):
        await whatsapp_service.send_text(phone, t("ask_missing_date", lang))
        return

    start_time_str = f"\nStart: {first.start_time}" if first.start_time else ""
    req_lines = "\n".join(f"• {_skill_label(p.skill, lang)}: {p.count}" for p in parsed_list)
    date_str = job_date.strftime("%d %b %Y")

    session.context = {
        "lang": lang,
        "pending_jobs": [
            {"skill": p.skill, "count": p.count, "city": p.city,
             "date": p.date, "rate": p.rate, "start_time": p.start_time}
            for p in parsed_list
        ],
    }
    session.bot_state = BotState.con_awaiting_confirm
    db.commit()

    msgs = {
        "en": (
            f"📋 *Confirm Job Posting*\n\nWorkers needed:\n{req_lines}\n\n"
            f"City: {first.city}\nDate: {date_str}\nRate: ₹{first.rate}/day{start_time_str}\n\n"
            f"Reply *YES* to post | *NO* to cancel"
        ),
        "te": (
            f"📋 *పని పోస్టింగ్ నిర్ధారించండి*\n\nకావలసిన కార్మికులు:\n{req_lines}\n\n"
            f"నగరం: {first.city}\nతేదీ: {date_str}\nరేటు: ₹{first.rate}/రోజు{start_time_str}\n\n"
            f"*YES* పోస్ట్ చేయడానికి | *NO* రద్దు చేయడానికి"
        ),
        "hi": (
            f"📋 *काम पोस्ट की पुष्टि करें*\n\nचाहिए:\n{req_lines}\n\n"
            f"शहर: {first.city}\nतारीख: {date_str}\nरेट: ₹{first.rate}/दिन{start_time_str}\n\n"
            f"*YES* पोस्ट करने के लिए | *NO* रद्द करने के लिए"
        ),
    }
    await whatsapp_service.send_text(phone, msgs.get(lang, msgs["en"]))


async def _handle_job_confirm(
    phone: str, text: str, session: WhatsAppSession, lang: str,
    db: Session, background_tasks: BackgroundTasks
) -> None:
    upper = text.upper()
    if upper not in ("YES", "NO", "Y", "N", "HA", "HAN", "AVUNU"):
        await whatsapp_service.send_text(phone, "Reply *YES* to post or *NO* to cancel.")
        return

    if upper in ("NO", "N"):
        session.bot_state = BotState.contractor
        session.context = {"lang": lang}
        db.commit()
        await whatsapp_service.send_text(phone, t("con_job_cancelled", lang))
        return

    pj_list = session.context.get("pending_jobs", [])
    contractor = db.query(Contractor).filter(Contractor.phone == phone).first()
    if not contractor or not pj_list:
        session.bot_state = BotState.contractor
        session.context = {"lang": lang}
        db.commit()
        await whatsapp_service.send_text(phone, t("con_parse_error", lang))
        return

    try:
        first = pj_list[0]
        job_date = date_type.fromisoformat(first["date"])
        start_time = None
        if first.get("start_time"):
            h, m = map(int, first["start_time"].split(":"))
            start_time = time_type(h, m)
    except Exception:
        session.bot_state = BotState.contractor
        db.commit()
        await whatsapp_service.send_text(phone, t("con_parse_error", lang))
        return

    created_job_ids = []
    for pj in pj_list:
        job = Job(
            contractor_id=contractor.contractor_id,
            skill=SkillEnum(pj["skill"]),
            required_count=pj["count"],
            job_date=job_date,
            rate=first["rate"],
            location=first["city"],
            city=first["city"],
            start_time=start_time,
            expires_at=datetime.combine(job_date, time_type(23, 59, 59)),
        )
        db.add(job)
        db.flush()
        created_job_ids.append(job.job_id)

    session.bot_state = BotState.contractor
    session.context = {"lang": lang}
    db.commit()

    await whatsapp_service.send_text(phone, t("con_job_posted", lang, city=first["city"]))

    from app.services.notification_service import notify_jobs_background
    background_tasks.add_task(notify_jobs_background, [str(jid) for jid in created_job_ids])


async def _handle_job_response(phone: str, text: str, session: WhatsAppSession, lang: str, db: Session) -> None:
    if text not in ("1", "2"):
        await whatsapp_service.send_text(phone, t("invalid_response", lang))
        return

    job_id = session.pending_job_id
    if not job_id:
        await whatsapp_service.send_text(phone, t("job_expired", lang))
        session.bot_state = BotState.registered
        db.commit()
        return

    worker = db.query(Worker).filter(Worker.phone == phone).first()
    job = db.query(Job).filter(Job.job_id == job_id).first()

    if not worker or not job or job.status != JobStatus.open:
        await whatsapp_service.send_text(phone, t("job_not_available", lang))
        session.bot_state = BotState.registered
        session.pending_job_id = None
        db.commit()
        return

    application = db.query(Application).filter(
        Application.job_id == job_id, Application.worker_id == worker.worker_id
    ).first()

    if text == "1":
        if job.confirmed_count >= job.required_count:
            await whatsapp_service.send_text(phone, t("job_filled", lang))
        else:
            if application:
                application.status = ApplicationStatus.accepted
            else:
                application = Application(
                    job_id=job_id, worker_id=worker.worker_id, status=ApplicationStatus.accepted
                )
                db.add(application)

            job.confirmed_count += 1
            now_filled = job.confirmed_count >= job.required_count
            if now_filled:
                job.status = JobStatus.filled

            notification = db.query(Notification).filter(
                Notification.job_id == job_id, Notification.worker_id == worker.worker_id
            ).first()
            if notification:
                notification.status = NotificationStatus.delivered

            start_time_str = (
                f"\nStart: {job.start_time.strftime('%I:%M %p')}" if job.start_time else ""
            )
            skill_label = _skill_label(job.skill.value, lang)
            contractor = job.contractor
            contractor_info = ""
            if contractor:
                contractor_info = {
                    "en": f"Contractor: *{contractor.name}*\n📱 {contractor.phone}\n\n",
                    "te": f"కాంట్రాక్టర్: *{contractor.name}*\n📱 {contractor.phone}\n\n",
                    "hi": f"ठेकेदार: *{contractor.name}*\n📱 {contractor.phone}\n\n",
                }.get(lang, f"Contractor: *{contractor.name}*\n📱 {contractor.phone}\n\n")
            await whatsapp_service.send_text(
                phone,
                t("job_confirmed", lang,
                  date=job.job_date.strftime("%d %B %Y"), location=job.location,
                  city=job.city, rate=job.rate, start_time=start_time_str,
                  skill=skill_label, contractor_info=contractor_info)
            )

            await _notify_contractor(job, worker, now_filled, db)
    else:
        if application:
            application.status = ApplicationStatus.rejected
        else:
            db.add(Application(job_id=job_id, worker_id=worker.worker_id, status=ApplicationStatus.rejected))
        await whatsapp_service.send_text(phone, t("job_rejected", lang))

    session.bot_state = BotState.registered
    session.pending_job_id = None
    db.commit()


async def _notify_contractor(job: Job, worker: Worker, fully_filled: bool, db: Session) -> None:
    try:
        contractor = job.contractor
        if not contractor:
            return
        con_phone = contractor.phone

        con_session = db.query(WhatsAppSession).filter(WhatsAppSession.phone == con_phone).first()
        con_lang = con_session.context.get("lang", "en") if con_session else "en"
        skill_label = _skill_label(job.skill.value, con_lang)
        date_str = job.job_date.strftime("%d %b %Y")

        if fully_filled:
            msg = t("con_job_filled_action", con_lang,
                    required=job.required_count, skill=skill_label,
                    city=job.city, date=date_str)
            await whatsapp_service.send_text(con_phone, msg)
        else:
            msg = t("con_worker_action", con_lang,
                    name=worker.name, skill=skill_label, phone=worker.phone,
                    confirmed=job.confirmed_count, required=job.required_count,
                    city=job.city, date=date_str)
            await whatsapp_service.send_text(con_phone, msg)

            if not con_session:
                con_session = WhatsAppSession(
                    phone=con_phone, bot_state=BotState.contractor, context={}
                )
                db.add(con_session)
            con_session.context = {
                **con_session.context,
                "worker_action": {"name": worker.name, "phone": worker.phone},
            }
    except Exception as e:
        logger.error("Failed to notify contractor: %s", e)


async def _handle_worker_action(phone: str, text: str, action: dict,
                                 session: WhatsAppSession, lang: str, db: Session) -> None:
    worker_name = action["name"]
    worker_phone = action["phone"]

    if text in ("1", "2"):
        session.context = {
            k: v for k, v in {**session.context, "collecting_message_for": action}.items()
            if k != "worker_action"
        }
        db.commit()
        await whatsapp_service.send_text(phone, t("con_ask_message", lang, name=worker_name))
    else:
        session.context = {k: v for k, v in session.context.items() if k != "worker_action"}
        db.commit()
        await whatsapp_service.send_text(
            phone,
            {"en": f"OK. Call *{worker_name}* at 📱 {worker_phone} directly.",
             "te": f"సరే. *{worker_name}*కి నేరుగా కాల్ చేయండి 📱 {worker_phone}",
             "hi": f"ठीक है। *{worker_name}* को सीधे call करें 📱 {worker_phone}"}.get(lang,
             f"OK. Call *{worker_name}* at 📱 {worker_phone} directly.")
        )


async def _send_message_to_worker(phone: str, text: str, action: dict,
                                   session: WhatsAppSession, lang: str, db: Session) -> None:
    worker_name = action["name"]
    worker_phone = action["phone"]

    worker_session = db.query(WhatsAppSession).filter(WhatsAppSession.phone == worker_phone).first()
    worker_lang = worker_session.context.get("lang", "en") if worker_session else "en"

    await whatsapp_service.send_text(
        worker_phone,
        t("worker_message_from_contractor", worker_lang, message=text)
    )
    session.context = {k: v for k, v in session.context.items() if k != "collecting_message_for"}
    db.commit()
    await whatsapp_service.send_text(phone, t("con_message_sent", lang, name=worker_name))


def _resolve_city(text: str) -> str:
    text_lower = text.lower().strip()
    if text.isdigit():
        idx = int(text) - 1
        if 0 <= idx < len(AP_CITIES):
            return AP_CITIES[idx]
    for city in AP_CITIES:
        if city.lower() == text_lower or city.lower().startswith(text_lower[:4]):
            return city
    return text.strip().title()
