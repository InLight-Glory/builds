using System.Collections.Generic;
using Godot;

public partial class TraversalSystem : Node
{
    [Export]
    public NodePath PlayerPath = "..";

    [Export]
    public NodePath ReticlePath = "../ReticleSystem";

    [Export]
    public NodePath InventoryPath = "../Inventory";

    [Export]
    public float MaxTraversalRange = 600.0f;

    [Export]
    public float LaunchImpulse = 35.0f;

    [Export]
    public float TraversalSteerForce = 22.0f;

    [Export]
    public float TargetCaptureDistance = 14.0f;

    [Export]
    public float AirCostPerUnit = 0.020f;

    [Export]
    public float OilCostPerUnit = 0.016f;

    public bool IsTraversing { get; private set; }

    private PlayerController? _player;
    private ReticleSystem? _reticle;
    private PlayerInventory? _inventory;

    private PlanetNode? _targetPlanet;

    public override void _Ready()
    {
        _player = GetNodeOrNull<PlayerController>(PlayerPath);
        _reticle = GetNodeOrNull<ReticleSystem>(ReticlePath);
        _inventory = GetNodeOrNull<PlayerInventory>(InventoryPath);
    }

    public override void _PhysicsProcess(double delta)
    {
        float dt = (float)delta;

        if (!IsTraversing && Input.IsActionJustPressed("traverse"))
        {
            TryStartTraversal();
        }

        if (IsTraversing)
        {
            UpdateTraversal(dt);
        }
    }

    private void TryStartTraversal()
    {
        if (_player == null || _reticle == null || _inventory == null)
        {
            return;
        }

        PlanetNode? focus = _reticle.FocusedPlanet;
        if (focus == null || focus == _player.CurrentPlanet)
        {
            return;
        }

        float distance = _player.GlobalPosition.DistanceTo(focus.GlobalPosition);
        if (distance > MaxTraversalRange)
        {
            return;
        }

        Dictionary<ResourceType, float> cost = BuildCost(distance);
        if (!_inventory.Remove(cost))
        {
            return;
        }

        _targetPlanet = focus;
        IsTraversing = true;

        _player.SetTraversalLock(true);

        Vector3 launchDirection = (_targetPlanet.GlobalPosition - _player.GlobalPosition).Normalized();
        _player.ApplyTraversalImpulse(launchDirection * LaunchImpulse);
        _player.ApplyTraversalImpulse(_player.SurfaceUp * (LaunchImpulse * 0.35f));
    }

    private void UpdateTraversal(float dt)
    {
        if (_player == null || _targetPlanet == null)
        {
            EndTraversal();
            return;
        }

        Vector3 toTarget = _targetPlanet.GlobalPosition - _player.GlobalPosition;
        float captureDistance = TargetCaptureDistance + _targetPlanet.Data.Size;

        if (toTarget.Length() <= captureDistance)
        {
            EndTraversal();
            return;
        }

        Vector3 steer = toTarget.Normalized() * (TraversalSteerForce * dt);
        _player.ApplyTraversalImpulse(steer);
    }

    private void EndTraversal()
    {
        if (_player != null)
        {
            _player.SetTraversalLock(false);
        }

        IsTraversing = false;
        _targetPlanet = null;
    }

    private Dictionary<ResourceType, float> BuildCost(float distance)
    {
        return new Dictionary<ResourceType, float>
        {
            [ResourceType.Air] = Mathf.Max(5.0f, distance * AirCostPerUnit),
            [ResourceType.Oil] = Mathf.Max(4.0f, distance * OilCostPerUnit),
        };
    }
}
