from pdf2image import convert_from_bytes
import io

POPPLER_PATH = r"C:\poppler\poppler-24.02.0\bin\poppler-26.02.0\Library\bin"

def convert_pdf_to_images(pdf_data: bytes) -> list:
    try:
        images = convert_from_bytes(
            pdf_data,
            dpi=300,
            poppler_path=POPPLER_PATH
        )
        
        result = []
        for i, image in enumerate(images):
            img_bytes = io.BytesIO()
            image.save(img_bytes, format='PNG')
            result.append({
                "page": i + 1,
                "data": img_bytes.getvalue()
            })
        
        return {"success": True, "pages": result, "total_pages": len(result)}
    
    except Exception as e:
        return {"success": False, "pages": [], "error": str(e)}