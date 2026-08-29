import sentry_sdk
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse
from app.config import settings
from app.database import engine
from app.models import Base
from app.routes import contractors, jobs, workers, whatsapp, admin, auth_mobile, mobile
from app.core.auth import hash_password

if settings.SENTRY_DSN:
    sentry_sdk.init(dsn=settings.SENTRY_DSN, traces_sample_rate=0.1, environment=settings.APP_ENV)

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
app.include_router(auth_mobile.router)
app.include_router(mobile.router)


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


@app.get("/privacy", response_class=HTMLResponse)
def privacy_policy():
    return """<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Privacy Policy — Chowk</title>
<style>
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 720px; margin: 0 auto; padding: 24px 20px 60px; color: #1a1a1a; line-height: 1.7; }
  h1 { font-size: 28px; color: #E85C1A; margin-bottom: 4px; }
  h2 { font-size: 18px; margin-top: 32px; color: #1a1a1a; }
  p, li { font-size: 15px; color: #444; }
  ul { padding-left: 20px; }
  a { color: #E85C1A; }
  .updated { font-size: 13px; color: #888; margin-bottom: 32px; }
  hr { border: none; border-top: 1px solid #eee; margin: 32px 0; }
</style>
</head>
<body>
<h1>Privacy Policy</h1>
<p class="updated">Last updated: August 2026</p>

<p>Chowk ("we", "our", "the app") is a labour marketplace connecting daily-wage workers with contractors in Andhra Pradesh, India. This policy explains what data we collect, how we use it, and your rights.</p>

<h2>1. Data We Collect</h2>
<ul>
  <li><strong>Phone number</strong> — used as your identity to log in and receive job alerts via SMS and WhatsApp.</li>
  <li><strong>Name</strong> — displayed to contractors or workers you interact with.</li>
  <li><strong>Location (GPS)</strong> — collected only when you tap "Verify Location" or "Find Workers". Used to match you with nearby jobs or workers. Never tracked in the background.</li>
  <li><strong>Skills, experience, daily rate</strong> — worker profile information shared with contractors when you apply for a job.</li>
  <li><strong>Device token</strong> — used to send push notifications for job updates. Not shared with third parties.</li>
  <li><strong>WhatsApp messages</strong> — processed to handle commands (JOBS, YES, STOP) via Meta's WhatsApp Business API. Message content is not stored beyond what is needed to process your request.</li>
</ul>

<h2>2. How We Use Your Data</h2>
<ul>
  <li>Match workers with nearby job postings.</li>
  <li>Notify workers of new jobs and contractors of confirmed workers.</li>
  <li>Send daily availability checks to workers via WhatsApp (7 AM IST).</li>
  <li>Allow contractors to find available workers by skill and location.</li>
</ul>

<h2>3. Data Sharing</h2>
<p>We do not sell your data. We share data only with:</p>
<ul>
  <li><strong>Meta (WhatsApp)</strong> — to deliver WhatsApp messages via the Business API.</li>
  <li><strong>Twilio</strong> — to send OTP verification SMS.</li>
  <li><strong>Expo</strong> — to deliver push notifications.</li>
  <li><strong>Other users</strong> — your name and phone number are shared with a contractor when you confirm a job, and vice versa.</li>
</ul>

<h2>4. Data Retention</h2>
<p>Your data is retained while your account is active. You can delete your account at any time from the app (Profile → Delete Account), which permanently removes all your data within 24 hours.</p>

<h2>5. Your Rights</h2>
<ul>
  <li>Access or correct your data via the Profile screen.</li>
  <li>Delete your account in-app (Profile → Delete Account).</li>
  <li>Opt out of WhatsApp alerts by sending STOP to our WhatsApp number.</li>
  <li>Contact us at <a href="mailto:balamurali999cl@gmail.com">balamurali999cl@gmail.com</a> for any data requests.</li>
</ul>

<h2>6. Security</h2>
<p>All data is transmitted over HTTPS. Phone numbers are verified via OTP before account creation. Location data is stored encrypted at rest.</p>

<h2>7. Children</h2>
<p>Chowk is not intended for users under 18. We do not knowingly collect data from minors.</p>

<h2>8. Changes</h2>
<p>We may update this policy. Continued use of the app after changes constitutes acceptance.</p>

<hr>
<p>For questions: <a href="mailto:balamurali999cl@gmail.com">balamurali999cl@gmail.com</a><br>
Chowk · Andhra Pradesh, India</p>
</body>
</html>"""
