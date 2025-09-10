/**
 * PDF Manipulation Tool Frontend
 */

// Configure PDF.js worker
if (typeof pdfjsLib !== 'undefined') {
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
}

class PDFToolApp {
    constructor() {
        this.currentTool = null;
        this.selectedFiles = [];
        this.currentPDF = null;
        this.currentPage = 1;
        this.totalPages = 0;
        this.init();
    }

    init() {
        this.bindEvents();
    }

    bindEvents() {
        // Tool selection - updated for grid layout
        document.querySelectorAll('.tool-card').forEach(card => {
            card.addEventListener('click', (e) => {
                const tool = e.currentTarget.dataset.tool;
                this.selectTool(tool);
            });
        });

        // File upload
        const uploadArea = document.getElementById('upload-area');
        const fileInput = document.getElementById('file-input');

        if (uploadArea && fileInput) {
            uploadArea.addEventListener('click', () => fileInput.click());
            uploadArea.addEventListener('dragover', this.handleDragOver.bind(this));
            uploadArea.addEventListener('drop', this.handleDrop.bind(this));
            uploadArea.addEventListener('dragleave', this.handleDragLeave.bind(this));
            fileInput.addEventListener('change', this.handleFileSelect.bind(this));
        }

        // Process button
        const processBtn = document.getElementById('process-btn');
        if (processBtn) {
            processBtn.addEventListener('click', this.processFiles.bind(this));
        }

        // PDF navigation
        const prevBtn = document.getElementById('prev-page');
        const nextBtn = document.getElementById('next-page');
        if (prevBtn && nextBtn) {
            prevBtn.addEventListener('click', () => this.previousPage());
            nextBtn.addEventListener('click', () => this.nextPage());
        }
    }

    selectTool(tool) {
        this.currentTool = tool;
        this.resetInterface();
        
        // Update UI
        document.getElementById('welcome-screen').classList.add('hidden');
        document.getElementById('tool-interface').classList.remove('hidden');
        
        // Update title and description
        const titles = {
            'merge': 'Merge PDF Files',
            'split': 'Split PDF',
            'compress': 'Compress PDF',
            'pdf-to-word': 'PDF to Word',
            'word-to-pdf': 'Word to PDF',
            'excel-to-pdf': 'Excel to PDF',
            'powerpoint-to-pdf': 'PowerPoint to PDF',
            'jpg-to-pdf': 'JPG to PDF',
            'pdf-to-jpg': 'PDF to JPG',
            'rotate': 'Rotate PDF',
            'unlock': 'Unlock PDF',
            'protect': 'Protect PDF',
            'watermark': 'Add Watermark',
            'extract': 'Extract Pages',
            'add-page-numbers': 'Add Page Numbers',
            'organize': 'Organize PDF',
            'remove-pages': 'Remove Pages',
            'optimize': 'Optimize PDF',
            'ocr': 'OCR PDF',
            'html-to-pdf': 'HTML to PDF',
            'repair': 'Repair PDF',
            'crop': 'Crop PDF',
            'compare': 'Compare PDFs'
        };
        
        const descriptions = {
            'merge': 'Select multiple PDF files to merge into one document',
            'split': 'Split a PDF into separate pages or page ranges',
            'compress': 'Reduce PDF file size for easier sharing',
            'pdf-to-word': 'Convert PDF files to editable Word documents',
            'word-to-pdf': 'Convert Word documents to PDF format',
            'excel-to-pdf': 'Convert Excel spreadsheets to PDF format',
            'powerpoint-to-pdf': 'Convert PowerPoint presentations to PDF format',
            'jpg-to-pdf': 'Convert image files to PDF documents',
            'pdf-to-jpg': 'Convert PDF pages to image files',
            'rotate': 'Rotate pages in your PDF documents',
            'unlock': 'Remove password protection from PDFs',
            'protect': 'Add password protection to your PDFs',
            'watermark': 'Add text or image watermarks to PDFs',
            'extract': 'Extract specific pages from a PDF',
            'add-page-numbers': 'Add page numbers to your PDFs',
            'organize': 'Reorder and organize PDF pages',
            'remove-pages': 'Delete unwanted pages from PDFs',
            'optimize': 'Optimize PDFs for web or print',
            'ocr': 'Make scanned PDFs searchable with OCR',
            'html-to-pdf': 'Convert HTML content to PDF',
            'repair': 'Fix corrupted or damaged PDFs',
            'crop': 'Crop and trim PDF pages',
            'compare': 'Compare two PDFs side by side'
        };
        
        document.getElementById('tool-title').textContent = titles[tool] || 'PDF Tool';
        document.getElementById('tool-description').textContent = descriptions[tool] || 'Upload your files to get started';
        
        // Update file input accept attribute
        const fileInput = document.getElementById('file-input');
        if (fileInput) {
            if (tool === 'jpg-to-pdf') {
                fileInput.accept = '.jpg,.jpeg,.png';
                fileInput.multiple = true;
            } else if (tool === 'word-to-pdf') {
                fileInput.accept = '.docx,.doc';
                fileInput.multiple = false;
            } else if (tool === 'excel-to-pdf') {
                fileInput.accept = '.xlsx,.xls';
                fileInput.multiple = false;
            } else if (tool === 'powerpoint-to-pdf') {
                fileInput.accept = '.pptx,.ppt';
                fileInput.multiple = false;
            } else if (tool === 'html-to-pdf') {
                // HTML to PDF doesn't need file input
                document.getElementById('upload-area').style.display = 'none';
                document.getElementById('process-btn').classList.remove('hidden');
            } else {
                fileInput.accept = '.pdf';
                fileInput.multiple = tool === 'merge';
                document.getElementById('upload-area').style.display = 'block';
            }
        }
        
        // Show/hide options based on tool
        this.showToolOptions(tool);
        
        // Highlight selected tool card
        document.querySelectorAll('.tool-card').forEach(card => {
            card.classList.remove('border-blue-500', 'bg-blue-50');
            card.classList.add('border-gray-200');
        });
        const selectedCard = document.querySelector(`[data-tool="${tool}"]`);
        if (selectedCard) {
            selectedCard.classList.remove('border-gray-200');
            selectedCard.classList.add('border-blue-500', 'bg-blue-50');
        }
    }

    showToolOptions(tool) {
        // Hide all option sections first
        const optionSections = [
            'pages-input', 'angle-input', 'password-input', 'watermark-input',
            'page-order-input', 'position-input', 'language-input', 'html-input',
            'crop-input', 'second-file-input'
        ];
        
        optionSections.forEach(id => {
            const element = document.getElementById(id);
            if (element) element.classList.add('hidden');
        });
        
        const optionsArea = document.getElementById('options-area');
        if (optionsArea) optionsArea.classList.add('hidden');
        
        // Show relevant options based on tool
        switch (tool) {
            case 'split':
            case 'extract':
            case 'remove-pages':
                this.showOptionSection('pages-input');
                break;
            case 'rotate':
                this.showOptionSection('angle-input');
                break;
            case 'protect':
            case 'unlock':
                this.showOptionSection('password-input');
                break;
            case 'watermark':
                this.showOptionSection('watermark-input');
                break;
            case 'organize':
                this.showOptionSection('page-order-input');
                break;
            case 'add-page-numbers':
                this.showOptionSection('position-input');
                break;
            case 'ocr':
                this.showOptionSection('language-input');
                break;
            case 'html-to-pdf':
                this.showOptionSection('html-input');
                break;
            case 'crop':
                this.showOptionSection('crop-input');
                break;
            case 'compare':
                this.showOptionSection('second-file-input');
                break;
        }
    }
    
    showOptionSection(sectionId) {
        const optionsArea = document.getElementById('options-area');
        const section = document.getElementById(sectionId);
        if (optionsArea && section) {
            optionsArea.classList.remove('hidden');
            section.classList.remove('hidden');
        }
    }

    async handleFileSelect(e) {
        const files = Array.from(e.target.files);
        this.selectedFiles = files;
        this.displaySelectedFiles();
        
        // Show PDF preview for the first PDF file
        const firstPDF = files.find(file => file.type === 'application/pdf');
        if (firstPDF && typeof pdfjsLib !== 'undefined') {
            await this.displayPDFPreview(firstPDF);
        }
        
        // Show process button if files are selected
        if (files.length > 0) {
            document.getElementById('process-btn').classList.remove('hidden');
        }
    }
    
    async handleDrop(e) {
        e.preventDefault();
        e.stopPropagation();
        
        const uploadArea = document.getElementById('upload-area');
        if (uploadArea) {
            uploadArea.classList.remove('border-blue-500', 'bg-blue-50');
        }
        
        const files = Array.from(e.dataTransfer.files);
        this.selectedFiles = files;
        this.displaySelectedFiles();
        
        // Show PDF preview for the first PDF file
        const firstPDF = files.find(file => file.type === 'application/pdf');
        if (firstPDF && typeof pdfjsLib !== 'undefined') {
            await this.displayPDFPreview(firstPDF);
        }
        
        // Show process button if files are selected
        if (files.length > 0) {
            document.getElementById('process-btn').classList.remove('hidden');
        }
    }
    
    handleDragOver(e) {
        e.preventDefault();
        e.stopPropagation();
        
        const uploadArea = document.getElementById('upload-area');
        if (uploadArea) {
            uploadArea.classList.add('border-blue-500', 'bg-blue-50');
        }
    }

    handleDragLeave(e) {
        e.preventDefault();
        e.stopPropagation();
        
        const uploadArea = document.getElementById('upload-area');
        if (uploadArea) {
            uploadArea.classList.remove('border-blue-500', 'bg-blue-50');
        }
    }

    async displayPDFPreview(file) {
        if (!file || file.type !== 'application/pdf') {
            return;
        }

        try {
            const arrayBuffer = await file.arrayBuffer();
            const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
            this.currentPDF = pdf;
            this.totalPages = pdf.numPages;
            this.currentPage = 1;

            document.getElementById('pdf-preview-section').classList.remove('hidden');
            document.getElementById('pdf-preview-placeholder').classList.add('hidden');

            await this.renderPage(1);
            this.updateNavigationButtons();
            this.updatePageInfo();
        } catch (error) {
            console.error('Error loading PDF:', error);
            this.showError('Failed to load PDF preview');
        }
    }

    async renderPage(pageNum) {
        if (!this.currentPDF) return;

        try {
            const page = await this.currentPDF.getPage(pageNum);
            const canvas = document.getElementById('pdf-canvas');
            const ctx = canvas.getContext('2d');

            const viewport = page.getViewport({ scale: 1.0 });
            const scale = Math.min(400 / viewport.width, 500 / viewport.height);
            const scaledViewport = page.getViewport({ scale });

            canvas.width = scaledViewport.width;
            canvas.height = scaledViewport.height;

            const renderContext = {
                canvasContext: ctx,
                viewport: scaledViewport
            };

            await page.render(renderContext).promise;
        } catch (error) {
            console.error('Error rendering page:', error);
        }
    }

    previousPage() {
        if (this.currentPage > 1) {
            this.currentPage--;
            this.renderPage(this.currentPage);
            this.updateNavigationButtons();
            this.updatePageInfo();
        }
    }

    nextPage() {
        if (this.currentPage < this.totalPages) {
            this.currentPage++;
            this.renderPage(this.currentPage);
            this.updateNavigationButtons();
            this.updatePageInfo();
        }
    }

    updateNavigationButtons() {
        const prevBtn = document.getElementById('prev-page');
        const nextBtn = document.getElementById('next-page');
        
        if (prevBtn) prevBtn.disabled = this.currentPage <= 1;
        if (nextBtn) nextBtn.disabled = this.currentPage >= this.totalPages;
    }

    updatePageInfo() {
        const pageInfo = document.getElementById('page-info');
        if (pageInfo) {
            pageInfo.textContent = `Page ${this.currentPage} of ${this.totalPages}`;
        }
    }

    displaySelectedFiles() {
        const selectedFilesDiv = document.getElementById('selected-files');
        const fileListDiv = document.getElementById('file-list');
        
        if (!selectedFilesDiv || !fileListDiv) return;
        
        if (this.selectedFiles.length === 0) {
            selectedFilesDiv.classList.add('hidden');
            return;
        }
        
        selectedFilesDiv.classList.remove('hidden');
        fileListDiv.innerHTML = '';
        
        this.selectedFiles.forEach((file, index) => {
            const fileDiv = document.createElement('div');
            fileDiv.className = 'bg-white border border-gray-200 rounded-lg p-4 flex items-center justify-between';
            
            const fileSize = this.formatFileSize(file.size);
            
            fileDiv.innerHTML = `
                <div class="flex items-center">
                    <svg class="w-8 h-8 text-gray-400 mr-3" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm0 2h12v10H4V5z"/>
                    </svg>
                    <div>
                        <p class="text-sm font-medium text-gray-900">${file.name}</p>
                        <p class="text-xs text-gray-500">${fileSize}</p>
                    </div>
                </div>
                <button class="text-red-500 hover:text-red-700" onclick="app.removeFile(${index})">
                    <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"/>
                    </svg>
                </button>
            `;
            
            fileListDiv.appendChild(fileDiv);
        });
    }
    
    removeFile(index) {
        this.selectedFiles.splice(index, 1);
        this.displaySelectedFiles();
        
        if (this.selectedFiles.length === 0) {
            document.getElementById('process-btn').classList.add('hidden');
            document.getElementById('pdf-preview-section').classList.add('hidden');
            document.getElementById('pdf-preview-placeholder').classList.remove('hidden');
        }
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
    
    resetInterface() {
        // Reset all interface elements
        const elementsToHide = [
            'selected-files', 'options-area', 'progress-area', 'results-area', 'error-area'
        ];
        
        elementsToHide.forEach(id => {
            const element = document.getElementById(id);
            if (element) element.classList.add('hidden');
        });
        
        const processBtn = document.getElementById('process-btn');
        if (processBtn) processBtn.classList.add('hidden');
        
        // Reset file input
        const fileInput = document.getElementById('file-input');
        if (fileInput) fileInput.value = '';
        
        // Reset selected files
        this.selectedFiles = [];
        
        // Reset PDF preview
        this.currentPDF = null;
        this.currentPage = 1;
        this.totalPages = 0;
        
        const pdfPreviewSection = document.getElementById('pdf-preview-section');
        const pdfPreviewPlaceholder = document.getElementById('pdf-preview-placeholder');
        if (pdfPreviewSection) pdfPreviewSection.classList.add('hidden');
        if (pdfPreviewPlaceholder) pdfPreviewPlaceholder.classList.remove('hidden');
    }

    processFiles() {
        const formData = new FormData();
        
        // Add files to form data
        this.selectedFiles.forEach(file => {
            formData.append('files', file);
        });
        
        // Add additional options based on tool
        this.addToolSpecificOptions(formData);
        
        // Show progress
        this.showProgress();
        
        // Send request
        this.sendProcessingRequest(formData);
    }
    
    addToolSpecificOptions(formData) {
        switch (this.currentTool) {
            case 'split':
            case 'extract':
            case 'remove-pages':
                const pages = document.getElementById('pages')?.value;
                if (pages) formData.append('pages', pages);
                break;
            case 'rotate':
                const angle = document.getElementById('angle')?.value;
                if (angle) formData.append('angle', angle);
                break;
            case 'protect':
            case 'unlock':
                const password = document.getElementById('password')?.value;
                if (password) formData.append('password', password);
                break;
            case 'watermark':
                const watermarkText = document.getElementById('watermark-text')?.value;
                if (watermarkText) formData.append('text', watermarkText);
                break;
            case 'organize':
                const pageOrder = document.getElementById('page-order')?.value;
                if (pageOrder) formData.append('page_order', pageOrder);
                break;
            case 'add-page-numbers':
                const position = document.getElementById('position')?.value;
                if (position) formData.append('position', position);
                break;
            case 'ocr':
                const language = document.getElementById('language')?.value;
                if (language) formData.append('language', language);
                break;
            case 'html-to-pdf':
                const htmlContent = document.getElementById('html-content')?.value;
                if (htmlContent) formData.append('html_content', htmlContent);
                break;
            case 'crop':
                const left = document.getElementById('crop-left')?.value;
                const right = document.getElementById('crop-right')?.value;
                const bottom = document.getElementById('crop-bottom')?.value;
                const top = document.getElementById('crop-top')?.value;
                if (left) formData.append('left', left);
                if (right) formData.append('right', right);
                if (bottom) formData.append('bottom', bottom);
                if (top) formData.append('top', top);
                break;
        }
    }
    
    showProgress() {
        document.getElementById('progress-area').classList.remove('hidden');
        document.getElementById('error-area').classList.add('hidden');
        document.getElementById('results-area').classList.add('hidden');
        
        const progressBar = document.getElementById('progress-bar');
        const progressText = document.getElementById('progress-text');
        
        if (progressBar) progressBar.style.width = '10%';
        if (progressText) progressText.textContent = 'Processing your files...';
    }
    
    async sendProcessingRequest(formData) {
        try {
            const endpoint = this.getAPIEndpoint();
            
            const response = await fetch(endpoint, {
                method: 'POST',
                body: formData
            });
            
            const progressBar = document.getElementById('progress-bar');
            if (progressBar) progressBar.style.width = '50%';
            
            if (response.ok) {
                const result = await response.json();
                if (progressBar) progressBar.style.width = '100%';
                this.showResults(result);
            } else {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
        } catch (error) {
            console.error('Processing error:', error);
            this.showError(`Processing failed: ${error.message}`);
        } finally {
            document.getElementById('progress-area').classList.add('hidden');
        }
    }
    
    getAPIEndpoint() {
        const endpoints = {
            'merge': '/api/merge',
            'split': '/api/split',
            'compress': '/api/compress',
            'word-to-pdf': '/api/word-to-pdf',
            'excel-to-pdf': '/api/excel-to-pdf',
            'powerpoint-to-pdf': '/api/powerpoint-to-pdf',
            'jpg-to-pdf': '/api/jpg-to-pdf',
            'pdf-to-jpg': '/api/pdf-to-jpg',
            'rotate': '/api/rotate',
            'unlock': '/api/unlock',
            'protect': '/api/protect',
            'watermark': '/api/watermark',
            'extract': '/api/extract',
            'add-page-numbers': '/api/add-page-numbers',
            'organize': '/api/organize',
            'remove-pages': '/api/remove-pages',
            'optimize': '/api/optimize',
            'ocr': '/api/ocr',
            'html-to-pdf': '/api/html-to-pdf',
            'repair': '/api/repair',
            'crop': '/api/crop',
            'compare': '/api/compare'
        };
        
        return endpoints[this.currentTool] || '/api/process';
    }
    
    showResults(result) {
        const resultsArea = document.getElementById('results-area');
        const downloadLinks = document.getElementById('download-links');
        
        if (!resultsArea || !downloadLinks) return;
        
        resultsArea.classList.remove('hidden');
        downloadLinks.innerHTML = '';
        
        if (result.output_file) {
            this.createDownloadLink(result.output_file, downloadLinks);
        } else if (result.output_files) {
            result.output_files.forEach(file => {
                this.createDownloadLink(file, downloadLinks);
            });
        }
    }
    
    createDownloadLink(filePath, container) {
        const fileName = filePath.split('/').pop();
        const linkDiv = document.createElement('div');
        linkDiv.className = 'bg-green-50 border border-green-200 rounded-lg p-4 flex items-center justify-between';
        
        linkDiv.innerHTML = `
            <div class="flex items-center">
                <svg class="w-6 h-6 text-green-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
                <div>
                    <p class="text-sm font-medium text-gray-900">${fileName}</p>
                    <p class="text-xs text-gray-500">Ready to download</p>
                </div>
            </div>
            <a href="/api/download/${filePath}" class="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors" download>
                Download
            </a>
        `;
        
        container.appendChild(linkDiv);
    }
    
    showError(message) {
        const errorArea = document.getElementById('error-area');
        const errorMessage = document.getElementById('error-message');
        
        if (errorArea && errorMessage) {
            errorMessage.textContent = message;
            errorArea.classList.remove('hidden');
        }
    }
}

// Initialize the app
const app = new PDFToolApp();