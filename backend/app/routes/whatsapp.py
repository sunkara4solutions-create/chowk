"""
Webhook endpoint for incoming WhatsApp messages.
Supports both Meta Cloud API and Twilio.
"""
import logging
from fastapi import APIRouter, BackgroundTasks, Request, Response, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.config import settings
from app.models import ProcessedMessage
from app.services.bot_service import handle_incoming

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/webhooks/whatsapp", tags=["whatsapp"])


def _verify_meta(request: Request):
    params = dict(request.query_params)
    if (
        params.get("hub.mode") == "subscribe"
        and params.get("hub.verify_token") == settings.META_WEBHOOK_VERIFY_TOKEN
    ):
        return Response(content=params.get("hub.challenge", ""), media_type="text/plain")
    raise HTTPException(status_code=403, detail="Verification failed")


@router.get("")
def verify_webhook(request: Request):
    return _verify_meta(request)


@router.get("/meta")
def verify_webhook_meta(request: Request):
    return _verify_meta(request)


def _is_duplicate(db: Session, message_id: str) -> bool:
    """Returns True if we've already processed this message (deduplication)."""
    if db.query(ProcessedMessage).filter(ProcessedMessage.message_id == message_id).first():
        return True
    db.add(ProcessedMessage(message_id=message_id))
    db.commit()
    return False


@router.post("/meta")
async def meta_webhook(
    request: Request,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
):
    """Handles incoming messages from Meta Cloud API."""
    from app.services.whatsapp_service import whatsapp_service
    payload = await request.json()

    try:
        entry = payload.get("entry", [{}])[0]
        changes = entry.get("changes", [{}])[0]
        value = changes.get("value", {})
        if "messages" not in value:
            return {"status": "ignored"}
        message_id = value["messages"][0].get("id", "")
    except (IndexError, KeyError):
        return {"status": "ignored"}

    if message_id and _is_duplicate(db, message_id):
        return {"status": "duplicate"}

    msg = whatsapp_service.parse_incoming_meta(payload)
    if msg and msg.body:
        try:
            await handle_incoming(msg.from_phone, msg.body, db, background_tasks)
        except Exception as e:
            logger.error("handle_incoming error for %s: %s", msg.from_phone, e, exc_info=True)

    return {"status": "ok"}


@router.post("/twilio")
async def twilio_webhook(
    request: Request,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
):
    """Handles incoming messages from Twilio WhatsApp Sandbox."""
    from app.services.whatsapp_service import whatsapp_service
    form = await request.form()
    form_data = dict(form)

    message_id = form_data.get("MessageSid", "")
    if message_id and _is_duplicate(db, message_id):
        return Response(content="", media_type="text/xml")

    msg = whatsapp_service.parse_incoming_twilio(form_data)
    if msg and msg.body:
        await handle_incoming(msg.from_phone, msg.body, db, background_tasks)

    return Response(content="", media_type="text/xml")
