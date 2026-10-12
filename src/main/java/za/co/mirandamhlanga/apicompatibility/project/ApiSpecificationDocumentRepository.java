package za.co.mirandamhlanga.apicompatibility.project;

import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.Optional;
import java.util.UUID;

public interface ApiSpecificationDocumentRepository extends MongoRepository<ApiSpecificationDocument, String> {

    Optional<ApiSpecificationDocument> findByProjectIdAndVersionId(UUID projectId, UUID versionId);
}
