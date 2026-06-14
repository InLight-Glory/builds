class_name CameraRig
extends Node3D

@export var GalaxyManagerPath: NodePath = "../../"
@export var SpringArmPath: NodePath = "SpringArm3D"
@export var CameraPath: NodePath = "SpringArm3D/Camera3D"
@export var ThirdPersonDistance: float = 8.0
@export var FirstPersonDistance: float = 0.05
@export var CameraLerpSpeed: float = 10.0
@export var ThirdPersonFov: float = 75.0
@export var FirstPersonFovFallback: float = 110.0
@export var MouseSensitivity: float = 0.10
@export var PitchMin: float = -80.0
@export var PitchMax: float = 75.0

var _spring_arm: SpringArm3D
var _camera: Camera3D
var _galaxy_manager: GalaxyManager

var _is_third_person := true
var _pitch := -10.0
var _yaw_delta := 0.0
var _cam_forward: Vector3 = Vector3.FORWARD

func _ready() -> void:
    _spring_arm = get_node_or_null(SpringArmPath)
    _camera = get_node_or_null(CameraPath)
    _galaxy_manager = get_node_or_null(GalaxyManagerPath)

    if _camera != null:
        _camera.current = true
        _camera.fov = ThirdPersonFov

    if _spring_arm != null:
        _spring_arm.spring_length = ThirdPersonDistance

    Input.mouse_mode = Input.MOUSE_MODE_CAPTURED

func _unhandled_input(event: InputEvent) -> void:
    if event is InputEventMouseMotion and Input.mouse_mode == Input.MOUSE_MODE_CAPTURED:
        var motion := event as InputEventMouseMotion
        _yaw_delta -= motion.relative.x * MouseSensitivity
        _pitch = clampf(_pitch - (motion.relative.y * MouseSensitivity), PitchMin, PitchMax)

    if event.is_action_pressed("ui_cancel"):
        Input.mouse_mode = (
            Input.MOUSE_MODE_VISIBLE
            if Input.mouse_mode == Input.MOUSE_MODE_CAPTURED
            else Input.MOUSE_MODE_CAPTURED
        )

func _process(delta: float) -> void:
    if Input.is_action_just_pressed("toggle_camera"):
        _is_third_person = not _is_third_person

    var player := get_parent()
    var surface_up: Vector3 = (player as CharacterBody3D).up_direction if player is CharacterBody3D else Vector3.UP

    # Re-project camera forward onto current surface tangent plane
    _cam_forward = (_cam_forward - surface_up * _cam_forward.dot(surface_up))
    if _cam_forward.length_squared() < 0.001:
        _cam_forward = surface_up.cross(Vector3.RIGHT)
        if _cam_forward.length_squared() < 0.001:
            _cam_forward = surface_up.cross(Vector3.FORWARD)
    _cam_forward = _cam_forward.normalized()

    # Apply accumulated yaw from mouse input
    if abs(_yaw_delta) > 0.0001:
        _cam_forward = _cam_forward.rotated(surface_up, deg_to_rad(_yaw_delta))
        _yaw_delta = 0.0

    # Build pitched look direction and set global orientation directly
    var cam_right := _cam_forward.cross(surface_up).normalized()
    var look_dir := _cam_forward.rotated(cam_right, deg_to_rad(_pitch))
    global_transform = Transform3D(Basis.looking_at(look_dir, surface_up), global_position)

    if _spring_arm == null:
        return

    var target_distance: float = ThirdPersonDistance if _is_third_person else FirstPersonDistance
    _spring_arm.spring_length = lerpf(_spring_arm.spring_length, target_distance, delta * CameraLerpSpeed)

    if _camera != null:
        var configured_first_person_fov: float = _galaxy_manager.FirstPersonArcDegrees if _galaxy_manager != null else FirstPersonFovFallback
        var first_person_fov: float = clampf(configured_first_person_fov, 55.0, 150.0)
        var target_fov: float = ThirdPersonFov if _is_third_person else first_person_fov
        _camera.fov = lerpf(_camera.fov, target_fov, delta * CameraLerpSpeed)
