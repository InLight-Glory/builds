class_name GalaxyManager
extends Node3D

@export var PlayerPath: NodePath = "Player"
@export var SectorManagerPath: NodePath = "SectorManager"
@export var PlanetContainerPath: NodePath = "GeneratedPlanets"
@export var PlanetAPath: NodePath = "PlanetA"
@export var PlanetBPath: NodePath = "PlanetB"
@export var PlanetCPath: NodePath = "PlanetC"

@export_file("*.json") var PlanetOverridesPath: String = "res://data/planet_overrides.json"
@export_file("*.json") var GalaxyGlobalConfigPath: String = "res://data/galaxy_global.json"

@export var GalaxySeed: int = 120426
@export var VirtualPlanetTarget: int = 1000000
@export var PlanetsPerSector: int = 20
@export var MaxLoadedPlanetNodes: int = 240
@export var MaxCachedSectors: int = 180
@export var PlanetIndexCellSize: float = 128.0
@export var DiscoveryDistancePadding: float = 26.0
@export var NeighborPlanetDistance: float = 780.0
@export var NeighborVisibilityHops: int = 2
@export var FirstPersonArcDegrees: float = 120.0
@export var StarterHomePlanetSize: float = 180.0
@export var StarterNeighborPlanetSize: float = 62.0
@export var StarterNeighborArcDegrees: float = 120.0
@export var VisibilityNeighborPadding: float = 48.0
@export var ViewDistance: float = 2000.0
@export var MinimumPlanetSpacing: float = 1500.0
@export var HomePlanetRockCount: int = 48
@export var HomePlanetRockMinScale: float = 2.0
@export var HomePlanetRockMaxScale: float = 5.2
@export var HomePlanetRockSpacing: float = 12.0
@export var HomePlanetRockAvoidSpawnDot: float = 0.75
@export var InitialSpawnAutoTraverseHeight: float = 320.0

var _player: PlayerController
var _sector_manager: SectorManager
var _planet_container: Node3D
var _home_planet: PlanetNode

var _planet_index: OctreeIndex
var _planet_scene: PackedScene

var _runtime_planet_id_counter := 1
var _max_sector_coordinate := 1

var _rng := RandomNumberGenerator.new()
var _starter_planet_positions: Array[Vector3] = []
var _starter_planet_ids: Array[String] = []

var _loaded_sectors: Dictionary = {}
var _sector_data_cache: Dictionary = {}
var _sector_cache_order: Array[Vector3i] = []

var _overrides_by_sector: Dictionary = {}

var _runtime_id_to_record: Dictionary = {}
var _record_by_node: Dictionary = {}
var _record_by_planet_id: Dictionary = {}

var _discovered_planet_ids: Dictionary = {}
var _visibility_refresh_countdown := 0.0
var _last_visibility_anchor_id := ""
var _initial_home_autotraverse_pending := false
var _initial_home_autotraverse_attempts := 0

var DiscoveredPlanetCount: int:
	get:
		return _discovered_planet_ids.size()

var LoadedPlanetCount: int:
	get:
		return _runtime_id_to_record.size()

func GetDiscoveredPlanetIds() -> PackedStringArray:
	var ids := PackedStringArray(_discovered_planet_ids.keys())
	ids.sort()
	return ids

func GetStarterPlanets() -> Array[Dictionary]:
	var result: Array[Dictionary] = []
	for planet_id in _starter_planet_ids:
		if not _record_by_planet_id.has(planet_id):
			continue
		var record: Dictionary = _record_by_planet_id[planet_id]
		var data: PlanetData = record["data"]
		result.append({
			"id": data.id,
			"biome": data.biome,
			"size": data.size,
			"gravity": data.gravity,
			"friction": data.friction,
		})
	return result

func BeginGameOnPlanet(planet_id: String) -> void:
	if _player == null:
		return

	if not _record_by_planet_id.has(planet_id):
		DevLog.warn("BeginGameOnPlanet: unknown planet id '%s'" % planet_id)
		return

	var record: Dictionary = _record_by_planet_id[planet_id]
	var planet: PlanetNode = record["node"]

	if not is_instance_valid(planet):
		return

	var landing_radius: float = planet.Data.size + maxf(0.0, _player.SurfaceHoverOffset)
	var spawn_radius: float = landing_radius + maxf(0.0, InitialSpawnAutoTraverseHeight)
	_player.global_position = planet.global_position + (Vector3.UP * spawn_radius)
	_player.SetCurrentPlanet(planet, planet.Data.gravity)
	_player.RegisterGravitySource(planet, planet.Data.gravity)
	_player.SetTraversalLock(false)

	_home_planet = planet
	_discovered_planet_ids[planet_id] = true
	_initial_home_autotraverse_pending = true
	_initial_home_autotraverse_attempts = 0
	_try_start_initial_home_autotraverse()

	DevLog.info("Game starting on planet: %s" % planet_id)

func GetCurrentNeighborPlanetIds() -> PackedStringArray:
	var current: PlanetNode = _player.CurrentPlanet if _player != null else null
	if current == null:
		return PackedStringArray()

	var neighbors := PackedStringArray()
	for record in _runtime_id_to_record.values():
		var node: PlanetNode = record["node"]
		if not is_instance_valid(node) or node == current:
			continue

		if _are_neighbor_planets(current, node):
			neighbors.append(str(record["data"].id))

	neighbors.sort()
	return neighbors

func _ready() -> void:
	_player = get_node_or_null(PlayerPath)
	_sector_manager = get_node_or_null(SectorManagerPath)

	_load_galaxy_global_config()

	_planet_container = get_node_or_null(PlanetContainerPath)
	if _planet_container == null:
		_planet_container = Node3D.new()
		_planet_container.name = "GeneratedPlanets"
		add_child(_planet_container)

	_planet_scene = load("res://scenes/planet/Planet.tscn")
	_planet_index = OctreeIndex.new(PlanetIndexCellSize)
	_rng.seed = abs(GalaxySeed)

	DevLog.info(
        "Galaxy ready. Seed=%d, TargetPlanets=%d, NeighborDistance=%.1f, Hops=%d"
		% [GalaxySeed, VirtualPlanetTarget, NeighborPlanetDistance, NeighborVisibilityHops]
	)

	_compute_virtual_bounds()
	_setup_starter_planets()
	_load_planet_overrides()

	if _sector_manager != null:
		_sector_manager.sector_loaded.connect(_on_sector_loaded)
		_sector_manager.sector_unloaded.connect(_on_sector_unloaded)

	if _player != null:
		# Park player above origin; planet selection overlay will call BeginGameOnPlanet
		_player.global_position = Vector3(0, 600, 0)
		_player.SetTraversalLock(true)

	if _player != null and _sector_manager != null:
		_sector_manager.update_active_sectors(_player.global_position)

func _exit_tree() -> void:
	if _sector_manager != null:
		if _sector_manager.sector_loaded.is_connected(_on_sector_loaded):
			_sector_manager.sector_loaded.disconnect(_on_sector_loaded)
		if _sector_manager.sector_unloaded.is_connected(_on_sector_unloaded):
			_sector_manager.sector_unloaded.disconnect(_on_sector_unloaded)

func _process(delta: float) -> void:
	_try_start_initial_home_autotraverse()

	if _player == null or _sector_manager == null:
		return

	_sector_manager.update_active_sectors(_player.global_position)
	_update_discovery_from_proximity()
	_apply_neighbor_hop_visibility(delta)

func _try_start_initial_home_autotraverse() -> void:
	if not _initial_home_autotraverse_pending:
		return

	if _player == null or _home_planet == null:
		return

	var traversal: TraversalSystem = _player.get_node_or_null("TraversalSystem")
	if traversal == null:
		return

	if traversal.IsTraversing:
		_initial_home_autotraverse_pending = false
		return

	var started: bool = traversal.StartAutoTraverseToPlanet(_home_planet, false, true, true)
	if started:
		_initial_home_autotraverse_pending = false
		DevLog.info("Initial home auto-traverse engaged.")
		return

	_initial_home_autotraverse_attempts += 1
	if _initial_home_autotraverse_attempts >= 180:
		_initial_home_autotraverse_pending = false
		DevLog.warn("Initial home auto-traverse could not start. Falling back to gravity descent.")

func IsPlanetDiscovered(planet: PlanetNode) -> bool:
	if planet == null:
		return false

	if not _record_by_node.has(planet):
		return false

	var record: Dictionary = _record_by_node[planet]
	return _discovered_planet_ids.has(record["data"].id)

func MarkDiscovered(planet: PlanetNode) -> void:
	if planet == null:
		return

	if _record_by_node.has(planet):
		var record: Dictionary = _record_by_node[planet]
		_discovered_planet_ids[record["data"].id] = true

func TryPickNearbyUndiscoveredPlanet(origin: Vector3, min_range: float, max_range: float) -> PlanetNode:
	if _planet_index == null:
		return null

	var min_range_sq := min_range * min_range
	var max_range_sq := max_range * max_range

	var candidates: Array[Dictionary] = []
	var runtime_ids: Array[int] = _planet_index.query_range(origin, max_range)

	for runtime_id in runtime_ids:
		if not _runtime_id_to_record.has(runtime_id):
			continue

		var record: Dictionary = _runtime_id_to_record[runtime_id]
		var node: PlanetNode = record["node"]
		if not is_instance_valid(node):
			continue

		if _discovered_planet_ids.has(record["data"].id):
			continue

		var distance_sq := origin.distance_squared_to(node.global_position)
		if distance_sq < min_range_sq or distance_sq > max_range_sq:
			continue

		candidates.append(record)

	if candidates.is_empty():
		return null

	var index := _rng.randi_range(0, candidates.size() - 1)
	return candidates[index]["node"]

func TryInjectTimedResourceEvent(
	event_id: String,
	target_planet: PlanetNode,
	resource_type: int,
	amount: float,
	duration_seconds: float
) -> bool:
	if not _record_by_node.has(target_planet):
		return false

	var pool: PlanetResourcePool = target_planet.get_node_or_null("ResourcePool")
	if pool == null:
		return false

	return pool.AddTimedResourceEvent(event_id, resource_type, amount, duration_seconds)

func PlanetHasActiveTimedEvent(planet: PlanetNode) -> bool:
	if planet == null:
		return false

	var pool: PlanetResourcePool = planet.get_node_or_null("ResourcePool")
	return pool != null and pool.ActiveTimedEventCount > 0

func _compute_virtual_bounds() -> void:
	var required_sectors: float = ceil(float(VirtualPlanetTarget) / maxf(1.0, float(PlanetsPerSector)))
	var side_length: float = ceil(pow(required_sectors, 1.0 / 3.0))
	_max_sector_coordinate = maxi(1, int(ceil((side_length - 1.0) * 0.5)))

func _setup_starter_planets() -> void:
	var planet_a: PlanetNode = get_node_or_null(PlanetAPath)
	var planet_b: PlanetNode = get_node_or_null(PlanetBPath)
	var planet_c: PlanetNode = get_node_or_null(PlanetCPath)

	var half_arc := StarterNeighborArcDegrees * 0.5
	var left_neighbor_pos := _build_arc_position(-half_arc, NeighborPlanetDistance, NeighborPlanetDistance * 0.08)
	var right_neighbor_pos := _build_arc_position(half_arc, NeighborPlanetDistance, -NeighborPlanetDistance * 0.06)

	_configure_starter_planet(
		planet_a,
		"home-temperate",
		Vector3.ZERO,
		StarterHomePlanetSize,
		24.0,
		0.74,
		PlanetBiome.Temperate
	)

	_configure_starter_planet(
		planet_b,
		"arid-mining",
		left_neighbor_pos,
		StarterNeighborPlanetSize,
		20.0,
		0.62,
		PlanetBiome.Arid
	)

	_configure_starter_planet(
		planet_c,
		"oceanic-air",
		right_neighbor_pos,
		StarterNeighborPlanetSize,
		20.0,
		0.68,
		PlanetBiome.Oceanic
	)

	if planet_a != null:
		_home_planet = planet_a

	_create_supplemental_starter_planet(
		"relay-west",
		_build_arc_position(-half_arc, NeighborPlanetDistance * 2.0, NeighborPlanetDistance * 0.16),
		StarterNeighborPlanetSize * 0.82,
		PlanetBiome.Volcanic
	)

	_create_supplemental_starter_planet(
		"relay-east",
		_build_arc_position(half_arc, NeighborPlanetDistance * 2.0, -NeighborPlanetDistance * 0.12),
		StarterNeighborPlanetSize * 0.84,
		PlanetBiome.Frozen
	)

	_spawn_home_planet_rocks()

	DevLog.info("Starter planets configured from galaxy global settings.")

func _spawn_home_planet_rocks() -> void:
	if _home_planet == null:
		return

	if HomePlanetRockCount <= 0:
		return

	var rocks_root: Node3D = _home_planet.get_node_or_null("Rocks")
	if rocks_root == null:
		rocks_root = Node3D.new()
		rocks_root.name = "Rocks"
		_home_planet.add_child(rocks_root)
	else:
		for existing in rocks_root.get_children():
			existing.queue_free()

	var rock_mesh := SphereMesh.new()
	rock_mesh.radius = 1.0
	rock_mesh.height = 2.0

	var rock_shape := SphereShape3D.new()
	rock_shape.radius = 1.0

	var rock_material := StandardMaterial3D.new()
	rock_material.albedo_color = Color("6f746f")
	rock_material.roughness = 1.0
	rock_material.metallic = 0.0

	var planet_radius: float = _home_planet.Data.size
	var placed_positions: Array[Vector3] = []
	var placed_scales: Array[float] = []
	var placed_count: int = 0
	var max_attempts: int = HomePlanetRockCount * 20

	for _attempt in range(max_attempts):
		if placed_count >= HomePlanetRockCount:
			break

		var normal := Vector3(
			_rng.randf_range(-1.0, 1.0),
			_rng.randf_range(-1.0, 1.0),
			_rng.randf_range(-1.0, 1.0)
		)

		if normal.length_squared() < 0.0001:
			continue

		normal = normal.normalized()
		if normal.dot(Vector3.UP) > HomePlanetRockAvoidSpawnDot:
			continue

		var base_scale: float = _rng.randf_range(HomePlanetRockMinScale, HomePlanetRockMaxScale)
		var y_scale: float = base_scale * _rng.randf_range(0.55, 1.5)
		var pos := normal * planet_radius

		var too_close := false
		for i in range(placed_positions.size()):
			var required: float = HomePlanetRockSpacing + ((base_scale + placed_scales[i]) * 0.6)
			if pos.distance_squared_to(placed_positions[i]) < required * required:
				too_close = true
				break

		if too_close:
			continue

		var rock_body := StaticBody3D.new()
		rock_body.name = "Rock_%d" % placed_count

		var mesh_instance := MeshInstance3D.new()
		mesh_instance.mesh = rock_mesh
		mesh_instance.material_override = rock_material
		rock_body.add_child(mesh_instance)

		var collision := CollisionShape3D.new()
		collision.shape = rock_shape
		rock_body.add_child(collision)

		var up_dir: Vector3 = normal
		var tangent: Vector3 = up_dir.cross(Vector3.FORWARD)
		if tangent.length_squared() < 0.0001:
			tangent = up_dir.cross(Vector3.RIGHT)
		tangent = tangent.normalized()
		var forward: Vector3 = tangent.rotated(up_dir, _rng.randf_range(0.0, TAU))

		rock_body.transform = Transform3D(Basis.looking_at(forward, up_dir), pos)
		rock_body.scale = Vector3(
			base_scale * _rng.randf_range(0.7, 1.35),
			y_scale,
			base_scale * _rng.randf_range(0.7, 1.35)
		)

		rocks_root.add_child(rock_body)

		placed_positions.append(pos)
		placed_scales.append(base_scale)
		placed_count += 1

	DevLog.info("Home planet rocks spawned: %d" % placed_count)

func _create_supplemental_starter_planet(id: String, position: Vector3, size: float, biome: int) -> void:
	if _planet_scene == null or _planet_container == null:
		return

	var node: PlanetNode = _planet_scene.instantiate()
	if node == null:
		return

	_planet_container.add_child(node)
	_configure_starter_planet(node, id, position, size, 18.0, 0.60, biome)

func _build_arc_position(angle_degrees: float, radius: float, y_offset: float) -> Vector3:
	var angle_radians := deg_to_rad(angle_degrees)
	var x := sin(angle_radians) * radius
	var z := -cos(angle_radians) * radius
	return Vector3(x, y_offset, z)

func _configure_starter_planet(
	planet: PlanetNode,
	id: String,
	position: Vector3,
	size: float,
	gravity: float,
	friction: float,
	biome: int
) -> void:
	if planet == null:
		return

	var data := PlanetData.create_starter(id, position, size, gravity, friction, biome)
	planet.Initialize(data)

	_starter_planet_positions.append(position)
	_starter_planet_ids.append(id)

	var sector: Vector3i = _world_to_sector(position, _sector_manager.sector_size if _sector_manager != null else 512.0)
	_register_loaded_planet(planet, _clone_planet_data(data), sector, false)

	DevLog.info("Registered starter planet: %s @ %s (size %.1f)" % [id, position, size])

func _register_loaded_planet(planet: PlanetNode, data: PlanetData, sector: Vector3i, generated: bool) -> void:
	var stable_planet_id := data.id
	while _record_by_planet_id.has(stable_planet_id):
		stable_planet_id = "%s_%d" % [data.id, _runtime_planet_id_counter]

	data.id = stable_planet_id

	var record := {
		"runtime_id": _runtime_planet_id_counter,
		"data": data,
		"node": planet,
		"sector": sector,
		"is_generated": generated,
	}

	_runtime_planet_id_counter += 1

	_runtime_id_to_record[record["runtime_id"]] = record
	_record_by_node[planet] = record
	_record_by_planet_id[data.id] = record

	if _planet_index != null:
		_planet_index.insert(record["runtime_id"], planet.global_position)

func _unregister_loaded_planet(record: Dictionary, free_node: bool) -> void:
	_runtime_id_to_record.erase(record["runtime_id"])
	_record_by_node.erase(record["node"])
	_record_by_planet_id.erase(record["data"].id)

	if _planet_index != null:
		_planet_index.remove(record["runtime_id"])

	var node: PlanetNode = record["node"]
	if free_node and is_instance_valid(node):
		node.queue_free()

func _on_sector_loaded(sector: Vector3i) -> void:
	if not _is_inside_virtual_bounds(sector):
		return

	if _loaded_sectors.has(sector):
		return

	var sector_data: Array[PlanetData] = _get_or_create_sector_data(sector)
	var loaded_records: Array[Dictionary] = []

	var available_slots: int = maxi(0, MaxLoadedPlanetNodes - _runtime_id_to_record.size())
	if available_slots == 0:
		_loaded_sectors[sector] = loaded_records
		return

	for planet_data in sector_data:
		if available_slots <= 0:
			break

		var record := _try_instantiate_planet(planet_data, sector)
		if record.is_empty():
			continue

		loaded_records.append(record)
		available_slots -= 1

	_loaded_sectors[sector] = loaded_records

	if not loaded_records.is_empty():
		DevLog.info("Sector loaded %s with %d planets." % [sector, loaded_records.size()])

func _on_sector_unloaded(sector: Vector3i) -> void:
	if not _loaded_sectors.has(sector):
		return

	var records: Array = _loaded_sectors[sector]
	for record in records:
		_unregister_loaded_planet(record, bool(record["is_generated"]))

	_loaded_sectors.erase(sector)

	if not records.is_empty():
		DevLog.info("Sector unloaded %s with %d planets." % [sector, records.size()])

func _try_instantiate_planet(planet_data: PlanetData, sector: Vector3i) -> Dictionary:
	if _planet_scene == null:
		return {}

	var planet_node: PlanetNode = _planet_scene.instantiate()
	if planet_node == null:
		return {}

	if _planet_container != null:
		_planet_container.add_child(planet_node)
	else:
		add_child(planet_node)

	var runtime_data := _clone_planet_data(planet_data)
	planet_node.Initialize(runtime_data)
	_register_loaded_planet(planet_node, runtime_data, sector, true)

	return _record_by_node[planet_node]

func _get_or_create_sector_data(sector: Vector3i) -> Array[PlanetData]:
	if _sector_data_cache.has(sector):
		_touch_sector_cache(sector)
		return _sector_data_cache[sector]

	var built := _build_sector_data(sector)
	_sector_data_cache[sector] = built
	_touch_sector_cache(sector)
	_evict_sector_cache_if_needed()
	return built

func _touch_sector_cache(sector: Vector3i) -> void:
	_sector_cache_order.erase(sector)
	_sector_cache_order.append(sector)

func _evict_sector_cache_if_needed() -> void:
	while _sector_data_cache.size() > MaxCachedSectors:
		var evicted := false

		for i in range(_sector_cache_order.size()):
			var sector := _sector_cache_order[i]
			if _loaded_sectors.has(sector):
				continue

			_sector_cache_order.remove_at(i)
			_sector_data_cache.erase(sector)
			evicted = true
			break

		if not evicted:
			break

func _build_sector_data(sector: Vector3i) -> Array[PlanetData]:
	var planets: Array[PlanetData] = []

	if _overrides_by_sector.has(sector):
		for override_data in _overrides_by_sector[sector]:
			planets.append(_clone_planet_data(override_data))

	var procedural_target: int = maxi(0, PlanetsPerSector - planets.size())
	if sector == Vector3i.ZERO:
		procedural_target = 0

	var generated_count: int = 0
	var local_index: int = 0
	var max_attempts: int = maxi(24, procedural_target * 20)
	var sector_size: float = _sector_manager.sector_size if _sector_manager != null else 512.0

	while generated_count < procedural_target and local_index < max_attempts:
		var generated: PlanetData = PlanetGenerator.generate_planet(GalaxySeed, sector, local_index, sector_size)
		local_index += 1

		if _is_near_starter_planet(generated.position, maxf(140.0, MinimumPlanetSpacing)):
			continue

		if not _is_spaced_from_planet_data(generated, planets, MinimumPlanetSpacing):
			continue

		if not _is_spaced_from_loaded_planets(generated, MinimumPlanetSpacing):
			continue

		planets.append(generated)
		generated_count += 1

	return planets

func _is_inside_virtual_bounds(sector: Vector3i) -> bool:
	return (
		abs(sector.x) <= _max_sector_coordinate
		and abs(sector.y) <= _max_sector_coordinate
		and abs(sector.z) <= _max_sector_coordinate
	)

func _is_near_starter_planet(position: Vector3, radius: float) -> bool:
	var radius_sq := radius * radius
	for starter in _starter_planet_positions:
		if starter.distance_squared_to(position) <= radius_sq:
			return true

	return false

func _is_spaced_from_planet_data(candidate: PlanetData, existing: Array[PlanetData], spacing: float) -> bool:
	var base_spacing: float = maxf(0.0, spacing)

	for i in range(existing.size()):
		var other: PlanetData = existing[i]
		var required: float = base_spacing + ((candidate.size + other.size) * 0.5)
		if candidate.position.distance_squared_to(other.position) < required * required:
			return false

	return true

func _is_spaced_from_loaded_planets(candidate: PlanetData, spacing: float) -> bool:
	var base_spacing: float = maxf(0.0, spacing)

	for record in _runtime_id_to_record.values():
		var node: PlanetNode = record["node"]
		if not is_instance_valid(node):
			continue

		var other_data: PlanetData = record["data"]
		var required: float = base_spacing + ((candidate.size + other_data.size) * 0.5)
		if candidate.position.distance_squared_to(node.global_position) < required * required:
			return false

	return true

func _update_discovery_from_proximity() -> void:
	if _player == null:
		return

	var player_pos: Vector3 = _player.global_position

	for record in _runtime_id_to_record.values():
		var node: PlanetNode = record["node"]
		if not is_instance_valid(node):
			continue

		var planet_data: PlanetData = record["data"]
		var discovery_range: float = planet_data.size + DiscoveryDistancePadding
		if player_pos.distance_squared_to(node.global_position) <= discovery_range * discovery_range:
			_discovered_planet_ids[planet_data.id] = true

func _load_galaxy_global_config() -> void:
	if not FileAccess.file_exists(GalaxyGlobalConfigPath):
		push_warning("Galaxy global config not found: %s. Using defaults." % GalaxyGlobalConfigPath)
		return

	var file := FileAccess.open(GalaxyGlobalConfigPath, FileAccess.READ)
	if file == null:
		push_warning("Unable to read galaxy global config: %s" % GalaxyGlobalConfigPath)
		return

	var json_text := file.get_as_text()
	if json_text.strip_edges().is_empty():
		push_warning("Galaxy global config is empty: %s" % GalaxyGlobalConfigPath)
		return

	var dto_variant: Variant = JSON.parse_string(json_text)
	if not (dto_variant is Dictionary):
		push_warning("Failed parsing galaxy global config: %s" % GalaxyGlobalConfigPath)
		return

	var dto: Dictionary = dto_variant

	if dto.has("galaxy_seed"):
		GalaxySeed = int(dto["galaxy_seed"])
	if dto.has("virtual_planet_target"):
		VirtualPlanetTarget = maxi(1000, int(dto["virtual_planet_target"]))
	if dto.has("sector_size") and _sector_manager != null:
		_sector_manager.sector_size = maxf(96.0, float(dto["sector_size"]))
	if dto.has("planets_per_sector"):
		PlanetsPerSector = maxi(1, int(dto["planets_per_sector"]))
	if dto.has("max_loaded_planet_nodes"):
		MaxLoadedPlanetNodes = maxi(20, int(dto["max_loaded_planet_nodes"]))
	if dto.has("max_cached_sectors"):
		MaxCachedSectors = maxi(12, int(dto["max_cached_sectors"]))
	if dto.has("neighbor_planet_distance"):
		NeighborPlanetDistance = maxf(80.0, float(dto["neighbor_planet_distance"]))
	if dto.has("neighbor_visibility_hops"):
		NeighborVisibilityHops = clampi(int(dto["neighbor_visibility_hops"]), 0, 4)
	if dto.has("first_person_arc_degrees"):
		FirstPersonArcDegrees = clampf(float(dto["first_person_arc_degrees"]), 55.0, 150.0)
	if dto.has("starter_home_size"):
		StarterHomePlanetSize = maxf(24.0, float(dto["starter_home_size"]))
	if dto.has("starter_neighbor_size"):
		StarterNeighborPlanetSize = maxf(16.0, float(dto["starter_neighbor_size"]))
	if dto.has("starter_neighbor_arc_degrees"):
		StarterNeighborArcDegrees = clampf(float(dto["starter_neighbor_arc_degrees"]), 30.0, 170.0)
	if dto.has("visibility_neighbor_padding"):
		VisibilityNeighborPadding = clampf(float(dto["visibility_neighbor_padding"]), 0.0, 240.0)
	if dto.has("view_distance"):
		ViewDistance = maxf(200.0, float(dto["view_distance"]))
	if dto.has("minimum_planet_spacing"):
		MinimumPlanetSpacing = maxf(50.0, float(dto["minimum_planet_spacing"]))

	DevLog.info("Loaded galaxy global config: %s" % GalaxyGlobalConfigPath)

func _apply_neighbor_hop_visibility(delta: float) -> void:
	_visibility_refresh_countdown -= delta
	if _visibility_refresh_countdown > 0.0:
		return

	_visibility_refresh_countdown = 0.2

	if _player == null:
		for record in _runtime_id_to_record.values():
			var node: PlanetNode = record["node"]
			if is_instance_valid(node):
				node.visible = true
		_last_visibility_anchor_id = ""
		return

	var player_pos: Vector3 = _player.global_position
	var view_dist_sq: float = ViewDistance * ViewDistance
	var visible_count: int = 0

	for record in _runtime_id_to_record.values():
		var node: PlanetNode = record["node"]
		if not is_instance_valid(node):
			continue

		var dist_sq: float = player_pos.distance_squared_to(node.global_position)
		node.visible = dist_sq <= view_dist_sq
		if node.visible:
			visible_count += 1

	var anchor_id: String = _player.CurrentPlanet.Data.id if _player.CurrentPlanet != null else "none"
	if _last_visibility_anchor_id != anchor_id:
		DevLog.info(
			"View distance: %.0f, visible nodes: %d" % [ViewDistance, visible_count]
		)
		_last_visibility_anchor_id = anchor_id

func _build_visibility_set(anchor: PlanetNode) -> Dictionary:
	var visible := {}
	var frontier: Array[PlanetNode] = [anchor]

	visible[anchor] = true

	var max_hops: int = maxi(0, NeighborVisibilityHops)
	for _hop in range(max_hops):
		var next: Array[PlanetNode] = []

		for source in frontier:
			for record in _runtime_id_to_record.values():
				var candidate: PlanetNode = record["node"]
				if not is_instance_valid(candidate) or candidate == source or visible.has(candidate):
					continue

				if not _are_neighbor_planets(source, candidate):
					continue

				visible[candidate] = true
				next.append(candidate)

		if next.is_empty():
			break

		frontier = next

	return visible

func _are_neighbor_planets(origin: PlanetNode, candidate: PlanetNode) -> bool:
	var dynamic_padding := VisibilityNeighborPadding + (origin.Data.size * 0.2) + (candidate.Data.size * 0.2)
	var limit := NeighborPlanetDistance + dynamic_padding
	return origin.global_position.distance_squared_to(candidate.global_position) <= limit * limit

func _load_planet_overrides() -> void:
	_overrides_by_sector.clear()

	if not FileAccess.file_exists(PlanetOverridesPath):
		push_warning("Planet override file not found: %s" % PlanetOverridesPath)
		return

	var file := FileAccess.open(PlanetOverridesPath, FileAccess.READ)
	if file == null:
		push_warning("Unable to read planet overrides at: %s" % PlanetOverridesPath)
		return

	var json_text := file.get_as_text()
	if json_text.strip_edges().is_empty():
		return

	var parsed_variant: Variant = JSON.parse_string(json_text)
	if not (parsed_variant is Array):
		return

	var parsed: Array = parsed_variant

	for dto in parsed:
		if not (dto is Dictionary):
			continue

		var data := _parse_override(dto)
		if data == null:
			continue

		var sector: Vector3i = _world_to_sector(data.position, _sector_manager.sector_size if _sector_manager != null else 512.0)
		if not _overrides_by_sector.has(sector):
			_overrides_by_sector[sector] = []

		_overrides_by_sector[sector].append(data)

func _parse_override(dto: Dictionary) -> PlanetData:
	var id: String = str(dto.get("id", ""))
	if id.strip_edges().is_empty():
		return null

	var position_dto: Dictionary = dto.get("position", {})
	var position := Vector3(
		float(position_dto.get("x", 0.0)),
		float(position_dto.get("y", 0.0)),
		float(position_dto.get("z", 0.0))
	)

	var biome := _biome_from_name(str(dto.get("biome", "Temperate")))

	var data := PlanetData.new()
	data.id = id
	data.position = position
	data.size = float(dto.get("size", 40.0))
	data.gravity = float(dto.get("gravity", 20.0))
	data.friction = float(dto.get("friction", 0.6))
	data.biome = biome
	data.is_override = bool(dto.get("is_override", true))
	data.seed_id = int(dto.get("seed_id", 0))

	var resources_dto: Dictionary = dto.get("resources", {})
	if not resources_dto.is_empty():
		var resources: Dictionary = {}
		for key in resources_dto.keys():
			var resource_type := _resource_type_from_name(str(key))
			if resource_type == -1:
				continue

			var cfg_dto: Dictionary = resources_dto[key]
			resources[resource_type] = ResourcePoolConfig.new(
				float(cfg_dto.get("max", 100.0)),
				float(cfg_dto.get("regen_speed", 1.0)),
				float(cfg_dto.get("abundance", 0.5))
			)

		if not resources.is_empty():
			data.resources = resources

	return data

func _clone_planet_data(source: PlanetData) -> PlanetData:
	var clone := PlanetData.new()
	clone.id = source.id
	clone.position = source.position
	clone.size = source.size
	clone.gravity = source.gravity
	clone.friction = source.friction
	clone.biome = source.biome
	clone.is_override = source.is_override
	clone.seed_id = source.seed_id
	clone.resources = _clone_resource_map(source.resources)
	return clone

func _clone_resource_map(source: Dictionary) -> Dictionary:
	var clone := {}
	for key in source.keys():
		var cfg: ResourcePoolConfig = source[key]
		clone[key] = ResourcePoolConfig.new(cfg.max, cfg.regen_speed, cfg.abundance)
	return clone

func _world_to_sector(position: Vector3, sector_size: float) -> Vector3i:
	return Vector3i(
		floori(position.x / sector_size),
		floori(position.y / sector_size),
		floori(position.z / sector_size)
	)

func _biome_from_name(value: String) -> int:
	match value.to_lower():
		"temperate":
			return PlanetBiome.Temperate
		"arid":
			return PlanetBiome.Arid
		"oceanic":
			return PlanetBiome.Oceanic
		"volcanic":
			return PlanetBiome.Volcanic
		"frozen":
			return PlanetBiome.Frozen
		"metallic":
			return PlanetBiome.Metallic
		_:
			return PlanetBiome.Temperate

func _resource_type_from_name(value: String) -> int:
	match value.to_lower():
		"water":
			return ResourceType.Water
		"oil":
			return ResourceType.Oil
		"air":
			return ResourceType.Air
		"metals":
			return ResourceType.Metals
		"minerals":
			return ResourceType.Minerals
		_:
			return -1
