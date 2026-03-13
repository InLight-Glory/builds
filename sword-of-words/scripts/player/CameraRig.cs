using Godot;

public partial class CameraRig : Node3D
{
    [Export]
    public NodePath SpringArmPath = "SpringArm3D";

    [Export]
    public NodePath CameraPath = "SpringArm3D/Camera3D";

    [Export]
    public float ThirdPersonDistance = 8.0f;

    [Export]
    public float FirstPersonDistance = 0.05f;

    [Export]
    public float CameraLerpSpeed = 10.0f;

    [Export]
    public float MouseSensitivity = 0.10f;

    [Export]
    public float PitchMin = -80.0f;

    [Export]
    public float PitchMax = 75.0f;

    private SpringArm3D? _springArm;
    private Camera3D? _camera;

    private bool _isThirdPerson = true;
    private float _yaw;
    private float _pitch = -10.0f;

    public override void _Ready()
    {
        _springArm = GetNodeOrNull<SpringArm3D>(SpringArmPath);
        _camera = GetNodeOrNull<Camera3D>(CameraPath);

        if (_camera != null)
        {
            _camera.Current = true;
        }

        if (_springArm != null)
        {
            _springArm.SpringLength = ThirdPersonDistance;
        }

        Input.MouseMode = Input.MouseModeEnum.Captured;
    }

    public override void _UnhandledInput(InputEvent @event)
    {
        if (@event is InputEventMouseMotion motion && Input.MouseMode == Input.MouseModeEnum.Captured)
        {
            _yaw -= motion.Relative.X * MouseSensitivity;
            _pitch = Mathf.Clamp(_pitch - (motion.Relative.Y * MouseSensitivity), PitchMin, PitchMax);
        }

        if (@event.IsActionPressed("ui_cancel"))
        {
            Input.MouseMode = Input.MouseMode == Input.MouseModeEnum.Captured
                ? Input.MouseModeEnum.Visible
                : Input.MouseModeEnum.Captured;
        }
    }

    public override void _Process(double delta)
    {
        if (Input.IsActionJustPressed("toggle_camera"))
        {
            _isThirdPerson = !_isThirdPerson;
        }

        RotationDegrees = new Vector3(_pitch, _yaw, 0.0f);

        if (_springArm == null)
        {
            return;
        }

        float targetDistance = _isThirdPerson ? ThirdPersonDistance : FirstPersonDistance;
        _springArm.SpringLength = Mathf.Lerp(_springArm.SpringLength, targetDistance, (float)delta * CameraLerpSpeed);
    }
}
