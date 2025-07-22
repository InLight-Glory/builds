// build_manager.js - Manages the state of the selected blueprint

let selectedBlueprintType = null;

export function setSelectedBlueprintType(type) {
    selectedBlueprintType = type;
    console.log(`BuildManager: Blueprint type set to '${type}'`);
}

export function getSelectedBlueprintType() {
    return selectedBlueprintType;
}

export function clearSelectedBlueprintType() {
    selectedBlueprintType = null;
    console.log("BuildManager: Blueprint selection cleared.");
}