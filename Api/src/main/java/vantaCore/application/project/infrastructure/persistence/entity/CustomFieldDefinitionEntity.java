package vantaCore.application.project.infrastructure.persistence.entity;

import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OrderColumn;
import jakarta.persistence.Table;
import vantaCore.application.project.domain.vo.CustomFieldDefinition;
import vantaCore.application.project.domain.vo.CustomFieldType;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "project_custom_field_definitions")
public class CustomFieldDefinitionEntity {

    @Id
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "project_id")
    private ProjectEntity project;

    private String name;

    @Enumerated(EnumType.STRING)
    private CustomFieldType type;

    private boolean multiple;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(
        name = "project_custom_field_options",
        joinColumns = @JoinColumn(name = "custom_field_definition_id")
    )
    @OrderColumn(name = "option_order")
    @Column(name = "option_value")
    private List<String> options = new ArrayList<>();

    // Hibernate requires it
    protected CustomFieldDefinitionEntity() {}

    private CustomFieldDefinitionEntity(
        UUID id,
        ProjectEntity project,
        String name,
        CustomFieldType type,
        List<String> options,
        boolean multiple
    ) {
        this.id = id;
        this.project = project;
        this.name = name;
        this.type = type;
        this.options = options;
        this.multiple = multiple;
    }

    public static CustomFieldDefinitionEntity fromDomain(CustomFieldDefinition customFieldDefinition, ProjectEntity project) {
        return new CustomFieldDefinitionEntity(
            customFieldDefinition.id(),
            project,
            customFieldDefinition.name(),
            customFieldDefinition.type(),
            new ArrayList<>(customFieldDefinition.options()),
            customFieldDefinition.multiple()
        );
    }

    public CustomFieldDefinition toDomain() {
        return new CustomFieldDefinition(
            this.id,
            this.name,
            this.type,
            this.options,
            this.multiple
        );
    }
}