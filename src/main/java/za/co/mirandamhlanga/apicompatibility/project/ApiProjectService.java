package za.co.mirandamhlanga.apicompatibility.project;

import org.bson.Document;
import org.springframework.dao.DataAccessException;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;
import tools.jackson.core.JacksonException;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;
import za.co.mirandamhlanga.apicompatibility.specification.SpecificationValidationResponse;
import za.co.mirandamhlanga.apicompatibility.specification.SpecificationValidationService;
import za.co.mirandamhlanga.apicompatibility.specification.SpecificationComparisonResponse;
import za.co.mirandamhlanga.apicompatibility.specification.SpecificationComparisonService;

import java.util.List;
import java.util.UUID;

@Service
public class ApiProjectService {

    private final ApiProjectRepository projectRepository;
    private final ApiSpecificationVersionRepository versionRepository;
    private final ApiSpecificationDocumentRepository documentRepository;
    private final SpecificationValidationService validationService;
    private final SpecificationComparisonService comparisonService;
    private final ObjectMapper objectMapper;

    public ApiProjectService(ApiProjectRepository projectRepository,
                             ApiSpecificationVersionRepository versionRepository,
                             ApiSpecificationDocumentRepository documentRepository,
                             SpecificationValidationService validationService,
                             SpecificationComparisonService comparisonService,
                             ObjectMapper objectMapper) {
        this.projectRepository = projectRepository;
        this.versionRepository = versionRepository;
        this.documentRepository = documentRepository;
        this.validationService = validationService;
        this.comparisonService = comparisonService;
        this.objectMapper = objectMapper;
    }

    public ApiProjectResponse createProject(CreateApiProjectRequest request) {
        if (request == null || request.name() == null || request.name().isBlank()
                || request.name().trim().length() > 120) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Project name is required and must be 120 characters or fewer.");
        }

        return ApiProjectResponse.from(projectRepository.save(new ApiProject(request.name().trim())));
    }

    public List<ApiProjectResponse> listProjects() {
        return projectRepository.findAllByOrderByCreatedAtDesc().stream()
                .map(ApiProjectResponse::from)
                .toList();
    }

    public ApiSpecificationVersionResponse saveVersion(UUID projectId, SaveApiVersionRequest request) {
        ApiProject project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Project not found."));

        if (request == null || request.versionLabel() == null || request.versionLabel().isBlank()
                || request.versionLabel().trim().length() > 80) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Version label is required and must be 80 characters or fewer.");
        }
        if (versionRepository.existsByProject_IdAndVersionLabelIgnoreCase(projectId, request.versionLabel().trim())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "That version label is already used in this project.");
        }

        SpecificationValidationResponse validation = validationService.validate(request.definition());
        if (!validation.valid()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "The API definition is invalid: " + String.join(" ", validation.errors()));
        }

        UUID versionId = UUID.randomUUID();
        ApiSpecificationDocument document = documentRepository.save(new ApiSpecificationDocument(
                projectId, versionId, Document.parse(request.definition().toString())
        ));

        try {
            ApiSpecificationVersion version = versionRepository.saveAndFlush(
                    new ApiSpecificationVersion(versionId, project, request.versionLabel().trim(), document.getId())
            );
            return ApiSpecificationVersionResponse.from(version);
        } catch (DataAccessException failure) {
            // The databases do not share a transaction, so remove the document if its SQL link could not be saved.
            try {
                documentRepository.delete(document);
            } catch (RuntimeException cleanupFailure) {
                failure.addSuppressed(cleanupFailure);
            }
            if (failure instanceof DataIntegrityViolationException) {
                throw new ResponseStatusException(HttpStatus.CONFLICT,
                        "That version label is already used in this project.", failure);
            }
            throw failure;
        }
    }

    public List<ApiSpecificationVersionResponse> listVersions(UUID projectId) {
        requireProject(projectId);
        return versionRepository.findAllByProject_IdOrderByCreatedAtDesc(projectId).stream()
                .map(ApiSpecificationVersionResponse::from)
                .toList();
    }

    public StoredApiSpecificationResponse getVersionDefinition(UUID projectId, UUID versionId) {
        ApiSpecificationVersion version = findVersion(projectId, versionId);
        return new StoredApiSpecificationResponse(versionId, version.getVersionLabel(),
                version.getCreatedAt(), readDefinition(projectId, versionId));
    }

    public SpecificationComparisonResponse compareSavedVersions(UUID projectId,
                                                                 CompareSavedVersionsRequest request) {
        if (request == null || request.oldVersionId() == null || request.newVersionId() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Choose both an earlier version and a newer version to compare.");
        }
        if (request.oldVersionId().equals(request.newVersionId())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Choose two different versions to compare.");
        }

        JsonNode oldDefinition = readDefinition(projectId, request.oldVersionId());
        JsonNode newDefinition = readDefinition(projectId, request.newVersionId());
        return comparisonService.compare(oldDefinition, newDefinition);
    }

    private ApiSpecificationVersion findVersion(UUID projectId, UUID versionId) {
        return versionRepository.findByIdAndProject_Id(versionId, projectId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "API version not found."));
    }

    private JsonNode readDefinition(UUID projectId, UUID versionId) {
        findVersion(projectId, versionId);
        ApiSpecificationDocument document = documentRepository.findByProjectIdAndVersionId(projectId, versionId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                        "The definition document for this version could not be found."));

        try {
            return objectMapper.readTree(document.getDefinition().toJson());
        } catch (JacksonException failure) {
            throw new IllegalStateException("The saved API definition could not be read.", failure);
        }
    }

    private void requireProject(UUID projectId) {
        if (!projectRepository.existsById(projectId)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Project not found.");
        }
    }
}
