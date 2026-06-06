from datetime import date
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Admin, Worker, Contractor, Job, Notification
from app.schemas import AdminStats, ContractorOut, JobOut, TokenResponse
from app.core.auth import get_current_admin, verify_password, create_token, hash_password
from pydantic import BaseModel

router = APIRouter(prefix="/admin", tags=["admin"])


class AdminLogin(BaseModel):
    phone: str
    password: str


@router.post("/login", response_model=TokenResponse)
def admin_login(body: AdminLogin, db: Session = Depends(get_db)):
    admin = db.query(Admin).filter(Admin.phone == body.phone).first()
    if not admin or not verify_password(body.password, admin.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    token = create_token({"sub": str(admin.admin_id), "role": "admin"})
    return {"access_token": token, "token_type": "bearer", "contractor": None}


@router.get("/stats", response_model=AdminStats)
def admin_stats(db: Session = Depends(get_db), admin: Admin = Depends(get_current_admin)):
    today = date.today()
    return AdminStats(
        total_workers=db.query(Worker).filter(Worker.is_active == True).count(),
        total_contractors=db.query(Contractor).filter(Contractor.is_active == True).count(),
        total_jobs=db.query(Job).count(),
        jobs_today=db.query(Job).filter(Job.job_date == today).count(),
        workers_available=db.query(Worker).filter(Worker.is_available == True, Worker.is_active == True).count(),
    )


@router.get("/contractors")
def list_contractors(db: Session = Depends(get_db), admin: Admin = Depends(get_current_admin)):
    contractors = db.query(Contractor).all()
    return [ContractorOut.model_validate(c) for c in contractors]


@router.get("/jobs")
def list_all_jobs(db: Session = Depends(get_db), admin: Admin = Depends(get_current_admin)):
    jobs = db.query(Job).order_by(Job.created_at.desc()).limit(100).all()
    result = []
    for j in jobs:
        out = JobOut.model_validate(j)
        out.fill_percentage = (
            round((j.confirmed_count / j.required_count) * 100, 1)
            if j.required_count > 0 else 0.0
        )
        result.append(out)
    return result


@router.post("/contractors/{contractor_id}/deactivate")
def deactivate_contractor(contractor_id: str, db: Session = Depends(get_db), admin: Admin = Depends(get_current_admin)):
    c = db.query(Contractor).filter(Contractor.contractor_id == contractor_id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Contractor not found")
    c.is_active = False
    db.commit()
    return {"message": "Contractor deactivated"}
