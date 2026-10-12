package za.co.mirandamhlanga.apicompatibility.project;

import java.util.UUID;

public record CompareSavedVersionsRequest(UUID oldVersionId, UUID newVersionId) {
}
