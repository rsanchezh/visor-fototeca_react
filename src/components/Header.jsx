export function Header() {
  return (
    <header className="header">
      <div className="header-content">
        <h1 className="header-title">
          <svg className="header-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
            <circle cx="12" cy="13" r="4" />
          </svg>
          Visor de Fotografía Aérea
        </h1>
        <p className="header-subtitle">Fototeca de Andalucía - IECA</p>
      </div>
    </header>
  );
}
