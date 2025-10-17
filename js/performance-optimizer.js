/**
 * Performance Optimization System
 * Handles loading states, lazy loading, caching, and performance monitoring
 */

class PerformanceOptimizer {
    constructor() {
        this.loadingStates = new Map();
        this.lazyElements = new Map();
        this.performanceMetrics = {};
        this.observerOptions = {
            root: null,
            rootMargin: '50px',
            threshold: 0.1
        };
        
        this.init();
    }

    init() {
        this.initializeLoadingStates();
        this.setupLazyLoading();
        this.setupPerformanceMonitoring();
        this.optimizeImages();
        this.setupProgressiveLoading();
    }

    initializeLoadingStates() {
        // Create global loading overlay
        this.createLoadingOverlay();
        
        // Setup loading states for different sections
        this.setupSectionLoading();
        
        // Add loading animations
        this.addLoadingAnimations();
    }

    createLoadingOverlay() {
        const overlay = document.createElement('div');
        overlay.id = 'global-loading';
        overlay.className = 'loading-overlay';
        overlay.innerHTML = `
            <div class="loading-content">
                <div class="loading-spinner">
                    <div class="spinner-ring"></div>
                    <div class="spinner-ring"></div>
                    <div class="spinner-ring"></div>
                </div>
                <div class="loading-text">Preparing your future self experience...</div>
                <div class="loading-progress">
                    <div class="progress-bar"></div>
                </div>
            </div>
        `;
        document.body.appendChild(overlay);
        
        // Hide after initial load
        window.addEventListener('load', () => {
            setTimeout(() => this.hideLoadingOverlay(), 1000);
        });
    }

    hideLoadingOverlay() {
        const overlay = document.getElementById('global-loading');
        if (overlay) {
            overlay.style.opacity = '0';
            setTimeout(() => overlay.remove(), 500);
        }
    }

    setupSectionLoading() {
        const sections = [
            '.preparation-section',
            '.language-section', 
            '.main-content',
            '.vault-section'
        ];

        sections.forEach(selector => {
            const section = document.querySelector(selector);
            if (section) {
                this.addSectionLoader(section);
            }
        });
    }

    addSectionLoader(section) {
        const loader = document.createElement('div');
        loader.className = 'section-loader';
        loader.innerHTML = `
            <div class="loader-spinner"></div>
            <div class="loader-text">Loading...</div>
        `;
        
        section.appendChild(loader);
        
        // Hide loader when section is ready
        setTimeout(() => {
            loader.style.opacity = '0';
            setTimeout(() => loader.remove(), 300);
        }, 500);
    }

    setupLazyLoading() {
        // Setup Intersection Observer for lazy loading
        this.lazyObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    this.loadElement(entry.target);
                    this.lazyObserver.unobserve(entry.target);
                }
            });
        }, this.observerOptions);

        // Find lazy-loadable elements
        this.findLazyElements();
    }

    findLazyElements() {
        // Images
        const lazyImages = document.querySelectorAll('img[data-src]');
        lazyImages.forEach(img => {
            this.lazyObserver.observe(img);
        });

        // Sections that can be lazy loaded
        const lazySections = document.querySelectorAll('[data-lazy]');
        lazySections.forEach(section => {
            this.lazyObserver.observe(section);
        });
    }

    loadElement(element) {
        if (element.tagName === 'IMG' && element.dataset.src) {
            // Load image
            element.src = element.dataset.src;
            element.classList.add('loaded');
            delete element.dataset.src;
        } else if (element.dataset.lazy) {
            // Load section content
            element.classList.add('lazy-loaded');
            this.loadSectionContent(element);
        }
    }

    loadSectionContent(section) {
        // Add entrance animation
        section.style.opacity = '0';
        section.style.transform = 'translateY(20px)';
        
        requestAnimationFrame(() => {
            section.style.transition = 'all 0.5s ease';
            section.style.opacity = '1';
            section.style.transform = 'translateY(0)';
        });
    }

    setupPerformanceMonitoring() {
        // Monitor Core Web Vitals
        this.monitorCoreWebVitals();
        
        // Monitor custom metrics
        this.monitorCustomMetrics();
        
        // Setup performance observer
        this.setupPerformanceObserver();
    }

    monitorCoreWebVitals() {
        // Largest Contentful Paint (LCP)
        new PerformanceObserver((entryList) => {
            const entries = entryList.getEntries();
            const lastEntry = entries[entries.length - 1];
            this.performanceMetrics.lcp = lastEntry.startTime;
        }).observe({ entryTypes: ['largest-contentful-paint'] });

        // First Input Delay (FID)
        new PerformanceObserver((entryList) => {
            const entries = entryList.getEntries();
            entries.forEach(entry => {
                this.performanceMetrics.fid = entry.processingStart - entry.startTime;
            });
        }).observe({ entryTypes: ['first-input'] });

        // Cumulative Layout Shift (CLS)
        let clsValue = 0;
        new PerformanceObserver((entryList) => {
            const entries = entryList.getEntries();
            entries.forEach(entry => {
                if (!entry.hadRecentInput) {
                    clsValue += entry.value;
                }
            });
            this.performanceMetrics.cls = clsValue;
        }).observe({ entryTypes: ['layout-shift'] });
    }

    monitorCustomMetrics() {
        // Time to Interactive
        this.measureTimeToInteractive();
        
        // Voice Recognition Initialization Time
        this.measureVoiceInitTime();
        
        // App Ready Time
        this.measureAppReadyTime();
    }

    measureTimeToInteractive() {
        const startTime = performance.now();
        
        const checkInteractive = () => {
            if (document.readyState === 'complete' && 
                window.voiceEnhancer && 
                document.querySelector('.voice-status')) {
                this.performanceMetrics.tti = performance.now() - startTime;
            } else {
                setTimeout(checkInteractive, 100);
            }
        };
        
        checkInteractive();
    }

    measureVoiceInitTime() {
        const startTime = performance.now();
        
        window.addEventListener('voiceReady', () => {
            this.performanceMetrics.voiceInitTime = performance.now() - startTime;
        });
    }

    measureAppReadyTime() {
        window.addEventListener('load', () => {
            setTimeout(() => {
                this.performanceMetrics.appReady = performance.now();
                this.reportPerformanceMetrics();
            }, 1000);
        });
    }

    setupPerformanceObserver() {
        if ('PerformanceObserver' in window) {
            const observer = new PerformanceObserver((list) => {
                const entries = list.getEntries();
                entries.forEach(entry => {
                    if (entry.entryType === 'navigation') {
                        this.performanceMetrics.navigationTiming = entry;
                    }
                });
            });
            
            observer.observe({ entryTypes: ['navigation', 'resource'] });
        }
    }

    optimizeImages() {
        // Add loading='lazy' to images
        const images = document.querySelectorAll('img:not([loading])');
        images.forEach(img => {
            img.loading = 'lazy';
        });

        // Optimize canvas elements
        this.optimizeCanvas();
    }

    optimizeCanvas() {
        const canvases = document.querySelectorAll('canvas');
        canvases.forEach(canvas => {
            // Enable image smoothing optimization
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.imageSmoothingEnabled = true;
                ctx.imageSmoothingQuality = 'high';
            }
        });
    }

    setupProgressiveLoading() {
        // Load critical CSS first
        this.loadCriticalCSS();
        
        // Preload important resources
        this.preloadResources();
        
        // Setup service worker for caching
        this.setupServiceWorkerOptimizations();
    }

    loadCriticalCSS() {
        // Critical CSS is already inlined, but we can optimize non-critical CSS loading
        const nonCriticalCSS = [
            // Add any non-critical CSS files here
        ];

        nonCriticalCSS.forEach(href => {
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = href;
            link.media = 'print';
            link.onload = () => link.media = 'all';
            document.head.appendChild(link);
        });
    }

    preloadResources() {
        const criticalResources = [
            { href: 'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Space+Grotesk:wght@400;500;600;700&display=swap', as: 'style' },
            // Add other critical resources
        ];

        criticalResources.forEach(resource => {
            const link = document.createElement('link');
            link.rel = 'preload';
            link.href = resource.href;
            link.as = resource.as;
            if (resource.crossorigin) link.crossOrigin = resource.crossorigin;
            document.head.appendChild(link);
        });
    }

    setupServiceWorkerOptimizations() {
        if ('serviceWorker' in navigator) {
            // Enhance service worker with performance optimizations
            navigator.serviceWorker.ready.then(registration => {
                // Add performance-focused message handling
                navigator.serviceWorker.addEventListener('message', event => {
                    if (event.data.type === 'PERFORMANCE_UPDATE') {
                        this.handleServiceWorkerPerformanceUpdate(event.data);
                    }
                });
            });
        }
    }

    // Loading state management
    showLoading(elementOrSelector, message = 'Loading...') {
        const element = typeof elementOrSelector === 'string' 
            ? document.querySelector(elementOrSelector)
            : elementOrSelector;
            
        if (!element) return;

        const loadingId = this.generateLoadingId();
        this.loadingStates.set(loadingId, element);

        const loader = document.createElement('div');
        loader.className = 'inline-loader';
        loader.dataset.loadingId = loadingId;
        loader.innerHTML = `
            <div class="loader-spinner-small"></div>
            <span class="loader-message">${message}</span>
        `;

        element.appendChild(loader);
        return loadingId;
    }

    hideLoading(loadingId) {
        const element = this.loadingStates.get(loadingId);
        if (!element) return;

        const loader = element.querySelector(`[data-loading-id="${loadingId}"]`);
        if (loader) {
            loader.style.opacity = '0';
            setTimeout(() => loader.remove(), 300);
        }

        this.loadingStates.delete(loadingId);
    }

    generateLoadingId() {
        return 'loading_' + Math.random().toString(36).substr(2, 9);
    }

    // Debounced function helper
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    // Throttled function helper
    throttle(func, limit) {
        let inThrottle;
        return function() {
            const args = arguments;
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }

    // Performance reporting
    reportPerformanceMetrics() {
        console.log('Performance Metrics:', this.performanceMetrics);
        
        // Report to analytics service (if available)
        if (window.gtag) {
            window.gtag('event', 'performance_metrics', {
                lcp: this.performanceMetrics.lcp,
                fid: this.performanceMetrics.fid,
                cls: this.performanceMetrics.cls,
                tti: this.performanceMetrics.tti
            });
        }
    }

    // Memory management
    cleanup() {
        this.loadingStates.clear();
        this.lazyElements.clear();
        if (this.lazyObserver) {
            this.lazyObserver.disconnect();
        }
    }
}

// Initialize performance optimizer
const performanceOptimizer = new PerformanceOptimizer();

// Export for global access
window.performanceOptimizer = performanceOptimizer;