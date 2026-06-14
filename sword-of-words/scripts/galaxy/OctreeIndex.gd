class_name OctreeIndex
extends RefCounted

var _cell_size: float = 128.0
var _cell_to_planet_ids: Dictionary = {}
var _planet_positions: Dictionary = {}

func _init(cell_size: float = 128.0) -> void:
    _cell_size = maxf(1.0, cell_size)

func clear() -> void:
    _cell_to_planet_ids.clear()
    _planet_positions.clear()

func insert(planet_id: int, position: Vector3) -> void:
    remove(planet_id)

    var cell := _to_cell(position)
    if not _cell_to_planet_ids.has(cell):
        _cell_to_planet_ids[cell] = {}

    var ids: Dictionary = _cell_to_planet_ids[cell]
    ids[planet_id] = true
    _planet_positions[planet_id] = position

func remove(planet_id: int) -> void:
    if not _planet_positions.has(planet_id):
        return

    var previous_position: Vector3 = _planet_positions[planet_id]
    var previous_cell := _to_cell(previous_position)
    if _cell_to_planet_ids.has(previous_cell):
        var ids: Dictionary = _cell_to_planet_ids[previous_cell]
        ids.erase(planet_id)
        if ids.is_empty():
            _cell_to_planet_ids.erase(previous_cell)

    _planet_positions.erase(planet_id)

func query_range(center: Vector3, radius: float) -> Array[int]:
    var results: Array[int] = []
    var radius_sq := radius * radius

    var min_x: int = floori((center.x - radius) / _cell_size)
    var min_y: int = floori((center.y - radius) / _cell_size)
    var min_z: int = floori((center.z - radius) / _cell_size)

    var max_x: int = floori((center.x + radius) / _cell_size)
    var max_y: int = floori((center.y + radius) / _cell_size)
    var max_z: int = floori((center.z + radius) / _cell_size)

    for x in range(min_x, max_x + 1):
        for y in range(min_y, max_y + 1):
            for z in range(min_z, max_z + 1):
                var cell := Vector3i(x, y, z)
                if not _cell_to_planet_ids.has(cell):
                    continue

                var ids: Dictionary = _cell_to_planet_ids[cell]
                for id in ids.keys():
                    if _planet_positions.has(id):
                        var pos: Vector3 = _planet_positions[id]
                        if center.distance_squared_to(pos) <= radius_sq:
                            results.append(id)

    return results

func _to_cell(position: Vector3) -> Vector3i:
    return Vector3i(
        floori(position.x / _cell_size),
        floori(position.y / _cell_size),
        floori(position.z / _cell_size)
    )
