package za.co.mirandamhlanga.apicompatibility.specification;

import org.springframework.stereotype.Service;
import tools.jackson.databind.JsonNode;

import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import java.util.TreeSet;

@Service
public class SpecificationComparisonService {

    private static final Set<String> HTTP_METHODS = Set.of(
            "get", "post", "put", "patch", "delete", "options", "head", "trace"
    );

    public SpecificationComparisonResponse compare(JsonNode oldDefinition, JsonNode newDefinition) {
        List<ApiChange> changes = new ArrayList<>();
        JsonNode oldPaths = oldDefinition.path("paths");
        JsonNode newPaths = newDefinition.path("paths");

        Set<String> allPaths = new TreeSet<>();
        addFieldNames(allPaths, oldPaths);
        addFieldNames(allPaths, newPaths);

        for (String path : allPaths) {
            JsonNode oldPathItem = oldPaths.path(path);
            JsonNode newPathItem = newPaths.path(path);
            Set<String> allMethods = new TreeSet<>();
            addOperationNames(allMethods, oldPathItem);
            addOperationNames(allMethods, newPathItem);

            for (String method : allMethods) {
                boolean existedBefore = isOperation(oldPathItem, method);
                boolean existsNow = isOperation(newPathItem, method);
                String location = method.toUpperCase() + " " + path;

                if (existedBefore && !existsNow) {
                    changes.add(new ApiChange("BREAKING", location,
                            "This operation was removed from the new definition."));
                } else if (!existedBefore && existsNow) {
                    changes.add(new ApiChange("ADDITION", location,
                            "This operation was added to the new definition."));
                } else {
                    compareRequiredParameters(oldPathItem, newPathItem, method, location, changes);
                }
            }
        }

        if (changes.isEmpty()) {
            changes.add(new ApiChange("UNCHANGED", "API", "No route or required-parameter changes were found."));
        }

        return new SpecificationComparisonResponse(changes);
    }

    private void compareRequiredParameters(JsonNode oldPathItem, JsonNode newPathItem,
                                           String method, String location, List<ApiChange> changes) {
        Set<String> oldRequired = requiredParameters(oldPathItem, method);
        Set<String> newRequired = requiredParameters(newPathItem, method);
        newRequired.removeAll(oldRequired);

        for (String parameter : newRequired) {
            changes.add(new ApiChange("BREAKING", location,
                    "A required parameter was added: " + parameter + "."));
        }
    }

    private Set<String> requiredParameters(JsonNode pathItem, String method) {
        Set<String> required = new TreeSet<>();
        addRequiredParameters(required, pathItem.path("parameters"));
        addRequiredParameters(required, pathItem.path(method).path("parameters"));
        return required;
    }

    private void addRequiredParameters(Set<String> required, JsonNode parameters) {
        if (!parameters.isArray()) {
            return;
        }

        for (JsonNode parameter : parameters) {
            if (parameter.path("required").asBoolean(false)) {
                String name = parameter.path("name").asString("");
                String location = parameter.path("in").asString("");
                if (!name.isBlank() && !location.isBlank()) {
                    required.add(location + ":" + name);
                }
            }
        }
    }

    private void addFieldNames(Set<String> names, JsonNode node) {
        if (node.isObject()) {
            names.addAll(node.propertyNames());
        }
    }

    private void addOperationNames(Set<String> names, JsonNode pathItem) {
        if (!pathItem.isObject()) {
            return;
        }

        for (String field : pathItem.propertyNames()) {
            if (HTTP_METHODS.contains(field.toLowerCase())) {
                names.add(field.toLowerCase());
            }
        }
    }

    private boolean isOperation(JsonNode pathItem, String method) {
        return pathItem.path(method).isObject();
    }
}
