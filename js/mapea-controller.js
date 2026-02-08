// MAPEA Controller - Manages the MAPEA4 map and WFS layers
class MAPEAController {
    constructor() {
        this.map = null;
        this.centroidsLayer = null;
        this.footprintsLayer = null;
        this.wmsPhotoLayers = new Map();  // Map of fotogramaId -> layer for multiple photos
        this.hoveredFootprintLayer = null;  // Temporary footprint shown on hover
        this.currentFlight = null;
        this.hoveredFeature = null;
        this.onFeatureClickCallback = null;
        this.tooltip = null;
    }

    /**
     * Initialize MAPEA4 map
     */
    initialize() {
        try {


            const ortofoto2022_color = new M.layer.WMS({
                url: 'https://www.ideandalucia.es/wms/ortofoto_2022?',
                name: 'ortofotografia_2022_rgb',
                legend: 'Ortofotografía Color 0,25 metros/pixel (Año 2022)',
                transparent: false,
                tiled: true
            }, {
                styles: 'default'
            })

            ortofoto2022_color.setLegendURL('https://www.ideandalucia.es/visor/leyendas/ortofoto2022_color.png')

            const ortofoto2022_pancromatico = new M.layer.WMS({
                url: 'https://www.ideandalucia.es/wms/ortofoto_2022?',
                name: 'ortofotografia_2022_pancromatico',
                legend: 'Ortofotografía Pancromática 0,25 metros/pixel (Año 2022)',
                transparent: false,
                tiled: true
            }, {
                styles: 'default'
            })

            ortofoto2022_pancromatico.setLegendURL('https://www.ideandalucia.es/visor/leyendas/ortofoto2022_pancromatico.png');

            const ortofoto2022_infrarrojo = new M.layer.WMS({
                url: 'https://www.ideandalucia.es/wms/ortofoto_2022?',
                name: 'ortofotografia_2022_infrarrojo',
                legend: 'Ortofotografía Infrarrojo 0,25 metros/pixel (Año 2022)',
                transparent: false,
                tiled: true
            }, {
                styles: 'default'
            })

            ortofoto2022_infrarrojo.setLegendURL('https://www.ideandalucia.es/visor/leyendas/ortofoto2022_infrarrojo.png');


            const mdt_siose2013 = new M.layer.WMS({
                url: 'https://www.ideandalucia.es/wms/siose_2013?',
                name: 'sombreado_siose_2013',
                legend: 'Siose + MDT 2013',
                transparent: false,
                tiled: true
            }, {
                styles: 'default'
            })

            mdt_siose2013.setLegendURL('https://www.ideandalucia.es/visor/leyendas/siose_2013.png');

            const mdt_2016 = new M.layer.WMS({
                url: 'https://www.ideandalucia.es/wms/mdt_2016?',
                name: 'sombreado_orografico_2016,modelo_digital_terreno_2016_color',
                legend: 'MDT 2016',
                transparent: false,
                tiled: true
            }, {
                styles: 'default'
            })

            mdt_2016.setLegendURL('https://www.ideandalucia.es/visor/leyendas/mdt_2016_tintas_hipsometricas.png');

            const CDAU_Base = new M.layer.WMS({
                url: 'https://www.callejerodeandalucia.es/servicios/base/wms?',
                name: 'CDAU_base',
                legend: 'Base Cartográfica Callejero Digital de Andalucía',
                transparent: false,
                tiled: true
            })

            CDAU_Base.setLegendURL('https://www.ideandalucia.es/visor/leyendas/cdau_base.png');

            const MapaAndalucia = new M.layer.WMS({
                url: 'https://www.ideandalucia.es/services/andalucia/wms?',
                name: '00_Mapa_Andalucia',
                legend: 'Mapa Topográfico de Andalucía',
                transparent: false,
                tiled: true
            })

            this.map = M.map({
                container: CONFIG.MAPEA.CONTAINER,
                layers: [CDAU_Base, ortofoto2022_color,
                    ortofoto2022_pancromatico,
                    ortofoto2022_infrarrojo,
                    mdt_siose2013,
                    mdt_2016,
                    MapaAndalucia],
                maxExtent: [100401, 3987100, 621273, 4288700],
                projection: 'EPSG:25830*m',
                controls: ['scale', 'mouse']
            });

            // Zoom control hidden via CSS (.ol-zoom { display: none !important; })
            //, 'layerSwitcher''Scale',

            // Disable simple selector to avoid conflict/redundancy if BackImgLayer is used
            /* const mp = new M.plugin.Simplebaselayerselector({ position: 'TR' });
            this.map.addPlugin(mp); */

            // BackImgLayer Integration (User Request)
            // BackImgLayer Integration (User Request)
            // BackImgLayer Integration (User Request)
            // Using 'layerOpts' to pass existing WMS layer instances directly
            // This bypasses the plugin's string parser which forces WMTS
            const backImg = new M.plugin.BackImgLayer({
                position: 'TR',
                collapsed: true,
                collapsible: true,
                layerVisibility: true,
                layerId: 0,
                columnsNumber: 4,
                layerOpts: [
                    {
                        id: 'CDAU_base',
                        title: 'Callejero',
                        preview: 'https://www.ideandalucia.es/visor/leyendas/cdau_base.png',
                        layers: [CDAU_Base]
                    },
                    {
                        id: 'ortofotografia_2022_rgb',
                        title: 'Ortofoto RGB',
                        preview: 'https://www.ideandalucia.es/visor/leyendas/ortofoto2016_color.png',
                        layers: [ortofoto2022_color]
                    },
                    {
                        id: 'ortofotografia_2022_pancromatico',
                        title: 'Ortofoto Pan',
                        preview: 'https://www.ideandalucia.es/visor/leyendas/ortofoto2016_pancromatico.png',
                        layers: [ortofoto2022_pancromatico]
                    },
                    {
                        id: 'ortofotografia_2022_infrarrojo',
                        title: 'Ortofoto IR',
                        preview: 'https://www.ideandalucia.es/visor/leyendas/ortofoto2016_infrarrojo.png',
                        layers: [ortofoto2022_infrarrojo]
                    },
                    {
                        id: 'sombreado_siose_2013',
                        title: 'SIOSE',
                        preview: 'https://www.ideandalucia.es/visor/leyendas/siose_2013.png',
                        layers: [mdt_siose2013]
                    },
                    {
                        id: 'sombreado_orografico_2016',
                        title: 'MDT',
                        preview: 'https://www.ideandalucia.es/visor/leyendas/mdt_2016_tintas_hipsometricas.png',
                        layers: [mdt_2016]
                    },
                    {
                        id: '00_Mapa_Andalucia',
                        title: 'Mapa Andalucía',
                        preview: 'https://www.ideandalucia.es/visor/leyendas/cdau_base.png',
                        layers: [MapaAndalucia]
                    }
                ]
            });
            this.map.addPlugin(backImg);
            console.log('✅ BackImgLayer plugin configured and added');

            const cat = new M.plugin.CatastroSearch();
            this.map.addPlugin(cat);
            const search = new M.plugin.SearchPanel();
            this.map.addPlugin(search);

            const measure = new M.plugin.Measurebar();
            this.map.addPlugin(measure);

            cat.on(M.evt.ADDED_TO_MAP, () => {
                console.log('✅ CatastroSearch ADDED_TO_MAP event fired');

            });
            /* mp.on(M.evt.ADDED_TO_MAP, () => {
                console.log('se cargo el plugin')
            }) */


            this.setupBulkDownloadControls(); // Initialize bulk download UI

            console.log('MAPEA4 map initialized successfully');
            return true;
        } catch (error) {
            console.error('Error initializing MAPEA4 map:', error);
            return false;
        }
    }

    /**
     * Load WFS layers for a flight
     */
    async loadFlightLayers(flight) {
        try {
            // Clear existing layers
            this.clearLayers();

            this.currentFlight = flight;
            console.log('✈️ Loading Flight:', flight.name);
            console.log('   - Download URL:', flight.downloadUrl);
            console.log('   - Resources:', flight.resources);

            if (!flight.wfsUrl) {
                console.warn('No WFS URL available for flight:', flight.name);
                return false;
            }

            // Load centroids layer
            await this.loadCentroidsLayer(flight);

            // Don't load footprints layer automatically
            // Footprints will be shown only on hover over centroids
            // await this.loadFootprintsLayer(flight);

            // Setup interaction handlers
            console.log('Loaded WFS layers for flight:', flight.name);
            return true;
        } catch (error) {
            console.error('Error loading flight layers:', error);
            return false;
        }
    }

    /**
     * Load centroids WFS layer
     */
    async loadCentroidsLayer(flight) {
        try {
            const centroidUrl = flight.centroidUrl;

            if (!centroidUrl) {
                console.warn('No centroid URL for flight:', flight.name);
                return;
            }

            // Fetch GeoJSON data
            const response = await fetch(centroidUrl);
            const geojsonData = await response.json();

            // Create GeoJSON layer
            this.centroidLayer = new M.layer.GeoJSON({
                name: 'centroides',
                source: geojsonData,
                extract: false
            });

            // Style the centroids
            const style = new M.style.Point({
                radius: 6,
                fill: {
                    color: '#3b82f6',
                    opacity: 0.8
                },
                stroke: {
                    color: '#ffffff',
                    width: 2
                }
            });

            this.centroidLayer.setStyle(style);
            this.map.addLayers(this.centroidLayer);

            // Force high z-index for centroids
            try {
                const olLayer = this.centroidLayer.getImpl().getOL3Layer();
                olLayer.setZIndex(9999);
            } catch (e) { console.warn('Cannot set z-index', e); }

            // Setup hover event handler (includes click handler)
            this.setupHoverHandler();

            // Zoom to layer extent (delay to ensure extent is calculated)
            setTimeout(() => {
                this.zoomToLayer(this.centroidLayer);
            }, 300);

        } catch (error) {
            console.error('Error loading centroids layer:', error);
        }
    }

    /**
     * Load footprints WFS layer
     */
    async loadFootprintsLayer(flight) {
        try {
            const footprintUrl = flight.footprintUrl;

            if (!footprintUrl) {
                console.warn('No footprint URL for flight:', flight.name);
                return;
            }

            // Fetch GeoJSON data
            const response = await fetch(footprintUrl);
            const geojsonData = await response.json();

            // Create GeoJSON layer
            this.footprintLayer = new M.layer.GeoJSON({
                name: 'huellas',
                source: geojsonData,
                extract: false
            });

            // Style the footprints
            const style = new M.style.Polygon({
                fill: {
                    color: '#f59e0b',
                    opacity: 0.1
                },
                stroke: {
                    color: '#f59e0b',
                    width: 1,
                    opacity: 0.3
                }
            });

            this.footprintLayer.setStyle(style);
            this.map.addLayers(this.footprintLayer);

            // Setup hover handler
            this.setupHoverHandler();

        } catch (error) {
            console.error('Error loading footprints layer:', error);
        }
    }

    // REMOVED: setupClickHandler() - Redundant, click handler is in setupHoverHandler()

    /**
     * Setup hover handler for showing info tooltip
     */
    /**
     * Setup hover handler for showing info tooltip
     */
    setupHoverHandler() {
        const olMap = this.map.getMapImpl();

        // Create tooltip element if it doesn't exist
        if (!this.tooltip) {
            this.tooltip = document.createElement('div');
            this.tooltip.className = 'map-tooltip';
            this.tooltip.style.cssText = `
                position: absolute;
                background: rgba(30, 41, 59, 0.95);
                backdrop-filter: blur(8px);
                border: 1px solid #334155;
                border-radius: 0.5rem;
                padding: 0.75rem;
                color: #f1f5f9;
                font-size: 0.8rem;
                pointer-events: none;
                z-index: 1000;
                display: none;
                box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.5);
                max-width: 350px;
                line-height: 1.4;
            `;
            document.body.appendChild(this.tooltip);
        }

        // REMOVE PREVIOUS LISTENERS to prevent duplicates when switching flights
        if (this.pointerMoveListener) {
            olMap.un('pointermove', this.pointerMoveListener);
        }
        if (this.clickListener) {
            olMap.un('click', this.clickListener);
        }

        // Define pointer move listener
        this.pointerMoveListener = (evt) => {
            if (evt.dragging) {
                this.tooltip.style.display = 'none';
                return;
            }

            const pixel = olMap.getEventPixel(evt.originalEvent);

            let foundFeature = null;

            olMap.forEachFeatureAtPixel(pixel, (feature, layer) => {
                foundFeature = feature;
                return feature; // Stop iteration
            }, {
                hitTolerance: 5 // Increase tolerance slightly
            });

            const feature = foundFeature;

            // Reset previous hover
            if (this.hoveredFeature && this.hoveredFeature !== feature) {
                this.resetFeatureStyle(this.hoveredFeature);
                // Remove previous footprint highlight
                if (this.hoveredFootprintLayer) {
                    const olMap = this.map.getMapImpl();
                    olMap.removeLayer(this.hoveredFootprintLayer);
                    this.hoveredFootprintLayer = null;
                }
            }

            // Show tooltip and highlight feature
            if (feature) {
                const properties = feature.getProperties();

                // Show footprint for this specific centroid
                this.showFootprintForFeature(feature);

                // Highlight centroid
                this.highlightFeature(feature);
                this.hoveredFeature = feature;
                olMap.getTargetElement().style.cursor = 'pointer';

                // Show tooltip with info
                this.showTooltip(evt.originalEvent, properties);
            } else {
                this.hoveredFeature = null;
                olMap.getTargetElement().style.cursor = '';
                this.tooltip.style.display = 'none';

                if (this.hoveredFootprintLayer) {
                    const olMap = this.map.getMapImpl();
                    olMap.removeLayer(this.hoveredFootprintLayer);
                    this.hoveredFootprintLayer = null;
                }
            }
        };

        // Define click listener
        this.clickListener = (evt) => {
            const pixel = olMap.getEventPixel(evt.originalEvent);
            const feature = olMap.forEachFeatureAtPixel(pixel, (feature) => {
                // Ignore Footprints (Polygons), only pick Centroids (Points)
                const geometry = feature.getGeometry();
                if (geometry && geometry.getType() === 'Point') {
                    return feature;
                }
                return null;
            }, {
                hitTolerance: 5
            });

            if (feature && this.onFeatureClickCallback) {
                const properties = feature.getProperties();
                this.onFeatureClickCallback(properties);
            }
        };

        // Add listeners
        olMap.on('pointermove', this.pointerMoveListener);
        olMap.on('click', this.clickListener);
    }

    /**
     * Show tooltip with feature information
     */
    showTooltip(event, properties) {
        let content = '';

        // Iterate over all properties to ensure we don't miss anything
        // excluding geometry and internal OpenLayers keys
        for (const [key, value] of Object.entries(properties)) {
            if (key === 'geometry' || key === 'bbox' || typeof value === 'object') {
                continue;
            }

            // Format key for display (capitalize first letter, replace underscores)
            let label = key.replace(/_/g, ' ');
            label = label.charAt(0).toUpperCase() + label.slice(1);

            // Specific formatting for known keys if needed (optional)
            if (key.toLowerCase().includes('fotogra') || key.toLowerCase() === 'fichero') label = 'Fotograma';
            if (key.toLowerCase() === 'hoja_mtn50') label = 'Hoja MTN50';

            content += `<strong>${label}:</strong> ${value}<br>`;
        }

        if (!content) {
            content = '<em>No data available</em>';
            console.log('Hover properties (empty content):', properties);
        }

        this.tooltip.innerHTML = content;
        this.tooltip.style.display = 'block';
        this.tooltip.style.left = (event.pageX + 15) + 'px';
        this.tooltip.style.top = (event.pageY + 15) + 'px';
    }

    /**
     * Set up UI controls for bulk download
     */
    setupBulkDownloadControls() {
        const btnToggle = document.getElementById('btnToggleSelection');
        const btnDownload = document.getElementById('btnDownloadSelection');

        if (btnToggle) btnToggle.addEventListener('click', this.toggleSelectionMode);
        if (btnDownload) btnDownload.addEventListener('click', this.handleDownload);
    }

    /**
     * Toggle selection mode
     */
    toggleSelectionMode() {
        this.isSelectionMode = !this.isSelectionMode;

        const btnToggle = document.getElementById('btnToggleSelection');
        if (btnToggle) {
            if (this.isSelectionMode) {
                btnToggle.classList.add('active');
                btnToggle.querySelector('span').textContent = 'Finalizar Selección';
                this.map.getMapImpl().getTargetElement().style.cursor = 'crosshair';
            } else {
                btnToggle.classList.remove('active');
                btnToggle.querySelector('span').textContent = 'Seleccionar';
                this.map.getMapImpl().getTargetElement().style.cursor = '';
            }
        }
    }

    /**
     * Handle click on a feature (centroid)
     */
    handleFeatureClick(feature) {
        if (!feature) return;

        // If in normal mode, just show standard photo viewer
        if (!this.isSelectionMode) {
            if (this.onFeatureClickCallback) {
                this.onFeatureClickCallback(feature.getProperties());
            }
            return;
        }

        // If in Selection Mode, toggle selection
        const props = feature.getProperties();
        const id = props.id_fotogra || props.id;

        if (this.selectedFeatures.has(id)) {
            // Deselect
            this.selectedFeatures.delete(id);
            this.selectedFeatureData.delete(id);
            this.updateFeatureStyle(feature, false);
        } else {
            // Select
            this.selectedFeatures.add(id);
            this.selectedFeatureData.set(id, {
                downloadUrl: this.currentFlight ? this.currentFlight.downloadUrl : null,
                properties: props
            });
            this.updateFeatureStyle(feature, true);
        }

        this.updateDownloadUI();
    }

    /**
     * Update feature style based on selection
     */
    updateFeatureStyle(feature, isSelected) {
        if (!feature) return;
        if (isSelected) {
            const selectedStyle = new ol.style.Style({
                image: new ol.style.Circle({
                    radius: 8,
                    fill: new ol.style.Fill({
                        color: 'rgba(255, 215, 0, 0.8)' // Gold
                    }),
                    stroke: new ol.style.Stroke({
                        color: '#ff0000', // Red border
                        width: 2
                    })
                })
            });
            feature.setStyle(selectedStyle);
        } else {
            // Revert to null (layer default)
            feature.setStyle(null);
        }
    }

    /**
     * Update Download Button UI
     */
    updateDownloadUI() {
        const btnDownload = document.getElementById('btnDownloadSelection');
        const countSpan = document.getElementById('downloadCount');

        if (btnDownload && countSpan) {
            const count = this.selectedFeatures.size;
            countSpan.textContent = count;

            if (count > 0) {
                btnDownload.disabled = false;
                btnDownload.classList.remove('hidden'); // Ensure visible
                btnDownload.style.opacity = '1';
            } else {
                btnDownload.disabled = true;
                btnDownload.classList.remove('hidden'); // Always visible!
            }
        }
    }

    /**
     * Handle Bulk Download
     */
    async handleDownload() {
        if (this.selectedFeatures.size === 0) return;

        const zip = new JSZip();
        // Create folder for images
        const folder = zip.folder("fotogramas");

        let processed = 0;
        const total = this.selectedFeatures.size;
        const debugLog = ["--- Log de descarga ---"];

        // Show loading state
        const btnDownload = document.getElementById('btnDownloadSelection');
        const originalText = btnDownload.innerHTML;
        const countSpan = document.getElementById('downloadCount');

        if (countSpan) countSpan.textContent = `0/${total}`;

        btnDownload.disabled = true;
        btnDownload.classList.add('processing');

        const promises = [];

        this.selectedFeatureData.forEach((data, id) => {
            const props = data.properties;

            // 1. Try direct URL properties
            let url = props.url || props.enlace || props.url_img || props.url_larga || props.URL;

            // 2. If no direct URL, use the Flight Download URL (JPEG2000 Resource)
            if (!url && data.downloadUrl) {
                // Ensure base URL ends with slash
                const baseUrl = data.downloadUrl.endsWith('/') ? data.downloadUrl : data.downloadUrl + '/';

                // Determine filename (use property or Feature ID)
                // If it's a JPEG2000 resource, extension is likely .jp2 or .ecw
                const filename = props.fichero || props.FICHERO || props.filename || `${id}.jp2`;

                url = baseUrl + filename;
            }

            if (!url) {
                const msg = `⚠️ SKIPPED ${id}: No se encontró URL. Props: ${Object.keys(props).join(', ')}`;
                console.warn(msg);
                debugLog.push(msg);

                processed++;
                if (countSpan) countSpan.textContent = `${processed}/${total}`;
                return;
            }

            // Determine output filename for the ZIP
            // Try to keep original extension if present in URL
            let outputFilename = `${id}.jpg`; // Default
            if (props.fichero) outputFilename = props.fichero;
            else if (url.split('/').pop().includes('.')) outputFilename = url.split('/').pop();

            debugLog.push(`Downloading ${id} from: ${url}`);

            const p = fetch(url)
                .then(resp => {
                    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
                    return resp.blob();
                })
                .then(blob => {
                    folder.file(outputFilename, blob);
                    debugLog.push(`✅ OK: ${outputFilename} (${blob.size} bytes)`);
                })
                .catch(err => {
                    console.error(`Failed to download ${id}`, err);
                    folder.file(`${id}_error.txt`, `Error descargando de: ${url}\n${err.message}`);
                    debugLog.push(`❌ ERROR ${id}: ${err.message}`);
                })
                .finally(() => {
                    processed++;
                    if (countSpan) countSpan.textContent = `${processed}/${total}`;
                });

            promises.push(p);
        });

        // Wait for all downloads
        await Promise.all(promises);

        // Add the log to the ZIP
        zip.file("debug_download.txt", debugLog.join('\n'));

        if (countSpan) countSpan.textContent = "ZIP...";

        try {
            const content = await zip.generateAsync({ type: "blob" });
            saveAs(content, `fotogramas_seleccionados.zip`);
            console.log('ZIP generated and download triggered');
        } catch (err) {
            console.error("Zip generation failed", err);
            alert("Error generando el archivo ZIP: " + err.message);
        } finally {
            btnDownload.innerHTML = originalText;
            btnDownload.disabled = false;
            btnDownload.classList.remove('processing');
            this.updateDownloadUI();
        }
    }

    /**
     * Show footprint polygon for a specific centroid feature on hover
     */
    async showFootprintForFeature(feature) {
        const olMap = this.map.getMapImpl();

        // Get fotograma ID from feature properties
        const properties = feature.getProperties();
        const fotogramaId = properties.fotogramas ||
            properties.id_fotogra ||
            properties.FOTOGRAMAS ||
            properties.ID_FOTOGRA;

        // Use cached data if available, otherwise fetch it (fallback)
        if (!this.currentFlight) return;

        let geojsonData = this.currentFlight.footprintData;

        // If not cached yet, fetch it (prevent multiple fetches if one is in progress?)
        if (!geojsonData && this.currentFlight.footprintUrl) {
            try {
                const response = await fetch(this.currentFlight.footprintUrl);
                geojsonData = await response.json();
                this.currentFlight.footprintData = geojsonData; // Cache it
            } catch (e) {
                console.error('Error fetching footprint:', e);
                return;
            }
        }

        if (!geojsonData) return;

        // RACE CONDITION CHECK:
        // By the time we get here (after await), the user might have moved the mouse.
        // If the currently hovered feature is NOT the one we started with, ABORT.
        if (this.hoveredFeature !== feature) {
            console.log('🛑 Aborting footprint show: Mouse moved to another feature (or none).');
            return;
        }

        // DOUBLE CHECK: If we are not hovering anything anymore, abort
        if (!this.hoveredFeature) {
            console.log('🛑 Aborting footprint show: Mouse left the map or feature.');
            return;
        }

        try {
            // Normalize IDs for comparison
            const normalizedId = fotogramaId.toString().replace(/-/, '_');
            const normalizedIdDash = fotogramaId.toString().replace(/_/g, '-');

            // Find the footprint feature with matching fotograma ID
            const footprintFeature = geojsonData.features.find(f => {
                const fId = f.properties.fotogramas || f.properties.id_fotogra || f.properties.FOTOGRAMAS;
                return fId === fotogramaId ||
                    fId === normalizedId ||
                    fId === normalizedIdDash;
            });

            if (!footprintFeature) {
                return;
            }

            // Parse the footprint geometry
            const format = new ol.format.GeoJSON();
            const olFeature = format.readFeature(footprintFeature, {
                dataProjection: 'EPSG:4326',
                featureProjection: 'EPSG:25830'
            });

            // Style the footprint - HOLLOW AS REQUESTED
            const footprintStyle = new ol.style.Style({
                fill: new ol.style.Fill({
                    color: 'rgba(0, 0, 0, 0)'  // Fully Transparent
                }),
                stroke: new ol.style.Stroke({
                    color: '#f59e0b',
                    width: 2
                })
            });

            olFeature.setStyle(footprintStyle);

            // Create a vector layer for the footprint
            const vectorSource = new ol.source.Vector({
                features: [olFeature]
            });

            // Clean up any existing layer just in case
            if (this.hoveredFootprintLayer) {
                olMap.removeLayer(this.hoveredFootprintLayer);
            }

            this.hoveredFootprintLayer = new ol.layer.Vector({
                source: vectorSource,
                zIndex: 999  // Below photo layer but above base layers
            });

            olMap.addLayer(this.hoveredFootprintLayer);

        } catch (error) {
            console.error('Error loading footprint for hover:', error);
        }
    }

    /**
     * Reset feature style
     */
    resetFeatureStyle(feature) {
        if (!feature) return;
        const props = feature.getProperties();
        const id = props.id_fotogra || props.id;

        if (this.isSelectionMode && this.selectedFeatures.has(id)) {
            // Restore selected style
            this.updateFeatureStyle(feature, true);
        } else {
            feature.setStyle(null);
        }
    }

    /**
     * Highlight a feature (centroid)
     */
    highlightFeature(feature) {
        const olFeature = feature;
        if (!olFeature) return;

        // If selected in selection mode, don't override with hover style
        // Or maybe mix them? For now, let's keep selected style dominant.
        const props = feature.getProperties();
        const id = props.id_fotogra || props.id;
        if (this.isSelectionMode && this.selectedFeatures.has(id)) {
            return;
        }

        const style = new ol.style.Style({
            image: new ol.style.Circle({
                radius: 8,
                fill: new ol.style.Fill({ color: '#ef4444' }),
                stroke: new ol.style.Stroke({ color: '#ffffff', width: 2 })
            })
        });

        olFeature.setStyle(style);
    }

    /**
     * Zoom to layer extent
     */
    zoomToLayer(layer) {
        try {
            const olLayer = layer.getImpl().getOL3Layer();
            const source = olLayer.getSource();
            const extent = source.getExtent();

            if (extent && extent.every(val => isFinite(val))) {
                const olMap = this.map.getMapImpl();
                olMap.getView().fit(extent, {
                    padding: [50, 50, 50, 50],
                    duration: 500
                });
            }
        } catch (error) {
            console.error('Error zooming to layer:', error);
        }
    }

    /**
     * Clear all WFS layers
     */
    clearLayers() {
        if (this.centroidLayer) {
            this.map.removeLayers(this.centroidLayer);
            this.centroidLayer = null;
        }

        if (this.footprintLayer) {
            this.map.removeLayers(this.footprintLayer);
            this.footprintLayer = null;
        }

        // Clear WMS photograph layer
        if (this.wmsPhotoLayer) {
            this.map.removeLayers(this.wmsPhotoLayer);
            this.wmsPhotoLayer = null;
        }

        this.currentFlight = null;
        this.hoveredFeature = null;

        // Hide tooltip
        if (this.tooltip) {
            this.tooltip.style.display = 'none';
        }
    }

    /**
     * Load WMS layer for a specific photograph using PNG resource URL or WMS with filter
     */
    async loadPhotoWMS(photoProperties) {
        try {
            if (!this.currentFlight) {
                console.warn('No current flight selected');
                return false;
            }

            console.log('Loading WMS for photo properties:', photoProperties);

            // Find the fotograma ID - MUST use id_fotogra from WFS
            const fotogramaId = photoProperties.id_fotogra ||
                photoProperties.ID_FOTOGRA ||
                photoProperties.fotogramas ||
                photoProperties.FOTOGRAMAS;

            if (!fotogramaId) {
                console.warn('No fotograma ID found in properties:', photoProperties);
                return false;
            }

            console.log('✅ Using fotogramaId:', fotogramaId, 'from field:',
                photoProperties.id_fotogra ? 'id_fotogra' :
                    photoProperties.ID_FOTOGRA ? 'ID_FOTOGRA' :
                        photoProperties.fotogramas ? 'fotogramas' : 'FOTOGRAMAS');

            console.log('Looking for fotograma ID:', fotogramaId);
            console.log('Current loaded layers:', Array.from(this.wmsPhotoLayers.keys()));
            console.log('Is this layer already loaded?', this.wmsPhotoLayers.has(fotogramaId));

            // Add loading flag to prevent duplicates
            // Ensure loadingPhotoWMS is initialized
            this.loadingPhotoWMS = this.loadingPhotoWMS || {};
            if (this.loadingPhotoWMS[fotogramaId]) {
                console.log(`⏳ Already loading WMS for ${fotogramaId}. Aborting duplicate request.`);
                return false;
            }
            this.loadingPhotoWMS[fotogramaId] = true;

            // INDEPENDENT TOGGLE: Check if this photo is already loaded
            if (this.wmsPhotoLayers.has(fotogramaId)) {
                console.log('🔄 Toggling photo layer:', fotogramaId);
                const existingLayer = this.wmsPhotoLayers.get(fotogramaId);

                // Get toggle mode from ActiveLayersUI
                let isRemoveMode = false;
                if (window.app && window.app.activeLayersUI) {
                    isRemoveMode = window.app.activeLayersUI.isRemoveMode;
                }

                if (isRemoveMode) {
                    // MODE 1: REMOVE COMPLETELY
                    console.log('  🗑️ REMOVE MODE: Removing layer completely');
                    const olMap = this.map.getMapImpl();
                    olMap.removeLayer(existingLayer);
                    this.wmsPhotoLayers.delete(fotogramaId);
                } else {
                    // MODE 2: VISIBILITY TOGGLE (Default)
                    console.log('  👁️ HIDE MODE: Toggling visibility');
                    const currentVisibility = existingLayer.getVisible();
                    existingLayer.setVisible(!currentVisibility);
                    console.log(`  Visibility changed: ${currentVisibility} → ${!currentVisibility}`);
                }

                // Update active layers UI
                if (window.app && window.app.activeLayersUI) {
                    window.app.activeLayersUI.updateLayersList();
                }

                // Clear loading flag
                delete this.loadingPhotoWMS[fotogramaId];

                return true;
            }

            // FETCH FOTOGRAMA PACKAGE FROM CKAN
            console.log('📦 Fetching fotograma package from CKAN...');
            const ckanService = new CKANService();
            const fotogramaPackage = await ckanService.fetchPackageById(fotogramaId);

            if (!fotogramaPackage || !fotogramaPackage.resources) {
                console.error('❌ Could not fetch fotograma package from CKAN');
                return false;
            }

            console.log('✅ Fotograma package received:', fotogramaPackage.name);
            console.log('📋 Resources:', fotogramaPackage.resources.length);

            // Find PNG resource - just look for mimetype 'png'
            const pngResource = fotogramaPackage.resources.find(r =>
                r.mimetype === 'png' ||
                (r.mimetype && r.mimetype.toLowerCase().includes('png')) ||
                (r.format && r.format.toLowerCase() === 'png')
            );

            if (!pngResource || !pngResource.url) {
                console.warn('❌ No PNG resource found in fotograma package');
                console.log('Available resources:', fotogramaPackage.resources.map(r => ({
                    name: r.name,
                    mimetype: r.mimetype,
                    format: r.format
                })));
                return false;
            }

            console.log('✅ Found PNG resource:', pngResource.name);
            console.log('📍 PNG URL:', pngResource.url);

            // Load PNG as WMS layer using the URL directly - NO MODIFICATIONS
            const normalizedId = fotogramaId.toString().replace(/-/, '_');

            const wmsSource = new ol.source.TileWMS({
                url: pngResource.url,
                params: {},  // No parameters, use URL as-is
                serverType: 'geoserver',
                transition: 0
            });

            const wmsLayer = new ol.layer.Tile({
                source: wmsSource,
                opacity: 1.0,
                zIndex: 1000,
                visible: true
            });

            // Store flight data in the layer for info button
            wmsLayer.set('flightData', this.currentFlight);
            wmsLayer.set('fotogramaId', fotogramaId);
            wmsLayer.set('photoProperties', photoProperties); // Store full specific properties

            // Store CKAN package extras
            if (fotogramaPackage && fotogramaPackage.extras) {
                wmsLayer.set('ckanExtras', fotogramaPackage.extras);
            } else if (fotogramaPackage) {
                // Try to find extras in result if structure is different
                wmsLayer.set('ckanExtras', fotogramaPackage.result ? fotogramaPackage.result.extras : null);
            }

            // Store reference
            this.wmsPhotoLayers.set(fotogramaId, wmsLayer);

            // Add to map
            const olMap = this.map.getMapImpl();
            olMap.addLayer(wmsLayer);

            console.log('✅ PNG layer loaded successfully for:', fotogramaId);

            // Clear loading flag
            delete this.loadingPhotoWMS[fotogramaId];

            return true;


        } catch (error) {
            console.error('❌ Error loading WMS photograph layer:', error);

            // Clear loading flag on error
            if (this.loadingPhotoWMS) {
                delete this.loadingPhotoWMS[fotogramaId];
            }

            return false;
        }
    }




    /**
     * Set callback for feature click events
     */
    onFeatureClick(callback) {
        this.onFeatureClickCallback = callback;
    }

    /**
     * Remove a photo layer by ID
     */
    removePhotoLayer(fotogramaId) {
        if (this.wmsPhotoLayers.has(fotogramaId)) {
            const layer = this.wmsPhotoLayers.get(fotogramaId);
            const olMap = this.map.getMapImpl();

            olMap.removeLayer(layer);
            this.wmsPhotoLayers.delete(fotogramaId);

            console.log('🗑️ Layer removed:', fotogramaId);

            // Update UI if available
            if (window.app && window.app.activeLayersUI) {
                window.app.activeLayersUI.updateLayersList();
            }

            return true;
        }
        return false;
    }

    /**
     * Get current flight
     */
    getCurrentFlight() {
        return this.currentFlight;
    }

    /**
     * Get map instance
     */
    getMap() {
        return this.map;
    }
}
