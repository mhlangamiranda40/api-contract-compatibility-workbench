package za.co.mirandamhlanga.apicompatibility.specification;

import java.util.List;

public record SpecificationComparisonResponse(List<ApiChange> changes) {

    public SpecificationComparisonResponse {
        changes = List.copyOf(changes);
    }

    public long breakingChangeCount() {
        return changes.stream().filter(change -> change.severity().equals("BREAKING")).count();
    }
}
