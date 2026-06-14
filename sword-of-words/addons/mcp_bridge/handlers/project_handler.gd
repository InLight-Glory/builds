## Handles project settings, input maps, autoloads, and game structure creation.
@tool
extends RefCounted

var editor_plugin


func handle(params: Dictionary) -> Dictionary:
	var action: String = params.get("action", "")
	match action:
		"get_settings":      return _get_settings()
		"set_setting":       return _set_setting(params)
		"get_input_map":     return _get_input_map()
		"add_input_action":  return _add_input_action(params)
		"remove_input_action": return _remove_input_action(params)
		"add_input_event":   return _add_input_event(params)
		"get_autoloads":     return _get_autoloads()
		"add_autoload":      return _add_autoload(params)
		"remove_autoload":   return _remove_autoload(params)
		"get_groups":        return _get_groups()
		"get_layers":        return _get_layers()
		_:
			return {"success": false, "message": "Unknown project action: %s" % action, "data": {}}


func _get_settings() -> Dictionary:
	var settings := {
		"project_name": ProjectSettings.get_setting("application/config/name", ""),
		"main_scene": ProjectSettings.get_setting("application/run/main_scene", ""),
		"viewport_width": ProjectSettings.get_setting("display/window/size/viewport_width", 1280),
		"viewport_height": ProjectSettings.get_setting("display/window/size/viewport_height", 720),
		"gravity_2d": ProjectSettings.get_setting("physics/2d/default_gravity", 980.0),
		"gravity_3d": ProjectSettings.get_setting("physics/3d/default_gravity", 9.8),
		"project_path": ProjectSettings.globalize_path("res://"),
	}
	return {"success": true, "message": "Settings retrieved", "data": settings}


func _set_setting(params: Dictionary) -> Dictionary:
	var path: String = params.get("setting_path", "")
	var value = params.get("setting_value")
	if path.is_empty():
		return {"success": false, "message": "setting_path required.", "data": {}}

	ProjectSettings.set_setting(path, value)
	ProjectSettings.save()
	return {"success": true, "message": "Set '%s' = %s" % [path, str(value)], "data": {}}


func _get_input_map() -> Dictionary:
	var actions := {}
	for action_name in InputMap.get_actions():
		var events := []
		for event in InputMap.action_get_events(action_name):
			if event is InputEventKey:
				events.append({"type": "key", "key": OS.get_keycode_string(event.keycode)})
			elif event is InputEventJoypadButton:
				events.append({"type": "joypad_button", "button": event.button_index})
			elif event is InputEventMouseButton:
				events.append({"type": "mouse_button", "button": event.button_index})
		actions[action_name] = events
	return {"success": true, "message": "Input map retrieved", "data": {"actions": actions}}


func _add_input_action(params: Dictionary) -> Dictionary:
	var action_name: String = params.get("action_name", "")
	if action_name.is_empty():
		return {"success": false, "message": "action_name required.", "data": {}}

	if not InputMap.has_action(action_name):
		InputMap.add_action(action_name)

	# Save to ProjectSettings
	var setting_path = "input/%s" % action_name
	ProjectSettings.set_setting(setting_path, {"deadzone": 0.5, "events": []})
	ProjectSettings.save()

	return {"success": true, "message": "Added input action '%s'" % action_name, "data": {}}


func _add_input_event(params: Dictionary) -> Dictionary:
	var action_name: String = params.get("action_name", "")
	var key: String = params.get("key", "")
	var joypad_button = params.get("joypad_button")

	if not InputMap.has_action(action_name):
		InputMap.add_action(action_name)

	if not key.is_empty():
		var event = InputEventKey.new()
		event.keycode = OS.find_keycode_from_string(key)
		if event.keycode == KEY_NONE:
			return {"success": false, "message": "Unknown key: '%s'. Use key names like 'A', 'Space', 'Left', 'Enter'." % key, "data": {}}
		InputMap.action_add_event(action_name, event)

	elif joypad_button != null:
		var event = InputEventJoypadButton.new()
		event.button_index = int(joypad_button)
		InputMap.action_add_event(action_name, event)
	else:
		return {"success": false, "message": "Provide 'key' (string) or 'joypad_button' (int).", "data": {}}

	# Persist to project settings
	var events_data := []
	for ev in InputMap.action_get_events(action_name):
		if ev is InputEventKey:
			events_data.append({"keycode": ev.keycode, "physical_keycode": ev.physical_keycode, "class": "InputEventKey"})
		elif ev is InputEventJoypadButton:
			events_data.append({"button_index": ev.button_index, "class": "InputEventJoypadButton"})

	ProjectSettings.set_setting("input/%s" % action_name, {"deadzone": 0.5, "events": events_data})
	ProjectSettings.save()

	return {"success": true, "message": "Added event to action '%s'" % action_name, "data": {}}


func _remove_input_action(params: Dictionary) -> Dictionary:
	var action_name: String = params.get("action_name", "")
	if InputMap.has_action(action_name):
		InputMap.erase_action(action_name)
	ProjectSettings.set_setting("input/%s" % action_name, null)
	ProjectSettings.save()
	return {"success": true, "message": "Removed input action '%s'" % action_name, "data": {}}


func _get_autoloads() -> Dictionary:
	var autoloads := {}
	for setting in ProjectSettings.get_property_list():
		var name = setting["name"]
		if name.begins_with("autoload/"):
			var al_name = name.substr("autoload/".length())
			autoloads[al_name] = ProjectSettings.get_setting(name)
	return {"success": true, "message": "Autoloads retrieved", "data": {"autoloads": autoloads}}


func _add_autoload(params: Dictionary) -> Dictionary:
	var al_name: String = params.get("autoload_name", "")
	var al_path: String = params.get("autoload_path", "")
	if al_name.is_empty() or al_path.is_empty():
		return {"success": false, "message": "autoload_name and autoload_path required.", "data": {}}
	if not ResourceLoader.exists(al_path):
		return {"success": false, "message": "Script not found: '%s'" % al_path, "data": {}}

	EditorInterface.get_editor_settings()  # ensure editor is ready
	ProjectSettings.set_setting("autoload/%s" % al_name, "*%s" % al_path)  # * prefix = enabled
	ProjectSettings.save()

	return {"success": true, "message": "Added autoload '%s' → '%s'" % [al_name, al_path], "data": {}}


func _remove_autoload(params: Dictionary) -> Dictionary:
	var al_name: String = params.get("autoload_name", "")
	ProjectSettings.set_setting("autoload/%s" % al_name, null)
	ProjectSettings.save()
	return {"success": true, "message": "Removed autoload '%s'" % al_name, "data": {}}


func _get_groups() -> Dictionary:
	# Scan all scenes for group memberships
	return {"success": true, "message": "Use find_nodes(group=...) to find nodes by group", "data": {}}


func _get_layers() -> Dictionary:
	var physics_2d := []
	var physics_3d := []
	var render_2d := []
	var render_3d := []
	for i in range(1, 33):
		physics_2d.append(ProjectSettings.get_setting("layer_names/2d_physics/layer_%d" % i, ""))
		physics_3d.append(ProjectSettings.get_setting("layer_names/3d_physics/layer_%d" % i, ""))
		render_2d.append(ProjectSettings.get_setting("layer_names/2d_render/layer_%d" % i, ""))
		render_3d.append(ProjectSettings.get_setting("layer_names/3d_render/layer_%d" % i, ""))
	return {
		"success": true, "message": "Layers retrieved",
		"data": {"2d_physics": physics_2d, "3d_physics": physics_3d, "2d_render": render_2d, "3d_render": render_3d}
	}


func create_game_structure(params: Dictionary) -> Dictionary:
	var game_name: String = params.get("game_name", "MyGame")
	var game_type: String = params.get("game_type", "generic_2d")
	var width: int = params.get("viewport_width", 1280)
	var height: int = params.get("viewport_height", 720)

	# Set project name and display settings
	ProjectSettings.set_setting("application/config/name", game_name)
	ProjectSettings.set_setting("display/window/size/viewport_width", width)
	ProjectSettings.set_setting("display/window/size/viewport_height", height)
	ProjectSettings.set_setting("display/window/stretch/mode", "canvas_items")
	ProjectSettings.set_setting("display/window/stretch/aspect", "keep")

	# Create folder structure
	for folder in ["res://scenes", "res://scripts", "res://assets", "res://ui", "res://audio", "res://screenshots"]:
		var global = ProjectSettings.globalize_path(folder)
		if not DirAccess.dir_exists_absolute(global):
			DirAccess.make_dir_recursive_absolute(global)

	# Setup input map based on game type
	_setup_input_for_type(game_type)

	# Create game manager autoload
	_create_game_manager(game_type)

	# Set main scene based on type
	var main_scene_path = "res://scenes/main.tscn"
	ProjectSettings.set_setting("application/run/main_scene", main_scene_path)

	ProjectSettings.save()
	EditorInterface.get_resource_filesystem().scan()

	return {
		"success": true,
		"message": "Game structure created for '%s' (%s %dx%d)" % [game_name, game_type, width, height],
		"data": {
			"folders": ["scenes/", "scripts/", "assets/", "ui/", "audio/"],
			"main_scene": main_scene_path,
			"autoloads": ["GameManager"],
			"next_step": "Use manage_scene(action='create') to create your scenes, then manage_node to add nodes.",
		},
	}


func _setup_input_for_type(game_type: String) -> void:
	var actions := {}

	match game_type:
		"platformer_2d":
			actions = {
				"move_left": ["A", "Left"], "move_right": ["D", "Right"],
				"jump": ["Space", "Z"], "attack": ["X"], "interact": ["E"],
				"pause": ["Escape"],
			}
		"topdown_2d", "rpg_2d":
			actions = {
				"move_left": ["A", "Left"], "move_right": ["D", "Right"],
				"move_up": ["W", "Up"], "move_down": ["S", "Down"],
				"attack": ["Z", "Space"], "interact": ["E"], "pause": ["Escape"],
			}
		"fps_3d":
			actions = {
				"move_forward": ["W"], "move_backward": ["S"],
				"move_left": ["A"], "move_right": ["D"],
				"jump": ["Space"], "sprint": ["Shift"],
				"shoot": [], "reload": ["R"], "pause": ["Escape"],
			}
		"racing_3d":
			actions = {
				"accelerate": ["W", "Up"], "brake": ["S", "Down"],
				"steer_left": ["A", "Left"], "steer_right": ["D", "Right"],
				"handbrake": ["Space"], "pause": ["Escape"],
			}
		"puzzle_2d":
			actions = {
				"move_left": ["A", "Left"], "move_right": ["D", "Right"],
				"move_up": ["W", "Up"], "move_down": ["S", "Down"],
				"action": ["Space", "Enter"], "undo": ["Z"], "pause": ["Escape"],
			}
		_:  # generic
			actions = {
				"move_left": ["A", "Left"], "move_right": ["D", "Right"],
				"move_up": ["W", "Up"], "move_down": ["S", "Down"],
				"action": ["Space"], "pause": ["Escape"],
			}

	for action_name in actions:
		if not InputMap.has_action(action_name):
			InputMap.add_action(action_name)
		for key_name in actions[action_name]:
			var event = InputEventKey.new()
			event.keycode = OS.find_keycode_from_string(key_name)
			if event.keycode != KEY_NONE:
				InputMap.action_add_event(action_name, event)
		ProjectSettings.set_setting("input/%s" % action_name, {"deadzone": 0.5, "events": []})


func _create_game_manager(game_type: String) -> void:
	var script_path = "res://scripts/game_manager.gd"
	var content = """extends Node
## GameManager — global singleton accessible from any script as GameManager
## Auto-created by MCP Bridge for %s

signal game_started
signal game_paused(paused: bool)
signal game_over(won: bool)
signal score_changed(new_score: int)

var score: int = 0
var high_score: int = 0
var is_paused: bool = false
var current_level: int = 1


func _ready() -> void:
\tprocess_mode = Node.PROCESS_MODE_ALWAYS


func start_game() -> void:
\tscore = 0
\tcurrent_level = 1
\tis_paused = false
\tgame_started.emit()


func add_score(points: int) -> void:
\tscore += points
\tif score > high_score:
\t\thigh_score = score
\tscore_changed.emit(score)


func toggle_pause() -> void:
\tis_paused = not is_paused
\tget_tree().paused = is_paused
\tgame_paused.emit(is_paused)


func end_game(won: bool = false) -> void:
\tgame_over.emit(won)


func load_scene(path: String) -> void:
\tget_tree().change_scene_to_file(path)
""" % game_type

	var file = FileAccess.open(script_path, FileAccess.WRITE)
	if file:
		file.store_string(content)
		file.close()

	ProjectSettings.set_setting("autoload/GameManager", "*%s" % script_path)
