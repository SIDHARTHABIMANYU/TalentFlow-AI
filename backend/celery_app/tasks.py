from celery import Celery
from celery.schedules import crontab

celery_app = Celery(
    "inceptrac_tasks",
    broker="redis://redis:6379/0",
    backend="redis://redis:6379/0"
)

celery_app.conf.beat_schedule = {
    "poll-emails-every-1-minutes": {
        "task": "celery_app.tasks.poll_emails",
        "schedule": crontab(minute="*/1")
    }
}


def get_required_skills_from_db():
    try:
        from app.core.database import SessionLocal
        from app.models.job import Job
        db = SessionLocal()
        jobs = db.query(Job).filter(Job.is_active == True).all()
        db.close()

        if jobs:
            all_skills = []
            for job in jobs:
                if job.required_skills:
                    all_skills.extend([s.strip() for s in job.required_skills.split(",")])
            unique_skills = list(set(all_skills))
            skills_string = ", ".join(unique_skills)
            print(f"📋 Skills from DB: {skills_string}")
            return skills_string
    except Exception as e:
        print(f"⚠ DB skills fetch failed: {str(e)}")

    # Fallback — Inceptrac all roles skills
    return (
        "PCB Design, KiCad, Altium, DFM, PCBA, Multi-layer, "
        "ESP32, STM32, FreeRTOS, RTOS, BLE, WiFi, IoT, Firmware, "
        "SolidWorks, Fusion 360, FDM, SLA, CAD, "
        "LLMs, Edge AI, Computer Vision, Python, OpenCV, "
        "C, C++, Arduino, Embedded Systems, UART, SPI, I2C"
    )


def match_skills_for_email(email_subject: str) -> str:
    subject_lower = email_subject.lower() if email_subject else ""

    if any(word in subject_lower for word in ["pcb", "schematic", "gerber", "altium", "kicad"]):
        return "PCB Design, KiCad, Altium, DFM, PCBA, Multi-layer, Schematic"

    elif any(word in subject_lower for word in ["firmware", "embedded", "esp32", "stm32", "rtos"]):
        return "ESP32, STM32, FreeRTOS, RTOS, BLE, WiFi, IoT, Firmware, Embedded, C, C++"

    elif any(word in subject_lower for word in ["3d", "mechanical", "solidworks", "cad", "fusion"]):
        return "SolidWorks, Fusion 360, FDM, SLA, CAD, Mechanical Design, DFM"

    elif any(word in subject_lower for word in ["ai", "ml", "machine learning", "computer vision", "llm"]):
        return "Python, LLMs, Edge AI, Computer Vision, OpenCV, TensorFlow, PyTorch"

    else:
        # Return all Inceptrac skills for unknown roles
        return get_required_skills_from_db()


# ✅ KEY FIX: bind=True + max_retries so Celery retries on socket crash
#    instead of dying and printing a red ERROR forever
@celery_app.task(bind=True, max_retries=3, default_retry_delay=30)
def poll_emails(self):
    import asyncio
    from app.modules.mail_access.gmail_client import get_recruitment_emails
    from app.modules.workflow.langgraph_flow import recruitment_graph

    print("⏰ Celery polling emails from careers@inceptarc.com...")

    try:
        emails = get_recruitment_emails()
        print(f"📧 Found {len(emails)} unread emails")

    except Exception as exc:
        # Gmail connection totally failed — retry after 30 seconds
        print(f"🔌 Gmail connection failed, retrying... ({exc})")
        raise self.retry(exc=exc)  # auto-retries up to 3x, then gives up gracefully

    for email in emails:
        try:
            # Dynamically match skills based on email subject
            subject = email.get("subject", "")
            required_skills = match_skills_for_email(subject)

            print(f"📋 Role detected from subject: '{subject}'")
            print(f"📋 Required skills: {required_skills}")

            result = asyncio.run(recruitment_graph.ainvoke({
                "email": email,
                "required_skills": required_skills,
                "status": "started",
                "error": None
            }))
            print(f"✅ Processed: {subject}")

        except Exception as e:
            # One email failed — log and continue to next, don't crash whole task
            print(f"❌ Error processing email '{email.get('subject', 'unknown')}': {str(e)}")
            continue

    return f"Processed {len(emails)} emails"
