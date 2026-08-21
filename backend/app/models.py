import uuid
from datetime import datetime, date, time
from sqlalchemy import (
    Column, String, Integer, Float, Boolean, DateTime, Date, Time,
    ForeignKey, Text, Enum as SAEnum, UniqueConstraint, JSON
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.database import Base
import enum


class SkillEnum(str, enum.Enum):
    painter = "painter"
    mason = "mason"
    electrician = "electrician"
    plumber = "plumber"
    carpenter = "carpenter"
    welder = "welder"
    tiles_worker = "tiles_worker"
    helper = "helper"
    construction_laborer = "construction_laborer"


class JobStatus(str, enum.Enum):
    open = "open"
    filled = "filled"
    cancelled = "cancelled"
    completed = "completed"


class ApplicationStatus(str, enum.Enum):
    pending = "pending"
    accepted = "accepted"
    rejected = "rejected"


class NotificationStatus(str, enum.Enum):
    pending = "pending"
    sent = "sent"
    delivered = "delivered"
    failed = "failed"


class BotState(str, enum.Enum):
    new = "new"
    reg_language = "reg_language"
    role_select = "role_select"
    # Worker registration
    reg_name = "reg_name"
    reg_skill = "reg_skill"
    reg_experience = "reg_experience"
    reg_daily_rate = "reg_daily_rate"
    reg_city = "reg_city"
    registered = "registered"
    awaiting_job_response = "awaiting_job_response"
    # Contractor registration + job posting
    con_name = "con_name"
    con_company = "con_company"
    con_city = "con_city"
    contractor = "contractor"
    con_awaiting_confirm = "con_awaiting_confirm"


class Worker(Base):
    __tablename__ = "workers"

    worker_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(100), nullable=False)
    phone = Column(String(15), unique=True, nullable=False, index=True)
    skills = Column(JSON, nullable=False, default=list)
    city = Column(String(100), nullable=False, index=True)
    village = Column(String(100))
    experience = Column(Integer, default=0)
    daily_rate = Column(Integer, nullable=False)
    is_available = Column(Boolean, default=True)
    is_active = Column(Boolean, default=True)
    state = Column(String(50), default="Andhra Pradesh")
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    phone_verified = Column(Boolean, default=True)
    location_verified = Column(Boolean, default=False)
    aadhaar_verified = Column(Boolean, default=False)
    aadhaar_last4 = Column(String(4), nullable=True)
    whatsapp_primary = Column(Boolean, default=False)
    referral_source = Column(String(200), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    applications = relationship("Application", back_populates="worker")
    notifications = relationship("Notification", back_populates="worker")


class Contractor(Base):
    __tablename__ = "contractors"

    contractor_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(100), nullable=False)
    company_name = Column(String(200))
    phone = Column(String(15), unique=True, nullable=False, index=True)
    city = Column(String(100), nullable=False)
    business_type = Column(String(100))
    state = Column(String(50), default="Andhra Pradesh")
    password_hash = Column(String(256), nullable=False)
    is_active = Column(Boolean, default=True)
    phone_verified = Column(Boolean, default=True)
    aadhaar_verified = Column(Boolean, default=False)
    aadhaar_last4 = Column(String(4), nullable=True)
    whatsapp_primary = Column(Boolean, default=False)
    referral_source = Column(String(200), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    jobs = relationship("Job", back_populates="contractor")


class Job(Base):
    __tablename__ = "jobs"

    job_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    contractor_id = Column(UUID(as_uuid=True), ForeignKey("contractors.contractor_id"), nullable=False)
    skill = Column(SAEnum(SkillEnum), nullable=False)
    required_count = Column(Integer, nullable=False)
    confirmed_count = Column(Integer, default=0)
    job_date = Column(Date, nullable=False)
    rate = Column(Integer, nullable=False)
    location = Column(String(300), nullable=False)
    city = Column(String(100), nullable=False, index=True)
    start_time = Column(Time)
    description = Column(Text)
    status = Column(SAEnum(JobStatus), default=JobStatus.open, index=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    expires_at = Column(DateTime)

    contractor = relationship("Contractor", back_populates="jobs")
    applications = relationship("Application", back_populates="job")
    notifications = relationship("Notification", back_populates="job")


class Application(Base):
    __tablename__ = "applications"

    application_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    job_id = Column(UUID(as_uuid=True), ForeignKey("jobs.job_id"), nullable=False)
    worker_id = Column(UUID(as_uuid=True), ForeignKey("workers.worker_id"), nullable=False)
    status = Column(SAEnum(ApplicationStatus), default=ApplicationStatus.pending)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    __table_args__ = (UniqueConstraint("job_id", "worker_id", name="uq_job_worker"),)

    job = relationship("Job", back_populates="applications")
    worker = relationship("Worker", back_populates="applications")


class Notification(Base):
    __tablename__ = "notifications"

    notification_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    worker_id = Column(UUID(as_uuid=True), ForeignKey("workers.worker_id"), nullable=False)
    job_id = Column(UUID(as_uuid=True), ForeignKey("jobs.job_id"), nullable=False)
    status = Column(SAEnum(NotificationStatus), default=NotificationStatus.pending)
    whatsapp_message_id = Column(String(200))
    sent_at = Column(DateTime)
    created_at = Column(DateTime, default=datetime.utcnow)

    worker = relationship("Worker", back_populates="notifications")
    job = relationship("Job", back_populates="notifications")


class WhatsAppSession(Base):
    __tablename__ = "whatsapp_sessions"

    phone = Column(String(15), primary_key=True)
    bot_state = Column(SAEnum(BotState), default=BotState.new)
    context = Column(JSON, default=dict)
    pending_job_id = Column(UUID(as_uuid=True), ForeignKey("jobs.job_id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class Admin(Base):
    __tablename__ = "admins"

    admin_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    phone = Column(String(15), unique=True, nullable=False)
    password_hash = Column(String(256), nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class ProcessedMessage(Base):
    __tablename__ = "processed_messages"

    message_id = Column(String(200), primary_key=True)
    processed_at = Column(DateTime, default=datetime.utcnow)


class DeviceToken(Base):
    __tablename__ = "device_tokens"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    phone = Column(String(15), nullable=False, index=True)
    token = Column(String(500), nullable=False)
    platform = Column(String(10), default="android")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    __table_args__ = (UniqueConstraint("phone", "token", name="uq_phone_token"),)


class OtpCode(Base):
    __tablename__ = "otp_codes"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    phone = Column(String(20), nullable=False, index=True)
    code = Column(String(6), nullable=False)
    expires_at = Column(DateTime, nullable=False)
    used = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
