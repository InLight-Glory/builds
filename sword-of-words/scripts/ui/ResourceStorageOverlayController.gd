class_name ResourceStorageOverlayController
extends CanvasLayer

@export var PanelPath: NodePath = "Root/Panel"
@export var StoreAllResourcesButtonPath: NodePath = "Root/Panel/Margin/Body/Actions/StoreAllResourcesButton"
@export var TakeAllResourcesButtonPath: NodePath = "Root/Panel/Margin/Body/Actions/TakeAllResourcesButton"
@export var CloseButtonPath: NodePath = "Root/Panel/Margin/Body/Actions/CloseButton"
@export var PlayerInventoryPath: NodePath = "../Player/Inventory"
@export var StoragePath: NodePath = "../Player/ResourceStorage"
@export var ToggleAction: StringName = &"toggle_storage"
@export var TransferStepAmount: float = 10.0

const ResourceRows := {
    ResourceType.Water: "Root/Panel/Margin/Body/Rows/WaterRow",
    ResourceType.Oil: "Root/Panel/Margin/Body/Rows/OilRow",
    ResourceType.Air: "Root/Panel/Margin/Body/Rows/AirRow",
    ResourceType.Metals: "Root/Panel/Margin/Body/Rows/MetalsRow",
    ResourceType.Minerals: "Root/Panel/Margin/Body/Rows/MineralsRow",
}

var _panel: Control
var _store_all_resources_button: Button
var _take_all_resources_button: Button
var _close_button: Button
var _inventory: PlayerInventory
var _storage: ResourceStorage
var _is_open := false
var _row_widgets: Dictionary = {}

func _ready() -> void:
    _panel = get_node_or_null(PanelPath)
    _store_all_resources_button = get_node_or_null(StoreAllResourcesButtonPath)
    _take_all_resources_button = get_node_or_null(TakeAllResourcesButtonPath)
    _close_button = get_node_or_null(CloseButtonPath)
    _inventory = get_node_or_null(PlayerInventoryPath)
    _storage = get_node_or_null(StoragePath)

    _cache_rows()
    _bind_buttons()
    _bind_signals()
    _set_open(false, false)
    _refresh_ui()

func _input(event: InputEvent) -> void:
    if event.is_action_pressed(ToggleAction):
        _set_open(not _is_open, true)
        get_viewport().set_input_as_handled()
        return

    if _is_open and event.is_action_pressed("ui_cancel"):
        _set_open(false, true)
        get_viewport().set_input_as_handled()

func _cache_rows() -> void:
    _row_widgets.clear()

    for resource_type in ResourceRows.keys():
        var row: Control = get_node_or_null(ResourceRows[resource_type])
        if row == null:
            continue

        _row_widgets[resource_type] = {
            "player": row.get_node_or_null("PlayerLabel"),
            "storage": row.get_node_or_null("StorageLabel"),
            "store_10": row.get_node_or_null("Store10Button"),
            "take_10": row.get_node_or_null("Take10Button"),
            "store_all": row.get_node_or_null("StoreAllButton"),
            "take_all": row.get_node_or_null("TakeAllButton"),
        }

func _bind_buttons() -> void:
    for resource_type in _row_widgets.keys():
        var widgets: Dictionary = _row_widgets[resource_type]
        var store_10 := widgets.get("store_10") as Button
        var take_10 := widgets.get("take_10") as Button
        var store_all := widgets.get("store_all") as Button
        var take_all := widgets.get("take_all") as Button

        if store_10 != null:
            store_10.pressed.connect(_on_store_step_pressed.bind(int(resource_type)))
        if take_10 != null:
            take_10.pressed.connect(_on_take_step_pressed.bind(int(resource_type)))
        if store_all != null:
            store_all.pressed.connect(_on_store_all_pressed.bind(int(resource_type)))
        if take_all != null:
            take_all.pressed.connect(_on_take_all_pressed.bind(int(resource_type)))

    if _store_all_resources_button != null:
        _store_all_resources_button.pressed.connect(_on_store_all_resources_pressed)
    if _take_all_resources_button != null:
        _take_all_resources_button.pressed.connect(_on_take_all_resources_pressed)
    if _close_button != null:
        _close_button.pressed.connect(_on_close_pressed)

func _bind_signals() -> void:
    if _inventory != null:
        _inventory.inventory_changed.connect(_on_resource_state_changed)
    if _storage != null:
        _storage.storage_changed.connect(_on_resource_state_changed)

func _on_resource_state_changed() -> void:
    _refresh_ui()

func _set_open(open: bool, should_refresh: bool) -> void:
    _is_open = open

    if _panel != null:
        _panel.visible = _is_open

    Input.mouse_mode = Input.MOUSE_MODE_VISIBLE if _is_open else Input.MOUSE_MODE_CAPTURED

    if should_refresh:
        _refresh_ui()

func _refresh_ui() -> void:
    if _inventory == null or _storage == null:
        return

    for resource_type in _row_widgets.keys():
        var widgets: Dictionary = _row_widgets[resource_type]

        var player_label := widgets.get("player") as Label
        var storage_label := widgets.get("storage") as Label
        var store_10 := widgets.get("store_10") as Button
        var take_10 := widgets.get("take_10") as Button
        var store_all := widgets.get("store_all") as Button
        var take_all := widgets.get("take_all") as Button

        var player_amount := _inventory.GetAmount(int(resource_type))
        var storage_amount := _storage.GetAmount(int(resource_type))
        var storage_capacity := _storage.GetCapacity(int(resource_type))

        if player_label != null:
            player_label.text = "Player: %.0f" % player_amount

        if storage_label != null:
            storage_label.text = "Storage: %.0f / %.0f" % [storage_amount, storage_capacity]

        var can_store_any := _get_max_storable(int(resource_type)) > 0.0
        var can_take_any := _get_max_takeable(int(resource_type)) > 0.0

        if store_10 != null:
            store_10.disabled = _get_max_storable(int(resource_type)) <= 0.0
        if take_10 != null:
            take_10.disabled = _get_max_takeable(int(resource_type)) <= 0.0
        if store_all != null:
            store_all.disabled = not can_store_any
        if take_all != null:
            take_all.disabled = not can_take_any

    if _store_all_resources_button != null:
        _store_all_resources_button.disabled = not _can_store_any_resource()
    if _take_all_resources_button != null:
        _take_all_resources_button.disabled = not _can_take_any_resource()

func _on_store_step_pressed(resource_type: int) -> void:
    if _storage == null or _inventory == null:
        return
    _storage.DepositFromInventory(_inventory, resource_type, maxf(0.0, TransferStepAmount))
    _refresh_ui()

func _on_take_step_pressed(resource_type: int) -> void:
    if _storage == null or _inventory == null:
        return
    _storage.WithdrawToInventory(_inventory, resource_type, maxf(0.0, TransferStepAmount))
    _refresh_ui()

func _on_store_all_pressed(resource_type: int) -> void:
    if _storage == null or _inventory == null:
        return
    _storage.DepositFromInventory(_inventory, resource_type, INF)
    _refresh_ui()

func _on_take_all_pressed(resource_type: int) -> void:
    if _storage == null or _inventory == null:
        return
    _storage.WithdrawToInventory(_inventory, resource_type, INF)
    _refresh_ui()

func _on_store_all_resources_pressed() -> void:
    if _storage == null or _inventory == null:
        return
    _storage.DepositAllFromInventory(_inventory)
    _refresh_ui()

func _on_take_all_resources_pressed() -> void:
    if _storage == null or _inventory == null:
        return
    _storage.WithdrawAllToInventory(_inventory)
    _refresh_ui()

func _on_close_pressed() -> void:
    _set_open(false, true)

func _get_max_storable(resource_type: int) -> float:
    if _inventory == null or _storage == null:
        return 0.0
    return minf(_inventory.GetAmount(resource_type), _storage.GetAvailableCapacity(resource_type))

func _get_max_takeable(resource_type: int) -> float:
    if _inventory == null or _storage == null:
        return 0.0
    return minf(_storage.GetAmount(resource_type), _inventory.GetAvailableCapacity(resource_type))

func _can_store_any_resource() -> bool:
    for resource_type in ResourceRows.keys():
        if _get_max_storable(int(resource_type)) > 0.0:
            return true
    return false

func _can_take_any_resource() -> bool:
    for resource_type in ResourceRows.keys():
        if _get_max_takeable(int(resource_type)) > 0.0:
            return true
    return false
