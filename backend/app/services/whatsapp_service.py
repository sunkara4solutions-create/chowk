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
        payload = {
            "messaging_product": "whatsapp",
            "to": f"91{to}",
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
        async with httpx.AsyncClient() as client:
            resp = await client.post(
                url,
                data={
                    "From": settings.TWILIO_WHATSAPP_FROM,
                    "To": f"whatsapp:+91{to}",
                    "Body": body,
                },
                auth=(settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN),
                timeout=10,
            )
            resp.raise_for_status()
            return resp.json()["sid"]

    def parse_incoming_meta(self, payload: dict) -> IncomingMessage | None:
        try:
            entry = payload["entry"][0]["changes"][0]["value"]
            msg = entry["messages"][0]
            phone = msg["from"].lstrip("91")  # strip country code
            body = msg.get("text", {}).get("body", "").strip()
            return IncomingMessage(from_phone=phone, body=body, message_id=msg["id"])
        except (KeyError, IndexError):
            return None

    def parse_incoming_twilio(self, form_data: dict) -> IncomingMessage | None:
        try:
            phone = form_data.get("From", "").replace("whatsapp:+91", "").replace("whatsapp:+", "")
            body = form_data.get("Body", "").strip()
            message_id = form_data.get("MessageSid", "")
            return IncomingMessage(from_phone=phone, body=body, message_id=message_id)
        except Exception:
            return None


whatsapp_service = WhatsAppService()
