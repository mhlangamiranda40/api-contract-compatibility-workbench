package za.co.mirandamhlanga.apicompatibility.project;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import za.co.mirandamhlanga.apicompatibility.specification.SpecificationComparisonResponse;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/projects")
public class ApiProjectController {

    private final ApiProjectService projectService;

    public ApiProjectController(ApiProjectService projectService) {
        this.projectService = projectService;
    }

    @PostMapping
    public ApiProjectResponse createProject(@RequestBody CreateApiProjectRequest request) {
        return projectService.createProject(request);
    }

    @GetMapping
    public List<ApiProjectResponse> listProjects() {
        return projectService.listProjects();
    }

    @PostMapping("/{projectId}/versions")
    public ApiSpecificationVersionResponse saveVersion(@PathVariable UUID projectId,
                                                       @RequestBody SaveApiVersionRequest request) {
        return projectService.saveVersion(projectId, request);
    }

    @GetMapping("/{projectId}/versions")
    public List<ApiSpecificationVersionResponse> listVersions(@PathVariable UUID projectId) {
        return projectService.listVersions(projectId);
    }

    @GetMapping("/{projectId}/versions/{versionId}/definition")
    public StoredApiSpecificationResponse getVersionDefinition(@PathVariable UUID projectId,
                                                               @PathVariable UUID versionId) {
        return projectService.getVersionDefinition(projectId, versionId);
    }

    @PostMapping("/{projectId}/compare")
    public SpecificationComparisonResponse compareVersions(@PathVariable UUID projectId,
                                                           @RequestBody CompareSavedVersionsRequest request) {
        return projectService.compareSavedVersions(projectId, request);
    }
}
