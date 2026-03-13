using System.Collections.Generic;
using Godot;

public enum PlanetBiome
{
    Temperate,
    Arid,
    Oceanic,
    Volcanic,
    Frozen,
    Metallic,
}

public sealed class PlanetData
{
    public string Id { get; set; } = "procedural";

    public Vector3 Position { get; set; } = Vector3.Zero;

    public float Size { get; set; } = 40.0f;

    public float Gravity { get; set; } = 20.0f;

    public float Friction { get; set; } = 0.6f;

    public PlanetBiome Biome { get; set; } = PlanetBiome.Temperate;

    public bool IsOverride { get; set; }

    public int SeedId { get; set; }

    public Dictionary<ResourceType, ResourcePoolConfig> Resources { get; set; } = CreateDefaultResources();

    public ResourcePoolConfig GetResourceConfig(ResourceType type)
    {
        if (Resources.TryGetValue(type, out ResourcePoolConfig? config))
        {
            return config;
        }

        return new ResourcePoolConfig();
    }

    public static PlanetData CreateStarter(
        string id,
        Vector3 position,
        float size,
        float gravity,
        float friction,
        PlanetBiome biome)
    {
        return new PlanetData
        {
            Id = id,
            Position = position,
            Size = size,
            Gravity = gravity,
            Friction = friction,
            Biome = biome,
            IsOverride = true,
            SeedId = id.GetHashCode(),
        };
    }

    private static Dictionary<ResourceType, ResourcePoolConfig> CreateDefaultResources()
    {
        return new Dictionary<ResourceType, ResourcePoolConfig>
        {
            [ResourceType.Water] = new ResourcePoolConfig { Max = 800.0f, RegenSpeed = 1.6f, Abundance = 0.7f },
            [ResourceType.Oil] = new ResourcePoolConfig { Max = 500.0f, RegenSpeed = 0.8f, Abundance = 0.5f },
            [ResourceType.Air] = new ResourcePoolConfig { Max = 1000.0f, RegenSpeed = 2.2f, Abundance = 0.8f },
            [ResourceType.Metals] = new ResourcePoolConfig { Max = 650.0f, RegenSpeed = 0.6f, Abundance = 0.55f },
            [ResourceType.Minerals] = new ResourcePoolConfig { Max = 700.0f, RegenSpeed = 0.7f, Abundance = 0.6f },
        };
    }
}
