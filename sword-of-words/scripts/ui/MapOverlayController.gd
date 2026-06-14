class_name MapOverlayController
extends CanvasLayer

@export var PanelPath: NodePath = "Root/Panel"
@export var GalaxyTextPath: NodePath = "Root/Panel/Margin/Body/Tabs/Galaxy/GalaxyText"
@export var WorldTextPath: NodePath = "Root/Panel/Margin/Body/Tabs/World/WorldText"
@export var CityTextPath: NodePath = "Root/Panel/Margin/Body/Tabs/City/CityText"
@export var PlayerPath: NodePath = "../Player"
@export var GalaxyManagerPath: NodePath = ".."
@export var TimeEventManagerPath: NodePath = "../TimeEventManager"

var IsOpen: bool:
    get:
        return _is_open

var _panel: Control
var _galaxy_text: RichTextLabel
var _world_text: RichTextLabel
var _city_text: RichTextLabel

var _player: PlayerController
var _galaxy_manager: GalaxyManager
var _time_event_manager: TimeEventManager

var _is_open := false
var _refresh_timer := 0.0

func _ready() -> void:
    _panel = get_node_or_null(PanelPath)
    _galaxy_text = get_node_or_null(GalaxyTextPath)
    _world_text = get_node_or_null(WorldTextPath)
    _city_text = get_node_or_null(CityTextPath)

    _player = get_node_or_null(PlayerPath)
    _galaxy_manager = get_node_or_null(GalaxyManagerPath)
    _time_event_manager = get_node_or_null(TimeEventManagerPath)

    _set_open(false, false)
    DevLog.info("Map overlay initialized.")

func _input(event: InputEvent) -> void:
    if event.is_action_pressed("toggle_map"):
        _set_open(not _is_open, true)
        get_viewport().set_input_as_handled()
        return

    if _is_open and event.is_action_pressed("ui_cancel"):
        _set_open(false, true)
        get_viewport().set_input_as_handled()

func _process(delta: float) -> void:
    if not _is_open:
        return

    _refresh_timer -= delta
    if _refresh_timer <= 0.0:
        _refresh_timer = 0.25
        _refresh_tabs()

func _set_open(open: bool, should_log: bool) -> void:
    _is_open = open

    if _panel != null:
        _panel.visible = _is_open

    Input.mouse_mode = Input.MOUSE_MODE_VISIBLE if _is_open else Input.MOUSE_MODE_CAPTURED

    if _is_open:
        _refresh_timer = 0.0

    if should_log:
        DevLog.info("Map opened." if _is_open else "Map closed.")

func _refresh_tabs() -> void:
    _refresh_galaxy_tab()
    _refresh_world_tab()
    _refresh_city_tab()

func _refresh_galaxy_tab() -> void:
    if _galaxy_text == null or _galaxy_manager == null:
        return

    var lines: Array[String] = []
    lines.append("[b]Galaxy View[/b]")
    lines.append("")
    lines.append("Discovered: %d" % _galaxy_manager.DiscoveredPlanetCount)
    lines.append("Loaded Nodes: %d" % _galaxy_manager.LoadedPlanetCount)
    lines.append("Neighbor Distance: %.0f m" % _galaxy_manager.NeighborPlanetDistance)
    lines.append("Visibility Hops: %d" % _galaxy_manager.NeighborVisibilityHops)
    lines.append("")

    var discovered: PackedStringArray = _galaxy_manager.GetDiscoveredPlanetIds()
    lines.append("Visited Planets:")
    if discovered.is_empty():
        lines.append(" - none")
    else:
        var max_items: int = mini(12, discovered.size())
        for i in range(max_items):
            lines.append(" - %s" % discovered[i])

    lines.append("")
    lines.append("Current Neighbors:")
    var neighbors: PackedStringArray = _galaxy_manager.GetCurrentNeighborPlanetIds()
    if neighbors.is_empty():
        lines.append(" - none")
    else:
        for id in neighbors:
            lines.append(" - %s" % id)

    _galaxy_text.text = "\n".join(lines)

func _refresh_world_tab() -> void:
    if _world_text == null:
        return

    var lines: Array[String] = []
    lines.append("[b]World View[/b]")
    lines.append("")

    var current_planet: PlanetNode = _player.CurrentPlanet if _player != null else null
    if current_planet != null:
        lines.append("Current Planet: %s" % current_planet.Data.id)
        lines.append("Biome: %s" % _planet_biome_name(current_planet.Data.biome))
        lines.append("Size: %.0f" % current_planet.Data.size)
        lines.append("Gravity: %.1f" % current_planet.Data.gravity)
        lines.append("Friction: %.2f" % current_planet.Data.friction)
    else:
        lines.append("Current Planet: unknown")

    lines.append("")
    lines.append(_time_event_manager.ActiveEventText if _time_event_manager != null else "Time Event: none")

    _world_text.text = "\n".join(lines)

func _refresh_city_tab() -> void:
    if _city_text == null:
        return

    _city_text.text = "[b]City View[/b]\n\nCity templates are planned for a later phase.\nThis tab will later display district layout, building slots,\nresource flow, and construction queues."

func _planet_biome_name(biome: int) -> String:
    match biome:
        PlanetBiome.Temperate:
            return "Temperate"
        PlanetBiome.Arid:
            return "Arid"
        PlanetBiome.Oceanic:
            return "Oceanic"
        PlanetBiome.Volcanic:
            return "Volcanic"
        PlanetBiome.Frozen:
            return "Frozen"
        PlanetBiome.Metallic:
            return "Metallic"
        _:
            return "Unknown"
