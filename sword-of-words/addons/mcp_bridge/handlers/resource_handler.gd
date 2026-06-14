## Handles resource operations: materials, shapes, animations, placeholder assets.
@tool
extends RefCounted

var editor_plugin


func handle(params: Dictionary) -> Dictionary:
	var action: String = params.get("action", "")
	match action:
		"create_material":       return _create_material(params)
		"set_material_property": return _set_material_property(params)
		"create_shape":          return _create_shape(params)
		"list_resources":        return _list_resources(params)
		"import_file":           return _import_file(params)
		"move_file":             return _move_file(params)
		"delete_file":           return _delete_file(params)
		"create_folder":         return _create_folder(params)
		"list_folder":           return _list_folder(params)
		_:
			return {"success": false, "message": "Unknown resource action: %s" % action, "data": {}}


func _create_material(params: Dictionary) -> Dictionary:
	var resource_path: String = params.get("resource_path", "")
	var resource_type: String = params.get("resource_type", "StandardMaterial3D")
	var properties: Dictionary = params.get("properties", {})

	if resource_path.is_empty():
		return {"success": false, "message": "resource_path required.", "data": {}}

	var material: Material
	match resource_type:
		"StandardMaterial3D":
			material = StandardMaterial3D.new()
		"OrmMaterial3D":
			material = ORMMaterial3D.new()
		"ShaderMaterial":
			material = ShaderMaterial.new()
		"CanvasItemMaterial":
			material = CanvasItemMaterial.new()
		_:
			return {"success": false, "message": "Unknown material type: %s" % resource_type, "data": {}}

	# Apply properties
	for key in properties:
		var value = properties[key]
		if value is Dictionary and value.has("r"):
			value = Color(value.get("r", 1.0), value.get("g", 1.0), value.get("b", 1.0), value.get("a", 1.0))
		material.set(key, value)

	var dir = resource_path.get_base_dir()
	var global_dir = ProjectSettings.globalize_path(dir)
	if not DirAccess.dir_exists_absolute(global_dir):
		DirAccess.make_dir_recursive_absolute(global_dir)

	var err = ResourceSaver.save(material, resource_path)
	if err != OK:
		return {"success": false, "message": "Failed to save material: %d" % err, "data": {}}

	return {"success": true, "message": "Created %s at '%s'" % [resource_type, resource_path], "data": {"resource_path": resource_path}}


func _set_material_property(params: Dictionary) -> Dictionary:
	var resource_path: String = params.get("resource_path", "")
	var properties: Dictionary = params.get("properties", {})

	if not ResourceLoader.exists(resource_path):
		return {"success": false, "message": "Material not found: '%s'" % resource_path, "data": {}}

	var material = ResourceLoader.load(resource_path)
	for key in properties:
		var value = properties[key]
		if value is Dictionary and value.has("r"):
			value = Color(value.get("r", 1.0), value.get("g", 1.0), value.get("b", 1.0), value.get("a", 1.0))
		material.set(key, value)

	ResourceSaver.save(material, resource_path)
	return {"success": true, "message": "Material properties updated", "data": {}}


func _create_shape(params: Dictionary) -> Dictionary:
	var resource_path: String = params.get("resource_path", "")
	var resource_type: String = params.get("resource_type", "CapsuleShape2D")
	var properties: Dictionary = params.get("properties", {})

	if not ClassDB.class_exists(resource_type):
		return {"success": false, "message": "Unknown shape type: %s" % resource_type, "data": {}}

	var shape = ClassDB.instantiate(resource_type)
	for key in properties:
		shape.set(key, properties[key])

	var dir = resource_path.get_base_dir()
	if not DirAccess.dir_exists_absolute(ProjectSettings.globalize_path(dir)):
		DirAccess.make_dir_recursive_absolute(ProjectSettings.globalize_path(dir))

	ResourceSaver.save(shape, resource_path)
	return {"success": true, "message": "Created %s at '%s'" % [resource_type, resource_path], "data": {"resource_path": resource_path}}


func _list_resources(params: Dictionary) -> Dictionary:
	var folder = params.get("folder_path", "res://")
	return _list_folder({"folder_path": folder})


func _list_folder(params: Dictionary) -> Dictionary:
	var folder: String = params.get("folder_path", "res://")
	var dir = DirAccess.open(folder)
	if dir == null:
		return {"success": false, "message": "Folder not found: '%s'" % folder, "data": {}}

	var files := []
	var dirs := []
	dir.list_dir_begin()
	var item = dir.get_next()
	while item != "":
		if not item.begins_with("."):
			if dir.current_is_dir():
				dirs.append(item + "/")
			else:
				files.append(item)
		item = dir.get_next()
	dir.list_dir_end()

	return {
		"success": true,
		"message": "%d files, %d folders in '%s'" % [files.size(), dirs.size(), folder],
		"data": {"files": files, "folders": dirs, "path": folder},
	}


func _create_folder(params: Dictionary) -> Dictionary:
	var folder: String = params.get("folder_path", "")
	if folder.is_empty():
		return {"success": false, "message": "folder_path required.", "data": {}}

	var global = ProjectSettings.globalize_path(folder)
	var err = DirAccess.make_dir_recursive_absolute(global)
	if err != OK:
		return {"success": false, "message": "Failed to create folder: %d" % err, "data": {}}

	EditorInterface.get_resource_filesystem().scan()
	return {"success": true, "message": "Created folder '%s'" % folder, "data": {}}


func _import_file(params: Dictionary) -> Dictionary:
	var src: String = params.get("source_path", "")
	var dst: String = params.get("destination_path", "")
	if src.is_empty() or dst.is_empty():
		return {"success": false, "message": "source_path and destination_path required.", "data": {}}

	var global_src = ProjectSettings.globalize_path(src) if src.begins_with("res://") else src
	var global_dst = ProjectSettings.globalize_path(dst)

	var dir_dst = global_dst.get_base_dir()
	if not DirAccess.dir_exists_absolute(dir_dst):
		DirAccess.make_dir_recursive_absolute(dir_dst)

	var err = DirAccess.copy_absolute(global_src, global_dst)
	if err != OK:
		return {"success": false, "message": "Failed to copy '%s' → '%s': %d" % [src, dst, err], "data": {}}

	EditorInterface.get_resource_filesystem().scan()
	return {"success": true, "message": "Imported '%s' → '%s'" % [src, dst], "data": {"destination": dst}}


func _move_file(params: Dictionary) -> Dictionary:
	var src: String = params.get("source_path", "")
	var dst: String = params.get("destination_path", "")
	if src.is_empty() or dst.is_empty():
		return {"success": false, "message": "source_path and destination_path required.", "data": {}}

	# Use EditorFileSystem to move (handles .import files)
	EditorInterface.get_resource_filesystem().update_file(src)

	var global_src = ProjectSettings.globalize_path(src)
	var global_dst = ProjectSettings.globalize_path(dst)

	var err = DirAccess.rename_absolute(global_src, global_dst)
	if err != OK:
		return {"success": false, "message": "Failed to move file: %d" % err, "data": {}}

	EditorInterface.get_resource_filesystem().scan()
	return {"success": true, "message": "Moved '%s' → '%s'" % [src, dst], "data": {}}


func _delete_file(params: Dictionary) -> Dictionary:
	var path: String = params.get("resource_path", "")
	var global = ProjectSettings.globalize_path(path)
	var err = DirAccess.remove_absolute(global)
	if err != OK:
		return {"success": false, "message": "Failed to delete '%s': %d" % [path, err], "data": {}}

	EditorInterface.get_resource_filesystem().scan()
	return {"success": true, "message": "Deleted '%s'" % path, "data": {}}


func manage_animation(params: Dictionary) -> Dictionary:
	var action: String = params.get("action", "")
	var root = EditorInterface.get_edited_scene_root()
	if root == null:
		return {"success": false, "message": "No scene open.", "data": {}}

	var node_path: String = params.get("node_path", "")
	var anim_player = root.get_node_or_null(NodePath(node_path)) as AnimationPlayer
	if anim_player == null:
		return {"success": false, "message": "AnimationPlayer not found at '%s'" % node_path, "data": {}}

	var anim_name: String = params.get("animation_name", "")

	match action:
		"create_animation":
			var anim = Animation.new()
			anim.length = params.get("length", 1.0)
			anim.loop_mode = Animation.LOOP_LINEAR if params.get("loop", false) else Animation.LOOP_NONE
			var lib = anim_player.get_animation_library("")
			if lib == null:
				lib = AnimationLibrary.new()
				anim_player.add_animation_library("", lib)
			lib.add_animation(anim_name, anim)
			EditorInterface.mark_scene_as_unsaved()
			return {"success": true, "message": "Created animation '%s'" % anim_name, "data": {}}

		"list_animations":
			var anims := anim_player.get_animation_list()
			return {"success": true, "message": "%d animations" % anims.size(), "data": {"animations": anims}}

		"play":
			anim_player.play(anim_name)
			return {"success": true, "message": "Playing '%s'" % anim_name, "data": {}}

		"stop":
			anim_player.stop()
			return {"success": true, "message": "Animation stopped", "data": {}}

	return {"success": false, "message": "Unknown animation action: %s" % action, "data": {}}


func generate_placeholder(params: Dictionary) -> Dictionary:
	var output_path: String = params.get("output_path", "res://assets/placeholder.png")
	var width: int = params.get("width", 64)
	var height: int = params.get("height", 64)
	var color_dict = params.get("color")
	var label: String = params.get("label", "")
	var asset_type: String = params.get("asset_type", "sprite")

	# Pick a color
	var color: Color
	if color_dict and color_dict is Dictionary:
		color = Color(color_dict.get("r", 1.0), color_dict.get("g", 0.0), color_dict.get("b", 0.0), color_dict.get("a", 1.0))
	else:
		# Random pastel colors by type
		match asset_type:
			"sprite":    color = Color(0.4, 0.6, 1.0)
			"tileset":   color = Color(0.5, 0.8, 0.5)
			"icon":      color = Color(1.0, 0.8, 0.3)
			"background":color = Color(0.2, 0.2, 0.4)
			"ui_button": color = Color(0.6, 0.3, 0.8)
			"ui_panel":  color = Color(0.3, 0.3, 0.5)
			_:           color = Color(randf(), randf(), randf())

	var image = Image.create(width, height, false, Image.FORMAT_RGBA8)
	image.fill(color)

	# Draw a border
	var border_color = color.darkened(0.3)
	for x in range(width):
		image.set_pixel(x, 0, border_color)
		image.set_pixel(x, height - 1, border_color)
	for y in range(height):
		image.set_pixel(0, y, border_color)
		image.set_pixel(width - 1, y, border_color)

	# Ensure directory
	var dir = output_path.get_base_dir()
	var global_dir = ProjectSettings.globalize_path(dir)
	if not DirAccess.dir_exists_absolute(global_dir):
		DirAccess.make_dir_recursive_absolute(global_dir)

	var global_path = ProjectSettings.globalize_path(output_path)
	var err = image.save_png(global_path)
	if err != OK:
		return {"success": false, "message": "Failed to save image: %d" % err, "data": {}}

	EditorInterface.get_resource_filesystem().scan()
	return {
		"success": true,
		"message": "Generated %dx%d placeholder at '%s'" % [width, height, output_path],
		"data": {"path": output_path, "width": width, "height": height},
	}
