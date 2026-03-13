using Godot;

public partial class PlanetGravityField : Area3D
{
    [Export]
    public float GravityStrength = 20.0f;

    public PlanetNode? Planet { get; set; }

    public override void _Ready()
    {
        Monitoring = true;
        Monitorable = true;

        BodyEntered += OnBodyEntered;
        BodyExited += OnBodyExited;
    }

    private void OnBodyEntered(Node3D body)
    {
        if (body is not PlayerController player)
        {
            return;
        }

        PlanetNode? sourcePlanet = Planet ?? GetParentOrNull<PlanetNode>();
        if (sourcePlanet != null)
        {
            player.RegisterGravitySource(sourcePlanet, GravityStrength);
        }
    }

    private void OnBodyExited(Node3D body)
    {
        if (body is not PlayerController player)
        {
            return;
        }

        PlanetNode? sourcePlanet = Planet ?? GetParentOrNull<PlanetNode>();
        if (sourcePlanet != null)
        {
            player.UnregisterGravitySource(sourcePlanet);
        }
    }
}
