package za.co.mirandamhlanga.apicompatibility.specification;

import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;
import tools.jackson.databind.JsonNode;

@RestController
@RequestMapping("/api/v1/specifications")
public class SpecificationValidationController {

    private final SpecificationValidationService validationService;
    private final SpecificationComparisonService comparisonService;

    public SpecificationValidationController(SpecificationValidationService validationService,
                                             SpecificationComparisonService comparisonService) {
        this.validationService = validationService;
        this.comparisonService = comparisonService;
    }

    @PostMapping("/validate")
    public SpecificationValidationResponse validate(@RequestBody JsonNode definition) {
        return validationService.validate(definition);
    }

    @PostMapping("/compare")
    public SpecificationComparisonResponse compare(@RequestBody SpecificationComparisonRequest request) {
        SpecificationValidationResponse oldResult = validationService.validate(request.oldDefinition());
        SpecificationValidationResponse newResult = validationService.validate(request.newDefinition());
        if (!oldResult.valid() || !newResult.valid()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Both definitions must pass validation before they can be compared.");
        }
        return comparisonService.compare(request.oldDefinition(), request.newDefinition());
    }
}
