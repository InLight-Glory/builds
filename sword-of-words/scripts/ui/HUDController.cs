using Godot;

public partial class HUDController : CanvasLayer
{
    [Export]
    public NodePath FocusLabelPath = "Root/FocusLabel";

    [Export]
    public NodePath ResourceLabelPath = "Root/ResourceLabel";

    [Export]
    public NodePath ReticleVerticalPath = "Root/ReticleV";

    [Export]
    public NodePath ReticleHorizontalPath = "Root/ReticleH";

    [Export]
    public NodePath PlayerPath = "../Player";

    private Label? _focusLabel;
    private Label? _resourceLabel;
    private ColorRect? _reticleVertical;
    private ColorRect? _reticleHorizontal;

    private ReticleSystem? _reticle;
    private PlayerInventory? _inventory;
    private PlayerController? _player;

    public override void _Ready()
    {
        _focusLabel = GetNodeOrNull<Label>(FocusLabelPath);
        _resourceLabel = GetNodeOrNull<Label>(ResourceLabelPath);
        _reticleVertical = GetNodeOrNull<ColorRect>(ReticleVerticalPath);
        _reticleHorizontal = GetNodeOrNull<ColorRect>(ReticleHorizontalPath);

        _player = GetNodeOrNull<PlayerController>(PlayerPath);
        _reticle = GetNodeOrNull<ReticleSystem>("../Player/ReticleSystem");
        _inventory = GetNodeOrNull<PlayerInventory>("../Player/Inventory");
    }

    public override void _Process(double delta)
    {
        UpdateFocusLabel();
        UpdateResourceLabel();
        UpdateReticleColor();
    }

    private void UpdateFocusLabel()
    {
        if (_focusLabel == null || _player == null)
        {
            return;
        }

        PlanetNode? focus = _reticle?.FocusedPlanet;
        if (focus == null)
        {
            _focusLabel.Text = "Focus: none";
            return;
        }

        float distance = _player.GlobalPosition.DistanceTo(focus.GlobalPosition);
        _focusLabel.Text = $"Focus: {focus.Data.Id} ({distance:0}m)";
    }

    private void UpdateResourceLabel()
    {
        if (_resourceLabel == null || _inventory == null)
        {
            return;
        }

        _resourceLabel.Text =
            $"Air {_inventory.GetAmount(ResourceType.Air):0} | " +
            $"Oil {_inventory.GetAmount(ResourceType.Oil):0} | " +
            $"Water {_inventory.GetAmount(ResourceType.Water):0} | " +
            $"Metals {_inventory.GetAmount(ResourceType.Metals):0} | " +
            $"Minerals {_inventory.GetAmount(ResourceType.Minerals):0}";
    }

    private void UpdateReticleColor()
    {
        Color color = _reticle?.FocusedPlanet != null
            ? new Color(0.45f, 1.0f, 0.70f, 0.90f)
            : new Color(1.0f, 1.0f, 1.0f, 0.85f);

        if (_reticleVertical != null)
        {
            _reticleVertical.Color = color;
        }

        if (_reticleHorizontal != null)
        {
            _reticleHorizontal.Color = color;
        }
    }
}
