import { useState, useCallback, useEffect } from 'react';

export function PhotoViewerModal() {
  const [open, setOpen] = useState(false);
  const [photoData, setPhotoData] = useState(null);
  const [flight, setFlight] = useState(null);
  const [imageSrc, setImageSrc] = useState('');
  const [loading, setLoading] = useState(false);

  const close = useCallback(() => {
    setOpen(false);
    setPhotoData(null);
    setFlight(null);
    setImageSrc('');
  }, []);

  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') close(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [close]);

  const title = photoData ? `Fotograma ${photoData.fotogramas || photoData.id_fotogra || ''}` : 'Fotograma';
  const idFotograma = photoData?.id_fotogra ?? '-';
  const idVuelo = flight?.name ?? photoData?.id_vuelo ?? '-';
  let fechaStr = '-';
  if (photoData?.fecha) {
    const s = String(photoData.fecha);
    if (s.length === 8) fechaStr = `${s.slice(6, 8)}/${s.slice(4, 6)}/${s.slice(0, 4)}`;
    else fechaStr = s;
  }
  const hoja = photoData?.hoja ?? '-';

  return (
    <div className={`modal ${open ? 'active' : ''}`} id="photoModal">
      <div className="modal-overlay" id="modalOverlay" onClick={close} role="presentation" />
      <div className="modal-content">
        <button type="button" className="modal-close" id="modalClose" onClick={close} aria-label="Cerrar">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
        <div className="modal-body">
          <div className="photo-container">
            <img id="photoImage" className={`photo-image ${imageSrc ? 'loaded' : ''}`} src={imageSrc || ''} alt="Fotografía aérea" />
            {loading && (
              <div className="photo-loading">
                <div className="loading-spinner" />
              </div>
            )}
          </div>
          <div className="photo-metadata">
            <h3 className="photo-title" id="photoTitle">{title}</h3>
            <div className="metadata-grid">
              <div className="metadata-item">
                <span className="metadata-label">ID Fotograma:</span>
                <span className="metadata-value" id="photoIdFotograma">{idFotograma}</span>
              </div>
              <div className="metadata-item">
                <span className="metadata-label">ID Vuelo:</span>
                <span className="metadata-value" id="photoIdVuelo">{idVuelo}</span>
              </div>
              <div className="metadata-item">
                <span className="metadata-label">Fecha:</span>
                <span className="metadata-value" id="photoFecha">{fechaStr}</span>
              </div>
              <div className="metadata-item">
                <span className="metadata-label">Hoja:</span>
                <span className="metadata-value" id="photoHoja">{hoja}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
