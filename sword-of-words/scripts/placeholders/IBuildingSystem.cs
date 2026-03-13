using Godot;

public interface IBuildingSystem
{
    void PlaceBuilding(string buildingTypeId, Vector3 position);
}

public partial class BuildingSystemStub : Node, IBuildingSystem
{
    public void PlaceBuilding(string buildingTypeId, Vector3 position)
    {
        GD.Print($"TODO Building system place: {buildingTypeId} at {position}");
    }
}
