from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Worker, Admin
from app.schemas import WorkerOut, WorkerUpdate
from app.core.auth import get_current_admin

router = APIRouter(prefix="/workers", tags=["workers"])


@router.get("", response_model=List[WorkerOut])
def list_workers(
    city: str = None,
    skill: str = None,
    available: bool = None,
    db: Session = Depends(get_db),
    admin: Admin = Depends(get_current_admin),
):
    q = db.query(Worker).filter(Worker.is_active == True)
    if city:
        q = q.filter(Worker.city.ilike(f"%{city}%"))
    if available is not None:
        q = q.filter(Worker.is_available == available)
    workers = q.all()
    if skill:
        workers = [w for w in workers if skill in (w.skills or [])]
    return [WorkerOut.model_validate(w) for w in workers]


@router.get("/{worker_id}", response_model=WorkerOut)
def get_worker(worker_id: str, db: Session = Depends(get_db), admin: Admin = Depends(get_current_admin)):
    worker = db.query(Worker).filter(Worker.worker_id == worker_id).first()
    if not worker:
        raise HTTPException(status_code=404, detail="Worker not found")
    return WorkerOut.model_validate(worker)


@router.patch("/{worker_id}", response_model=WorkerOut)
def update_worker(
    worker_id: str,
    body: WorkerUpdate,
    db: Session = Depends(get_db),
    admin: Admin = Depends(get_current_admin),
):
    worker = db.query(Worker).filter(Worker.worker_id == worker_id).first()
    if not worker:
        raise HTTPException(status_code=404, detail="Worker not found")
    for field, value in body.model_dump(exclude_none=True).items():
        setattr(worker, field, value)
    db.commit()
    db.refresh(worker)
    return WorkerOut.model_validate(worker)
