package za.co.mirandamhlanga.apicompatibility.specification;

import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import tools.jackson.databind.JsonNode;

@RestController
@RequestMapping("/api/v1/specifications")
public class SpecificationValidationController {

    private final SpecificationValidationService validationService;

    public SpecificationValidationController(SpecificationValidationService validationService) {
        this.validationService = validationService;
    }

    @PostMapping("/validate")
    public SpecificationValidationResponse validate(@RequestBody JsonNode definition) {
        return validationService.validate(definition);
    }
}
