/**
 * Represents a neutral jungle creature that sits in a camp until killed.
 * Respawns after a delay.
 */
export class JungleMob {
    constructor(scene, options = {}) {
        const {
            position = new THREE.Vector3(0, 0, 0),
            mobType = 'wolf',   // 'wolf', 'golem', 'raptor'
            respawnTime = 30
        } = options;

        this.scene = scene;
        this.mobType = mobType;
        this.spawnPosition = position.clone();
        this.respawnTime = respawnTime;
        this.alive = true;
        this.respawnTimer = 0;

        // Stats vary by mob type
        const statTable = {
            wolf:   { maxHealth: 400,  armor: 15, color: 0x7f8c8d, size: 0.8 },
            golem:  { maxHealth: 800,  armor: 35, color: 0x6c5ce7, size: 1.4 },
            raptor: { maxHealth: 500,  armor: 20, color: 0xe17055, size: 1.0 }
        };
        const cfg = statTable[mobType] || statTable.wolf;

        this.stats = {
            maxHealth: cfg.maxHealth,
            currentHealth: cfg.maxHealth,
            armor: cfg.armor
        };

        this.mesh = new THREE.Group();
        this.buildModel(cfg.color, cfg.size);
        this.mesh.position.copy(position);
        scene.add(this.mesh);
    }

    buildModel(color, size) {
        const s = size;
        const mat = new THREE.MeshStandardMaterial({ color, flatShading: true });
        const lightColor = new THREE.Color(color).offsetHSL(0, -0.1, 0.15);
        const lightMat = new THREE.MeshStandardMaterial({ color: lightColor, flatShading: true });
        const darkColor = new THREE.Color(color).offsetHSL(0, 0, -0.15);
        const darkMat = new THREE.MeshStandardMaterial({ color: darkColor, flatShading: true });
        const eyeMat = new THREE.MeshBasicMaterial({ color: 0xff3333 });
        const boneMat = new THREE.MeshStandardMaterial({ color: 0xeeeecc, flatShading: true });

        if (this.mobType === 'wolf') {
            // === WOLF — quadruped with snout, ears, tail ===

            // Body — elongated box
            const body = new THREE.Mesh(new THREE.BoxGeometry(0.9 * s, 0.7 * s, 1.8 * s), mat);
            body.position.set(0, 1.0 * s, 0);
            body.castShadow = true;
            this.mesh.add(body);

            // Rib cage / chest — slightly wider front
            const chest = new THREE.Mesh(new THREE.BoxGeometry(1.0 * s, 0.75 * s, 0.6 * s), lightMat);
            chest.position.set(0, 1.05 * s, 0.7 * s);
            this.mesh.add(chest);

            // Head — boxy snout
            const head = new THREE.Mesh(new THREE.BoxGeometry(0.6 * s, 0.5 * s, 0.7 * s), mat);
            head.position.set(0, 1.3 * s, 1.3 * s);
            head.castShadow = true;
            this.mesh.add(head);
            // Snout
            const snout = new THREE.Mesh(new THREE.BoxGeometry(0.35 * s, 0.25 * s, 0.4 * s), lightMat);
            snout.position.set(0, 1.15 * s, 1.7 * s);
            this.mesh.add(snout);
            // Nose
            const nose = new THREE.Mesh(new THREE.BoxGeometry(0.12 * s, 0.1 * s, 0.08 * s), new THREE.MeshStandardMaterial({ color: 0x222222, flatShading: true }));
            nose.position.set(0, 1.2 * s, 1.92 * s);
            this.mesh.add(nose);
            // Ears
            [[-0.2, 1.6, 1.15], [0.2, 1.6, 1.15]].forEach(([ex, ey, ez]) => {
                const ear = new THREE.Mesh(new THREE.ConeGeometry(0.12 * s, 0.3 * s, 4), darkMat);
                ear.position.set(ex * s, ey * s, ez * s);
                this.mesh.add(ear);
            });
            // Eyes
            [[-0.2, 1.35, 1.6], [0.2, 1.35, 1.6]].forEach(([ex, ey, ez]) => {
                const eye = new THREE.Mesh(new THREE.SphereGeometry(0.07 * s, 4, 4), eyeMat);
                eye.position.set(ex * s, ey * s, ez * s);
                this.mesh.add(eye);
            });

            // Legs — 4 legs
            [[0.35, 0.7], [-0.35, 0.7], [0.3, -0.6], [-0.3, -0.6]].forEach(([ox, oz]) => {
                const leg = new THREE.Mesh(new THREE.BoxGeometry(0.2 * s, 0.8 * s, 0.2 * s), darkMat);
                leg.position.set(ox * s, 0.4 * s, oz * s);
                leg.castShadow = true;
                this.mesh.add(leg);
                // Paw
                const paw = new THREE.Mesh(new THREE.BoxGeometry(0.18 * s, 0.1 * s, 0.25 * s), lightMat);
                paw.position.set(ox * s, 0.02 * s, (oz + 0.05) * s);
                this.mesh.add(paw);
            });

            // Tail — angled upward
            const tail = new THREE.Mesh(new THREE.BoxGeometry(0.15 * s, 0.15 * s, 0.8 * s), mat);
            tail.position.set(0, 1.3 * s, -1.1 * s);
            tail.rotation.x = -0.5;
            this.mesh.add(tail);
            const tailTip = new THREE.Mesh(new THREE.BoxGeometry(0.12 * s, 0.12 * s, 0.3 * s), lightMat);
            tailTip.position.set(0, 1.55 * s, -1.45 * s);
            tailTip.rotation.x = -0.6;
            this.mesh.add(tailTip);

        } else if (this.mobType === 'golem') {
            // === GOLEM — massive rock creature with boulders for fists ===

            // Core body — large rough cube
            const body = new THREE.Mesh(new THREE.BoxGeometry(2.0 * s, 2.2 * s, 1.5 * s), mat);
            body.position.y = 2.0 * s;
            body.castShadow = true;
            this.mesh.add(body);

            // Rock plates on body (rough texture)
            const plateMat = new THREE.MeshStandardMaterial({ color: darkColor, roughness: 1.0, flatShading: true });
            [[0, 2.5, 0.8, 0.8, 0.6, 0.2], [0.6, 1.5, 0.5, 0.5, 0.8, 0.2], [-0.7, 2.0, 0.4, 0.6, 0.5, 0.15]].forEach(([px, py, pz, w, h, d]) => {
                const plate = new THREE.Mesh(new THREE.BoxGeometry(w * s, h * s, d * s), plateMat);
                plate.position.set(px * s, py * s, pz * s);
                plate.rotation.set(Math.random() * 0.2, Math.random() * 0.2, Math.random() * 0.2);
                this.mesh.add(plate);
            });

            // Head — small boulder on top
            const head = new THREE.Mesh(new THREE.IcosahedronGeometry(0.6 * s, 0), lightMat);
            head.position.set(0, 3.4 * s, 0.2 * s);
            head.castShadow = true;
            this.mesh.add(head);
            // Eyes — glowing cracks
            [[-0.2, 3.4, 0.55], [0.2, 3.4, 0.55]].forEach(([ex, ey, ez]) => {
                const eye = new THREE.Mesh(new THREE.SphereGeometry(0.12 * s, 4, 4), new THREE.MeshBasicMaterial({ color: 0xaa44ff }));
                eye.position.set(ex * s, ey * s, ez * s);
                this.mesh.add(eye);
            });
            // Glowing rune on chest
            const rune = new THREE.Mesh(new THREE.IcosahedronGeometry(0.2 * s, 0),
                new THREE.MeshStandardMaterial({ color: 0xaa44ff, emissive: 0xaa44ff, emissiveIntensity: 0.6, flatShading: true }));
            rune.position.set(0, 2.2 * s, 0.8 * s);
            this.mesh.add(rune);

            // Arms — massive boulder fists
            [[-1.4, 1.8], [1.4, 1.8]].forEach(([ox, oy]) => {
                // Upper arm
                const arm = new THREE.Mesh(new THREE.BoxGeometry(0.6 * s, 1.2 * s, 0.6 * s), darkMat);
                arm.position.set(ox * s, oy * s, 0);
                arm.castShadow = true;
                this.mesh.add(arm);
                // Fist — large boulder
                const fist = new THREE.Mesh(new THREE.IcosahedronGeometry(0.55 * s, 0), mat);
                fist.position.set(ox * s, (oy - 1.0) * s, 0);
                fist.castShadow = true;
                this.mesh.add(fist);
            });

            // Legs — thick stone pillars
            [[-0.55, 0.5], [0.55, 0.5]].forEach(([ox, oy]) => {
                const leg = new THREE.Mesh(new THREE.BoxGeometry(0.65 * s, 1.2 * s, 0.65 * s), darkMat);
                leg.position.set(ox * s, oy * s, 0);
                leg.castShadow = true;
                this.mesh.add(leg);
                // Foot
                const foot = new THREE.Mesh(new THREE.BoxGeometry(0.7 * s, 0.3 * s, 0.8 * s), mat);
                foot.position.set(ox * s, 0.05 * s, 0.1 * s);
                this.mesh.add(foot);
            });

            // Moss patches
            const mossMat = new THREE.MeshStandardMaterial({ color: 0x4a7a3a, flatShading: true });
            [[0.8, 2.8, 0.5], [-0.5, 1.2, 0.6], [0.3, 3.0, -0.5]].forEach(([mx, my, mz]) => {
                const moss = new THREE.Mesh(new THREE.IcosahedronGeometry(0.2 * s, 0), mossMat);
                moss.position.set(mx * s, my * s, mz * s);
                this.mesh.add(moss);
            });

        } else {
            // === RAPTOR — bipedal dinosaur with tail, claws, and crest ===

            // Body — horizontal torso
            const body = new THREE.Mesh(new THREE.BoxGeometry(0.7 * s, 0.8 * s, 1.6 * s), mat);
            body.position.set(0, 1.5 * s, 0);
            body.castShadow = true;
            this.mesh.add(body);

            // Belly — lighter underside
            const belly = new THREE.Mesh(new THREE.BoxGeometry(0.5 * s, 0.3 * s, 1.2 * s), lightMat);
            belly.position.set(0, 1.2 * s, 0);
            this.mesh.add(belly);

            // Neck — angled upward
            const neck = new THREE.Mesh(new THREE.BoxGeometry(0.35 * s, 0.7 * s, 0.35 * s), mat);
            neck.position.set(0, 2.1 * s, 0.7 * s);
            neck.rotation.x = 0.3;
            this.mesh.add(neck);

            // Head — angular with jaw
            const head = new THREE.Mesh(new THREE.BoxGeometry(0.45 * s, 0.4 * s, 0.7 * s), mat);
            head.position.set(0, 2.5 * s, 1.0 * s);
            head.castShadow = true;
            this.mesh.add(head);
            // Upper jaw ridge
            const ridge = new THREE.Mesh(new THREE.BoxGeometry(0.3 * s, 0.12 * s, 0.5 * s), darkMat);
            ridge.position.set(0, 2.7 * s, 1.1 * s);
            this.mesh.add(ridge);
            // Lower jaw
            const jaw = new THREE.Mesh(new THREE.BoxGeometry(0.35 * s, 0.15 * s, 0.55 * s), lightMat);
            jaw.position.set(0, 2.28 * s, 1.05 * s);
            this.mesh.add(jaw);
            // Teeth
            [[-0.1, 2.32, 1.35], [0.1, 2.32, 1.35], [0, 2.32, 1.38]].forEach(([tx, ty, tz]) => {
                const tooth = new THREE.Mesh(new THREE.ConeGeometry(0.03 * s, 0.1 * s, 3), boneMat);
                tooth.position.set(tx * s, ty * s, tz * s);
                tooth.rotation.x = Math.PI;
                this.mesh.add(tooth);
            });
            // Eyes
            [[-0.18, 2.55, 1.2], [0.18, 2.55, 1.2]].forEach(([ex, ey, ez]) => {
                const eye = new THREE.Mesh(new THREE.SphereGeometry(0.06 * s, 4, 4), eyeMat);
                eye.position.set(ex * s, ey * s, ez * s);
                this.mesh.add(eye);
            });
            // Head crest
            const crest = new THREE.Mesh(new THREE.ConeGeometry(0.08 * s, 0.35 * s, 4), darkMat);
            crest.position.set(0, 2.85 * s, 0.9 * s);
            this.mesh.add(crest);

            // Arms — small T-rex style with claws
            [[-0.45, 1.7, 0.5], [0.45, 1.7, 0.5]].forEach(([ax, ay, az]) => {
                const arm = new THREE.Mesh(new THREE.BoxGeometry(0.15 * s, 0.45 * s, 0.12 * s), mat);
                arm.position.set(ax * s, ay * s, az * s);
                this.mesh.add(arm);
                // Claw
                const claw = new THREE.Mesh(new THREE.ConeGeometry(0.05 * s, 0.15 * s, 3), boneMat);
                claw.position.set(ax * s, (ay - 0.28) * s, (az + 0.05) * s);
                claw.rotation.x = 0.3;
                this.mesh.add(claw);
            });

            // Legs — powerful digitigrade (bird-like)
            [[-0.3, 0.8], [0.3, 0.8]].forEach(([ox, oy]) => {
                // Thigh
                const thigh = new THREE.Mesh(new THREE.BoxGeometry(0.3 * s, 0.7 * s, 0.35 * s), mat);
                thigh.position.set(ox * s, oy * s, -0.1 * s);
                thigh.castShadow = true;
                this.mesh.add(thigh);
                // Shin — angled forward
                const shin = new THREE.Mesh(new THREE.BoxGeometry(0.2 * s, 0.65 * s, 0.2 * s), darkMat);
                shin.position.set(ox * s, 0.3 * s, 0.15 * s);
                this.mesh.add(shin);
                // Foot — 3 toes
                const foot = new THREE.Mesh(new THREE.BoxGeometry(0.35 * s, 0.08 * s, 0.5 * s), darkMat);
                foot.position.set(ox * s, 0.02 * s, 0.25 * s);
                this.mesh.add(foot);
                // Claw toe
                const toeClaw = new THREE.Mesh(new THREE.ConeGeometry(0.04 * s, 0.12 * s, 3), boneMat);
                toeClaw.rotation.x = Math.PI / 2;
                toeClaw.position.set(ox * s, 0.05 * s, 0.52 * s);
                this.mesh.add(toeClaw);
            });

            // Tail — long, tapered, balancing
            const tail1 = new THREE.Mesh(new THREE.BoxGeometry(0.3 * s, 0.35 * s, 0.8 * s), mat);
            tail1.position.set(0, 1.4 * s, -0.9 * s);
            this.mesh.add(tail1);
            const tail2 = new THREE.Mesh(new THREE.BoxGeometry(0.2 * s, 0.25 * s, 0.7 * s), darkMat);
            tail2.position.set(0, 1.35 * s, -1.55 * s);
            this.mesh.add(tail2);
            const tailTip = new THREE.Mesh(new THREE.BoxGeometry(0.12 * s, 0.15 * s, 0.4 * s), lightMat);
            tailTip.position.set(0, 1.3 * s, -2.05 * s);
            this.mesh.add(tailTip);

            // Dorsal spines
            [[-0.3, 0.5], [0, 0], [0.2, -0.3]].forEach(([oz, idx]) => {
                const spine = new THREE.Mesh(new THREE.ConeGeometry(0.05 * s, 0.25 * s, 4), darkMat);
                spine.position.set(0, 2.0 * s, oz * s);
                this.mesh.add(spine);
            });
        }

        // --- Health Bar (all types) ---
        const hpW = (this.mobType === 'golem' ? 2.8 : 2.0) * s;
        const hpY = (this.mobType === 'golem' ? 4.2 : this.mobType === 'raptor' ? 3.2 : 2.0) * s;
        const hpBgGeo = new THREE.PlaneGeometry(hpW, 0.2);
        const hpBgMat = new THREE.MeshBasicMaterial({ color: 0x000000 });
        this.healthBarBG = new THREE.Mesh(hpBgGeo, hpBgMat);
        this.healthBarBG.position.y = hpY;
        this.mesh.add(this.healthBarBG);

        const hpFgGeo = new THREE.PlaneGeometry(hpW, 0.2);
        const hpFgMat = new THREE.MeshBasicMaterial({ color: 0xffff00 });
        this.healthBar = new THREE.Mesh(hpFgGeo, hpFgMat);
        this.healthBar.position.y = hpY;
        this.healthBar.position.z = 0.01;
        this.mesh.add(this.healthBar);

        this.hpBarHalfWidth = hpW / 2;
    }

    /**
     * Updates the jungle mob (handles respawn timer when dead).
     */
    update(deltaTime) {
        if (this.alive) {
            // Billboard health bars toward camera
            this.healthBarBG.lookAt(
                this.mesh.position.x + 25,
                this.mesh.position.y + 27,
                this.mesh.position.z + 25
            );
            this.healthBar.lookAt(
                this.mesh.position.x + 25,
                this.mesh.position.y + 27,
                this.mesh.position.z + 25
            );
            return;
        }

        // Dead — count down to respawn
        this.respawnTimer -= deltaTime;
        if (this.respawnTimer <= 0) {
            this.respawn();
        }
    }

    takeDamage(amount) {
        if (!this.alive) return;

        const effective = amount * (100 / (100 + this.stats.armor));
        this.stats.currentHealth -= effective;

        if (this.stats.currentHealth <= 0) {
            this.stats.currentHealth = 0;
            this.die();
        }

        this.updateHealthBar();
    }

    updateHealthBar() {
        const pct = this.stats.currentHealth / this.stats.maxHealth;
        this.healthBar.scale.x = Math.max(pct, 0);
        this.healthBar.position.x = -this.hpBarHalfWidth * (1 - pct);

        if (pct < 0.3) {
            this.healthBar.material.color.setHex(0xff0000);
        } else if (pct < 0.6) {
            this.healthBar.material.color.setHex(0xffff00);
        } else {
            this.healthBar.material.color.setHex(0x00ff00);
        }
    }

    die() {
        this.alive = false;
        this.mesh.visible = false;
        this.respawnTimer = this.respawnTime;
    }

    respawn() {
        this.alive = true;
        this.stats.currentHealth = this.stats.maxHealth;
        this.mesh.visible = true;
        this.mesh.position.copy(this.spawnPosition);
        this.updateHealthBar();
    }
}
