package za.co.mirandamhlanga.apicompatibility.specification;

import java.util.List;

public record SpecificationValidationResponse(boolean valid, List<String> errors) {

    public SpecificationValidationResponse {
        errors = List.copyOf(errors);
    }
}
