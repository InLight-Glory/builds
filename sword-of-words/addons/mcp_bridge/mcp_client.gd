## WebSocket client that connects to the Python MCP bridge server.
## Maintains persistent connection, auto-reconnects, and dispatches commands.
@tool
extends Node

signal status_changed(connected: bool)

var command_handler  # CommandHandler node

const SERVER_URL := "ws://localhost:8765"
const RECONNECT_INTERVAL := 3.0

var _peer: WebSocketPeer
var _reconnect_timer := 0.0
var _connected := false


func _ready() -> void:
	_connect_to_server()


func _process(delta: float) -> void:
	if _peer == null:
		return

	_peer.poll()
	var state := _peer.get_ready_state()

	match state:
		WebSocketPeer.STATE_CONNECTING:
			pass

		WebSocketPeer.STATE_OPEN:
			if not _connected:
				_connected = true
				_reconnect_timer = 0.0
				status_changed.emit(true)
				print("[MCP Bridge] Connected to MCP server.")
				_send_hello()

			while _peer.get_available_packet_count() > 0:
				var raw := _peer.get_packet()
				_handle_raw_message(raw.get_string_from_utf8())

		WebSocketPeer.STATE_CLOSING:
			pass

		WebSocketPeer.STATE_CLOSED:
			if _connected:
				_connected = false
				status_changed.emit(false)
				print("[MCP Bridge] Disconnected from MCP server. Will retry...")

			_reconnect_timer += delta
			if _reconnect_timer >= RECONNECT_INTERVAL:
				_reconnect_timer = 0.0
				_connect_to_server()


func _connect_to_server() -> void:
	_peer = WebSocketPeer.new()
	var err := _peer.connect_to_url(SERVER_URL)
	if err != OK:
		push_warning("[MCP Bridge] WebSocket connect error: %s" % err)


func is_connected_to_server() -> bool:
	return _connected


func send_response(id: String, success: bool, message: String, data: Dictionary = {}) -> void:
	if not _connected or _peer.get_ready_state() != WebSocketPeer.STATE_OPEN:
		push_warning("[MCP Bridge] Cannot send response: not connected.")
		return
	var payload := {
		"id": id,
		"success": success,
		"message": message,
		"data": data,
	}
	_peer.send_text(JSON.stringify(payload))


func push_log(message: String, level: String = "print") -> void:
	## Push a log line to the Python server's output log.
	if not _connected or _peer.get_ready_state() != WebSocketPeer.STATE_OPEN:
		return
	var payload := {
		"type": "log",
		"level": level,
		"message": "[%s] %s" % [Time.get_time_string_from_system(), message],
	}
	_peer.send_text(JSON.stringify(payload))


func _send_hello() -> void:
	var info := {
		"type": "hello",
		"godot_version": Engine.get_version_info(),
		"project_path": ProjectSettings.globalize_path("res://"),
		"project_name": ProjectSettings.get_setting("application/config/name", "Unnamed"),
	}
	_peer.send_text(JSON.stringify(info))


func _handle_raw_message(text: String) -> void:
	var data = JSON.parse_string(text)
	if data == null or not data is Dictionary:
		push_warning("[MCP Bridge] Invalid JSON from server: %s" % text.left(100))
		return

	var cmd_id: String = data.get("id", "")
	var command: String = data.get("command", "")
	var params: Dictionary = data.get("params", {})

	if command.is_empty():
		return  # hello/ack messages, ignore

	if command_handler == null:
		send_response(cmd_id, false, "CommandHandler not initialized", {})
		return

	# Dispatch to command handler (may be async via deferred)
	command_handler.handle_command(cmd_id, command, params, self)
