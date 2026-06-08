import httpx
from app.core.config import settings

async def send_hr_notification(candidate_data: dict, match_result: dict, resume_data: bytes = None, resume_filename: str = None) -> dict:
    try:
        message = f"""
🔔 *New Candidate Match!*

👤 *Name:* {candidate_data.get('full_name', 'Unknown')}
📧 *Email:* {candidate_data.get('email', 'Unknown')}
💼 *Experience:* {candidate_data.get('experience_years', 0)} years
🎓 *Education:* {candidate_data.get('education', 'Not specified')}

📊 *Match Score:* {match_result.get('match_score', 0)}%
✅ *Matched Skills:* {', '.join(match_result.get('matched_skills', []))}
❌ *Missing Skills:* {', '.join(match_result.get('missing_skills', []))}

🤖 *AI Recommendation:* {match_result.get('recommendation', 'UNKNOWN')}

*Approve this candidate?*
        """

        keyboard = {
            "inline_keyboard": [[
                {
                    "text": "✅ YES - Shortlist",
                    "callback_data": f"approve_{candidate_data.get('candidate_id', 'unknown')}"
                },
                {
                    "text": "❌ NO - Reject",
                    "callback_data": f"reject_{candidate_data.get('candidate_id', 'unknown')}"
                }
            ]]
        }

        # Send message with YES/NO buttons
        url = f"https://api.telegram.org/bot{settings.telegram_bot_token}/sendMessage"

        async with httpx.AsyncClient() as client:
            response = await client.post(url, json={
                "chat_id": settings.telegram_chat_id,
                "text": message,
                "parse_mode": "Markdown",
                "reply_markup": keyboard
            })

        data = response.json()

        # Send resume file if available
        if resume_data and resume_filename:
            await send_resume_file(resume_data, resume_filename)

        if data.get("ok"):
            return {"success": True, "message_id": data["result"]["message_id"]}
        else:
            return {"success": False, "error": data.get("description")}

    except Exception as e:
        return {"success": False, "error": str(e)}


async def send_resume_file(file_data: bytes, filename: str) -> dict:
    try:
        url = f"https://api.telegram.org/bot{settings.telegram_bot_token}/sendDocument"

        async with httpx.AsyncClient() as client:
            response = await client.post(
                url,
                data={"chat_id": settings.telegram_chat_id},
                files={"document": (filename, file_data)}
            )

        data = response.json()
        if data.get("ok"):
            print("✅ Resume sent to Telegram!")
            return {"success": True}
        else:
            print(f"⚠ Resume send failed: {data.get('description')}")
            return {"success": False}

    except Exception as e:
        print(f"⚠ Resume file error: {str(e)}")
        return {"success": False, "error": str(e)}