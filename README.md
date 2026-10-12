# API Compatibility Workbench

An educational full-stack project for checking API definitions and comparing versions to identify changes that may break clients.

## Current scope

The first backend feature accepts a JSON API definition and checks a few required OpenAPI fields. It does not yet save definitions, compare versions, or connect to PostgreSQL or MongoDB. Those pieces will be added after the validation flow is understood and the local database setup is ready.

## Planned stack

- Java and Spring Boot for the REST API
- React and JavaScript for the browser interface
- PostgreSQL for users, projects, and version relationships
- MongoDB for API definition documents and comparison reports
- Git for branches, commits, pull requests, and review history

## First API route

`POST /api/v1/specifications/validate`

Send an OpenAPI JSON definition in the request body. The response contains a `valid` value and an `errors` list. The example request is in `examples/valid-api-definition.json`.

## Project layout

- `specification/SpecificationValidationController.java` receives the HTTP request.
- `specification/SpecificationValidationService.java` checks the definition rules.
- `specification/SpecificationValidationResponse.java` describes the JSON response.
- `ApiCompatibilityApplication.java` starts the Spring Boot application.
- `frontend/src/App.jsx` provides the React editor and sends validation requests to the API.

## Run the frontend

From the `frontend` directory, install the JavaScript dependencies once with `npm install`, then start the Vite development server with `npm run dev`. The Vite server forwards `/api` requests to the Spring Boot server on port 8080.

## Build prerequisites

- Java Development Kit 21 through 26
- Apache Maven 3.6.3 or later
- Node.js 20.19 or later

Spring Boot 4.1.1 supports Java 17 through Java 26. The project targets Java 21 bytecode so it can run on a Java 21–26 runtime.
