class_name PlanetResourcePool
extends Node

signal timed_resource_event_added(event_id: String, resource_type: String, amount: float, duration_seconds: float)
signal timed_resource_event_expired(event_id: String)

var _planet: PlanetNode
var _current_amounts: Dictionary = {}
var _timed_boosts: Array[Dictionary] = []

var ActiveTimedEventCount: int:
    get:
        return _timed_boosts.size()

func _ready() -> void:
    _planet = get_parent() as PlanetNode
    _initialize_from_planet_data()

func _process(delta: float) -> void:
    if _planet == null:
        return

    for resource_type in _planet.Data.resources.keys():
        var config: ResourcePoolConfig = _planet.Data.resources[resource_type]

        if not _current_amounts.has(resource_type):
            _current_amounts[resource_type] = 0.0

        var regen := config.regen_speed * config.abundance * delta
        var max_with_timed_boosts := config.max + _get_timed_boost_capacity(resource_type)
        _current_amounts[resource_type] = minf(max_with_timed_boosts, _current_amounts[resource_type] + regen)

    _update_timed_boosts(delta)

func Harvest(resource_type: int, requested_amount: float) -> float:
    if not _current_amounts.has(resource_type):
        return 0.0

    var current: float = _current_amounts[resource_type]
    var harvested: float = minf(current, maxf(0.0, requested_amount))
    _current_amounts[resource_type] = current - harvested
    _consume_timed_boost(resource_type, harvested)
    return harvested

func AddTimedResourceEvent(event_id: String, resource_type: int, amount: float, duration_seconds: float) -> bool:
    if event_id.strip_edges().is_empty() or amount <= 0.0 or duration_seconds <= 0.0:
        return false

    if HasTimedEvent(event_id):
        return false

    if not _current_amounts.has(resource_type):
        _current_amounts[resource_type] = 0.0

    _timed_boosts.append({
        "event_id": event_id,
        "type": resource_type,
        "remaining_amount": amount,
        "remaining_seconds": duration_seconds,
    })

    _current_amounts[resource_type] += amount
    timed_resource_event_added.emit(event_id, str(resource_type), amount, duration_seconds)
    return true

func HasTimedEvent(event_id: String) -> bool:
    for boost in _timed_boosts:
        if boost["event_id"] == event_id:
            return true

    return false

func GetAmount(resource_type: int) -> float:
    return _current_amounts.get(resource_type, 0.0)

func _initialize_from_planet_data() -> void:
    _current_amounts.clear()
    _timed_boosts.clear()

    if _planet == null:
        return

    for resource_type in _planet.Data.resources.keys():
        var config: ResourcePoolConfig = _planet.Data.resources[resource_type]
        _current_amounts[resource_type] = config.max * config.abundance

func _update_timed_boosts(delta: float) -> void:
    for i in range(_timed_boosts.size() - 1, -1, -1):
        var boost: Dictionary = _timed_boosts[i]
        boost["remaining_seconds"] = float(boost["remaining_seconds"]) - delta

        if float(boost["remaining_seconds"]) > 0.0:
            _timed_boosts[i] = boost
            continue

        var resource_type: int = boost["type"]
        if _current_amounts.has(resource_type):
            _current_amounts[resource_type] = maxf(
                0.0,
                float(_current_amounts[resource_type]) - float(boost["remaining_amount"])
            )

        _timed_boosts.remove_at(i)
        timed_resource_event_expired.emit(str(boost["event_id"]))

func _get_timed_boost_capacity(resource_type: int) -> float:
    var total := 0.0

    for boost in _timed_boosts:
        if int(boost["type"]) == resource_type:
            total += float(boost["remaining_amount"])

    return total

func _consume_timed_boost(resource_type: int, harvested_amount: float) -> void:
    var remaining_harvest := harvested_amount

    for i in range(_timed_boosts.size()):
        if remaining_harvest <= 0.0:
            break

        var boost: Dictionary = _timed_boosts[i]
        if int(boost["type"]) != resource_type or float(boost["remaining_amount"]) <= 0.0:
            continue

        var consumed: float = minf(float(boost["remaining_amount"]), remaining_harvest)
        boost["remaining_amount"] = float(boost["remaining_amount"]) - consumed
        _timed_boosts[i] = boost
        remaining_harvest -= consumed
