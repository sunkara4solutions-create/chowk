"""
Webhook endpoint for incoming WhatsApp messages.
Supports both Meta Cloud API and Twilio.
"""
from fastapi import APIRouter, Request, Response, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.config import settings
from app.services.bot_service import handle_incoming

router = APIRouter(prefix="/webhooks/whatsapp", tags=["whatsapp"])


@router.get("")
def verify_webhook(request: Request):
    """Meta Cloud API webhook verification."""
    params = dict(request.query_params)
    if (
        params.get("hub.mode") == "subscribe"
        and params.get("hub.verify_token") == settings.META_WEBHOOK_VERIFY_TOKEN
    ):
        return Response(content=params.get("hub.challenge", ""), media_type="text/plain")
    raise HTTPException(status_code=403, detail="Verification failed")


@router.post("/meta")
async def meta_webhook(request: Request, db: Session = Depends(get_db)):
    """Handles incoming messages from Meta Cloud API."""
    from app.services.whatsapp_service import whatsapp_service
    payload = await request.json()

    # Meta sends notifications for many event types; only process messages
    try:
        entry = payload.get("entry", [{}])[0]
        changes = entry.get("changes", [{}])[0]
        value = changes.get("value", {})
        if "messages" not in value:
            return {"status": "ignored"}
    except (IndexError, KeyError):
        return {"status": "ignored"}

    msg = whatsapp_service.parse_incoming_meta(payload)
    if msg and msg.body:
        await handle_incoming(msg.from_phone, msg.body, db)

    return {"status": "ok"}


@router.post("/twilio")
async def twilio_webhook(request: Request, db: Session = Depends(get_db)):
    """Handles incoming messages from Twilio WhatsApp Sandbox."""
    from app.services.whatsapp_service import whatsapp_service
    form = await request.form()
    form_data = dict(form)

    msg = whatsapp_service.parse_incoming_twilio(form_data)
    if msg and msg.body:
        await handle_incoming(msg.from_phone, msg.body, db)

    # Twilio expects TwiML or empty 200 response
    return Response(content="", media_type="text/xml")
