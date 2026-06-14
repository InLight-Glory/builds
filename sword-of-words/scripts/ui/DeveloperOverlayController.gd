class_name DeveloperOverlayController
extends CanvasLayer

@export var PanelPath: NodePath = "Root/Panel"
@export var MetricsLabelPath: NodePath = "Root/Panel/Margin/Body/Metrics"
@export var LogLabelPath: NodePath = "Root/Panel/Margin/Body/Log"
@export var PlayerPath: NodePath = "../Player"
@export var GalaxyManagerPath: NodePath = ".."
@export var SectorManagerPath: NodePath = "../SectorManager"
@export var TimeEventManagerPath: NodePath = "../TimeEventManager"
@export var TraversalSystemPath: NodePath = "../Player/TraversalSystem"
@export var MapOverlayPath: NodePath = "../MapOverlay"

var _panel: Control
var _metrics_label: RichTextLabel
var _log_label: RichTextLabel

var _player: PlayerController
var _galaxy_manager: GalaxyManager
var _sector_manager: SectorManager
var _time_event_manager: TimeEventManager
var _traversal: TraversalSystem
var _map_overlay: MapOverlayController

var _enabled := false

func _ready() -> void:
    _panel = get_node_or_null(PanelPath)
    _metrics_label = get_node_or_null(MetricsLabelPath)
    _log_label = get_node_or_null(LogLabelPath)

    _player = get_node_or_null(PlayerPath)
    _galaxy_manager = get_node_or_null(GalaxyManagerPath)
    _sector_manager = get_node_or_null(SectorManagerPath)
    _time_event_manager = get_node_or_null(TimeEventManagerPath)
    _traversal = get_node_or_null(TraversalSystemPath)
    _map_overlay = get_node_or_null(MapOverlayPath)

    _set_enabled(false)
    DevLog.subscribe(Callable(self, "_on_log_line_added"))

    _sync_log_text()
    DevLog.info("Developer overlay ready. Press Ctrl+Shift+D to toggle.")

func _exit_tree() -> void:
    DevLog.unsubscribe(Callable(self, "_on_log_line_added"))

func _input(event: InputEvent) -> void:
    if event is not InputEventKey:
        return

    var key_event := event as InputEventKey
    if key_event.pressed and not key_event.echo and key_event.keycode == KEY_D and key_event.ctrl_pressed and key_event.shift_pressed:
        _set_enabled(not _enabled)
        get_viewport().set_input_as_handled()
        DevLog.info("Developer mode enabled." if _enabled else "Developer mode disabled.")

func _process(_delta: float) -> void:
    if not _enabled or _metrics_label == null:
        return

    _metrics_label.text = _build_metrics_text()

func _set_enabled(enabled: bool) -> void:
    _enabled = enabled
    if _panel != null:
        _panel.visible = _enabled

func _build_metrics_text() -> String:
    var lines: Array[String] = []
    lines.append("FPS: %d" % Engine.get_frames_per_second())

    if _player != null:
        var p := _player.global_position
        lines.append("Player Pos: %.1f, %.1f, %.1f" % [p.x, p.y, p.z])
        var planet_id: String = _player.CurrentPlanet.Data.id if _player.CurrentPlanet != null else "none"
        lines.append("Current Planet: %s" % planet_id)

    if _galaxy_manager != null:
        lines.append("Loaded Planets: %d" % _galaxy_manager.LoadedPlanetCount)
        lines.append("Discovered Planets: %d" % _galaxy_manager.DiscoveredPlanetCount)
        lines.append("Neighbor Distance: %.1f" % _galaxy_manager.NeighborPlanetDistance)
        lines.append("Visibility Hops: %d" % _galaxy_manager.NeighborVisibilityHops)

    if _sector_manager != null:
        lines.append("Active Sectors: %d" % _sector_manager.active_sector_count)

    if _traversal != null:
        lines.append("Traversing: %s" % str(_traversal.IsTraversing))

    if _time_event_manager != null:
        lines.append(_time_event_manager.ActiveEventText)

    if _map_overlay != null:
        lines.append("Map Open: %s" % str(_map_overlay.IsOpen))

    return "\n".join(lines)

func _on_log_line_added(_line: String) -> void:
    if not _enabled:
        return

    _sync_log_text()

func _sync_log_text() -> void:
    if _log_label == null:
        return

    var start: int = maxi(0, DevLog.lines.size() - 22)
    var buffer: Array[String] = []
    for i in range(start, DevLog.lines.size()):
        buffer.append(DevLog.lines[i])

    _log_label.text = "\n".join(buffer)
