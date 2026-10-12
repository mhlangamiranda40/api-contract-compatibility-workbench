# API Compatibility Workbench

An educational full-stack project for checking API definitions and comparing versions to identify changes that may break clients.

## Current scope

The backend currently provides two REST endpoints:

- `POST /api/v1/specifications/validate` checks that an OpenAPI 3 JSON object has a title, version, and paths object.
- `POST /api/v1/specifications/compare` compares two definitions and reports added or removed HTTP operations and newly required parameters.

This is an early learning implementation, not a complete OpenAPI validator or a guarantee that every client will remain compatible. It checks only the rules listed above. Definitions are not yet persisted, and PostgreSQL and MongoDB have not yet been connected.

## Planned stack

- Java and Spring Boot for the REST API
- React and JavaScript for the browser interface
- PostgreSQL for users, projects, and version relationships
- MongoDB for API definition documents and comparison reports
- Git for branches, commits, pull requests, and review history

## API request examples

The validation endpoint accepts one OpenAPI JSON document. Its response contains a `valid` value and an `errors` list. The example request is in `examples/valid-api-definition.json`.

The comparison endpoint accepts a JSON object with `oldDefinition` and `newDefinition` properties. A comparison finding has a severity, the route it refers to, and a plain-language explanation. Removed operations and newly required parameters are marked `BREAKING`; new operations are marked `ADDITION`.

For example:

```json
{
  "oldDefinition": { "openapi": "3.0.3", "info": { "title": "Sample API", "version": "1.0" }, "paths": { "/items": { "get": {} } } },
  "newDefinition": { "openapi": "3.0.3", "info": { "title": "Sample API", "version": "2.0" }, "paths": { "/items": { "post": {} } } }
}
```

## Project layout

- `specification/SpecificationValidationController.java` receives the HTTP request.
- `specification/SpecificationValidationService.java` checks the definition rules.
- `specification/SpecificationValidationResponse.java` describes the JSON response.
- `specification/SpecificationComparisonService.java` compares route and required-parameter sets. A `TreeSet` gives stable, sorted output and prevents duplicate findings when paths are gathered from both definitions.
- `specification/SpecificationComparisonController` (in `SpecificationValidationController.java`) exposes the comparison route after checking that both inputs pass the basic validator.
- `specification/ApiChange.java` and `SpecificationComparisonResponse.java` shape the comparison result.
- `ApiCompatibilityApplication.java` starts the Spring Boot application.
- `frontend/src/App.jsx` provides validation and two-definition comparison screens and sends requests to the API.

## Run the frontend

From the `frontend` directory, install the JavaScript dependencies once with `npm install`, then start the Vite development server with `npm run dev`. The Vite server forwards `/api` requests to the Spring Boot server on port 8080.

## Build prerequisites

- Java Development Kit 21 through 26
- Apache Maven 3.6.3 or later
- Node.js 20.19 or later

Spring Boot 4.1.1 supports Java 17 through Java 26. The project targets Java 21 bytecode so it can run on a Java 21–26 runtime.
