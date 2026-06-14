## Routes incoming MCP commands to the appropriate handler.
## Each command maps to a method in one of the handler scripts.
@tool
extends Node

var editor_plugin  # Reference to the EditorPlugin for accessing EditorInterface

# Lazy-loaded handler instances
var _node_handler
var _scene_handler
var _script_handler
var _editor_handler
var _project_handler
var _resource_handler


func _get_node_handler():
	if _node_handler == null:
		var Handler = load("res://addons/mcp_bridge/handlers/node_handler.gd")
		_node_handler = Handler.new()
		_node_handler.editor_plugin = editor_plugin
	return _node_handler


func _get_scene_handler():
	if _scene_handler == null:
		var Handler = load("res://addons/mcp_bridge/handlers/scene_handler.gd")
		_scene_handler = Handler.new()
		_scene_handler.editor_plugin = editor_plugin
	return _scene_handler


func _get_script_handler():
	if _script_handler == null:
		var Handler = load("res://addons/mcp_bridge/handlers/script_handler.gd")
		_script_handler = Handler.new()
		_script_handler.editor_plugin = editor_plugin
	return _script_handler


func _get_editor_handler():
	if _editor_handler == null:
		var Handler = load("res://addons/mcp_bridge/handlers/editor_handler.gd")
		_editor_handler = Handler.new()
		_editor_handler.editor_plugin = editor_plugin
	return _editor_handler


func _get_project_handler():
	if _project_handler == null:
		var Handler = load("res://addons/mcp_bridge/handlers/project_handler.gd")
		_project_handler = Handler.new()
		_project_handler.editor_plugin = editor_plugin
	return _project_handler


func _get_resource_handler():
	if _resource_handler == null:
		var Handler = load("res://addons/mcp_bridge/handlers/resource_handler.gd")
		_resource_handler = Handler.new()
		_resource_handler.editor_plugin = editor_plugin
	return _resource_handler


func handle_command(cmd_id: String, command: String, params: Dictionary, client) -> void:
	var result: Dictionary

	match command:
		# Node operations
		"manage_node":
			result = _get_node_handler().handle(params)
		"find_nodes":
			result = _get_node_handler().find_nodes(params)
		"inspect_node":
			result = _get_node_handler().inspect_node(params)
		"manage_signal":
			result = _get_node_handler().manage_signal(params)

		# Scene operations
		"manage_scene":
			result = _get_scene_handler().handle(params)
		"get_scene_tree":
			result = _get_scene_handler().get_tree(params)

		# Batch execution
		"batch_execute":
			result = _handle_batch(params, client)

		# Script operations
		"manage_script":
			result = _get_script_handler().handle(params)
		"apply_script_edits":
			result = _get_script_handler().apply_edits(params)
		"execute_gdscript":
			result = _get_script_handler().execute_code(params)

		# Editor operations
		"manage_editor":
			result = _get_editor_handler().handle(params)
		"get_editor_status":
			result = _get_editor_handler().get_status()
		"capture_viewport":
			result = _get_editor_handler().capture_viewport(params)

		# Project operations
		"manage_project":
			result = _get_project_handler().handle(params)
		"create_game_structure":
			result = _get_project_handler().create_game_structure(params)

		# Resource / asset operations
		"manage_resource":
			result = _get_resource_handler().handle(params)
		"manage_animation":
			result = _get_resource_handler().manage_animation(params)
		"generate_placeholder_asset":
			result = _get_resource_handler().generate_placeholder(params)

		_:
			result = {
				"success": false,
				"message": "Unknown command: %s" % command,
				"data": {},
			}

	client.send_response(cmd_id, result.get("success", false), result.get("message", ""), result.get("data", {}))


func _handle_batch(params: Dictionary, client) -> Dictionary:
	var operations: Array = params.get("operations", [])
	var stop_on_error: bool = params.get("stop_on_error", true)
	var results := []

	for op in operations:
		var sub_cmd: String = op.get("command", "")
		var sub_params: Dictionary = op.get("params", {})

		# Re-use handle_command logic synchronously (batch doesn't chain responses)
		var sub_result: Dictionary
		match sub_cmd:
			"manage_node":     sub_result = _get_node_handler().handle(sub_params)
			"manage_scene":    sub_result = _get_scene_handler().handle(sub_params)
			"manage_script":   sub_result = _get_script_handler().handle(sub_params)
			"manage_editor":   sub_result = _get_editor_handler().handle(sub_params)
			"manage_project":  sub_result = _get_project_handler().handle(sub_params)
			"manage_resource": sub_result = _get_resource_handler().handle(sub_params)
			_:
				sub_result = {"success": false, "message": "Unknown sub-command: %s" % sub_cmd, "data": {}}

		results.append({"command": sub_cmd, "result": sub_result})

		if stop_on_error and not sub_result.get("success", false):
			return {
				"success": false,
				"message": "Batch stopped at '%s': %s" % [sub_cmd, sub_result.get("message", "error")],
				"data": {"results": results, "stopped_at": results.size() - 1},
			}

	var all_ok := results.all(func(r): return r["result"].get("success", false))
	return {
		"success": all_ok,
		"message": "Batch completed: %d/%d succeeded" % [results.filter(func(r): return r["result"].get("success", false)).size(), results.size()],
		"data": {"results": results},
	}
