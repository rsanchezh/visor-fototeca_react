import { useState, useEffect, useCallback } from 'react';
import { useApp } from '../context/AppContext';

function escapeHtml(text) {
  if (text == null) return '';
  const div = document.createElement('div');
  div.textContent = String(text);
  return div.innerHTML;
}

export function ActiveLayersPanel() {
  const { getMapeaController, getCkanService, getActiveLayersRef, activeLayersVersion } = useApp();
  const [isRemoveMode, setIsRemoveMode] = useState(false);
  const [selectedLayers, setSelectedLayers] = useState(new Set());
  const [downloadFormat, setDownloadFormat] = useState('jp2');

  const activeRef = getActiveLayersRef();
  useEffect(() => {
    activeRef.isRemoveMode = isRemoveMode;
  }, [isRemoveMode, activeRef]);

  const controller = getMapeaController();
  const wmsPhotoLayers = controller?.wmsPhotoLayers ?? new Map();

  const layersByFlight = useCallback(() => {
    const grouped = new Map();
    wmsPhotoLayers.forEach((layer, fotogramaId) => {
      const flightData = layer.get?.('flightData');
      const flightName = flightData ? flightData.title : 'Vuelo desconocido';
      if (!grouped.has(flightName)) grouped.set(flightName, []);
      grouped.get(flightName).push({ fotogramaId, layer });
    });
    return grouped;
  }, [wmsPhotoLayers]);

  const toggleVisibility = (fotogramaId, layer) => {
    layer.setVisible(!layer.getVisible());
    getActiveLayersRef().updateLayersList?.();
  };

  const removeLayer = (fotogramaId) => {
    controller?.removePhotoLayer(fotogramaId);
  };

  const toggleSelection = (fotogramaId) => {
    setSelectedLayers((prev) => {
      const next = new Set(prev);
      if (next.has(fotogramaId)) next.delete(fotogramaId);
      else next.add(fotogramaId);
      return next;
    });
  };

  const showInfo = (fotogramaId) => {
    const layer = wmsPhotoLayers.get(fotogramaId);
    const flight = layer?.get?.('flightData');
    const ckanExtras = layer?.get?.('ckanExtras');
    const photoProperties = layer?.get?.('photoProperties');
    let content = '<div class="layer-info-popup">';
    if (ckanExtras?.length) {
      content += '<h3>Información del Fotograma</h3>';
      ckanExtras.forEach((extra) => {
        if (extra.value && extra.key?.toLowerCase() !== 'spatial')
          content += `<p><strong>${escapeHtml(extra.key)}:</strong> ${escapeHtml(extra.value)}</p>`;
      });
      const ckanId = fotogramaId.toString().replace(/-/, '_').toLowerCase();
      content += `<p style="text-align:center;margin-top:10px"><a href="https://ws089.juntadeandalucia.es/fototeca/catalogo/dataset/${ckanId}" target="_blank" rel="noopener noreferrer">🔗 Ver en Catálogo CKAN</a></p>`;
    } else {
      content += `<h3>Fotograma</h3><p><strong>ID:</strong> ${escapeHtml(fotogramaId)}</p>`;
      if (flight) content += `<p><strong>Vuelo:</strong> ${escapeHtml(flight.title || flight.name)}</p>`;
    }
    content += '</div>';
    const overlay = document.createElement('div');
    overlay.className = 'info-modal-overlay';
    overlay.innerHTML = `<div class="info-modal-content"><button class="info-modal-close">&times;</button>${content}</div>`;
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay || e.target.classList.contains('info-modal-close')) overlay.remove();
    });
    document.body.appendChild(overlay);
  };

  const handleBulkDownload = async () => {
    if (selectedLayers.size === 0 || typeof window.JSZip === 'undefined' || typeof window.saveAs === 'undefined') return;
    const zip = window.JSZip();
    const folder = zip.folder('fotogramas');
    const ckan = getCkanService();
    let processed = 0;
    for (const fotogramaId of selectedLayers) {
      try {
        const pkg = await ckan.fetchPackageById(fotogramaId);
        if (!pkg?.resources) continue;
        const res = downloadFormat === 'jp2'
          ? pkg.resources.find((r) => r.mimetype?.includes('jp2') || r.format?.toLowerCase()?.includes('jp2'))
          : pkg.resources.find((r) => r.mimetype?.includes('png') || r.format?.toLowerCase()?.includes('png'));
        const url = res?.url || pkg.downloadUrl;
        if (!url) continue;
        const resp = await fetch(url);
        const blob = await resp.blob();
        const ext = downloadFormat === 'png' ? 'png' : 'jp2';
        folder.file(`${String(fotogramaId).replace(/[^a-zA-Z0-9_-]/g, '_')}.${ext}`, blob);
      } catch (_) {}
      processed++;
    }
    const content = await zip.generateAsync({ type: 'blob' });
    window.saveAs(content, 'fotogramas_seleccionados.zip');
    setSelectedLayers(new Set());
  };

  const groups = layersByFlight();
  const hasLayers = wmsPhotoLayers.size > 0;

  return (
    <div className="active-layers-panel">
      <h3 className="panel-title">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 2L2 7l10 5 10-5-10-5z" /><path d="M2 17l10 5 10-5M2 12l10 5 10-5" />
        </svg>
        Capas Activas
      </h3>
      <div className="layer-mode-toggle">
        <label className="toggle-switch">
          <input type="checkbox" checked={isRemoveMode} onChange={(e) => setIsRemoveMode(e.target.checked)} />
          <span className="toggle-slider" />
        </label>
        <span className="toggle-label" title="Si activo, elimina la capa. Si inactivo, solo la oculta.">Modo Eliminar</span>
      </div>
      <div id="activeLayersList" className="active-layers-list">
        {!hasLayers && <p className="no-layers-message">No hay capas activas</p>}
        {hasLayers && Array.from(groups.entries()).map(([flightName, layers]) => (
          <div key={flightName} className="flight-section">
            <div className="flight-section-header">
              <span className="flight-section-title">{flightName}</span>
              <span className="flight-section-count">{layers.length}</span>
            </div>
            <div className="flight-section-items">
              {layers.map(({ fotogramaId, layer }) => {
                const visible = layer.getVisible?.() ?? true;
                const opacity = Math.round((layer.getOpacity?.() ?? 1) * 100);
                const photoProps = layer.get?.('photoProperties') || {};
                const displayName = photoProps.fotograma ?? photoProps.fotogramas ?? fotogramaId;
                const nameStr = String(displayName).includes('-') ? String(displayName).split('-').pop() : String(displayName);
                return (
                  <div key={fotogramaId} className="layer-item-compact" data-fotograma-id={fotogramaId}>
                    <div className="layer-item-main">
                      <input
                        type="checkbox"
                        className="layer-checkbox"
                        checked={selectedLayers.has(fotogramaId)}
                        onChange={() => toggleSelection(fotogramaId)}
                      />
                      <span className="layer-photo-id">{nameStr}</span>
                      <div className="layer-actions">
                        <button type="button" className={`layer-action-btn visibility-btn ${visible ? 'visible' : 'hidden'}`} title={visible ? 'Ocultar' : 'Mostrar'} onClick={() => toggleVisibility(fotogramaId, layer)}>
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            {visible ? <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></> : <><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" /><line x1="1" y1="1" x2="23" y2="23" /></>}
                          </svg>
                        </button>
                        <button type="button" className="layer-action-btn info-btn" title="Información" onClick={() => showInfo(fotogramaId)}>
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" /></svg>
                        </button>
                        <button type="button" className="layer-action-btn delete-btn" title="Eliminar capa" style={{ color: 'var(--danger-color, #ef4444)' }} onClick={() => removeLayer(fotogramaId)}>
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                        </button>
                      </div>
                    </div>
                    <div className="layer-opacity-control">
                      <label className="opacity-label">Opacidad:</label>
                      <input
                        type="range"
                        className="opacity-slider"
                        min={0}
                        max={100}
                        value={opacity}
                        onChange={(e) => { layer.setOpacity?.(Number(e.target.value) / 100); getActiveLayersRef().updateLayersList?.(); }}
                      />
                      <span className="opacity-value">{opacity}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
      <div className="download-options" style={{ marginBottom: 10, padding: '0 10px' }}>
        <label style={{ fontSize: '0.9em', fontWeight: 500, color: 'var(--text-primary)', marginRight: 10 }}>Formato:</label>
        <div className="format-toggle" style={{ display: 'inline-flex', background: 'var(--bg-secondary)', padding: 2, borderRadius: 4 }}>
          <label style={{ cursor: 'pointer', padding: '4px 8px', borderRadius: 4, fontSize: '0.85em' }}>
            <input type="radio" name="downloadFormat" value="jp2" checked={downloadFormat === 'jp2'} onChange={() => setDownloadFormat('jp2')} style={{ marginRight: 4 }} />
            JP2
          </label>
          <label style={{ cursor: 'pointer', padding: '4px 8px', borderRadius: 4, fontSize: '0.85em' }}>
            <input type="radio" name="downloadFormat" value="png" checked={downloadFormat === 'png'} onChange={() => setDownloadFormat('png')} style={{ marginRight: 4 }} />
            PNG
          </label>
        </div>
      </div>
      <button type="button" id="btnDownloadSelected" className="download-selected-btn" disabled={selectedLayers.size === 0} onClick={handleBulkDownload}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
        </svg>
        Descargar <span id="downloadSelectedCount">{selectedLayers.size}</span> seleccionados
      </button>
    </div>
  );
}
