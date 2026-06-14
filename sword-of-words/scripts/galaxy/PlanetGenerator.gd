class_name PlanetGenerator
extends RefCounted

static func generate_planet(
    galaxy_seed: int,
    sector: Vector3i,
    local_index: int,
    sector_size: float
) -> PlanetData:
    var seed := _mix_seed(galaxy_seed, sector, local_index)

    var rng := RandomNumberGenerator.new()
    rng.seed = seed

    var sector_origin := Vector3(
        sector.x * sector_size,
        sector.y * sector_size,
        sector.z * sector_size
    )

    var offset := Vector3(
        rng.randf_range(0.0, sector_size),
        rng.randf_range(0.0, sector_size),
        rng.randf_range(0.0, sector_size)
    )

    var biome := rng.randi_range(PlanetBiome.Temperate, PlanetBiome.Metallic)

    var data := PlanetData.new()
    data.id = "p_%d_%d_%d_%d" % [sector.x, sector.y, sector.z, local_index]
    data.position = sector_origin + offset
    data.size = rng.randf_range(18.0, 62.0)
    data.gravity = rng.randf_range(14.0, 28.0)
    data.friction = rng.randf_range(0.45, 0.9)
    data.biome = biome
    data.is_override = false
    data.seed_id = int(seed & 0x7fffffff)

    _apply_resource_bias(data, rng)
    return data

static func _apply_resource_bias(data: PlanetData, rng: RandomNumberGenerator) -> void:
    for resource_type in data.resources.keys():
        var cfg: ResourcePoolConfig = data.resources[resource_type]

        var biome_bias := 1.0
        if data.biome == PlanetBiome.Oceanic and resource_type == ResourceType.Water:
            biome_bias = 1.35
        elif data.biome == PlanetBiome.Arid and resource_type == ResourceType.Oil:
            biome_bias = 1.25
        elif data.biome == PlanetBiome.Volcanic and resource_type == ResourceType.Metals:
            biome_bias = 1.3
        elif data.biome == PlanetBiome.Metallic and resource_type == ResourceType.Metals:
            biome_bias = 1.45
        elif data.biome == PlanetBiome.Frozen and resource_type == ResourceType.Air:
            biome_bias = 1.2

        var variance := rng.randf_range(0.75, 1.25)
        cfg.abundance = clampf(cfg.abundance * biome_bias * variance, 0.05, 1.0)
        cfg.max *= clampf(variance * biome_bias, 0.5, 2.0)

static func _mix_seed(galaxy_seed: int, sector: Vector3i, local_index: int) -> int:
    var value := int(galaxy_seed)
    value ^= int((sector.x * 73856093) ^ (sector.y * 19349663) ^ (sector.z * 83492791))
    value ^= int(local_index * 2654435761)
    value = int((value * 1099511628211) & 0x7fffffffffffffff)
    value ^= value >> 33
    return abs(value)
