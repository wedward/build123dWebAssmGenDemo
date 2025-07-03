export class UIControls {
    constructor() {
        this.sidebar = document.querySelector('.fixed.left-3.top-3.bottom-3');
        this.mobileToggle = document.getElementById('mobile-toggle');
        this.sidebarOpen = false;
        
        this.setupEventListeners();
        this.handleMobileLayout();
    }

    // Mobile sidebar toggle functionality
    toggleSidebar() {
        this.sidebarOpen = !this.sidebarOpen;
        
        if (this.sidebarOpen) {
            this.sidebar.classList.remove('-translate-x-full');
            this.sidebar.classList.add('translate-x-0');
            // Add backdrop
            const backdrop = document.createElement('div');
            backdrop.id = 'sidebar-backdrop';
            backdrop.className = 'fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden';
            backdrop.addEventListener('click', () => this.toggleSidebar());
            document.body.appendChild(backdrop);
        } else {
            this.sidebar.classList.add('-translate-x-full');
            this.sidebar.classList.remove('translate-x-0');
            // Remove backdrop
            const backdrop = document.getElementById('sidebar-backdrop');
            if (backdrop) {
                backdrop.remove();
            }
        }
    }

    // Close sidebar if open (useful for mobile)
    closeSidebarIfOpen() {
        if (this.sidebarOpen && window.innerWidth < 1024) {
            this.toggleSidebar();
        }
    }

    // Handle mobile responsiveness
    handleMobileLayout() {
        const isLargeScreen = window.innerWidth >= 1024; // lg breakpoint
        
        if (isLargeScreen) {
            // Reset sidebar for desktop
            this.sidebar.classList.remove('-translate-x-full', 'translate-x-0');
            const backdrop = document.getElementById('sidebar-backdrop');
            if (backdrop) {
                backdrop.remove();
            }
            this.sidebarOpen = false;
        } else {
            // Initialize sidebar as hidden on mobile
            if (!this.sidebar.classList.contains('-translate-x-full') && !this.sidebarOpen) {
                this.sidebar.classList.add('-translate-x-full');
            }
        }
    }

    setupEventListeners() {
        this.mobileToggle.addEventListener('click', () => this.toggleSidebar());
        
        // Window resize handler for mobile layout
        window.addEventListener('resize', () => {
            this.handleMobileLayout();
        });
    }
} 