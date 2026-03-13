using System.Collections.Generic;
using System.Text.Json.Serialization;

public enum ResourceType
{
    Water,
    Oil,
    Air,
    Metals,
    Minerals,
}

public sealed class ResourcePoolConfig
{
    [JsonPropertyName("max")]
    public float Max { get; set; } = 100.0f;

    [JsonPropertyName("regen_speed")]
    public float RegenSpeed { get; set; } = 1.0f;

    [JsonPropertyName("abundance")]
    public float Abundance { get; set; } = 0.5f;
}

public sealed class ResourceDefinition
{
    [JsonPropertyName("id")]
    public string Id { get; set; } = string.Empty;

    [JsonPropertyName("display_name")]
    public string DisplayName { get; set; } = string.Empty;

    [JsonPropertyName("base_cost_weight")]
    public float BaseCostWeight { get; set; } = 1.0f;

    public static Dictionary<ResourceType, ResourceDefinition> Defaults()
    {
        return new Dictionary<ResourceType, ResourceDefinition>
        {
            [ResourceType.Water] = new ResourceDefinition { Id = "water", DisplayName = "Water", BaseCostWeight = 0.6f },
            [ResourceType.Oil] = new ResourceDefinition { Id = "oil", DisplayName = "Oil", BaseCostWeight = 1.0f },
            [ResourceType.Air] = new ResourceDefinition { Id = "air", DisplayName = "Air", BaseCostWeight = 0.8f },
            [ResourceType.Metals] = new ResourceDefinition { Id = "metals", DisplayName = "Metals", BaseCostWeight = 1.2f },
            [ResourceType.Minerals] = new ResourceDefinition { Id = "minerals", DisplayName = "Minerals", BaseCostWeight = 1.1f },
        };
    }
}
