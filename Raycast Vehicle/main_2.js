let container, scene, camera, renderer, controls, sphere, sphereBody;

// const fbxLoader = new THREE.FBXLoader();
// const gltfLoader = new THREE.GLTFLoader();
const objLoader = new THREE.OBJLoader();
const textureLoader = new THREE.TextureLoader();

let clock = new THREE.Clock();
const timeStep = 1 / 60;

let gui;
let params = {
    color: 0xffffff,
    scale: -1.0,
    bias: 1.0,
    power: 2.0
};

function addVisual(body, material) {
    var obj = new THREE.Object3D();
    var material = material || new THREE.MeshLambertMaterial({ color: 0xff0000 });

    // var materialChassis = new THREE.MeshLambertMaterial({ color: 0xff0000 });
    // var materialWheel = new THREE.MeshLambertMaterial({ color: 0xff0000 });
    // var materialPlane = new THREE.MeshLambertMaterial({ color: 0xffffff });

    for (var l = 0; l < body.shapes.length; l++) {
        var shape = body.shapes[l];

        switch (shape.type) {
            case CANNON.Shape.types.CONVEXPOLYHEDRON:
                var cylinder_geometry = new THREE.CylinderGeometry(1, 1, 0.5, 20);
                mesh = new THREE.Mesh(cylinder_geometry, material);
                console.log("cylinder");
                break;

            case CANNON.Shape.types.BOX:
                var box_geometry = new THREE.BoxGeometry(shape.halfExtents.x * 2,
                    shape.halfExtents.y * 2,
                    shape.halfExtents.z * 2);
                mesh = new THREE.Mesh(box_geometry, material);
                console.log("box");
                break;

        }

        mesh.receiveShadow = true;
        mesh.castShadow = true;

        // scene.add(mesh);
        obj.add(mesh);
    }
    return obj;
}

init();

function init() {
    // initGUI();
    initBase();
    initObject();
}

function initGUI() {
    gui = new dat.GUI();
    gui.addColor(params, "color");
    gui.add(params, "scale", -2, 0);
    gui.add(params, "bias", 0, 5);
    gui.add(params, "power", -10, 10);

    let controller = gui.add(fizzyText, 'maxSize', 0, 10);

    controller.onChange(function (value) {
        // Fires on every change, drag, keypress, etc.
    });

    controller.onFinishChange(function (value) {
        // Fires when a controller loses focus.
        alert("The new value is " + value);
    });
}

function initBase() {
    container = document.getElementById("canvas");

    // WORLD
    world = new CANNON.World();
    world.gravity.set(0, 0, -20);
    world.broadphase = new CANNON.NaiveBroadphase();
    world.solver.iterations = 10;
    world.defaultContactMaterial.friction = 5;

    // SCENE
    scene = new THREE.Scene();

    let axesHelper = new THREE.AxesHelper(20);
    scene.add(axesHelper);

    // CAMERA
    camera = new THREE.PerspectiveCamera(
        45,
        window.innerWidth / window.innerHeight,
        0.1,
        5000
    );

    camera.position.set(0, -40, 25);
    camera.up.set(0, 0, 1);
    camera.lookAt(scene.position);

    // RENDERER
    renderer = new THREE.WebGLRenderer(/*{ antialias: true }*/);
    renderer.setSize(window.innerWidth, window.innerHeight);
    container.appendChild(renderer.domElement);
    renderer.sortObjects = false;
    // renderer.shadowMap.enabled = true;

    //添加光源
    const pointLight = new THREE.PointLight(0xffffff),
        ambientLight = new THREE.AmbientLight(0xffffff, 0.4);

    pointLight.position.set(50, 55, 50); //设置位置
    pointLight.castShadow = true;
    scene.add(pointLight);
    scene.add(ambientLight);

    // CONTROLS
    controls = new THREE.OrbitControls(camera, renderer.domElement);

	/*
	 * Events to fire upon window resizing.
	 */
    window.addEventListener("resize", onWindowResize, false);
    function onWindowResize() {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    }
}

function initObject() {

    // PLANE
    const texture = new THREE.TextureLoader().load("assert/Landscape.png");
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(50, 50);
    const plane = new THREE.Mesh(
        new THREE.BoxGeometry(1000, 1000, 2),
        new THREE.MeshLambertMaterial({
            color: 0xffffff,
            map: texture,
            // side: THREE.DoubleSide
        })
    );
    plane.receiveShadow = true;
    scene.add(plane);

    planeBody = new CANNON.Body({
        mass: 0,
        shape: new CANNON.Box(new CANNON.Vec3(500, 500, 1))
    });
    planeBody.position.set(0, 0, -1);
    plane.position.copy(planeBody.position);
    world.addBody(planeBody);

    let slopeBody = new CANNON.Body({
        mass: 0,
        shape: new CANNON.Box(new CANNON.Vec3(20, 20, 0.5)),
    });
    slopeBody.position.set(30, 0, 3);
    slopeBody.quaternion.setFromAxisAngle(new CANNON.Vec3(0, 1, 0), -Math.PI / 12);
    world.addBody(slopeBody);

    const slopeMesh = addVisual(slopeBody, new THREE.MeshLambertMaterial({ color: 0xefefef }));
    scene.add(slopeMesh);

    console.log(slopeBody, slopeMesh);

    // CAR
    let chassis = {
        mesh: null,
        body: null
    };
    let wheelMeshes = [],
        wheelBodies = [];
    let vehicle;

    let meshes = [];

    objLoader.load("assert/car-x.obj", createCar);
    function createCar(obj) {
        console.log(obj);
        scene.add(obj);

        chassis.mesh = obj.children[0];
        chassis.mesh.material = new THREE.MeshLambertMaterial({
            color: 0xffffff
        })
        chassis.mesh.castShadow = true;

        chassis.body = new CANNON.Body({
            mass: 1500,
            shape: new CANNON.Box(new CANNON.Vec3(0.85, 1.9, 0.7))
        });
        chassis.body.position.set(0, 0, 10);
        world.addBody(chassis.body);


        // 车轮参数
        let options = {
            radius: 0.47,
            directionLocal: new CANNON.Vec3(0, 0, -1),  // 投射方向
            suspensionStiffness: 30,
            suspensionRestLength: 1,
            frictionSlip: 5,
            dampingRelaxation: 2.3,
            dampingCompression: 4.4,
            maxSuspensionForce: 100000,
            rollInfluence: 0.01,
            axleLocal: new CANNON.Vec3(0, 1, 0),
            chassisConnectionPointLocal: new CANNON.Vec3(1, 1, 1),
            maxSuspensionTravel: 0.3,
            customSlidingRotationalSpeed: -30,
            useCustomSlidingRotationalSpeed: true
        };

        // Create the vehicle = chassis + 射线
        vehicle = new CANNON.RaycastVehicle({
            chassisBody: chassis.body,
            // indexRightAxis: 0,
            // indexUpAxis: 1,
            // indexForwardAxis: 2
        });

        // FL
        options.chassisConnectionPointLocal.set(1.3, 0.81, 0.2);
        vehicle.addWheel(options);

        // FR
        options.chassisConnectionPointLocal.set(1.3, -0.81, 0.2); // 设置锚点位置
        vehicle.addWheel(options);

        // RL
        options.chassisConnectionPointLocal.set(-1.126, 0.81, 0.2);
        vehicle.addWheel(options);

        // RR
        options.chassisConnectionPointLocal.set(-1.126, -0.81, 0.2);
        vehicle.addWheel(options);

        vehicle.addToWorld(world);

        // var wheelBodies = [];
        for (var i = 0; i < vehicle.wheelInfos.length; i++) {
            var wheel = vehicle.wheelInfos[i];
            var cylinderShape = new CANNON.Cylinder(wheel.radius, wheel.radius, 0.36, 30);
            var wheelBody = new CANNON.Body({
                mass: 0
            });
            wheelBody.type = CANNON.Body.KINEMATIC;    // 运动
            wheelBody.collisionFilterGroup = 0; // turn off collisions  碰撞过滤器组


            let q = new CANNON.Quaternion();
            q.setFromAxisAngle(new CANNON.Vec3(0, 1, 0), Math.PI / 2);
            wheelBody.addShape(cylinderShape, new CANNON.Vec3(), q);


            // world.addBody(wheelBody);
            wheelBodies.push(wheelBody);

            let wheelMesh = obj.children[i + 1];
            wheelMeshes.push(wheelMesh);

        }

        // Update wheels
        world.addEventListener('postStep', function () {
            for (var i = 0; i < vehicle.wheelInfos.length; i++) {
                vehicle.updateWheelTransform(i);
                // Update one of the wheel transform. Note when rendering wheels: during each step, wheel transforms are updated BEFORE the chassis; ie. their position becomes invalid after the step. Thus when you render wheels, you must update wheel transforms before rendering them. See raycastVehicle demo for an example.
                var t = vehicle.wheelInfos[i].worldTransform;
                var wheelBody = wheelBodies[i];
                wheelBody.position.copy(t.position);
                wheelBody.quaternion.copy(t.quaternion);

                wheelMeshes[i].position.copy(wheelBodies[i].position);
                wheelMeshes[i].quaternion.copy(wheelBodies[i].quaternion);
            }
        });

        // sphere = new THREE.Mesh(
        //     new THREE.CylinderGeometry(0.47, 0.47, 0.36, 30),
        //     new THREE.MeshLambertMaterial({ color: 0xff0000 })
        // );
        // scene.add(sphere);

        // sphereBody = new CANNON.Body({
        //     mass: 0,
        //     shape: new CANNON.Cylinder(2, 2, 0.5, 30)
        // });
        // sphereBody.position.set(5, 0, 10);
        // world.addBody(sphereBody);

        // let keyControl = new Control(player.body);

        document.addEventListener('keydown', handler);
        document.addEventListener('keyup', handler);
    }

    let engineForce = 300;
    let airForce = 100;

    let maxSteerVal = 0.5;
    let maxForce = 6000;
    let brakeForce = 100;

    function handler(event) {
        let down = (event.type !== 'keydown');
        let up = (event.type == 'keyup');

        // console.log(event.keyCode);

        // if (!up || !down) {
        //     return;
        // }

        vehicle.setBrake(0, 0);
        vehicle.setBrake(0, 1);
        vehicle.setBrake(0, 2);
        vehicle.setBrake(0, 3);

        switch (event.keyCode) {

            case 87: // forward
                vehicle.applyEngineForce(up ? 0 : -maxForce, 2);
                vehicle.applyEngineForce(up ? 0 : -maxForce, 3);
                break;

            case 83: // backward
                vehicle.applyEngineForce(up ? 0 : maxForce, 2);
                vehicle.applyEngineForce(up ? 0 : maxForce, 3);
                break;

            case 66: // b
                // vehicle.setBrake(brakeForce, 0);
                // vehicle.setBrake(brakeForce, 1);
                vehicle.setBrake(brakeForce, 2);
                vehicle.setBrake(brakeForce, 3);
                console.log("brake");
                break;

            case 65: // right
                vehicle.setSteeringValue(up ? 0 : maxSteerVal, 0);
                vehicle.setSteeringValue(up ? 0 : maxSteerVal, 1);
                break;

            case 68: // left
                vehicle.setSteeringValue(up ? 0 : -maxSteerVal, 0);
                vehicle.setSteeringValue(up ? 0 : -maxSteerVal, 1);
                break;

        }
    }


    function render() {
        world.step(timeStep);

        if (chassis.mesh) {
            chassis.mesh.position.copy(chassis.body.position);
            chassis.mesh.quaternion.copy(chassis.body.quaternion);



            for (let i = 0; i < wheelMeshes.length; i++) {
                wheelMeshes[i].position.copy(wheelBodies[i].position);
                wheelMeshes[i].quaternion.copy(wheelBodies[i].quaternion);

            }
        }


        requestAnimationFrame(render);
        renderer.render(scene, camera);
    }

    render();
}


