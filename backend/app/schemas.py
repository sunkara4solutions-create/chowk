from pydantic import BaseModel, field_validator
from typing import Optional, List
from datetime import datetime, date, time
from uuid import UUID
from app.models import SkillEnum, JobStatus, ApplicationStatus, NotificationStatus


# ─── Worker ───────────────────────────────────────────────────────────────────

class WorkerCreate(BaseModel):
    name: str
    phone: str
    skill: SkillEnum
    city: str
    village: Optional[str] = None
    experience: int = 0
    daily_rate: int

    @field_validator("phone")
    @classmethod
    def validate_phone(cls, v):
        digits = v.replace("+91", "").replace(" ", "")
        if not digits.isdigit() or len(digits) != 10:
            raise ValueError("Phone must be a 10-digit Indian number")
        return digits


class WorkerOut(BaseModel):
    worker_id: UUID
    name: str
    phone: str
    skill: SkillEnum
    city: str
    village: Optional[str]
    experience: int
    daily_rate: int
    is_available: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class WorkerUpdate(BaseModel):
    is_available: Optional[bool] = None
    daily_rate: Optional[int] = None
    city: Optional[str] = None


# ─── Contractor ───────────────────────────────────────────────────────────────

class ContractorRegister(BaseModel):
    name: str
    phone: str
    password: str
    company_name: Optional[str] = None
    city: str
    business_type: Optional[str] = None

    @field_validator("phone")
    @classmethod
    def validate_phone(cls, v):
        digits = v.replace("+91", "").replace(" ", "")
        if not digits.isdigit() or len(digits) != 10:
            raise ValueError("Phone must be a 10-digit Indian number")
        return digits


class ContractorLogin(BaseModel):
    phone: str
    password: str


class ContractorOut(BaseModel):
    contractor_id: UUID
    name: str
    phone: str
    company_name: Optional[str]
    city: str
    business_type: Optional[str]
    created_at: datetime

    model_config = {"from_attributes": True}


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    contractor: ContractorOut


# ─── Job ──────────────────────────────────────────────────────────────────────

class JobCreate(BaseModel):
    skill: SkillEnum
    required_count: int
    job_date: date
    rate: int
    location: str
    city: str
    start_time: Optional[time] = None
    description: Optional[str] = None


class JobOut(BaseModel):
    job_id: UUID
    contractor_id: UUID
    skill: SkillEnum
    required_count: int
    confirmed_count: int
    job_date: date
    rate: int
    location: str
    city: str
    start_time: Optional[time]
    description: Optional[str]
    status: JobStatus
    fill_percentage: float
    created_at: datetime

    model_config = {"from_attributes": True}

    @property
    def fill_percentage(self) -> float:
        if self.required_count == 0:
            return 0.0
        return round((self.confirmed_count / self.required_count) * 100, 1)


class JobWithApplications(JobOut):
    applications: List["ApplicationOut"] = []


# ─── Application ──────────────────────────────────────────────────────────────

class ApplicationOut(BaseModel):
    application_id: UUID
    job_id: UUID
    worker_id: UUID
    status: ApplicationStatus
    worker: Optional[WorkerOut] = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


# ─── Notification ─────────────────────────────────────────────────────────────

class NotificationOut(BaseModel):
    notification_id: UUID
    worker_id: UUID
    job_id: UUID
    status: NotificationStatus
    sent_at: Optional[datetime]

    model_config = {"from_attributes": True}


# ─── Stats ────────────────────────────────────────────────────────────────────

class DashboardStats(BaseModel):
    total_jobs: int
    active_jobs: int
    total_workers_notified: int
    total_confirmed: int
    avg_fill_rate: float


class AdminStats(BaseModel):
    total_workers: int
    total_contractors: int
    total_jobs: int
    jobs_today: int
    workers_available: int
