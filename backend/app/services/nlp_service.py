"""
NLP service: parses free-form contractor job requirement using Claude.
Single API call handles both intent detection and job extraction.
"""
import json
import logging
from datetime import date
from dataclasses import dataclass, field

import anthropic

from app.config import settings

logger = logging.getLogger(__name__)

SKILLS = [
    "painter", "mason", "electrician", "plumber",
    "carpenter", "welder", "tiles_worker", "helper", "construction_laborer",
]


@dataclass
class ParsedJob:
    skill: str | None
    count: int | None
    city: str | None
    date: str | None    # YYYY-MM-DD
    rate: int | None
    start_time: str | None  # HH:MM or None

    def missing(self) -> list[str]:
        fields = {"skill": self.skill, "count": self.count, "city": self.city,
                  "date": self.date, "rate": self.rate}
        return [k for k, v in fields.items() if v is None]

    def is_complete(self) -> bool:
        return not self.missing()


@dataclass
class ContractorMessage:
    intent: str                          # job_post | status | greeting | other
    jobs: list[ParsedJob] = field(default_factory=list)


async def parse_contractor_message(text: str) -> ContractorMessage:
    """Single Claude call: classifies intent and extracts job details if applicable."""
    if not settings.ANTHROPIC_API_KEY:
        return ContractorMessage(intent="other")

    today = date.today().isoformat()
    skills_list = ", ".join(f'"{s}"' for s in SKILLS)
    prompt = f"""You are a WhatsApp bot assistant for a labor marketplace in India (Andhra Pradesh).
Today's date is {today}.

A contractor sent this message: "{text}"

Step 1 — classify intent as exactly one of:
- job_post: they want to hire workers / post a job requirement
- status: asking about existing jobs, confirmations, or their account
- greeting: saying hello or starting a conversation
- other: something unrelated to the platform

Step 2 — if intent is job_post, extract the job details:
- requirements: array of {{"skill": one of [{skills_list}], "count": integer}}
  (contractor may need multiple skill types e.g. "5 painters and 10 plumbers")
- city: city name in India (or null)
- date: YYYY-MM-DD ("tomorrow"/"reppudu"/"kal" = next day; "day after"/"parso" = 2 days from today; or null)
- rate: daily wage in rupees as integer, ignore ₹/Rs symbols (or null)
- start_time: HH:MM 24-hour format (or null)

Respond with valid JSON only, no explanation.

Examples:
{{"intent": "greeting"}}
{{"intent": "status"}}
{{"intent": "job_post", "requirements": [{{"skill": "painter", "count": 5}}, {{"skill": "plumber", "count": 10}}], "city": "Guntur", "date": "2026-06-14", "rate": 800, "start_time": "08:00"}}
{{"intent": "job_post", "requirements": [{{"skill": "mason", "count": 3}}], "city": null, "date": null, "rate": null, "start_time": null}}
"""

    try:
        client = anthropic.AsyncAnthropic(api_key=settings.ANTHROPIC_API_KEY)
        response = await client.messages.create(
            model="claude-haiku-4-5-20251001",
            max_tokens=512,
            messages=[{"role": "user", "content": prompt}],
        )
        raw = response.content[0].text.strip()
        if raw.startswith("```"):
            raw = raw.split("```")[1]
            if raw.startswith("json"):
                raw = raw[4:]
        raw = raw.strip()

        data = json.loads(raw)
        intent = data.get("intent", "other")
        if intent not in ("job_post", "status", "greeting", "other"):
            intent = "other"

        if intent != "job_post":
            return ContractorMessage(intent=intent)

        logger.info("NLP parsed: %s", data)

        def _int_or_none(v):
            try:
                return int(v) if v is not None else None
            except (ValueError, TypeError):
                return None

        city = str(data["city"]) if data.get("city") else None
        parsed_date = str(data["date"]) if data.get("date") else None
        rate = _int_or_none(data.get("rate"))
        start_time = data.get("start_time")

        requirements = data.get("requirements") or []
        jobs = []
        for req in requirements:
            raw_skill = req.get("skill")
            skill = _normalize_skill(str(raw_skill)) if raw_skill else None
            count = _int_or_none(req.get("count"))
            jobs.append(ParsedJob(
                skill=skill, count=count,
                city=city, date=parsed_date, rate=rate, start_time=start_time,
            ))

        return ContractorMessage(intent="job_post", jobs=jobs if jobs else [])

    except Exception as e:
        logger.error("NLP parse error: %s", e)
        return ContractorMessage(intent="other")


def _normalize_skill(raw: str) -> str | None:
    raw = raw.lower().strip().replace(" ", "_").replace("-", "_")
    if raw in SKILLS:
        return raw
    if raw.endswith("s") and raw[:-1] in SKILLS:
        return raw[:-1]
    for skill in SKILLS:
        if raw.startswith(skill[:5]) or skill.startswith(raw[:5]):
            return skill
    return None
