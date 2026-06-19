from langgraph.graph import StateGraph, END
from typing import TypedDict, Optional

class RecruitmentState(TypedDict):
    email: dict
    classification: dict
    resume: dict
    resume_text: str
    parsed_data: dict
    match_result: dict
    candidate_id: str
    required_skills: str
    status: str
    error: Optional[str]

def classify_node(state: RecruitmentState) -> RecruitmentState:
    from app.modules.classifier.email_classifier import classify_email
    print(f"📧 Classifying: {state['email']['subject']}")
    classification = classify_email(
        state["email"]["subject"],
        state["email"]["body"]
    )
    state["classification"] = classification
    state["status"] = "classified"
    return state

def detect_resume_node(state: RecruitmentState) -> RecruitmentState:
    from app.modules.resume_processor.detector import detect_resume
    print("🔍 Detecting resume...")
    resume = detect_resume(state["email"]["attachments"])
    state["resume"] = resume
    state["status"] = "resume_detected"
    return state

def extract_text_node(state: RecruitmentState) -> RecruitmentState:
    print("📄 Extracting text...")
    try:
        resume = state.get("resume", {})
        file_data = resume.get("data")
        file_type = resume.get("type", "pdf")
        filename = resume.get("filename", "resume.pdf")

        if not file_data:
            sender_email = state["email"].get("sender")
            if sender_email:
                from app.modules.email_sender.smtp_sender import send_no_resume_email
                send_no_resume_email(sender_email)
                print(f"✅ No resume email sent to {sender_email}")
            state["error"] = "no_resume_file"
            state["status"] = "no_resume"
            return state

        if file_type == "pdf":
            from app.modules.resume_processor.pdf_extractor import extract_text_from_pdf
            result = extract_text_from_pdf(file_data)
            text = result.get("text", "")
            quality = result.get("quality", {})

            print(f"📊 Quality: {quality.get('reason')}")

            if not quality.get("is_good"):
                print(f"⚠ Poor quality: {quality['reason']}")
                sender_email = state["email"].get("sender")
                if sender_email:
                    from app.modules.email_sender.smtp_sender import send_resubmit_email
                    send_resubmit_email(sender_email)
                    print(f"✅ Resubmit email sent to {sender_email}")
                state["error"] = "poor_resume_quality"
                state["status"] = "resubmit_requested"
                return state

        elif file_type in ["docx", "doc"]:
            from app.modules.resume_processor.docx_extractor import extract_text_from_docx
            text = extract_text_from_docx(file_data)

            if not text or len(text.strip()) < 100:
                sender_email = state["email"].get("sender")
                if sender_email:
                    from app.modules.email_sender.smtp_sender import send_resubmit_email
                    send_resubmit_email(sender_email)
                state["error"] = "poor_resume_quality"
                state["status"] = "resubmit_requested"
                return state
        else:
            sender_email = state["email"].get("sender")
            if sender_email:
                from app.modules.email_sender.smtp_sender import send_resubmit_email
                send_resubmit_email(sender_email)
            state["error"] = "unsupported_format"
            state["status"] = "resubmit_requested"
            return state

        state["resume_text"] = text
        state["status"] = "text_extracted"
        return state

    except Exception as e:
        print(f"❌ Extract error: {str(e)}")
        state["error"] = str(e)
        return state

def parse_resume_node(state: RecruitmentState) -> RecruitmentState:
    from app.modules.parser.resume_parser import parse_resume
    print("🤖 Parsing resume with Gemini...")
    result = parse_resume(state["resume_text"])
    state["parsed_data"] = result.get("data", {})
    state["status"] = "parsed"
    return state

def match_skills_node(state: RecruitmentState) -> RecruitmentState:
    from app.modules.matcher.skill_matcher import match_skills
    print("🎯 Matching skills...")
    match_result = match_skills(
        state["parsed_data"].get("skills", ""),
        state["required_skills"],
        state.get("resume_text", "")
    )
    state["match_result"] = match_result
    state["status"] = "matched"
    return state

def save_to_db_node(state: RecruitmentState) -> RecruitmentState:
    from app.core.database import SessionLocal
    from app.models.candidate import Candidate
    from sqlalchemy.exc import IntegrityError
    print("💾 Saving to database...")

    message_id = state["email"].get("message_id")

    db = SessionLocal()
    try:
        # Final safety check right before insert — catches race conditions
        # where two pollers both passed the earlier dedup check at the same time
        if message_id:
            existing = db.query(Candidate).filter(
                Candidate.message_id == message_id
            ).first()
            if existing:
                print(f"⏭ Duplicate caught at save time (Message-ID already exists), skipping: {message_id}")
                state["candidate_id"] = str(existing.id)
                state["status"] = "duplicate_skipped"
                return state

        candidate = Candidate(
            full_name=state["parsed_data"].get("full_name"),
            email=state["parsed_data"].get("email"),
            phone=state["parsed_data"].get("phone"),
            skills=state["parsed_data"].get("skills"),
            experience_years=state["parsed_data"].get("experience_years"),
            education=state["parsed_data"].get("education"),
            resume_text=state["resume_text"],
            match_score=state["match_result"]["match_score"],
            status=state["match_result"]["recommendation"].lower(),
            email_subject=state["email"]["subject"],
            sender_email=state["email"]["sender"],
            message_id=message_id
        )
        db.add(candidate)
        db.commit()
        db.refresh(candidate)
        state["candidate_id"] = str(candidate.id)
        print(f"✅ Saved! ID: {state['candidate_id']}")

    except IntegrityError as e:
        # Unique constraint violation — another poller saved this exact
        # Message-ID a split second before us. This is expected and harmless.
        db.rollback()
        print(f"⏭ Race condition caught (duplicate Message-ID at DB level), skipping safely")
        state["status"] = "duplicate_skipped"
        return state

    except Exception as e:
        print(f"❌ DB error: {str(e)}")
        db.rollback()
    finally:
        db.close()
    state["status"] = "saved"
    return state

def notify_hr_node(state: RecruitmentState) -> RecruitmentState:
    import asyncio
    from app.modules.notifier.telegram_bot import send_hr_notification
    print("📱 Notifying HR on Telegram...")

    candidate_data = state["parsed_data"].copy()
    candidate_data["candidate_id"] = state.get("candidate_id", "unknown")

    resume_data = state["resume"].get("data")
    resume_filename = state["resume"].get("filename", "resume.pdf")

    try:
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        result = loop.run_until_complete(
            send_hr_notification(
                candidate_data,
                state["match_result"],
                resume_data,
                resume_filename
            )
        )
        loop.close()
        if result["success"]:
            print("✅ HR notified on Telegram!")
        else:
            print(f"⚠ Telegram failed: {result.get('error')}")
    except Exception as e:
        print(f"⚠ Telegram error: {str(e)}")

    state["status"] = "hr_notified"
    return state

def should_process(state: RecruitmentState) -> str:
    if state["classification"]["is_recruitment"]:
        return "detect_resume"
    return END

def resume_found(state: RecruitmentState) -> str:
    if state["resume"]["found"]:
        return "extract_text"
    return END

def check_extraction(state: RecruitmentState) -> str:
    if state.get("error") in ["no_resume_file", "poor_resume_quality",
                               "unsupported_format", "resubmit_requested"]:
        return END
    if not state.get("resume_text"):
        return END
    return "parse_resume"

def check_score(state: RecruitmentState) -> str:
    if state.get("status") == "duplicate_skipped":
        return END
    score = state["match_result"]["match_score"]
    print(f"📊 Score: {score}%")
    if score >= 50:
        return "notify_hr"
    return END

def build_recruitment_graph():
    graph = StateGraph(RecruitmentState)

    graph.add_node("classify", classify_node)
    graph.add_node("detect_resume", detect_resume_node)
    graph.add_node("extract_text", extract_text_node)
    graph.add_node("parse_resume", parse_resume_node)
    graph.add_node("match_skills", match_skills_node)
    graph.add_node("save_to_db", save_to_db_node)
    graph.add_node("notify_hr", notify_hr_node)

    graph.set_entry_point("classify")

    graph.add_conditional_edges("classify", should_process)
    graph.add_conditional_edges("detect_resume", resume_found)
    graph.add_conditional_edges("extract_text", check_extraction)
    graph.add_edge("parse_resume", "match_skills")
    graph.add_edge("match_skills", "save_to_db")
    graph.add_conditional_edges("save_to_db", check_score)
    graph.add_edge("notify_hr", END)

    return graph.compile()

recruitment_graph = build_recruitment_graph()
