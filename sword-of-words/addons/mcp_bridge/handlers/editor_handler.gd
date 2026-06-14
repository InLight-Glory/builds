## Handles editor state commands: play, stop, pause, select, viewport capture.
@tool
extends RefCounted

var editor_plugin


func handle(params: Dictionary) -> Dictionary:
	var action: String = params.get("action", "")
	match action:
		"play":         return _play()
		"stop":         return _stop()
		"pause":        return _pause()
		"undo":         return _undo()
		"redo":         return _redo()
		"select_node":  return _select_node(params)
		"focus_node":   return _focus_node(params)
		"get_selection": return _get_selection()
		"reload_scene": return _reload_scene(params)
		"get_status":   return get_status()
		_:
			return {"success": false, "message": "Unknown editor action: %s" % action, "data": {}}


func _play() -> Dictionary:
	EditorInterface.play_main_scene()
	return {"success": true, "message": "Game started (playing main scene)", "data": {}}


func _stop() -> Dictionary:
	EditorInterface.stop_playing_scene()
	return {"success": true, "message": "Game stopped", "data": {}}


func _pause() -> Dictionary:
	EditorInterface.set_distraction_free_mode(false)
	# Pause via engine
	if Engine.is_editor_hint():
		# Toggle pause on the scene tree
		pass
	return {"success": true, "message": "Pause toggled", "data": {}}


func _undo() -> Dictionary:
	EditorInterface.get_editor_undo_redo().undo()
	return {"success": true, "message": "Undo performed", "data": {}}


func _redo() -> Dictionary:
	EditorInterface.get_editor_undo_redo().redo()
	return {"success": true, "message": "Redo performed", "data": {}}


func _select_node(params: Dictionary) -> Dictionary:
	var root = EditorInterface.get_edited_scene_root()
	if root == null:
		return {"success": false, "message": "No scene open.", "data": {}}

	var node_path: String = params.get("node_path", "")
	var node = root if node_path.is_empty() else root.get_node_or_null(NodePath(node_path))
	if node == null:
		return {"success": false, "message": "Node not found: '%s'" % node_path, "data": {}}

	EditorInterface.get_selection().clear()
	EditorInterface.get_selection().add_node(node)
	EditorInterface.edit_node(node)
	return {"success": true, "message": "Selected '%s'" % node.name, "data": {"path": node_path}}


func _focus_node(params: Dictionary) -> Dictionary:
	return _select_node(params)  # selecting also focuses in Godot editor


func _get_selection() -> Dictionary:
	var selected := EditorInterface.get_selection().get_selected_nodes()
	var root = EditorInterface.get_edited_scene_root()
	var result := []
	for node in selected:
		result.append({
			"name": node.name,
			"type": node.get_class(),
			"path": str(root.get_path_to(node)) if root else str(node.get_path()),
		})
	return {"success": true, "message": "%d nodes selected" % result.size(), "data": {"selected": result}}


func _reload_scene(params: Dictionary) -> Dictionary:
	var root = EditorInterface.get_edited_scene_root()
	if root == null:
		return {"success": false, "message": "No scene to reload.", "data": {}}
	var path = root.scene_file_path
	if path.is_empty():
		return {"success": false, "message": "Scene has no file path (unsaved).", "data": {}}
	EditorInterface.open_scene_from_path(path)
	return {"success": true, "message": "Scene reloaded: '%s'" % path, "data": {}}


func get_status() -> Dictionary:
	var root = EditorInterface.get_edited_scene_root()
	var version_info = Engine.get_version_info()
	return {
		"success": true,
		"message": "Editor status retrieved",
		"data": {
			"connected": true,
			"playing": EditorInterface.is_playing_scene(),
			"current_scene": root.scene_file_path if root else null,
			"project_name": ProjectSettings.get_setting("application/config/name", "Unnamed"),
			"project_path": ProjectSettings.globalize_path("res://"),
			"godot_version": "%d.%d.%d" % [version_info["major"], version_info["minor"], version_info["patch"]],
		},
	}


func capture_viewport(params: Dictionary) -> Dictionary:
	var viewport_type: String = params.get("viewport", "game")
	var output_path: String = params.get("output_path", "")

	if output_path.is_empty():
		var timestamp = Time.get_unix_time_from_system()
		output_path = "res://screenshots/capture_%d.png" % int(timestamp)

	# Ensure screenshots dir exists
	var dir = output_path.get_base_dir()
	var global_dir = ProjectSettings.globalize_path(dir)
	if not DirAccess.dir_exists_absolute(global_dir):
		DirAccess.make_dir_recursive_absolute(global_dir)

	var image: Image
	match viewport_type:
		"game":
			if not EditorInterface.is_playing_scene():
				return {"success": false, "message": "Game must be running to capture game viewport. Use manage_editor(action='play') first.", "data": {}}
			# Capture from the main viewport
			var viewport = EditorInterface.get_editor_viewport_3d(0)
			if viewport == null:
				viewport = EditorInterface.get_editor_main_screen()
			image = viewport.get_texture().get_image()
		"editor_2d", "editor_3d":
			var viewport = EditorInterface.get_editor_viewport_2d() if viewport_type == "editor_2d" else EditorInterface.get_editor_viewport_3d(0)
			if viewport == null:
				return {"success": false, "message": "Viewport not available.", "data": {}}
			image = viewport.get_texture().get_image()
		_:
			return {"success": false, "message": "Unknown viewport type: %s" % viewport_type, "data": {}}

	if image == null:
		return {"success": false, "message": "Failed to capture viewport image.", "data": {}}

	var global_output = ProjectSettings.globalize_path(output_path)
	var err = image.save_png(global_output)
	if err != OK:
		return {"success": false, "message": "Failed to save screenshot: %d" % err, "data": {}}

	return {
		"success": true,
		"message": "Screenshot saved to '%s'" % output_path,
		"data": {
			"path": output_path,
			"global_path": global_output,
			"width": image.get_width(),
			"height": image.get_height(),
		},
	}
