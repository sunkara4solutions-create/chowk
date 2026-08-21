"""
Setu OKYC (Aadhaar OTP) service.

Mock mode: SETU_CLIENT_ID not set → accepts any valid Aadhaar, OTP "123456".
Real mode: set SETU_CLIENT_ID, SETU_CLIENT_SECRET, SETU_PRODUCT_INSTANCE_ID in env.

Real flow:
  1. initiate(aadhaar)  → returns captcha image (base64) + request_id
  2. verify(request_id, aadhaar, captcha_code)  → sends OTP to Aadhaar-linked mobile
  3. complete(request_id, otp, share_code)  → returns verified name + last4
"""
import os
import logging
import httpx

logger = logging.getLogger(__name__)

SETU_BASE = os.getenv("SETU_BASE_URL", "https://dg-sandbox.setu.co")
CLIENT_ID = os.getenv("SETU_CLIENT_ID", "")
CLIENT_SECRET = os.getenv("SETU_CLIENT_SECRET", "")
PRODUCT_INSTANCE_ID = os.getenv("SETU_PRODUCT_INSTANCE_ID", "")

MOCK_MODE = not CLIENT_ID

_HEADERS = {
    "x-client-id": CLIENT_ID,
    "x-client-secret": CLIENT_SECRET,
    "x-product-instance-id": PRODUCT_INSTANCE_ID,
    "Content-Type": "application/json",
}

# In-memory store for mock sessions {request_id: aadhaar_number}
_mock_sessions: dict[str, str] = {}


async def initiate_okyc() -> dict:
    """Step 1 — create OKYC session. Returns {request_id, captcha_image (base64)}."""
    if MOCK_MODE:
        import uuid, base64
        request_id = str(uuid.uuid4())
        # Tiny 1×1 transparent PNG as placeholder captcha
        fake_captcha = base64.b64encode(
            b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01"
            b"\x08\x02\x00\x00\x00\x90wS\xde\x00\x00\x00\x0cIDATx\x9cc\xf8\x0f\x00"
            b"\x00\x01\x01\x00\x05\x18\xd8N\x00\x00\x00\x00IEND\xaeB`\x82"
        ).decode()
        _mock_sessions[request_id] = ""
        return {"request_id": request_id, "captcha_image": fake_captcha, "mock": True}

    async with httpx.AsyncClient() as client:
        r = await client.post(f"{SETU_BASE}/api/okyc", headers=_HEADERS,
                              json={"redirectURL": "https://chowk.app/aadhaar/callback"})
        r.raise_for_status()
        data = r.json()
        return {"request_id": data["id"], "captcha_image": None, "mock": False}


async def verify_aadhaar(request_id: str, aadhaar_number: str, captcha_code: str) -> dict:
    """Step 2 — submit Aadhaar + captcha → OTP sent to Aadhaar-linked mobile."""
    if len(aadhaar_number) != 12 or not aadhaar_number.isdigit():
        raise ValueError("Aadhaar must be a 12-digit number")

    if MOCK_MODE:
        _mock_sessions[request_id] = aadhaar_number
        logger.info(f"[MOCK SETU] OTP sent for Aadhaar ***{aadhaar_number[-4:]}")
        return {"success": True, "message": "OTP sent to Aadhaar-linked mobile"}

    async with httpx.AsyncClient() as client:
        r = await client.post(
            f"{SETU_BASE}/api/okyc/{request_id}/verify",
            headers=_HEADERS,
            json={"aadhaarNumber": aadhaar_number, "captchaCode": captcha_code},
        )
        r.raise_for_status()
        return {"success": True, "message": "OTP sent to Aadhaar-linked mobile"}


async def complete_okyc(request_id: str, otp: str, share_code: str) -> dict:
    """Step 3 — submit OTP + shareCode → returns {verified: bool, name, aadhaar_last4}."""
    if MOCK_MODE:
        if otp != "123456":
            raise ValueError("Invalid OTP")
        aadhaar = _mock_sessions.get(request_id, "999999990019")
        _mock_sessions.pop(request_id, None)
        return {
            "verified": True,
            "name": "Verified User",
            "aadhaar_last4": aadhaar[-4:],
        }

    async with httpx.AsyncClient() as client:
        r = await client.post(
            f"{SETU_BASE}/api/okyc/{request_id}/complete",
            headers=_HEADERS,
            json={"otp": otp, "shareCode": share_code},
        )
        r.raise_for_status()
        data = r.json()
        identity = data.get("data", {}).get("aadhaarData", {})
        masked = identity.get("maskedAadhaarNumber", "XXXXXXXX0000")
        return {
            "verified": True,
            "name": identity.get("name", ""),
            "aadhaar_last4": masked[-4:],
        }
