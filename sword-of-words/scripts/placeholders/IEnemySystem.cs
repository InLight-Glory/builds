using Godot;

public interface IEnemySystem
{
    void SpawnWave(string waveId);
}

public partial class EnemySystemStub : Node, IEnemySystem
{
    public void SpawnWave(string waveId)
    {
        GD.Print($"TODO Enemy system wave: {waveId}");
    }
}
