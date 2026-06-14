class_name PlanetSelectionController
extends CanvasLayer

@export var GalaxyManagerPath: NodePath = ".."
@export var PlanetListPath: NodePath = "Root/Center/Panel/Margin/Body/PlanetList"

var _galaxy_manager: GalaxyManager
var _planet_list: VBoxContainer

func _ready() -> void:
	_galaxy_manager = get_node_or_null(GalaxyManagerPath)
	_planet_list = get_node_or_null(PlanetListPath)

	call_deferred("_open_selection")

func _open_selection() -> void:
	_populate_planets()
	_set_open(true)

func _populate_planets() -> void:
	if _galaxy_manager == null or _planet_list == null:
		return

	for child in _planet_list.get_children():
		child.queue_free()

	var planets := _galaxy_manager.GetStarterPlanets()
	for info in planets:
		_add_planet_card(info)

func _add_planet_card(info: Dictionary) -> void:
	var card := PanelContainer.new()

	var margin := MarginContainer.new()
	margin.add_theme_constant_override("margin_left", 14)
	margin.add_theme_constant_override("margin_top", 10)
	margin.add_theme_constant_override("margin_right", 14)
	margin.add_theme_constant_override("margin_bottom", 10)
	card.add_child(margin)

	var hbox := HBoxContainer.new()
	hbox.add_theme_constant_override("separation", 20)
	margin.add_child(hbox)

	var info_vbox := VBoxContainer.new()
	info_vbox.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	hbox.add_child(info_vbox)

	var name_label := Label.new()
	name_label.text = _format_planet_name(str(info["id"]))
	name_label.add_theme_font_size_override("font_size", 20)
	info_vbox.add_child(name_label)

	var detail_label := Label.new()
	detail_label.text = "%s  |  Size: %.0f  |  Gravity: %.1f" % [
		_biome_name(int(info["biome"])),
		float(info["size"]),
		float(info["gravity"]),
	]
	detail_label.add_theme_font_size_override("font_size", 14)
	info_vbox.add_child(detail_label)

	var btn := Button.new()
	btn.text = "Land Here"
	btn.custom_minimum_size = Vector2(130, 42)
	btn.pressed.connect(_on_planet_selected.bind(str(info["id"])))
	hbox.add_child(btn)

	_planet_list.add_child(card)

func _on_planet_selected(planet_id: String) -> void:
	_set_open(false)
	if _galaxy_manager != null:
		_galaxy_manager.BeginGameOnPlanet(planet_id)
	DevLog.info("Planet selected: %s" % planet_id)

func _set_open(open: bool) -> void:
	visible = open
	if open:
		Input.mouse_mode = Input.MOUSE_MODE_VISIBLE
	else:
		Input.mouse_mode = Input.MOUSE_MODE_CAPTURED

func _format_planet_name(id: String) -> String:
	return id.replace("-", " ").capitalize()

func _biome_name(biome: int) -> String:
	match biome:
		PlanetBiome.Temperate: return "Temperate"
		PlanetBiome.Arid: return "Arid"
		PlanetBiome.Oceanic: return "Oceanic"
		PlanetBiome.Volcanic: return "Volcanic"
		PlanetBiome.Frozen: return "Frozen"
		PlanetBiome.Metallic: return "Metallic"
		_: return "Unknown"
