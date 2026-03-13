using System.Collections.Generic;
using Godot;

public partial class PlayerController : CharacterBody3D
{
    [Export]
    public float MoveSpeed = 14.0f;

    [Export]
    public float MoveAcceleration = 24.0f;

    [Export]
    public float JumpVelocity = 10.0f;

    [Export]
    public float BaseGravityStrength = 20.0f;

    [Export]
    public float RotationLerpSpeed = 8.0f;

    [Export]
    public float GroundFriction = 8.0f;

    [Export]
    public float AirControl = 0.35f;

    private readonly Dictionary<PlanetNode, float> _gravitySources = new();

    private PlanetNode? _currentPlanet;
    private float _activeGravityStrength = 20.0f;
    private Vector3 _surfaceUp = Vector3.Up;
    private bool _traversalLock;

    public Vector3 SurfaceUp => _surfaceUp;

    public PlanetNode? CurrentPlanet => _currentPlanet;

    public override void _PhysicsProcess(double delta)
    {
        float dt = (float)delta;

        ResolveCurrentPlanet();
        Vector3 gravityDirection = ResolveGravityDirection();

        HandleMovement(dt, gravityDirection);
        AlignToSurface(dt);

        UpDirection = _surfaceUp;
        MoveAndSlide();
    }

    public void RegisterGravitySource(PlanetNode planet, float gravityStrength)
    {
        _gravitySources[planet] = gravityStrength;
        ResolveCurrentPlanet();
    }

    public void UnregisterGravitySource(PlanetNode planet)
    {
        _gravitySources.Remove(planet);
        ResolveCurrentPlanet();
    }

    public void SetCurrentPlanet(PlanetNode? planet, float? gravityStrengthOverride = null)
    {
        _currentPlanet = planet;
        _activeGravityStrength = gravityStrengthOverride ?? planet?.Data.Gravity ?? BaseGravityStrength;

        if (planet != null)
        {
            _surfaceUp = (GlobalPosition - planet.GlobalPosition).Normalized();
        }
    }

    public void SetTraversalLock(bool enabled)
    {
        _traversalLock = enabled;
    }

    public void ApplyTraversalImpulse(Vector3 impulse)
    {
        Velocity += impulse;
    }

    private void ResolveCurrentPlanet()
    {
        PlanetNode? closest = null;
        float closestDistanceSq = float.MaxValue;

        foreach (KeyValuePair<PlanetNode, float> source in _gravitySources)
        {
            PlanetNode planet = source.Key;
            if (!IsInstanceValid(planet))
            {
                continue;
            }

            float distanceSq = GlobalPosition.DistanceSquaredTo(planet.GlobalPosition);
            if (distanceSq < closestDistanceSq)
            {
                closestDistanceSq = distanceSq;
                closest = planet;
            }
        }

        _currentPlanet = closest;
        _activeGravityStrength = closest != null && _gravitySources.TryGetValue(closest, out float strength)
            ? strength
            : BaseGravityStrength;
    }

    private Vector3 ResolveGravityDirection()
    {
        if (_currentPlanet == null)
        {
            _surfaceUp = Vector3.Up;
            return Vector3.Down;
        }

        Vector3 gravityDirection = (_currentPlanet.GlobalPosition - GlobalPosition).Normalized();
        _surfaceUp = -gravityDirection;
        return gravityDirection;
    }

    private void HandleMovement(float dt, Vector3 gravityDirection)
    {
        if (_traversalLock)
        {
            Velocity += gravityDirection * _activeGravityStrength * dt;
            return;
        }

        Vector2 input = Input.GetVector("move_left", "move_right", "move_forward", "move_back");

        Vector3 forward = (-GlobalTransform.Basis.Z).Slide(_surfaceUp).Normalized();
        if (forward.LengthSquared() < 0.0001f)
        {
            forward = GlobalTransform.Basis.X.Cross(_surfaceUp).Normalized();
        }

        Vector3 right = _surfaceUp.Cross(forward).Normalized();
        Vector3 desiredLateral = (right * input.X) + (forward * input.Y);
        if (desiredLateral.LengthSquared() > 1.0f)
        {
            desiredLateral = desiredLateral.Normalized();
        }

        desiredLateral *= MoveSpeed;

        float verticalSpeed = Velocity.Dot(gravityDirection);
        Vector3 lateralVelocity = Velocity - (gravityDirection * verticalSpeed);

        float acceleration = IsOnFloor() ? MoveAcceleration : MoveAcceleration * AirControl;
        lateralVelocity = lateralVelocity.MoveToward(desiredLateral, acceleration * dt);

        if (IsOnFloor() && desiredLateral.LengthSquared() < 0.001f)
        {
            float frictionScale = _currentPlanet?.Data.Friction ?? 0.6f;
            lateralVelocity = lateralVelocity.MoveToward(Vector3.Zero, GroundFriction * frictionScale * dt);
        }

        verticalSpeed += _activeGravityStrength * dt;
        Vector3 nextVelocity = lateralVelocity + (gravityDirection * verticalSpeed);

        if (IsOnFloor() && Input.IsActionJustPressed("jump"))
        {
            nextVelocity += _surfaceUp * JumpVelocity;
        }

        Velocity = nextVelocity;
    }

    private void AlignToSurface(float dt)
    {
        Vector3 planarForward = (-GlobalTransform.Basis.Z).Slide(_surfaceUp).Normalized();
        if (planarForward.LengthSquared() < 0.0001f)
        {
            planarForward = GlobalTransform.Basis.X.Cross(_surfaceUp).Normalized();
        }

        Basis targetBasis = Basis.LookingAt(-planarForward, _surfaceUp);
        Quaternion currentRotation = GlobalTransform.Basis.GetRotationQuaternion();
        Quaternion targetRotation = targetBasis.GetRotationQuaternion();

        Quaternion newRotation = currentRotation.Slerp(
            targetRotation,
            Mathf.Clamp(RotationLerpSpeed * dt, 0.0f, 1.0f));

        GlobalTransform = new Transform3D(new Basis(newRotation), GlobalPosition);
    }
}
