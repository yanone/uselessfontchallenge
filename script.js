class FontVendorDVD {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.vendorName = '';
        this.position = { x: 50, y: 50 };
        this.velocity = { x: 2, y: 1.5 };
        this.colors = [
            '#FF0000', '#00FF00', '#0000FF', '#FFFF00',
            '#FF00FF', '#00FFFF', '#FFA500', '#FF69B4'
        ];
        this.currentColorIndex = 0;
        this.fontSize = 120; // Will be calculated based on viewport
        this.textWidth = 0;
        this.textHeight = 0;
        this.animationId = null;
        this.baseSpeed = 2; // Will be scaled based on viewport

        this.init();
    }

    init() {
        // Set up file upload
        const uploadArea = document.querySelector('.upload-area');
        const fileInput = document.getElementById('font-upload');
        const resetButton = document.getElementById('reset-button');

        // Click to upload
        uploadArea.addEventListener('click', () => {
            fileInput.click();
        });

        // Drag and drop
        uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadArea.style.borderColor = '#00ffff';
            uploadArea.style.background = 'rgba(0, 255, 255, 0.2)';
        });

        uploadArea.addEventListener('dragleave', (e) => {
            e.preventDefault();
            uploadArea.style.borderColor = '#ff00ff';
            uploadArea.style.background = 'rgba(255, 0, 255, 0.05)';
        });

        uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadArea.style.borderColor = '#ff00ff';
            uploadArea.style.background = 'rgba(255, 0, 255, 0.05)';

            const files = e.dataTransfer.files;
            if (files.length > 0) {
                this.handleFileUpload(files[0]);
            }
        });

        // File input change
        fileInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                this.handleFileUpload(e.target.files[0]);
            }
        });

        // Reset button
        resetButton.addEventListener('click', () => {
            this.resetToUpload();
        });
    }

    handleFileUpload(file) {
        // Validate file type
        const validTypes = ['.ttf', '.otf', '.woff', '.woff2'];
        const fileName = file.name.toLowerCase();
        const isValid = validTypes.some(type => fileName.endsWith(type));

        if (!isValid) {
            this.showError('Please upload a valid font file (TTF, OTF, WOFF, WOFF2)');
            return;
        }

        // Read the file
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                this.parseFontFile(e.target.result);
            } catch (error) {
                this.showError('Failed to read font file: ' + error.message);
            }
        };
        reader.readAsArrayBuffer(file);
    }

    parseFontFile(arrayBuffer) {
        try {
            // Parse font with opentype.js
            const font = opentype.parse(arrayBuffer);

            // Extract vendor ID from OS/2 table
            let vendorName = 'Unknown';

            if (font.tables && font.tables.os2 && font.tables.os2.achVendID) {
                vendorName = font.tables.os2.achVendID.trim();
            }

            // If no vendor ID, try to get font family name as fallback
            if (!vendorName || vendorName === 'Unknown' || vendorName.length === 0) {
                if (font.names && font.names.fontFamily) {
                    vendorName = font.names.fontFamily.en || font.names.fontFamily;
                } else {
                    vendorName = 'Mystery Font';
                }
            }

            // Clean up the vendor name (remove null characters and whitespace)
            vendorName = vendorName.replace(/\0/g, '').trim();

            if (vendorName.length === 0) {
                vendorName = 'Mystery Font';
            }

            this.vendorName = vendorName;
            this.startScreensaver();

        } catch (error) {
            console.error('Font parsing error:', error);
            this.showError('Could not parse font file. Please try a different font.');
        }
    }

    startScreensaver() {
        // Hide upload container and show screensaver
        document.getElementById('upload-container').style.display = 'none';
        document.getElementById('screensaver-container').style.display = 'block';

        // Set up canvas
        this.canvas = document.getElementById('screensaver-canvas');
        this.ctx = this.canvas.getContext('2d');

        // Make canvas full screen
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());

        // Initialize viewport-responsive settings
        this.updateViewportSettings();

        // Initialize position and velocity with responsive spacing
        const textEstimateWidth = this.fontSize * 8; // Rough estimate for positioning
        const textEstimateHeight = this.fontSize * 1.2;
        this.position = {
            x: Math.random() * Math.max(100, this.canvas.width - textEstimateWidth),
            y: Math.random() * Math.max(50, this.canvas.height - textEstimateHeight)
        };

        // Start animation
        this.animate();
    }

    resizeCanvas() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;

        // Update font size and speed based on viewport
        this.updateViewportSettings();
    }

    updateViewportSettings() {
        // Calculate font size based on viewport (responsive scaling)
        const minDimension = Math.min(window.innerWidth, window.innerHeight);
        const maxDimension = Math.max(window.innerWidth, window.innerHeight);

        // Font size: scale from 40px (small screens) to 360px (large screens)
        // Use exponential scaling for larger screens to make them really pop
        let baseFontSize = minDimension * 0.08;
        if (minDimension > 800) {
            // Extra scaling for large screens (2x factor boost)
            baseFontSize = minDimension * 0.16;
        }
        this.fontSize = Math.max(40, Math.min(360, baseFontSize));

        // Speed scaling based on screen size
        const speedMultiplier = Math.max(0.5, Math.min(3, maxDimension / 800));
        this.velocity.x = this.velocity.x > 0 ?
            this.baseSpeed * speedMultiplier :
            -this.baseSpeed * speedMultiplier;
        this.velocity.y = this.velocity.y > 0 ?
            this.baseSpeed * speedMultiplier * 0.75 :
            -this.baseSpeed * speedMultiplier * 0.75;
    }

    animate() {
        // Clear canvas
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Set up text properties
        this.ctx.font = `bold ${this.fontSize}px Orbitron, monospace`;
        this.ctx.textAlign = 'left';
        this.ctx.textBaseline = 'top';

        // Measure text
        const metrics = this.ctx.measureText(this.vendorName);
        this.textWidth = metrics.width;
        this.textHeight = this.fontSize;

        // Update position
        this.position.x += this.velocity.x;
        this.position.y += this.velocity.y;

        // Check boundaries and bounce
        let bounced = false;

        if (this.position.x <= 0 || this.position.x + this.textWidth >= this.canvas.width) {
            this.velocity.x = -this.velocity.x;
            this.position.x = Math.max(0, Math.min(this.position.x, this.canvas.width - this.textWidth));
            bounced = true;
        }

        if (this.position.y <= 0 || this.position.y + this.textHeight >= this.canvas.height) {
            this.velocity.y = -this.velocity.y;
            this.position.y = Math.max(0, Math.min(this.position.y, this.canvas.height - this.textHeight));
            bounced = true;
        }

        // Change color on bounce
        if (bounced) {
            this.currentColorIndex = (this.currentColorIndex + 1) % this.colors.length;
        }

        // Draw text with glow effect
        const currentColor = this.colors[this.currentColorIndex];

        // Responsive glow effect based on font size
        const glowIntensity = this.fontSize / 3;

        // Large outer glow
        this.ctx.shadowColor = currentColor;
        this.ctx.shadowBlur = glowIntensity;
        this.ctx.fillStyle = currentColor;
        this.ctx.fillText(this.vendorName, this.position.x, this.position.y);

        // Medium glow
        this.ctx.shadowBlur = glowIntensity / 2;
        this.ctx.fillStyle = currentColor;
        this.ctx.fillText(this.vendorName, this.position.x, this.position.y);

        // Main colored text (no white overlay)
        this.ctx.shadowBlur = 0;
        this.ctx.fillStyle = currentColor;
        this.ctx.fillText(this.vendorName, this.position.x, this.position.y);

        // Continue animation
        this.animationId = requestAnimationFrame(() => this.animate());
    }

    resetToUpload() {
        // Stop animation
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }

        // Show upload container and hide screensaver
        document.getElementById('screensaver-container').style.display = 'none';
        document.getElementById('upload-container').style.display = 'flex';

        // Reset file input
        document.getElementById('font-upload').value = '';

        // Reset properties
        this.vendorName = '';
        this.currentColorIndex = 0;
    }

    showError(message) {
        const errorElement = document.getElementById('error-message');
        const errorText = document.getElementById('error-text');

        errorText.textContent = message;
        errorElement.style.display = 'flex';
    }
}

// Global function to hide error (called from HTML)
function hideError() {
    document.getElementById('error-message').style.display = 'none';
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new FontVendorDVD();
});

// Add some easter eggs
document.addEventListener('keydown', (e) => {
    // Konami code easter egg
    if (e.code === 'ArrowUp') {
        document.body.style.filter = 'hue-rotate(30deg)';
        setTimeout(() => {
            document.body.style.filter = 'none';
        }, 1000);
    }
});