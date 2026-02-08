// Configuration constants for the application
const CONFIG = {
    // CKAN API Configuration
    CKAN: {
        BASE_URL: 'https://ws089.juntadeandalucia.es/fototeca/catalogo/api/3/action/',
        API_URL: 'https://ws089.juntadeandalucia.es/fototeca/catalogo/api/3/action',
        ENDPOINTS: {
            PACKAGE_SEARCH: 'package_search',
            PACKAGE_SHOW: 'package_show'
        },
        GROUPS: {
            FLIGHTS: 'vuelos-fotogrametricos',
            PHOTOS: 'fotografias-aereas'
        },
        MAX_ROWS: 1000
    },

    // MAPEA4 Configuration
    MAPEA: {
        CONTAINER: 'mapjs',
        CENTER: {
            x: 275000,  // UTM coordinates for Andalusia center
            y: 4170000
        },
        ZOOM: 8,
        PROJECTION: 'EPSG:25830*m',  // UTM Zone 30N (ETRS89)
        MIN_ZOOM: 6,
        MAX_ZOOM: 20
    },

    // WFS Configuration
    WFS: {
        VERSION: '2.0.0',
        OUTPUT_FORMAT: 'geojson',
        SRS_NAME: 'EPSG:4326',
        LAYERS: {
            CENTROIDS: 'centroide_fotogramas',
            FOOTPRINTS: 'huella_fotogramas',
            FLIGHT_FOOTPRINT: 'huella_vuelo'
        }
    },

    // Filter field names in CKAN extras
    FILTER_FIELDS: {
        FLIGHT_TYPE: 'Tipo vuelo',
        TYPOLOGY: 'Tipología vuelo',
        COLOR: 'Color',
        YEAR: 'Fecha',
        SCALE: 'Escala',
        FLIGHT_ID: 'id vuelo',
        PUBLISHED: 'Publicado',
        NUM_FRAMES: 'Número fotogramas'
    },

    // UI Configuration
    UI: {
        DEBOUNCE_DELAY: 300,
        ANIMATION_DURATION: 250,
        PHOTO_LOAD_TIMEOUT: 10000
    }
};

// Freeze the configuration to prevent modifications
Object.freeze(CONFIG);
