package za.co.mirandamhlanga.apicompatibility.project;

import tools.jackson.databind.JsonNode;

import java.time.Instant;
import java.util.UUID;

public record StoredApiSpecificationResponse(UUID versionId, String versionLabel,
                                             Instant createdAt, JsonNode definition) {
}
