class_name PlayerController
extends CharacterBody3D

const HarvestResourceTypes: Array[int] = [
	ResourceType.Water,
	ResourceType.Oil,
	ResourceType.Air,
	ResourceType.Metals,
	ResourceType.Minerals,
]

@export var MoveSpeed: float = 14.0
@export var MoveAcceleration: float = 24.0
@export var JumpVelocity: float = 10.0
@export var BaseGravityStrength: float = 20.0
@export var RotationLerpSpeed: float = 8.0
@export var GroundFriction: float = 8.0
@export var AirControl: float = 0.35
@export var SurfaceHoverOffset: float = 0.05
@export var SurfaceHoverSnapBand: float = 0.08
@export var InventoryPath: NodePath = "Inventory"
@export var HarvestRate: float = 5.0
@export var AirDrainPerSecond: float = 0.15
@export var CameraRigPath: NodePath = "CameraPivot"
@export var HarvestLaserAction: StringName = &"harvest_laser"
@export var HarvestBeamPath: NodePath = "LaserBeam"
@export var HarvestBeamMaxDistance: float = 120.0
@export var HarvestBeamThickness: float = 0.04
@export var HarvestBeamOriginHeight: float = 1.0
@export var HarvestBeamOriginRightOffset: float = 0.25

var _gravity_sources: Dictionary = {}

var _current_planet: PlanetNode
var _active_gravity_strength: float = 20.0
var _surface_up: Vector3 = Vector3.UP
var _traversal_lock: bool = false

var _inventory: PlayerInventory
var _camera_rig: Node3D
var _harvest_beam: MeshInstance3D
var _cached_resource_planet: PlanetNode
var _cached_resource_pool: PlanetResourcePool
var _is_harvest_laser_active: bool = false
var _harvest_hit_collider: Node

var SurfaceUp: Vector3:
	get:
		return _surface_up

var CurrentPlanet: PlanetNode:
	get:
		return _current_planet

func _ready() -> void:
	_inventory = get_node_or_null(InventoryPath)
	_camera_rig = get_node_or_null(CameraRigPath)
	_harvest_beam = get_node_or_null(HarvestBeamPath)

	if _harvest_beam != null:
		_harvest_beam.visible = false

func _physics_process(delta: float) -> void:
	_resolve_current_planet()
	_recover_stale_traversal_lock()
	var gravity_direction := _resolve_gravity_direction()

	_enforce_surface_hover()
	_handle_movement(delta, gravity_direction)
	_align_to_surface(delta)

	up_direction = _surface_up
	move_and_slide()
	_enforce_surface_hover()

	_update_harvest_laser()
	_update_resource_flow(delta)

func _recover_stale_traversal_lock() -> void:
	if not _traversal_lock or _current_planet == null:
		return

	var traversal := get_node_or_null("TraversalSystem") as TraversalSystem
	if traversal != null and not traversal.IsTraversing:
		_traversal_lock = false

func RegisterGravitySource(planet: PlanetNode, gravity_strength: float) -> void:
	_gravity_sources[planet] = gravity_strength
	_resolve_current_planet()

func UnregisterGravitySource(planet: PlanetNode) -> void:
	_gravity_sources.erase(planet)
	_resolve_current_planet()

func SetCurrentPlanet(planet: PlanetNode, gravity_strength_override: Variant = null) -> void:
	_current_planet = planet
	if gravity_strength_override != null:
		_active_gravity_strength = float(gravity_strength_override)
	elif planet != null:
		_active_gravity_strength = planet.Data.gravity
	else:
		_active_gravity_strength = BaseGravityStrength

	if planet != null:
		_surface_up = (global_position - planet.global_position).normalized()

func SetTraversalLock(enabled: bool) -> void:
	_traversal_lock = enabled

func ApplyTraversalImpulse(impulse: Vector3) -> void:
	velocity += impulse

func CancelAllMovement() -> void:
	velocity = Vector3.ZERO

func _resolve_current_planet() -> void:
	var closest: PlanetNode = null
	var closest_surface_distance := INF

	for planet in _gravity_sources.keys():
		if not is_instance_valid(planet):
			continue

		var candidate := planet as PlanetNode
		if candidate == null:
			continue
		var center_distance := global_position.distance_to(candidate.global_position)
		var surface_distance := center_distance - maxf(0.0, candidate.Data.size)
		if surface_distance < closest_surface_distance:
			closest_surface_distance = surface_distance
			closest = candidate

	_current_planet = closest
	if closest != null and _gravity_sources.has(closest):
		_active_gravity_strength = float(_gravity_sources[closest])
	else:
		_active_gravity_strength = BaseGravityStrength

func _resolve_gravity_direction() -> Vector3:
	if _current_planet == null:
		_surface_up = Vector3.UP
		return Vector3.DOWN

	var gravity_direction := (_current_planet.global_position - global_position).normalized()
	_surface_up = -gravity_direction
	return gravity_direction

func _enforce_surface_hover() -> void:
	if _current_planet == null or _traversal_lock:
		return

	var to_player := global_position - _current_planet.global_position
	var radial_distance := to_player.length()
	if radial_distance < 0.0001:
		to_player = _surface_up
		radial_distance = 0.0001

	var surface_normal := to_player / radial_distance
	var sampled_surface_radius := _sample_surface_radius(surface_normal, radial_distance)
	var target_altitude := sampled_surface_radius + maxf(0.0, SurfaceHoverOffset)
	var hover_ceiling := target_altitude + maxf(0.0, SurfaceHoverSnapBand)

	if radial_distance < target_altitude:
		global_position = _current_planet.global_position + surface_normal * target_altitude
		# Kill inward velocity to stop clipping momentum
		var inward_speed := velocity.dot(-surface_normal)
		if inward_speed > 0.0:
			velocity += surface_normal * inward_speed
	elif is_on_floor() and radial_distance > hover_ceiling:
		global_position = _current_planet.global_position + surface_normal * target_altitude
		# Kill outward drift so tiny separation does not accumulate while grounded.
		var outward_speed := velocity.dot(surface_normal)
		if outward_speed > 0.0:
			velocity -= surface_normal * outward_speed

func _handle_movement(dt: float, gravity_direction: Vector3) -> void:
	if _traversal_lock:
		return

	var wants_jump := Input.is_action_just_pressed("jump")
	var input := Input.get_vector("move_left", "move_right", "move_forward", "move_back")

	var cam_basis: Basis = _camera_rig.global_transform.basis if _camera_rig != null else global_transform.basis
	var cam_forward_raw: Vector3 = -cam_basis.z
	var cam_forward := cam_forward_raw.slide(_surface_up).normalized()
	if cam_forward.length_squared() < 0.0001:
		cam_forward = (-global_transform.basis.z).slide(_surface_up).normalized()

	if cam_forward.length_squared() < 0.0001:
		cam_forward = (_surface_up.cross(global_transform.basis.x)).normalized()

	if cam_forward.length_squared() < 0.0001:
		cam_forward = Vector3.FORWARD.slide(_surface_up).normalized()

	var cam_right: Vector3 = _surface_up.cross(cam_forward).normalized()
	if cam_right.length_squared() < 0.0001:
		cam_right = global_transform.basis.x.slide(_surface_up).normalized()

	if cam_right.length_squared() < 0.0001:
		cam_right = Vector3.RIGHT.slide(_surface_up).normalized()
	var desired_lateral := (cam_right * input.x) + (cam_forward * (-input.y))
	if desired_lateral.length_squared() > 1.0:
		desired_lateral = desired_lateral.normalized()

	var gravity_ratio := _active_gravity_strength / maxf(0.001, BaseGravityStrength)
	var mobility_scale := clampf(1.15 - (0.30 * (gravity_ratio - 1.0)), 0.70, 1.35)
	var jump_scale := clampf(1.20 - (0.35 * (gravity_ratio - 1.0)), 0.60, 1.45)

	desired_lateral *= MoveSpeed * mobility_scale

	var vertical_speed := velocity.dot(gravity_direction)
	var lateral_velocity := velocity - (gravity_direction * vertical_speed)

	var acceleration: float = MoveAcceleration if is_on_floor() else MoveAcceleration * AirControl
	lateral_velocity = lateral_velocity.move_toward(desired_lateral, acceleration * dt)

	if is_on_floor() and desired_lateral.length_squared() < 0.001:
		var friction_scale: float = _current_planet.Data.friction if _current_planet != null else 0.6
		lateral_velocity = lateral_velocity.move_toward(Vector3.ZERO, GroundFriction * friction_scale * dt)

	if is_on_floor():
		# Keep grounded hover stable by removing residual radial speed until jump starts.
		vertical_speed = 0.0
	else:
		vertical_speed += _active_gravity_strength * dt
	var next_velocity := lateral_velocity + (gravity_direction * vertical_speed)

	if is_on_floor() and wants_jump:
		next_velocity += _surface_up * (JumpVelocity * jump_scale)

	velocity = next_velocity

func _align_to_surface(dt: float) -> void:
	# Face movement direction when moving, otherwise maintain current facing
	var lateral_vel := velocity - (_surface_up * velocity.dot(_surface_up))
	var planar_forward: Vector3
	if lateral_vel.length_squared() > 0.5:
		planar_forward = lateral_vel.normalized()
	else:
		planar_forward = (-global_transform.basis.z).slide(_surface_up).normalized()

	if planar_forward.length_squared() < 0.0001:
		planar_forward = global_transform.basis.x.cross(_surface_up).normalized()

	var target_basis := Basis.looking_at(planar_forward, _surface_up)
	var current_rotation := global_transform.basis.get_rotation_quaternion()
	var target_rotation := target_basis.get_rotation_quaternion()

	var new_rotation := current_rotation.slerp(target_rotation, clampf(RotationLerpSpeed * dt, 0.0, 1.0))
	global_transform = Transform3D(Basis(new_rotation), global_position)

func _update_resource_flow(dt: float) -> void:
	if _inventory == null:
		return

	_inventory.RemoveUpTo(ResourceType.Air, AirDrainPerSecond * dt)

	if _traversal_lock or _current_planet == null:
		return

	if not _is_harvest_laser_active or not _is_harvest_target_current_planet():
		return

	var pool := _get_current_resource_pool()
	if pool == null:
		return

	for resource_type in HarvestResourceTypes:
		var config: ResourcePoolConfig = _current_planet.Data.get_resource_config(resource_type)
		var requested := HarvestRate * config.abundance * dt
		var harvested := pool.Harvest(resource_type, requested)

		if harvested > 0.0:
			_inventory.Add(resource_type, harvested)

func _get_current_resource_pool() -> PlanetResourcePool:
	if _current_planet == null:
		_cached_resource_planet = null
		_cached_resource_pool = null
		return null

	if _cached_resource_planet == _current_planet and is_instance_valid(_cached_resource_pool):
		return _cached_resource_pool

	_cached_resource_planet = _current_planet
	_cached_resource_pool = _current_planet.get_node_or_null("ResourcePool")
	return _cached_resource_pool

func _update_harvest_laser() -> void:
	if _harvest_beam == null:
		_is_harvest_laser_active = false
		_harvest_hit_collider = null
		return

	if _traversal_lock or not Input.is_action_pressed(HarvestLaserAction):
		_is_harvest_laser_active = false
		_harvest_hit_collider = null
		_harvest_beam.visible = false
		return

	var active_camera := _get_active_camera()
	if active_camera == null:
		_is_harvest_laser_active = false
		_harvest_hit_collider = null
		_harvest_beam.visible = false
		return

	var screen_center := get_viewport().get_visible_rect().size * 0.5
	var origin := active_camera.project_ray_origin(screen_center)
	var direction := active_camera.project_ray_normal(screen_center).normalized()
	var max_end := origin + (direction * HarvestBeamMaxDistance)

	var query := PhysicsRayQueryParameters3D.create(origin, max_end)
	query.collide_with_areas = true
	query.collide_with_bodies = true
	query.exclude = [self]

	var result := get_world_3d().direct_space_state.intersect_ray(query)
	var hit_point := max_end
	_harvest_hit_collider = null

	if not result.is_empty():
		hit_point = result.get("position", max_end)
		_harvest_hit_collider = result.get("collider") as Node

	var visual_origin := global_position + (_surface_up * HarvestBeamOriginHeight)
	var side := global_transform.basis.x.slide(_surface_up).normalized()
	if side.length_squared() < 0.0001:
		side = _surface_up.cross(global_transform.basis.z).normalized()

	if side.length_squared() > 0.0001:
		visual_origin += side * HarvestBeamOriginRightOffset

	_set_harvest_beam_segment(visual_origin, hit_point)
	_is_harvest_laser_active = true

func _set_harvest_beam_segment(start_point: Vector3, end_point: Vector3) -> void:
	if _harvest_beam == null:
		return

	var span := end_point - start_point
	var distance := span.length()
	if distance <= 0.01:
		_harvest_beam.visible = false
		return

	var midpoint := (start_point + end_point) * 0.5
	var forward := span / distance
	var up_hint := _surface_up
	if absf(forward.dot(up_hint)) > 0.98:
		up_hint = Vector3.UP

	_harvest_beam.global_transform = Transform3D(Basis.looking_at(forward, up_hint), midpoint)
	_harvest_beam.scale = Vector3(HarvestBeamThickness, HarvestBeamThickness, distance)
	_harvest_beam.visible = true

func _is_harvest_target_current_planet() -> bool:
	return _is_node_part_of_current_planet(_harvest_hit_collider)

func _sample_surface_radius(surface_normal: Vector3, radial_distance: float) -> float:
	if _current_planet == null:
		return 0.0

	var center := _current_planet.global_position
	var start := center + (surface_normal * (radial_distance + 0.3))
	var query := PhysicsRayQueryParameters3D.create(start, center)
	query.collide_with_areas = false
	query.collide_with_bodies = true
	query.exclude = [self]

	var result := get_world_3d().direct_space_state.intersect_ray(query)
	if result.is_empty():
		return maxf(0.0, _current_planet.Data.size)

	var collider := result.get("collider") as Node
	if not _is_node_part_of_current_planet(collider):
		return maxf(0.0, _current_planet.Data.size)

	var hit_position: Vector3 = result.get("position", center)
	return maxf(0.0, center.distance_to(hit_position))

func _is_node_part_of_current_planet(node: Node) -> bool:
	if _current_planet == null or node == null:
		return false

	var current: Node = node
	while current != null:
		if current == _current_planet:
			return true
		current = current.get_parent()

	return false

func _get_active_camera() -> Camera3D:
	var viewport_camera := get_viewport().get_camera_3d()
	if viewport_camera != null:
		return viewport_camera

	if _camera_rig != null:
		for child in _camera_rig.get_children():
			if child is Camera3D:
				return child as Camera3D
			if child is Node:
				for grandchild in (child as Node).get_children():
					if grandchild is Camera3D:
						return grandchild as Camera3D

	return null
