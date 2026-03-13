using Godot;

public partial class PlanetNode : Node3D
{
    [Export]
    public NodePath SurfaceMeshPath = "SurfaceMesh";

    [Export]
    public NodePath SurfaceCollisionPath = "SurfaceBody/CollisionShape3D";

    [Export]
    public NodePath GravityFieldPath = "GravityField";

    [Export]
    public NodePath GravityCollisionPath = "GravityField/CollisionShape3D";

    private MeshInstance3D? _surfaceMesh;
    private CollisionShape3D? _surfaceCollision;
    private PlanetGravityField? _gravityField;
    private CollisionShape3D? _gravityCollision;
    private StandardMaterial3D? _sharedMaterial;

    public PlanetData Data { get; private set; } = new PlanetData();

    public override void _Ready()
    {
        AddToGroup("planets");
        CacheNodes();
        ApplyData();
    }

    public void Initialize(PlanetData data)
    {
        Data = data;
        if (IsInsideTree())
        {
            ApplyData();
        }
    }

    private void CacheNodes()
    {
        _surfaceMesh = GetNodeOrNull<MeshInstance3D>(SurfaceMeshPath);
        _surfaceCollision = GetNodeOrNull<CollisionShape3D>(SurfaceCollisionPath);
        _gravityField = GetNodeOrNull<PlanetGravityField>(GravityFieldPath);
        _gravityCollision = GetNodeOrNull<CollisionShape3D>(GravityCollisionPath);
    }

    private void ApplyData()
    {
        GlobalPosition = Data.Position;

        if (_surfaceMesh?.Mesh is SphereMesh sphereMesh)
        {
            sphereMesh.Radius = Data.Size;
            sphereMesh.Height = Data.Size * 2.0f;
        }

        if (_surfaceCollision?.Shape is SphereShape3D surfaceShape)
        {
            surfaceShape.Radius = Data.Size;
        }

        if (_gravityCollision?.Shape is SphereShape3D gravityShape)
        {
            gravityShape.Radius = Data.Size * 2.1f;
        }

        if (_gravityField != null)
        {
            _gravityField.Planet = this;
            _gravityField.GravityStrength = Data.Gravity;
        }

        ApplyBiomeVisuals();
    }

    private void ApplyBiomeVisuals()
    {
        if (_surfaceMesh == null)
        {
            return;
        }

        _sharedMaterial ??= new StandardMaterial3D
        {
            Roughness = 0.92f,
            Metallic = 0.08f,
        };

        _sharedMaterial.AlbedoColor = Data.Biome switch
        {
            PlanetBiome.Temperate => new Color("5ba870"),
            PlanetBiome.Arid => new Color("cfa25e"),
            PlanetBiome.Oceanic => new Color("4a86c5"),
            PlanetBiome.Volcanic => new Color("b55343"),
            PlanetBiome.Frozen => new Color("b5d7e9"),
            PlanetBiome.Metallic => new Color("9aa0a6"),
            _ => new Color("7f7f7f"),
        };

        _surfaceMesh.MaterialOverride = _sharedMaterial;
    }
}
