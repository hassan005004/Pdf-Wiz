"""
FastAPI backend for PDF manipulation web application
"""
import os
import uuid
import shutil
import zipfile
from datetime import datetime, timedelta
from typing import List, Optional
from pathlib import Path

from fastapi import FastAPI, File, UploadFile, HTTPException, Form, BackgroundTasks
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware

from pdf_processor import PDFProcessor

app = FastAPI(title="PDF Manipulation Tool", version="1.0.0")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static files
app.mount("/static", StaticFiles(directory="static"), name="static")

# Create directories if they don't exist
os.makedirs("uploads", exist_ok=True)
os.makedirs("outputs", exist_ok=True)

pdf_processor = PDFProcessor()

@app.get("/")
async def read_root():
    """Serve the main HTML page"""
    return FileResponse("static/index.html")

@app.post("/api/merge")
async def merge_pdfs(files: List[UploadFile] = File(...)):
    """Merge multiple PDF files into one"""
    try:
        if len(files) < 2:
            raise HTTPException(status_code=400, detail="At least 2 PDF files required for merging")
        
        # Save uploaded files
        temp_files = []
        for file in files:
            if not file.filename.lower().endswith('.pdf'):
                raise HTTPException(status_code=400, detail=f"File {file.filename} is not a PDF")
            
            temp_path = f"uploads/{uuid.uuid4()}_{file.filename}"
            with open(temp_path, "wb") as buffer:
                shutil.copyfileobj(file.file, buffer)
            temp_files.append(temp_path)
        
        # Process PDF
        output_path = f"outputs/merged_{uuid.uuid4()}.pdf"
        pdf_processor.merge_pdfs(temp_files, output_path)
        
        # Cleanup temp files
        for temp_file in temp_files:
            os.remove(temp_file)
        
        return {"output_file": output_path, "message": "PDFs merged successfully"}
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/split")
async def split_pdf(file: UploadFile = File(...), pages: str = Form(...)):
    """Split PDF into separate pages or page ranges"""
    try:
        if not file.filename.lower().endswith('.pdf'):
            raise HTTPException(status_code=400, detail="File must be a PDF")
        
        # Save uploaded file
        temp_path = f"uploads/{uuid.uuid4()}_{file.filename}"
        with open(temp_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        # Parse page ranges
        page_ranges = []
        if pages.strip():
            for page_range in pages.split(','):
                page_range = page_range.strip()
                if '-' in page_range:
                    start, end = map(int, page_range.split('-'))
                    page_ranges.append((start, end))
                else:
                    page_num = int(page_range)
                    page_ranges.append((page_num, page_num))
        
        # Process PDF
        output_files = pdf_processor.split_pdf(temp_path, page_ranges)
        
        # Cleanup temp file
        os.remove(temp_path)
        
        return {"output_files": output_files, "message": "PDF split successfully"}
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/extract")
async def extract_pages(file: UploadFile = File(...), pages: str = Form(...)):
    """Extract specific pages from PDF"""
    try:
        if not file.filename.lower().endswith('.pdf'):
            raise HTTPException(status_code=400, detail="File must be a PDF")
        
        # Save uploaded file
        temp_path = f"uploads/{uuid.uuid4()}_{file.filename}"
        with open(temp_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        # Parse pages
        page_numbers = []
        for page in pages.split(','):
            page_numbers.append(int(page.strip()))
        
        # Process PDF
        output_path = f"outputs/extracted_{uuid.uuid4()}.pdf"
        pdf_processor.extract_pages(temp_path, page_numbers, output_path)
        
        # Cleanup temp file
        os.remove(temp_path)
        
        return {"output_file": output_path, "message": "Pages extracted successfully"}
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/rotate")
async def rotate_pdf(file: UploadFile = File(...), angle: int = Form(...)):
    """Rotate PDF pages"""
    try:
        if not file.filename.lower().endswith('.pdf'):
            raise HTTPException(status_code=400, detail="File must be a PDF")
        
        if angle not in [90, 180, 270]:
            raise HTTPException(status_code=400, detail="Angle must be 90, 180, or 270")
        
        # Save uploaded file
        temp_path = f"uploads/{uuid.uuid4()}_{file.filename}"
        with open(temp_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        # Process PDF
        output_path = f"outputs/rotated_{uuid.uuid4()}.pdf"
        pdf_processor.rotate_pdf(temp_path, angle, output_path)
        
        # Cleanup temp file
        os.remove(temp_path)
        
        return {"output_file": output_path, "message": f"PDF rotated {angle} degrees successfully"}
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/compress")
async def compress_pdf(file: UploadFile = File(...)):
    """Compress PDF file"""
    try:
        if not file.filename.lower().endswith('.pdf'):
            raise HTTPException(status_code=400, detail="File must be a PDF")
        
        # Save uploaded file
        temp_path = f"uploads/{uuid.uuid4()}_{file.filename}"
        with open(temp_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        # Process PDF
        output_path = f"outputs/compressed_{uuid.uuid4()}.pdf"
        pdf_processor.compress_pdf(temp_path, output_path)
        
        # Cleanup temp file
        os.remove(temp_path)
        
        return {"output_file": output_path, "message": "PDF compressed successfully"}
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/protect")
async def protect_pdf(file: UploadFile = File(...), password: str = Form(...)):
    """Add password protection to PDF"""
    try:
        if not file.filename.lower().endswith('.pdf'):
            raise HTTPException(status_code=400, detail="File must be a PDF")
        
        if not password:
            raise HTTPException(status_code=400, detail="Password is required")
        
        # Save uploaded file
        temp_path = f"uploads/{uuid.uuid4()}_{file.filename}"
        with open(temp_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        # Process PDF
        output_path = f"outputs/protected_{uuid.uuid4()}.pdf"
        pdf_processor.protect_pdf(temp_path, password, output_path)
        
        # Cleanup temp file
        os.remove(temp_path)
        
        return {"output_file": output_path, "message": "PDF protected with password successfully"}
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/unlock")
async def unlock_pdf(file: UploadFile = File(...), password: str = Form(...)):
    """Remove password protection from PDF"""
    try:
        if not file.filename.lower().endswith('.pdf'):
            raise HTTPException(status_code=400, detail="File must be a PDF")
        
        # Save uploaded file
        temp_path = f"uploads/{uuid.uuid4()}_{file.filename}"
        with open(temp_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        # Process PDF
        output_path = f"outputs/unlocked_{uuid.uuid4()}.pdf"
        pdf_processor.unlock_pdf(temp_path, password, output_path)
        
        # Cleanup temp file
        os.remove(temp_path)
        
        return {"output_file": output_path, "message": "PDF unlocked successfully"}
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/jpg-to-pdf")
async def jpg_to_pdf(files: List[UploadFile] = File(...)):
    """Convert JPG images to PDF"""
    try:
        # Save uploaded files
        temp_files = []
        for file in files:
            if not file.filename.lower().endswith(('.jpg', '.jpeg', '.png')):
                raise HTTPException(status_code=400, detail=f"File {file.filename} is not a valid image")
            
            temp_path = f"uploads/{uuid.uuid4()}_{file.filename}"
            with open(temp_path, "wb") as buffer:
                shutil.copyfileobj(file.file, buffer)
            temp_files.append(temp_path)
        
        # Process images
        output_path = f"outputs/images_to_pdf_{uuid.uuid4()}.pdf"
        pdf_processor.images_to_pdf(temp_files, output_path)
        
        # Cleanup temp files
        for temp_file in temp_files:
            os.remove(temp_file)
        
        return {"output_file": output_path, "message": "Images converted to PDF successfully"}
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/pdf-to-jpg")
async def pdf_to_jpg(file: UploadFile = File(...)):
    """Convert PDF to JPG images"""
    try:
        if not file.filename.lower().endswith('.pdf'):
            raise HTTPException(status_code=400, detail="File must be a PDF")
        
        # Save uploaded file
        temp_path = f"uploads/{uuid.uuid4()}_{file.filename}"
        with open(temp_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        # Process PDF
        output_files = pdf_processor.pdf_to_images(temp_path)
        
        # Cleanup temp file
        os.remove(temp_path)
        
        return {"output_files": output_files, "message": "PDF converted to images successfully"}
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/watermark")
async def add_watermark(file: UploadFile = File(...), text: str = Form(...)):
    """Add watermark to PDF"""
    try:
        if not file.filename.lower().endswith('.pdf'):
            raise HTTPException(status_code=400, detail="File must be a PDF")
        
        if not text:
            raise HTTPException(status_code=400, detail="Watermark text is required")
        
        # Save uploaded file
        temp_path = f"uploads/{uuid.uuid4()}_{file.filename}"
        with open(temp_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        # Process PDF
        output_path = f"outputs/watermarked_{uuid.uuid4()}.pdf"
        pdf_processor.add_watermark(temp_path, text, output_path)
        
        # Cleanup temp file
        os.remove(temp_path)
        
        return {"output_file": output_path, "message": "Watermark added successfully"}
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/download/{file_path:path}")
async def download_file(file_path: str):
    """Download processed file"""
    try:
        if not os.path.exists(file_path):
            raise HTTPException(status_code=404, detail="File not found")
        
        filename = os.path.basename(file_path)
        return FileResponse(
            path=file_path,
            filename=filename,
            media_type='application/octet-stream'
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ===== ADVANCED PDF OPERATIONS =====

@app.post("/api/organize")
async def organize_pdf(file: UploadFile = File(...), page_order: str = Form(...)):
    """Reorder pages in PDF"""
    try:
        if not file.filename.lower().endswith('.pdf'):
            raise HTTPException(status_code=400, detail="File must be a PDF")
        
        # Save uploaded file
        temp_path = f"uploads/{uuid.uuid4()}_{file.filename}"
        with open(temp_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        # Parse page order
        page_order_list = [int(p.strip()) for p in page_order.split(',')]
        
        # Process PDF
        output_path = f"outputs/organized_{uuid.uuid4()}.pdf"
        pdf_processor.organize_pdf(temp_path, page_order_list, output_path)
        
        # Cleanup temp file
        os.remove(temp_path)
        
        return {"output_file": output_path, "message": "PDF pages reorganized successfully"}
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/remove-pages")
async def remove_pages(file: UploadFile = File(...), pages: str = Form(...)):
    """Remove specific pages from PDF"""
    try:
        if not file.filename.lower().endswith('.pdf'):
            raise HTTPException(status_code=400, detail="File must be a PDF")
        
        # Save uploaded file
        temp_path = f"uploads/{uuid.uuid4()}_{file.filename}"
        with open(temp_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        # Parse pages to remove
        pages_to_remove = [int(p.strip()) for p in pages.split(',')]
        
        # Process PDF
        output_path = f"outputs/removed_pages_{uuid.uuid4()}.pdf"
        pdf_processor.remove_pages(temp_path, pages_to_remove, output_path)
        
        # Cleanup temp file
        os.remove(temp_path)
        
        return {"output_file": output_path, "message": "Pages removed successfully"}
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/optimize")
async def optimize_pdf(file: UploadFile = File(...)):
    """Optimize PDF for smaller size"""
    try:
        if not file.filename.lower().endswith('.pdf'):
            raise HTTPException(status_code=400, detail="File must be a PDF")
        
        # Save uploaded file
        temp_path = f"uploads/{uuid.uuid4()}_{file.filename}"
        with open(temp_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        # Process PDF
        output_path = f"outputs/optimized_{uuid.uuid4()}.pdf"
        pdf_processor.optimize_pdf(temp_path, output_path)
        
        # Cleanup temp file
        os.remove(temp_path)
        
        return {"output_file": output_path, "message": "PDF optimized successfully"}
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/repair")
async def repair_pdf(file: UploadFile = File(...)):
    """Repair corrupted PDF"""
    try:
        if not file.filename.lower().endswith('.pdf'):
            raise HTTPException(status_code=400, detail="File must be a PDF")
        
        # Save uploaded file
        temp_path = f"uploads/{uuid.uuid4()}_{file.filename}"
        with open(temp_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        # Process PDF
        output_path = f"outputs/repaired_{uuid.uuid4()}.pdf"
        pdf_processor.repair_pdf(temp_path, output_path)
        
        # Cleanup temp file
        os.remove(temp_path)
        
        return {"output_file": output_path, "message": "PDF repaired successfully"}
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/ocr")
async def ocr_pdf(file: UploadFile = File(...), language: str = Form("eng")):
    """Perform OCR on PDF to make it searchable"""
    try:
        if not file.filename.lower().endswith('.pdf'):
            raise HTTPException(status_code=400, detail="File must be a PDF")
        
        # Save uploaded file
        temp_path = f"uploads/{uuid.uuid4()}_{file.filename}"
        with open(temp_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        # Process PDF
        output_path = f"outputs/ocr_{uuid.uuid4()}.pdf"
        pdf_processor.ocr_pdf(temp_path, output_path, language)
        
        # Cleanup temp file
        os.remove(temp_path)
        
        return {"output_file": output_path, "message": "OCR processing completed successfully"}
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/add-page-numbers")
async def add_page_numbers(file: UploadFile = File(...), position: str = Form("bottom-right")):
    """Add page numbers to PDF"""
    try:
        if not file.filename.lower().endswith('.pdf'):
            raise HTTPException(status_code=400, detail="File must be a PDF")
        
        # Save uploaded file
        temp_path = f"uploads/{uuid.uuid4()}_{file.filename}"
        with open(temp_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        # Process PDF
        output_path = f"outputs/page_numbers_{uuid.uuid4()}.pdf"
        pdf_processor.add_page_numbers(temp_path, output_path, position)
        
        # Cleanup temp file
        os.remove(temp_path)
        
        return {"output_file": output_path, "message": "Page numbers added successfully"}
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/crop")
async def crop_pdf(file: UploadFile = File(...), left: float = Form(...), bottom: float = Form(...), right: float = Form(...), top: float = Form(...)):
    """Crop PDF pages"""
    try:
        if not file.filename.lower().endswith('.pdf'):
            raise HTTPException(status_code=400, detail="File must be a PDF")
        
        # Save uploaded file
        temp_path = f"uploads/{uuid.uuid4()}_{file.filename}"
        with open(temp_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        # Process PDF
        coordinates = {'left': left, 'bottom': bottom, 'right': right, 'top': top}
        output_path = f"outputs/cropped_{uuid.uuid4()}.pdf"
        pdf_processor.crop_pdf(temp_path, output_path, coordinates)
        
        # Cleanup temp file
        os.remove(temp_path)
        
        return {"output_file": output_path, "message": "PDF cropped successfully"}
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ===== FORMAT CONVERSIONS =====

@app.post("/api/word-to-pdf")
async def word_to_pdf(file: UploadFile = File(...)):
    """Convert Word document to PDF"""
    try:
        if not file.filename.lower().endswith(('.docx', '.doc')):
            raise HTTPException(status_code=400, detail="File must be a Word document")
        
        # Save uploaded file
        temp_path = f"uploads/{uuid.uuid4()}_{file.filename}"
        with open(temp_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        # Process document
        output_path = f"outputs/word_to_pdf_{uuid.uuid4()}.pdf"
        pdf_processor.word_to_pdf(temp_path, output_path)
        
        # Cleanup temp file
        os.remove(temp_path)
        
        return {"output_file": output_path, "message": "Word document converted to PDF successfully"}
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/excel-to-pdf")
async def excel_to_pdf(file: UploadFile = File(...)):
    """Convert Excel file to PDF"""
    try:
        if not file.filename.lower().endswith(('.xlsx', '.xls')):
            raise HTTPException(status_code=400, detail="File must be an Excel file")
        
        # Save uploaded file
        temp_path = f"uploads/{uuid.uuid4()}_{file.filename}"
        with open(temp_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        # Process document
        output_path = f"outputs/excel_to_pdf_{uuid.uuid4()}.pdf"
        pdf_processor.excel_to_pdf(temp_path, output_path)
        
        # Cleanup temp file
        os.remove(temp_path)
        
        return {"output_file": output_path, "message": "Excel file converted to PDF successfully"}
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/powerpoint-to-pdf")
async def powerpoint_to_pdf(file: UploadFile = File(...)):
    """Convert PowerPoint to PDF"""
    try:
        if not file.filename.lower().endswith(('.pptx', '.ppt')):
            raise HTTPException(status_code=400, detail="File must be a PowerPoint file")
        
        # Save uploaded file
        temp_path = f"uploads/{uuid.uuid4()}_{file.filename}"
        with open(temp_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        # Process document
        output_path = f"outputs/ppt_to_pdf_{uuid.uuid4()}.pdf"
        pdf_processor.powerpoint_to_pdf(temp_path, output_path)
        
        # Cleanup temp file
        os.remove(temp_path)
        
        return {"output_file": output_path, "message": "PowerPoint converted to PDF successfully"}
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/html-to-pdf")
async def html_to_pdf(html_content: str = Form(...)):
    """Convert HTML to PDF"""
    try:
        # Process HTML
        output_path = f"outputs/html_to_pdf_{uuid.uuid4()}.pdf"
        pdf_processor.html_to_pdf(html_content, output_path)
        
        return {"output_file": output_path, "message": "HTML converted to PDF successfully"}
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/pdf-to-pdfa")
async def pdf_to_pdfa(file: UploadFile = File(...)):
    """Convert PDF to PDF/A format"""
    try:
        if not file.filename.lower().endswith('.pdf'):
            raise HTTPException(status_code=400, detail="File must be a PDF")
        
        # Save uploaded file
        temp_path = f"uploads/{uuid.uuid4()}_{file.filename}"
        with open(temp_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        # Process PDF
        output_path = f"outputs/pdfa_{uuid.uuid4()}.pdf"
        pdf_processor.pdf_to_pdfa(temp_path, output_path)
        
        # Cleanup temp file
        os.remove(temp_path)
        
        return {"output_file": output_path, "message": "PDF converted to PDF/A successfully"}
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ===== SECURITY & ADVANCED FEATURES =====

@app.post("/api/sign")
async def sign_pdf(file: UploadFile = File(...), signature: str = Form(...)):
    """Add digital signature to PDF"""
    try:
        if not file.filename.lower().endswith('.pdf'):
            raise HTTPException(status_code=400, detail="File must be a PDF")
        
        # Save uploaded file
        temp_path = f"uploads/{uuid.uuid4()}_{file.filename}"
        with open(temp_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        # Process PDF
        output_path = f"outputs/signed_{uuid.uuid4()}.pdf"
        pdf_processor.sign_pdf(temp_path, output_path, signature)
        
        # Cleanup temp file
        os.remove(temp_path)
        
        return {"output_file": output_path, "message": "PDF signed successfully"}
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/redact")
async def redact_pdf(file: UploadFile = File(...), areas: str = Form(...)):
    """Redact sensitive information from PDF"""
    try:
        if not file.filename.lower().endswith('.pdf'):
            raise HTTPException(status_code=400, detail="File must be a PDF")
        
        # Save uploaded file
        temp_path = f"uploads/{uuid.uuid4()}_{file.filename}"
        with open(temp_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        # Parse redaction areas (simplified format)
        import json
        redact_areas = json.loads(areas) if areas else []
        
        # Process PDF
        output_path = f"outputs/redacted_{uuid.uuid4()}.pdf"
        pdf_processor.redact_pdf(temp_path, output_path, redact_areas)
        
        # Cleanup temp file
        os.remove(temp_path)
        
        return {"output_file": output_path, "message": "PDF redacted successfully"}
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/compare")
async def compare_pdfs(file1: UploadFile = File(...), file2: UploadFile = File(...)):
    """Compare two PDF files"""
    try:
        if not file1.filename.lower().endswith('.pdf') or not file2.filename.lower().endswith('.pdf'):
            raise HTTPException(status_code=400, detail="Both files must be PDFs")
        
        # Save uploaded files
        temp_path1 = f"uploads/{uuid.uuid4()}_{file1.filename}"
        temp_path2 = f"uploads/{uuid.uuid4()}_{file2.filename}"
        
        with open(temp_path1, "wb") as buffer:
            shutil.copyfileobj(file1.file, buffer)
        
        with open(temp_path2, "wb") as buffer:
            shutil.copyfileobj(file2.file, buffer)
        
        # Process PDFs
        output_path = f"outputs/comparison_{uuid.uuid4()}.pdf"
        pdf_processor.compare_pdfs(temp_path1, temp_path2, output_path)
        
        # Cleanup temp files
        os.remove(temp_path1)
        os.remove(temp_path2)
        
        return {"output_file": output_path, "message": "PDF comparison completed successfully"}
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/create-zip")
async def create_zip(files: List[str] = Form(...)):
    """Create a ZIP file from multiple output files"""
    try:
        # Create unique ZIP filename
        zip_filename = f"outputs/download_{uuid.uuid4().hex}.zip"
        
        with zipfile.ZipFile(zip_filename, 'w') as zip_file:
            for file_path in files:
                if os.path.exists(file_path):
                    # Add file to ZIP with just the filename (not full path)
                    arcname = os.path.basename(file_path)
                    zip_file.write(file_path, arcname)
        
        return {"zip_file": zip_filename, "message": "ZIP file created successfully"}
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/api/cleanup")
async def manual_cleanup():
    """Manually trigger file cleanup"""
    try:
        from cleanup import cleanup_old_files
        deleted_count = cleanup_old_files()
        return {"message": f"Cleaned up {deleted_count} old files"}
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5000)
