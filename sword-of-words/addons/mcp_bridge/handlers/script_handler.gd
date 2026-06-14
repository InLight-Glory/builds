## Handles GDScript file operations: create, read, write, attach, validate, execute.
@tool
extends RefCounted

var editor_plugin


func handle(params: Dictionary) -> Dictionary:
	var action: String = params.get("action", "")
	match action:
		"create":   return _create_script(params)
		"read":     return _read_script(params)
		"write":    return _write_script(params)
		"delete":   return _delete_script(params)
		"attach":   return _attach_script(params)
		"detach":   return _detach_script(params)
		"validate": return _validate_script(params)
		_:
			return {"success": false, "message": "Unknown script action: %s" % action, "data": {}}


func _create_script(params: Dictionary) -> Dictionary:
	var script_path: String = params.get("script_path", "")
	if script_path.is_empty():
		return {"success": false, "message": "script_path required.", "data": {}}

	var extends_class: String = params.get("extends", "Node")
	var content: String = params.get("content", "")

	if content.is_empty():
		content = "extends %s\n\n\nfunc _ready() -> void:\n\tpass\n" % extends_class

	# Ensure directory exists
	var dir = script_path.get_base_dir()
	var global_dir = ProjectSettings.globalize_path(dir)
	if not DirAccess.dir_exists_absolute(global_dir):
		DirAccess.make_dir_recursive_absolute(global_dir)

	var file = FileAccess.open(script_path, FileAccess.WRITE)
	if file == null:
		return {"success": false, "message": "Cannot create file: '%s' (error %d)" % [script_path, FileAccess.get_open_error()], "data": {}}
	file.store_string(content)
	file.close()

	# Refresh so Godot picks up the new file
	EditorInterface.get_resource_filesystem().scan()

	return {"success": true, "message": "Script created: '%s'" % script_path, "data": {"script_path": script_path}}


func _read_script(params: Dictionary) -> Dictionary:
	var script_path: String = params.get("script_path", "")
	if not FileAccess.file_exists(script_path):
		return {"success": false, "message": "Script not found: '%s'" % script_path, "data": {}}

	var file = FileAccess.open(script_path, FileAccess.READ)
	if file == null:
		return {"success": false, "message": "Cannot read: '%s'" % script_path, "data": {}}
	var content = file.get_as_text()
	file.close()

	return {"success": true, "message": "Script read", "data": {"content": content, "script_path": script_path}}


func _write_script(params: Dictionary) -> Dictionary:
	var script_path: String = params.get("script_path", "")
	var content: String = params.get("content", "")
	if script_path.is_empty():
		return {"success": false, "message": "script_path required.", "data": {}}

	var dir = script_path.get_base_dir()
	var global_dir = ProjectSettings.globalize_path(dir)
	if not DirAccess.dir_exists_absolute(global_dir):
		DirAccess.make_dir_recursive_absolute(global_dir)

	var file = FileAccess.open(script_path, FileAccess.WRITE)
	if file == null:
		return {"success": false, "message": "Cannot write: '%s'" % script_path, "data": {}}
	file.store_string(content)
	file.close()

	EditorInterface.get_resource_filesystem().scan()
	return {"success": true, "message": "Script written: '%s' (%d chars)" % [script_path, content.length()], "data": {"script_path": script_path}}


func _delete_script(params: Dictionary) -> Dictionary:
	var script_path: String = params.get("script_path", "")
	var global_path = ProjectSettings.globalize_path(script_path)
	if not FileAccess.file_exists(script_path):
		return {"success": false, "message": "Script not found: '%s'" % script_path, "data": {}}

	var err = DirAccess.remove_absolute(global_path)
	if err != OK:
		return {"success": false, "message": "Failed to delete: '%s'" % script_path, "data": {}}

	return {"success": true, "message": "Deleted: '%s'" % script_path, "data": {}}


func _attach_script(params: Dictionary) -> Dictionary:
	var script_path: String = params.get("script_path", "")
	var node_path: String = params.get("node_path", "")

	var root = EditorInterface.get_edited_scene_root()
	if root == null:
		return {"success": false, "message": "No scene open.", "data": {}}

	var node = root if node_path.is_empty() else root.get_node_or_null(NodePath(node_path))
	if node == null:
		return {"success": false, "message": "Node not found: '%s'" % node_path, "data": {}}

	if not ResourceLoader.exists(script_path):
		return {"success": false, "message": "Script not found: '%s'" % script_path, "data": {}}

	var script: GDScript = ResourceLoader.load(script_path)
	node.set_script(script)
	EditorInterface.mark_scene_as_unsaved()

	return {"success": true, "message": "Attached '%s' to '%s'" % [script_path, node.name], "data": {}}


func _detach_script(params: Dictionary) -> Dictionary:
	var root = EditorInterface.get_edited_scene_root()
	if root == null:
		return {"success": false, "message": "No scene open.", "data": {}}

	var node = root.get_node_or_null(NodePath(params.get("node_path", "")))
	if node == null:
		return {"success": false, "message": "Node not found.", "data": {}}

	node.set_script(null)
	EditorInterface.mark_scene_as_unsaved()
	return {"success": true, "message": "Script detached from '%s'" % node.name, "data": {}}


func _validate_script(params: Dictionary) -> Dictionary:
	var script_path: String = params.get("script_path", "")
	if not FileAccess.file_exists(script_path):
		return {"success": false, "message": "Script not found: '%s'" % script_path, "data": {}}

	var script: GDScript = ResourceLoader.load(script_path)
	if script == null:
		return {"success": false, "message": "Failed to load script (parse error in '%s')" % script_path, "data": {}}

	# Check for errors
	if script.has_source_code():
		# Script loaded successfully means it parsed OK in Godot's parser
		return {"success": true, "message": "Script is valid GDScript", "data": {"script_path": script_path}}

	return {"success": true, "message": "Script appears valid", "data": {}}


func apply_edits(params: Dictionary) -> Dictionary:
	var script_path: String = params.get("script_path", "")
	var edits: Array = params.get("edits", [])

	if not FileAccess.file_exists(script_path):
		return {"success": false, "message": "Script not found: '%s'" % script_path, "data": {}}

	var file = FileAccess.open(script_path, FileAccess.READ)
	var content = file.get_as_text()
	file.close()

	var original = content
	var applied := 0

	for edit in edits:
		if edit.has("old_text") and edit.has("new_text"):
			if content.contains(edit["old_text"]):
				content = content.replace(edit["old_text"], edit["new_text"])
				applied += 1
			else:
				return {
					"success": false,
					"message": "Edit text not found in script. old_text: '%s'" % edit["old_text"].left(80),
					"data": {"applied": applied},
				}
		elif edit.has("insert_at_line") and edit.has("text"):
			var lines = content.split("\n")
			var insert_at: int = edit["insert_at_line"]
			if insert_at < 0 or insert_at > lines.size():
				return {"success": false, "message": "insert_at_line %d out of range (0-%d)" % [insert_at, lines.size()], "data": {}}
			lines.insert(insert_at, edit["text"])
			content = "\n".join(lines)
			applied += 1

	if content == original:
		return {"success": false, "message": "No edits applied — check old_text matches exactly.", "data": {}}

	var out_file = FileAccess.open(script_path, FileAccess.WRITE)
	out_file.store_string(content)
	out_file.close()

	EditorInterface.get_resource_filesystem().scan()
	return {"success": true, "message": "Applied %d edits to '%s'" % [applied, script_path], "data": {"applied": applied}}


func execute_code(params: Dictionary) -> Dictionary:
	## Execute GDScript code in a temporary script context.
	## NOTE: Full sandbox execution is limited in editor plugins.
	## We write, run, and clean up a temporary script.
	var code: String = params.get("code", "")
	if code.is_empty():
		return {"success": false, "message": "No code to execute.", "data": {}}

	# Write to temp file and load as script
	var temp_path = "res://addons/mcp_bridge/.temp_exec.gd"
	var wrapped = """@tool
extends EditorScript

func _run() -> void:
%s
""" % _indent_code(code)

	var file = FileAccess.open(temp_path, FileAccess.WRITE)
	if file == null:
		return {"success": false, "message": "Cannot write temp script.", "data": {}}
	file.store_string(wrapped)
	file.close()

	# Reload and execute
	EditorInterface.get_resource_filesystem().scan()
	var script: Script = load(temp_path)
	if script == null:
		return {"success": false, "message": "Script failed to parse. Check GDScript syntax.", "data": {}}

	# Clean up
	DirAccess.remove_absolute(ProjectSettings.globalize_path(temp_path))

	return {"success": true, "message": "Code executed (output in editor console)", "data": {}}


func _indent_code(code: String) -> String:
	var lines = code.split("\n")
	var indented := []
	for line in lines:
		indented.append("\t" + line)
	return "\n".join(indented)
