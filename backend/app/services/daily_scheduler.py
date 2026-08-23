"""
Daily scheduled messages via Meta WhatsApp templates.

Templates must be approved in Meta Business Manager before use.
Run this as a cron job on EC2:
  # Worker availability check at 7 AM IST (1:30 AM UTC)
  30 1 * * * cd /opt/chowk/backend && source venv/bin/activate && python -m app.services.daily_scheduler workers
  # Contractor job reminder at 7 AM IST
  30 1 * * * cd /opt/chowk/backend && source venv/bin/activate && python -m app.services.daily_scheduler contractors
"""
import sys
import asyncio
import logging
from datetime import datetime, date
from sqlalchemy.orm import Session

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# --- Template names (must match exactly what's approved in Meta Business Manager) ---
# Create these templates at business.facebook.com → WhatsApp Manager → Message Templates
WORKER_AVAILABILITY_TEMPLATE = "worker_daily_availability"
CONTRACTOR_JOB_REMINDER_TEMPLATE = "contractor_daily_job_reminder"


async def send_worker_availability_checks(db: Session) -> int:
    """Send daily availability check to all active workers."""
    from app.models import Worker
    from app.services.whatsapp_service import whatsapp_service

    workers = db.query(Worker).filter(Worker.is_active == True).all()
    sent = 0
    for worker in workers:
        try:
            await whatsapp_service.send_template(
                phone=worker.phone,
                template_name=WORKER_AVAILABILITY_TEMPLATE,
                language="en",
                components=[
                    {
                        "type": "body",
                        "parameters": [{"type": "text", "text": worker.name.split()[0]}],
                    }
                ],
            )
            sent += 1
        except Exception as e:
            logger.error("Failed to send availability check to %s: %s", worker.phone, e)

    logger.info("Sent availability checks to %d/%d workers", sent, len(workers))
    return sent


async def send_contractor_job_reminders(db: Session) -> int:
    """Send daily job requirement reminder to all active contractors."""
    from app.models import Contractor
    from app.services.whatsapp_service import whatsapp_service

    contractors = db.query(Contractor).filter(Contractor.is_active == True).all()
    sent = 0
    for contractor in contractors:
        try:
            await whatsapp_service.send_template(
                phone=contractor.phone,
                template_name=CONTRACTOR_JOB_REMINDER_TEMPLATE,
                language="en",
                components=[
                    {
                        "type": "body",
                        "parameters": [{"type": "text", "text": contractor.name.split()[0]}],
                    }
                ],
            )
            sent += 1
        except Exception as e:
            logger.error("Failed to send job reminder to %s: %s", contractor.phone, e)

    logger.info("Sent job reminders to %d/%d contractors", sent, len(contractors))
    return sent


async def main(target: str) -> None:
    from app.database import SessionLocal
    db = SessionLocal()
    try:
        if target == "workers":
            await send_worker_availability_checks(db)
        elif target == "contractors":
            await send_contractor_job_reminders(db)
        else:
            logger.error("Unknown target: %s. Use 'workers' or 'contractors'", target)
    finally:
        db.close()


if __name__ == "__main__":
    target = sys.argv[1] if len(sys.argv) > 1 else "workers"
    asyncio.run(main(target))
