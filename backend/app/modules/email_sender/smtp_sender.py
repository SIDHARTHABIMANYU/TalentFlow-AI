import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from app.core.config import settings


def send_interview_invite(candidate_email: str, candidate_name: str, job_title: str) -> dict:
    try:
        subject = f"Interview Invitation - {job_title} | Inceptarc"

        body = f"""
Dear {candidate_name},

Congratulations!

We have reviewed your application for the {job_title} position at Inceptarc and are pleased to invite you for an interview.

Our team will contact you shortly with the interview schedule details.

Best regards,
Inceptarc
        """

        return _send_email(candidate_email, subject, body)

    except Exception as e:
        return {"success": False, "error": str(e)}


def send_rejection_email(candidate_email: str, candidate_name: str, job_title: str) -> dict:
    try:
        subject = f"Application Update - {job_title} | Inceptarc"

        body = f"""
Dear {candidate_name},

Thank you for your interest in the {job_title} position at Inceptarc.

After careful consideration, we regret to inform you that we will not be moving forward with your application at this time.

We will keep your resume on file for future opportunities.

We wish you all the best in your job search.

Best regards,
Inceptarc
        """

        return _send_email(candidate_email, subject, body)

    except Exception as e:
        return {"success": False, "error": str(e)}


def send_no_resume_email(candidate_email: str) -> dict:
    try:
        subject = "Application Received - Resume Required | Inceptarc"

        body = """
Dear Applicant,

Thank you for reaching out to Inceptarc.

We noticed your email did not include a resume attachment.

Please reply to this email with your resume attached (PDF or DOCX format) to complete your application.

Best regards,
Inceptarc
        """

        return _send_email(candidate_email, subject, body)

    except Exception as e:
        return {"success": False, "error": str(e)}


def send_resubmit_email(candidate_email: str) -> dict:
    try:
        subject = "Resume Format Issue - Inceptarc"

        body = """
Dear Candidate,

Thank you for applying to Inceptarc!

We received your application but our system could not extract your resume details properly.

This usually happens with:
- Password protected PDFs
- Image-only PDFs
- Heavily designed PDFs

Please resubmit your resume in one of these formats:
- Simple PDF (Word saved as PDF)
- ATS-friendly PDF
- Plain DOCX file

Reply to this email with your resume in the correct format.

We look forward to reviewing your application!

Best regards,
Inceptarc
careers@inceptarc.com
        """

        return _send_email(candidate_email, subject, body)

    except Exception as e:
        print(f"Resubmit email failed: {e}")
        return {"success": False, "error": str(e)}


def _send_email(to_email: str, subject: str, body: str) -> dict:
    try:
        msg = MIMEMultipart()

        msg["From"] = settings.gmail_user
        msg["To"] = to_email
        msg["Subject"] = subject

        msg.attach(MIMEText(body, "plain"))

        with smtplib.SMTP_SSL("smtp.gmail.com", 465) as server:
            server.login(
                settings.gmail_user,
                settings.gmail_password
            )

            server.sendmail(
                settings.gmail_user,
                to_email,
                msg.as_string()
            )

        print(f"✅ Email sent to {to_email}")

        return {
            "success": True,
            "sent_to": to_email
        }

    except Exception as e:
        print(f"❌ Email failed: {str(e)}")

        return {
            "success": False,
            "error": str(e)
        }
