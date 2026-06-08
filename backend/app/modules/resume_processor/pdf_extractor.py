import pdfplumber
import PyPDF2
import io
import re
import unicodedata
import tempfile
import os

def clean_text(text: str) -> str:
    """
    Universal text cleaner handles ALL resume types:
    - Null bytes from Enhancv/Canva PDFs
    - Zero width spaces
    - Spaced letters S U G A N Y A
    - Special unicode characters
    - Control characters
    """
    if not text:
        return text

    # Remove null bytes
    text = text.replace('\x00', '').replace('\0', '')

    # Remove zero width characters
    for char in ['\u200b', '\u200c', '\u200d', '\u200e',
                 '\u200f', '\ufeff', '\u00ad', '\u2028', '\u2029']:
        text = text.replace(char, '')

    # Fix spaced letters S U G A N Y A → SUGANYA
    lines = text.split('\n')
    cleaned_lines = []
    for line in lines:
        stripped = line.strip()
        words = stripped.split(' ')
        all_single = all(len(w) == 1 for w in words if w.strip())
        if len(words) >= 3 and all_single:
            cleaned_lines.append(''.join(w for w in words if w.strip()))
        else:
            cleaned_lines.append(line)
    text = '\n'.join(cleaned_lines)

    # Remove control characters
    text = re.sub(r'[\x01-\x08\x0b\x0c\x0e-\x1f\x7f]', '', text)

    # Fix multiple spaces and newlines
    text = re.sub(r' +', ' ', text)
    text = re.sub(r'\n{3,}', '\n\n', text)

    return text.strip()

def check_extraction_quality(text: str) -> dict:
    """
    Check if extracted text is good enough to process
    Returns quality assessment
    """
    if not text or len(text.strip()) < 100:
        return {
            "is_good": False,
            "reason": "too_short",
            "message": "Could not extract text from resume"
        }

    text_lower = text.lower()

    # Check for common resume sections
    has_contact = any(word in text_lower for word in
                     ["email", "@", "phone", "mobile", "contact"])

    has_skills = any(word in text_lower for word in
                    ["skill", "experience", "education", "project",
                     "work", "intern", "certif"])

    has_technical = any(word in text_lower for word in [
        # Electronics
        "pcb", "kicad", "altium", "esp32", "arduino",
        "embedded", "firmware", "iot", "uart", "spi",
        # Mechanical
        "solidworks", "fusion", "cad", "fdm", "3d",
        # AI
        "python", "machine learning", "ai", "deep learning",
        # General
        "c++", "java", "sql", "linux", "git"
    ])

    if not has_contact:
        return {
            "is_good": False,
            "reason": "no_contact",
            "message": "Resume missing contact information"
        }

    if not has_skills and not has_technical:
        return {
            "is_good": False,
            "reason": "no_skills",
            "message": "Could not find skills in resume"
        }

    return {
        "is_good": True,
        "reason": "ok",
        "message": "Resume extracted successfully"
    }

def extract_text_from_pdf(file_data: bytes) -> dict:
    text = ""
    method = "none"

    # Step 1 — Try pdfplumber
    file_obj = io.BytesIO(file_data)
    text = extract_with_pdfplumber(file_obj)
    if text and len(text.strip()) > 100:
        method = "pdfplumber"

    # Step 2 — Check multi-column
    if text:
        lines = [l for l in text.split('\n') if l.strip()]
        avg_line_length = sum(len(l) for l in lines) / len(lines) if lines else 0
        text_lower = text.lower()

        is_multi_column = (
            avg_line_length > 40
            or "contact objective" in text_lower
            or "education projects" in text_lower
            or "skills projects" in text_lower
            or "tools certifications" in text_lower
        )

        if is_multi_column:
            print("⚠ Multi-column detected! Switching to PyPDF2...")
            file_obj = io.BytesIO(file_data)
            pypdf_text = extract_with_pypdf2(file_obj)
            if pypdf_text and len(pypdf_text.strip()) > 100:
                text = pypdf_text
                method = "pypdf2"

    # Step 3 — Try PyPDF2 if pdfplumber failed
    if not text or len(text.strip()) < 100:
        file_obj = io.BytesIO(file_data)
        text = extract_with_pypdf2(file_obj)
        if text:
            method = "pypdf2"

    # Step 4 — Try Tesseract for scanned PDFs
    if not text or len(text.strip()) < 100:
        print("⚠ Text extraction failed! Trying Tesseract OCR...")
        text = extract_with_tesseract(file_data)
        if text:
            method = "tesseract"

    # Clean text universally
    if text:
        text = clean_text(text)

    # Check quality
    quality = check_extraction_quality(text)

    print(f"📄 Method: {method}")
    print(f"📄 Length: {len(text) if text else 0} chars")
    print(f"📄 Quality: {quality['reason']}")

    return {
        "text": text,
        "is_scanned": method == "tesseract",
        "method": method,
        "quality": quality
    }

def extract_with_pdfplumber(file_obj) -> str:
    try:
        text = ""
        with pdfplumber.open(file_obj) as pdf:
            for page in pdf.pages:
                page_text = page.extract_text()
                if page_text:
                    text += page_text + "\n"
        return text
    except Exception as e:
        print(f"pdfplumber error: {e}")
        return ""

def extract_with_pypdf2(file_obj) -> str:
    try:
        text = ""
        reader = PyPDF2.PdfReader(file_obj)
        for page in reader.pages:
            page_text = page.extract_text()
            if page_text:
                text += page_text + "\n"
        return text
    except Exception as e:
        print(f"PyPDF2 error: {e}")
        return ""

def extract_with_tesseract(file_data: bytes) -> str:
    try:
        from pdf2image import convert_from_bytes
        import pytesseract

        print("🔍 Using Tesseract OCR...")
        images = convert_from_bytes(file_data, dpi=200)
        text = ""
        for image in images:
            text += pytesseract.image_to_string(image) + "\n"
        print(f"✅ Tesseract extracted {len(text)} chars")
        return text
    except Exception as e:
        print(f"⚠ Tesseract error: {e}")
        return ""