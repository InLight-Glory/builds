using Godot;

public partial class TimeEventManager : Node
{
    [Signal]
    public delegate void TimeEventSpawnedEventHandler(string eventId, Node3D targetPlanet);

    [Export]
    public float EventIntervalSeconds = 45.0f;

    private readonly RandomNumberGenerator _rng = new();
    private Timer? _timer;

    public override void _Ready()
    {
        _rng.Randomize();

        _timer = new Timer
        {
            Name = "EventTimer",
            OneShot = false,
            Autostart = true,
            WaitTime = EventIntervalSeconds,
        };

        AddChild(_timer);
        _timer.Timeout += OnEventTimerTimeout;
    }

    private void OnEventTimerTimeout()
    {
        Godot.Collections.Array<Node> planets = GetTree().GetNodesInGroup("planets");
        if (planets.Count == 0)
        {
            return;
        }

        int index = _rng.RandiRange(0, planets.Count - 1);
        if (planets[index] is not PlanetNode target)
        {
            return;
        }

        string eventId = $"evt_{Time.GetUnixTimeFromSystem()}_{index}";
        EmitSignal(SignalName.TimeEventSpawned, eventId, target);
    }
}
