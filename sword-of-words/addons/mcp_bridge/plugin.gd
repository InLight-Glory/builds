@tool
extends EditorPlugin

const MCPClient = preload("res://addons/mcp_bridge/mcp_client.gd")
const CommandHandler = preload("res://addons/mcp_bridge/command_handler.gd")

var _mcp_client: MCPClient
var _command_handler: CommandHandler
var _status_button: Button

func _enter_tree() -> void:
	_command_handler = CommandHandler.new()
	_command_handler.editor_plugin = self

	_mcp_client = MCPClient.new()
	_mcp_client.command_handler = _command_handler
	add_child(_mcp_client)

	_status_button = Button.new()
	_status_button.text = "MCP: Connecting..."
	_status_button.flat = true
	_status_button.pressed.connect(_on_status_button_pressed)
	add_control_to_container(CONTAINER_TOOLBAR, _status_button)

	_mcp_client.status_changed.connect(_on_mcp_status_changed)

	print("[MCP Bridge] Plugin loaded. Connecting to MCP server on ws://localhost:8765...")


func _exit_tree() -> void:
	if _mcp_client:
		_mcp_client.queue_free()
	if _status_button:
		remove_control_from_container(CONTAINER_TOOLBAR, _status_button)
		_status_button.queue_free()


func _on_mcp_status_changed(connected: bool) -> void:
	if connected:
		_status_button.text = "MCP: Connected"
		_status_button.add_theme_color_override("font_color", Color(0.2, 0.9, 0.3))
	else:
		_status_button.text = "MCP: Disconnected"
		_status_button.add_theme_color_override("font_color", Color(0.9, 0.3, 0.2))


func _on_status_button_pressed() -> void:
	var dialog = AcceptDialog.new()
	dialog.title = "MCP Bridge Status"
	var info = "MCP Bridge v1.0.0\n\n"
	if _mcp_client and _mcp_client.is_connected_to_server():
		info += "Status: CONNECTED\n"
		info += "Server: ws://localhost:8765\n\n"
		info += "AI assistants can now control this editor.\n"
		info += "Configure your AI client with:\n"
		info += "  python -m mcp_server (stdio mode)"
	else:
		info += "Status: DISCONNECTED\n\n"
		info += "Start the MCP server:\n"
		info += "  cd Godot_4.5.1_MCP\n"
		info += "  start.bat  (Windows)\n"
		info += "  ./start.sh  (Linux/Mac)"
	dialog.dialog_text = info
	get_editor_interface().get_base_control().add_child(dialog)
	dialog.popup_centered()
