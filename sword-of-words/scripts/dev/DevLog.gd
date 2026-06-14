class_name DevLog
extends RefCounted

const MAX_LINES := 200

static var lines: Array[String] = []
static var _listeners: Array[Callable] = []

static func subscribe(listener: Callable) -> void:
    if not _listeners.has(listener):
        _listeners.append(listener)

static func unsubscribe(listener: Callable) -> void:
    _listeners.erase(listener)

static func info(message: String) -> void:
    _add("INFO", message)

static func warn(message: String) -> void:
    _add("WARN", message)

static func error(message: String) -> void:
    _add("ERROR", message)

static func _add(level: String, message: String) -> void:
    var timestamp := Time.get_datetime_string_from_system()
    var line := "[%s] [%s] %s" % [timestamp, level, message]

    lines.append(line)
    if lines.size() > MAX_LINES:
        lines.remove_at(0)

    for listener in _listeners:
        if listener.is_valid():
            listener.call(line)

    print(line)
