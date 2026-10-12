package za.co.mirandamhlanga.apicompatibility.specification;

import tools.jackson.databind.JsonNode;

public record SpecificationComparisonRequest(JsonNode oldDefinition, JsonNode newDefinition) {
}
