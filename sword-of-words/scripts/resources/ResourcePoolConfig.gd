class_name ResourcePoolConfig
extends RefCounted

var max: float = 100.0
var regen_speed: float = 1.0
var abundance: float = 0.5

func _init(max_value: float = 100.0, regen_speed_value: float = 1.0, abundance_value: float = 0.5) -> void:
    max = max_value
    regen_speed = regen_speed_value
    abundance = abundance_value
