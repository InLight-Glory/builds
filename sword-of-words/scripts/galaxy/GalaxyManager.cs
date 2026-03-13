using Godot;

public partial class GalaxyManager : Node3D
{
    [Export]
    public NodePath PlayerPath = "Player";

    [Export]
    public NodePath PlanetAPath = "PlanetA";

    [Export]
    public NodePath PlanetBPath = "PlanetB";

    [Export]
    public NodePath PlanetCPath = "PlanetC";

    [Export]
    public NodePath SectorManagerPath = "SectorManager";

    private PlayerController? _player;
    private SectorManager? _sectorManager;

    public override void _Ready()
    {
        PlanetNode? planetA = GetNodeOrNull<PlanetNode>(PlanetAPath);
        PlanetNode? planetB = GetNodeOrNull<PlanetNode>(PlanetBPath);
        PlanetNode? planetC = GetNodeOrNull<PlanetNode>(PlanetCPath);

        if (planetA != null)
        {
            planetA.Initialize(PlanetData.CreateStarter(
                "home-temperate",
                new Vector3(0.0f, 0.0f, 0.0f),
                36.0f,
                21.0f,
                0.70f,
                PlanetBiome.Temperate));
        }

        if (planetB != null)
        {
            planetB.Initialize(PlanetData.CreateStarter(
                "arid-mining",
                new Vector3(0.0f, 90.0f, -260.0f),
                28.0f,
                19.0f,
                0.58f,
                PlanetBiome.Arid));
        }

        if (planetC != null)
        {
            planetC.Initialize(PlanetData.CreateStarter(
                "oceanic-air",
                new Vector3(220.0f, -20.0f, 120.0f),
                30.0f,
                20.0f,
                0.66f,
                PlanetBiome.Oceanic));
        }

        _player = GetNodeOrNull<PlayerController>(PlayerPath);
        _sectorManager = GetNodeOrNull<SectorManager>(SectorManagerPath);

        if (_player != null && planetA != null)
        {
            _player.GlobalPosition = planetA.GlobalPosition + (Vector3.Up * (planetA.Data.Size + 3.0f));
            _player.SetCurrentPlanet(planetA, planetA.Data.Gravity);
            _player.RegisterGravitySource(planetA, planetA.Data.Gravity);

            _sectorManager?.UpdateActiveSectors(_player.GlobalPosition);
        }
    }

    public override void _Process(double delta)
    {
        if (_player == null || _sectorManager == null)
        {
            return;
        }

        _sectorManager.UpdateActiveSectors(_player.GlobalPosition);
    }
}
