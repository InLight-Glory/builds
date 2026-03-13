using Godot;

public interface IItemStorage
{
    bool StoreItem(string itemId, int amount);
}

public partial class ItemStorageStub : Node, IItemStorage
{
    public bool StoreItem(string itemId, int amount)
    {
        GD.Print($"TODO Item storage add: {itemId} x{amount}");
        return true;
    }
}
