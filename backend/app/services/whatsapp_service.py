import httpx
import logging
from dataclasses import dataclass
from app.config import settings

logger = logging.getLogger(__name__)


@dataclass
class IncomingMessage:
    from_phone: str
    body: str
    message_id: str


class WhatsAppService:
    """Abstraction over Meta Cloud API and Twilio — swap provider via env."""

    async def send_text(self, to: str, body: str) -> str:
        """Returns provider message ID."""
        provider = settings.WHATSAPP_PROVIDER
        if provider == "meta":
            return await self._send_meta(to, body)
        if provider == "twilio":
            return await self._send_twilio(to, body)
        # mock — log and return fake id
        logger.info("[MOCK WhatsApp] To: %s\n%s", to, body)
        return "mock_msg_id"

    async def _send_meta(self, to: str, body: str) -> str:
        url = f"https://graph.facebook.com/v19.0/{settings.META_PHONE_NUMBER_ID}/messages"
        # 10-digit number = Indian local → prepend 91; otherwise already has country code
        to_e164 = f"91{to}" if len(to) == 10 else to
        payload = {
            "messaging_product": "whatsapp",
            "to": to_e164,
            "type": "text",
            "text": {"body": body},
        }
        async with httpx.AsyncClient() as client:
            resp = await client.post(
                url,
                json=payload,
                headers={"Authorization": f"Bearer {settings.META_ACCESS_TOKEN}"},
                timeout=10,
            )
            resp.raise_for_status()
            data = resp.json()
            return data["messages"][0]["id"]

    async def _send_twilio(self, to: str, body: str) -> str:
        url = f"https://api.twilio.com/2010-04-01/Accounts/{settings.TWILIO_ACCOUNT_SID}/Messages.json"
        # to is either a 10-digit Indian number or a full E.164 number (e.g. +16234192471)
        to_wa = f"whatsapp:{to}" if to.startswith("+") else f"whatsapp:+91{to}"
        async with httpx.AsyncClient() as client:
            resp = await client.post(
                url,
                data={
                    "From": settings.TWILIO_WHATSAPP_FROM,
                    "To": to_wa,
                    "Body": body,
                },
                auth=(settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN),
                timeout=10,
            )
            resp.raise_for_status()
            return resp.json()["sid"]

    async def send_template(self, phone: str, template_name: str, language: str, components: list) -> str:
        """Send a Meta-approved template message (works outside 24-hour window)."""
        url = f"https://graph.facebook.com/v19.0/{settings.META_PHONE_NUMBER_ID}/messages"
        to_e164 = f"91{phone}" if len(phone) == 10 else phone
        payload = {
            "messaging_product": "whatsapp",
            "to": to_e164,
            "type": "template",
            "template": {
                "name": template_name,
                "language": {"code": language},
                "components": components,
            },
        }
        async with httpx.AsyncClient() as client:
            resp = await client.post(
                url,
                json=payload,
                headers={"Authorization": f"Bearer {settings.META_ACCESS_TOKEN}"},
                timeout=10,
            )
            resp.raise_for_status()
            return resp.json()["messages"][0]["id"]

    def parse_incoming_meta(self, payload: dict) -> IncomingMessage | None:
        try:
            entry = payload["entry"][0]["changes"][0]["value"]
            msg = entry["messages"][0]
            raw = msg["from"]
            phone = raw[2:] if raw.startswith("91") and len(raw) == 12 else raw
            body = msg.get("text", {}).get("body", "").strip()
            return IncomingMessage(from_phone=phone, body=body, message_id=msg["id"])
        except (KeyError, IndexError):
            return None

    def parse_incoming_twilio(self, form_data: dict) -> IncomingMessage | None:
        try:
            raw = form_data.get("From", "").replace("whatsapp:", "")  # e.g. +919876543210 or +16234192471
            # Strip +91 for Indian numbers so they're stored as 10-digit; keep full E.164 for others
            phone = raw[3:] if raw.startswith("+91") else raw
            body = form_data.get("Body", "").strip()
            message_id = form_data.get("MessageSid", "")
            return IncomingMessage(from_phone=phone, body=body, message_id=message_id)
        except Exception:
            return None


whatsapp_service = WhatsAppService()
