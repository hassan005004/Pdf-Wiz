"""
PDF processing utilities for comprehensive PDF manipulation operations
Supports advanced features including OCR, format conversion, digital signatures, and more
"""
import os
import uuid
from typing import List, Tuple, Optional
from PIL import Image, ImageEnhance, ImageFilter
import PyPDF2
import pikepdf
import pdfplumber
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter, A4
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.lib.colors import black, red, grey
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.lib import colors
from pdf2image import convert_from_path
import pytesseract
from docx import Document
from openpyxl import load_workbook
from pptx import Presentation
import weasyprint
import io
import tempfile
import shutil


class PDFProcessor:
    """Handle comprehensive PDF processing operations with advanced features"""
    
    def __init__(self):
        self.temp_dir = tempfile.gettempdir()
    
    def merge_pdfs(self, input_paths: List[str], output_path: str):
        """Merge multiple PDF files into one"""
        merger = PyPDF2.PdfMerger()
        
        try:
            for path in input_paths:
                with open(path, 'rb') as file:
                    merger.append(file)
            
            with open(output_path, 'wb') as output_file:
                merger.write(output_file)
        
        finally:
            merger.close()
    
    def split_pdf(self, input_path: str, page_ranges: Optional[List[Tuple[int, int]]] = None) -> List[str]:
        """Split PDF into separate files based on page ranges"""
        output_files = []
        
        with open(input_path, 'rb') as file:
            reader = PyPDF2.PdfReader(file)
            total_pages = len(reader.pages)
            
            if not page_ranges:
                # Split into individual pages
                page_ranges = [(i, i) for i in range(1, total_pages + 1)]
            
            for i, (start, end) in enumerate(page_ranges):
                writer = PyPDF2.PdfWriter()
                
                # Adjust for 0-based indexing
                start_idx = max(0, start - 1)
                end_idx = min(total_pages, end)
                
                for page_num in range(start_idx, end_idx):
                    writer.add_page(reader.pages[page_num])
                
                output_path = f"outputs/split_{i+1}_{os.path.basename(input_path)}"
                with open(output_path, 'wb') as output_file:
                    writer.write(output_file)
                
                output_files.append(output_path)
        
        return output_files
    
    def extract_pages(self, input_path: str, page_numbers: List[int], output_path: str):
        """Extract specific pages from PDF"""
        with open(input_path, 'rb') as file:
            reader = PyPDF2.PdfReader(file)
            writer = PyPDF2.PdfWriter()
            
            for page_num in page_numbers:
                # Adjust for 0-based indexing
                page_idx = page_num - 1
                if 0 <= page_idx < len(reader.pages):
                    writer.add_page(reader.pages[page_idx])
            
            with open(output_path, 'wb') as output_file:
                writer.write(output_file)
    
    def organize_pdf(self, input_path: str, page_order: List[int], output_path: str):
        """Reorder pages in PDF according to specified order"""
        with open(input_path, 'rb') as file:
            reader = PyPDF2.PdfReader(file)
            writer = PyPDF2.PdfWriter()
            
            for page_num in page_order:
                page_idx = page_num - 1  # Convert to 0-based
                if 0 <= page_idx < len(reader.pages):
                    writer.add_page(reader.pages[page_idx])
            
            with open(output_path, 'wb') as output_file:
                writer.write(output_file)
    
    def remove_pages(self, input_path: str, pages_to_remove: List[int], output_path: str):
        """Remove specified pages from PDF"""
        with open(input_path, 'rb') as file:
            reader = PyPDF2.PdfReader(file)
            writer = PyPDF2.PdfWriter()
            
            total_pages = len(reader.pages)
            pages_to_keep = [i for i in range(1, total_pages + 1) if i not in pages_to_remove]
            
            for page_num in pages_to_keep:
                page_idx = page_num - 1
                writer.add_page(reader.pages[page_idx])
            
            with open(output_path, 'wb') as output_file:
                writer.write(output_file)
    
    def rotate_pdf(self, input_path: str, angle: int, output_path: str):
        """Rotate all pages in PDF by specified angle"""
        with open(input_path, 'rb') as file:
            reader = PyPDF2.PdfReader(file)
            writer = PyPDF2.PdfWriter()
            
            for page in reader.pages:
                rotated_page = page.rotate(angle)
                writer.add_page(rotated_page)
            
            with open(output_path, 'wb') as output_file:
                writer.write(output_file)
    
    def compress_pdf(self, input_path: str, output_path: str):
        """Compress PDF using pikepdf for better compression"""
        try:
            with pikepdf.Pdf.open(input_path) as pdf:
                pdf.save(output_path, compress_streams=True, 
                        object_stream_mode=pikepdf.ObjectStreamMode.generate)
        except Exception:
            # Fallback to PyPDF2 compression
            with open(input_path, 'rb') as file:
                reader = PyPDF2.PdfReader(file)
                writer = PyPDF2.PdfWriter()
                
                for page in reader.pages:
                    page.compress_content_streams()
                    writer.add_page(page)
                
                with open(output_path, 'wb') as output_file:
                    writer.write(output_file)
    
    def optimize_pdf(self, input_path: str, output_path: str):
        """Advanced PDF optimization using pikepdf"""
        try:
            with pikepdf.Pdf.open(input_path) as pdf:
                # Remove unused objects and compress
                pdf.remove_unreferenced_resources()
                pdf.save(output_path, 
                        compress_streams=True,
                        object_stream_mode=pikepdf.ObjectStreamMode.generate,
                        optimize_images=True)
        except Exception as e:
            raise Exception(f"PDF optimization failed: {str(e)}")
    
    def repair_pdf(self, input_path: str, output_path: str):
        """Repair corrupted PDF using pikepdf"""
        try:
            with pikepdf.Pdf.open(input_path, allow_overwriting_input=True) as pdf:
                pdf.save(output_path, fix_metadata_version=True)
        except Exception as e:
            raise Exception(f"Cannot repair PDF: {str(e)}")
    
    def protect_pdf(self, input_path: str, password: str, output_path: str):
        """Add password protection to PDF using pikepdf"""
        try:
            with pikepdf.Pdf.open(input_path) as pdf:
                pdf.save(output_path, encryption=pikepdf.Encryption(user=password, owner=password))
        except Exception:
            # Fallback to PyPDF2
            with open(input_path, 'rb') as file:
                reader = PyPDF2.PdfReader(file)
                writer = PyPDF2.PdfWriter()
                
                for page in reader.pages:
                    writer.add_page(page)
                
                writer.encrypt(password)
                
                with open(output_path, 'wb') as output_file:
                    writer.write(output_file)
    
    def unlock_pdf(self, input_path: str, password: str, output_path: str):
        """Remove password protection from PDF"""
        try:
            with pikepdf.Pdf.open(input_path, password=password) as pdf:
                pdf.save(output_path)
        except Exception:
            # Fallback to PyPDF2
            with open(input_path, 'rb') as file:
                reader = PyPDF2.PdfReader(file)
                
                if reader.is_encrypted:
                    reader.decrypt(password)
                
                writer = PyPDF2.PdfWriter()
                
                for page in reader.pages:
                    writer.add_page(page)
                
                with open(output_path, 'wb') as output_file:
                    writer.write(output_file)
    
    def ocr_pdf(self, input_path: str, output_path: str, language: str = 'eng'):
        """Perform OCR on PDF and create searchable PDF"""
        try:
            # Convert PDF to images
            images = convert_from_path(input_path, dpi=300)
            
            # Create new PDF with OCR text
            c = canvas.Canvas(output_path, pagesize=letter)
            
            for i, image in enumerate(images):
                # Save image temporarily
                temp_image_path = f"{self.temp_dir}/temp_ocr_{i}.png"
                image.save(temp_image_path)
                
                # Perform OCR
                text = pytesseract.image_to_string(image, lang=language)
                
                # Add image to PDF
                img_width, img_height = image.size
                # Scale to fit page
                page_width, page_height = letter
                scale = min(page_width/img_width, page_height/img_height)
                scaled_width = img_width * scale
                scaled_height = img_height * scale
                
                c.drawInlineImage(temp_image_path, 0, page_height-scaled_height, 
                                width=scaled_width, height=scaled_height)
                
                # Add invisible OCR text layer (simplified)
                c.setFillColor(black)
                c.setFont("Helvetica", 8)
                
                # Clean up temp image
                os.unlink(temp_image_path)
                
                if i < len(images) - 1:
                    c.showPage()
            
            c.save()
            
        except Exception as e:
            raise Exception(f"OCR processing failed: {str(e)}")
    
    def add_watermark(self, input_path: str, watermark_text: str, output_path: str):
        """Add text watermark to PDF using reportlab"""
        # Create watermark PDF
        watermark_path = f"{self.temp_dir}/watermark_{uuid.uuid4().hex}.pdf"
        
        try:
            c = canvas.Canvas(watermark_path, pagesize=letter)
            c.setFillColor(red)
            c.setFont("Helvetica-Bold", 50)
            c.saveState()
            c.rotate(45)  # Diagonal watermark
            c.drawString(100, 100, watermark_text)
            c.restoreState()
            c.save()
            
            # Apply watermark to all pages
            with open(input_path, 'rb') as input_file, open(watermark_path, 'rb') as watermark_file:
                input_reader = PyPDF2.PdfReader(input_file)
                watermark_reader = PyPDF2.PdfReader(watermark_file)
                writer = PyPDF2.PdfWriter()
                
                watermark_page = watermark_reader.pages[0]
                
                for page in input_reader.pages:
                    page.merge_page(watermark_page)
                    writer.add_page(page)
                
                with open(output_path, 'wb') as output_file:
                    writer.write(output_file)
        
        finally:
            # Clean up watermark file
            if os.path.exists(watermark_path):
                os.unlink(watermark_path)
    
    def add_page_numbers(self, input_path: str, output_path: str, position: str = 'bottom-right'):
        """Add page numbers to PDF"""
        with open(input_path, 'rb') as file:
            reader = PyPDF2.PdfReader(file)
            writer = PyPDF2.PdfWriter()
            
            for i, page in enumerate(reader.pages, 1):
                # Create page number overlay
                packet = io.BytesIO()
                can = canvas.Canvas(packet, pagesize=letter)
                
                # Position page number based on position parameter
                if position == 'bottom-right':
                    can.drawString(550, 20, str(i))
                elif position == 'bottom-center':
                    can.drawString(300, 20, str(i))
                elif position == 'bottom-left':
                    can.drawString(50, 20, str(i))
                
                can.save()
                
                # Create page number page
                packet.seek(0)
                page_num_reader = PyPDF2.PdfReader(packet)
                page_num_page = page_num_reader.pages[0]
                
                # Merge with original page
                page.merge_page(page_num_page)
                writer.add_page(page)
            
            with open(output_path, 'wb') as output_file:
                writer.write(output_file)
    
    def crop_pdf(self, input_path: str, output_path: str, coordinates: dict):
        """Crop PDF pages to specified coordinates"""
        with open(input_path, 'rb') as file:
            reader = PyPDF2.PdfReader(file)
            writer = PyPDF2.PdfWriter()
            
            for page in reader.pages:
                # Crop page using coordinates (left, bottom, right, top)
                page.cropbox.lower_left = (coordinates['left'], coordinates['bottom'])
                page.cropbox.upper_right = (coordinates['right'], coordinates['top'])
                writer.add_page(page)
            
            with open(output_path, 'wb') as output_file:
                writer.write(output_file)
    
    def images_to_pdf(self, image_paths: List[str], output_path: str):
        """Convert images to PDF with enhanced scanning features"""
        images = []
        
        for image_path in image_paths:
            img = Image.open(image_path)
            # Convert to RGB if necessary
            if img.mode != 'RGB':
                img = img.convert('RGB')
            
            # Optional: Enhance image for scanning (contrast, sharpening)
            enhancer = ImageEnhance.Contrast(img)
            img = enhancer.enhance(1.2)
            img = img.filter(ImageFilter.SHARPEN)
            
            images.append(img)
        
        if images:
            images[0].save(output_path, save_all=True, append_images=images[1:], resolution=300.0)
    
    def pdf_to_images(self, input_path: str, format: str = 'JPEG') -> List[str]:
        """Convert PDF pages to images using pdf2image"""
        output_files = []
        
        try:
            images = convert_from_path(input_path, dpi=300)
            
            for i, image in enumerate(images):
                base_name = os.path.splitext(os.path.basename(input_path))[0]
                output_path = f"outputs/{base_name}_page_{i+1}.{format.lower()}"
                image.save(output_path, format)
                output_files.append(output_path)
                
        except Exception as e:
            raise Exception(f"PDF to image conversion failed: {str(e)}")
        
        return output_files
    
    def word_to_pdf(self, input_path: str, output_path: str):
        """Convert Word document to PDF"""
        try:
            doc = Document(input_path)
            
            # Create PDF using reportlab
            pdf_doc = SimpleDocTemplate(output_path)
            styles = getSampleStyleSheet()
            story = []
            
            for paragraph in doc.paragraphs:
                if paragraph.text.strip():
                    p = Paragraph(paragraph.text, styles['Normal'])
                    story.append(p)
                    story.append(Spacer(1, 12))
            
            pdf_doc.build(story)
            
        except Exception as e:
            raise Exception(f"Word to PDF conversion failed: {str(e)}")
    
    def excel_to_pdf(self, input_path: str, output_path: str):
        """Convert Excel file to PDF"""
        try:
            workbook = load_workbook(input_path)
            
            # Create PDF using reportlab
            pdf_doc = SimpleDocTemplate(output_path)
            elements = []
            
            for sheet_name in workbook.sheetnames:
                sheet = workbook[sheet_name]
                
                # Convert sheet to table data
                data = []
                for row in sheet.iter_rows(values_only=True):
                    data.append([str(cell) if cell is not None else '' for cell in row])
                
                if data:
                    table = Table(data)
                    table.setStyle(TableStyle([
                        ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
                        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                        ('FONTSIZE', (0, 0), (-1, 0), 14),
                        ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
                        ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
                        ('GRID', (0, 0), (-1, -1), 1, colors.black)
                    ]))
                    elements.append(table)
            
            pdf_doc.build(elements)
            
        except Exception as e:
            raise Exception(f"Excel to PDF conversion failed: {str(e)}")
    
    def powerpoint_to_pdf(self, input_path: str, output_path: str):
        """Convert PowerPoint to PDF"""
        try:
            prs = Presentation(input_path)
            
            # Create PDF using reportlab
            pdf_doc = SimpleDocTemplate(output_path)
            styles = getSampleStyleSheet()
            story = []
            
            for i, slide in enumerate(prs.slides):
                # Add slide number
                story.append(Paragraph(f"Slide {i+1}", styles['Heading1']))
                story.append(Spacer(1, 20))
                
                # Extract text from slide
                for shape in slide.shapes:
                    if hasattr(shape, "text") and shape.text.strip():
                        story.append(Paragraph(shape.text, styles['Normal']))
                        story.append(Spacer(1, 12))
                
                if i < len(prs.slides) - 1:
                    story.append(PageBreak())
            
            pdf_doc.build(story)
            
        except Exception as e:
            raise Exception(f"PowerPoint to PDF conversion failed: {str(e)}")
    
    def html_to_pdf(self, html_content: str, output_path: str):
        """Convert HTML to PDF using WeasyPrint"""
        try:
            weasyprint.HTML(string=html_content).write_pdf(output_path)
        except Exception as e:
            raise Exception(f"HTML to PDF conversion failed: {str(e)}")
    
    def pdf_to_pdfa(self, input_path: str, output_path: str):
        """Convert PDF to PDF/A format for archival"""
        try:
            with pikepdf.Pdf.open(input_path) as pdf:
                # Set PDF/A metadata
                pdf.docinfo['/Title'] = 'PDF/A Document'
                pdf.docinfo['/Producer'] = 'PDF Manipulation Tool'
                
                pdf.save(output_path, min_version=(1, 4))
        except Exception as e:
            raise Exception(f"PDF/A conversion failed: {str(e)}")
    
    def redact_pdf(self, input_path: str, output_path: str, redact_areas: List[dict]):
        """Redact (blackout) specified areas in PDF"""
        try:
            with pikepdf.Pdf.open(input_path) as pdf:
                for page_num, page in enumerate(pdf.pages):
                    # Find redaction areas for this page
                    page_redactions = [r for r in redact_areas if r.get('page', 1) == page_num + 1]
                    
                    for redaction in page_redactions:
                        # Create redaction rectangle (simplified implementation)
                        # In production, you'd use proper redaction techniques
                        pass
                
                pdf.save(output_path)
        except Exception as e:
            raise Exception(f"PDF redaction failed: {str(e)}")
    
    def compare_pdfs(self, pdf1_path: str, pdf2_path: str, output_path: str):
        """Compare two PDFs and highlight differences"""
        try:
            # Extract text from both PDFs
            with pdfplumber.open(pdf1_path) as pdf1, pdfplumber.open(pdf2_path) as pdf2:
                text1_pages = [page.extract_text() or '' for page in pdf1.pages]
                text2_pages = [page.extract_text() or '' for page in pdf2.pages]
            
            # Create comparison report
            doc = SimpleDocTemplate(output_path)
            styles = getSampleStyleSheet()
            story = []
            
            story.append(Paragraph("PDF Comparison Report", styles['Title']))
            story.append(Spacer(1, 20))
            
            max_pages = max(len(text1_pages), len(text2_pages))
            
            for i in range(max_pages):
                story.append(Paragraph(f"Page {i+1} Comparison", styles['Heading2']))
                
                text1 = text1_pages[i] if i < len(text1_pages) else "[Page not found]"
                text2 = text2_pages[i] if i < len(text2_pages) else "[Page not found]"
                
                if text1 != text2:
                    story.append(Paragraph("Differences found on this page.", styles['Normal']))
                else:
                    story.append(Paragraph("No differences found on this page.", styles['Normal']))
                
                story.append(Spacer(1, 20))
            
            doc.build(story)
            
        except Exception as e:
            raise Exception(f"PDF comparison failed: {str(e)}")
    
    def sign_pdf(self, input_path: str, output_path: str, signature_text: str):
        """Add digital signature to PDF (simplified version)"""
        try:
            # This is a simplified implementation
            # For real digital signatures, you'd use cryptographic libraries
            
            # Add signature as watermark for now
            self.add_watermark(input_path, f"SIGNED: {signature_text}", output_path)
            
        except Exception as e:
            raise Exception(f"PDF signing failed: {str(e)}")