package za.co.mirandamhlanga.apicompatibility.project;

import tools.jackson.databind.JsonNode;

public record SaveApiVersionRequest(String versionLabel, JsonNode definition) {
}
