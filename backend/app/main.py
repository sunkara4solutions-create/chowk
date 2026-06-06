from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.database import engine
from app.models import Base
from app.routes import contractors, jobs, workers, whatsapp, admin
from app.core.auth import hash_password

app = FastAPI(
    title="Chowk API",
    description="WhatsApp-first labor marketplace for daily wage workers in Andhra Pradesh",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_URL, "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(contractors.router)
app.include_router(jobs.router)
app.include_router(workers.router)
app.include_router(whatsapp.router)
app.include_router(admin.router)


@app.on_event("startup")
def startup():
    Base.metadata.create_all(bind=engine)
    _seed_admin()


def _seed_admin():
    from sqlalchemy.orm import Session
    from app.models import Admin
    with Session(engine) as db:
        if not db.query(Admin).filter(Admin.phone == settings.ADMIN_PHONE).first():
            db.add(Admin(
                phone=settings.ADMIN_PHONE,
                password_hash=hash_password(settings.ADMIN_PASSWORD),
            ))
            db.commit()


@app.get("/health")
def health():
    return {"status": "ok", "app": settings.APP_NAME}
