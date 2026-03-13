using Godot;

public static class PlanetGenerator
{
    public static PlanetData GeneratePlanet(
        long galaxySeed,
        Vector3I sector,
        int localIndex,
        float sectorSize)
    {
        ulong seed = MixSeed(galaxySeed, sector, localIndex);

        RandomNumberGenerator rng = new();
        rng.Seed = seed;

        Vector3 sectorOrigin = new Vector3(
            sector.X * sectorSize,
            sector.Y * sectorSize,
            sector.Z * sectorSize);

        Vector3 offset = new Vector3(
            rng.RandfRange(0.0f, sectorSize),
            rng.RandfRange(0.0f, sectorSize),
            rng.RandfRange(0.0f, sectorSize));

        PlanetBiome biome = (PlanetBiome)rng.RandiRange(0, (int)PlanetBiome.Metallic);

        PlanetData data = new PlanetData
        {
            Id = $"p_{sector.X}_{sector.Y}_{sector.Z}_{localIndex}",
            Position = sectorOrigin + offset,
            Size = rng.RandfRange(18.0f, 62.0f),
            Gravity = rng.RandfRange(14.0f, 28.0f),
            Friction = rng.RandfRange(0.45f, 0.9f),
            Biome = biome,
            IsOverride = false,
            SeedId = (int)(seed & 0x7FFFFFFF),
        };

        ApplyResourceBias(data, rng);
        return data;
    }

    private static void ApplyResourceBias(PlanetData data, RandomNumberGenerator rng)
    {
        foreach (ResourceType type in data.Resources.Keys)
        {
            ResourcePoolConfig cfg = data.Resources[type];

            float biomeBias = data.Biome switch
            {
                PlanetBiome.Oceanic when type == ResourceType.Water => 1.35f,
                PlanetBiome.Arid when type == ResourceType.Oil => 1.25f,
                PlanetBiome.Volcanic when type == ResourceType.Metals => 1.30f,
                PlanetBiome.Metallic when type == ResourceType.Metals => 1.45f,
                PlanetBiome.Frozen when type == ResourceType.Air => 1.20f,
                _ => 1.0f,
            };

            float variance = rng.RandfRange(0.75f, 1.25f);
            cfg.Abundance = Mathf.Clamp(cfg.Abundance * biomeBias * variance, 0.05f, 1.0f);
            cfg.Max *= Mathf.Clamp(variance * biomeBias, 0.5f, 2.0f);
        }
    }

    private static ulong MixSeed(long galaxySeed, Vector3I sector, int localIndex)
    {
        ulong value = (ulong)galaxySeed;
        value ^= (ulong)((sector.X * 73856093) ^ (sector.Y * 19349663) ^ (sector.Z * 83492791));
        value ^= (ulong)(localIndex * 2654435761);
        value *= 1099511628211;
        value ^= value >> 33;
        return value;
    }
}
