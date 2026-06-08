import pytesseract
import cv2
import numpy as np
from PIL import Image
import io

# Tell pytesseract where Tesseract is installed
pytesseract.pytesseract.tesseract_cmd = r'C:\Program Files\Tesseract-OCR\tesseract.exe'

def preprocess_image(image):
    # Convert PIL image to OpenCV format
    img_array = np.array(image)
    
    # Convert to grayscale
    if len(img_array.shape) == 3:
        gray = cv2.cvtColor(img_array, cv2.COLOR_RGB2GRAY)
    else:
        gray = img_array
    
    # Remove noise
    denoised = cv2.fastNlMeansDenoising(gray, h=10)
    
    # Apply threshold — makes text black, background white
    _, threshold = cv2.threshold(
        denoised, 0, 255,
        cv2.THRESH_BINARY + cv2.THRESH_OTSU
    )
    
    return threshold

def extract_text_with_ocr(image_data: bytes) -> dict:
    try:
        # Open image
        image = Image.open(io.BytesIO(image_data))
        
        # Preprocess
        processed = preprocess_image(image)
        
        # Run OCR
        text = pytesseract.image_to_string(processed, lang='eng')
        
        return {
            "success": True,
            "text": text,
            "method": "tesseract_ocr"
        }
    
    except Exception as e:
        return {
            "success": False,
            "text": "",
            "method": "tesseract_ocr",
            "error": str(e)
        }   