/**
 * PDF Manipulation Tool Frontend
 */

class PDFToolApp {
    constructor() {
        this.currentTool = null;
        this.selectedFiles = [];
        this.visualMode = 'merge'; // merge, organize, compare
        this.sourceFiles = [];
        this.targetOrder = [];
        this.fileContents = new Map(); // Store file contents for preview
        this.init();
    }

    init() {
        this.bindEvents();
        this.initVisualInterface();
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

    initVisualInterface() {
        // Initialize visual interface mode buttons
        document.getElementById('merge-mode').addEventListener('click', () => this.setVisualMode('merge'));
        document.getElementById('organize-mode').addEventListener('click', () => this.setVisualMode('organize'));
        document.getElementById('compare-mode').addEventListener('click', () => this.setVisualMode('compare'));
        
        // Visual interface action buttons
        document.getElementById('preview-result').addEventListener('click', this.previewResult.bind(this));
        document.getElementById('apply-changes').addEventListener('click', this.applyVisualChanges.bind(this));
        document.getElementById('reset-visual').addEventListener('click', this.resetVisualInterface.bind(this));
        
        // Initialize drag and drop for target area
        const targetArea = document.getElementById('target-area');
        targetArea.addEventListener('dragover', this.handleVisualDragOver.bind(this));
        targetArea.addEventListener('drop', this.handleVisualDrop.bind(this));
        targetArea.addEventListener('dragleave', this.handleVisualDragLeave.bind(this));
    }

    setVisualMode(mode) {
        this.visualMode = mode;
        
        // Update button states
        document.querySelectorAll('#visual-interface button[id$="-mode"]').forEach(btn => {
            btn.classList.remove('bg-blue-600', 'text-white');
            btn.classList.add('bg-gray-200', 'text-gray-700');
        });
        
        document.getElementById(`${mode}-mode`).classList.remove('bg-gray-200', 'text-gray-700');
        document.getElementById(`${mode}-mode`).classList.add('bg-blue-600', 'text-white');
        
        // Show/hide appropriate interfaces
        if (mode === 'compare') {
            document.getElementById('comparison-view').classList.remove('hidden');
            document.getElementById('preview-panels').classList.add('lg:grid-cols-1');
            this.initializeComparison();
        } else {
            document.getElementById('comparison-view').classList.add('hidden');
            document.getElementById('preview-panels').classList.remove('lg:grid-cols-1');
        }
        
        this.updateVisualInterface();
    }

    showVisualInterface() {
        // Show visual interface for supported tools
        const visualTools = ['merge', 'organize', 'compare'];
        if (visualTools.includes(this.currentTool)) {
            document.getElementById('visual-interface').classList.remove('hidden');
            this.setVisualMode(this.currentTool === 'compare' ? 'compare' : 'merge');
            this.populateSourceFiles();
        }
    }

    populateSourceFiles() {
        const sourceContainer = document.getElementById('source-files');
        sourceContainer.innerHTML = '';
        
        if (this.selectedFiles.length === 0) {
            sourceContainer.innerHTML = `
                <div class="text-center text-gray-500 py-8">
                    <i class="fas fa-file-upload text-4xl mb-2"></i>
                    <p>No files selected. Please select files above.</p>
                </div>
            `;
            return;
        }
        
        this.selectedFiles.forEach((file, index) => {
            const fileElement = this.createDraggableFileElement(file, index);
            sourceContainer.appendChild(fileElement);
        });
        
        // Load file previews
        this.loadFilePreviews();
    }

    createDraggableFileElement(file, index) {
        const fileDiv = document.createElement('div');
        fileDiv.className = 'file-item bg-white border-2 border-gray-200 rounded-lg p-3 cursor-move hover:border-blue-400 hover:shadow-md transition-all';
        fileDiv.draggable = true;
        fileDiv.dataset.fileIndex = index;
        fileDiv.dataset.fileName = file.name;
        
        const iconClass = this.getFileIcon(file.name);
        const fileSize = this.formatFileSize(file.size);
        
        fileDiv.innerHTML = `
            <div class="flex items-center justify-between">
                <div class="flex items-center flex-1">
                    <i class="${iconClass} text-2xl mr-3"></i>
                    <div class="min-w-0 flex-1">
                        <p class="text-sm font-medium text-gray-900 truncate">${file.name}</p>
                        <p class="text-xs text-gray-500">${fileSize}</p>
                    </div>
                </div>
                <div class="flex items-center space-x-2">
                    <button class="preview-btn text-blue-600 hover:text-blue-800 text-sm" title="Preview">
                        <i class="fas fa-eye"></i>
                    </button>
                    <div class="drag-handle text-gray-400 hover:text-gray-600">
                        <i class="fas fa-grip-vertical"></i>
                    </div>
                </div>
            </div>
            <div class="file-preview mt-2 hidden bg-gray-50 rounded p-2 text-xs max-h-20 overflow-y-auto border"></div>
        `;
        
        // Add drag event listeners
        fileDiv.addEventListener('dragstart', this.handleFileDragStart.bind(this));
        fileDiv.addEventListener('dragend', this.handleFileDragEnd.bind(this));
        
        // Add preview button listener
        const previewBtn = fileDiv.querySelector('.preview-btn');
        previewBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggleFilePreview(fileDiv, file);
        });
        
        return fileDiv;
    }

    getFileIcon(filename) {
        const ext = filename.split('.').pop().toLowerCase();
        const iconMap = {
            'pdf': 'fas fa-file-pdf text-red-500',
            'jpg': 'fas fa-file-image text-blue-500',
            'jpeg': 'fas fa-file-image text-blue-500',
            'png': 'fas fa-file-image text-blue-500',
            'docx': 'fas fa-file-word text-blue-600',
            'doc': 'fas fa-file-word text-blue-600',
            'xlsx': 'fas fa-file-excel text-green-600',
            'xls': 'fas fa-file-excel text-green-600',
            'pptx': 'fas fa-file-powerpoint text-orange-600',
            'ppt': 'fas fa-file-powerpoint text-orange-600'
        };
        return iconMap[ext] || 'fas fa-file text-gray-500';
    }

    handleFileDragStart(e) {
        e.dataTransfer.setData('text/plain', e.target.dataset.fileIndex);
        e.dataTransfer.setData('application/json', JSON.stringify({
            fileIndex: e.target.dataset.fileIndex,
            fileName: e.target.dataset.fileName
        }));
        e.target.classList.add('opacity-50');
        
        // Visual feedback
        document.getElementById('target-area').classList.add('border-green-500', 'bg-green-100');
    }

    handleFileDragEnd(e) {
        e.target.classList.remove('opacity-50');
        document.getElementById('target-area').classList.remove('border-green-500', 'bg-green-100');
    }

    handleVisualDragOver(e) {
        e.preventDefault();
        e.currentTarget.classList.add('border-green-500', 'bg-green-100');
    }

    handleVisualDragLeave(e) {
        e.currentTarget.classList.remove('border-green-500', 'bg-green-100');
    }

    handleVisualDrop(e) {
        e.preventDefault();
        e.currentTarget.classList.remove('border-green-500', 'bg-green-100');
        
        try {
            const fileData = JSON.parse(e.dataTransfer.getData('application/json'));
            this.addToTargetArea(fileData);
        } catch (error) {
            console.error('Error handling drop:', error);
        }
    }

    addToTargetArea(fileData) {
        const targetArea = document.getElementById('target-area');
        const existingItem = targetArea.querySelector(`[data-file-index="${fileData.fileIndex}"]`);
        
        if (existingItem) {
            // Move to end if already exists
            existingItem.remove();
        }
        
        // Clear placeholder if exists
        const placeholder = targetArea.querySelector('.text-center');
        if (placeholder) {
            placeholder.remove();
        }
        
        // Create target item
        const targetItem = document.createElement('div');
        targetItem.className = 'target-item bg-green-100 border-2 border-green-300 rounded-lg p-3 mb-2';
        targetItem.dataset.fileIndex = fileData.fileIndex;
        
        targetItem.innerHTML = `
            <div class="flex items-center justify-between">
                <div class="flex items-center">
                    <i class="fas fa-check-circle text-green-600 mr-2"></i>
                    <span class="text-sm font-medium text-green-800">${fileData.fileName}</span>
                </div>
                <div class="flex items-center space-x-2">
                    <span class="text-xs text-green-600 bg-green-200 px-2 py-1 rounded">Added</span>
                    <button class="remove-from-target text-red-500 hover:text-red-700" title="Remove">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            </div>
        `;
        
        // Add remove listener
        targetItem.querySelector('.remove-from-target').addEventListener('click', () => {
            targetItem.remove();
            this.updateTargetOrder();
            this.updateLivePreview();
        });
        
        targetArea.appendChild(targetItem);
        this.updateTargetOrder();
        this.updateLivePreview();
    }

    updateTargetOrder() {
        const targetItems = document.querySelectorAll('#target-area .target-item');
        this.targetOrder = Array.from(targetItems).map(item => parseInt(item.dataset.fileIndex));
    }

    async toggleFilePreview(fileElement, file) {
        const previewDiv = fileElement.querySelector('.file-preview');
        
        if (previewDiv.classList.contains('hidden')) {
            // Show preview
            previewDiv.classList.remove('hidden');
            previewDiv.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Loading preview...';
            
            try {
                const preview = await this.generateFilePreview(file);
                previewDiv.innerHTML = preview;
            } catch (error) {
                previewDiv.innerHTML = '<span class="text-red-500">Preview not available</span>';
            }
        } else {
            // Hide preview
            previewDiv.classList.add('hidden');
        }
    }

    async generateFilePreview(file) {
        // Simple text preview for different file types
        const ext = file.name.split('.').pop().toLowerCase();
        
        if (['jpg', 'jpeg', 'png'].includes(ext)) {
            const dataUrl = await this.fileToDataUrl(file);
            return `<img src="${dataUrl}" class="max-w-full h-16 object-contain rounded">`;
        } else if (ext === 'pdf') {
            return '📄 PDF Document - Use full preview for detailed view';
        } else {
            return `📎 ${ext.toUpperCase()} file - ${this.formatFileSize(file.size)}`;
        }
    }

    fileToDataUrl(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = e => resolve(e.target.result);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }

    updateLivePreview() {
        if (this.targetOrder.length === 0) {
            document.getElementById('live-preview').classList.add('hidden');
            return;
        }
        
        document.getElementById('live-preview').classList.remove('hidden');
        const previewContent = document.getElementById('preview-content');
        
        let preview = `<div class="space-y-2">`;
        preview += `<h5 class="font-semibold text-gray-700">📋 Processing Order:</h5>`;
        
        this.targetOrder.forEach((fileIndex, order) => {
            const file = this.selectedFiles[fileIndex];
            if (file) {
                preview += `
                    <div class="flex items-center text-sm">
                        <span class="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs mr-2">${order + 1}</span>
                        <span>${file.name}</span>
                    </div>
                `;
            }
        });
        
        preview += `</div>`;
        previewContent.innerHTML = preview;
    }

    async previewResult() {
        if (this.targetOrder.length === 0) {
            alert('Please add files to the target area first.');
            return;
        }
        
        // Show enhanced preview
        const previewContent = document.getElementById('preview-content');
        previewContent.innerHTML = `
            <div class="space-y-3">
                <h5 class="font-semibold text-gray-700">🎯 ${this.visualMode.toUpperCase()} Preview</h5>
                <div class="bg-blue-50 border border-blue-200 rounded p-3">
                    <p class="text-sm text-blue-800">
                        ${this.getPreviewDescription()}
                    </p>
                </div>
                <div class="space-y-1">
                    ${this.targetOrder.map((fileIndex, order) => {
                        const file = this.selectedFiles[fileIndex];
                        return `
                            <div class="flex items-center justify-between text-xs bg-gray-50 p-2 rounded">
                                <span><strong>${order + 1}.</strong> ${file.name}</span>
                                <span class="text-gray-500">${this.formatFileSize(file.size)}</span>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        `;
    }

    getPreviewDescription() {
        switch (this.visualMode) {
            case 'merge':
                return `Will merge ${this.targetOrder.length} files in the specified order into a single PDF.`;
            case 'organize':
                return `Will reorganize pages according to the specified order.`;
            case 'compare':
                return `Will compare the files and highlight differences.`;
            default:
                return 'Processing files according to your specifications.';
        }
    }

    async applyVisualChanges() {
        if (this.targetOrder.length === 0) {
            alert('Please organize files in the target area first.');
            return;
        }
        
        // Create a new file array in the target order
        const orderedFiles = this.targetOrder.map(index => this.selectedFiles[index]);
        this.selectedFiles = orderedFiles;
        
        // Process using the current tool
        this.processFiles();
    }

    resetVisualInterface() {
        this.targetOrder = [];
        document.getElementById('target-area').innerHTML = `
            <div class="text-center text-gray-500 py-8">
                <i class="fas fa-bullseye text-4xl mb-2"></i>
                <p>Drag elements here to organize</p>
            </div>
        `;
        document.getElementById('live-preview').classList.add('hidden');
        this.populateSourceFiles();
    }

    async loadFilePreviews() {
        // Load file content previews for comparison mode
        if (this.visualMode === 'compare' && this.selectedFiles.length >= 2) {
            try {
                // Preview first two files for comparison
                await this.loadComparisonPreviews();
            } catch (error) {
                console.error('Error loading file previews:', error);
            }
        }
    }

    async loadComparisonPreviews() {
        const file1Preview = document.getElementById('file1-preview');
        const file2Preview = document.getElementById('file2-preview');
        
        file1Preview.innerHTML = '<div class="text-center py-4"><i class="fas fa-spinner fa-spin"></i> Loading...</div>';
        file2Preview.innerHTML = '<div class="text-center py-4"><i class="fas fa-spinner fa-spin"></i> Loading...</div>';
        
        try {
            // For now, show basic file info - in a real implementation, you'd extract actual content
            const file1Info = await this.getFileInfo(this.selectedFiles[0]);
            const file2Info = await this.getFileInfo(this.selectedFiles[1]);
            
            file1Preview.innerHTML = file1Info;
            file2Preview.innerHTML = file2Info;
            
            this.detectDifferences();
        } catch (error) {
            file1Preview.innerHTML = '<div class="text-red-500">Preview error</div>';
            file2Preview.innerHTML = '<div class="text-red-500">Preview error</div>';
        }
    }

    async getFileInfo(file) {
        return `
            <div class="space-y-2">
                <div class="bg-blue-50 p-2 rounded">
                    <strong>📄 ${file.name}</strong>
                </div>
                <div class="text-xs space-y-1">
                    <div>📏 Size: ${this.formatFileSize(file.size)}</div>
                    <div>📅 Modified: ${new Date(file.lastModified).toLocaleDateString()}</div>
                    <div>📎 Type: ${file.type || 'Unknown'}</div>
                </div>
                <div class="bg-gray-100 p-2 rounded text-xs">
                    Preview content would appear here in full implementation
                </div>
            </div>
        `;
    }

    detectDifferences() {
        const differencesContainer = document.getElementById('differences-list');
        
        // Simulated differences - in real implementation, this would analyze actual file content
        const mockDifferences = [
            { type: 'size', description: 'File sizes differ', severity: 'medium' },
            { type: 'content', description: 'Text content variations detected', severity: 'high' },
            { type: 'format', description: 'Different formatting detected', severity: 'low' }
        ];
        
        differencesContainer.innerHTML = mockDifferences.map(diff => `
            <div class="flex items-center justify-between bg-white p-2 rounded border">
                <span class="text-sm">⚠️ ${diff.description}</span>
                <span class="text-xs px-2 py-1 rounded ${this.getSeverityClass(diff.severity)}">
                    ${diff.severity}
                </span>
            </div>
        `).join('');
    }

    getSeverityClass(severity) {
        const classes = {
            low: 'bg-green-100 text-green-800',
            medium: 'bg-yellow-100 text-yellow-800',
            high: 'bg-red-100 text-red-800'
        };
        return classes[severity] || classes.medium;
    }

    initializeComparison() {
        if (this.selectedFiles.length >= 2) {
            this.loadComparisonPreviews();
        }
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
        
        // Show visual interface for supported tools
        this.showVisualInterface();
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
        
        // Update visual interface if it's visible
        this.updateVisualInterface();
    }

    updateVisualInterface() {
        if (!document.getElementById('visual-interface').classList.contains('hidden')) {
            this.populateSourceFiles();
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
