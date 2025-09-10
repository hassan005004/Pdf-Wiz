/**
 * Enhanced PDF Manipulation Tool Frontend with Interactive Page Management
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
        this.isThumbviewView = true;
        this.pageOrder = []; // Track current page order
        this.deletedPages = new Set(); // Track deleted pages
        this.draggedPageIndex = null;
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

        // Mega menu tool selection
        document.querySelectorAll('.mega-menu-item, .mobile-menu-item').forEach(item => {
            item.addEventListener('click', (e) => {
                const tool = e.currentTarget.dataset.tool;
                if (tool) {
                    this.selectTool(tool);
                    // Close mobile menu if open
                    const mobileMenu = document.getElementById('mobile-menu');
                    if (mobileMenu) {
                        mobileMenu.classList.add('hidden');
                    }
                }
            });
        });

        // Mobile menu toggle
        const mobileMenuToggle = document.getElementById('mobile-menu-toggle');
        const mobileMenu = document.getElementById('mobile-menu');
        if (mobileMenuToggle && mobileMenu) {
            mobileMenuToggle.addEventListener('click', () => {
                mobileMenu.classList.toggle('hidden');
            });
        }

        // Mobile category toggles
        document.querySelectorAll('.mobile-category-toggle').forEach(toggle => {
            toggle.addEventListener('click', (e) => {
                const content = e.currentTarget.nextElementSibling;
                const icon = e.currentTarget.querySelector('svg:last-child');
                
                if (content && content.classList.contains('mobile-category-content')) {
                    content.classList.toggle('hidden');
                    icon.style.transform = content.classList.contains('hidden') ? 'rotate(0deg)' : 'rotate(180deg)';
                    e.currentTarget.setAttribute('aria-expanded', !content.classList.contains('hidden'));
                }
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

        // View mode toggle
        const viewModeToggle = document.getElementById('view-mode-toggle');
        if (viewModeToggle) {
            viewModeToggle.addEventListener('click', this.toggleViewMode.bind(this));
        }

        // PDF navigation for single page view
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

            // Initialize page order (all pages in original order)
            this.pageOrder = Array.from({length: this.totalPages}, (_, i) => i + 1);
            this.deletedPages.clear();

            document.getElementById('pdf-preview-section').classList.remove('hidden');
            document.getElementById('pdf-preview-placeholder').classList.add('hidden');

            // Update page count badge
            this.updatePageCountBadge();

            // Show thumbnail view by default
            if (this.isThumbviewView) {
                await this.renderThumbnailView();
            } else {
                await this.renderPage(1);
                this.updateNavigationButtons();
                this.updatePageInfo();
            }
        } catch (error) {
            console.error('Error loading PDF:', error);
            this.showError('Failed to load PDF preview');
        }
    }

    async renderThumbnailView() {
        if (!this.currentPDF) return;

        const pagesGrid = document.getElementById('pages-grid');
        const emptyState = document.getElementById('pages-empty-state');
        
        if (!pagesGrid) return;

        // Show loading state
        pagesGrid.innerHTML = '';
        for (let i = 0; i < this.totalPages; i++) {
            const loadingDiv = document.createElement('div');
            loadingDiv.className = 'thumbnail-loading';
            pagesGrid.appendChild(loadingDiv);
        }

        emptyState.classList.add('hidden');

        // Render all pages as thumbnails
        const thumbnails = [];
        for (let pageNum of this.pageOrder) {
            if (this.deletedPages.has(pageNum)) continue;
            
            try {
                const page = await this.currentPDF.getPage(pageNum);
                const thumbnail = await this.createPageThumbnail(page, pageNum);
                thumbnails.push(thumbnail);
            } catch (error) {
                console.error(`Error rendering page ${pageNum}:`, error);
            }
        }

        // Clear loading state and add thumbnails
        pagesGrid.innerHTML = '';
        thumbnails.forEach(thumbnail => {
            pagesGrid.appendChild(thumbnail);
        });

        if (thumbnails.length === 0) {
            emptyState.classList.remove('hidden');
        }
    }

    async createPageThumbnail(page, pageNum) {
        const viewport = page.getViewport({ scale: 0.3 });
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.width = viewport.width;
        canvas.height = viewport.height;

        const renderContext = {
            canvasContext: context,
            viewport: viewport
        };

        await page.render(renderContext).promise;

        // Create thumbnail container
        const thumbnailDiv = document.createElement('div');
        thumbnailDiv.className = 'pdf-page-thumbnail';
        thumbnailDiv.draggable = true;
        thumbnailDiv.dataset.pageNumber = pageNum;

        // Add page number overlay
        const pageNumberDiv = document.createElement('div');
        pageNumberDiv.className = 'page-number';
        pageNumberDiv.textContent = pageNum;

        // Add delete button
        const deleteBtn = document.createElement('div');
        deleteBtn.className = 'delete-page-btn';
        deleteBtn.innerHTML = '×';
        deleteBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.deletePage(pageNum);
        });

        thumbnailDiv.appendChild(canvas);
        thumbnailDiv.appendChild(pageNumberDiv);
        thumbnailDiv.appendChild(deleteBtn);

        // Add drag and drop event listeners
        this.addDragAndDropEvents(thumbnailDiv, pageNum);

        return thumbnailDiv;
    }

    addDragAndDropEvents(thumbnail, pageNum) {
        thumbnail.addEventListener('dragstart', (e) => {
            this.draggedPageIndex = this.pageOrder.indexOf(pageNum);
            thumbnail.classList.add('dragging');
            e.dataTransfer.effectAllowed = 'move';
            e.dataTransfer.setData('text/html', thumbnail.outerHTML);
        });

        thumbnail.addEventListener('dragend', () => {
            thumbnail.classList.remove('dragging');
            this.draggedPageIndex = null;
        });

        thumbnail.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
            this.showDropIndicator(thumbnail, e.clientX);
        });

        thumbnail.addEventListener('drop', (e) => {
            e.preventDefault();
            this.handlePageDrop(thumbnail, pageNum, e.clientX);
            this.hideDropIndicators();
        });

        thumbnail.addEventListener('dragleave', () => {
            this.hideDropIndicators();
        });

        // Click to select page (for tools that need page selection)
        thumbnail.addEventListener('click', (e) => {
            if (e.target.classList.contains('delete-page-btn')) return;
            this.selectPage(pageNum);
        });
    }

    showDropIndicator(targetThumbnail, clientX) {
        this.hideDropIndicators();
        
        const rect = targetThumbnail.getBoundingClientRect();
        const midpoint = rect.left + rect.width / 2;
        const isRightSide = clientX > midpoint;
        
        const indicator = document.createElement('div');
        indicator.className = `drop-zone-indicator active ${isRightSide ? 'right' : ''}`;
        targetThumbnail.appendChild(indicator);
    }

    hideDropIndicators() {
        document.querySelectorAll('.drop-zone-indicator').forEach(indicator => {
            indicator.remove();
        });
    }

    handlePageDrop(targetThumbnail, targetPageNum, clientX) {
        if (this.draggedPageIndex === null) return;

        const rect = targetThumbnail.getBoundingClientRect();
        const midpoint = rect.left + rect.width / 2;
        const isRightSide = clientX > midpoint;
        
        const draggedPageNum = this.pageOrder[this.draggedPageIndex];
        const targetIndex = this.pageOrder.indexOf(targetPageNum);
        
        // Remove dragged page from current position
        this.pageOrder.splice(this.draggedPageIndex, 1);
        
        // Insert at new position
        const insertIndex = isRightSide ? targetIndex + 1 : targetIndex;
        this.pageOrder.splice(insertIndex, 0, draggedPageNum);
        
        // Re-render thumbnail view
        this.renderThumbnailView();
        this.updatePageCountBadge();
    }

    async deletePage(pageNum) {
        if (this.pageOrder.filter(p => !this.deletedPages.has(p)).length <= 1) {
            this.showError('Cannot delete all pages. At least one page must remain.');
            return;
        }

        this.deletedPages.add(pageNum);
        
        // Update page order to exclude deleted page
        this.pageOrder = this.pageOrder.filter(p => p !== pageNum);
        
        // Re-render thumbnail view
        await this.renderThumbnailView();
        this.updatePageCountBadge();
        
        // Show success feedback
        this.showTemporaryMessage(`Page ${pageNum} deleted`, 'success');
    }

    selectPage(pageNum) {
        // Remove previous selections
        document.querySelectorAll('.pdf-page-thumbnail').forEach(thumb => {
            thumb.classList.remove('border-green-500', 'bg-green-50');
        });
        
        // Highlight selected page
        const selectedThumbnail = document.querySelector(`[data-page-number="${pageNum}"]`);
        if (selectedThumbnail) {
            selectedThumbnail.classList.add('border-green-500', 'bg-green-50');
        }
        
        // Update page input field if visible
        const pagesInput = document.getElementById('pages');
        if (pagesInput && !pagesInput.classList.contains('hidden')) {
            pagesInput.value = pageNum;
        }
    }

    toggleViewMode() {
        this.isThumbviewView = !this.isThumbviewView;
        
        const thumbnailView = document.getElementById('thumbnail-view');
        const singlePageView = document.getElementById('single-page-view');
        const toggleBtn = document.getElementById('view-mode-toggle');
        
        if (this.isThumbviewView) {
            thumbnailView.classList.remove('hidden');
            singlePageView.classList.add('hidden');
            toggleBtn.innerHTML = `
                <svg class="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"/>
                </svg>
                Thumbnail View
            `;
            this.renderThumbnailView();
        } else {
            thumbnailView.classList.add('hidden');
            singlePageView.classList.remove('hidden');
            toggleBtn.innerHTML = `
                <svg class="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                </svg>
                Single Page View
            `;
            this.renderPage(this.currentPage);
            this.updateNavigationButtons();
            this.updatePageInfo();
        }
    }

    async renderPage(pageNum) {
        if (!this.currentPDF) return;

        try {
            const page = await this.currentPDF.getPage(pageNum);
            const canvas = document.getElementById('pdf-canvas');
            const ctx = canvas.getContext('2d');

            const viewport = page.getViewport({ scale: 1.0 });
            const scale = Math.min(600 / viewport.width, 700 / viewport.height);
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

    updatePageCountBadge() {
        const badge = document.getElementById('page-count-badge');
        const activePages = this.pageOrder.filter(p => !this.deletedPages.has(p));
        if (badge) {
            badge.textContent = `${activePages.length} pages`;
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
        
        // Reset selected files and PDF state
        this.selectedFiles = [];
        this.currentPDF = null;
        this.currentPage = 1;
        this.totalPages = 0;
        this.pageOrder = [];
        this.deletedPages.clear();
        this.isThumbviewView = true;
        
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
        
        // Add page reordering information for organize tool
        if (this.currentTool === 'organize' && this.pageOrder.length > 0) {
            const activePages = this.pageOrder.filter(p => !this.deletedPages.has(p));
            formData.append('page_order', activePages.join(','));
        }
        
        // Add deleted pages information for remove-pages tool  
        if (this.currentTool === 'remove-pages' && this.deletedPages.size > 0) {
            const pagesToRemove = Array.from(this.deletedPages).join(',');
            formData.append('pages', pagesToRemove);
        }
        
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
    
    showTemporaryMessage(message, type = 'info') {
        const messageDiv = document.createElement('div');
        messageDiv.className = `fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg transition-all transform translate-x-full ${
            type === 'success' ? 'bg-green-100 border border-green-200 text-green-800' :
            type === 'error' ? 'bg-red-100 border border-red-200 text-red-800' :
            'bg-blue-100 border border-blue-200 text-blue-800'
        }`;
        
        messageDiv.innerHTML = `
            <div class="flex items-center">
                <svg class="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
                </svg>
                ${message}
            </div>
        `;
        
        document.body.appendChild(messageDiv);
        
        // Animate in
        setTimeout(() => {
            messageDiv.classList.remove('translate-x-full');
        }, 100);
        
        // Animate out and remove
        setTimeout(() => {
            messageDiv.classList.add('translate-x-full');
            setTimeout(() => {
                document.body.removeChild(messageDiv);
            }, 300);
        }, 3000);
    }
}

// Initialize the app
const app = new PDFToolApp();