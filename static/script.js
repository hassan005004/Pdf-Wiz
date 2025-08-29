/**
 * PDF Manipulation Tool Frontend
 */

class PDFToolApp {
    constructor() {
        this.currentTool = null;
        this.selectedFiles = [];
        this.init();
    }

    init() {
        this.bindEvents();
    }

    bindEvents() {
        // Tool selection
        document.querySelectorAll('.tool-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.selectTool(e.target.dataset.tool);
            });
        });

        // File upload
        const uploadArea = document.getElementById('upload-area');
        const fileInput = document.getElementById('file-input');

        uploadArea.addEventListener('click', () => fileInput.click());
        uploadArea.addEventListener('dragover', this.handleDragOver.bind(this));
        uploadArea.addEventListener('drop', this.handleDrop.bind(this));
        fileInput.addEventListener('change', this.handleFileSelect.bind(this));

        // Process button
        document.getElementById('process-btn').addEventListener('click', this.processFiles.bind(this));
    }

    selectTool(tool) {
        this.currentTool = tool;
        this.resetInterface();
        
        // Update UI
        document.getElementById('welcome-screen').classList.add('hidden');
        document.getElementById('tool-interface').classList.remove('hidden');
        
        // Update title
        const titles = {
            'organize': 'Organize PDF Pages',
            'merge': 'Merge PDF Files',
            'split': 'Split PDF',
            'remove-pages': 'Remove Pages',
            'extract': 'Extract Pages',
            'rotate': 'Rotate PDF',
            'optimize': 'Optimize PDF',
            'compress': 'Compress PDF',
            'repair': 'Repair PDF',
            'protect': 'Protect PDF',
            'unlock': 'Unlock PDF',
            'jpg-to-pdf': 'JPG to PDF',
            'pdf-to-jpg': 'PDF to JPG',
            'word-to-pdf': 'Word to PDF',
            'excel-to-pdf': 'Excel to PDF',
            'powerpoint-to-pdf': 'PowerPoint to PDF',
            'html-to-pdf': 'HTML to PDF',
            'pdf-to-pdfa': 'PDF to PDF/A',
            'watermark': 'Add Watermark',
            'add-page-numbers': 'Add Page Numbers',
            'crop': 'Crop PDF',
            'ocr': 'OCR PDF',
            'sign': 'Sign PDF',
            'redact': 'Redact PDF',
            'compare': 'Compare PDFs'
        };
        
        document.getElementById('tool-title').textContent = titles[tool] || 'PDF Tool';
        
        // Update file input accept attribute
        const fileInput = document.getElementById('file-input');
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
            // Show process button when HTML content is available
            document.getElementById('process-btn').classList.remove('hidden');
        } else {
            fileInput.accept = '.pdf';
            fileInput.multiple = tool === 'merge';
            document.getElementById('upload-area').style.display = 'block';
        }
        
        // Show/hide options based on tool
        this.showToolOptions(tool);
        
        // Highlight selected tool
        document.querySelectorAll('.tool-btn').forEach(btn => {
            btn.classList.remove('bg-blue-100', 'text-blue-700');
        });
        document.querySelector(`[data-tool="${tool}"]`).classList.add('bg-blue-100', 'text-blue-700');
    }

    showToolOptions(tool) {
        // Hide all options first
        document.querySelectorAll('#options-area > div').forEach(div => {
            div.classList.add('hidden');
        });
        
        // Show relevant options
        const optionsArea = document.getElementById('options-area');
        
        switch (tool) {
            case 'organize':
                document.getElementById('page-order-input').classList.remove('hidden');
                optionsArea.classList.remove('hidden');
                break;
            case 'split':
            case 'extract':
            case 'remove-pages':
                document.getElementById('pages-input').classList.remove('hidden');
                optionsArea.classList.remove('hidden');
                break;
            case 'rotate':
                document.getElementById('angle-input').classList.remove('hidden');
                optionsArea.classList.remove('hidden');
                break;
            case 'protect':
            case 'unlock':
                document.getElementById('password-input').classList.remove('hidden');
                optionsArea.classList.remove('hidden');
                break;
            case 'watermark':
                document.getElementById('watermark-input').classList.remove('hidden');
                optionsArea.classList.remove('hidden');
                break;
            case 'add-page-numbers':
                document.getElementById('position-input').classList.remove('hidden');
                optionsArea.classList.remove('hidden');
                break;
            case 'ocr':
                document.getElementById('language-input').classList.remove('hidden');
                optionsArea.classList.remove('hidden');
                break;
            case 'sign':
                document.getElementById('signature-input').classList.remove('hidden');
                optionsArea.classList.remove('hidden');
                break;
            case 'html-to-pdf':
                document.getElementById('html-input').classList.remove('hidden');
                optionsArea.classList.remove('hidden');
                // Add input event listener for HTML content
                const htmlTextarea = document.getElementById('html-content');
                htmlTextarea.addEventListener('input', () => {
                    if (htmlTextarea.value.trim()) {
                        document.getElementById('process-btn').classList.remove('hidden');
                    } else {
                        document.getElementById('process-btn').classList.add('hidden');
                    }
                });
                break;
            case 'crop':
                document.getElementById('crop-input').classList.remove('hidden');
                optionsArea.classList.remove('hidden');
                break;
            case 'compare':
                document.getElementById('second-file-input').classList.remove('hidden');
                optionsArea.classList.remove('hidden');
                break;
            default:
                optionsArea.classList.add('hidden');
        }
    }

    resetInterface() {
        this.selectedFiles = [];
        document.getElementById('selected-files').classList.add('hidden');
        document.getElementById('process-btn').classList.add('hidden');
        document.getElementById('progress-area').classList.add('hidden');
        document.getElementById('results-area').classList.add('hidden');
        document.getElementById('error-area').classList.add('hidden');
        document.getElementById('file-list').innerHTML = '';
        document.getElementById('download-links').innerHTML = '';
        
        // Reset upload area visibility
        document.getElementById('upload-area').style.display = 'block';
        
        // Clear all input fields
        const inputs = document.querySelectorAll('#options-area input, #options-area textarea, #options-area select');
        inputs.forEach(input => {
            input.value = '';
        });
    }

    handleDragOver(e) {
        e.preventDefault();
        e.stopPropagation();
        e.currentTarget.classList.add('border-blue-400', 'bg-blue-50');
    }

    handleDrop(e) {
        e.preventDefault();
        e.stopPropagation();
        e.currentTarget.classList.remove('border-blue-400', 'bg-blue-50');
        
        const files = Array.from(e.dataTransfer.files);
        this.handleFiles(files);
    }

    handleFileSelect(e) {
        const files = Array.from(e.target.files);
        this.handleFiles(files);
    }

    handleFiles(files) {
        this.selectedFiles = files;
        this.displaySelectedFiles();
        
        if (files.length > 0) {
            document.getElementById('process-btn').classList.remove('hidden');
        }
    }

    displaySelectedFiles() {
        const fileList = document.getElementById('file-list');
        const selectedFilesDiv = document.getElementById('selected-files');
        
        fileList.innerHTML = '';
        
        this.selectedFiles.forEach((file, index) => {
            const fileDiv = document.createElement('div');
            fileDiv.className = 'flex items-center justify-between bg-gray-100 p-3 rounded-md';
            fileDiv.innerHTML = `
                <div class="flex items-center">
                    <i class="fas fa-file-pdf text-red-500 mr-3"></i>
                    <span class="text-sm text-gray-700">${file.name}</span>
                    <span class="text-xs text-gray-500 ml-2">(${this.formatFileSize(file.size)})</span>
                </div>
                <button class="text-red-500 hover:text-red-700" onclick="app.removeFile(${index})">
                    <i class="fas fa-times"></i>
                </button>
            `;
            fileList.appendChild(fileDiv);
        });
        
        selectedFilesDiv.classList.remove('hidden');
    }

    removeFile(index) {
        this.selectedFiles.splice(index, 1);
        this.displaySelectedFiles();
        
        if (this.selectedFiles.length === 0) {
            document.getElementById('selected-files').classList.add('hidden');
            document.getElementById('process-btn').classList.add('hidden');
        }
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    async processFiles() {
        if (!this.currentTool) return;
        
        // Special validation for HTML to PDF
        if (this.currentTool === 'html-to-pdf') {
            const htmlContent = document.getElementById('html-content').value;
            if (!htmlContent.trim()) {
                this.showError('Please enter HTML content');
                return;
            }
        } else if (this.selectedFiles.length === 0) {
            this.showError('Please select at least one file');
            return;
        }
        
        // Show progress
        document.getElementById('progress-area').classList.remove('hidden');
        document.getElementById('results-area').classList.add('hidden');
        document.getElementById('error-area').classList.add('hidden');
        
        try {
            const formData = new FormData();
            
            // Add files
            if (this.currentTool === 'merge' || this.currentTool === 'jpg-to-pdf') {
                this.selectedFiles.forEach(file => {
                    formData.append('files', file);
                });
            } else if (this.currentTool === 'compare') {
                // Two files for comparison
                formData.append('file1', this.selectedFiles[0]);
                const secondFile = document.getElementById('second-file').files[0];
                if (secondFile) {
                    formData.append('file2', secondFile);
                } else {
                    throw new Error('Please select a second PDF file for comparison');
                }
            } else if (this.currentTool === 'html-to-pdf') {
                // HTML to PDF doesn't use file input
            } else {
                if (this.selectedFiles.length > 0) {
                    formData.append('file', this.selectedFiles[0]);
                }
            }
            
            // Add additional parameters
            this.addToolParameters(formData);
            
            // Update progress
            this.updateProgress(50, 'Processing...');
            
            // Make API call
            const response = await fetch(`/api/${this.currentTool}`, {
                method: 'POST',
                body: formData
            });
            
            const result = await response.json();
            
            if (!response.ok) {
                throw new Error(result.detail || 'Processing failed');
            }
            
            // Update progress
            this.updateProgress(100, 'Complete!');
            
            // Show results
            setTimeout(() => {
                this.showResults(result);
            }, 500);
            
        } catch (error) {
            this.showError(error.message);
        }
    }

    addToolParameters(formData) {
        switch (this.currentTool) {
            case 'organize':
                const pageOrder = document.getElementById('page-order').value;
                if (pageOrder) formData.append('page_order', pageOrder);
                break;
            case 'split':
            case 'extract':
            case 'remove-pages':
                const pages = document.getElementById('pages').value;
                if (pages) formData.append('pages', pages);
                break;
            case 'rotate':
                const angle = document.getElementById('angle').value;
                formData.append('angle', angle);
                break;
            case 'protect':
            case 'unlock':
                const password = document.getElementById('password').value;
                if (password) formData.append('password', password);
                break;
            case 'watermark':
                const text = document.getElementById('watermark-text').value;
                if (text) formData.append('text', text);
                break;
            case 'add-page-numbers':
                const position = document.getElementById('position').value;
                formData.append('position', position);
                break;
            case 'ocr':
                const language = document.getElementById('language').value;
                formData.append('language', language);
                break;
            case 'sign':
                const signature = document.getElementById('signature-text').value;
                if (signature) formData.append('signature', signature);
                break;
            case 'html-to-pdf':
                const htmlContent = document.getElementById('html-content').value;
                if (htmlContent) formData.append('html_content', htmlContent);
                break;
            case 'crop':
                const left = document.getElementById('crop-left').value;
                const right = document.getElementById('crop-right').value;
                const bottom = document.getElementById('crop-bottom').value;
                const top = document.getElementById('crop-top').value;
                if (left && right && bottom && top) {
                    formData.append('left', left);
                    formData.append('right', right);
                    formData.append('bottom', bottom);
                    formData.append('top', top);
                }
                break;
        }
    }

    updateProgress(percent, text) {
        document.getElementById('progress-bar').style.width = `${percent}%`;
        document.getElementById('progress-text').textContent = text;
    }

    showResults(result) {
        document.getElementById('progress-area').classList.add('hidden');
        document.getElementById('results-area').classList.remove('hidden');
        
        const downloadLinks = document.getElementById('download-links');
        downloadLinks.innerHTML = '';
        
        // Handle single file result
        if (result.output_file) {
            this.createDownloadLink(result.output_file, 'Download Result');
        }
        
        // Handle multiple files result
        if (result.output_files) {
            // Add "Download All as ZIP" button for multiple files
            if (result.output_files.length > 1) {
                this.createZipDownloadButton(result.output_files);
            }
            
            result.output_files.forEach((file, index) => {
                this.createDownloadLink(file, `Download File ${index + 1}`);
            });
        }
    }

    createDownloadLink(filePath, linkText) {
        const downloadLinks = document.getElementById('download-links');
        const linkDiv = document.createElement('div');
        linkDiv.className = 'flex items-center justify-between bg-green-50 border border-green-200 p-3 rounded-md';
        
        const fileName = filePath.split('/').pop();
        
        linkDiv.innerHTML = `
            <div class="flex items-center">
                <i class="fas fa-file-pdf text-green-500 mr-3"></i>
                <span class="text-sm text-gray-700">${fileName}</span>
            </div>
            <a href="/api/download/${encodeURIComponent(filePath)}" 
               class="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium"
               download>
                <i class="fas fa-download mr-2"></i>Download
            </a>
        `;
        
        downloadLinks.appendChild(linkDiv);
    }

    createZipDownloadButton(files) {
        const downloadLinks = document.getElementById('download-links');
        const zipButtonDiv = document.createElement('div');
        zipButtonDiv.className = 'mb-4';
        
        zipButtonDiv.innerHTML = `
            <button id="zip-download-btn" class="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-3 rounded-md text-sm font-medium transition-colors">
                <i class="fas fa-file-archive mr-2"></i>Download All as ZIP (${files.length} files)
            </button>
        `;
        
        downloadLinks.appendChild(zipButtonDiv);
        
        // Add click event
        document.getElementById('zip-download-btn').addEventListener('click', () => {
            this.downloadAsZip(files);
        });
    }
    
    async downloadAsZip(files) {
        try {
            document.getElementById('zip-download-btn').innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Creating ZIP...';
            
            const formData = new FormData();
            files.forEach(file => {
                formData.append('files', file);
            });
            
            const response = await fetch('/api/create-zip', {
                method: 'POST',
                body: formData
            });
            
            if (response.ok) {
                const data = await response.json();
                const link = document.createElement('a');
                link.href = `/api/download/${data.zip_file}`;
                link.download = data.zip_file.split('/').pop();
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                
                document.getElementById('zip-download-btn').innerHTML = '<i class="fas fa-check mr-2"></i>ZIP Downloaded!';
            } else {
                this.showError('Failed to create ZIP file');
            }
        } catch (error) {
            this.showError('Error creating ZIP file: ' + error.message);
        }
    }
    
    showError(message) {
        document.getElementById('progress-area').classList.add('hidden');
        document.getElementById('error-area').classList.remove('hidden');
        document.getElementById('error-message').textContent = message;
    }
}

// Initialize app
const app = new PDFToolApp();

// Mobile menu toggle function
function toggleMobileMenu() {
    const sidebar = document.getElementById('sidebar');
    if (sidebar) {
        sidebar.classList.toggle('hidden');
    }
}

// Close mobile menu when clicking outside
document.addEventListener('click', function(event) {
    const sidebar = document.getElementById('sidebar');
    const toggle = document.querySelector('.mobile-menu-toggle');
    
    if (window.innerWidth < 768 && sidebar && !sidebar.contains(event.target) && !toggle.contains(event.target)) {
        sidebar.classList.add('hidden');
    }
});

// Auto-close mobile menu on tool selection
if (window.innerWidth < 768) {
    document.querySelectorAll('.tool-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const sidebar = document.getElementById('sidebar');
            if (sidebar) {
                sidebar.classList.add('hidden');
            }
        });
    });
}
