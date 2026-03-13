// pickup.js - Handles creation, animation, and collection of in-game pick-up items

function createPickupMaterial(color, emissive) {
    return new THREE.MeshStandardMaterial({
        color,
        emissive,
        emissiveIntensity: 0.5,
        roughness: 0.42,
        metalness: 0.18
    });
}

function createResourcePickup(position, config) {
    const group = new THREE.Group();
    group.position.copy(position);

    const core = new THREE.Mesh(config.geometry, createPickupMaterial(config.color, config.emissive));
    core.castShadow = true;
    core.receiveShadow = true;
    group.add(core);

    const halo = new THREE.Mesh(
        new THREE.RingGeometry(0.25, 0.45, 18),
        new THREE.MeshBasicMaterial({
            color: config.color,
            transparent: true,
            opacity: 0.42,
            side: THREE.DoubleSide,
            depthWrite: false
        })
    );
    halo.rotation.x = -Math.PI / 2;
    halo.position.y = -0.1;
    group.add(halo);

    group.userData = {
        isPickup: true,
        type: config.type,
        value: config.value,
        baseY: position.y,
        bobOffset: Math.random() * Math.PI * 2,
        spinRate: 0.8 + Math.random() * 0.8,
        core,
        halo
    };
    group.name = `${config.type[0].toUpperCase()}${config.type.slice(1)}Pickup`;
    return group;
}

export function createWoodPickup(position) {
    return createResourcePickup(position, {
        type: 'wood',
        value: 1,
        geometry: new THREE.DodecahedronGeometry(0.28, 0),
        color: 0xc68f53,
        emissive: 0x6b3f18
    });
}

export function updatePickups(delta, elapsedTime) {
    if (!window.objects) return;

    window.objects.forEach((object) => {
        if (object.userData && object.userData.isPickup) {
            object.rotation.y += delta * object.userData.spinRate;
            object.position.y = object.userData.baseY + Math.sin(elapsedTime * 2.5 + object.userData.bobOffset) * 0.12;
            if (object.userData.core && object.userData.core.material) {
                object.userData.core.material.emissiveIntensity = 0.38 + Math.sin(elapsedTime * 4 + object.userData.bobOffset) * 0.15;
            }
            if (object.userData.halo) {
                const scale = 1 + Math.sin(elapsedTime * 3.3 + object.userData.bobOffset) * 0.08;
                object.userData.halo.scale.set(scale, scale, scale);
            }
        }
    });
}

export function collectPickup(pickupObject, playerStats) {
    console.log("collectPickup entered for:", pickupObject.name);
    if (!pickupObject.userData || !pickupObject.userData.isPickup) {
        console.warn("Attempted to collect a non-pickup object.");
        return;
    }

    if (playerStats && typeof playerStats[pickupObject.userData.type] === 'number') {
        playerStats[pickupObject.userData.type] += pickupObject.userData.value;
        console.log(`Collected ${pickupObject.userData.value} ${pickupObject.userData.type}.`);
    } else {
        console.warn("Player stats not available or pickup resource key missing.");
    }

    pickupObject.traverse((node) => {
        if (node.geometry) node.geometry.dispose();
        if (node.material) {
            if (Array.isArray(node.material)) node.material.forEach((material) => material.dispose());
            else node.material.dispose();
        }
    });
    if (pickupObject.parent) pickupObject.parent.remove(pickupObject);

    if (typeof window.unregisterWorldObject === 'function') {
        window.unregisterWorldObject(pickupObject);
    } else if (window.objects) {
        const index = window.objects.indexOf(pickupObject);
        if (index > -1) {
            window.objects.splice(index, 1);
        }
    }
}
