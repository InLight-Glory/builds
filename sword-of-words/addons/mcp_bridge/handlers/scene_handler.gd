## Handles scene operations: create, open, save, close, get tree.
@tool
extends RefCounted

var editor_plugin


func handle(params: Dictionary) -> Dictionary:
	var action: String = params.get("action", "")
	match action:
		"create":              return _create_scene(params)
		"open":                return _open_scene(params)
		"save":                return _save_scene(params)
		"save_as":             return _save_scene_as(params)
		"close":               return _close_scene(params)
		"get_tree":            return get_tree(params)
		"set_root_type":       return _set_root_type(params)
		"instantiate_subscene": return _instantiate_subscene(params)
		_:
			return {"success": false, "message": "Unknown scene action: %s" % action, "data": {}}


func _create_scene(params: Dictionary) -> Dictionary:
	var scene_path: String = params.get("scene_path", "")
	if scene_path.is_empty():
		return {"success": false, "message": "scene_path required (e.g. 'res://scenes/main.tscn')", "data": {}}

	var root_type: String = params.get("root_node_type", "Node2D")
	var root_name: String = params.get("root_node_name", "")
	if root_name.is_empty():
		root_name = scene_path.get_file().get_basename()

	if not ClassDB.class_exists(root_type):
		return {"success": false, "message": "Unknown root node type: %s" % root_type, "data": {}}

	# Create scene
	var packed_scene := PackedScene.new()
	var root: Node = ClassDB.instantiate(root_type)
	root.name = root_name

	# Pack and save
	var err = packed_scene.pack(root)
	if err != OK:
		root.queue_free()
		return {"success": false, "message": "Failed to pack scene: %d" % err, "data": {}}

	# Ensure directory exists
	var dir = scene_path.get_base_dir()
	if not DirAccess.dir_exists_absolute(ProjectSettings.globalize_path(dir)):
		DirAccess.make_dir_recursive_absolute(ProjectSettings.globalize_path(dir))

	err = ResourceSaver.save(packed_scene, scene_path)
	root.queue_free()
	if err != OK:
		return {"success": false, "message": "Failed to save scene to '%s': %d" % [scene_path, err], "data": {}}

	# Open the new scene
	EditorInterface.open_scene_from_path(scene_path)
	return {
		"success": true,
		"message": "Created and opened scene '%s' with root %s '%s'" % [scene_path, root_type, root_name],
		"data": {"scene_path": scene_path, "root_type": root_type, "root_name": root_name},
	}


func _open_scene(params: Dictionary) -> Dictionary:
	var scene_path: String = params.get("scene_path", "")
	if scene_path.is_empty():
		return {"success": false, "message": "scene_path required.", "data": {}}
	if not ResourceLoader.exists(scene_path):
		return {"success": false, "message": "Scene not found: '%s'" % scene_path, "data": {}}

	EditorInterface.open_scene_from_path(scene_path)
	return {"success": true, "message": "Opened scene '%s'" % scene_path, "data": {"scene_path": scene_path}}


func _save_scene(params: Dictionary) -> Dictionary:
	var err = EditorInterface.save_scene()
	if err != OK:
		return {"success": false, "message": "Failed to save scene: %d" % err, "data": {}}

	var root = EditorInterface.get_edited_scene_root()
	var path = root.scene_file_path if root else "unknown"
	return {"success": true, "message": "Scene saved: '%s'" % path, "data": {"scene_path": path}}


func _save_scene_as(params: Dictionary) -> Dictionary:
	var scene_path: String = params.get("scene_path", "")
	if scene_path.is_empty():
		return {"success": false, "message": "scene_path required.", "data": {}}

	var root = EditorInterface.get_edited_scene_root()
	if root == null:
		return {"success": false, "message": "No scene open.", "data": {}}

	var packed := PackedScene.new()
	packed.pack(root)
	var err = ResourceSaver.save(packed, scene_path)
	if err != OK:
		return {"success": false, "message": "Failed to save as '%s': %d" % [scene_path, err], "data": {}}

	return {"success": true, "message": "Scene saved as '%s'" % scene_path, "data": {"scene_path": scene_path}}


func _close_scene(params: Dictionary) -> Dictionary:
	# Godot doesn't have a direct close scene API in 4.x; save first
	_save_scene({})
	return {"success": true, "message": "Scene saved (close via editor manually if needed)", "data": {}}


func _set_root_type(params: Dictionary) -> Dictionary:
	# Changing root type requires recreating — complex; recommend creating a new scene
	return {"success": false, "message": "Changing root type not supported. Create a new scene with the desired root type.", "data": {}}


func _instantiate_subscene(params: Dictionary) -> Dictionary:
	var subscene_path: String = params.get("subscene_path", "")
	if subscene_path.is_empty():
		return {"success": false, "message": "subscene_path required.", "data": {}}
	if not ResourceLoader.exists(subscene_path):
		return {"success": false, "message": "Subscene not found: '%s'" % subscene_path, "data": {}}

	var root = EditorInterface.get_edited_scene_root()
	if root == null:
		return {"success": false, "message": "No scene open to instantiate into.", "data": {}}

	var parent_path: String = params.get("parent_node_path", "")
	var parent = root if parent_path.is_empty() else root.get_node_or_null(NodePath(parent_path))
	if parent == null:
		return {"success": false, "message": "Parent node not found: '%s'" % parent_path, "data": {}}

	var packed: PackedScene = ResourceLoader.load(subscene_path)
	if packed == null:
		return {"success": false, "message": "Failed to load subscene: '%s'" % subscene_path, "data": {}}

	var instance = packed.instantiate()
	parent.add_child(instance)
	instance.owner = root

	EditorInterface.mark_scene_as_unsaved()

	return {
		"success": true,
		"message": "Instantiated '%s' in '%s'" % [subscene_path.get_file(), parent.name],
		"data": {"path": str(root.get_path_to(instance)), "name": instance.name},
	}


func get_tree(params: Dictionary) -> Dictionary:
	var root = EditorInterface.get_edited_scene_root()
	if root == null:
		return {"success": true, "message": "No scene open", "data": {"scene": null}}

	var depth: int = params.get("depth", 5)
	var tree = _node_to_tree(root, root, depth, 0)
	return {
		"success": true,
		"message": "Scene tree retrieved",
		"data": {
			"scene_path": root.scene_file_path,
			"root": tree,
		},
	}


func _node_to_tree(node: Node, root: Node, max_depth: int, current_depth: int) -> Dictionary:
	var info := {
		"name": node.name,
		"type": node.get_class(),
		"path": str(root.get_path_to(node)) if node != root else ".",
		"script": node.get_script().resource_path if node.get_script() else "",
		"groups": node.get_groups(),
		"children": [],
	}
	if current_depth < max_depth:
		for child in node.get_children():
			info["children"].append(_node_to_tree(child, root, max_depth, current_depth + 1))
	else:
		info["child_count"] = node.get_child_count()
	return info
