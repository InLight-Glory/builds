class_name TraversalSystem
extends Node

@export var PlayerPath: NodePath = ".."
@export var ReticlePath: NodePath = "../ReticleSystem"
@export var InventoryPath: NodePath = "../Inventory"
@export var MaxTraversalRange: float = 1200.0
@export var LaunchImpulse: float = 35.0
@export var TraversalSteerForce: float = 22.0
@export var AutoTraverseSpeed: float = 120.0
@export var TargetCaptureDistance: float = 14.0
@export var AirCostPerUnit: float = 0.020
@export var OilCostPerUnit: float = 0.016

var IsTraversing: bool = false

var _player: PlayerController
var _reticle: ReticleSystem
var _inventory: PlayerInventory
var _target_planet: PlanetNode

func _ready() -> void:
    _player = get_node_or_null(PlayerPath)
    _reticle = get_node_or_null(ReticlePath)
    _inventory = get_node_or_null(InventoryPath)

    if _reticle != null:
        _reticle.FocusRange = maxf(_reticle.FocusRange, MaxTraversalRange)

func _physics_process(delta: float) -> void:
    if not IsTraversing and Input.is_action_just_pressed("traverse"):
        _try_start_traversal()

    if IsTraversing:
        _update_traversal(delta)

func _try_start_traversal() -> void:
    if _player == null or _inventory == null:
        return

    var focus := _resolve_traversal_target()
    if focus == null:
        DevLog.warn("Traversal failed: no target planet in traversal range.")
        return

    var started := StartAutoTraverseToPlanet(focus, true, false, false)
    if not started:
        DevLog.warn("Traversal failed: target unavailable.")
        return

func StartAutoTraverseToPlanet(
    target_planet: PlanetNode,
    consume_cost: bool = false,
    ignore_range: bool = false,
    allow_same_planet: bool = true
) -> bool:
    if _player == null or _inventory == null or target_planet == null:
        return false

    if IsTraversing:
        _end_traversal("Traversal interrupted: switching target.")

    if not allow_same_planet and target_planet == _player.CurrentPlanet:
        return false

    var distance := _player.global_position.distance_to(target_planet.global_position)
    if not ignore_range and distance > MaxTraversalRange:
        return false

    var cost := _build_cost(distance)
    if consume_cost and not _inventory.Remove(cost):
        DevLog.warn("Traversal failed: insufficient resources for %s (%.0fm)." % [target_planet.Data.id, distance])
        return false

    var from_planet_id: String = _player.CurrentPlanet.Data.id if _player.CurrentPlanet != null else "unknown"

    _target_planet = target_planet
    IsTraversing = true
    _player.SetTraversalLock(true)
    _player.CancelAllMovement()

    var to_target := _target_planet.global_position - _player.global_position
    if to_target.length_squared() > 0.0001:
        var initial_speed := maxf(1.0, AutoTraverseSpeed)
        _player.velocity = to_target.normalized() * initial_speed

    DevLog.info(
        "Traversal started: %s -> %s, cost Air %.1f, Oil %.1f"
        % [
            from_planet_id,
            _target_planet.Data.id,
            float(cost[ResourceType.Air]) if consume_cost else 0.0,
            float(cost[ResourceType.Oil]) if consume_cost else 0.0,
        ]
    )

    return true

func _resolve_traversal_target() -> PlanetNode:
    if _reticle != null and _is_valid_target(_reticle.FocusedPlanet):
        var focused_distance := _player.global_position.distance_to(_reticle.FocusedPlanet.global_position)
        if focused_distance <= MaxTraversalRange:
            return _reticle.FocusedPlanet

    return _find_nearest_target_in_range()

func _find_nearest_target_in_range() -> PlanetNode:
    if _player == null:
        return null

    var nearest: PlanetNode = null
    var nearest_distance_sq := INF
    var max_range_sq := MaxTraversalRange * MaxTraversalRange

    for node in get_tree().get_nodes_in_group("planets"):
        var planet := node as PlanetNode
        if not _is_valid_target(planet):
            continue

        var distance_sq := _player.global_position.distance_squared_to(planet.global_position)
        if distance_sq > max_range_sq or distance_sq >= nearest_distance_sq:
            continue

        nearest_distance_sq = distance_sq
        nearest = planet

    return nearest

func _is_valid_target(candidate: PlanetNode) -> bool:
    return candidate != null and is_instance_valid(candidate) and _player != null and candidate != _player.CurrentPlanet

func _update_traversal(dt: float) -> void:
    if _player == null or _target_planet == null:
        _end_traversal("Traversal canceled: target unavailable.")
        return

    var to_target := _target_planet.global_position - _player.global_position
    var distance_to_center := to_target.length()
    var landing_radius := _target_planet.Data.size + maxf(0.0, _player.SurfaceHoverOffset)

    if distance_to_center <= landing_radius:
        _land_on_target()
        _end_traversal("Traversal complete: reached %s." % _target_planet.Data.id)
        return

    var move_direction := to_target / distance_to_center
    var remaining_to_land := maxf(0.0, distance_to_center - landing_radius)
    var max_no_overshoot_speed := remaining_to_land / maxf(dt, 0.0001)

    # Slow down near touchdown and never overshoot the target surface altitude.
    var braking_distance := maxf(TargetCaptureDistance, 0.001)
    var speed_scale := clampf(remaining_to_land / braking_distance, 0.25, 1.0)
    var traverse_speed := minf(maxf(1.0, AutoTraverseSpeed) * speed_scale, max_no_overshoot_speed)

    _player.velocity = move_direction * traverse_speed

func _land_on_target() -> void:
    if _player == null or _target_planet == null:
        return

    var to_player := _player.global_position - _target_planet.global_position
    var normal := to_player.normalized()
    if normal.length_squared() < 0.0001:
        normal = Vector3.UP

    var landing_radius := _target_planet.Data.size + maxf(0.0, _player.SurfaceHoverOffset)
    _player.global_position = _target_planet.global_position + normal * landing_radius
    _player.CancelAllMovement()
    _player.RegisterGravitySource(_target_planet, _target_planet.Data.gravity)
    _player.SetCurrentPlanet(_target_planet, _target_planet.Data.gravity)

func _end_traversal(reason: String) -> void:
    var was_traversing := IsTraversing

    if _player != null:
        _player.CancelAllMovement()
        _player.SetTraversalLock(false)

    IsTraversing = false
    _target_planet = null

    if was_traversing:
        DevLog.info(reason)

func _build_cost(distance: float) -> Dictionary:
    return {
        ResourceType.Air: maxf(5.0, distance * AirCostPerUnit),
        ResourceType.Oil: maxf(4.0, distance * OilCostPerUnit),
    }
