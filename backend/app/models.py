import uuid
from datetime import datetime, date, time
from sqlalchemy import (
    Column, String, Integer, Boolean, DateTime, Date, Time,
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
    reg_name = "reg_name"
    reg_skill = "reg_skill"
    reg_experience = "reg_experience"
    reg_daily_rate = "reg_daily_rate"
    reg_city = "reg_city"
    registered = "registered"
    awaiting_job_response = "awaiting_job_response"


class Worker(Base):
    __tablename__ = "workers"

    worker_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(100), nullable=False)
    phone = Column(String(15), unique=True, nullable=False, index=True)
    skill = Column(SAEnum(SkillEnum), nullable=False)
    city = Column(String(100), nullable=False, index=True)
    village = Column(String(100))
    experience = Column(Integer, default=0)
    daily_rate = Column(Integer, nullable=False)
    is_available = Column(Boolean, default=True)
    is_active = Column(Boolean, default=True)
    state = Column(String(50), default="Andhra Pradesh")
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
