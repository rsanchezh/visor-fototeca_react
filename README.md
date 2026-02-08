# Visor de Fotografía Aérea - Fototeca de Andalucía

Este proyecto es un visor web interactivo para explorar la Fototeca de Andalucía. Permite visualizar vuelos históricos, filtrar por diversos criterios y descargar fotogramas.

## Características

- **Visualización de Mapas**: Utiliza la API de Mapea 4 (OpenLayers) para mostrar mapas y capas geográficas.
- **Exploración de Vuelos**: Carga y visualización de centroides y huellas de vuelos fotogramétricos.
- **Filtros Avanzados**: Filtrado por tipo de vuelo, tipología, color, rango de años y búsqueda de texto.
- **Visualización de Fotogramas**:
  - Carga dinámica de capas WMS para cada fotograma.
  - Modo "Ocultar" vs "Eliminar" capas configurable.
  - Popup de información detallada con metadatos de CKAN.
- **Descarga**: Funcionalidad para descargar fotogramas seleccionados.

## Tecnologías

- **React 18** + **Vite**
- **HTML5 / CSS3 / JavaScript (ES6+)**
- **[Mapea 4](https://mapea-sigc.juntadeandalucia.es/)**: Librería de mapas de la Junta de Andalucía.
- **API CKAN**: Para la consulta de metadatos de los vuelos y fotogramas.
- **OpenLayers**: Motor de mapas subyacente.

## Desarrollo local

```bash
npm install
npm run dev
```

Abre `http://localhost:5173` en el navegador.

## Build para producción

```bash
npm run build
```

Los archivos se generan en `dist/`. Para previsualizar: `npm run preview`.

## Despliegue

Este proyecto es una aplicación estática y puede desplegarse en cualquier servidor web estático, como **GitHub Pages**.

### Pasos para desplegar en GitHub Pages:

1. Sube los archivos de este proyecto a un repositorio de GitHub.
2. Ve a la pestaña **Settings** > **Pages**.
3. En **Source**, selecciona la rama `main` (o `master`) y la carpeta raíz (`/`).
4. Guarda los cambios. GitHub generará una URL donde tu visor estará accesible públicamente.
