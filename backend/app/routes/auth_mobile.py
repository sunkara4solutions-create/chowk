"""
Mobile OTP authentication via Twilio Verify (SMS).
Flow: send-otp → verify-otp → (register/worker or register/contractor if new user)
"""
import uuid
import logging
from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.config import settings
from app.models import Worker, Contractor, DeviceToken
from app.schemas import (
    OtpRequest, OtpVerify, WorkerRegister, ContractorRegisterMobile,
    MobileTokenResponse, DeviceTokenRequest, WorkerOut, ContractorOut,
)
from app.core.auth import create_token, hash_password, get_any_mobile_user

router = APIRouter(prefix="/auth", tags=["auth-mobile"])
logger = logging.getLogger(__name__)


def _twilio_client():
    from twilio.rest import Client
    return Client(settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN)


def _e164(phone: str) -> str:
    return f"+91{phone}" if len(phone) == 10 else f"+{phone}"


TEST_PHONE = "9999999999"
TEST_OTP = "123456"


async def _send_twilio_otp(phone: str) -> None:
    if phone == TEST_PHONE:
        return  # test account — no SMS needed
    if not settings.TWILIO_VERIFY_SID:
        raise HTTPException(status_code=503, detail="OTP service not configured.")
    try:
        client = _twilio_client()
        client.verify.v2.services(settings.TWILIO_VERIFY_SID).verifications.create(
            to=_e164(phone),
            channel="sms",
        )
    except Exception as e:
        logger.error("Twilio OTP send failed for %s: %s", phone, e)
        raise HTTPException(status_code=502, detail="Failed to send OTP. Please try again.")


def _verify_twilio_otp(phone: str, code: str) -> bool:
    if phone == TEST_PHONE:
        return code == TEST_OTP
    # Accept 123456 in mock/dev mode (no Verify SID configured)
    if not settings.TWILIO_VERIFY_SID:
        return code == "123456"
    try:
        client = _twilio_client()
        check = client.verify.v2.services(settings.TWILIO_VERIFY_SID).verification_checks.create(
            to=_e164(phone),
            code=code,
        )
        return check.status == "approved"
    except Exception as e:
        logger.error("Twilio OTP verify failed for %s: %s", phone, e)
        return False


@router.post("/send-otp", status_code=200)
async def send_otp(body: OtpRequest, db: Session = Depends(get_db)):
    await _send_twilio_otp(body.phone)
    return {"message": "OTP sent via SMS"}


@router.post("/verify-otp", response_model=MobileTokenResponse)
async def verify_otp(body: OtpVerify, db: Session = Depends(get_db)):
    if not _verify_twilio_otp(body.phone, body.otp):
        raise HTTPException(status_code=400, detail="Invalid or expired OTP")

    worker = db.query(Worker).filter(Worker.phone == body.phone).first()
    if worker and worker.is_active:
        token = create_token({"sub": body.phone, "role": "worker"})
        return MobileTokenResponse(
            access_token=token,
            role="worker",
            profile=WorkerOut.model_validate(worker).model_dump(mode="json"),
        )

    contractor = db.query(Contractor).filter(Contractor.phone == body.phone).first()
    if contractor and contractor.is_active:
        token = create_token({"sub": body.phone, "role": "contractor"})
        return MobileTokenResponse(
            access_token=token,
            role="contractor",
            profile=ContractorOut.model_validate(contractor).model_dump(mode="json"),
        )

    token = create_token({"sub": body.phone, "role": "new"})
    return MobileTokenResponse(access_token=token, role="new", profile=None)


@router.post("/register/worker", response_model=MobileTokenResponse)
async def register_worker(
    body: WorkerRegister,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    payload: dict = Depends(get_any_mobile_user),
):
    phone = payload.get("sub")
    if not phone:
        raise HTTPException(status_code=401, detail="Invalid token")

    is_new = False
    worker = db.query(Worker).filter(Worker.phone == phone).first()
    if worker:
        worker.name = body.name
        worker.skills = body.skills
        worker.city = body.city
        worker.experience = body.experience
        worker.daily_rate = body.daily_rate
        worker.is_active = True
        worker.phone_verified = True
    else:
        is_new = True
        worker = Worker(
            name=body.name,
            phone=phone,
            skills=body.skills,
            city=body.city,
            experience=body.experience,
            daily_rate=body.daily_rate,
            phone_verified=True,
        )
        db.add(worker)

    db.commit()
    db.refresh(worker)

    if is_new:
        from app.services.notification_service import notify_worker_of_existing_jobs, notify_contractor_of_late_worker
        background_tasks.add_task(notify_worker_of_existing_jobs, str(worker.worker_id))
        background_tasks.add_task(notify_contractor_of_late_worker, str(worker.worker_id))

    token = create_token({"sub": phone, "role": "worker"})
    return MobileTokenResponse(
        access_token=token,
        role="worker",
        profile=WorkerOut.model_validate(worker).model_dump(mode="json"),
    )


@router.post("/register/contractor", response_model=MobileTokenResponse)
def register_contractor(
    body: ContractorRegisterMobile,
    db: Session = Depends(get_db),
    payload: dict = Depends(get_any_mobile_user),
):
    phone = payload.get("sub")
    if not phone:
        raise HTTPException(status_code=401, detail="Invalid token")

    contractor = db.query(Contractor).filter(Contractor.phone == phone).first()
    if contractor:
        contractor.name = body.name
        contractor.company_name = body.company_name
        contractor.city = body.city
        contractor.is_active = True
    else:
        contractor = Contractor(
            name=body.name,
            phone=phone,
            company_name=body.company_name,
            city=body.city,
            password_hash=hash_password(str(uuid.uuid4())),
        )
        db.add(contractor)

    db.commit()
    db.refresh(contractor)

    token = create_token({"sub": phone, "role": "contractor"})
    return MobileTokenResponse(
        access_token=token,
        role="contractor",
        profile=ContractorOut.model_validate(contractor).model_dump(mode="json"),
    )


@router.post("/device-token", status_code=200)
def register_device_token(
    body: DeviceTokenRequest,
    db: Session = Depends(get_db),
    payload: dict = Depends(get_any_mobile_user),
):
    phone = payload.get("sub")
    if not phone:
        raise HTTPException(status_code=401, detail="Invalid token")

    existing = db.query(DeviceToken).filter(
        DeviceToken.phone == phone,
        DeviceToken.token == body.token,
    ).first()
    if not existing:
        db.add(DeviceToken(phone=phone, token=body.token, platform=body.platform))
        db.commit()
    return {"message": "Device token registered"}
