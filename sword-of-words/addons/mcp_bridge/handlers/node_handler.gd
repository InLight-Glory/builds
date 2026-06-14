## Handles all node manipulation commands: create, delete, move, rename, inspect.
@tool
extends RefCounted

var editor_plugin  # EditorPlugin reference


func _get_scene_root(scene_path: String = "") -> Node:
	if scene_path != "" and scene_path != null:
		# Try to find an open scene with this path
		for i in EditorInterface.get_open_scenes().size():
			# Open scene if not already open
			pass
	return EditorInterface.get_edited_scene_root()


func _get_node_at_path(root: Node, node_path: String) -> Node:
	if node_path == "" or node_path == null:
		return root
	return root.get_node_or_null(NodePath(node_path))


func _node_to_dict(node: Node, root: Node) -> Dictionary:
	var path = root.get_path_to(node) if node != root else NodePath(".")
	return {
		"name": node.name,
		"type": node.get_class(),
		"path": str(path),
		"script": node.get_script().resource_path if node.get_script() else "",
		"groups": node.get_groups(),
		"children": node.get_child_count(),
	}


func handle(params: Dictionary) -> Dictionary:
	var action: String = params.get("action", "")
	match action:
		"create":   return _create_node(params)
		"delete":   return _delete_node(params)
		"duplicate":return _duplicate_node(params)
		"move":     return _move_node(params)
		"rename":   return _rename_node(params)
		"reparent": return _reparent_node(params)
		"set_property": return _set_property(params)
		"get_properties": return _get_properties(params)
		"list_children":  return _list_children(params)
		"add_to_group":   return _manage_group(params, true)
		"remove_from_group": return _manage_group(params, false)
		_:
			return {"success": false, "message": "Unknown node action: %s" % action, "data": {}}


func _create_node(params: Dictionary) -> Dictionary:
	var root = _get_scene_root(params.get("scene_path", ""))
	if root == null:
		return {"success": false, "message": "No scene open. Use manage_scene(action='create') first.", "data": {}}

	var node_type: String = params.get("node_type", "Node")
	var node_name: String = params.get("node_name", node_type)
	var parent_path: String = params.get("node_path", "")

	# Get parent
	var parent = _get_node_at_path(root, parent_path)
	if parent == null:
		return {"success": false, "message": "Parent node not found: '%s'" % parent_path, "data": {}}

	# Create node by class name
	if not ClassDB.class_exists(node_type):
		return {"success": false, "message": "Unknown node type: '%s'. Check Godot class name." % node_type, "data": {}}

	var new_node: Node = ClassDB.instantiate(node_type)
	if new_node == null:
		return {"success": false, "message": "Failed to instantiate: %s" % node_type, "data": {}}

	new_node.name = node_name
	parent.add_child(new_node)
	new_node.owner = root  # Critical: must set owner for scene saving

	# Apply initial properties
	var properties: Dictionary = params.get("properties", {})
	if not properties.is_empty():
		_apply_properties(new_node, properties)

	EditorInterface.mark_scene_as_unsaved()

	var node_path = str(root.get_path_to(new_node))
	return {
		"success": true,
		"message": "Created %s '%s' at path '%s'" % [node_type, node_name, node_path],
		"data": {"path": node_path, "type": node_type, "name": node_name},
	}


func _delete_node(params: Dictionary) -> Dictionary:
	var root = _get_scene_root(params.get("scene_path", ""))
	if root == null:
		return {"success": false, "message": "No scene open.", "data": {}}

	var node_path: String = params.get("node_path", "")
	var node = _get_node_at_path(root, node_path)
	if node == null:
		return {"success": false, "message": "Node not found: '%s'" % node_path, "data": {}}
	if node == root:
		return {"success": false, "message": "Cannot delete scene root.", "data": {}}

	var name = node.name
	node.get_parent().remove_child(node)
	node.queue_free()
	EditorInterface.mark_scene_as_unsaved()

	return {"success": true, "message": "Deleted node '%s'" % name, "data": {}}


func _duplicate_node(params: Dictionary) -> Dictionary:
	var root = _get_scene_root(params.get("scene_path", ""))
	if root == null:
		return {"success": false, "message": "No scene open.", "data": {}}

	var node_path: String = params.get("node_path", "")
	var node = _get_node_at_path(root, node_path)
	if node == null:
		return {"success": false, "message": "Node not found: '%s'" % node_path, "data": {}}

	var dup = node.duplicate()
	node.get_parent().add_child(dup)
	dup.owner = root
	EditorInterface.mark_scene_as_unsaved()

	return {
		"success": true,
		"message": "Duplicated '%s' as '%s'" % [node.name, dup.name],
		"data": {"path": str(root.get_path_to(dup)), "name": dup.name},
	}


func _rename_node(params: Dictionary) -> Dictionary:
	var root = _get_scene_root(params.get("scene_path", ""))
	if root == null:
		return {"success": false, "message": "No scene open.", "data": {}}

	var node = _get_node_at_path(root, params.get("node_path", ""))
	if node == null:
		return {"success": false, "message": "Node not found.", "data": {}}

	var old_name = node.name
	node.name = params.get("node_name", node.name)
	EditorInterface.mark_scene_as_unsaved()

	return {"success": true, "message": "Renamed '%s' to '%s'" % [old_name, node.name], "data": {"new_path": str(root.get_path_to(node))}}


func _reparent_node(params: Dictionary) -> Dictionary:
	var root = _get_scene_root(params.get("scene_path", ""))
	if root == null:
		return {"success": false, "message": "No scene open.", "data": {}}

	var node = _get_node_at_path(root, params.get("node_path", ""))
	var new_parent = _get_node_at_path(root, params.get("new_parent_path", ""))
	if node == null or new_parent == null:
		return {"success": false, "message": "Node or new parent not found.", "data": {}}

	node.reparent(new_parent)
	node.owner = root
	EditorInterface.mark_scene_as_unsaved()

	return {"success": true, "message": "Reparented '%s' to '%s'" % [node.name, new_parent.name], "data": {"new_path": str(root.get_path_to(node))}}


func _move_node(params: Dictionary) -> Dictionary:
	# Alias for set_property with position
	var move_params = params.duplicate()
	if not move_params.has("properties"):
		move_params["properties"] = {}
	if params.has("position"):
		move_params["properties"]["position"] = params["position"]
	return _set_property(move_params)


func _set_property(params: Dictionary) -> Dictionary:
	var root = _get_scene_root(params.get("scene_path", ""))
	if root == null:
		return {"success": false, "message": "No scene open.", "data": {}}

	var node = _get_node_at_path(root, params.get("node_path", ""))
	if node == null:
		return {"success": false, "message": "Node not found: '%s'" % params.get("node_path", ""), "data": {}}

	var properties: Dictionary = params.get("properties", {})
	var errors := _apply_properties(node, properties)
	EditorInterface.mark_scene_as_unsaved()

	if errors.is_empty():
		return {"success": true, "message": "Properties set on '%s'" % node.name, "data": {}}
	else:
		return {"success": false, "message": "Some properties failed: %s" % str(errors), "data": {"errors": errors}}


func _apply_properties(node: Node, properties: Dictionary) -> Array:
	var errors := []
	for key in properties:
		var value = properties[key]
		# Convert dict-style vectors to Godot types
		value = _convert_value(node, key, value)
		if node.get(key) != null or key in ["position", "rotation", "scale", "global_position"]:
			node.set(key, value)
		else:
			errors.append("Property '%s' not found on %s" % [key, node.get_class()])
	return errors


func _convert_value(node: Node, property: String, value):
	if value is Dictionary:
		# Try to infer type from property name or existing value
		var existing = node.get(property)
		if existing is Vector2:
			return Vector2(value.get("x", 0.0), value.get("y", 0.0))
		elif existing is Vector3:
			return Vector3(value.get("x", 0.0), value.get("y", 0.0), value.get("z", 0.0))
		elif existing is Color:
			return Color(value.get("r", 1.0), value.get("g", 1.0), value.get("b", 1.0), value.get("a", 1.0))
		elif existing is Quaternion:
			return Quaternion(value.get("x",0.0), value.get("y",0.0), value.get("z",0.0), value.get("w",1.0))
		# Guess from property name
		if property in ["position", "global_position", "offset", "size"]:
			return Vector2(value.get("x", 0.0), value.get("y", 0.0))
		if property in ["position3d"]:
			return Vector3(value.get("x", 0.0), value.get("y", 0.0), value.get("z", 0.0))
	return value


func _get_properties(params: Dictionary) -> Dictionary:
	var root = _get_scene_root(params.get("scene_path", ""))
	if root == null:
		return {"success": false, "message": "No scene open.", "data": {}}
	var node = _get_node_at_path(root, params.get("node_path", ""))
	if node == null:
		return {"success": false, "message": "Node not found.", "data": {}}

	var props := {}
	for prop in node.get_property_list():
		var pname = prop["name"]
		if prop["usage"] & PROPERTY_USAGE_EDITOR:
			var val = node.get(pname)
			props[pname] = _serialize_value(val)

	return {"success": true, "message": "Properties retrieved", "data": {"properties": props, "type": node.get_class()}}


func _serialize_value(value) -> Variant:
	if value is Vector2:  return {"x": value.x, "y": value.y}
	if value is Vector3:  return {"x": value.x, "y": value.y, "z": value.z}
	if value is Color:    return {"r": value.r, "g": value.g, "b": value.b, "a": value.a}
	if value is Quaternion: return {"x": value.x, "y": value.y, "z": value.z, "w": value.w}
	if value is Object:   return null
	return value


func _list_children(params: Dictionary) -> Dictionary:
	var root = _get_scene_root(params.get("scene_path", ""))
	if root == null:
		return {"success": false, "message": "No scene open.", "data": {}}
	var node = _get_node_at_path(root, params.get("node_path", ""))
	if node == null:
		return {"success": false, "message": "Node not found.", "data": {}}

	var children := []
	for child in node.get_children():
		children.append(_node_to_dict(child, root))
	return {"success": true, "message": "%d children" % children.size(), "data": {"children": children}}


func _manage_group(params: Dictionary, add: bool) -> Dictionary:
	var root = _get_scene_root(params.get("scene_path", ""))
	if root == null:
		return {"success": false, "message": "No scene open.", "data": {}}
	var node = _get_node_at_path(root, params.get("node_path", ""))
	if node == null:
		return {"success": false, "message": "Node not found.", "data": {}}
	var group: String = params.get("group_name", "")
	if group.is_empty():
		return {"success": false, "message": "group_name required.", "data": {}}
	if add:
		node.add_to_group(group, true)  # persistent=true saves to scene
	else:
		node.remove_from_group(group)
	EditorInterface.mark_scene_as_unsaved()
	return {"success": true, "message": "%s group '%s' on '%s'" % ["Added to" if add else "Removed from", group, node.name], "data": {}}


func find_nodes(params: Dictionary) -> Dictionary:
	var root = _get_scene_root(params.get("scene_path", ""))
	if root == null:
		return {"success": false, "message": "No scene open.", "data": {}}

	var search_term: String = params.get("search_term", "").to_lower()
	var filter_type: String = params.get("node_type", "")
	var filter_group: String = params.get("group", "")

	var matches := []
	_search_tree(root, root, search_term, filter_type, filter_group, matches)

	return {
		"success": true,
		"message": "Found %d matching nodes" % matches.size(),
		"data": {"nodes": matches},
	}


func _search_tree(node: Node, root: Node, search: String, type_filter: String, group_filter: String, results: Array) -> void:
	var name_match = search.is_empty() or node.name.to_lower().contains(search)
	var type_match = type_filter.is_empty() or node.is_class(type_filter)
	var group_match = group_filter.is_empty() or node.is_in_group(group_filter)

	if name_match and type_match and group_match:
		results.append(_node_to_dict(node, root))

	for child in node.get_children():
		_search_tree(child, root, search, type_filter, group_filter, results)


func inspect_node(params: Dictionary) -> Dictionary:
	var root = _get_scene_root(params.get("scene_path", ""))
	if root == null:
		return {"success": false, "message": "No scene open.", "data": {}}
	var node = _get_node_at_path(root, params.get("node_path", ""))
	if node == null:
		return {"success": false, "message": "Node not found.", "data": {}}

	var info := _node_to_dict(node, root)

	# Properties
	var props := {}
	for prop in node.get_property_list():
		if prop["usage"] & PROPERTY_USAGE_EDITOR:
			props[prop["name"]] = _serialize_value(node.get(prop["name"]))
	info["properties"] = props

	# Signals
	if params.get("include_signals", true):
		var signals := []
		for sig in node.get_signal_list():
			var connections := []
			for conn in node.get_signal_connection_list(sig["name"]):
				connections.append({
					"target": str(root.get_path_to(conn["callable"].get_object() as Node)) if conn["callable"].get_object() is Node else "?",
					"method": conn["callable"].get_method(),
				})
			signals.append({"name": sig["name"], "connections": connections})
		info["signals"] = signals

	# Children
	var children := []
	for child in node.get_children():
		children.append({"name": child.name, "type": child.get_class()})
	info["children_list"] = children

	return {"success": true, "message": "Node inspected", "data": info}


func manage_signal(params: Dictionary) -> Dictionary:
	var action: String = params.get("action", "")
	var root = _get_scene_root(params.get("scene_path", ""))
	if root == null:
		return {"success": false, "message": "No scene open.", "data": {}}

	var source = _get_node_at_path(root, params.get("source_node_path", ""))
	if source == null:
		return {"success": false, "message": "Source node not found.", "data": {}}

	var signal_name: String = params.get("signal_name", "")

	if action == "list_connections":
		var conns := []
		for conn in source.get_signal_connection_list(signal_name):
			conns.append({
				"target": str(root.get_path_to(conn["callable"].get_object() as Node)),
				"method": conn["callable"].get_method(),
			})
		return {"success": true, "message": "%d connections" % conns.size(), "data": {"connections": conns}}

	var target = _get_node_at_path(root, params.get("target_node_path", ""))
	if target == null:
		return {"success": false, "message": "Target node not found.", "data": {}}

	var method_name: String = params.get("method_name", "")
	if method_name.is_empty():
		return {"success": false, "message": "method_name required.", "data": {}}

	if action == "connect":
		if not target.has_method(method_name):
			return {"success": false, "message": "Method '%s' not found on '%s'. Create it in the script first." % [method_name, target.name], "data": {}}
		source.connect(signal_name, Callable(target, method_name))
		EditorInterface.mark_scene_as_unsaved()
		return {"success": true, "message": "Connected signal '%s' → %s.%s" % [signal_name, target.name, method_name], "data": {}}

	elif action == "disconnect":
		source.disconnect(signal_name, Callable(target, method_name))
		EditorInterface.mark_scene_as_unsaved()
		return {"success": true, "message": "Disconnected signal '%s' from %s.%s" % [signal_name, target.name, method_name], "data": {}}

	return {"success": false, "message": "Unknown signal action: %s" % action, "data": {}}
