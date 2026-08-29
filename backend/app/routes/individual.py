"""
Individual job posting, bidding, and reviews.
Any registered mobile user (worker or contractor) can post small household jobs.
Workers bid with their price. Poster accepts the best bid, marks complete, leaves review.
"""
import logging
from datetime import date, datetime, time as time_type
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.core.auth import get_any_mobile_user, get_current_worker
from app.database import get_db
from app.models import Bid, Contractor, Job, JobStatus, Review, SkillEnum, Worker
from app.schemas import (
    BidCreate, BidOut, IndividualJobCreate, IndividualJobDetail,
    IndividualJobOut, ReviewCreate,
)

router = APIRouter(prefix="/mobile/individual", tags=["individual-jobs"])
logger = logging.getLogger(__name__)


def _require_registered(payload: dict) -> None:
    if payload.get("role") == "new":
        raise HTTPException(status_code=403, detail="Complete registration before posting jobs")


def _poster_name(phone: str, db: Session) -> str:
    worker = db.query(Worker).filter(Worker.phone == phone).first()
    if worker:
        return worker.name
    contractor = db.query(Contractor).filter(Contractor.phone == phone).first()
    if contractor:
        return contractor.name
    return "User"


def _job_out(job: Job) -> IndividualJobOut:
    return IndividualJobOut(
        job_id=job.job_id,
        job_type=job.job_type,
        poster_name=job.poster_name,
        title=job.title,
        skill=job.skill,
        job_date=job.job_date,
        rate=job.rate,
        location=job.location,
        city=job.city,
        description=job.description,
        status=job.status,
        bid_count=len(job.bids),
        created_at=job.created_at,
    )


# ── Post a job ─────────────────────────────────────────────────────────────────

@router.post("/jobs", response_model=IndividualJobOut, status_code=201)
def post_individual_job(
    body: IndividualJobCreate,
    db: Session = Depends(get_db),
    payload: dict = Depends(get_any_mobile_user),
):
    _require_registered(payload)
    phone = payload["sub"]
    poster_name = _poster_name(phone, db)

    eod = datetime.combine(body.job_date, time_type(23, 59, 59))
    job = Job(
        job_type='individual',
        poster_phone=phone,
        poster_name=poster_name,
        title=body.title,
        skill=body.skill,
        required_count=1,
        job_date=body.job_date,
        rate=body.rate or 0,
        location=body.location,
        city=body.city,
        description=body.description,
        expires_at=eod,
    )
    db.add(job)
    db.commit()
    db.refresh(job)
    return _job_out(job)


# ── List open individual jobs ──────────────────────────────────────────────────

@router.get("/jobs", response_model=dict)
def list_individual_jobs(
    skill: Optional[str] = None,
    city: Optional[str] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    payload: dict = Depends(get_any_mobile_user),
):
    _require_registered(payload)
    today = date.today()
    q = db.query(Job).filter(
        Job.job_type == 'individual',
        Job.status == JobStatus.open,
        Job.job_date >= today,
    )
    if city:
        q = q.filter(Job.city.ilike(f"%{city}%"))
    if skill:
        try:
            q = q.filter(Job.skill == SkillEnum(skill))
        except ValueError:
            pass

    jobs = q.order_by(Job.created_at.desc()).all()
    total = len(jobs)
    start = (page - 1) * page_size
    page_jobs = jobs[start: start + page_size]
    return {
        "items": [_job_out(j).model_dump(mode="json") for j in page_jobs],
        "total": total,
        "page": page,
    }


# ── My posted jobs ─────────────────────────────────────────────────────────────

@router.get("/my-jobs", response_model=List[IndividualJobOut])
def my_posted_jobs(
    db: Session = Depends(get_db),
    payload: dict = Depends(get_any_mobile_user),
):
    _require_registered(payload)
    phone = payload["sub"]
    jobs = (
        db.query(Job)
        .filter(Job.job_type == 'individual', Job.poster_phone == phone)
        .order_by(Job.created_at.desc())
        .all()
    )
    return [_job_out(j) for j in jobs]


# ── Job detail (bids visible to poster only) ───────────────────────────────────

@router.get("/jobs/{job_id}", response_model=IndividualJobDetail)
def get_individual_job(
    job_id: str,
    db: Session = Depends(get_db),
    payload: dict = Depends(get_any_mobile_user),
):
    _require_registered(payload)
    job = db.query(Job).filter(Job.job_id == job_id, Job.job_type == 'individual').first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    phone = payload["sub"]
    is_poster = job.poster_phone == phone
    bids = [BidOut.model_validate(b) for b in job.bids] if is_poster else []
    base = _job_out(job)
    return IndividualJobDetail(**base.model_dump(), bids=bids, is_poster=is_poster)


# ── Place a bid (workers only) ─────────────────────────────────────────────────

@router.post("/jobs/{job_id}/bid", response_model=BidOut, status_code=201)
def place_bid(
    job_id: str,
    body: BidCreate,
    db: Session = Depends(get_db),
    worker: Worker = Depends(get_current_worker),
):
    job = db.query(Job).filter(Job.job_id == job_id, Job.job_type == 'individual').first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    if job.status != JobStatus.open:
        raise HTTPException(status_code=400, detail="Job is no longer accepting bids")
    if job.poster_phone == worker.phone:
        raise HTTPException(status_code=400, detail="Cannot bid on your own job")

    existing = db.query(Bid).filter(
        Bid.job_id == job.job_id, Bid.worker_id == worker.worker_id,
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="You already placed a bid")

    bid = Bid(
        job_id=job.job_id,
        worker_id=worker.worker_id,
        amount=body.amount,
        message=body.message,
    )
    db.add(bid)
    db.commit()
    db.refresh(bid)
    return BidOut.model_validate(bid)


# ── Accept a bid (poster only) ────────────────────────────────────────────────

@router.post("/jobs/{job_id}/bids/{bid_id}/accept", status_code=200)
def accept_bid(
    job_id: str,
    bid_id: str,
    db: Session = Depends(get_db),
    payload: dict = Depends(get_any_mobile_user),
):
    _require_registered(payload)
    phone = payload["sub"]
    job = db.query(Job).filter(Job.job_id == job_id, Job.job_type == 'individual').first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    if job.poster_phone != phone:
        raise HTTPException(status_code=403, detail="Only the poster can accept bids")
    if job.status != JobStatus.open:
        raise HTTPException(status_code=400, detail="Job is already closed")

    bid = db.query(Bid).filter(Bid.bid_id == bid_id, Bid.job_id == job.job_id).first()
    if not bid:
        raise HTTPException(status_code=404, detail="Bid not found")

    for b in job.bids:
        b.status = 'rejected'
    bid.status = 'accepted'
    job.status = JobStatus.filled
    job.confirmed_count = 1
    db.commit()
    return {"message": "Bid accepted", "bid_id": str(bid_id)}


# ── Mark complete (poster only) ────────────────────────────────────────────────

@router.post("/jobs/{job_id}/complete", status_code=200)
def mark_complete(
    job_id: str,
    db: Session = Depends(get_db),
    payload: dict = Depends(get_any_mobile_user),
):
    _require_registered(payload)
    phone = payload["sub"]
    job = db.query(Job).filter(Job.job_id == job_id, Job.job_type == 'individual').first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    if job.poster_phone != phone:
        raise HTTPException(status_code=403, detail="Only the poster can mark complete")
    if job.status != JobStatus.filled:
        raise HTTPException(status_code=400, detail="Job must have an accepted bid first")

    job.status = JobStatus.completed
    db.commit()
    return {"message": "Job marked as complete"}


# ── Leave a review (poster only, after complete) ───────────────────────────────

@router.post("/jobs/{job_id}/review", status_code=201)
def leave_review(
    job_id: str,
    body: ReviewCreate,
    db: Session = Depends(get_db),
    payload: dict = Depends(get_any_mobile_user),
):
    _require_registered(payload)
    phone = payload["sub"]
    job = db.query(Job).filter(Job.job_id == job_id, Job.job_type == 'individual').first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    if job.poster_phone != phone:
        raise HTTPException(status_code=403, detail="Only the poster can leave a review")
    if job.status != JobStatus.completed:
        raise HTTPException(status_code=400, detail="Mark job as complete before reviewing")
    if body.rating < 1 or body.rating > 5:
        raise HTTPException(status_code=400, detail="Rating must be 1–5")

    accepted_bid = db.query(Bid).filter(
        Bid.job_id == job.job_id, Bid.status == 'accepted',
    ).first()
    if not accepted_bid:
        raise HTTPException(status_code=400, detail="No accepted bid found")

    if db.query(Review).filter(Review.job_id == job.job_id).first():
        raise HTTPException(status_code=400, detail="Review already submitted")

    review = Review(
        job_id=job.job_id,
        worker_id=accepted_bid.worker_id,
        reviewer_phone=phone,
        rating=body.rating,
        comment=body.comment,
    )
    db.add(review)

    worker = db.query(Worker).filter(Worker.worker_id == accepted_bid.worker_id).first()
    if worker:
        count = worker.review_count or 0
        avg = worker.average_rating or 0.0
        worker.review_count = count + 1
        worker.average_rating = round(((avg * count) + body.rating) / worker.review_count, 1)

    db.commit()
    return {"message": "Review submitted", "rating": body.rating}


# ── Worker reviews (public) ────────────────────────────────────────────────────

@router.get("/workers/{worker_id}/reviews")
def get_worker_reviews(
    worker_id: str,
    db: Session = Depends(get_db),
    payload: dict = Depends(get_any_mobile_user),
):
    reviews = (
        db.query(Review)
        .filter(Review.worker_id == worker_id)
        .order_by(Review.created_at.desc())
        .all()
    )
    return [
        {
            "review_id": str(r.review_id),
            "rating": r.rating,
            "comment": r.comment,
            "created_at": r.created_at.isoformat(),
        }
        for r in reviews
    ]
