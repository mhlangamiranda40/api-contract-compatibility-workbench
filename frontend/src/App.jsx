import { useEffect, useState } from 'react';

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

async function requestJson(url, options = {}) {
  const response = await fetch(url, options);
  const body = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(body?.detail || `The API returned status ${response.status}.`);
  }
  return body;
}

function App() {
  const [mode, setMode] = useState('validate');
  const [definitionText, setDefinitionText] = useState(formatDefinition(firstDefinition));
  const [oldDefinitionText, setOldDefinitionText] = useState(formatDefinition(firstDefinition));
  const [newDefinitionText, setNewDefinitionText] = useState(formatDefinition(nextDefinition));
  const [result, setResult] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [requestError, setRequestError] = useState('');
  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [projectName, setProjectName] = useState('');
  const [versions, setVersions] = useState([]);
  const [versionLabel, setVersionLabel] = useState('');
  const [oldVersionId, setOldVersionId] = useState('');
  const [newVersionId, setNewVersionId] = useState('');

  useEffect(() => {
    if (mode === 'projects') loadProjects();
  }, [mode]);

  function clearResult() {
    setResult(null);
    setRequestError('');
  }

  function changeMode(nextMode) {
    setMode(nextMode);
    clearResult();
  }

  async function loadProjects() {
    try {
      setProjects(await requestJson('/api/v1/projects'));
    } catch (error) {
      setRequestError(error.message || 'Could not load projects.');
    }
  }

  async function loadVersions(projectId) {
    clearResult();
    setSelectedProjectId(projectId);
    setVersions([]);
    setOldVersionId('');
    setNewVersionId('');
    if (!projectId) return;

    try {
      setVersions(await requestJson(`/api/v1/projects/${projectId}/versions`));
    } catch (error) {
      setRequestError(error.message || 'Could not load saved versions.');
    }
  }

  async function createProject(event) {
    event.preventDefault();
    setRequestError('');
    setIsSubmitting(true);
    try {
      const project = await requestJson('/api/v1/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: projectName })
      });
      setProjectName('');
      await loadProjects();
      await loadVersions(project.id);
    } catch (error) {
      setRequestError(error.message || 'Could not create the project.');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function saveVersion(event) {
    event.preventDefault();
    clearResult();
    setIsSubmitting(true);
    try {
      const definition = JSON.parse(definitionText);
      await requestJson(`/api/v1/projects/${selectedProjectId}/versions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ versionLabel, definition })
      });
      setVersionLabel('');
      await loadVersions(selectedProjectId);
      setResult({ saved: true });
    } catch (error) {
      setRequestError(error instanceof SyntaxError
        ? 'The definition is not valid JSON. Check commas, quotes, and brackets.'
        : error.message || 'Could not save this version.');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function compareSavedVersions(event) {
    event.preventDefault();
    clearResult();
    setIsSubmitting(true);
    try {
      const comparison = await requestJson(`/api/v1/projects/${selectedProjectId}/compare`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ oldVersionId, newVersionId })
      });
      setResult(comparison);
    } catch (error) {
      setRequestError(error.message || 'Could not compare the saved versions.');
    } finally {
      setIsSubmitting(false);
    }
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
        <h1>{mode === 'validate' ? 'Check an API definition' : mode === 'compare' ? 'Compare API versions' : 'Save API versions'}</h1>
        <p className="intro-copy">
          {mode === 'validate' && 'Check required OpenAPI fields before saving a definition.'}
          {mode === 'compare' && 'Compare two OpenAPI definitions and find route changes that may affect existing clients.'}
          {mode === 'projects' && 'Keep project details and version links in PostgreSQL, with each API definition stored in MongoDB.'}
        </p>
      </section>

      <nav className="mode-tabs" aria-label="Workbench tools">
        <button className={mode === 'validate' ? 'mode-tab active' : 'mode-tab'} type="button" onClick={() => changeMode('validate')}>
          Validate
        </button>
        <button className={mode === 'compare' ? 'mode-tab active' : 'mode-tab'} type="button" onClick={() => changeMode('compare')}>
          Compare versions
        </button>
        <button className={mode === 'projects' ? 'mode-tab active' : 'mode-tab'} type="button" onClick={() => changeMode('projects')}>
          Projects and history
        </button>
      </nav>

      {mode === 'projects' ? (
        <ProjectWorkspace
          projects={projects}
          selectedProjectId={selectedProjectId}
          projectName={projectName}
          versions={versions}
          versionLabel={versionLabel}
          definitionText={definitionText}
          oldVersionId={oldVersionId}
          newVersionId={newVersionId}
          result={result}
          requestError={requestError}
          isSubmitting={isSubmitting}
          setProjectName={setProjectName}
          setVersionLabel={setVersionLabel}
          setDefinitionText={setDefinitionText}
          setOldVersionId={setOldVersionId}
          setNewVersionId={setNewVersionId}
          onProjectChange={loadVersions}
          onCreateProject={createProject}
          onSaveVersion={saveVersion}
          onCompareVersions={compareSavedVersions}
        />
      ) : (
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
      )}

      <footer className="page-footer">
        <span>API Compatibility Workbench</span>
        <span>Early development · OpenAPI structure checks</span>
      </footer>
    </main>
  );
}

function ProjectWorkspace({ projects, selectedProjectId, projectName, versions, versionLabel,
  definitionText, oldVersionId, newVersionId, result, requestError, isSubmitting,
  setProjectName, setVersionLabel, setDefinitionText, setOldVersionId, setNewVersionId,
  onProjectChange, onCreateProject, onSaveVersion, onCompareVersions }) {
  return (
    <div className="workspace">
      <section className="editor-card project-workspace">
        <div className="card-heading"><div><p className="section-label">POSTGRESQL</p><h2>API projects</h2></div></div>
        <form className="project-form" onSubmit={onCreateProject}>
          <label htmlFor="project-name">Create a project</label>
          <div className="inline-fields">
            <input id="project-name" value={projectName} onChange={(event) => setProjectName(event.target.value)} placeholder="e.g. Workshop Booking API" required />
            <button className="secondary-button" type="submit" disabled={isSubmitting}>Create</button>
          </div>
        </form>
        <div className="project-form">
          <label htmlFor="project-picker">Choose a project</label>
          <select id="project-picker" value={selectedProjectId} onChange={(event) => onProjectChange(event.target.value)}>
            <option value="">Select a saved project</option>
            {projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}
          </select>
        </div>

        {selectedProjectId && (
          <>
            <form className="project-form version-form" onSubmit={onSaveVersion}>
              <label htmlFor="version-label">Save a new API version</label>
              <input id="version-label" value={versionLabel} onChange={(event) => setVersionLabel(event.target.value)} placeholder="e.g. 1.0.0" required />
              <DefinitionEditor label="VERSION DEFINITION" title="OpenAPI JSON" value={definitionText} onChange={setDefinitionText} />
              <button className="primary-button" type="submit" disabled={isSubmitting}>{isSubmitting ? 'Saving…' : 'Save version'}</button>
            </form>
            <p className="storage-note">The project and version link go to PostgreSQL. The OpenAPI document goes to MongoDB.</p>
          </>
        )}
      </section>

      <aside className="result-card project-history" aria-live="polite">
        <p className="section-label">VERSION HISTORY</p>
        {requestError && <div className="result-message error-message" role="alert"><h2>Could not load data</h2><p>{requestError}</p></div>}
        {result?.saved && <div className="result-message success-message"><h2>Version saved</h2><p>The definition is stored with this project.</p></div>}
        {!selectedProjectId && !requestError && <p className="history-empty">Create or choose a project to see its versions.</p>}
        {selectedProjectId && versions.length === 0 && !requestError && <p className="history-empty">No saved versions yet.</p>}
        {versions.map((version) => (
          <article className="version-row" key={version.id}>
            <strong>{version.versionLabel}</strong>
            <span>{new Date(version.createdAt).toLocaleString()}</span>
          </article>
        ))}
        {selectedProjectId && versions.length > 1 && (
          <form className="project-form compare-saved-form" onSubmit={onCompareVersions}>
            <label htmlFor="old-version">Compare two saved versions</label>
            <select id="old-version" value={oldVersionId} onChange={(event) => setOldVersionId(event.target.value)} required>
              <option value="">Earlier version</option>
              {versions.map((version) => <option key={version.id} value={version.id}>{version.versionLabel}</option>)}
            </select>
            <select aria-label="Newer version" value={newVersionId} onChange={(event) => setNewVersionId(event.target.value)} required>
              <option value="">Newer version</option>
              {versions.map((version) => <option key={version.id} value={version.id}>{version.versionLabel}</option>)}
            </select>
            <button className="primary-button" type="submit" disabled={isSubmitting}>Compare saved versions</button>
          </form>
        )}
        {result?.changes && <div className="comparison-results">
          <p className="change-count">{result.changes.filter((change) => change.severity === 'BREAKING').length} potential breaking change(s)</p>
          {result.changes.map((change, index) => <article className={`change-item ${change.severity.toLowerCase()}`} key={`${change.location}-${index}`}><strong>{change.severity}</strong><code>{change.location}</code><p>{change.message}</p></article>)}
        </div>}
      </aside>
    </div>
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
