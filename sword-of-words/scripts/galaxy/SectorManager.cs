using System.Collections.Generic;
using Godot;

public partial class SectorManager : Node
{
    [Signal]
    public delegate void SectorLoadedEventHandler(Vector3I sector);

    [Signal]
    public delegate void SectorUnloadedEventHandler(Vector3I sector);

    [Export]
    public float SectorSize = 512.0f;

    [Export]
    public int ActiveRadiusInSectors = 1;

    private readonly HashSet<Vector3I> _activeSectors = new();

    public Vector3I WorldToSector(Vector3 worldPosition)
    {
        return new Vector3I(
            Mathf.FloorToInt(worldPosition.X / SectorSize),
            Mathf.FloorToInt(worldPosition.Y / SectorSize),
            Mathf.FloorToInt(worldPosition.Z / SectorSize));
    }

    public void UpdateActiveSectors(Vector3 playerPosition)
    {
        Vector3I center = WorldToSector(playerPosition);
        HashSet<Vector3I> nextActive = BuildRadiusSet(center, ActiveRadiusInSectors);

        foreach (Vector3I sector in nextActive)
        {
            if (_activeSectors.Contains(sector))
            {
                continue;
            }

            _activeSectors.Add(sector);
            EmitSignal(SignalName.SectorLoaded, sector);
        }

        List<Vector3I> toUnload = new();
        foreach (Vector3I sector in _activeSectors)
        {
            if (!nextActive.Contains(sector))
            {
                toUnload.Add(sector);
            }
        }

        foreach (Vector3I sector in toUnload)
        {
            _activeSectors.Remove(sector);
            EmitSignal(SignalName.SectorUnloaded, sector);
        }
    }

    private static HashSet<Vector3I> BuildRadiusSet(Vector3I center, int radius)
    {
        HashSet<Vector3I> set = new();

        for (int x = -radius; x <= radius; x++)
        {
            for (int y = -radius; y <= radius; y++)
            {
                for (int z = -radius; z <= radius; z++)
                {
                    set.Add(new Vector3I(center.X + x, center.Y + y, center.Z + z));
                }
            }
        }

        return set;
    }
}
