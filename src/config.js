// Configuration constants for the application
export const CONFIG = Object.freeze({
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
  MAPEA: {
    CONTAINER: 'mapjs',
    CENTER: { x: 275000, y: 4170000 },
    ZOOM: 8,
    PROJECTION: 'EPSG:25830*m',
    MIN_ZOOM: 6,
    MAX_ZOOM: 20
  },
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
  UI: {
    DEBOUNCE_DELAY: 300,
    ANIMATION_DURATION: 250,
    PHOTO_LOAD_TIMEOUT: 10000
  }
});
