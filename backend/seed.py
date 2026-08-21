"""
Seed script — creates test workers, contractors, jobs, and applications.
Run inside the backend container:
  docker-compose exec backend python seed.py
"""
import uuid
from datetime import datetime, date, timedelta
from passlib.context import CryptContext
from app.database import SessionLocal
from app.models import Worker, Contractor, Job, Application, SkillEnum, JobStatus

pwd_ctx = CryptContext(schemes=["bcrypt"], deprecated="auto")

db = SessionLocal()

# ── Wipe existing test data (applications → jobs → workers/contractors) ───────
TEST_PHONES_W = ["9000000001", "9000000002", "9000000003", "9000000004", "9000000005"]
TEST_PHONES_C = ["9100000001", "9100000002"]

# 1. Nuke orphaned applications (job_id or worker_id null from prior bad wipes)
db.execute(
    Application.__table__.delete().where(
        (Application.job_id == None) | (Application.worker_id == None)
    )
)
# 2. Delete applications + jobs for each test contractor
for p in TEST_PHONES_C:
    c = db.query(Contractor).filter(Contractor.phone == p).first()
    if c:
        for j in db.query(Job).filter(Job.contractor_id == c.contractor_id).all():
            for a in db.query(Application).filter(Application.job_id == j.job_id).all():
                db.delete(a)
            db.delete(j)
# 3. Nuke any remaining orphaned jobs
db.execute(Job.__table__.delete().where(Job.contractor_id == None))
db.flush()

# 4. Delete test workers and contractors
for p in TEST_PHONES_W:
    w = db.query(Worker).filter(Worker.phone == p).first()
    if w:
        db.delete(w)
for p in TEST_PHONES_C:
    c = db.query(Contractor).filter(Contractor.phone == p).first()
    if c:
        db.delete(c)
db.commit()

# ── Workers ──────────────────────────────────────────────────────────────────
workers_data = [
    dict(phone="9000000001", name="Ramu Yadav",        skills=["painter", "helper"],              city="Vijayawada", experience=5,  daily_rate=700,  latitude=16.5062, longitude=80.6480),
    dict(phone="9000000002", name="Suresh Kumar",      skills=["mason", "construction_laborer"],  city="Vijayawada", experience=8,  daily_rate=900,  latitude=16.5100, longitude=80.6300),
    dict(phone="9000000003", name="Krishnamurthy B",   skills=["electrician"],                    city="Guntur",     experience=6,  daily_rate=1000, latitude=16.3066, longitude=80.4365),
    dict(phone="9000000004", name="Venkat Reddy",      skills=["plumber", "tiles_worker"],        city="Guntur",     experience=3,  daily_rate=800,  latitude=16.3020, longitude=80.4400),
    dict(phone="9000000005", name="Anjaiah P",         skills=["carpenter", "welder"],            city="Kurnool",    experience=10, daily_rate=1100, latitude=15.8281, longitude=78.0373),
]

workers = []
for d in workers_data:
    w = Worker(**d, state="Andhra Pradesh", is_available=True, is_active=True)
    db.add(w)
    workers.append(w)
db.flush()

# ── Contractors ──────────────────────────────────────────────────────────────
contractors_data = [
    dict(phone="9100000001", name="Praveen Constructions", company_name="Praveen Infra Pvt Ltd", city="Vijayawada"),
    dict(phone="9100000002", name="Siva Shankar",           company_name=None,                   city="Guntur"),
]

contractors = []
for d in contractors_data:
    c = Contractor(**d, state="Andhra Pradesh", password_hash=pwd_ctx.hash("test1234"), is_active=True)
    db.add(c)
    contractors.append(c)
db.flush()

# ── Jobs ─────────────────────────────────────────────────────────────────────
today = date.today()
jobs_data = [
    # Vijayawada contractor
    dict(contractor=contractors[0], skill=SkillEnum.painter,              required_count=4, job_date=today + timedelta(days=1), rate=700,  city="Vijayawada", location="Near Kanaka Durga Temple, Vijayawada", status=JobStatus.open),
    dict(contractor=contractors[0], skill=SkillEnum.mason,                required_count=6, job_date=today + timedelta(days=2), rate=900,  city="Vijayawada", location="MG Road Construction Site, Vijayawada", status=JobStatus.open),
    dict(contractor=contractors[0], skill=SkillEnum.electrician,          required_count=2, job_date=today + timedelta(days=3), rate=1000, city="Vijayawada", location="Benz Circle Apartment Project, Vijayawada", status=JobStatus.open),
    dict(contractor=contractors[0], skill=SkillEnum.construction_laborer, required_count=10,job_date=today + timedelta(days=1), rate=600,  city="Vijayawada", location="Governorpet Warehouse, Vijayawada", status=JobStatus.filled, confirmed_count=10),
    # Guntur contractor
    dict(contractor=contractors[1], skill=SkillEnum.plumber,              required_count=3, job_date=today + timedelta(days=1), rate=850,  city="Guntur",     location="Brodipet Housing Colony, Guntur", status=JobStatus.open),
    dict(contractor=contractors[1], skill=SkillEnum.tiles_worker,         required_count=5, job_date=today + timedelta(days=4), rate=750,  city="Guntur",     location="Lakshmipuram Layout, Guntur", status=JobStatus.open),
    dict(contractor=contractors[1], skill=SkillEnum.helper,               required_count=8, job_date=today + timedelta(days=2), rate=550,  city="Guntur",     location="Nagarjuna University Road, Guntur", status=JobStatus.open),
]

jobs = []
for d in jobs_data:
    contractor = d.pop("contractor")
    j = Job(contractor_id=contractor.contractor_id, confirmed_count=d.pop("confirmed_count", 0), **d)
    db.add(j)
    jobs.append(j)
db.flush()

# ── Applications ─────────────────────────────────────────────────────────────
# Ramu applied to painter job (open)
db.add(Application(job_id=jobs[0].job_id, worker_id=workers[0].worker_id, status="pending"))
# Suresh applied to mason job (open)
db.add(Application(job_id=jobs[1].job_id, worker_id=workers[1].worker_id, status="accepted"))
# Krishnamurthy applied to electrician job
db.add(Application(job_id=jobs[2].job_id, worker_id=workers[2].worker_id, status="pending"))
# Venkat applied to plumber job
db.add(Application(job_id=jobs[4].job_id, worker_id=workers[3].worker_id, status="pending"))

db.commit()
db.close()

print("✅ Seed complete!")
print()
print("── Workers ──────────────────────────────")
for w in workers_data:
    print(f"  {w['name']:25s}  phone: {w['phone']}  city: {w['city']}")
print()
print("── Contractors ──────────────────────────")
for c in contractors_data:
    print(f"  {c['name']:25s}  phone: {c['phone']}  city: {c['city']}")
print()
print("── Login via app ────────────────────────")
print("  Any worker/contractor phone above → OTP: 123456")
print()
print("── Jobs created ─────────────────────────")
for j in jobs_data:
    print(f"  [{j['status'].value:6s}]  {j['skill'].value:22s}  {j['city']:12s}  ₹{j['rate']}/day  {j['job_date']}")
