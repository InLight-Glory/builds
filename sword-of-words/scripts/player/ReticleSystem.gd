class_name ReticleSystem
extends Node

signal focus_changed(focused_planet: Node3D)

@export var CameraPath: NodePath = "../CameraPivot/SpringArm3D/Camera3D"
@export var FocusRange: float = 700.0

var FocusedPlanet: PlanetNode

var _camera: Camera3D

func _ready() -> void:
    _camera = get_node_or_null(CameraPath)

func _physics_process(_delta: float) -> void:
    _update_focus()

func _update_focus() -> void:
    if _camera == null:
        _camera = get_viewport().get_camera_3d()
        if _camera == null:
            return

    var screen_center := get_viewport().get_visible_rect().size * 0.5
    var origin := _camera.project_ray_origin(screen_center)
    var direction := _camera.project_ray_normal(screen_center)

    var query := PhysicsRayQueryParameters3D.create(origin, origin + (direction * FocusRange))
    query.collide_with_areas = true
    query.collide_with_bodies = true

    var result := _camera.get_world_3d().direct_space_state.intersect_ray(query)
    var next_focus: PlanetNode = null

    if not result.is_empty():
        var collider_node := result.get("collider") as Node
        next_focus = _resolve_planet_node(collider_node)

    _set_focus(next_focus)

func _set_focus(next_focus: PlanetNode) -> void:
    if next_focus == FocusedPlanet:
        return

    FocusedPlanet = next_focus
    if FocusedPlanet != null:
        focus_changed.emit(FocusedPlanet)

func _resolve_planet_node(node: Node) -> PlanetNode:
    var current := node

    while current != null:
        if current is PlanetNode:
            return current as PlanetNode

        current = current.get_parent()

    return null
