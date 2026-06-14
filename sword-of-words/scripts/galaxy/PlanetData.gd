class_name PlanetData
extends RefCounted

var id: String = "procedural"
var position: Vector3 = Vector3.ZERO
var size: float = 40.0
var gravity: float = 20.0
var friction: float = 0.6
var biome: int = PlanetBiome.Temperate
var is_override: bool = false
var seed_id: int = 0
var resources: Dictionary = {}

func _init() -> void:
    resources = create_default_resources()

func get_resource_config(resource_type: int) -> ResourcePoolConfig:
    return resources.get(resource_type, ResourcePoolConfig.new())

static func create_starter(
    starter_id: String,
    starter_position: Vector3,
    starter_size: float,
    starter_gravity: float,
    starter_friction: float,
    starter_biome: int
) -> PlanetData:
    var data := PlanetData.new()
    data.id = starter_id
    data.position = starter_position
    data.size = starter_size
    data.gravity = starter_gravity
    data.friction = starter_friction
    data.biome = starter_biome
    data.is_override = true
    data.seed_id = starter_id.hash()
    return data

static func create_default_resources() -> Dictionary:
    return {
        ResourceType.Water: ResourcePoolConfig.new(800.0, 1.6, 0.7),
        ResourceType.Oil: ResourcePoolConfig.new(500.0, 0.8, 0.5),
        ResourceType.Air: ResourcePoolConfig.new(1000.0, 2.2, 0.8),
        ResourceType.Metals: ResourcePoolConfig.new(650.0, 0.6, 0.55),
        ResourceType.Minerals: ResourcePoolConfig.new(700.0, 0.7, 0.6),
    }
