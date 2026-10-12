# API Compatibility Workbench

An educational full-stack project for checking API definitions and comparing versions to identify changes that may break clients.

## Current scope

The backend currently provides validation and comparison endpoints, plus project history endpoints:

- `POST /api/v1/specifications/validate` checks that an OpenAPI 3 JSON object has a title, version, and paths object.
- `POST /api/v1/specifications/compare` compares two definitions and reports added or removed HTTP operations and newly required parameters.

This is an early learning implementation, not a complete OpenAPI validator or a guarantee that every client will remain compatible. It checks only the rules listed above.

## Planned stack

- Java and Spring Boot for the REST API
- React and JavaScript for the browser interface
- PostgreSQL for project details and relational version links
- MongoDB for the flexible OpenAPI definition documents
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

## Saving and comparing project versions

Create a project with `POST /api/v1/projects` and a JSON body such as `{"name":"Workshop Booking API"}`. Use the returned project `id` when saving a version:

```json
{
  "versionLabel": "1.0.0",
  "definition": {
    "openapi": "3.0.3",
    "info": { "title": "Workshop Booking API", "version": "1.0.0" },
    "paths": { "/bookings": { "get": { "summary": "List bookings" } } }
  }
}
```

Available routes:

- `GET /api/v1/projects` lists projects.
- `POST /api/v1/projects/{projectId}/versions` validates and saves a definition.
- `GET /api/v1/projects/{projectId}/versions` lists its version labels and timestamps.
- `GET /api/v1/projects/{projectId}/versions/{versionId}/definition` retrieves a saved definition.
- `POST /api/v1/projects/{projectId}/compare` compares two saved versions. The request body has `oldVersionId` and `newVersionId` values returned when versions were saved.

PostgreSQL owns the project and version relationship. MongoDB stores each OpenAPI JSON object as a BSON document; PostgreSQL keeps the Mongo document ID beside the version metadata. Because the databases do not share a transaction, the save service removes the Mongo document if the matching PostgreSQL version row cannot be written. A process or connection failure between those writes can still need cleanup; distributed transaction handling is a later improvement.

## Local database setup

Start the PostgreSQL server and a MongoDB Community Server locally. Create a PostgreSQL database named `api_compatibility` (for example, with pgAdmin). Spring creates the project tables on startup for this learning environment. MongoDB creates the `api_compatibility` database and collection when the first version is saved.

Set connection details in the terminal before starting the backend. Keep your database password in your local environment; do not commit it.

```powershell
$env:POSTGRES_URL = 'jdbc:postgresql://localhost:5432/api_compatibility'
$env:POSTGRES_USER = 'postgres'
$env:POSTGRES_PASSWORD = 'your-local-postgres-password'
$env:MONGODB_URI = 'mongodb://localhost:27017/api_compatibility'
```

The defaults are for local development. `spring.jpa.hibernate.ddl-auto=update` is convenient while learning, but a deployed application should use controlled database migrations and production credentials.

## Project layout

- `specification/SpecificationValidationController.java` receives the HTTP request.
- `specification/SpecificationValidationService.java` checks the definition rules.
- `specification/SpecificationValidationResponse.java` describes the JSON response.
- `specification/SpecificationComparisonService.java` compares route and required-parameter sets. A `TreeSet` gives stable, sorted output and prevents duplicate findings when paths are gathered from both definitions.
- `specification/SpecificationValidationController.java` exposes validation and direct definition comparison.
- `specification/ApiChange.java` and `SpecificationComparisonResponse.java` shape the comparison result.
- `project/ApiProjectService.java` coordinates project/version operations across the relational and document stores.
- `project/ApiProject.java` and `ApiSpecificationVersion.java` are PostgreSQL entities; the version entity links to its project.
- `project/ApiSpecificationDocument.java` stores the OpenAPI body in MongoDB.
- `project/ApiProjectController.java` exposes project history and saved-version comparison routes.
- `ApiCompatibilityApplication.java` starts the Spring Boot application.
- `frontend/src/App.jsx` provides validation, comparison, and project/version history screens and sends requests to the API.

## Run the frontend

From the `frontend` directory, install the JavaScript dependencies once with `npm install`, then start the Vite development server with `npm run dev`. The Vite server forwards `/api` requests to the Spring Boot server on port 8080.

## Build prerequisites

- Java Development Kit 21 through 26
- Apache Maven 3.6.3 or later
- Node.js 20.19 or later

Spring Boot 4.1.1 supports Java 17 through Java 26. The project targets Java 21 bytecode so it can run on a Java 21–26 runtime.
