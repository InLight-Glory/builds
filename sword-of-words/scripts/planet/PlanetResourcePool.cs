using System.Collections.Generic;
using Godot;

public partial class PlanetResourcePool : Node
{
    private PlanetNode? _planet;
    private readonly Dictionary<ResourceType, float> _currentAmounts = new();

    public override void _Ready()
    {
        _planet = GetParentOrNull<PlanetNode>();
        InitializeFromPlanetData();
    }

    public override void _Process(double delta)
    {
        if (_planet == null)
        {
            return;
        }

        float dt = (float)delta;

        foreach (KeyValuePair<ResourceType, ResourcePoolConfig> pair in _planet.Data.Resources)
        {
            ResourceType type = pair.Key;
            ResourcePoolConfig config = pair.Value;

            if (!_currentAmounts.ContainsKey(type))
            {
                _currentAmounts[type] = 0.0f;
            }

            float regen = config.RegenSpeed * config.Abundance * dt;
            _currentAmounts[type] = Mathf.Min(config.Max, _currentAmounts[type] + regen);
        }
    }

    public float Harvest(ResourceType type, float requestedAmount)
    {
        if (!_currentAmounts.TryGetValue(type, out float current))
        {
            return 0.0f;
        }

        float harvested = Mathf.Min(current, Mathf.Max(0.0f, requestedAmount));
        _currentAmounts[type] -= harvested;
        return harvested;
    }

    public float GetAmount(ResourceType type)
    {
        return _currentAmounts.TryGetValue(type, out float amount) ? amount : 0.0f;
    }

    private void InitializeFromPlanetData()
    {
        _currentAmounts.Clear();

        if (_planet == null)
        {
            return;
        }

        foreach (KeyValuePair<ResourceType, ResourcePoolConfig> pair in _planet.Data.Resources)
        {
            ResourcePoolConfig config = pair.Value;
            _currentAmounts[pair.Key] = config.Max * config.Abundance;
        }
    }
}
