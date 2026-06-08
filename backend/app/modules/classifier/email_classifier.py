from google import genai
from app.core.config import settings

client = genai.Client(api_key=settings.gemini_api_key)

def classify_email(subject: str, body: str) -> dict:
    prompt = f"""
You are an HR email classifier.

Email Subject: {subject}
Email Body: {body[:300]}

Is this a job application or recruitment email?

Reply EXACTLY in this format:
CLASSIFICATION: RECRUITMENT
CONFIDENCE: HIGH
REASON: candidate applying for job

Examples of RECRUITMENT:
- Application for internship
- Applying for developer role
- Resume submission
- Job application

Reply only with the 3 lines above.
"""
    try:
        # ✅ New google.genai SDK
        response = client.models.generate_content(
            model = "gemini-2.5-flash",
            contents=prompt
        )
        result_text = response.text.strip()

        lines = result_text.split("\n")
        classification = "NOT_RECRUITMENT"
        confidence = "LOW"
        reason = ""

        for line in lines:
            if "CLASSIFICATION:" in line:
                classification = line.split(":", 1)[1].strip()
            elif "CONFIDENCE:" in line:
                confidence = line.split(":", 1)[1].strip()
            elif "REASON:" in line:
                reason = line.split(":", 1)[1].strip()

        # Force RECRUITMENT if subject has job keywords
        keywords = ["application", "applying", "resume", "internship",
                    "position", "job", "developer", "engineer", "role"]
        if any(keyword in subject.lower() for keyword in keywords):
            classification = "RECRUITMENT"
            confidence = "HIGH"

        return {
            "is_recruitment": classification == "RECRUITMENT",
            "classification": classification,
            "confidence": confidence,
            "reason": reason
        }

    except Exception as e:
        return {
            "is_recruitment": True,
            "classification": "RECRUITMENT",
            "confidence": "LOW",
            "reason": str(e)
        }
