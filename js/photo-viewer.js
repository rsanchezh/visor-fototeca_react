// Photo Viewer - Manages the photo display modal
class PhotoViewer {
    constructor() {
        this.currentPhoto = null;

        // Get DOM elements
        this.elements = {
            modal: document.getElementById('photoModal'),
            overlay: document.getElementById('modalOverlay'),
            closeButton: document.getElementById('modalClose'),
            image: document.getElementById('photoImage'),
            loading: document.querySelector('.photo-loading'),
            title: document.getElementById('photoTitle'),
            idFotograma: document.getElementById('photoIdFotograma'),
            idVuelo: document.getElementById('photoIdVuelo'),
            fecha: document.getElementById('photoFecha'),
            hoja: document.getElementById('photoHoja')
        };

        this.setupEventListeners();
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Close button
        this.elements.closeButton.addEventListener('click', () => {
            this.close();
        });

        // Overlay click
        this.elements.overlay.addEventListener('click', () => {
            this.close();
        });

        // Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isOpen()) {
                this.close();
            }
        });
    }

    /**
     * Display a photo
     */
    async display(photoData, flight) {
        this.currentPhoto = photoData;

        // Show modal
        this.elements.modal.classList.add('active');

        // Show loading state
        this.elements.loading.classList.remove('hidden');
        this.elements.image.classList.remove('loaded');

        // Update metadata
        this.updateMetadata(photoData, flight);

        // Load image
        await this.loadImage(photoData, flight);
    }

    /**
     * Update photo metadata
     */
    updateMetadata(photoData, flight) {
        this.elements.title.textContent = `Fotograma ${photoData.fotogramas || photoData.id_fotogra || ''}`;
        this.elements.idFotograma.textContent = photoData.id_fotogra || '-';
        this.elements.idVuelo.textContent = photoData.id_vuelo || flight.name || '-';

        // Format date
        if (photoData.fecha) {
            const dateStr = photoData.fecha.toString();
            if (dateStr.length === 8) {
                const year = dateStr.substring(0, 4);
                const month = dateStr.substring(4, 6);
                const day = dateStr.substring(6, 8);
                this.elements.fecha.textContent = `${day}/${month}/${year}`;
            } else {
                this.elements.fecha.textContent = photoData.fecha;
            }
        } else {
            this.elements.fecha.textContent = '-';
        }

        this.elements.hoja.textContent = photoData.hoja || '-';
    }

    /**
     * Load photo image
     */
    async loadImage(photoData, flight) {
        try {
            // Find the image resource
            // The image URL should be in the flight resources with mimetype "png" or similar
            // For now, we'll construct a placeholder or try to find it

            // Try to find WMS GetMap request or image resource
            const imageUrl = this.findImageUrl(photoData, flight);

            if (!imageUrl) {
                throw new Error('No se encontró la URL de la imagen');
            }

            // Load image
            const img = new Image();

            const loadPromise = new Promise((resolve, reject) => {
                img.onload = () => resolve();
                img.onerror = () => reject(new Error('Error al cargar la imagen'));

                // Timeout
                setTimeout(() => reject(new Error('Timeout al cargar la imagen')), CONFIG.UI.PHOTO_LOAD_TIMEOUT);
            });

            img.src = imageUrl;
            await loadPromise;

            // Display image
            this.elements.image.src = imageUrl;
            this.elements.image.classList.add('loaded');
            this.elements.loading.classList.add('hidden');

        } catch (error) {
            console.error('Error loading photo:', error);
            this.elements.loading.innerHTML = `
                <div style="text-align: center; color: var(--text-muted);">
                    <p>Error al cargar la imagen</p>
                    <p style="font-size: 0.75rem; margin-top: 0.5rem;">${error.message}</p>
                </div>
            `;
        }
    }

    /**
     * Find image URL for a photo
     */
    findImageUrl(photoData, flight) {
        // Try to construct WMS GetMap URL
        if (flight.wfsUrl) {
            // Convert WFS URL to WMS URL
            const wmsUrl = flight.wfsUrl;

            // Get bounding box from photo geometry if available
            if (photoData.geometry && photoData.geometry.coordinates) {
                const [lon, lat] = photoData.geometry.coordinates;
                const buffer = 0.01; // Adjust as needed
                const bbox = `${lon - buffer},${lat - buffer},${lon + buffer},${lat + buffer}`;

                const params = new URLSearchParams({
                    SERVICE: 'WMS',
                    VERSION: '1.3.0',
                    REQUEST: 'GetMap',
                    LAYERS: 'fotogramas',
                    BBOX: bbox,
                    WIDTH: '800',
                    HEIGHT: '800',
                    CRS: 'EPSG:4326',
                    FORMAT: 'image/png',
                    TRANSPARENT: 'true'
                });

                return `${wmsUrl}?${params.toString()}`;
            }
        }

        // Try to find direct image resource in flight resources
        const imageResource = flight.resources.find(r =>
            r.mimetype && (r.mimetype.includes('image') || r.mimetype.includes('png'))
        );

        if (imageResource) {
            return imageResource.url;
        }

        // Fallback: return null
        return null;
    }

    /**
     * Close modal
     */
    close() {
        this.elements.modal.classList.remove('active');
        this.currentPhoto = null;

        // Reset image
        setTimeout(() => {
            this.elements.image.src = '';
            this.elements.image.classList.remove('loaded');
        }, 300);
    }

    /**
     * Check if modal is open
     */
    isOpen() {
        return this.elements.modal.classList.contains('active');
    }

    /**
     * Get current photo
     */
    getCurrentPhoto() {
        return this.currentPhoto;
    }
}
