class_name ResourceStorage
extends Node

signal storage_changed

const ResourceOrder: Array[int] = [
	ResourceType.Water,
	ResourceType.Oil,
	ResourceType.Air,
	ResourceType.Metals,
	ResourceType.Minerals,
]

@export var StartingWater: float = 0.0
@export var StartingOil: float = 0.0
@export var StartingAir: float = 0.0
@export var StartingMetals: float = 0.0
@export var StartingMinerals: float = 0.0

@export var MaxWater: float = 900.0
@export var MaxOil: float = 900.0
@export var MaxAir: float = 900.0
@export var MaxMetals: float = 900.0
@export var MaxMinerals: float = 900.0

var _amounts: Dictionary = {}

func _ready() -> void:
	_amounts[ResourceType.Water] = clampf(StartingWater, 0.0, MaxWater)
	_amounts[ResourceType.Oil] = clampf(StartingOil, 0.0, MaxOil)
	_amounts[ResourceType.Air] = clampf(StartingAir, 0.0, MaxAir)
	_amounts[ResourceType.Metals] = clampf(StartingMetals, 0.0, MaxMetals)
	_amounts[ResourceType.Minerals] = clampf(StartingMinerals, 0.0, MaxMinerals)
	storage_changed.emit()

func GetAmount(resource_type: int) -> float:
	return float(_amounts.get(resource_type, 0.0))

func GetCapacity(resource_type: int) -> float:
	match resource_type:
		ResourceType.Water:
			return MaxWater
		ResourceType.Oil:
			return MaxOil
		ResourceType.Air:
			return MaxAir
		ResourceType.Metals:
			return MaxMetals
		ResourceType.Minerals:
			return MaxMinerals
		_:
			return 0.0

func GetAvailableCapacity(resource_type: int) -> float:
	return maxf(0.0, GetCapacity(resource_type) - GetAmount(resource_type))

func DepositFromInventory(inventory: PlayerInventory, resource_type: int, amount: float) -> float:
	if inventory == null or amount <= 0.0:
		return 0.0

	var inventory_available := inventory.GetAmount(resource_type)
	var storage_space := GetAvailableCapacity(resource_type)
	var transfer := minf(amount, minf(inventory_available, storage_space))
	if transfer <= 0.0:
		return 0.0

	var removed := inventory.RemoveUpTo(resource_type, transfer)
	if removed <= 0.0:
		return 0.0

	_set_amount(resource_type, GetAmount(resource_type) + removed)
	return removed

func WithdrawToInventory(inventory: PlayerInventory, resource_type: int, amount: float) -> float:
	if inventory == null or amount <= 0.0:
		return 0.0

	var stored := GetAmount(resource_type)
	var inventory_space := inventory.GetAvailableCapacity(resource_type)
	var transfer := minf(amount, minf(stored, inventory_space))
	if transfer <= 0.0:
		return 0.0

	inventory.Add(resource_type, transfer)
	_set_amount(resource_type, stored - transfer)
	return transfer

func DepositAllFromInventory(inventory: PlayerInventory) -> Dictionary:
	var moved := {}
	if inventory == null:
		return moved

	for resource_type in ResourceOrder:
		moved[resource_type] = DepositFromInventory(inventory, resource_type, INF)

	return moved

func WithdrawAllToInventory(inventory: PlayerInventory) -> Dictionary:
	var moved := {}
	if inventory == null:
		return moved

	for resource_type in ResourceOrder:
		moved[resource_type] = WithdrawToInventory(inventory, resource_type, INF)

	return moved

func _set_amount(resource_type: int, value: float) -> void:
	_amounts[resource_type] = clampf(value, 0.0, GetCapacity(resource_type))
	storage_changed.emit()
