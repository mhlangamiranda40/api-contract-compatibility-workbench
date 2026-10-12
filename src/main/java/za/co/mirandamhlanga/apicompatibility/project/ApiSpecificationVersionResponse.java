package za.co.mirandamhlanga.apicompatibility.project;

import java.time.Instant;
import java.util.UUID;

public record ApiSpecificationVersionResponse(UUID id, UUID projectId, String versionLabel, Instant createdAt) {

    public static ApiSpecificationVersionResponse from(ApiSpecificationVersion version) {
        return new ApiSpecificationVersionResponse(
                version.getId(), version.getProject().getId(), version.getVersionLabel(), version.getCreatedAt()
        );
    }
}
