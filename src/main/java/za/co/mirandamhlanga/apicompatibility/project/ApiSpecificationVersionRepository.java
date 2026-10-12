package za.co.mirandamhlanga.apicompatibility.project;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ApiSpecificationVersionRepository extends JpaRepository<ApiSpecificationVersion, UUID> {

    List<ApiSpecificationVersion> findAllByProject_IdOrderByCreatedAtDesc(UUID projectId);

    Optional<ApiSpecificationVersion> findByIdAndProject_Id(UUID id, UUID projectId);

    boolean existsByProject_IdAndVersionLabelIgnoreCase(UUID projectId, String versionLabel);
}
