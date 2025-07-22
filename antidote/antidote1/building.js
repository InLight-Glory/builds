// building.js

class Building {
    constructor(position, type) {
        this.position = position.clone();
        this.type = type; // e.g., 'Barracks', 'Refinery'
        this.state = 'blueprint'; // 'blueprint', 'constructing', 'complete'
        this.mesh = null; // Will be created in initMesh
        
        this.requiredResources = {
            'Barracks': { wood: 150, metal: 50 },
            'Refinery': { wood: 50, metal: 200 },
            'Base': { wood: 100, metal: 100 }
        };

        this.depositedResources = {
            wood: 0,
            metal: 0
        };

        this.initMesh();
    }

    initMesh() {
        const geometry = new THREE.BoxGeometry(5, 0.2, 5);
        const material = new THREE.MeshBasicMaterial({ color: 0x00FFFF, transparent: true, opacity: 0.5 });
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.position.copy(this.position);
        
        // Link the mesh back to this class instance for interaction
        this.mesh.userData.isBlueprint = true;
        this.mesh.userData.building = this; 
    }

    // NEW METHOD: Handles taking resources from the player
    depositResources(player) {
        if (this.state !== 'blueprint' || !player) return;

        console.log("Attempting to deposit resources...");
        const required = this.requiredResources[this.type];
        let depositedSomething = false;

        for (const resource in required) {
            if (player[resource] > 0) {
                const needed = required[resource] - this.depositedResources[resource];
                if (needed > 0) {
                    const amountToDeposit = Math.min(player[resource], needed);
                    
                    this.depositedResources[resource] += amountToDeposit;
                    player[resource] -= amountToDeposit;
                    
                    console.log(`Deposited ${amountToDeposit} ${resource}.`);
                    depositedSomething = true;
                }
            }
        }

        if (depositedSomething) {
            this.updateAppearance();
            this.checkCompletion();
        }
    }
    
    updateAppearance() {
        const required = this.requiredResources[this.type];
        const totalRequired = Object.values(required).reduce((a, b) => a + b, 0);
        const totalDeposited = Object.values(this.depositedResources).reduce((a, b) => a + b, 0);
        
        if (totalRequired > 0) {
            const progress = totalDeposited / totalRequired;
            this.mesh.material.opacity = 0.5 + (0.5 * progress);
        }
    }

    checkCompletion() {
        const required = this.requiredResources[this.type];
        const isComplete = Object.keys(required).every(
            resource => this.depositedResources[resource] >= required[resource]
        );

        if (isComplete) {
            this.finishConstruction();
        }
    }

    finishConstruction() {
        this.state = 'complete';
        this.mesh.userData.isBlueprint = false; // No longer a blueprint
        this.mesh.material.color.set(0x00FF00); // Change color to green
        this.mesh.material.opacity = 1.0;
        // Optional: Change geometry to a full building model
        const buildingGeometry = new THREE.BoxGeometry(5, 8, 5);
        this.mesh.geometry.dispose(); // Clean up old geometry
        this.mesh.geometry = buildingGeometry;
        console.log(`${this.type} construction complete!`);
    }
}

export { Building };