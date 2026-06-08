def detect_resume(attachments: list) -> dict:
    supported_formats = [".pdf", ".docx", ".doc", ".jpg", ".jpeg", ".png"]
    
    for attachment in attachments:
        filename = attachment["filename"].lower()
        
        for fmt in supported_formats:
            if filename.endswith(fmt):
                # Detect if it's an image resume
                is_image = fmt in [".jpg", ".jpeg", ".png"]
                return {
                    "found": True,
                    "filename": attachment["filename"],
                    "file_type": fmt,
                    "is_image": is_image,
                    "data": attachment["data"]
                }
    
    return {
        "found": False,
        "filename": None,
        "file_type": None,
        "is_image": False,
        "data": None
    }