class_name HUDController
extends CanvasLayer

@export var FocusLabelPath: NodePath = "Root/FocusLabel"
@export var ResourceLabelPath: NodePath = "Root/ResourceLabel"
@export var EventLabelPath: NodePath = "Root/EventLabel"
@export var ReticleVerticalPath: NodePath = "Root/ReticleV"
@export var ReticleHorizontalPath: NodePath = "Root/ReticleH"
@export var ReticleInfoPanelPath: NodePath = "Root/ReticleInfoPanel"
@export var PlanetIdLabelPath: NodePath = "Root/ReticleInfoPanel/InfoVBox/PlanetIdLabel"
@export var BiomeLabelPath: NodePath = "Root/ReticleInfoPanel/InfoVBox/BiomeLabel"
@export var DetailsLabelPath: NodePath = "Root/ReticleInfoPanel/InfoVBox/DetailsLabel"
@export var DistanceLabelPath: NodePath = "Root/ReticleInfoPanel/InfoVBox/DistanceLabel"
@export var PlayerPath: NodePath = "../Player"
@export var TimeEventManagerPath: NodePath = "../TimeEventManager"
@export var GalaxyManagerPath: NodePath = ".."

var _focus_label: Label
var _resource_label: Label
var _event_label: Label
var _reticle_vertical: ColorRect
var _reticle_horizontal: ColorRect
var _reticle_info_panel: PanelContainer
var _planet_id_label: Label
var _biome_label: Label
var _details_label: Label
var _distance_label: Label

var _reticle: ReticleSystem
var _inventory: PlayerInventory
var _player: PlayerController
var _time_event_manager: TimeEventManager
var _galaxy_manager: GalaxyManager

func _ready() -> void:
    _focus_label = get_node_or_null(FocusLabelPath)
    _resource_label = get_node_or_null(ResourceLabelPath)
    _event_label = get_node_or_null(EventLabelPath)
    _reticle_vertical = get_node_or_null(ReticleVerticalPath)
    _reticle_horizontal = get_node_or_null(ReticleHorizontalPath)
    _reticle_info_panel = get_node_or_null(ReticleInfoPanelPath)
    _planet_id_label = get_node_or_null(PlanetIdLabelPath)
    _biome_label = get_node_or_null(BiomeLabelPath)
    _details_label = get_node_or_null(DetailsLabelPath)
    _distance_label = get_node_or_null(DistanceLabelPath)

    _player = get_node_or_null(PlayerPath)
    _reticle = get_node_or_null("../Player/ReticleSystem")
    _inventory = get_node_or_null("../Player/Inventory")
    _time_event_manager = get_node_or_null(TimeEventManagerPath)
    _galaxy_manager = get_node_or_null(GalaxyManagerPath)

func _process(_delta: float) -> void:
    _update_focus_label()
    _update_resource_label()
    _update_event_label()
    _update_reticle_color()
    _update_reticle_info_panel()

func _update_focus_label() -> void:
    if _focus_label == null or _player == null:
        return

    var focus: PlanetNode = _reticle.FocusedPlanet if _reticle != null else null
    if focus == null:
        _focus_label.text = "Focus: none"
        return

    var distance := _player.global_position.distance_to(focus.global_position)
    var discovered: bool = _galaxy_manager.IsPlanetDiscovered(focus) if _galaxy_manager != null else false
    var discovery_state: String = "known" if discovered else "undiscovered"
    _focus_label.text = "Focus: %s (%.0fm, %s)" % [focus.Data.id, distance, discovery_state]

func _update_resource_label() -> void:
    if _resource_label == null or _inventory == null:
        return

    _resource_label.text = (
        "Air %.0f | Oil %.0f | Water %.0f | Metals %.0f | Minerals %.0f"
        % [
            _inventory.GetAmount(ResourceType.Air),
            _inventory.GetAmount(ResourceType.Oil),
            _inventory.GetAmount(ResourceType.Water),
            _inventory.GetAmount(ResourceType.Metals),
            _inventory.GetAmount(ResourceType.Minerals),
        ]
    )

func _update_event_label() -> void:
    if _event_label == null:
        return

    _event_label.text = _time_event_manager.ActiveEventText if _time_event_manager != null else "Time Event: none"

func _update_reticle_color() -> void:
    var focused: bool = _reticle != null and _reticle.FocusedPlanet != null
    var color: Color = Color(0.45, 1.0, 0.70, 0.90) if focused else Color(1.0, 1.0, 1.0, 0.85)

    if _reticle_vertical != null:
        _reticle_vertical.color = color

    if _reticle_horizontal != null:
        _reticle_horizontal.color = color

func _update_reticle_info_panel() -> void:
    var focus: PlanetNode = _reticle.FocusedPlanet if _reticle != null else null

    if focus == null:
        if _reticle_info_panel != null:
            _reticle_info_panel.visible = false
        return

    if _reticle_info_panel != null:
        _reticle_info_panel.visible = true

    var data: PlanetData = focus.Data

    if _planet_id_label != null:
        _planet_id_label.text = data.id

    if _biome_label != null:
        _biome_label.text = _biome_name(data.biome)

    if _details_label != null:
        _details_label.text = "Size %.0f  |  Gravity %.1f" % [data.size, data.gravity]

    if _distance_label != null and _player != null:
        var dist := _player.global_position.distance_to(focus.global_position)
        var discovered: bool = _galaxy_manager.IsPlanetDiscovered(focus) if _galaxy_manager != null else false
        var state: String = "Discovered" if discovered else "Undiscovered"
        _distance_label.text = "%.0fm  •  %s" % [dist, state]

static func _biome_name(biome: int) -> String:
    match biome:
        PlanetBiome.Temperate: return "Temperate"
        PlanetBiome.Arid: return "Arid"
        PlanetBiome.Oceanic: return "Oceanic"
        PlanetBiome.Volcanic: return "Volcanic"
        PlanetBiome.Frozen: return "Frozen"
        PlanetBiome.Metallic: return "Metallic"
        _: return "Unknown"
