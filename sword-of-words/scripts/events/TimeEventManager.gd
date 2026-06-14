class_name TimeEventManager
extends Node

signal time_event_spawned(event_id: String, target_planet: Node3D, resource_type: String, duration_seconds: float)
signal time_event_expired(event_id: String)

@export var EventIntervalSeconds: float = 45.0
@export var GalaxyManagerPath: NodePath = ".."
@export var PlayerPath: NodePath = "../Player"
@export_file("*.json") var EventTemplatesPath: String = "res://data/time_events.json"

var ActiveEventText: String = "Time Event: none"

var _rng := RandomNumberGenerator.new()
var _templates: Array[Dictionary] = []
var _active_events: Dictionary = {}
var _active_event_planet_ids: Dictionary = {}

var _timer: Timer
var _galaxy_manager: GalaxyManager
var _player: PlayerController

func _ready() -> void:
    _rng.randomize()

    _galaxy_manager = get_node_or_null(GalaxyManagerPath)
    if _galaxy_manager == null:
        _galaxy_manager = get_parent() as GalaxyManager

    _player = get_node_or_null(PlayerPath)

    _load_templates()

    _timer = Timer.new()
    _timer.name = "EventTimer"
    _timer.one_shot = false
    _timer.autostart = true
    _timer.wait_time = EventIntervalSeconds
    add_child(_timer)
    _timer.timeout.connect(_on_event_timer_timeout)

    DevLog.info("Time event manager ready. Templates=%d, interval=%.0fs" % [_templates.size(), EventIntervalSeconds])

func _process(delta: float) -> void:
    if _active_events.is_empty():
        ActiveEventText = "Time Event: none"
        return

    var expired_ids: Array[String] = []

    for id in _active_events.keys():
        var evt: Dictionary = _active_events[id]
        evt["remaining_seconds"] = float(evt["remaining_seconds"]) - delta
        _active_events[id] = evt

        if float(evt["remaining_seconds"]) <= 0.0:
            expired_ids.append(id)

    for id in expired_ids:
        if not _active_events.has(id):
            continue

        var evt: Dictionary = _active_events[id]
        _active_event_planet_ids.erase(evt["planet_id"])
        _active_events.erase(id)
        time_event_expired.emit(id)
        DevLog.info("Timed event expired: %s on %s" % [id, evt["planet_id"]])

    ActiveEventText = _build_active_event_text()

func _on_event_timer_timeout() -> void:
    if _galaxy_manager == null or _player == null or _templates.is_empty():
        return

    const MAX_ATTEMPTS := 12
    for _attempt in range(MAX_ATTEMPTS):
        var template := _pick_weighted_template()
        var resource_type_name: String = str(template.get("resource_type", "air"))
        var resource_type := _resource_type_from_name(resource_type_name)
        if resource_type == -1:
            continue

        var target_planet := _galaxy_manager.TryPickNearbyUndiscoveredPlanet(
            _player.global_position,
            float(template.get("spawn_radius_min", 120.0)),
            float(template.get("spawn_radius_max", 700.0))
        )
        if target_planet == null:
            continue

        var planet_id: String = target_planet.Data.id
        if _active_event_planet_ids.has(planet_id) or _galaxy_manager.PlanetHasActiveTimedEvent(target_planet):
            continue

        var event_id := "%s_%d_%d" % [
            str(template.get("id", "event")),
            Time.get_unix_time_from_system(),
            _rng.randi_range(100, 999),
        ]

        var amount := float(template.get("amount", 120.0))
        var duration_seconds := float(template.get("duration_seconds", 180.0))
        var injected := _galaxy_manager.TryInjectTimedResourceEvent(
            event_id,
            target_planet,
            resource_type,
            amount,
            duration_seconds
        )

        if not injected:
            continue

        _active_event_planet_ids[planet_id] = true
        _active_events[event_id] = {
            "event_id": event_id,
            "planet_id": planet_id,
            "resource_type": resource_type,
            "remaining_seconds": duration_seconds,
        }

        ActiveEventText = _build_active_event_text()
        time_event_spawned.emit(event_id, target_planet, resource_type_name, duration_seconds)
        DevLog.info(
            "Timed event spawned: %s, planet=%s, resource=%s, duration=%.0fs, amount=%.0f"
            % [event_id, planet_id, resource_type_name, duration_seconds, amount]
        )
        break

func _load_templates() -> void:
    _templates.clear()

    if not FileAccess.file_exists(EventTemplatesPath):
        DevLog.warn("Time event template file missing (%s). Using fallback templates." % EventTemplatesPath)
        _load_fallback_templates()
        return

    var file := FileAccess.open(EventTemplatesPath, FileAccess.READ)
    if file == null:
        DevLog.warn("Unable to read time event templates (%s). Using fallback templates." % EventTemplatesPath)
        _load_fallback_templates()
        return

    var json_text := file.get_as_text()
    if json_text.strip_edges().is_empty():
        DevLog.warn("Time event templates are empty (%s). Using fallback templates." % EventTemplatesPath)
        _load_fallback_templates()
        return

    var parsed_variant: Variant = JSON.parse_string(json_text)
    if not (parsed_variant is Array):
        DevLog.warn("No valid time event templates found in %s. Using fallback templates." % EventTemplatesPath)
        _load_fallback_templates()
        return

    var parsed: Array = parsed_variant
    if parsed.is_empty():
        DevLog.warn("No valid time event templates found in %s. Using fallback templates." % EventTemplatesPath)
        _load_fallback_templates()
        return

    for item in parsed:
        if item is Dictionary:
            _templates.append(item)

    if _templates.is_empty():
        DevLog.warn("No valid time event templates found in %s. Using fallback templates." % EventTemplatesPath)
        _load_fallback_templates()
        return

    DevLog.info("Loaded %d time event templates from %s." % [_templates.size(), EventTemplatesPath])

func _load_fallback_templates() -> void:
    _templates.append({
        "id": "fallback_air",
        "resource_type": "air",
        "amount": 220.0,
        "duration_seconds": 180.0,
        "spawn_radius_min": 120.0,
        "spawn_radius_max": 700.0,
        "rarity_weight": 1.0,
    })

    _templates.append({
        "id": "fallback_metals",
        "resource_type": "metals",
        "amount": 180.0,
        "duration_seconds": 140.0,
        "spawn_radius_min": 140.0,
        "spawn_radius_max": 760.0,
        "rarity_weight": 0.7,
    })

func _pick_weighted_template() -> Dictionary:
    var total_weight := 0.0
    for template in _templates:
        total_weight += maxf(0.001, float(template.get("rarity_weight", 1.0)))

    var roll := _rng.randf_range(0.0, total_weight)
    var accum := 0.0

    for template in _templates:
        accum += maxf(0.001, float(template.get("rarity_weight", 1.0)))
        if roll <= accum:
            return template

    return _templates[0]

func _build_active_event_text() -> String:
    if _active_events.is_empty():
        return "Time Event: none"

    var soonest: Dictionary = {}
    for evt in _active_events.values():
        if soonest.is_empty() or float(evt["remaining_seconds"]) < float(soonest["remaining_seconds"]):
            soonest = evt

    if soonest.is_empty():
        return "Time Event: none"

    return "Event: %s surge on %s (%ds)" % [
        _resource_name_from_type(int(soonest["resource_type"])),
        str(soonest["planet_id"]),
        ceili(float(soonest["remaining_seconds"])),
    ]

func _resource_type_from_name(name_value: String) -> int:
    var normalized := name_value.to_lower()
    match normalized:
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

func _resource_name_from_type(resource_type: int) -> String:
    match resource_type:
        ResourceType.Water:
            return "Water"
        ResourceType.Oil:
            return "Oil"
        ResourceType.Air:
            return "Air"
        ResourceType.Metals:
            return "Metals"
        ResourceType.Minerals:
            return "Minerals"
        _:
            return "Unknown"
