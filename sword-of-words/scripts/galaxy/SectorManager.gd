class_name SectorManager
extends Node

signal sector_loaded(sector: Vector3i)
signal sector_unloaded(sector: Vector3i)

@export var sector_size: float = 1012.0
@export var active_radius_in_sectors: int = 1

var _active_sectors: Dictionary = {}

var active_sector_count: int:
    get:
        return _active_sectors.size()

func world_to_sector(world_position: Vector3) -> Vector3i:
    return Vector3i(
        floori(world_position.x / sector_size),
        floori(world_position.y / sector_size),
        floori(world_position.z / sector_size)
    )

func update_active_sectors(player_position: Vector3) -> void:
    var center := world_to_sector(player_position)
    var next_active := _build_radius_set(center, active_radius_in_sectors)

    for sector in next_active.keys():
        if _active_sectors.has(sector):
            continue

        _active_sectors[sector] = true
        sector_loaded.emit(sector)

    var to_unload: Array[Vector3i] = []
    for sector in _active_sectors.keys():
        if not next_active.has(sector):
            to_unload.append(sector)

    for sector in to_unload:
        _active_sectors.erase(sector)
        sector_unloaded.emit(sector)

func _build_radius_set(center: Vector3i, radius: int) -> Dictionary:
    var set := {}

    for x in range(-radius, radius + 1):
        for y in range(-radius, radius + 1):
            for z in range(-radius, radius + 1):
                set[Vector3i(center.x + x, center.y + y, center.z + z)] = true

    return set
