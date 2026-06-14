class_name PlanetGravityField
extends Area3D

@export var GravityStrength: float = 20.0

var Planet: PlanetNode

func _ready() -> void:
    monitoring = true
    monitorable = true

    body_entered.connect(_on_body_entered)
    body_exited.connect(_on_body_exited)

func _on_body_entered(body: Node3D) -> void:
    if not (body is PlayerController):
        return

    var player := body as PlayerController
    var source_planet: PlanetNode = Planet if Planet != null else get_parent() as PlanetNode
    if source_planet != null:
        player.RegisterGravitySource(source_planet, GravityStrength)

func _on_body_exited(body: Node3D) -> void:
    if not (body is PlayerController):
        return

    var player := body as PlayerController
    var source_planet: PlanetNode = Planet if Planet != null else get_parent() as PlanetNode
    if source_planet != null:
        player.UnregisterGravitySource(source_planet)
