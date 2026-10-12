import { useState } from 'react';

const firstDefinition = {
  openapi: '3.0.3',
  info: { title: 'Workshop Booking API', version: '1.0.0' },
  paths: {
    '/bookings': {
      get: {
        summary: 'List bookings',
        parameters: [{ name: 'status', in: 'query', required: false, schema: { type: 'string' } }]
      }
    }
  }
};

const nextDefinition = {
  openapi: '3.0.3',
  info: { title: 'Workshop Booking API', version: '2.0.0' },
  paths: {
    '/bookings': {
      get: {
        summary: 'List bookings',
        parameters: [{ name: 'status', in: 'query', required: true, schema: { type: 'string' } }]
      },
      post: { summary: 'Create a booking' }
    }
  }
};

function formatDefinition(definition) {
  return JSON.stringify(definition, null, 2);
}

function App() {
  const [mode, setMode] = useState('validate');
  const [definitionText, setDefinitionText] = useState(formatDefinition(firstDefinition));
  const [oldDefinitionText, setOldDefinitionText] = useState(formatDefinition(firstDefinition));
  const [newDefinitionText, setNewDefinitionText] = useState(formatDefinition(nextDefinition));
  const [result, setResult] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [requestError, setRequestError] = useState('');

  function clearResult() {
    setResult(null);
    setRequestError('');
  }

  function changeMode(nextMode) {
    setMode(nextMode);
    clearResult();
  }

  async function sendRequest(event) {
    event.preventDefault();
    clearResult();

    try {
      const requestBody = mode === 'validate'
        ? JSON.parse(definitionText)
        : {
            oldDefinition: JSON.parse(oldDefinitionText),
            newDefinition: JSON.parse(newDefinitionText)
          };
      setIsSubmitting(true);

      const response = await fetch(`/api/v1/specifications/${mode === 'validate' ? 'validate' : 'compare'}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const message = await response.text();
        throw new Error(message || `The API returned status ${response.status}.`);
      }

      setResult(await response.json());
    } catch (error) {
      if (error instanceof SyntaxError) {
        setRequestError('One of the editors is not valid JSON. Check commas, quotes, and brackets.');
      } else {
        setRequestError(error.message || 'Could not reach the API.');
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="page-shell">
      <header className="topbar">
        <a className="brand" href="/" aria-label="API Workbench home">
          <span className="brand-mark">A</span>
          <span>API Workbench</span>
        </a>
        <span className="topbar-note">Contract validation workspace</span>
      </header>

      <section className="intro">
        <p className="eyebrow">DEVELOPER TOOLING</p>
        <h1>{mode === 'validate' ? 'Check an API definition' : 'Compare API versions'}</h1>
        <p className="intro-copy">
          {mode === 'validate'
            ? 'Check required OpenAPI fields before saving a definition.'
            : 'Compare two OpenAPI definitions and find route changes that may affect existing clients.'}
        </p>
      </section>

      <nav className="mode-tabs" aria-label="Workbench tools">
        <button className={mode === 'validate' ? 'mode-tab active' : 'mode-tab'} type="button" onClick={() => changeMode('validate')}>
          Validate
        </button>
        <button className={mode === 'compare' ? 'mode-tab active' : 'mode-tab'} type="button" onClick={() => changeMode('compare')}>
          Compare versions
        </button>
      </nav>

      <form className="workspace" onSubmit={sendRequest}>
        <div className="editor-card">
          {mode === 'validate' ? (
            <DefinitionEditor
              label="API DEFINITION"
              title="OpenAPI JSON"
              value={definitionText}
              onChange={setDefinitionText}
            />
          ) : (
            <div className="comparison-editors">
              <DefinitionEditor
                label="CURRENT VERSION"
                title="Before"
                value={oldDefinitionText}
                onChange={setOldDefinitionText}
              />
              <DefinitionEditor
                label="UPDATED VERSION"
                title="After"
                value={newDefinitionText}
                onChange={setNewDefinitionText}
              />
            </div>
          )}
          <div className="editor-footer">
            <p>JSON format · OpenAPI 3.x</p>
            <button className="primary-button" type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Working…' : mode === 'validate' ? 'Validate definition' : 'Compare versions'}
            </button>
          </div>
        </div>

        <aside className="result-card" aria-live="polite">
          <p className="section-label">{mode === 'validate' ? 'VALIDATION RESULT' : 'COMPARISON RESULT'}</p>
          {!result && !requestError && (
            <div className="empty-state">
              <span className="empty-icon" aria-hidden="true">✓</span>
              <h2>Ready to {mode === 'validate' ? 'check' : 'compare'}</h2>
              <p>{mode === 'validate' ? 'The result will show whether required fields are present.' : 'Added routes and potential breaking changes will appear here.'}</p>
            </div>
          )}

          {requestError && (
            <div className="result-message error-message" role="alert">
              <h2>Could not {mode === 'validate' ? 'validate' : 'compare'}</h2>
              <p>{requestError}</p>
            </div>
          )}

          {result && mode === 'validate' && (
            <div className={`result-message ${result.valid ? 'success-message' : 'error-message'}`}>
              <h2>{result.valid ? 'Definition looks valid' : 'Check these fields'}</h2>
              {result.valid ? <p>The required OpenAPI fields passed this project's basic checks.</p> : (
                <ul>{result.errors.map((error, index) => <li key={`${index}-${error}`}>{error}</li>)}</ul>
              )}
            </div>
          )}

          {result && mode === 'compare' && (
            <div className="comparison-results">
              <p className="change-count">{result.changes.filter((change) => change.severity === 'BREAKING').length} potential breaking change(s)</p>
              {result.changes.map((change, index) => (
                <article className={`change-item ${change.severity.toLowerCase()}`} key={`${change.location}-${index}`}>
                  <strong>{change.severity}</strong>
                  <code>{change.location}</code>
                  <p>{change.message}</p>
                </article>
              ))}
            </div>
          )}

          <div className="scope-note">
            <strong>Current comparison rules</strong>
            <span>Added or removed routes and newly required parameters</span>
          </div>
        </aside>
      </form>

      <footer className="page-footer">
        <span>API Compatibility Workbench</span>
        <span>Early development · OpenAPI structure checks</span>
      </footer>
    </main>
  );
}

function DefinitionEditor({ label, title, value, onChange }) {
  const inputId = label.toLowerCase().replaceAll(' ', '-');

  return (
    <section className="definition-editor">
      <div className="card-heading">
        <div>
          <p className="section-label">{label}</p>
          <h2>{title}</h2>
        </div>
      </div>
      <label className="visually-hidden" htmlFor={inputId}>{title} OpenAPI JSON definition</label>
      <textarea
        id={inputId}
        spellCheck="false"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </section>
  );
}

export default App;
