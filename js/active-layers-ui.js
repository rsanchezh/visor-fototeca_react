// Active Layers UI - Manages the active photo layers panel
class ActiveLayersUI {
    constructor(mapeaController, ckanService) {
        this.mapeaController = mapeaController;
        this.ckanService = ckanService;
        this.container = document.getElementById('activeLayersList');
        this.selectedLayers = new Set(); // Track selected layers for download
        this.isRemoveMode = false; // Default: Hide mode
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Download button
        const btnDownload = document.getElementById('btnDownloadSelected');
        if (btnDownload) {
            btnDownload.addEventListener('click', () => this.handleDownload());
        }

        // Remove Mode Toggle
        const removeModeToggle = document.getElementById('removeLayerMode');
        if (removeModeToggle) {
            removeModeToggle.addEventListener('change', (e) => {
                this.isRemoveMode = e.target.checked;
                console.log('🔄 Click behavior mode changed:', this.isRemoveMode ? 'REMOVE' : 'HIDE');
            });
        }
    }

    /**
     * Update the active layers list display
     */
    updateLayersList() {
        const activeLayers = this.mapeaController.wmsPhotoLayers;

        if (activeLayers.size === 0) {
            this.showEmptyState();
            return;
        }

        // Group layers by flight
        const layersByFlight = this.groupLayersByFlight(activeLayers);

        this.container.innerHTML = '';

        // Create a section for each flight
        layersByFlight.forEach((layers, flightName) => {
            const flightSection = this.createFlightSection(flightName, layers);
            this.container.appendChild(flightSection);
        });
    }

    /**
     * Group layers by flight name
     */
    groupLayersByFlight(activeLayers) {
        const grouped = new Map();

        activeLayers.forEach((layer, fotogramaId) => {
            // Get flight data stored in the layer
            const flightData = layer.get('flightData');
            const flightName = flightData ? flightData.title : 'Vuelo desconocido';

            if (!grouped.has(flightName)) {
                grouped.set(flightName, []);
            }

            grouped.get(flightName).push({ fotogramaId, layer });
        });

        return grouped;
    }

    /**
     * Create a flight section with header and layer items
     */
    createFlightSection(flightName, layers) {
        const section = document.createElement('div');
        section.className = 'flight-section';

        // Flight header
        const header = document.createElement('div');
        header.className = 'flight-section-header';
        header.innerHTML = `
            <span class="flight-section-title">${this.escapeHtml(flightName)}</span>
            <span class="flight-section-count">${layers.length}</span>
        `;
        section.appendChild(header);

        // Layer items
        const itemsContainer = document.createElement('div');
        itemsContainer.className = 'flight-section-items';

        layers.forEach(({ fotogramaId, layer }) => {
            const item = this.createLayerItem(fotogramaId, layer);
            this.attachLayerItemEvents(item, fotogramaId, layer);  // ATTACH EVENT LISTENERS
            itemsContainer.appendChild(item);
        });

        section.appendChild(itemsContainer);
        return section;
    }

    /**
     * Show empty state when no layers are active
     */
    showEmptyState() {
        this.container.innerHTML = '<p class="no-layers-message">No hay capas activas</p>';
    }

    /**
     * Create a layer item element
     */
    createLayerItem(fotogramaId, layer) {
        const item = document.createElement('div');
        item.className = 'layer-item-compact';
        item.dataset.fotogramaId = fotogramaId;

        // Get current opacity and visibility
        const currentOpacity = layer.getOpacity();
        const opacityPercent = Math.round(currentOpacity * 100);
        const isVisible = layer.getVisible();

        // Check if this layer is selected (preserve selection state)
        const isSelected = this.selectedLayers.has(fotogramaId);

        // Get fotograma name to display (prefer 'fotograma' property over ID)
        const photoProperties = layer.get('photoProperties');
        let displayName = fotogramaId;

        if (photoProperties) {
            // Try to find a property named 'fotograma' (case insensitive)
            const fotogramaProp = Object.keys(photoProperties).find(k => k.toLowerCase() === 'fotograma');
            if (fotogramaProp && photoProperties[fotogramaProp]) {
                displayName = photoProperties[fotogramaProp];
            }
        }

        // CLEANUP: If the name still looks like "123-456" (Flight-Photo), strip the prefix
        // This handles cases where we fallback to ID or the property itself includes the flight
        if (typeof displayName === 'string' && displayName.includes('-')) {
            const parts = displayName.split('-');
            if (parts.length > 1) {
                // Return the last part (the photo number)
                displayName = parts[parts.length - 1];
            }
        }

        item.innerHTML = `
            <div class="layer-item-main">
                <input type="checkbox" class="layer-checkbox" data-fotograma-id="${fotogramaId}" ${isSelected ? 'checked' : ''}>
                <span class="layer-photo-id">${this.escapeHtml(String(displayName))}</span>
                <div class="layer-actions">
                    <button class="layer-action-btn visibility-btn ${isVisible ? 'visible' : 'hidden'}" 
                            data-fotograma-id="${fotogramaId}" 
                            title="${isVisible ? 'Ocultar' : 'Mostrar'}">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            ${isVisible ?
                '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle>' :
                '<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line>'
            }
                        </svg>
                    </button>
                    <button class="layer-action-btn info-btn" 
                            data-fotograma-id="${fotogramaId}" 
                            title="Información">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <circle cx="12" cy="12" r="10"></circle>
                            <line x1="12" y1="16" x2="12" y2="12"></line>
                            <line x1="12" y1="8" x2="12.01" y2="8"></line>
                        </svg>
                    </button>
                    <button class="layer-action-btn print-btn" 
                            data-fotograma-id="${fotogramaId}" 
                            title="Descargar PDF">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M6 9V2h12v7"></path>
                            <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
                            <rect x="6" y="14" width="12" height="8"></rect>
                        </svg>
                    </button>
                    <button class="layer-action-btn delete-btn" 
                        data-fotograma-id="${fotogramaId}" 
                        title="Eliminar capa"
                        style="color: var(--danger-color, #ef4444);">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                </button>
            </div>
            </div>
            <div class="layer-opacity-control">
                <label class="opacity-label">Opacidad:</label>
                <input type="range" class="opacity-slider" 
                       min="0" max="100" value="${opacityPercent}" 
                       data-fotograma-id="${fotogramaId}">
                <span class="opacity-value">${opacityPercent}%</span>
            </div>
        `;

        // Event listeners are attached in createFlightSection()

        return item;
    }

    /**
     * Attach event listeners to layer item
     */
    attachLayerItemEvents(item, fotogramaId, layer) {
        // Checkbox for selection
        const checkbox = item.querySelector('.layer-checkbox');
        checkbox.addEventListener('change', (e) => {
            if (e.target.checked) {
                this.selectedLayers.add(fotogramaId);
            } else {
                this.selectedLayers.delete(fotogramaId);
            }
            this.updateDownloadButton();
            console.log('Selected layers:', Array.from(this.selectedLayers));
        });

        // Visibility toggle
        const visibilityBtn = item.querySelector('.visibility-btn');
        if (!visibilityBtn) {
            console.error('❌ Visibility button not found for:', fotogramaId);
            console.log('   Item HTML:', item.innerHTML);
        } else {
            console.log('✅ Attaching visibility listener for:', fotogramaId);
            visibilityBtn.addEventListener('click', () => {
                console.log('👁️ Visibility button clicked for:', fotogramaId);
                this.toggleLayerVisibility(fotogramaId, layer, visibilityBtn);
            });
        }

        // Info button
        const infoBtn = item.querySelector('.info-btn');
        infoBtn.addEventListener('click', () => {
            this.showLayerInfo(fotogramaId);
        });

        // Print PDF button
        const printBtn = item.querySelector('.print-btn');
        if (printBtn) {
            printBtn.addEventListener('click', () => {
                this.generateOneLayerPDF(fotogramaId);
            });
        }

        // Remove button
        const deleteBtn = item.querySelector('.delete-btn');
        if (deleteBtn) {
            deleteBtn.addEventListener('click', () => {
                console.log('🗑️ Removing layer via UI:', fotogramaId);
                this.mapeaController.removePhotoLayer(fotogramaId);
            });
        }

        // Opacity slider
        const opacitySlider = item.querySelector('.opacity-slider');
        const opacityValue = item.querySelector('.opacity-value');

        opacitySlider.addEventListener('input', (e) => {
            const opacity = parseInt(e.target.value) / 100;
            layer.setOpacity(opacity);
            opacityValue.textContent = `${e.target.value}%`;
        });
    }

    /**
     * Generate PDF for a single layer
     */
    async generateOneLayerPDF(fotogramaId) {
        try {
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF();

            const layer = this.mapeaController.wmsPhotoLayers.get(fotogramaId);
            if (!layer) {
                alert('Error: La capa no está disponible.');
                return;
            }

            const flight = layer.get('flightData');
            const photoProperties = layer.get('photoProperties');
            const ckanExtras = layer.get('ckanExtras');

            // 1. Header
            doc.setFontSize(18);
            doc.setTextColor(40, 40, 40);
            doc.text(`Fotograma: ${fotogramaId}`, 20, 20);

            doc.setFontSize(12);
            doc.setTextColor(100, 100, 100);
            if (flight) {
                doc.text(`Vuelo: ${flight.title || flight.name}`, 20, 30);
            }

            let yPos = 45;

            // 2. Metadata Section
            doc.setFontSize(14);
            doc.setTextColor(0, 0, 0);
            doc.text('Información:', 20, yPos);
            yPos += 10;

            doc.setFontSize(10);
            doc.setTextColor(60, 60, 60);

            // Display properties
            const addLine = (label, value) => {
                if (value) {
                    doc.text(`${label}: ${value}`, 20, yPos);
                    yPos += 7;
                }
            };

            // Select specific properties to display
            const targetProperties = [
                { key: 'fotograma', label: 'Nombre' },
                { key: 'año', label: 'Año' },
                { key: 'fecha', label: 'Fecha' }, // Alternative to year
                { key: 'hoja', label: 'Hoja' },
                { key: 'hoja_50000', label: 'Hoja 50000' }
            ];

            // Helper to normalize keys for case-insensitive matching
            const normalize = str => str.toLowerCase().replace(/[_-]/g, '');

            // Collect values
            const valuesToShow = [];

            // 1. Fotograma Name (Always show ID if name not found)
            let nameVal = fotogramaId;
            if (ckanExtras) {
                const extra = ckanExtras.find(e => normalize(e.key) === 'fotograma');
                if (extra) nameVal = extra.value;
            } else if (photoProperties) {
                const prop = Object.keys(photoProperties).find(k => normalize(k) === 'fotograma');
                if (prop) nameVal = photoProperties[prop];
            }
            if (nameVal.includes('-')) nameVal = nameVal.split('-').pop(); // Clean name
            valuesToShow.push({ label: 'Fotograma', value: nameVal });

            // 2. Year / Date
            let yearVal = null;
            if (ckanExtras) {
                const extra = ckanExtras.find(e => normalize(e.key) === 'año' || normalize(e.key) === 'fecha');
                if (extra) yearVal = extra.value;
            } else if (photoProperties) {
                const prop = Object.keys(photoProperties).find(k => normalize(k) === 'año' || normalize(k) === 'fecha');
                if (prop) yearVal = photoProperties[prop];
            }
            if (yearVal) {
                valuesToShow.push({ label: 'Año', value: yearVal });
            }

            // 3. Sheet
            let sheetVal = null;
            if (ckanExtras) {
                const extra = ckanExtras.find(e => normalize(e.key).includes('hoja'));
                if (extra) sheetVal = extra.value;
            } else if (photoProperties) {
                const prop = Object.keys(photoProperties).find(k => normalize(k).includes('hoja'));
                if (prop) sheetVal = photoProperties[prop];
            }
            if (sheetVal) {
                valuesToShow.push({ label: 'Hoja 50000', value: sheetVal });
            }

            // Render selected values
            valuesToShow.forEach(item => {
                addLine(item.label, item.value);
            });

            yPos += 10;

            // 3. Image (if available)
            const source = layer.getSource();
            // Try to get URL from WMS params or direct URL property
            let imgUrl = null;

            if (source.getUrls) {
                imgUrl = source.getUrls()[0];
            } else if (source.getUrl) {
                imgUrl = source.getUrl();
            }

            if (imgUrl) {
                doc.text('Imagen:', 20, yPos);
                yPos += 10;

                try {
                    // Load image to add to PDF
                    const img = new Image();
                    img.crossOrigin = "Anonymous";

                    await new Promise((resolve, reject) => {
                        img.onload = function () {
                            const maxWidth = 170;
                            let w = img.width;
                            let h = img.height;
                            const finalW = 170;
                            const finalH = (h * finalW) / w;

                            doc.addImage(img, 'PNG', 20, yPos, finalW, finalH);
                            resolve();
                        };
                        img.onerror = () => {
                            console.warn('Could not load image for PDF (likely CORS)');
                            doc.text('(Imagen no disponible para descarga directa por seguridad)', 20, yPos);
                            resolve();
                        };
                        img.src = imgUrl;
                    });
                } catch (e) {
                    console.error('Error adding image to PDF', e);
                }
            }

            doc.save(`fotograma_${fotogramaId}.pdf`);

        } catch (error) {
            console.error('Error generating PDF:', error);
            alert('Error al generar el PDF. Asegúrese de que la imagen es accesible.');
        }
    }

    /**
     * Toggle layer visibility
     */
    toggleLayerVisibility(fotogramaId, layer, button) {
        const currentVisibility = layer.getVisible();
        layer.setVisible(!currentVisibility);

        // Update button appearance
        if (!currentVisibility) {
            button.classList.remove('hidden');
            button.classList.add('visible');
            button.title = 'Ocultar';
            button.innerHTML = `
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                    <circle cx="12" cy="12" r="3"></circle>
                </svg>
            `;
        } else {
            button.classList.remove('visible');
            button.classList.add('hidden');
            button.title = 'Mostrar';
            button.innerHTML = `
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                    <line x1="1" y1="1" x2="23" y2="23"></line>
                </svg>
            `;
        }
    }

    /**
     * Show layer information popup
     */
    showLayerInfo(fotogramaId) {
        const layer = this.mapeaController.wmsPhotoLayers.get(fotogramaId);
        const flight = layer ? layer.get('flightData') : this.mapeaController.currentFlight;
        const photoProperties = layer ? layer.get('photoProperties') : null;
        const ckanExtras = layer ? layer.get('ckanExtras') : null;

        if (!flight) {
            alert('No hay información disponible para esta capa');
            return;
        }

        this.showFlightInfo(flight, fotogramaId, photoProperties, ckanExtras);
    }

    /**
     * Show flight information popup (Public)
     */
    showFlightInfo(flight, fotogramaId = null, photoProperties = null, ckanExtras = null) {
        // Create popup content
        let content = `<div class="layer-info-popup">`;

        // CASE 1: Photograma View (CKAN Extras available) - User rejected flight info and generic props
        if (ckanExtras && Array.isArray(ckanExtras) && ckanExtras.length > 0) {
            content += `<h3>Información del Fotograma</h3>`;

            let hasData = false;
            ckanExtras.forEach(extra => {
                // Filter out 'spatial' and empty values
                if (extra.value && extra.value !== '' && extra.key.toLowerCase() !== 'spatial') {
                    const label = extra.key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                    content += `<p><strong>${this.escapeHtml(label)}:</strong> ${this.escapeHtml(String(extra.value))}</p>`;
                    hasData = true;
                }
            });

            if (!hasData) {
                content += `<p style="color: var(--text-muted); font-style: italic;">No hay datos adicionales disponibles</p>`;
            }

            // ADD LINK TO CKAN (Dataset page)
            if (fotogramaId) {
                // Ensure ID is lowercase and has underscores instead of dashes
                const normalizeId = (id) => id.toString().replace(/-/, '_').toLowerCase();
                const ckanLink = `https://ws089.juntadeandalucia.es/fototeca/catalogo/dataset/${normalizeId(fotogramaId)}`;

                content += `<hr>`;
                content += `<p style="text-align: center; margin-top: 10px;">
                    <a href="${ckanLink}" target="_blank" style="color: var(--primary-color); text-decoration: none; font-weight: 500;">
                        🔗 Ver en Catálogo CKAN
                    </a>
                </p>`;
            }
        }
        // CASE 2: Flight View (No CKAN Extras) - Standard Flight Info
        else {
            if (fotogramaId) {
                content += `<h3>Información del Fotograma</h3>`;
                content += `<p><strong>ID:</strong> ${this.escapeHtml(fotogramaId)}</p>`;

                // Show specific photo properties if available
                if (photoProperties) {
                    if (photoProperties.fecha || photoProperties.FECHA)
                        content += `<p><strong>Fecha:</strong> ${this.escapeHtml(photoProperties.fecha || photoProperties.FECHA)}</p>`;
                    if (photoProperties.hoja || photoProperties.HOJA)
                        content += `<p><strong>Hoja:</strong> ${this.escapeHtml(photoProperties.hoja || photoProperties.HOJA)}</p>`;
                    if (photoProperties.escala || photoProperties.ESCALA)
                        content += `<p><strong>Escala:</strong> ${this.escapeHtml(photoProperties.escala || photoProperties.ESCALA)}</p>`;
                    if (photoProperties.formato || photoProperties.FORMATO)
                        content += `<p><strong>Formato:</strong> ${this.escapeHtml(photoProperties.formato || photoProperties.FORMATO)}</p>`;
                }

                content += `<hr>`;
            }

            content += `<h3>Información del Vuelo</h3>`;

            // Display flight title
            if (flight.title || flight.name) {
                content += `<p><strong>Vuelo:</strong> ${this.escapeHtml(flight.title || flight.name)}</p>`;
            }

            let hasData = false;

            // Display parsed fields from the flight object
            const fields = [
                { key: 'tipoVuelo', label: 'Tipo de Vuelo' },
                { key: 'tipologia', label: 'Tipología' },
                { key: 'color', label: 'Color' },
                { key: 'year', label: 'Año' },
                { key: 'escala', label: 'Escala' },
                { key: 'idVuelo', label: 'ID Vuelo' },
                { key: 'numFotogramas', label: 'Nº Fotogramas' }
            ];

            fields.forEach(({ key, label }) => {
                if (flight[key] && flight[key] !== '') {
                    content += `<p><strong>${label}:</strong> ${this.escapeHtml(String(flight[key]))}</p>`;
                    hasData = true;
                }
            });

            // Show generic Flight EXTRAS
            if (flight.extras && typeof flight.extras === 'object') {
                const extraEntries = Object.entries(flight.extras);
                if (extraEntries.length > 0) {
                    content += `<hr>`;
                    content += `<h4>Información Adicional (Extras)</h4>`;

                    extraEntries.forEach(([key, value]) => {
                        // Filter out 'spatial' and empty values
                        if (value && value !== '' && key.toLowerCase() !== 'spatial') {
                            const label = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                            content += `<p><strong>${this.escapeHtml(label)}:</strong> ${this.escapeHtml(String(value))}</p>`;
                            hasData = true;
                        }
                    });
                    hasData = true;
                }
            }

            if (!hasData) {
                content += `<p style="color: var(--text-muted); font-style: italic;">No hay datos adicionales disponibles</p>`;
            }

            // ADD LINK TO CKAN (Dataset page) FOR FLIGHT
            if (flight && flight.name) {
                // Ensure ID is lowercase and has underscores instead of dashes (using flight.name)
                const normalizeId = (id) => id.toString().replace(/-/, '_').toLowerCase();
                const ckanLink = `https://ws089.juntadeandalucia.es/fototeca/catalogo/dataset/${normalizeId(flight.name)}`;

                content += `<hr>`;
                content += `<p style="text-align: center; margin-top: 10px;">
                    <a href="${ckanLink}" target="_blank" style="color: var(--primary-color); text-decoration: none; font-weight: 500;">
                        🔗 Ver en Catálogo CKAN
                    </a>
                </p>`;
            }
        }

        content += `</div>`;

        // Show popup
        this.showInfoModal(content);
    }

    /**
     * Generate PDF for a layer
     */
    async printLayer(fotogramaId) {
        const flight = this.mapeaController.currentFlight;
        const layer = this.mapeaController.wmsPhotoLayers.get(fotogramaId);

        if (!flight || !layer) {
            alert('Error: No se encontró la información de la capa');
            return;
        }

        try {
            // Show loading state
            const originalText = document.querySelector(`.print-btn[data-fotograma-id="${fotogramaId}"]`).innerHTML;
            const btn = document.querySelector(`.print-btn[data-fotograma-id="${fotogramaId}"]`);
            btn.innerHTML = '...';
            btn.disabled = true;

            // 1. Get Layer Extent and Params
            const extent = layer.getExtent();
            const source = layer.getSource();
            const params = source.getParams();

            // 2. Construct High Quality Image URL
            let baseUrl = flight.pngUrl || source.getUrls()[0];

            // Ensure we use the PNG resource if available, otherwise WMS URL
            const url = new URL(baseUrl);

            // Add/Update WMS parameters
            url.searchParams.set('SERVICE', 'WMS');
            url.searchParams.set('REQUEST', 'GetMap');
            url.searchParams.set('VERSION', params.VERSION || '1.1.1');
            url.searchParams.set('LAYERS', params.LAYERS);
            url.searchParams.set('STYLES', params.STYLES || '');
            url.searchParams.set('FORMAT', 'image/png');
            url.searchParams.set('TRANSPARENT', 'true');
            url.searchParams.set('SRS', 'EPSG:25830'); // Assuming projection, should check
            url.searchParams.set('BBOX', extent.join(','));

            if (params.CQL_FILTER) {
                url.searchParams.set('CQL_FILTER', params.CQL_FILTER);
            }

            // Calculate width/height maintaining aspect ratio (target ~2000px width)
            const widthGeo = extent[2] - extent[0];
            const heightGeo = extent[3] - extent[1];
            const ratio = widthGeo / heightGeo;

            const targetWidth = 2000;
            const targetHeight = Math.round(targetWidth / ratio);

            url.searchParams.set('WIDTH', targetWidth);
            url.searchParams.set('HEIGHT', targetHeight);

            console.log('Generating PDF. Image URL:', url.toString());

            // 3. Fetch Image (handle CORS if possible)
            // Note: If WMS server doesn't support CORS, this might fail or require a proxy
            // We use standard fetch, which requires CORS support on the WMS server
            const response = await fetch(url.toString());
            const blob = await response.blob();
            const reader = new FileReader();

            reader.onloadend = () => {
                const base64data = reader.result;

                // 4. Generate PDF using jsPDF
                const { jsPDF } = window.jspdf;
                const doc = new jsPDF({
                    orientation: ratio > 1 ? 'l' : 'p',
                    unit: 'mm'
                });

                const pageWidth = doc.internal.pageSize.getWidth();
                const pageHeight = doc.internal.pageSize.getHeight();
                const margin = 10;

                // Add Image
                // Calculate dimensions to fit page with margins
                const maxImgWidth = pageWidth - (margin * 2);
                const maxImgHeight = pageHeight - (margin * 2) - 60; // Leave space for text

                let imgWidth = maxImgWidth;
                let imgHeight = imgWidth / ratio;

                if (imgHeight > maxImgHeight) {
                    imgHeight = maxImgHeight;
                    imgWidth = imgHeight * ratio;
                }

                doc.addImage(base64data, 'PNG', margin, margin, imgWidth, imgHeight);

                // Add Text Data
                let yPos = margin + imgHeight + 10;
                doc.setFontSize(14);
                doc.text(`Fotograma: ${fotogramaId}`, margin, yPos);
                yPos += 7;

                doc.setFontSize(10);
                doc.text(`Vuelo: ${flight.title || flight.name}`, margin, yPos);
                yPos += 5;

                if (flight.color) {
                    doc.text(`Color: ${flight.color}`, margin, yPos);
                    yPos += 5;
                }
                if (flight.year) {
                    doc.text(`Año: ${flight.year}`, margin, yPos);
                    yPos += 5;
                }
                if (flight.escala) {
                    doc.text(`Escala: ${flight.escala}`, margin, yPos);
                    yPos += 5;
                }

                // Extras
                if (flight.extras) {
                    const extraKeys = ['municipio', 'provincia', 'fecha'];
                    extraKeys.forEach(key => {
                        if (flight.extras[key]) {
                            const label = key.charAt(0).toUpperCase() + key.slice(1);
                            doc.text(`${label}: ${flight.extras[key]}`, margin, yPos);
                            yPos += 5;
                        }
                    });
                }

                // Save PDF
                doc.save(`fotograma_${fotogramaId}.pdf`);

                // Restore button
                btn.innerHTML = originalText;
                btn.disabled = false;
            };

            reader.readAsDataURL(blob);

        } catch (error) {
            console.error('Error generating PDF:', error);
            // Fallback: If PDF generation fails (likely CORS), open the image in a new tab
            if (confirm('No se pudo generar el PDF autom\u00e1ticamente (posible restricci\u00f3n de seguridad del servidor).\n\n\u00bfDeseas abrir la imagen original para imprimirla desde el navegador?')) {
                window.open(url.toString(), '_blank');
            }

            // Restore button
            const btn = document.querySelector(`.print-btn[data-fotograma-id="${fotogramaId}"]`);
            if (btn) btn.disabled = false;
        }
    }

    /**
     * Show info modal
     */
    showInfoModal(htmlContent) {
        // Create modal overlay
        const overlay = document.createElement('div');
        overlay.className = 'info-modal-overlay';
        overlay.innerHTML = `
            <div class="info-modal-content">
                <button class="info-modal-close">&times;</button>
                ${htmlContent}
            </div>
        `;

        document.body.appendChild(overlay);

        // Close on overlay click or close button
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay || e.target.classList.contains('info-modal-close')) {
                overlay.remove();
            }
        });
    }

    /**
     * Escape HTML to prevent XSS
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * Update download button state based on selections
     */
    updateDownloadButton() {
        const btnDownload = document.getElementById('btnDownloadSelected');
        const countSpan = document.getElementById('downloadSelectedCount');

        if (btnDownload && countSpan) {
            const count = this.selectedLayers.size;
            countSpan.textContent = count;
            btnDownload.disabled = count === 0;
        }
    }

    /**
     * Handle bulk download of selected layers
     */
    async handleDownload() {
        if (this.selectedLayers.size === 0) return;

        const zip = new JSZip();
        const folder = zip.folder("fotogramas");

        let processed = 0;
        const total = this.selectedLayers.size;
        const debugLog = ["=== Bulk Download Log ===", `Total fotogramas: ${total}`, ""];

        // Update button state
        const btnDownload = document.getElementById('btnDownloadSelected');
        const originalText = btnDownload.innerHTML;

        btnDownload.disabled = true;
        btnDownload.innerHTML = `<span>Consultando CKAN...</span>`;

        const format = document.querySelector('input[name="downloadFormat"]:checked')?.value || 'jp2';
        console.log(`Starting bulk download with format: ${format}`);

        const promises = [];

        for (const fotogramaId of this.selectedLayers) {
            debugLog.push(`\n--- Fotograma: ${fotogramaId} ---`);
            console.log(`🔍 Processing fotogramaId: "${fotogramaId}"`);

            // Fetch package data from CKAN API
            btnDownload.innerHTML = `<span>Consultando ${fotogramaId}...</span>`;
            const packageData = await this.ckanService.fetchPackageById(fotogramaId);

            if (!packageData) {
                const msg = `❌ SKIPPED ${fotogramaId}: Error fetching from CKAN`;
                console.warn(msg);
                debugLog.push(msg);
                processed++;
                continue;
            }

            debugLog.push(`CKAN ID: ${packageData.id}`);
            debugLog.push(`Package name: ${packageData.name}`);

            let url = null;
            let finalUrl = null;

            if (format === 'jp2') {
                // Try to find JP2 resource
                const jp2Resource = packageData.resources.find(r => 
                    (r.mimetype && (r.mimetype === 'JPEG20000' || r.mimetype.includes('jpeg') || r.mimetype.includes('jp2'))) ||
                    (r.format && (r.format === 'JPEG20000' || r.format.toLowerCase().includes('jpeg') || r.format.toLowerCase().includes('jp2')))
                );
                
                if (jp2Resource) {
                    url = jp2Resource.url;
                    debugLog.push(`Found JP2 resource: ${jp2Resource.name}`);
                } else if (packageData.downloadUrl) {
                     // Fallback to whatever fetchPackageById found (usually JP2)
                    url = packageData.downloadUrl;
                    debugLog.push(`Using default download URL (likely JP2)`);
                } else {
                    debugLog.push(`❌ No JP2 resource found`);
                }
            } else if (format === 'png') {
                // Try to find PNG resource
                const pngResource = packageData.resources.find(r => 
                    (r.mimetype && r.mimetype.includes('png')) ||
                    (r.format && r.format.toLowerCase().includes('png'))
                );

                if (pngResource) {
                    url = pngResource.url;
                    debugLog.push(`Found PNG resource: ${pngResource.name}`);
                } else {
                    // Fallback to WMS GetMap
                    debugLog.push(`⚠️ No PNG resource found. Attempting WMS generation...`);
                    
                    const layer = this.mapeaController.wmsPhotoLayers.get(fotogramaId);
                    if (layer) {
                        try {
                            const extent = layer.getExtent();
                            const source = layer.getSource();
                            const params = source.getParams();
                            
                            // Get base URL for WMS
                            // Try to find a WMS resource in packageData first
                            const wmsResource = packageData.resources.find(r => r.mimetype === 'WMS' || r.format === 'WMS');
                            const wmsBaseUrl = wmsResource ? wmsResource.url.split('?')[0] : (packageData.wfsUrl || source.getUrls()[0]);

                            const wmsUrl = new URL(wmsBaseUrl);
                            
                            wmsUrl.searchParams.set('SERVICE', 'WMS');
                            wmsUrl.searchParams.set('REQUEST', 'GetMap');
                            wmsUrl.searchParams.set('VERSION', params.VERSION || '1.1.1');
                            wmsUrl.searchParams.set('LAYERS', params.LAYERS);
                            wmsUrl.searchParams.set('STYLES', params.STYLES || '');
                            wmsUrl.searchParams.set('FORMAT', 'image/png');
                            wmsUrl.searchParams.set('TRANSPARENT', 'true');
                            wmsUrl.searchParams.set('SRS', 'EPSG:25830'); // Using projection from current map/layer context
                            wmsUrl.searchParams.set('BBOX', extent.join(','));
                            
                            if (params.CQL_FILTER) {
                                wmsUrl.searchParams.set('CQL_FILTER', params.CQL_FILTER);
                            }

                            // Calculate dimensions for good quality
                            const widthGeo = extent[2] - extent[0];
                            const heightGeo = extent[3] - extent[1];
                            const ratio = widthGeo / heightGeo;
                            const targetWidth = 2000;
                            const targetHeight = Math.round(targetWidth / ratio);

                            wmsUrl.searchParams.set('WIDTH', targetWidth);
                            wmsUrl.searchParams.set('HEIGHT', targetHeight);
                            
                            url = wmsUrl.toString();
                            debugLog.push(`Generated WMS URL for PNG`);
                        } catch (e) {
                            debugLog.push(`❌ Error generating WMS URL: ${e.message}`);
                        }
                    } else {
                        debugLog.push(`❌ Layer not active in map controller, cannot generate WMS URL`);
                    }
                }
            }

            if (!url) {
                const msg = `❌ SKIPPED ${fotogramaId}: Could not determine URL for format ${format}`;
                console.warn(msg);
                debugLog.push(msg);
                processed++;
                continue;
            }

            debugLog.push(`Download URL: ${url}`);
            btnDownload.innerHTML = `<span>Descargando ${processed + 1}/${total}...</span>`;

            const p = fetch(url)
                .then(resp => {
                    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
                    return resp.blob();
                })
                .then(blob => {
                    // Determine filename
                    let ext = format === 'png' ? 'png' : 'jp2';
                    // Should sanitize ID
                    const safeId = fotogramaId.replace(/[^a-zA-Z0-9_-]/g, '_');
                    const filename = `${safeId}.${ext}`;
                    
                    folder.file(filename, blob);
                    debugLog.push(`✅ Downloaded: ${filename} (${blob.size} bytes)`);
                })
                .catch(err => {
                    console.error(`Failed to download ${fotogramaId}`, err);
                    folder.file(`${fotogramaId}_error.txt`, `Error descargando de: ${url}\n${err.message}`);
                    debugLog.push(`❌ ERROR: ${err.message}`);
                })
                .finally(() => {
                    processed++;
                });

            promises.push(p);
        }

        await Promise.all(promises);

        // Add debug log
        debugLog.push(`\n=== Summary ===`);
        debugLog.push(`Total processed: ${processed}/${total}`);
        zip.file("debug_download.txt", debugLog.join('\n'));

        btnDownload.innerHTML = `<span>Generando ZIP...</span>`;

        try {
            const content = await zip.generateAsync({ type: "blob" });
            saveAs(content, `fotogramas_seleccionados.zip`);
            console.log('✅ ZIP generated and download triggered');
        } catch (err) {
            console.error("❌ Zip generation failed", err);
            alert("Error generando el archivo ZIP: " + err.message);
        } finally {
            btnDownload.innerHTML = originalText;
            this.updateDownloadButton();
        }
    }
}
