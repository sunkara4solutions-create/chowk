from datetime import datetime, timedelta
from typing import List
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, status
from sqlalchemy.orm import Session, joinedload
from app.database import get_db
from app.models import Contractor, Job, Application, Notification, JobStatus
from app.schemas import JobCreate, JobOut, JobWithApplications, ApplicationOut, DashboardStats
from app.core.auth import get_current_contractor
from app.services.notification_service import send_job_notifications

router = APIRouter(prefix="/jobs", tags=["jobs"])


def _job_to_out(job: Job) -> JobOut:
    data = JobOut.model_validate(job)
    data.fill_percentage = (
        round((job.confirmed_count / job.required_count) * 100, 1)
        if job.required_count > 0 else 0.0
    )
    return data


@router.post("", response_model=JobOut, status_code=status.HTTP_201_CREATED)
async def create_job(
    body: JobCreate,
    background_tasks: BackgroundTasks,
    contractor: Contractor = Depends(get_current_contractor),
    db: Session = Depends(get_db),
):
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
        expires_at=datetime.utcnow() + timedelta(hours=18),
    )
    db.add(job)
    db.commit()
    db.refresh(job)

    background_tasks.add_task(send_job_notifications, job.job_id, db)

    return _job_to_out(job)


@router.get("", response_model=List[JobOut])
def list_jobs(contractor: Contractor = Depends(get_current_contractor), db: Session = Depends(get_db)):
    jobs = (
        db.query(Job)
        .filter(Job.contractor_id == contractor.contractor_id)
        .order_by(Job.created_at.desc())
        .all()
    )
    return [_job_to_out(j) for j in jobs]


@router.get("/dashboard-stats", response_model=DashboardStats)
def dashboard_stats(contractor: Contractor = Depends(get_current_contractor), db: Session = Depends(get_db)):
    jobs = db.query(Job).filter(Job.contractor_id == contractor.contractor_id).all()
    active = [j for j in jobs if j.status == JobStatus.open]
    total_notified = (
        db.query(Notification)
        .join(Job)
        .filter(Job.contractor_id == contractor.contractor_id)
        .count()
    )
    total_confirmed = sum(j.confirmed_count for j in jobs)
    fill_rates = [
        j.confirmed_count / j.required_count
        for j in jobs if j.required_count > 0
    ]
    avg_fill = round(sum(fill_rates) / len(fill_rates) * 100, 1) if fill_rates else 0.0

    return DashboardStats(
        total_jobs=len(jobs),
        active_jobs=len(active),
        total_workers_notified=total_notified,
        total_confirmed=total_confirmed,
        avg_fill_rate=avg_fill,
    )


@router.get("/{job_id}", response_model=JobWithApplications)
def get_job(job_id: str, contractor: Contractor = Depends(get_current_contractor), db: Session = Depends(get_db)):
    job = (
        db.query(Job)
        .options(joinedload(Job.applications).joinedload(Application.worker))
        .filter(Job.job_id == job_id, Job.contractor_id == contractor.contractor_id)
        .first()
    )
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    out = JobWithApplications.model_validate(job)
    out.fill_percentage = (
        round((job.confirmed_count / job.required_count) * 100, 1)
        if job.required_count > 0 else 0.0
    )
    return out


@router.post("/{job_id}/cancel")
def cancel_job(job_id: str, contractor: Contractor = Depends(get_current_contractor), db: Session = Depends(get_db)):
    job = db.query(Job).filter(Job.job_id == job_id, Job.contractor_id == contractor.contractor_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    job.status = JobStatus.cancelled
    db.commit()
    return {"message": "Job cancelled"}
