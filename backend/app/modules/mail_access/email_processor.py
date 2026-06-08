from app.modules.mail_access.gmail_client import get_recruitment_emails
from app.modules.classifier.email_classifier import classify_email
from app.modules.resume_processor.detector import detect_resume
from app.modules.resume_processor.pdf_extractor import extract_text_from_pdf
from app.modules.resume_processor.docx_extractor import extract_text_from_docx
from app.modules.parser.resume_parser import parse_resume
from app.modules.matcher.skill_matcher import match_skills
from app.core.database import SessionLocal
from app.models.candidate import Candidate

def process_recruitment_emails(required_skills: str):
    # This is the MAIN function that runs the full pipeline
    # Email → Classify → Detect Resume → Extract → Parse → Match → Save
    
    print("📧 Checking emails...")
    emails = get_recruitment_emails()
    print(f"Found {len(emails)} unread emails")
    
    results = []
    
    for email in emails:
        print(f"\n Processing: {email['subject']}")
        
        # Step 1 — Classify email
        classification = classify_email(
            email["subject"],
            email["body"]
        )
        print(f"Classification: {classification['classification']}")
        
        # Skip if not recruitment
        if not classification["is_recruitment"]:
            print("⏭ Skipping — not a recruitment email")
            continue
        
        # Step 2 — Detect resume attachment
        resume = detect_resume(email["attachments"])
        
        if not resume["found"]:
            print("⚠ No resume found in email")
            results.append({
                "subject": email["subject"],
                "sender": email["sender"],
                "status": "no_resume"
            })
            continue
        
        print(f"✅ Resume found: {resume['filename']}")
        
        # Step 3 — Extract text from resume
        text = ""
        if resume["file_type"] == ".pdf":
            extraction = extract_text_from_pdf(resume["data"])
            text = extraction["text"]
        elif resume["file_type"] in [".docx", ".doc"]:
            extraction = extract_text_from_docx(resume["data"])
            text = extraction["text"]
        
        if not text:
            print("⚠ Could not extract text from resume")
            continue
        
        print("✅ Text extracted from resume")
        
        # Step 4 — Parse resume
        parsed = parse_resume(text)
        candidate_data = parsed["data"]
        print(f"✅ Parsed: {candidate_data['full_name']}")
        
        # Step 5 — Match skills
        match_result = match_skills(
            candidate_data["skills"],
            required_skills
        )
        print(f"✅ Match Score: {match_result['match_score']}%")
        print(f"Recommendation: {match_result['recommendation']}")
        
        # Step 6 — Save to database
        db = SessionLocal()
        try:
            candidate = Candidate(
                full_name=candidate_data["full_name"],
                email=candidate_data["email"],
                phone=candidate_data["phone"],
                skills=candidate_data["skills"],
                experience_years=candidate_data["experience_years"],
                education=candidate_data["education"],
                resume_text=text,
                match_score=match_result["match_score"],
                status=match_result["recommendation"].lower(),
                email_subject=email["subject"],
                sender_email=email["sender"]
            )
            db.add(candidate)
            db.commit()
            print("✅ Candidate saved to database!")
        finally:
            db.close()
        
        results.append({
            "subject": email["subject"],
            "sender": email["sender"],
            "candidate": candidate_data["full_name"],
            "match_score": match_result["match_score"],
            "recommendation": match_result["recommendation"]
        })
    
    return results