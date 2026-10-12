import { useState } from 'react';

const exampleDefinition = {
  openapi: '3.0.3',
  info: {
    title: 'Workshop Booking API',
    version: '1.0.0'
  },
  paths: {
    '/bookings': {
      get: {
        summary: 'List bookings'
      }
    }
  }
};

function App() {
  const [definitionText, setDefinitionText] = useState(
    JSON.stringify(exampleDefinition, null, 2)
  );
  const [result, setResult] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [requestError, setRequestError] = useState('');

  async function handleValidate(event) {
    event.preventDefault();
    setResult(null);
    setRequestError('');

    try {
      // Parse first so a typo in the editor gets a direct, useful message.
      JSON.parse(definitionText);
      setIsSubmitting(true);

      const response = await fetch('/api/v1/specifications/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: definitionText
      });

      if (!response.ok) {
        throw new Error(`The API returned status ${response.status}.`);
      }

      setResult(await response.json());
    } catch (error) {
      if (error instanceof SyntaxError) {
        setRequestError('The definition is not valid JSON. Check commas, quotes, and brackets.');
      } else {
        setRequestError(error.message || 'Could not reach the validation API.');
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  function restoreExample() {
    setDefinitionText(JSON.stringify(exampleDefinition, null, 2));
    setResult(null);
    setRequestError('');
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
        <h1>Check an API definition</h1>
        <p className="intro-copy">
          Paste an OpenAPI document to check its basic structure before we add version comparison.
        </p>
      </section>

      <form className="workspace" onSubmit={handleValidate}>
        <div className="editor-card">
          <div className="card-heading">
            <div>
              <p className="section-label">API DEFINITION</p>
              <h2>OpenAPI JSON</h2>
            </div>
            <button className="text-button" type="button" onClick={restoreExample}>
              Restore example
            </button>
          </div>

          <label className="visually-hidden" htmlFor="definition-input">
            OpenAPI JSON definition
          </label>
          <textarea
            id="definition-input"
            spellCheck="false"
            value={definitionText}
            onChange={(event) => setDefinitionText(event.target.value)}
            aria-describedby="editor-help"
          />
          <div className="editor-footer">
            <p id="editor-help">JSON format · OpenAPI 3.x</p>
            <button className="primary-button" type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Checking…' : 'Validate definition'}
            </button>
          </div>
        </div>

        <aside className="result-card" aria-live="polite">
          <p className="section-label">VALIDATION RESULT</p>
          {!result && !requestError && (
            <div className="empty-state">
              <span className="empty-icon" aria-hidden="true">✓</span>
              <h2>Ready to check</h2>
              <p>The result will show whether the required fields are present.</p>
            </div>
          )}

          {requestError && (
            <div className="result-message error-message" role="alert">
              <h2>Could not validate</h2>
              <p>{requestError}</p>
            </div>
          )}

          {result && (
            <div className={`result-message ${result.valid ? 'success-message' : 'error-message'}`}>
              <h2>{result.valid ? 'Definition looks valid' : 'Check these fields'}</h2>
              {result.valid ? (
                <p>The basic OpenAPI fields passed validation.</p>
              ) : (
                <ul>
                  {result.errors.map((error, index) => <li key={`${index}-${error}`}>{error}</li>)}
                </ul>
              )}
            </div>
          )}

          <div className="scope-note">
            <strong>Current check</strong>
            <span>OpenAPI version, API title, API version, and paths object</span>
          </div>
        </aside>
      </form>

      <footer className="page-footer">
        <span>API Compatibility Workbench</span>
        <span>Early development · Validation only</span>
      </footer>
    </main>
  );
}

export default App;
