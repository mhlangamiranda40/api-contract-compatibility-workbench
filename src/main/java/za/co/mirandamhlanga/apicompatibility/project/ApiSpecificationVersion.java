package za.co.mirandamhlanga.apicompatibility.project;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "api_specification_versions", uniqueConstraints = {
        @UniqueConstraint(name = "uk_project_version_label", columnNames = {"project_id", "version_label"})
})
public class ApiSpecificationVersion {

    @Id
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "project_id", nullable = false)
    private ApiProject project;

    @Column(name = "version_label", nullable = false, length = 80)
    private String versionLabel;

    @Column(name = "mongo_document_id", nullable = false, unique = true)
    private String mongoDocumentId;

    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    protected ApiSpecificationVersion() {
    }

    public ApiSpecificationVersion(UUID id, ApiProject project, String versionLabel, String mongoDocumentId) {
        this.id = id;
        this.project = project;
        this.versionLabel = versionLabel;
        this.mongoDocumentId = mongoDocumentId;
        this.createdAt = Instant.now();
    }

    public UUID getId() {
        return id;
    }

    public ApiProject getProject() {
        return project;
    }

    public String getVersionLabel() {
        return versionLabel;
    }

    public String getMongoDocumentId() {
        return mongoDocumentId;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }
}
