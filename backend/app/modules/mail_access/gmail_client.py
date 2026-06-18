import imaplib
import email
from email.header import decode_header
from app.core.config import settings


def connect_to_gmail():
    try:
        mail = imaplib.IMAP4_SSL("imap.gmail.com", 993)
        mail.login(settings.gmail_user, settings.gmail_password)
        return mail
    except imaplib.IMAP4.abort as e:
        raise Exception(f"IMAP connection aborted (socket EOF): {e}")
    except imaplib.IMAP4.error as e:
        raise Exception(f"IMAP login failed (check App Password): {e}")


def get_recruitment_emails():
    mail = None
    from app.core.database import SessionLocal
    from app.models.candidate import Candidate

    try:
        mail = connect_to_gmail()
        mail.select("inbox")

        from datetime import datetime, timedelta
        since_date = (datetime.now() - timedelta(days=7)).strftime("%d-%b-%Y")
        status, messages = mail.search(None, "SINCE", since_date)

        email_list = []
        email_ids = messages[0].split()

        if not email_ids:
            print("📭 No recent emails found")
            return []

        print(f"📬 Found {len(email_ids)} email(s) in last 7 days, checking for new ones...")

        db = SessionLocal()
        try:
            for email_id in email_ids:
                try:
                    status, msg_data = mail.fetch(email_id, "(RFC822)")

                    for response_part in msg_data:
                        if isinstance(response_part, tuple):
                            msg = email.message_from_bytes(response_part[1])

                            message_id = msg.get("Message-ID", "").strip()

                            if message_id:
                                exists = db.query(Candidate).filter(
                                    Candidate.message_id == message_id
                                ).first()
                                if exists:
                                    continue

                            subject = decode_header(msg["Subject"])[0][0]
                            if isinstance(subject, bytes):
                                subject = subject.decode()

                            sender = msg.get("From")

                            attachments = []
                            for part in msg.walk():
                                if part.get_content_disposition() == "attachment":
                                    filename = part.get_filename()
                                    if filename:
                                        attachments.append({
                                            "filename": filename,
                                            "data": part.get_payload(decode=True)
                                        })

                            body = ""
                            if msg.is_multipart():
                                for part in msg.walk():
                                    if part.get_content_type() == "text/plain":
                                        try:
                                            body = part.get_payload(decode=True).decode()
                                        except Exception:
                                            body = part.get_payload(decode=True).decode("latin-1", errors="replace")
                                        break
                            else:
                                try:
                                    body = msg.get_payload(decode=True).decode()
                                except Exception:
                                    body = msg.get_payload(decode=True).decode("latin-1", errors="replace")

                            email_list.append({
                                "subject": subject,
                                "sender": sender,
                                "body": body,
                                "attachments": attachments,
                                "message_id": message_id
                            })

                except Exception as e:
                    print(f"⚠️ Error reading one email (skipping): {e}")
                    continue
        finally:
            db.close()

        print(f"📨 {len(email_list)} new email(s) to process after dedup check")
        return email_list

    except imaplib.IMAP4.abort as e:
        print(f"🔌 IMAP connection dropped (socket EOF): {e}")
        return []

    except Exception as e:
        print(f"❌ Gmail fetch error: {e}")
        return []

    finally:
        if mail:
            try:
                mail.close()
            except Exception:
                pass
            try:
                mail.logout()
            except Exception:
                pass
