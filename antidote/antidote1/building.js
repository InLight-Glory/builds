// building.js

class Building {
    constructor(position, type) {
        this.position = position.clone();
        this.type = type; // e.g., 'Barracks', 'Refinery'
        this.state = 'blueprint'; // 'blueprint', 'constructing', 'complete'
        
        // Define resource costs based on building type
        this.requiredResources = {
            'Barracks': { wood: 150, metal: 50 },
            'Refinery': { wood: 50, metal: 200 }
        };
        this.buildProgress = 0;
        this.buildTotal = 100; // Total "work" needed to build

        // Create the 3D model for the blueprint
        const geometry = new THREE.BoxGeometry(5, 0.2, 5);
        const material = new THREE.MeshBasicMaterial({ color: 0x00FFFF, transparent: true, opacity: 0.5 });
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.position.copy(this.position);
    }

    // Called when the building is complete
    finishConstruction() {
        this.state = 'complete';
        this.mesh.material.color.set(0x00FF00); // Change color to green
        this.mesh.geometry.copy(new THREE.BoxGeometry(5, 8, 5)); // Make it a full building
        console.log(`${this.type} construction complete!`);
    }
}

export { Building };