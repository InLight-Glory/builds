class_name ResourceDefinition
extends RefCounted

var id: String = ""
var display_name: String = ""
var base_cost_weight: float = 1.0

func _init(resource_id: String = "", name_value: String = "", cost_weight: float = 1.0) -> void:
    id = resource_id
    display_name = name_value
    base_cost_weight = cost_weight

static func defaults() -> Dictionary:
    return {
        ResourceType.Water: ResourceDefinition.new("water", "Water", 0.6),
        ResourceType.Oil: ResourceDefinition.new("oil", "Oil", 1.0),
        ResourceType.Air: ResourceDefinition.new("air", "Air", 0.8),
        ResourceType.Metals: ResourceDefinition.new("metals", "Metals", 1.2),
        ResourceType.Minerals: ResourceDefinition.new("minerals", "Minerals", 1.1),
    }
