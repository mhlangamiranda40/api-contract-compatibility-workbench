package za.co.mirandamhlanga.apicompatibility.project;

import org.bson.Document;
import org.springframework.data.annotation.Id;

import java.time.Instant;
import java.util.UUID;

@org.springframework.data.mongodb.core.mapping.Document(collection = "api_specifications")
public class ApiSpecificationDocument {

    @Id
    private String id;

    private UUID projectId;
    private UUID versionId;
    private Document definition;
    private Instant createdAt;

    public ApiSpecificationDocument(UUID projectId, UUID versionId, Document definition) {
        this.projectId = projectId;
        this.versionId = versionId;
        this.definition = definition;
        this.createdAt = Instant.now();
    }

    public String getId() {
        return id;
    }

    public UUID getProjectId() {
        return projectId;
    }

    public UUID getVersionId() {
        return versionId;
    }

    public Document getDefinition() {
        return definition;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }
}
