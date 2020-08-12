/**
 * Car
 */

class Car {
    constructor(_scene, _world) {
        // console.log(this);

        this.scene = _scene;
        this.world = _world;

        this.model = null;
        this.position = null;

        this.camera = new THREE.PerspectiveCamera(
            45,
            window.innerWidth / window.innerHeight,
            0.1,
            5000
        );

        this.vehicle = null;
        this.wheelMeshes = [];
        this.wheelBodies = [];

        this.chassisMesh = null;
        this.chassisBody = null;

        this.options = {
            radius: 0.47,
            directionLocal: new CANNON.Vec3(0, 0, -1),
            suspensionStiffness: 80,
            suspensionRestLength: 0.2,
            frictionSlip: 5,
            dampingRelaxation: 2.3,
            dampingCompression: 4.4,
            maxSuspensionForce: 100000,
            rollInfluence: 0.01,
            axleLocal: new CANNON.Vec3(0, 1, 0),    // 车轴
            chassisConnectionPointLocal: new CANNON.Vec3(1, 1, 0),
            maxSuspensionTravel: 0.3,
            customSlidingRotationalSpeed: -30,
            useCustomSlidingRotationalSpeed: true
        };

        // this.ctrls = new CarControl(this);

        this.init();
    }

    init() {
        // console.log(this.world);
        /**
         * Chassis 车架
         */
        objLoader.load("./assert/car-x.obj", (obj) => {
            // console.log(obj);
            this.scene.add(obj);

            this.model = obj;

            this.chassisMesh = obj.children[0];
            this.chassisMesh.material = new THREE.MeshPhongMaterial({
                color: 0x636D5A
            });
            this.chassisMesh.castShadow = true;

            let wheelMaterial = new THREE.MeshPhongMaterial({
                color: 0xffffff,
                map: textureLoader.load("assert/wheel_diff.png"),
                normalMap: textureLoader.load("assert/wheel_normal.png")
            });

            for (let i = 1; i <= 4; i++) {
                let wheelMesh = obj.children[i];
                wheelMesh.material = wheelMaterial;
                // let wheelMesh = addVisual(wheelBody);
                this.wheelMeshes.push(wheelMesh);
            }
        });

        this.chassisBody = new CANNON.Body({
            mass: 1500,
            shape: new CANNON.Box(new CANNON.Vec3(1.8, 0.85, 0.7))
        });
        this.position = this.chassisBody.position
        this.position.set(0, 0, 10);
        this.chassisBody.quaternion.setFromAxisAngle(new CANNON.Vec3(0, 0, 1), Math.PI / 2);

        this.vehicle = new CANNON.RaycastVehicle({
            chassisBody: this.chassisBody,
        });

        /** 
         * Wheels 车轮
         */

        // FL
        this.options.chassisConnectionPointLocal.set(1.3, 0.88, -0.64);
        this.vehicle.addWheel(this.options);

        // FR
        this.options.chassisConnectionPointLocal.set(1.3, -0.88, -0.64); // 设置锚点位置
        this.vehicle.addWheel(this.options);

        // RL
        this.options.chassisConnectionPointLocal.set(-1.126, 0.88, -0.64);
        this.vehicle.addWheel(this.options);

        // RR
        this.options.chassisConnectionPointLocal.set(-1.126, -0.88, -0.64);
        this.vehicle.addWheel(this.options);

        this.vehicle.addToWorld(this.world);

        for (let i = 0; i < this.vehicle.wheelInfos.length; i++) {
            let wheel = this.vehicle.wheelInfos[i];
            let cylinderShape = new CANNON.Cylinder(wheel.radius, wheel.radius, 0.36, 30);
            let wheelBody = new CANNON.Body({
                mass: 0
            });
            wheelBody.type = CANNON.Body.KINEMATIC;    // 运动
            wheelBody.collisionFilterGroup = 0; // turn off collisions  碰撞过滤器组

            let q = new CANNON.Quaternion();
            q.setFromAxisAngle(new CANNON.Vec3(0, 1, 0), Math.PI / 2);
            wheelBody.addShape(cylinderShape, new CANNON.Vec3(), q);

            this.world.addBody(wheelBody);
            this.wheelBodies.push(wheelBody);
        }

    }

    reset(p) {
        var body = this.chassisBody;
        var rz = 0;
        if (p) {
            body.position.set(p.x, p.y, 4.0);
            rz = -0.5 * Math.PI;  // kind of a magic number here... should allow caller to pass rotation
        }
        else {
            body.position.set(body.position.x, body.position.y, body.position.z + 4.0);
            // body.position.set(-60, 60, 4.0);
            rz = this.chassisMesh.rotation.z;
        }
        body.velocity.set(0, 0, 0);
        body.angularVelocity.set(0, 0, 0);
        body.quaternion.setFromAxisAngle(new CANNON.Vec3(0, 0, 1), rz);

        let newPosition = this.chassisMesh.localToWorld(new THREE.Vector3(-8, 0, 3));
        this.camera.position.set(newPosition.x, newPosition.y, this.chassisMesh.position.z + 3);

    }

    update() {
        if (this.chassisBody.velocity.length() == 0) {
            ground.stop();
        } else {
            if (!ground.playing()) {
                // ground.play();
            };
        }
        // this.ctrls.update();

        for (let i = 0; i < this.vehicle.wheelInfos.length; i++) {
            this.vehicle.updateWheelTransform(i);
            // Update one of the wheel transform. 
            // Note when rendering wheels: during each step, wheel 
            // transforms are updated BEFORE the chassis; ie. their 
            // position becomes invalid after the step. Thus when you 
            // render wheels, you must update wheel transforms before 
            // rendering them. See raycastVehicle demo for an example.
            let t = this.vehicle.wheelInfos[i].worldTransform;
            let wheelBody = this.wheelBodies[i];
            wheelBody.position.copy(t.position);
            wheelBody.quaternion.copy(t.quaternion);
        }

        if (!this.model) {
            return;
        }

        let newPosition = this.chassisMesh.localToWorld(new THREE.Vector3(-8, 0, 3));
        this.camera.position.lerp(new THREE.Vector3(newPosition.x, newPosition.y, this.chassisMesh.position.z + 3), 0.2);
        this.camera.up.set(0, 0, 1);
        this.camera.lookAt(this.chassisMesh.position.add(new THREE.Vector3(0, 0, 1)));

        this.chassisMesh.position.copy(this.chassisBody.position);
        this.chassisMesh.quaternion.copy(this.chassisBody.quaternion);

        for (let i = 0; i < this.wheelMeshes.length; i++) {
            this.wheelMeshes[i].position.copy(this.wheelBodies[i].position);
            this.wheelMeshes[i].quaternion.copy(this.wheelBodies[i].quaternion);
        }
    }
}

