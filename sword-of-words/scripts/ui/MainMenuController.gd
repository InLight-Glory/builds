class_name MainMenuController
extends Control

@export_file("*.tscn") var GameScenePath: String = "res://scenes/Main.tscn"
@export var StartButtonPath: NodePath = "Center/Panel/Margin/Buttons/StartButton"
@export var QuitButtonPath: NodePath = "Center/Panel/Margin/Buttons/QuitButton"
@export var StatusLabelPath: NodePath = "Center/Panel/Margin/Buttons/StatusLabel"

var _start_button: Button
var _quit_button: Button
var _status_label: Label

func _ready() -> void:
	_start_button = get_node_or_null(StartButtonPath)
	_quit_button = get_node_or_null(QuitButtonPath)
	_status_label = get_node_or_null(StatusLabelPath)

	if _start_button != null:
		_start_button.pressed.connect(_on_start_pressed)

	if _quit_button != null:
		_quit_button.pressed.connect(_on_quit_pressed)

	if _status_label != null:
		_status_label.text = "Press Start. In-game: Ctrl+Shift+D for developer mode, M for map."

	DevLog.info("Main menu ready.")

func _on_start_pressed() -> void:
	DevLog.info("Start game requested from main menu.")
	var err := get_tree().change_scene_to_file(GameScenePath)
	if err != OK:
		DevLog.error("Failed to load gameplay scene: %s (%s)" % [GameScenePath, err])

func _on_quit_pressed() -> void:
	DevLog.info("Quit requested from main menu.")
	get_tree().quit()
