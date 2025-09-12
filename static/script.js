/**
 * Enhanced PDF Manipulation Tool Frontend with Interactive Page Management,
 * Sophisticated Animations, and Sound Effects with URL Routing
 */

// Configure PDF.js worker
if (typeof pdfjsLib !== 'undefined') {
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
}

// URL Routing System
class Router {
    constructor() {
        this.routes = {};
        this.currentRoute = '';
        this.init();
    }

    init() {
        window.addEventListener('popstate', () => {
            this.handleRoute();
        });
        this.handleRoute();
    }

    addRoute(path, handler) {
        this.routes[path] = handler;
    }

    navigate(path) {
        history.pushState({}, '', path);
        this.handleRoute();
    }

    handleRoute() {
        const path = window.location.pathname;
        const toolName = path.substring(1); // Remove leading slash
        
        if (toolName === '' || toolName === 'home') {
            this.showHomePage();
        } else if (this.routes[toolName]) {
            this.routes[toolName]();
        } else {
            // Check if it's a valid tool
            const validTools = [
                'merge', 'split', 'compress', 'rotate', 'organize', 'extract',
                'remove-pages', 'crop', 'word-to-pdf', 'excel-to-pdf', 
                'powerpoint-to-pdf', 'jpg-to-pdf', 'html-to-pdf',
                'pdf-to-word', 'pdf-to-jpg', 'unlock', 'protect', 'compare'
            ];
            
            if (validTools.includes(toolName)) {
                this.showTool(toolName);
            } else {
                this.show404();
            }
        }
    }

    showHomePage() {
        const app = window.pdfApp;
        if (app) {
            app.showWelcomeScreen();
        }
        document.getElementById('faq-section').style.display = 'none';
        this.currentRoute = '';
        document.title = 'PDF Tools - Professional PDF Processing';
    }

    showTool(toolName) {
        const app = window.pdfApp;
        if (app) {
            app.selectTool(toolName);
        }
        
        document.getElementById('faq-section').style.display = 'block';
        this.currentRoute = toolName;
        
        // Update page title
        const toolTitles = {
            'merge': 'Merge PDF Files',
            'split': 'Split PDF Files',
            'compress': 'Compress PDF Files',
            'rotate': 'Rotate PDF Pages',
            'organize': 'Organize PDF Pages',
            'extract': 'Extract PDF Pages',
            'remove-pages': 'Remove PDF Pages',
            'crop': 'Crop PDF Pages',
            'word-to-pdf': 'Convert Word to PDF',
            'excel-to-pdf': 'Convert Excel to PDF',
            'powerpoint-to-pdf': 'Convert PowerPoint to PDF',
            'jpg-to-pdf': 'Convert JPG to PDF',
            'html-to-pdf': 'Convert HTML to PDF',
            'pdf-to-word': 'Convert PDF to Word',
            'pdf-to-jpg': 'Convert PDF to JPG',
            'unlock': 'Unlock PDF Files',
            'protect': 'Protect PDF Files',
            'compare': 'Compare PDF Files'
        };
        
        document.title = `${toolTitles[toolName] || 'PDF Tool'} - PDF Tools`;
    }

    show404() {
        // Redirect to home for unknown routes
        this.navigate('/');
    }
}

// Initialize router
const router = new Router();

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
        this.audioContext = null;
        this.soundEnabled = true;
        this.processingMessages = [
            'Processing your files...',
            'Applying transformations...',
            'Optimizing output...',
            'Almost done...',
            'Finalizing results...'
        ];
        this.messageInterval = null;
        this.init();
    }

    init() {
        this.bindEvents();
        this.initHomeButton();
        this.initFAQ();
        this.initNavigation();
        
        // Make app available globally for router
        window.pdfApp = this;
    }
    
    // Home button functionality
    initHomeButton() {
        const homeBtn = document.getElementById('home-btn');
        if (homeBtn) {
            homeBtn.addEventListener('click', () => {
                router.navigate('/');
            });
        }
    }

    // Initialize FAQ functionality
    initFAQ() {
        document.addEventListener('click', (e) => {
            if (e.target.closest('.faq-question')) {
                const faqItem = e.target.closest('.faq-item');
                const answer = faqItem.querySelector('.faq-answer');
                const toggle = faqItem.querySelector('.faq-toggle');
                
                if (answer.classList.contains('show')) {
                    answer.classList.remove('show');
                    toggle.classList.remove('rotated');
                } else {
                    answer.classList.add('show');
                    toggle.classList.add('rotated');
                }
            }
        });
    }

    // Initialize navigation with routing
    initNavigation() {
        // Update mega menu items to use routing
        document.addEventListener('click', (e) => {
            const menuItem = e.target.closest('[data-tool]');
            if (menuItem) {
                e.preventDefault();
                const tool = menuItem.getAttribute('data-tool');
                router.navigate(`/${tool}`);
            }
        });

        // Update mobile menu items to use routing
        document.addEventListener('click', (e) => {
            const mobileItem = e.target.closest('.mobile-menu-item');
            if (mobileItem) {
                e.preventDefault();
                const tool = mobileItem.getAttribute('data-tool');
                if (tool) {
                    router.navigate(`/${tool}`);
                }
            }
        });
    }
    
    showWelcomeScreen() {
        // Hide all tool interfaces
        const welcomeScreen = document.getElementById('welcome-screen');
        const toolInterface = document.getElementById('tool-interface');
        
        if (welcomeScreen && toolInterface) {
            // Show welcome screen
            welcomeScreen.style.display = 'block';
            welcomeScreen.classList.remove('hidden');
            
            // Hide tool interface
            toolInterface.style.display = 'none';
            toolInterface.classList.add('hidden');
        }
        
        // Reset active states
        document.querySelectorAll('.tool-card').forEach(card => {
            card.classList.remove('ring-2', 'ring-blue-500', 'bg-blue-50', 'border-blue-500');
            card.classList.add('border-gray-200');
            card.style.transform = '';
        });
        
        // Reset current tool
        this.currentTool = null;
        
        // Reset interface
        this.resetInterface();
        
        this.playSound('click');
    }

    // Initialize Web Audio API for sound effects
    initAudio() {
        if (!this.audioContext && this.soundEnabled) {
            try {
                this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            } catch (e) {
                console.log('Web Audio API not supported');
                this.soundEnabled = false;
            }
        }
    }

    // Generate sophisticated sound effects
    playSound(type) {
        if (!this.soundEnabled || !this.audioContext) return;
        
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        switch (type) {
            case 'success':
                // Pleasant completion chime - C-E-G major chord progression
                this.playChordProgression([523.25, 659.25, 783.99], 0.3, 0.8);
                break;
                
            case 'upload':
                // Soft upload sound - gentle ascending notes
                oscillator.frequency.setValueAtTime(440, this.audioContext.currentTime);
                oscillator.frequency.setValueAtTime(554.37, this.audioContext.currentTime + 0.05);
                gainNode.gain.setValueAtTime(0.2, this.audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.3);
                oscillator.start(this.audioContext.currentTime);
                oscillator.stop(this.audioContext.currentTime + 0.3);
                break;
                
            case 'error':
                // Low error tone with slight vibrato
                oscillator.frequency.setValueAtTime(200, this.audioContext.currentTime);
                oscillator.frequency.setValueAtTime(180, this.audioContext.currentTime + 0.1);
                gainNode.gain.setValueAtTime(0.2, this.audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.4);
                oscillator.start(this.audioContext.currentTime);
                oscillator.stop(this.audioContext.currentTime + 0.4);
                break;
                
            case 'click':
                // Subtle click sound with quick decay
                oscillator.frequency.setValueAtTime(800, this.audioContext.currentTime);
                gainNode.gain.setValueAtTime(0.1, this.audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.08);
                oscillator.start(this.audioContext.currentTime);
                oscillator.stop(this.audioContext.currentTime + 0.08);
                break;

            case 'delete':
                // Quick swoosh sound for deletions
                oscillator.frequency.setValueAtTime(400, this.audioContext.currentTime);
                oscillator.frequency.setValueAtTime(200, this.audioContext.currentTime + 0.1);
                gainNode.gain.setValueAtTime(0.15, this.audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.15);
                oscillator.start(this.audioContext.currentTime);
                oscillator.stop(this.audioContext.currentTime + 0.15);
                break;
        }
    }

    // Play chord progression for success sounds
    playChordProgression(frequencies, volume, duration) {
        frequencies.forEach((freq, index) => {
            setTimeout(() => {
                const oscillator = this.audioContext.createOscillator();
                const gainNode = this.audioContext.createGain();
                
                oscillator.connect(gainNode);
                gainNode.connect(this.audioContext.destination);
                
                oscillator.frequency.setValueAtTime(freq, this.audioContext.currentTime);
                gainNode.gain.setValueAtTime(volume / frequencies.length, this.audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.3);
                
                oscillator.start(this.audioContext.currentTime);
                oscillator.stop(this.audioContext.currentTime + 0.3);
            }, index * 100);
        });
    }

    bindEvents() {
        // Initialize audio on first user interaction
        document.addEventListener('click', () => {
            this.initAudio();
        }, { once: true });

        // Tool selection with enhanced animations - both from cards and mega menu
        document.querySelectorAll('.tool-card, .mega-menu-item, .mobile-menu-item').forEach(element => {
            element.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                
                const tool = e.currentTarget.dataset.tool;
                if (tool) {
                    this.playSound('click');
                    
                    // Close mobile menu if open
                    const mobileMenu = document.getElementById('mobile-menu');
                    if (mobileMenu && !mobileMenu.classList.contains('hidden')) {
                        mobileMenu.classList.add('hidden');
                    }
                    
                    // Find corresponding tool card for animation
                    const toolCard = document.querySelector(`.tool-card[data-tool="${tool}"]`);
                    if (toolCard) {
                        this.animateCardSelection(toolCard);
                    }
                    
                    this.selectTool(tool);
                }
            });
        });
        
        // Enhanced hover effects for tool cards
        document.querySelectorAll('.tool-card').forEach(card => {
            card.addEventListener('mouseenter', () => {
                if (!card.classList.contains('border-blue-500')) {
                    card.style.transform = 'translateY(-4px) scale(1.02)';
                    card.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
                }
            });
            
            card.addEventListener('mouseleave', () => {
                if (!card.classList.contains('border-blue-500')) {
                    card.style.transform = '';
                }
            });
        });

        // Mobile menu toggle functionality
        const mobileMenuToggle = document.getElementById('mobile-menu-toggle');
        const mobileMenu = document.getElementById('mobile-menu');
        
        if (mobileMenuToggle && mobileMenu) {
            mobileMenuToggle.addEventListener('click', () => {
                this.playSound('click');
                mobileMenu.classList.toggle('hidden');
            });
        }

        // Mobile category toggles
        document.querySelectorAll('.mobile-category-toggle').forEach(toggle => {
            toggle.addEventListener('click', (e) => {
                e.preventDefault();
                this.playSound('click');
                
                const content = toggle.nextElementSibling;
                const arrow = toggle.querySelector('svg:last-child');
                
                if (content && content.classList.contains('mobile-category-content')) {
                    content.classList.toggle('hidden');
                    if (arrow) {
                        arrow.style.transform = content.classList.contains('hidden') ? '' : 'rotate(180deg)';
                    }
                }
            });
        });

        // File upload with enhanced animations
        const uploadArea = document.getElementById('upload-area');
        const fileInput = document.getElementById('file-input');

        if (uploadArea && fileInput) {
            uploadArea.addEventListener('click', (e) => {
                this.playSound('click');
                this.addRippleEffect(uploadArea, e);
                fileInput.click();
            });
            uploadArea.addEventListener('dragover', this.handleDragOver.bind(this));
            uploadArea.addEventListener('drop', this.handleDrop.bind(this));
            uploadArea.addEventListener('dragleave', this.handleDragLeave.bind(this));
            fileInput.addEventListener('change', this.handleFileSelect.bind(this));
        }

        // Process button with enhanced feedback
        const processBtn = document.getElementById('process-btn');
        if (processBtn) {
            processBtn.addEventListener('click', (e) => {
                this.playSound('click');
                this.addRippleEffect(e.target, e);
                e.target.classList.add('micro-bounce');
                setTimeout(() => e.target.classList.remove('micro-bounce'), 300);
                this.processFiles();
            });
        }

        // View mode toggle with smooth animation
        const viewModeToggle = document.getElementById('view-mode-toggle');
        if (viewModeToggle) {
            viewModeToggle.addEventListener('click', (e) => {
                this.playSound('click');
                this.addRippleEffect(e.target, e);
                e.target.style.transform = 'scale(0.95)';
                setTimeout(() => {
                    e.target.style.transform = '';
                    this.toggleViewMode();
                }, 150);
            });
        }

        // PDF navigation with enhanced feedback
        const prevBtn = document.getElementById('prev-page');
        const nextBtn = document.getElementById('next-page');
        if (prevBtn && nextBtn) {
            prevBtn.addEventListener('click', () => {
                this.playSound('click');
                this.addRippleEffect(prevBtn);
                this.previousPage();
            });
            nextBtn.addEventListener('click', () => {
                this.playSound('click');
                this.addRippleEffect(nextBtn);
                this.nextPage();
            });
        }
    }

    // Add ripple effect to buttons
    addRippleEffect(element, event = null) {
        const ripple = document.createElement('span');
        const rect = element.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        
        let x, y;
        if (event) {
            x = event.clientX - rect.left;
            y = event.clientY - rect.top;
        } else {
            x = rect.width / 2;
            y = rect.height / 2;
        }

        ripple.style.width = ripple.style.height = size + 'px';
        ripple.style.left = (x - size / 2) + 'px';
        ripple.style.top = (y - size / 2) + 'px';
        ripple.classList.add('ripple');

        element.style.position = 'relative';
        element.style.overflow = 'hidden';
        element.appendChild(ripple);

        setTimeout(() => {
            if (ripple.parentNode) {
                ripple.remove();
            }
        }, 600);
    }

    // Create enhanced particle effects
    createParticleEffect(container, options = {}) {
        const particleCount = options.count || 12;
        const colors = options.colors || ['#3b82f6', '#6366f1', '#8b5cf6', '#06b6d4'];
        
        for (let i = 0; i < particleCount; i++) {
            setTimeout(() => {
                const particle = document.createElement('div');
                particle.className = 'particle';
                particle.style.left = (Math.random() * 100) + '%';
                particle.style.top = (Math.random() * 100) + '%';
                particle.style.background = colors[Math.floor(Math.random() * colors.length)];
                particle.style.animationDelay = (Math.random() * 0.5) + 's';
                particle.style.animationDuration = (2 + Math.random() * 2) + 's';
                
                container.appendChild(particle);
                
                setTimeout(() => {
                    if (particle.parentNode) {
                        particle.remove();
                    }
                }, 4000);
            }, i * 100);
        }
    }

    animateCardSelection(card) {
        // Remove selection from other cards with smooth transition
        document.querySelectorAll('.tool-card').forEach(c => {
            c.style.transform = '';
            c.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
            c.classList.remove('border-blue-500', 'bg-blue-50');
            c.classList.add('border-gray-200');
        });
        
        // Animate selected card with bounce effect
        card.style.transform = 'scale(1.05)';
        card.style.transition = 'all 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55)';
        
        setTimeout(() => {
            card.style.transform = 'translateY(-2px) scale(1.02)';
            card.classList.add('border-blue-500', 'bg-blue-50');
            card.classList.remove('border-gray-200');
        }, 200);
    }

    selectTool(tool) {
        this.currentTool = tool;
        this.resetInterface();
        
        // Update UI with smooth transitions
        const welcomeScreen = document.getElementById('welcome-screen');
        const toolInterface = document.getElementById('tool-interface');
        
        if (welcomeScreen && toolInterface) {
            // Hide welcome screen
            welcomeScreen.style.opacity = '0';
            welcomeScreen.style.transform = 'scale(0.95)';
            
            setTimeout(() => {
                welcomeScreen.style.display = 'none';
                welcomeScreen.classList.add('hidden');
                
                // Show tool interface
                toolInterface.style.display = 'block';
                toolInterface.classList.remove('hidden');
                toolInterface.style.opacity = '0';
                toolInterface.style.transform = 'translateY(20px)';
                
                setTimeout(() => {
                    toolInterface.style.transition = 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)';
                    toolInterface.style.opacity = '1';
                    toolInterface.style.transform = 'translateY(0)';
                }, 50);
            }, 300);
        }
        
        // Update titles with typewriter effect
        this.updateToolInfo(tool);
        this.showToolOptions(tool);
        this.updateFileInputSettings(tool);
    }

    updateToolInfo(tool) {
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
        
        // Animate title change
        const titleElement = document.getElementById('tool-title');
        const descElement = document.getElementById('tool-description');
        
        if (titleElement && descElement) {
            this.typewriteText(titleElement, titles[tool] || 'PDF Tool');
            setTimeout(() => {
                this.typewriteText(descElement, descriptions[tool] || 'Upload your files to get started');
            }, 500);
        }
    }

    typewriteText(element, text) {
        element.textContent = '';
        let i = 0;
        const timer = setInterval(() => {
            if (i < text.length) {
                element.textContent += text.charAt(i);
                i++;
            } else {
                clearInterval(timer);
            }
        }, 30);
    }

    updateFileInputSettings(tool) {
        const fileInput = document.getElementById('file-input');
        const uploadArea = document.getElementById('upload-area');
        
        if (!fileInput || !uploadArea) return;
        
        if (tool === 'jpg-to-pdf') {
            fileInput.accept = '.jpg,.jpeg,.png,.gif,.bmp,.webp';
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
            uploadArea.style.display = 'none';
            const processBtn = document.getElementById('process-btn');
            if (processBtn) processBtn.classList.remove('hidden');
        } else {
            fileInput.accept = '.pdf';
            fileInput.multiple = tool === 'merge';
            uploadArea.style.display = 'block';
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
            if (element) {
                element.style.opacity = '0';
                element.style.transform = 'translateY(-10px)';
                setTimeout(() => element.classList.add('hidden'), 200);
            }
        });
        
        const optionsArea = document.getElementById('options-area');
        if (optionsArea) optionsArea.classList.add('hidden');
        
        // Show relevant options with animation
        let sectionToShow = null;
        switch (tool) {
            case 'split':
            case 'extract':
            case 'remove-pages':
                sectionToShow = 'pages-input';
                break;
            case 'rotate':
                sectionToShow = 'angle-input';
                break;
            case 'protect':
            case 'unlock':
                sectionToShow = 'password-input';
                break;
            case 'watermark':
                sectionToShow = 'watermark-input';
                break;
            case 'organize':
                sectionToShow = 'page-order-input';
                break;
            case 'add-page-numbers':
                sectionToShow = 'position-input';
                break;
            case 'ocr':
                sectionToShow = 'language-input';
                break;
            case 'html-to-pdf':
                sectionToShow = 'html-input';
                break;
            case 'crop':
                sectionToShow = 'crop-input';
                break;
            case 'compare':
                sectionToShow = 'second-file-input';
                break;
        }

        if (sectionToShow) {
            setTimeout(() => this.showOptionSection(sectionToShow), 300);
        }
    }
    
    showOptionSection(sectionId) {
        const optionsArea = document.getElementById('options-area');
        const section = document.getElementById(sectionId);
        if (optionsArea && section) {
            optionsArea.classList.remove('hidden');
            section.classList.remove('hidden');
            section.style.opacity = '0';
            section.style.transform = 'translateY(20px)';
            
            setTimeout(() => {
                section.style.transition = 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)';
                section.style.opacity = '1';
                section.style.transform = 'translateY(0)';
            }, 100);
        }
    }

    async handleFileSelect(e) {
        const files = Array.from(e.target.files);
        this.selectedFiles = files;
        
        // Play upload sound and show animation
        this.playSound('upload');
        this.showUploadAnimation();
        
        // Animate file display
        await this.displaySelectedFilesAnimated();
        
        // Show PDF preview for the first PDF file
        const firstPDF = files.find(file => file.type === 'application/pdf');
        if (firstPDF && typeof pdfjsLib !== 'undefined') {
            await this.displayPDFPreview(firstPDF);
        }
        
        // Show process button with animation if files are selected
        if (files.length > 0) {
            this.showProcessButtonAnimated();
        }
    }

    showProcessButtonAnimated() {
        const processBtn = document.getElementById('process-btn');
        if (processBtn) {
            processBtn.classList.remove('hidden');
            processBtn.style.opacity = '0';
            processBtn.style.transform = 'translateY(30px) scale(0.9)';
            
            setTimeout(() => {
                processBtn.style.transition = 'all 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55)';
                processBtn.style.opacity = '1';
                processBtn.style.transform = 'translateY(0) scale(1)';
            }, 200);
        }
    }

    showUploadAnimation() {
        const uploadArea = document.getElementById('upload-area');
        if (uploadArea) {
            uploadArea.classList.add('file-upload-animation', 'uploading');
            
            // Create particles effect
            this.createParticleEffect(uploadArea);
            
            setTimeout(() => {
                uploadArea.classList.remove('uploading');
            }, 800);
        }
    }

    createParticleEffect(container) {
        const particleCount = 8;
        for (let i = 0; i < particleCount; i++) {
            const particle = document.createElement('div');
            particle.className = 'particle';
            particle.style.left = Math.random() * 100 + '%';
            particle.style.animationDelay = Math.random() * 2 + 's';
            particle.style.animationDuration = (3 + Math.random() * 2) + 's';
            
            container.appendChild(particle);
            
            setTimeout(() => {
                if (particle.parentNode) {
                    particle.remove();
                }
            }, 5000);
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
        
        // Enhanced drop animation
        this.playSound('upload');
        this.showDropAnimation(uploadArea);
        
        await this.displaySelectedFilesAnimated();
        
        const firstPDF = files.find(file => file.type === 'application/pdf');
        if (firstPDF && typeof pdfjsLib !== 'undefined') {
            await this.displayPDFPreview(firstPDF);
        }
        
        if (files.length > 0) {
            this.showProcessButtonAnimated();
        }
    }

    showDropAnimation(uploadArea) {
        if (!uploadArea) return;
        
        uploadArea.style.transform = 'scale(1.05)';
        uploadArea.style.transition = 'all 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55)';
        
        setTimeout(() => {
            uploadArea.style.transform = 'scale(1)';
            this.createParticleEffect(uploadArea);
        }, 200);
    }
    
    handleDragOver(e) {
        e.preventDefault();
        e.stopPropagation();
        
        const uploadArea = document.getElementById('upload-area');
        if (uploadArea) {
            uploadArea.classList.add('border-blue-500', 'bg-blue-50');
            uploadArea.style.transform = 'scale(1.02)';
        }
    }

    handleDragLeave(e) {
        e.preventDefault();
        e.stopPropagation();
        
        const uploadArea = document.getElementById('upload-area');
        if (uploadArea) {
            uploadArea.classList.remove('border-blue-500', 'bg-blue-50');
            uploadArea.style.transform = '';
        }
    }

    async displayPDFPreview(file) {
        if (!file || file.type !== 'application/pdf') {
            return;
        }

        try {
            // Show loading animation
            this.showPDFLoadingAnimation();
            
            const arrayBuffer = await file.arrayBuffer();
            const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
            this.currentPDF = pdf;
            this.totalPages = pdf.numPages;
            this.currentPage = 1;

            // Initialize page order (all pages in original order)
            this.pageOrder = Array.from({length: this.totalPages}, (_, i) => i + 1);
            this.deletedPages.clear();

            // Animate preview appearance
            const previewSection = document.getElementById('pdf-preview-section');
            const previewPlaceholder = document.getElementById('pdf-preview-placeholder');
            
            if (previewPlaceholder) {
                previewPlaceholder.style.opacity = '0';
                previewPlaceholder.style.transform = 'scale(0.95)';
                setTimeout(() => previewPlaceholder.classList.add('hidden'), 300);
            }

            setTimeout(() => {
                if (previewSection) {
                    previewSection.classList.remove('hidden');
                    previewSection.style.opacity = '0';
                    previewSection.style.transform = 'translateY(20px)';
                    
                    setTimeout(() => {
                        previewSection.style.transition = 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)';
                        previewSection.style.opacity = '1';
                        previewSection.style.transform = 'translateY(0)';
                    }, 100);
                }
            }, 300);

            // Update page count badge with animation
            this.updatePageCountBadgeAnimated();

            // Show thumbnail view by default
            if (this.isThumbviewView) {
                await this.renderThumbnailView();
            } else {
                await this.renderPage(1);
                this.updateNavigationButtons();
                this.updatePageInfo();
            }
            
            this.playSound('success');
        } catch (error) {
            console.error('Error loading PDF:', error);
            this.playSound('error');
            this.showError('Failed to load PDF preview');
        }
    }

    showPDFLoadingAnimation() {
        const placeholder = document.getElementById('pdf-preview-placeholder');
        if (placeholder) {
            const originalContent = placeholder.innerHTML;
            placeholder.innerHTML = `
                <div class="text-center py-12">
                    <div class="processing-spinner mx-auto mb-4" style="width: 60px; height: 60px;"></div>
                    <h4 class="text-lg font-semibold text-gray-700 mb-2">Loading PDF Preview</h4>
                    <div class="loading-dots">
                        <div class="loading-dot" style="background: #6366f1;"></div>
                        <div class="loading-dot" style="background: #6366f1;"></div>
                        <div class="loading-dot" style="background: #6366f1;"></div>
                    </div>
                </div>
            `;
        }
    }

    async renderThumbnailView() {
        if (!this.currentPDF) return;

        const pagesGrid = document.getElementById('pages-grid');
        const emptyState = document.getElementById('pages-empty-state');
        
        if (!pagesGrid) return;

        // Show loading state with animated placeholders
        pagesGrid.innerHTML = '';
        for (let i = 0; i < this.totalPages; i++) {
            const loadingDiv = document.createElement('div');
            loadingDiv.className = 'thumbnail-loading';
            loadingDiv.style.animationDelay = (i * 0.1) + 's';
            pagesGrid.appendChild(loadingDiv);
        }

        if (emptyState) emptyState.classList.add('hidden');

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

        // Clear loading state and add thumbnails with staggered animation
        pagesGrid.innerHTML = '';
        thumbnails.forEach((thumbnail, index) => {
            thumbnail.style.opacity = '0';
            thumbnail.style.transform = 'translateY(20px) scale(0.8)';
            pagesGrid.appendChild(thumbnail);
            
            setTimeout(() => {
                thumbnail.style.transition = 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)';
                thumbnail.style.opacity = '1';
                thumbnail.style.transform = 'translateY(0) scale(1)';
            }, index * 100);
        });

        if (thumbnails.length === 0 && emptyState) {
            emptyState.classList.remove('hidden');
        }
    }

    async createPageThumbnail(page, pageNum) {
        const viewport = page.getViewport({ scale: 0.4 });
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.width = viewport.width;
        canvas.height = viewport.height;

        const renderContext = {
            canvasContext: context,
            viewport: viewport
        };

        await page.render(renderContext).promise;

        // Create thumbnail container with enhanced styling
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
            this.playSound('click');
            e.dataTransfer.effectAllowed = 'move';
            e.dataTransfer.setData('text/html', thumbnail.outerHTML);
        });

        thumbnail.addEventListener('dragend', () => {
            thumbnail.classList.remove('dragging');
            this.draggedPageIndex = null;
            this.hideDropIndicators();
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

        // Enhanced click interactions
        thumbnail.addEventListener('click', (e) => {
            if (e.target.classList.contains('delete-page-btn')) return;
            this.playSound('click');
            this.selectPage(pageNum);
        });

        // Enhanced hover effects
        thumbnail.addEventListener('mouseenter', () => {
            if (!thumbnail.classList.contains('dragging')) {
                thumbnail.style.zIndex = '10';
            }
        });

        thumbnail.addEventListener('mouseleave', () => {
            if (!thumbnail.classList.contains('dragging')) {
                thumbnail.style.zIndex = '';
            }
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
            indicator.style.opacity = '0';
            setTimeout(() => {
                if (indicator.parentNode) {
                    indicator.remove();
                }
            }, 300);
        });
    }

    handlePageDrop(targetThumbnail, targetPageNum, clientX) {
        if (this.draggedPageIndex === null) return;

        const rect = targetThumbnail.getBoundingClientRect();
        const midpoint = rect.left + rect.width / 2;
        const isRightSide = clientX > midpoint;
        
        const draggedPageNum = this.pageOrder[this.draggedPageIndex];
        const targetIndex = this.pageOrder.indexOf(targetPageNum);
        
        if (draggedPageNum === targetPageNum) return;
        
        // Play success sound for reordering
        this.playSound('success');
        
        // Remove dragged page from current position
        this.pageOrder.splice(this.draggedPageIndex, 1);
        
        // Insert at new position
        const insertIndex = isRightSide ? targetIndex : targetIndex - 1;
        this.pageOrder.splice(Math.max(0, insertIndex), 0, draggedPageNum);
        
        // Show visual feedback
        this.showTemporaryMessage(`Page ${draggedPageNum} moved to position ${insertIndex + 1}`, 'success');
        
        // Re-render thumbnail view with smooth transition
        setTimeout(() => {
            this.renderThumbnailView();
            this.updatePageCountBadgeAnimated();
        }, 200);
    }

    async deletePage(pageNum) {
        if (this.pageOrder.filter(p => !this.deletedPages.has(p)).length <= 1) {
            this.playSound('error');
            this.showError('Cannot delete all pages. At least one page must remain.');
            return;
        }

        // Play delete sound and animate deletion
        this.playSound('delete');
        
        // Find and animate the thumbnail being deleted
        const thumbnail = document.querySelector(`[data-page-number="${pageNum}"]`);
        if (thumbnail) {
            thumbnail.style.transform = 'scale(0) rotate(180deg)';
            thumbnail.style.opacity = '0';
            thumbnail.style.filter = 'blur(5px)';
        }

        this.deletedPages.add(pageNum);
        
        // Update page order to exclude deleted page
        this.pageOrder = this.pageOrder.filter(p => p !== pageNum);
        
        // Re-render thumbnail view with delay for animation
        setTimeout(async () => {
            await this.renderThumbnailView();
            this.updatePageCountBadgeAnimated();
        }, 400);
        
        // Show success feedback
        this.showTemporaryMessage(`Page ${pageNum} deleted successfully`, 'success');
    }

    selectPage(pageNum) {
        // Remove previous selections with smooth transition
        document.querySelectorAll('.pdf-page-thumbnail').forEach(thumb => {
            thumb.style.transition = 'all 0.3s ease';
            thumb.classList.remove('border-green-500', 'bg-green-50');
        });
        
        // Highlight selected page with pulse effect
        const selectedThumbnail = document.querySelector(`[data-page-number="${pageNum}"]`);
        if (selectedThumbnail) {
            selectedThumbnail.classList.add('border-green-500', 'bg-green-50');
            selectedThumbnail.style.animation = 'pulse 0.5s ease-in-out';
            setTimeout(() => {
                selectedThumbnail.style.animation = '';
            }, 500);
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
        
        if (!thumbnailView || !singlePageView || !toggleBtn) return;
        
        // Animate transition between views
        const currentView = this.isThumbviewView ? singlePageView : thumbnailView;
        const nextView = this.isThumbviewView ? thumbnailView : singlePageView;
        
        currentView.style.opacity = '0';
        currentView.style.transform = 'translateY(-20px)';
        
        setTimeout(() => {
            currentView.classList.add('hidden');
            nextView.classList.remove('hidden');
            nextView.style.opacity = '0';
            nextView.style.transform = 'translateY(20px)';
            
            setTimeout(() => {
                nextView.style.transition = 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)';
                nextView.style.opacity = '1';
                nextView.style.transform = 'translateY(0)';
            }, 50);
        }, 300);
        
        // Update toggle button with animation
        if (this.isThumbviewView) {
            toggleBtn.innerHTML = `
                <svg class="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"/>
                </svg>
                Thumbnail View
            `;
            this.renderThumbnailView();
        } else {
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
            if (!canvas) return;
            
            const ctx = canvas.getContext('2d');

            const viewport = page.getViewport({ scale: 1.0 });
            const scale = Math.min(600 / viewport.width, 700 / viewport.height);
            const scaledViewport = page.getViewport({ scale });

            canvas.width = scaledViewport.width;
            canvas.height = scaledViewport.height;

            // Add loading animation to canvas
            canvas.style.opacity = '0.5';
            canvas.style.filter = 'blur(2px)';

            const renderContext = {
                canvasContext: ctx,
                viewport: scaledViewport
            };

            await page.render(renderContext).promise;
            
            // Animate canvas appearance
            canvas.style.transition = 'all 0.3s ease';
            canvas.style.opacity = '1';
            canvas.style.filter = 'none';
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
        
        if (prevBtn) {
            prevBtn.disabled = this.currentPage <= 1;
            prevBtn.classList.toggle('opacity-50', this.currentPage <= 1);
        }
        if (nextBtn) {
            nextBtn.disabled = this.currentPage >= this.totalPages;
            nextBtn.classList.toggle('opacity-50', this.currentPage >= this.totalPages);
        }
    }

    updatePageInfo() {
        const pageInfo = document.getElementById('page-info');
        if (pageInfo) {
            pageInfo.textContent = `Page ${this.currentPage} of ${this.totalPages}`;
        }
    }

    updatePageCountBadgeAnimated() {
        const badge = document.getElementById('page-count-badge');
        const activePages = this.pageOrder.filter(p => !this.deletedPages.has(p));
        
        if (badge) {
            // Animate count change
            badge.style.transform = 'scale(1.2)';
            badge.style.transition = 'all 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55)';
            
            setTimeout(() => {
                badge.textContent = `${activePages.length} pages`;
                badge.style.transform = 'scale(1)';
            }, 150);
        }
    }

    updatePageCountBadge() {
        // Fallback to non-animated version
        this.updatePageCountBadgeAnimated();
    }

    async displaySelectedFilesAnimated() {
        const selectedFilesDiv = document.getElementById('selected-files');
        const fileListDiv = document.getElementById('file-list');
        
        if (!selectedFilesDiv || !fileListDiv) return;
        
        if (this.selectedFiles.length === 0) {
            selectedFilesDiv.classList.add('hidden');
            return;
        }
        
        selectedFilesDiv.classList.remove('hidden');
        fileListDiv.innerHTML = '';
        
        // Animate files appearing one by one
        for (let [index, file] of this.selectedFiles.entries()) {
            await new Promise(resolve => {
                setTimeout(() => {
                    const fileDiv = document.createElement('div');
                    fileDiv.className = 'bg-white border border-gray-200 rounded-lg p-4 flex items-center justify-between file-item-enter file-uploading';
                    
                    const fileSize = this.formatFileSize(file.size);
                    const fileIcon = this.getFileIcon(file.type);
                    
                    fileDiv.innerHTML = `
                        <div class="flex items-center">
                            <div class="w-10 h-10 mr-3 flex items-center justify-center rounded-lg ${this.getFileIconBg(file.type)}">
                                ${fileIcon}
                            </div>
                            <div>
                                <p class="text-sm font-medium text-gray-900">${file.name}</p>
                                <p class="text-xs text-gray-500">${fileSize}</p>
                            </div>
                        </div>
                        <button class="text-red-500 hover:text-red-700 transition-all hover:scale-110 p-1 rounded-full hover:bg-red-50" onclick="app.removeFile(${index})">
                            <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"/>
                            </svg>
                        </button>
                    `;
                    
                    fileListDiv.appendChild(fileDiv);
                    
                    // Remove upload animation after it completes
                    setTimeout(() => {
                        fileDiv.classList.remove('file-uploading');
                    }, 1500);
                    
                    resolve();
                }, index * 150); // Stagger animation
            });
        }
    }

    getFileIcon(mimeType) {
        if (mimeType === 'application/pdf') {
            return '<svg class="w-6 h-6 text-red-600" fill="currentColor" viewBox="0 0 24 24"><path d="M7 18h10v-1H7v1zM7 17h10v-1H7v1zm5-9V3l4 4h-4z"></path></svg>';
        }
        if (mimeType.startsWith('image/')) {
            return '<svg class="w-6 h-6 text-green-600" fill="currentColor" viewBox="0 0 24 24"><path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"></path></svg>';
        }
        if (mimeType.includes('word')) {
            return '<svg class="w-6 h-6 text-blue-600" fill="currentColor" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 00-2 2v16c0 1.1.89 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm4 18H6V4h7v5h5v11z"></path></svg>';
        }
        return '<svg class="w-6 h-6 text-gray-600" fill="currentColor" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 00-2 2v16c0 1.1.89 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm4 18H6V4h7v5h5v11z"></path></svg>';
    }

    getFileIconBg(mimeType) {
        if (mimeType === 'application/pdf') return 'bg-red-100';
        if (mimeType.startsWith('image/')) return 'bg-green-100';
        if (mimeType.includes('word')) return 'bg-blue-100';
        return 'bg-gray-100';
    }
    
    displaySelectedFiles() {
        // Fallback to non-animated version
        this.displaySelectedFilesAnimated();
    }

    removeFile(index) {
        // Play click sound
        this.playSound('click');
        
        // Animate file removal
        const fileList = document.getElementById('file-list');
        if (!fileList) return;
        
        const fileItems = fileList.children;
        if (fileItems[index]) {
            const fileItem = fileItems[index];
            fileItem.style.transform = 'translateX(100%) scale(0.8)';
            fileItem.style.opacity = '0';
            fileItem.style.filter = 'blur(3px)';
            
            setTimeout(() => {
                this.selectedFiles.splice(index, 1);
                this.displaySelectedFiles();
                
                if (this.selectedFiles.length === 0) {
                    const processBtn = document.getElementById('process-btn');
                    if (processBtn) {
                        processBtn.style.transform = 'translateY(20px) scale(0.9)';
                        processBtn.style.opacity = '0';
                        setTimeout(() => processBtn.classList.add('hidden'), 200);
                    }
                    
                    const previewSection = document.getElementById('pdf-preview-section');
                    const previewPlaceholder = document.getElementById('pdf-preview-placeholder');
                    if (previewSection) previewSection.classList.add('hidden');
                    if (previewPlaceholder) previewPlaceholder.classList.remove('hidden');
                }
            }, 400);
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
        // Reset with smooth animations
        const elementsToHide = [
            'selected-files', 'options-area', 'progress-area', 'results-area', 'error-area'
        ];
        
        elementsToHide.forEach(id => {
            const element = document.getElementById(id);
            if (element && !element.classList.contains('hidden')) {
                element.style.opacity = '0';
                element.style.transform = 'translateY(-10px)';
                setTimeout(() => element.classList.add('hidden'), 200);
            }
        });
        
        const processBtn = document.getElementById('process-btn');
        if (processBtn && !processBtn.classList.contains('hidden')) {
            processBtn.style.opacity = '0';
            setTimeout(() => processBtn.classList.add('hidden'), 200);
        }
        
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
        if (pdfPreviewSection) {
            pdfPreviewSection.style.opacity = '0';
            setTimeout(() => pdfPreviewSection.classList.add('hidden'), 200);
        }
        if (pdfPreviewPlaceholder) {
            setTimeout(() => pdfPreviewPlaceholder.classList.remove('hidden'), 300);
        }
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
        
        // Show enhanced progress animation
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
        // Show enhanced processing overlay
        const overlay = document.getElementById('processing-overlay');
        if (overlay) {
            overlay.classList.add('active');
            
            // Add particles to overlay
            setTimeout(() => {
                this.createParticleEffect(overlay);
            }, 500);
        }
        
        // Cycle through processing messages
        this.cycleProcessingMessages();
        
        const progressArea = document.getElementById('progress-area');
        if (progressArea) progressArea.classList.remove('hidden');
        
        const errorArea = document.getElementById('error-area');
        if (errorArea) errorArea.classList.add('hidden');
        
        const resultsArea = document.getElementById('results-area');
        if (resultsArea) resultsArea.classList.add('hidden');
        
        const progressBar = document.getElementById('progress-bar');
        const progressText = document.getElementById('progress-text');
        
        if (progressBar) {
            progressBar.style.width = '10%';
            progressBar.classList.add('shimmer');
            progressBar.style.position = 'relative';
            progressBar.style.overflow = 'hidden';
        }
        if (progressText) progressText.textContent = 'Processing your files...';
    }
    
    cycleProcessingMessages() {
        let messageIndex = 0;
        const processingText = document.getElementById('processing-text');
        const processingSubtitle = document.getElementById('processing-subtitle');
        
        this.messageInterval = setInterval(() => {
            if (processingText && processingSubtitle) {
                messageIndex = (messageIndex + 1) % this.processingMessages.length;
                processingText.style.opacity = '0';
                processingText.style.transform = 'translateY(-10px)';
                
                setTimeout(() => {
                    processingText.textContent = this.processingMessages[messageIndex];
                    processingText.style.opacity = '1';
                    processingText.style.transform = 'translateY(0)';
                }, 300);
                
                // Update subtitle with helpful tips
                const subtitles = [
                    'Please wait while we work our magic...',
                    'Your files are being optimized...',
                    'Almost there, hang tight...',
                    'Putting the finishing touches...',
                    'Just a few more seconds...'
                ];
                
                setTimeout(() => {
                    processingSubtitle.style.opacity = '0';
                    setTimeout(() => {
                        processingSubtitle.textContent = subtitles[messageIndex] || subtitles[0];
                        processingSubtitle.style.opacity = '1';
                    }, 150);
                }, 150);
            }
        }, 2500);
    }
    
    hideProgress() {
        const overlay = document.getElementById('processing-overlay');
        if (overlay) {
            overlay.classList.remove('active');
        }
        
        if (this.messageInterval) {
            clearInterval(this.messageInterval);
            this.messageInterval = null;
        }
    }
    
    async sendProcessingRequest(formData) {
        try {
            const endpoint = this.getAPIEndpoint();
            
            const response = await fetch(endpoint, {
                method: 'POST',
                body: formData
            });
            
            const progressBar = document.getElementById('progress-bar');
            if (progressBar) {
                progressBar.style.width = '70%';
                progressBar.classList.add('shimmer');
            }
            
            if (response.ok) {
                const result = await response.json();
                if (progressBar) progressBar.style.width = '100%';
                
                // Show completion animation
                await this.showCompletionAnimation();
                this.playSound('success');
                this.showResults(result);
            } else {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
        } catch (error) {
            console.error('Processing error:', error);
            this.playSound('error');
            this.showError(`Processing failed: ${error.message}`);
        } finally {
            this.hideProgress();
            const progressArea = document.getElementById('progress-area');
            if (progressArea) progressArea.classList.add('hidden');
        }
    }
    
    async showCompletionAnimation() {
        return new Promise(resolve => {
            const overlay = document.getElementById('processing-overlay');
            const content = overlay?.querySelector('.processing-content');
            
            if (content) {
                // Replace spinner with checkmark
                content.innerHTML = `
                    <div class="completion-checkmark"></div>
                    <h3 class="processing-text">Success!</h3>
                    <p class="processing-subtitle">Your files have been processed successfully</p>
                `;
            }
            
            setTimeout(resolve, 1200);
        });
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
        
        // Animate results appearance
        resultsArea.classList.remove('hidden');
        resultsArea.style.opacity = '0';
        resultsArea.style.transform = 'translateY(20px)';
        
        setTimeout(() => {
            resultsArea.style.transition = 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)';
            resultsArea.style.opacity = '1';
            resultsArea.style.transform = 'translateY(0)';
        }, 100);
        
        downloadLinks.innerHTML = '';
        
        if (result.output_file) {
            this.createDownloadLink(result.output_file, downloadLinks, 0);
        } else if (result.output_files) {
            result.output_files.forEach((file, index) => {
                this.createDownloadLink(file, downloadLinks, index);
            });
        }
    }
    
    createDownloadLink(filePath, container, index = 0) {
        const fileName = filePath.split('/').pop();
        const linkDiv = document.createElement('div');
        linkDiv.className = 'bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-4 flex items-center justify-between shadow-sm hover:shadow-md transition-all transform hover:-translate-y-1';
        linkDiv.style.opacity = '0';
        linkDiv.style.transform = 'translateY(20px)';
        
        linkDiv.innerHTML = `
            <div class="flex items-center">
                <div class="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center mr-4">
                    <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    </svg>
                </div>
                <div>
                    <p class="text-sm font-semibold text-gray-900">${fileName}</p>
                    <p class="text-xs text-green-600">Ready to download</p>
                </div>
            </div>
            <a href="/api/download/${filePath}" class="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-6 py-2 rounded-lg text-sm font-medium transition-all transform hover:scale-105 hover:shadow-lg flex items-center" download>
                <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                </svg>
                Download
            </a>
        `;
        
        container.appendChild(linkDiv);
        
        // Animate appearance with delay
        setTimeout(() => {
            linkDiv.style.transition = 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)';
            linkDiv.style.opacity = '1';
            linkDiv.style.transform = 'translateY(0)';
        }, index * 150 + 200);
    }
    
    showError(message) {
        this.hideProgress();
        
        const errorArea = document.getElementById('error-area');
        const errorMessage = document.getElementById('error-message');
        
        if (errorArea && errorMessage) {
            // Add shake animation to error
            errorArea.classList.add('micro-shake');
            setTimeout(() => errorArea.classList.remove('micro-shake'), 600);
            
            errorMessage.textContent = message;
            errorArea.classList.remove('hidden');
            errorArea.style.opacity = '0';
            setTimeout(() => {
                errorArea.style.transition = 'all 0.3s ease';
                errorArea.style.opacity = '1';
            }, 100);
        }
        
        // Show temporary error notification
        this.showTemporaryMessage(message, 'error');
    }
    
    showTemporaryMessage(message, type = 'info') {
        const messageDiv = document.createElement('div');
        messageDiv.className = `fixed top-4 right-4 z-50 p-4 rounded-xl shadow-2xl transition-all transform translate-x-full notification-enter glass-card backdrop-blur-xl ${
            type === 'success' ? 'bg-gradient-to-r from-green-100 to-emerald-100 border border-green-300 text-green-800' :
            type === 'error' ? 'bg-gradient-to-r from-red-100 to-rose-100 border border-red-300 text-red-800' :
            'bg-gradient-to-r from-blue-100 to-indigo-100 border border-blue-300 text-blue-800'
        }`;
        
        const icons = {
            success: '✓',
            error: '✕',
            info: 'ℹ'
        };
        
        messageDiv.innerHTML = `
            <div class="flex items-center">
                <div class="w-8 h-8 mr-3 flex items-center justify-center rounded-full font-bold text-white ${
                    type === 'success' ? 'bg-green-500' :
                    type === 'error' ? 'bg-red-500' :
                    'bg-blue-500'
                } shadow-lg">
                    ${icons[type] || icons.info}
                </div>
                <div class="flex-1">
                    <p class="font-medium">${message}</p>
                </div>
                <button class="ml-3 w-6 h-6 flex items-center justify-center rounded-full hover:bg-white hover:bg-opacity-20 transition-colors" onclick="this.parentElement.parentElement.remove()">
                    <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"/>
                    </svg>
                </button>
            </div>
        `;
        
        document.body.appendChild(messageDiv);
        
        // Animate in
        setTimeout(() => {
            messageDiv.classList.remove('translate-x-full');
        }, 100);
        
        // Auto-remove after delay
        setTimeout(() => {
            messageDiv.classList.add('notification-exit');
            setTimeout(() => {
                if (messageDiv.parentNode) {
                    document.body.removeChild(messageDiv);
                }
            }, 300);
        }, 4000);
    }
}

// Initialize the app with comprehensive error handling
try {
    const app = new PDFToolApp();
    
    // Global error handler for better UX
    window.addEventListener('error', (event) => {
        console.error('Global error:', event.error);
        if (app.showTemporaryMessage) {
            app.showTemporaryMessage('An unexpected error occurred. Please try again.', 'error');
        }
    });
    
    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
        console.error('Unhandled promise rejection:', event.reason);
        if (app.showTemporaryMessage) {
            app.showTemporaryMessage('A processing error occurred. Please try again.', 'error');
        }
    });
    
    // Make app globally available
    window.app = app;
    
    console.log('PDF Tool App initialized successfully with enhanced animations and sound effects!');
} catch (error) {
    console.error('Failed to initialize PDF Tool App:', error);
    document.body.innerHTML = `
        <div class="min-h-screen flex items-center justify-center bg-red-50">
            <div class="text-center">
                <h1 class="text-2xl font-bold text-red-600 mb-4">Application Error</h1>
                <p class="text-red-500">Failed to initialize PDF Tool. Please refresh the page and try again.</p>
            </div>
        </div>
    `;
}