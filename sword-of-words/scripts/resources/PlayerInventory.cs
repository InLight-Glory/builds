using System;
using System.Collections.Generic;
using Godot;

public partial class PlayerInventory : Node
{
    [Signal]
    public delegate void InventoryChangedEventHandler();

    [Export]
    public float StartingWater = 120.0f;

    [Export]
    public float StartingOil = 120.0f;

    [Export]
    public float StartingAir = 160.0f;

    [Export]
    public float StartingMetals = 80.0f;

    [Export]
    public float StartingMinerals = 90.0f;

    private readonly Dictionary<ResourceType, float> _amounts = new();

    public override void _Ready()
    {
        foreach (ResourceType type in Enum.GetValues<ResourceType>())
        {
            _amounts[type] = 0.0f;
        }

        _amounts[ResourceType.Water] = StartingWater;
        _amounts[ResourceType.Oil] = StartingOil;
        _amounts[ResourceType.Air] = StartingAir;
        _amounts[ResourceType.Metals] = StartingMetals;
        _amounts[ResourceType.Minerals] = StartingMinerals;

        EmitSignal(SignalName.InventoryChanged);
    }

    public float GetAmount(ResourceType type)
    {
        return _amounts.TryGetValue(type, out float amount) ? amount : 0.0f;
    }

    public void Add(ResourceType type, float amount)
    {
        if (!_amounts.ContainsKey(type))
        {
            _amounts[type] = 0.0f;
        }

        _amounts[type] += Mathf.Max(0.0f, amount);
        EmitSignal(SignalName.InventoryChanged);
    }

    public bool Remove(ResourceType type, float amount)
    {
        float current = GetAmount(type);
        if (current < amount)
        {
            return false;
        }

        _amounts[type] = current - amount;
        EmitSignal(SignalName.InventoryChanged);
        return true;
    }

    public bool CanAfford(Dictionary<ResourceType, float> costs)
    {
        foreach (KeyValuePair<ResourceType, float> pair in costs)
        {
            if (GetAmount(pair.Key) < pair.Value)
            {
                return false;
            }
        }

        return true;
    }

    public bool Remove(Dictionary<ResourceType, float> costs)
    {
        if (!CanAfford(costs))
        {
            return false;
        }

        foreach (KeyValuePair<ResourceType, float> pair in costs)
        {
            _amounts[pair.Key] -= pair.Value;
        }

        EmitSignal(SignalName.InventoryChanged);
        return true;
    }
}
