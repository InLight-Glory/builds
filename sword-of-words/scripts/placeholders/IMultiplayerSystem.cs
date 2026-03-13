using Godot;

public interface IMultiplayerSystem
{
    void Host(int port);

    void Join(string address, int port);
}

public partial class MultiplayerSystemStub : Node, IMultiplayerSystem
{
    public void Host(int port)
    {
        GD.Print($"TODO Multiplayer host on port: {port}");
    }

    public void Join(string address, int port)
    {
        GD.Print($"TODO Multiplayer join {address}:{port}");
    }
}
