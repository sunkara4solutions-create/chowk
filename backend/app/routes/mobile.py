"""
Mobile app API — all endpoints for the React Native Chowk app.
"""
import math
import logging
from datetime import date, timedelta
from typing import Optional, List
from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import (
    Worker, Contractor, Job, Application, Notification,
    JobStatus, ApplicationStatus, SkillEnum,
)
from app.schemas import (
    WorkerOut, ContractorOut, JobOutMobile, ApplicantOut, WorkerApplicationOut,
    NearbyWorkerOut, WorkerProfileUpdate, ContractorProfileUpdate,
    LocationUpdate, ApplicationStatusUpdate, JobCreateMobile,
    AadhaarInitiateResponse, AadhaarVerifyRequest, AadhaarCompleteRequest,
    WorkerPreferences,
)
from app.core.auth import get_current_worker, get_mobile_contractor, get_any_mobile_user

router = APIRouter(prefix="/mobile", tags=["mobile"])
logger = logging.getLogger(__name__)


def _haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    R = 6371.0
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = math.sin(dlat / 2) ** 2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2) ** 2
    return R * 2 * math.asin(math.sqrt(a))


async def _notify_contractor_new_application(
    contractor_phone: str, worker_name: str, skill: str, job_date: str, city: str
) -> None:
    try:
        from app.services.whatsapp_service import whatsapp_service
        skill_label = skill.replace("_", " ").title()
        msg = (
            f"📋 *New Application on Chowk*\n\n"
            f"*{worker_name}* has applied for your *{skill_label}* job in {city} on {job_date}.\n\n"
            f"Open the Chowk app to review and accept/reject."
        )
        await whatsapp_service.send_text(contractor_phone, msg)
    except Exception as e:
        logger.error("Failed to notify contractor %s: %s", contractor_phone, e)


# ── Worker: profile ───────────────────────────────────────────────────────────

@router.get("/worker/me", response_model=WorkerOut)
def worker_me(worker: Worker = Depends(get_current_worker)):
    return WorkerOut.model_validate(worker)


@router.patch("/worker/me", response_model=WorkerOut)
def update_worker_profile(
    body: WorkerProfileUpdate,
    db: Session = Depends(get_db),
    worker: Worker = Depends(get_current_worker),
):
    for field, value in body.model_dump(exclude_none=True).items():
        setattr(worker, field, value)
    db.commit()
    db.refresh(worker)
    return WorkerOut.model_validate(worker)


@router.patch("/worker/location", status_code=200)
def update_worker_location(
    body: LocationUpdate,
    db: Session = Depends(get_db),
    worker: Worker = Depends(get_current_worker),
):
    worker.latitude = body.latitude
    worker.longitude = body.longitude
    worker.location_verified = body.city_verified
    db.commit()
    return {"message": "Location updated", "location_verified": body.city_verified}


@router.patch("/worker/preferences", status_code=200)
def update_worker_preferences(
    body: WorkerPreferences,
    db: Session = Depends(get_db),
    worker: Worker = Depends(get_current_worker),
):
    if body.whatsapp_primary is not None:
        worker.whatsapp_primary = body.whatsapp_primary
    if body.referral_source is not None:
        worker.referral_source = body.referral_source
    db.commit()
    return {"whatsapp_primary": worker.whatsapp_primary}


@router.patch("/contractor/preferences", status_code=200)
def update_contractor_preferences(
    body: WorkerPreferences,
    db: Session = Depends(get_db),
    contractor: Contractor = Depends(get_mobile_contractor),
):
    if body.whatsapp_primary is not None:
        contractor.whatsapp_primary = body.whatsapp_primary
    if body.referral_source is not None:
        contractor.referral_source = body.referral_source
    db.commit()
    return {"whatsapp_primary": contractor.whatsapp_primary}


# ── Worker: job feed ──────────────────────────────────────────────────────────

@router.get("/jobs", response_model=dict)
def job_feed(
    skill: Optional[str] = None,
    city: Optional[str] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    worker: Worker = Depends(get_current_worker),
):
    today = date.today()
    q = db.query(Job).filter(Job.status == JobStatus.open, Job.job_date >= today)

    if city:
        q = q.filter(Job.city.ilike(f"%{city}%"))
    elif worker.city:
        q = q.filter(Job.city.ilike(f"%{worker.city}%"))

    jobs = q.order_by(Job.job_date).all()

    if skill:
        jobs = [j for j in jobs if j.skill.value == skill]
    elif worker.skills:
        jobs = [j for j in jobs if j.skill.value in worker.skills]

    total = len(jobs)
    start = (page - 1) * page_size
    page_jobs = jobs[start: start + page_size]

    return {
        "items": [JobOutMobile.model_validate(j).model_dump(mode="json") for j in page_jobs],
        "total": total,
        "page": page,
    }


@router.get("/jobs/nearby", response_model=List[JobOutMobile])
def jobs_nearby(
    lat: float = Query(...),
    lng: float = Query(...),
    radius_km: float = Query(10.0),
    db: Session = Depends(get_db),
    worker: Worker = Depends(get_current_worker),
):
    today = date.today()
    jobs = db.query(Job).filter(
        Job.status == JobStatus.open,
        Job.job_date >= today,
    ).all()

    nearby = []
    for job in jobs:
        # Use city-center coordinates if job has no lat/lng (MVP: match by city string)
        if worker.skills and job.skill.value not in worker.skills:
            continue
        nearby.append(job)

    return [JobOutMobile.model_validate(j) for j in nearby[:50]]


@router.get("/jobs/{job_id}", response_model=JobOutMobile)
def get_job(
    job_id: str,
    db: Session = Depends(get_db),
    worker: Worker = Depends(get_current_worker),
):
    job = db.query(Job).filter(Job.job_id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return JobOutMobile.model_validate(job)


@router.post("/jobs/{job_id}/apply", status_code=200)
async def apply_for_job(
    job_id: str,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    worker: Worker = Depends(get_current_worker),
):
    job = db.query(Job).filter(Job.job_id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    if job.status != JobStatus.open:
        raise HTTPException(status_code=400, detail="Job is no longer open")

    existing = db.query(Application).filter(
        Application.job_id == job.job_id,
        Application.worker_id == worker.worker_id,
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Already applied")

    application = Application(
        job_id=job.job_id,
        worker_id=worker.worker_id,
        status=ApplicationStatus.pending,
    )
    db.add(application)
    db.commit()

    # Gap 2: notify contractor on WhatsApp when worker applies via app
    background_tasks.add_task(
        _notify_contractor_new_application,
        contractor_phone=job.contractor.phone,
        worker_name=worker.name,
        skill=job.skill.value,
        job_date=str(job.job_date),
        city=job.city,
    )

    return {"message": "Applied successfully"}


@router.get("/worker/applications", response_model=List[WorkerApplicationOut])
def my_applications(
    db: Session = Depends(get_db),
    worker: Worker = Depends(get_current_worker),
):
    apps = (
        db.query(Application)
        .filter(Application.worker_id == worker.worker_id)
        .order_by(Application.created_at.desc())
        .all()
    )
    return [WorkerApplicationOut.model_validate(a) for a in apps]


# ── Contractor: profile ───────────────────────────────────────────────────────

@router.get("/contractor/me", response_model=ContractorOut)
def contractor_me(contractor: Contractor = Depends(get_mobile_contractor)):
    return ContractorOut.model_validate(contractor)


@router.patch("/contractor/me", response_model=ContractorOut)
def update_contractor_profile(
    body: ContractorProfileUpdate,
    db: Session = Depends(get_db),
    contractor: Contractor = Depends(get_mobile_contractor),
):
    for field, value in body.model_dump(exclude_none=True).items():
        setattr(contractor, field, value)
    db.commit()
    db.refresh(contractor)
    return ContractorOut.model_validate(contractor)


# ── Contractor: jobs ──────────────────────────────────────────────────────────

@router.get("/contractor/jobs", response_model=List[JobOutMobile])
def contractor_jobs(
    db: Session = Depends(get_db),
    contractor: Contractor = Depends(get_mobile_contractor),
):
    jobs = (
        db.query(Job)
        .filter(Job.contractor_id == contractor.contractor_id)
        .order_by(Job.job_date.desc())
        .all()
    )
    return [JobOutMobile.model_validate(j) for j in jobs]


@router.post("/contractor/jobs", response_model=JobOutMobile, status_code=201)
async def post_job(
    body: JobCreateMobile,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    contractor: Contractor = Depends(get_mobile_contractor),
):
    from datetime import datetime, time as time_type
    job = Job(
        contractor_id=contractor.contractor_id,
        skill=body.skill,
        required_count=body.required_count,
        job_date=body.job_date,
        rate=body.rate,
        location=body.location,
        city=body.city,
        start_time=body.start_time,
        description=body.description,
        expires_at=datetime.combine(body.job_date, time_type(23, 59, 59)),
    )
    db.add(job)
    db.commit()
    db.refresh(job)

    # Gap 1: notify matching workers via WhatsApp
    from app.services.notification_service import notify_jobs_background
    background_tasks.add_task(notify_jobs_background, [str(job.job_id)])

    return JobOutMobile.model_validate(job)


@router.get("/contractor/jobs/{job_id}/applicants", response_model=List[ApplicantOut])
def job_applicants(
    job_id: str,
    db: Session = Depends(get_db),
    contractor: Contractor = Depends(get_mobile_contractor),
):
    job = db.query(Job).filter(
        Job.job_id == job_id,
        Job.contractor_id == contractor.contractor_id,
    ).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return [ApplicantOut.model_validate(a) for a in job.applications]


@router.patch("/contractor/applications/{app_id}", status_code=200)
def update_application(
    app_id: str,
    body: ApplicationStatusUpdate,
    db: Session = Depends(get_db),
    contractor: Contractor = Depends(get_mobile_contractor),
):
    application = db.query(Application).filter(Application.application_id == app_id).first()
    if not application:
        raise HTTPException(status_code=404, detail="Application not found")

    # Verify the application belongs to one of this contractor's jobs
    job = db.query(Job).filter(
        Job.job_id == application.job_id,
        Job.contractor_id == contractor.contractor_id,
    ).first()
    if not job:
        raise HTTPException(status_code=403, detail="Not your job")

    application.status = ApplicationStatus(body.status)
    if body.status == "accepted":
        job.confirmed_count = (
            db.query(Application)
            .filter(Application.job_id == job.job_id, Application.status == ApplicationStatus.accepted)
            .count()
        ) + 1
        if job.confirmed_count >= job.required_count:
            job.status = JobStatus.filled

    db.commit()
    return {"message": f"Application {body.status}"}


# ── Contractor: find workers ──────────────────────────────────────────────────

@router.get("/workers/nearby", response_model=List[NearbyWorkerOut])
def workers_nearby(
    lat: float = Query(...),
    lng: float = Query(...),
    radius_km: float = Query(10.0),
    skill: Optional[str] = None,
    db: Session = Depends(get_db),
    contractor: Contractor = Depends(get_mobile_contractor),
):
    workers = db.query(Worker).filter(
        Worker.is_active == True,
        Worker.is_available == True,
    ).all()

    results = []
    for w in workers:
        if skill and skill not in (w.skills or []):
            continue

        distance = None
        if w.latitude is not None and w.longitude is not None:
            distance = _haversine_km(lat, lng, w.latitude, w.longitude)
            if distance > radius_km:
                continue
        else:
            # No GPS location — include if city matches contractor's city (fallback)
            if w.city.lower() != contractor.city.lower():
                continue

        results.append(NearbyWorkerOut(
            worker_id=w.worker_id,
            name=w.name,
            phone=w.phone,
            skills=w.skills or [],
            city=w.city,
            experience=w.experience,
            daily_rate=w.daily_rate,
            is_available=w.is_available,
            distance_km=round(distance, 1) if distance else None,
            latitude=w.latitude if distance else None,
            longitude=w.longitude if distance else None,
        ))

    results.sort(key=lambda x: x.distance_km or 999)
    return results[:50]


# ── Aadhaar OKYC ─────────────────────────────────────────────────────────────

@router.post("/aadhaar/initiate", response_model=AadhaarInitiateResponse)
async def aadhaar_initiate(payload: dict = Depends(get_any_mobile_user)):
    from app.services.setu_service import initiate_okyc
    result = await initiate_okyc()
    return AadhaarInitiateResponse(**result)


@router.post("/aadhaar/verify-number", status_code=200)
async def aadhaar_verify_number(
    body: AadhaarVerifyRequest,
    payload: dict = Depends(get_any_mobile_user),
):
    from app.services.setu_service import verify_aadhaar
    try:
        await verify_aadhaar(body.request_id, body.aadhaar_number, body.captcha_code)
        return {"message": "OTP sent to your Aadhaar-linked mobile number"}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/aadhaar/complete", status_code=200)
async def aadhaar_complete(
    body: AadhaarCompleteRequest,
    db: Session = Depends(get_db),
    payload: dict = Depends(get_any_mobile_user),
):
    from app.services.setu_service import complete_okyc
    try:
        result = await complete_okyc(body.request_id, body.otp, body.share_code)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    phone = payload.get("sub")
    role = payload.get("role")
    last4 = result["aadhaar_last4"]

    if role == "worker":
        user = db.query(Worker).filter(Worker.phone == phone).first()
    elif role == "contractor":
        from app.models import Contractor
        user = db.query(Contractor).filter(Contractor.phone == phone).first()
    else:
        raise HTTPException(status_code=400, detail="Complete registration before Aadhaar verification")

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.aadhaar_verified = True
    user.aadhaar_last4 = last4
    db.commit()

    return {"verified": True, "aadhaar_last4": last4, "message": "Aadhaar verified successfully"}


@router.delete("/account", status_code=200)
def delete_account(
    db: Session = Depends(get_db),
    payload: dict = Depends(get_any_mobile_user),
):
    phone = payload.get("sub")
    role = payload.get("role")

    if role == "worker":
        worker = db.query(Worker).filter(Worker.phone == phone).first()
        if worker:
            db.query(Notification).filter(Notification.worker_id == worker.worker_id).delete()
            db.query(Application).filter(Application.worker_id == worker.worker_id).delete()
            db.delete(worker)
    elif role == "contractor":
        from app.models import Contractor
        contractor = db.query(Contractor).filter(Contractor.phone == phone).first()
        if contractor:
            for job in db.query(Job).filter(Job.contractor_id == contractor.contractor_id).all():
                db.query(Notification).filter(Notification.job_id == job.job_id).delete()
                db.query(Application).filter(Application.job_id == job.job_id).delete()
                db.delete(job)
            db.delete(contractor)

    from app.models import WhatsAppSession, DeviceToken, OtpCode
    db.query(WhatsAppSession).filter(WhatsAppSession.phone == phone).delete()
    db.query(DeviceToken).filter(DeviceToken.phone == phone).delete()
    db.query(OtpCode).filter(OtpCode.phone == phone).delete()
    db.commit()

    return {"message": "Account deleted successfully"}
