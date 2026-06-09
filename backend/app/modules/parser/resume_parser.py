import re
from google import genai
from app.core.config import settings

client = genai.Client(api_key=settings.gemini_api_key)

def parse_resume(text: str) -> dict:
    prompt = f"""
You are an expert resume parser. Extract information from this resume text.

Resume Text:
{text[:3000]}

Reply in this EXACT format - NO markdown, NO asterisks, NO bold:
NAME: candidate full name here
EMAIL: email address here
PHONE: phone number here
SKILLS: skill1, skill2, skill3, skill4
EXPERIENCE: 0.5
EDUCATION: degree, college, year

STRICT RULES:
- NAME: Search the ENTIRE text for a person's full name. It may appear anywhere due to PDF parsing order. Look for a proper noun near an email address or phone number. Usually 2-3 words in ALL CAPS or Title Case. Ignore company names, college names, and project names.
- EMAIL: Look for @ symbol in text
- PHONE: Look for 10 digit number or +91 number
- SKILLS: List ALL technical skills found separated by commas
- EXPERIENCE: Write ONLY a decimal number like 0.0 or 0.5 or 1.0 or 2.0
  * No experience or student = 0.0
  * Has internship(s) = 0.5
  * 1 year job = 1.0
- EDUCATION: Write degree + college + year all on ONE LINE
- Do NOT use **, *, #, or any markdown
- Write NOT_FOUND only if truly cannot find
"""
    try:
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt
        )
        result_text = response.text.strip()

        result_text = result_text.replace("**", "")
        result_text = result_text.replace("*", "")
        result_text = result_text.replace("`", "")
        result_text = result_text.replace("#", "")

        print(f"--- Gemini Raw Response ---")
        print(result_text[:400])
        print(f"---------------------------")

        data = {
            "full_name": extract_field(result_text, "NAME"),
            "email": extract_field(result_text, "EMAIL"),
            "phone": extract_field(result_text, "PHONE"),
            "skills": extract_field(result_text, "SKILLS"),
            "experience_years": extract_experience(result_text, text),
            "education": extract_field(result_text, "EDUCATION")
        }

        # Fallback — extract email from raw text if Gemini missed it
        if not data["email"]:
            clean_text_for_email = (
                text
                .replace('\u200b', '')
                .replace('\u200c', '')
                .replace('\u200d', '')
                .replace('\ufeff', '')
            )
            email_pattern = r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'
            emails = re.findall(email_pattern, clean_text_for_email)
            if emails:
                data["email"] = emails[0]
                print(f"📧 Email found via regex: {emails[0]}")

        # Fallback — extract phone from raw text if Gemini missed it
        if not data["phone"]:
            phone_pattern = r'[\+]?[1-9][0-9 .\-\(\)]{8,}[0-9]'
            phones = re.findall(phone_pattern, text)
            if phones:
                data["phone"] = phones[0]

        # Fallback — extract name from email if Gemini missed it
        if not data["full_name"] and data["email"]:
            username = data["email"].split("@")[0]
            username = re.sub(r'[0-9_.]', ' ', username).strip()
            data["full_name"] = username.title()
            print(f"👤 Name fallback from email: {data['full_name']}")

        print(f"✅ Name: {data['full_name']}")
        print(f"✅ Email: {data['email']}")
        print(f"✅ Education: {data['education']}")
        print(f"✅ Experience: {data['experience_years']}")
        print(f"✅ Skills: {data['skills']}")

        return {"success": True, "data": data}

    except Exception as e:
        print(f"❌ Gemini failed: {str(e)}")
        return {"success": True, "data": parse_with_regex(text)}


def extract_field(text: str, field: str) -> str:
    lines = text.split("\n")
    for i, line in enumerate(lines):
        clean_line = line.strip()
        clean_line = clean_line.replace("**", "").replace("*", "").replace("`", "")

        pattern = rf"^{field}\s*:"
        if re.match(pattern, clean_line, re.IGNORECASE):
            parts = clean_line.split(":", 1)
            if len(parts) > 1:
                value = parts[1].strip()
                value = value.replace("**", "").replace("*", "")

                if not value or value.upper() == "NOT_FOUND":
                    return None

                if i + 1 < len(lines):
                    next_line = lines[i + 1].strip()
                    next_line = next_line.replace("**", "").replace("*", "")
                    if next_line and not re.match(r'^[A-Z]+\s*:', next_line, re.IGNORECASE):
                        value = value + " " + next_line

                return value if value else None
    return None


def extract_experience(text: str, raw_resume: str = "") -> float:
    value = extract_field(text, "EXPERIENCE")
    if value:
        try:
            value_lower = value.lower()
            if any(w in value_lower for w in ["fresher", "student", "no experience", "nil"]):
                return 0.5 if "intern" in raw_resume.lower() else 0.0
            nums = re.findall(r"[-+]?\d*\.\d+|\d+", value)
            if nums:
                exp = float(nums[0])
                return 0.0 if exp > 40 else exp
        except Exception:
            return 0.0

    raw_lower = raw_resume.lower()
    if "intern" in raw_lower or "trainee" in raw_lower:
        return 0.5
    exp_match = re.findall(r'(\d+)\+?\s*years?\s*(?:of\s*)?experience', raw_lower)
    if exp_match:
        return float(exp_match[0])
    return 0.0


def parse_with_regex(text: str) -> dict:
    clean_text = (
        text
        .replace('\u200b', '')
        .replace('\u200c', '')
        .replace('\u200d', '')
        .replace('\ufeff', '')
        .replace('\xa0', ' ')
    )

    email_pattern = r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'
    email = re.findall(email_pattern, clean_text)

    phone_pattern = r'[\+]?[1-9][0-9 .\-\(\)]{8,}[0-9]'
    phone = re.findall(phone_pattern, clean_text)

    name = None
    lines = [l.strip() for l in clean_text.split('\n') if l.strip()]
    if lines:
        first_line = lines[0]
        words = first_line.split()
        if 2 <= len(words) <= 4 and all(w.replace('.','').isalpha() for w in words):
            name = first_line

    # Fallback name from email
    if not name and email:
        username = email[0].split("@")[0]
        username = re.sub(r'[0-9_.]', ' ', username).strip()
        name = username.title()

    education = None
    edu_keywords = [
        "b.tech", "be ", "b.e", "m.tech", "mba",
        "bachelor", "master", "diploma", "engineering",
        "b.sc", "m.sc", "degree"
    ]
    for i, line in enumerate(lines):
        line_lower = line.lower()
        if any(kw in line_lower for kw in edu_keywords):
            education = line
            if i + 1 < len(lines):
                next_line = lines[i + 1].strip()
                if next_line and not any(
                    kw in next_line.lower()
                    for kw in ["intern", "project", "skill", "summary", "experience", "certif"]
                ):
                    education = education + ", " + next_line
            break

    common_skills = [
        "python", "llm", "llms", "edge ai", "computer vision",
        "opencv", "tensorflow", "pytorch", "machine learning",
        "esp32", "stm32", "freertos", "rtos", "ble", "wifi",
        "iot", "firmware", "embedded", "uart", "spi", "i2c",
        "arm", "arduino", "raspberry pi", "microcontroller",
        "pcb", "kicad", "altium", "dfm", "pcba", "schematic",
        "solidworks", "fusion 360", "fdm", "sla", "cad",
        "c", "c++", "linux", "git", "sql", "aws", "docker",
        "lpc2129", "lpc2148", "keil", "proteus", "can", "rs485",
        "gpio", "adc", "isr", "pwm", "timer", "flash magic",
        "gdb", "gcc", "vscode", "tcp/ip", "modbus"
    ]

    found_skills = []
    text_lower = clean_text.lower()
    for skill in common_skills:
        if skill in text_lower:
            found_skills.append(skill)

    experience = 0.0
    if "intern" in text_lower or "trainee" in text_lower:
        experience = 0.5
    exp_match = re.findall(r'(\d+)\+?\s*years?\s*(?:of\s*)?experience', text_lower)
    if exp_match:
        experience = float(exp_match[0])

    return {
        "full_name": name,
        "email": email[0] if email else None,
        "phone": phone[0] if phone else None,
        "skills": ", ".join(found_skills) if found_skills else None,
        "experience_years": experience,
        "education": education
    }
