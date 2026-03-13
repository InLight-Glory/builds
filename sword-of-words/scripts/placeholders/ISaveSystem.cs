using Godot;

public interface ISaveSystem
{
    void SaveRun(string slotId);

    void LoadRun(string slotId);
}

public partial class SaveSystemStub : Node, ISaveSystem
{
    public void SaveRun(string slotId)
    {
        GD.Print($"TODO Save run: {slotId}");
    }

    public void LoadRun(string slotId)
    {
        GD.Print($"TODO Load run: {slotId}");
    }
}
