package za.co.mirandamhlanga.apicompatibility.project;

import java.time.Instant;
import java.util.UUID;

public record ApiProjectResponse(UUID id, String name, Instant createdAt) {

    public static ApiProjectResponse from(ApiProject project) {
        return new ApiProjectResponse(project.getId(), project.getName(), project.getCreatedAt());
    }
}
