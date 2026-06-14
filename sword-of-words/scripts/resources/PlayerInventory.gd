class_name PlayerInventory
extends Node

signal inventory_changed

@export var StartingWater: float = 120.0
@export var StartingOil: float = 120.0
@export var StartingAir: float = 160.0
@export var StartingMetals: float = 80.0
@export var StartingMinerals: float = 90.0

@export var MaxWater: float = 450.0
@export var MaxOil: float = 420.0
@export var MaxAir: float = 520.0
@export var MaxMetals: float = 360.0
@export var MaxMinerals: float = 380.0

var _amounts: Dictionary = {}

func _ready() -> void:
    _amounts[ResourceType.Water] = StartingWater
    _amounts[ResourceType.Oil] = StartingOil
    _amounts[ResourceType.Air] = StartingAir
    _amounts[ResourceType.Metals] = StartingMetals
    _amounts[ResourceType.Minerals] = StartingMinerals

    inventory_changed.emit()

func GetAmount(resource_type: int) -> float:
    return _amounts.get(resource_type, 0.0)

func GetCapacity(resource_type: int) -> float:
    return _get_capacity(resource_type)

func GetAvailableCapacity(resource_type: int) -> float:
    return maxf(0.0, GetCapacity(resource_type) - GetAmount(resource_type))

func Add(resource_type: int, amount: float) -> void:
    if not _amounts.has(resource_type):
        _amounts[resource_type] = 0.0

    _amounts[resource_type] = clampf(
        float(_amounts[resource_type]) + maxf(0.0, amount),
        0.0,
        _get_capacity(resource_type)
    )
    inventory_changed.emit()

func Remove(resource_or_costs: Variant, amount: float = -1.0) -> bool:
    if typeof(resource_or_costs) == TYPE_DICTIONARY:
        var costs: Dictionary = resource_or_costs
        if not CanAfford(costs):
            return false

        for resource_type in costs.keys():
            _amounts[resource_type] = float(_amounts.get(resource_type, 0.0)) - float(costs[resource_type])

        inventory_changed.emit()
        return true

    var resource_type: int = int(resource_or_costs)
    var current := GetAmount(resource_type)
    if current < amount:
        return false

    _amounts[resource_type] = current - amount
    inventory_changed.emit()
    return true

func RemoveUpTo(resource_type: int, amount: float) -> float:
    if amount <= 0.0:
        return 0.0

    var current := GetAmount(resource_type)
    var removed: float = minf(current, amount)
    _amounts[resource_type] = current - removed
    inventory_changed.emit()
    return removed

func CanAfford(costs: Dictionary) -> bool:
    for resource_type in costs.keys():
        if GetAmount(int(resource_type)) < float(costs[resource_type]):
            return false

    return true

func _get_capacity(resource_type: int) -> float:
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
            return 999.0
