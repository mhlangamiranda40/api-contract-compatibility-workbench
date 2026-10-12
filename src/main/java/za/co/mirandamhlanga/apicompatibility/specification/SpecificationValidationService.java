package za.co.mirandamhlanga.apicompatibility.specification;

import org.springframework.stereotype.Service;
import tools.jackson.databind.JsonNode;

import java.util.ArrayList;
import java.util.List;

@Service
public class SpecificationValidationService {

    public SpecificationValidationResponse validate(JsonNode definition) {
        // Return all field issues together so a user can fix them in one pass.
        List<String> errors = new ArrayList<>();

        if (definition == null || !definition.isObject()) {
            errors.add("The API definition must be a JSON object.");
            return new SpecificationValidationResponse(false, errors);
        }

        JsonNode openApiVersion = definition.get("openapi");
        if (!isNonBlankText(openApiVersion) || !openApiVersion.asString().startsWith("3.")) {
            errors.add("The 'openapi' field must contain an OpenAPI 3 version, such as '3.0.3'.");
        }

        JsonNode info = definition.get("info");
        if (info == null || !info.isObject()) {
            errors.add("The 'info' field must be an object.");
        } else {
            if (!isNonBlankText(info.get("title"))) {
                errors.add("The API title is required in 'info.title'.");
            }
            if (!isNonBlankText(info.get("version"))) {
                errors.add("The API version is required in 'info.version'.");
            }
        }

        JsonNode paths = definition.get("paths");
        if (paths == null || !paths.isObject()) {
            errors.add("The 'paths' field must be an object.");
        }

        return new SpecificationValidationResponse(errors.isEmpty(), errors);
    }

    private boolean isNonBlankText(JsonNode value) {
        return value != null && value.isString() && !value.asString().isBlank();
    }
}
