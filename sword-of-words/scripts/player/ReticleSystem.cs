using Godot;

public partial class ReticleSystem : Node
{
    [Signal]
    public delegate void FocusChangedEventHandler(Node3D focusedPlanet);

    [Export]
    public NodePath CameraPath = "../CameraPivot/SpringArm3D/Camera3D";

    [Export]
    public float FocusRange = 700.0f;

    public PlanetNode? FocusedPlanet { get; private set; }

    private Camera3D? _camera;

    public override void _Ready()
    {
        _camera = GetNodeOrNull<Camera3D>(CameraPath);
    }

    public override void _PhysicsProcess(double delta)
    {
        UpdateFocus();
    }

    private void UpdateFocus()
    {
        if (_camera == null)
        {
            _camera = GetViewport().GetCamera3D();
            if (_camera == null)
            {
                return;
            }
        }

        Vector2 screenCenter = GetViewport().GetVisibleRect().Size * 0.5f;
        Vector3 origin = _camera.ProjectRayOrigin(screenCenter);
        Vector3 direction = _camera.ProjectRayNormal(screenCenter);

        PhysicsRayQueryParameters3D query = PhysicsRayQueryParameters3D.Create(origin, origin + (direction * FocusRange));
        query.CollideWithAreas = true;
        query.CollideWithBodies = true;

        Godot.Collections.Dictionary result = _camera.GetWorld3D().DirectSpaceState.IntersectRay(query);
        PlanetNode? nextFocus = null;

        if (result.Count > 0)
        {
            Node? colliderNode = result["collider"].AsGodotObject() as Node;
            nextFocus = ResolvePlanetNode(colliderNode);
        }

        SetFocus(nextFocus);
    }

    private void SetFocus(PlanetNode? nextFocus)
    {
        if (nextFocus == FocusedPlanet)
        {
            return;
        }

        FocusedPlanet = nextFocus;
        if (FocusedPlanet != null)
        {
            EmitSignal(SignalName.FocusChanged, FocusedPlanet);
        }
    }

    private static PlanetNode? ResolvePlanetNode(Node? node)
    {
        Node? current = node;

        while (current != null)
        {
            if (current is PlanetNode planet)
            {
                return planet;
            }

            current = current.GetParent();
        }

        return null;
    }
}
