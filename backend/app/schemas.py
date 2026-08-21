from __future__ import annotations
from pydantic import BaseModel, field_validator
from typing import Optional, List, Literal
from datetime import datetime, date, time
from uuid import UUID
from app.models import SkillEnum, JobStatus, ApplicationStatus, NotificationStatus


# ─── Mobile Auth ──────────────────────────────────────────────────────────────

class OtpRequest(BaseModel):
    phone: str

    @field_validator("phone")
    @classmethod
    def validate_phone(cls, v):
        digits = v.replace("+91", "").replace(" ", "")
        if not digits.isdigit() or len(digits) != 10:
            raise ValueError("Phone must be a 10-digit Indian number")
        return digits


class OtpVerify(BaseModel):
    phone: str
    otp: str

    @field_validator("phone")
    @classmethod
    def validate_phone(cls, v):
        digits = v.replace("+91", "").replace(" ", "")
        if not digits.isdigit() or len(digits) != 10:
            raise ValueError("Phone must be a 10-digit Indian number")
        return digits


class WorkerRegister(BaseModel):
    name: str
    skills: List[str]
    city: str
    experience: int = 0
    daily_rate: int


class ContractorRegisterMobile(BaseModel):
    name: str
    company_name: Optional[str] = None
    city: str


class MobileTokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: Literal["worker", "contractor", "new"]
    profile: Optional[dict] = None


class DeviceTokenRequest(BaseModel):
    token: str
    platform: str = "android"


# ─── Mobile Profile ───────────────────────────────────────────────────────────

class WorkerProfileUpdate(BaseModel):
    name: Optional[str] = None
    skills: Optional[List[str]] = None
    city: Optional[str] = None
    experience: Optional[int] = None
    daily_rate: Optional[int] = None
    is_available: Optional[bool] = None


class ContractorProfileUpdate(BaseModel):
    name: Optional[str] = None
    company_name: Optional[str] = None
    city: Optional[str] = None


class LocationUpdate(BaseModel):
    latitude: float
    longitude: float
    city_verified: bool = False


class WorkerPreferences(BaseModel):
    whatsapp_primary: Optional[bool] = None
    referral_source: Optional[str] = None


class AadhaarInitiateResponse(BaseModel):
    request_id: str
    captcha_image: Optional[str] = None
    mock: bool = False


class AadhaarVerifyRequest(BaseModel):
    request_id: str
    aadhaar_number: str
    captcha_code: str = "mock"


class AadhaarCompleteRequest(BaseModel):
    request_id: str
    otp: str
    share_code: str = "1234"


class ApplicationStatusUpdate(BaseModel):
    status: Literal["accepted", "rejected"]


# ─── Mobile Job ───────────────────────────────────────────────────────────────

class JobCreateMobile(BaseModel):
    skill: SkillEnum
    required_count: int
    job_date: date
    rate: int
    location: str
    city: str
    start_time: Optional[time] = None
    description: Optional[str] = None


class ContractorBasic(BaseModel):
    name: str
    phone: str
    company_name: Optional[str] = None

    model_config = {"from_attributes": True}


class JobOutMobile(BaseModel):
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
    created_at: datetime
    contractor: Optional[ContractorBasic] = None

    model_config = {"from_attributes": True}


class ApplicantOut(BaseModel):
    application_id: UUID
    status: ApplicationStatus
    created_at: datetime
    worker: WorkerOut

    model_config = {"from_attributes": True}


class WorkerApplicationOut(BaseModel):
    application_id: UUID
    status: ApplicationStatus
    created_at: datetime
    job: JobOutMobile

    model_config = {"from_attributes": True}


class NearbyWorkerOut(BaseModel):
    worker_id: UUID
    name: str
    phone: str
    skills: List[str]
    city: str
    experience: int
    daily_rate: int
    is_available: bool
    distance_km: Optional[float] = None

    model_config = {"from_attributes": True}


# ─── Worker ───────────────────────────────────────────────────────────────────

class WorkerCreate(BaseModel):
    name: str
    phone: str
    skills: List[str]
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
    skills: List[str]
    city: str
    village: Optional[str]
    experience: int
    daily_rate: int
    is_available: bool
    phone_verified: bool = True
    location_verified: bool = False
    aadhaar_verified: bool = False
    aadhaar_last4: Optional[str] = None
    whatsapp_primary: bool = False
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
    phone_verified: bool = True
    aadhaar_verified: bool = False
    aadhaar_last4: Optional[str] = None
    whatsapp_primary: bool = False
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
