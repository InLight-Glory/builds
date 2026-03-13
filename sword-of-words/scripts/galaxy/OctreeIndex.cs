using System.Collections.Generic;
using Godot;

public sealed class OctreeIndex
{
    private readonly float _cellSize;
    private readonly Dictionary<Vector3I, HashSet<int>> _cellToPlanetIds = new();
    private readonly Dictionary<int, Vector3> _planetPositions = new();

    public OctreeIndex(float cellSize)
    {
        _cellSize = Mathf.Max(1.0f, cellSize);
    }

    public void Clear()
    {
        _cellToPlanetIds.Clear();
        _planetPositions.Clear();
    }

    public void Insert(int planetId, Vector3 position)
    {
        Remove(planetId);

        Vector3I cell = ToCell(position);
        if (!_cellToPlanetIds.TryGetValue(cell, out HashSet<int>? ids))
        {
            ids = new HashSet<int>();
            _cellToPlanetIds[cell] = ids;
        }

        ids.Add(planetId);
        _planetPositions[planetId] = position;
    }

    public void Remove(int planetId)
    {
        if (!_planetPositions.TryGetValue(planetId, out Vector3 previousPosition))
        {
            return;
        }

        Vector3I previousCell = ToCell(previousPosition);
        if (_cellToPlanetIds.TryGetValue(previousCell, out HashSet<int>? ids))
        {
            ids.Remove(planetId);
            if (ids.Count == 0)
            {
                _cellToPlanetIds.Remove(previousCell);
            }
        }

        _planetPositions.Remove(planetId);
    }

    public List<int> QueryRange(Vector3 center, float radius)
    {
        List<int> results = new();
        float radiusSq = radius * radius;

        int minX = Mathf.FloorToInt((center.X - radius) / _cellSize);
        int minY = Mathf.FloorToInt((center.Y - radius) / _cellSize);
        int minZ = Mathf.FloorToInt((center.Z - radius) / _cellSize);

        int maxX = Mathf.FloorToInt((center.X + radius) / _cellSize);
        int maxY = Mathf.FloorToInt((center.Y + radius) / _cellSize);
        int maxZ = Mathf.FloorToInt((center.Z + radius) / _cellSize);

        for (int x = minX; x <= maxX; x++)
        {
            for (int y = minY; y <= maxY; y++)
            {
                for (int z = minZ; z <= maxZ; z++)
                {
                    Vector3I cell = new Vector3I(x, y, z);
                    if (!_cellToPlanetIds.TryGetValue(cell, out HashSet<int>? ids))
                    {
                        continue;
                    }

                    foreach (int id in ids)
                    {
                        if (_planetPositions.TryGetValue(id, out Vector3 pos) && center.DistanceSquaredTo(pos) <= radiusSq)
                        {
                            results.Add(id);
                        }
                    }
                }
            }
        }

        return results;
    }

    private Vector3I ToCell(Vector3 position)
    {
        return new Vector3I(
            Mathf.FloorToInt(position.X / _cellSize),
            Mathf.FloorToInt(position.Y / _cellSize),
            Mathf.FloorToInt(position.Z / _cellSize));
    }
}
