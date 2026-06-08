import imaplib
import email
from email.header import decode_header
from app.core.config import settings


def connect_to_gmail():
    """Always creates a fresh IMAP connection — never reuses stale ones"""
    try:
        mail = imaplib.IMAP4_SSL("imap.gmail.com", 993)
        mail.login(settings.gmail_user, settings.gmail_password)
        return mail
    except imaplib.IMAP4.abort as e:
        raise Exception(f"IMAP connection aborted (socket EOF): {e}")
    except imaplib.IMAP4.error as e:
        raise Exception(f"IMAP login failed (check App Password): {e}")


def get_recruitment_emails():
    """Reads unread emails from Gmail — fresh connection every call"""
    mail = None  # so finally block is safe even if connect fails

    try:
        mail = connect_to_gmail()

        # Select inbox
        mail.select("inbox")

        # Search for unread emails only
        status, messages = mail.search(None, "UNSEEN")

        email_list = []

        # Get list of email IDs
        email_ids = messages[0].split()

        if not email_ids:
            print("📭 No unread emails found")
            return []

        print(f"📬 Found {len(email_ids)} unread email(s)")

        # Read last 10 unread emails
        for email_id in email_ids[-10:]:
            try:
                status, msg_data = mail.fetch(email_id, "(RFC822)")

                for response_part in msg_data:
                    if isinstance(response_part, tuple):
                        msg = email.message_from_bytes(response_part[1])

                        # Get subject
                        subject = decode_header(msg["Subject"])[0][0]
                        if isinstance(subject, bytes):
                            subject = subject.decode()

                        # Get sender
                        sender = msg.get("From")

                        # Get attachments
                        attachments = []
                        for part in msg.walk():
                            if part.get_content_disposition() == "attachment":
                                filename = part.get_filename()
                                if filename:
                                    attachments.append({
                                        "filename": filename,
                                        "data": part.get_payload(decode=True)
                                    })

                        # Get body
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
                            "attachments": attachments
                        })

            except Exception as e:
                print(f"⚠️ Error reading one email (skipping): {e}")
                continue  # skip bad email, don't crash the whole batch

        return email_list

    except imaplib.IMAP4.abort as e:
        # Socket dropped mid-session — Celery will retry next minute
        print(f"🔌 IMAP connection dropped (socket EOF): {e}")
        return []

    except Exception as e:
        print(f"❌ Gmail fetch error: {e}")
        return []

    finally:
        # Always close cleanly — even if error happened
        if mail:
            try:
                mail.close()
            except Exception:
                pass
            try:
                mail.logout()
            except Exception:
                pass