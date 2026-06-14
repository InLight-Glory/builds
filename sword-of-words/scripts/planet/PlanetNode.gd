class_name PlanetNode
extends Node3D

@export var SurfaceMeshPath: NodePath = "SurfaceMesh"
@export var SurfaceCollisionPath: NodePath = "SurfaceBody/CollisionShape3D"
@export var GravityFieldPath: NodePath = "GravityField"
@export var GravityCollisionPath: NodePath = "GravityField/CollisionShape3D"

var _surface_mesh: MeshInstance3D
var _surface_collision: CollisionShape3D
var _gravity_field: PlanetGravityField
var _gravity_collision: CollisionShape3D
var _shared_material: StandardMaterial3D

var Data: PlanetData = PlanetData.new()

func _ready() -> void:
    add_to_group("planets")
    _cache_nodes()
    _apply_data()

func Initialize(data: PlanetData) -> void:
    Data = data
    if is_inside_tree():
        _apply_data()

func _cache_nodes() -> void:
    _surface_mesh = get_node_or_null(SurfaceMeshPath)
    _surface_collision = get_node_or_null(SurfaceCollisionPath)
    _gravity_field = get_node_or_null(GravityFieldPath)
    _gravity_collision = get_node_or_null(GravityCollisionPath)

func _apply_data() -> void:
    global_position = Data.position

    if _surface_mesh != null and _surface_mesh.mesh is SphereMesh:
        var sphere_mesh := _surface_mesh.mesh as SphereMesh
        sphere_mesh.radius = Data.size
        sphere_mesh.height = Data.size * 2.0

    if _surface_collision != null and _surface_collision.shape is SphereShape3D:
        var surface_shape := _surface_collision.shape as SphereShape3D
        surface_shape.radius = Data.size

    if _gravity_collision != null and _gravity_collision.shape is SphereShape3D:
        var gravity_shape := _gravity_collision.shape as SphereShape3D
        gravity_shape.radius = Data.size * 2.1

    if _gravity_field != null:
        _gravity_field.Planet = self
        _gravity_field.GravityStrength = Data.gravity

    _apply_biome_visuals()

func _apply_biome_visuals() -> void:
    if _surface_mesh == null:
        return

    if _shared_material == null:
        _shared_material = StandardMaterial3D.new()
        _shared_material.roughness = 0.92
        _shared_material.metallic = 0.08

    match Data.biome:
        PlanetBiome.Temperate:
            _shared_material.albedo_color = Color("5ba870")
        PlanetBiome.Arid:
            _shared_material.albedo_color = Color("cfa25e")
        PlanetBiome.Oceanic:
            _shared_material.albedo_color = Color("4a86c5")
        PlanetBiome.Volcanic:
            _shared_material.albedo_color = Color("b55343")
        PlanetBiome.Frozen:
            _shared_material.albedo_color = Color("b5d7e9")
        PlanetBiome.Metallic:
            _shared_material.albedo_color = Color("9aa0a6")
        _:
            _shared_material.albedo_color = Color("7f7f7f")

    _surface_mesh.material_override = _shared_material
