var scene, camera, renderer, light, redMesh, boxMesh, chassisMesh, wheelMeshes;
var timeStep, redBody, chassisBody, wheelBodies;

timeStep = 1 / 60;
wheelMeshes = [];
wheelBodies = [];

var boxMeshes, boxBodies;
boxMeshes = [];
boxBodies = [];

init();
render();

function init() {
    
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf0f0f0);

    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 1000);
    camera.position.set(-18, 0, 20);
    camera.rotation.order = "ZXY";
    camera.rotation.x = Math.PI * 0.5;
    camera.rotation.y = Math.PI * 0.5;
    camera.up.set(0, 0, 1);
    scene.add(camera);

    light = new THREE.PointLight(0xFFFFFF, 1);
    light.castShadow = true;
    light.shadow.mapSize.width = 1024;
    light.shadow.mapSize.height = 1024;
    light.position.set(10, 10, 130)
    scene.add(light);

    renderer = new THREE.WebGLRenderer();
    renderer.shadowMap.enabled = true;
    renderer.setSize(window.innerWidth, window.innerHeight);

    document.body.appendChild(renderer.domElement);

    // controls = new THREE.OrbitControls(camera, renderer.domElement);
    // controls.update();

    world = new CANNON.World();
    world.gravity.set(0, 0, -10);
    world.broadphase = new CANNON.NaiveBroadphase();
    world.solver.iterations = 10;
    world.defaultContactMaterial.friction = 5;
    console.log(world);

    {
        const geometry = new THREE.BoxGeometry(4, 4, 4);
        const material = new THREE.MeshLambertMaterial({
            color: 0xff0000
        });
        redMesh = new THREE.Mesh(geometry, material);
        redMesh.castShadow = true;
        scene.add(redMesh);

        var redShape = new CANNON.Box(new CANNON.Vec3(2, 2, 2));
        redBody = new CANNON.Body({ mass: 1 });
        redBody.addShape(redShape);
        redBody.position.set(10, 10, 10);
        world.addBody(redBody);
    }

    {
        for (var i = 0; i <= 30; i++) {
            var boxBody = new CANNON.Body({
                mass: 50,
                shape: new CANNON.Box(new CANNON.Vec3(2, 3, 2)),
            });
            boxBody.position.set(400 * Math.random() - 200, 400 * Math.random() - 200, 10);
            world.addBody(boxBody);
            boxBodies.push(boxBody);
            var boxMesh = addVisual(boxBody, new THREE.MeshLambertMaterial({ color: 0xff0000 }));
            scene.add(boxMesh);
            boxMeshes.push(boxMesh);
        }
    }

    {
        var groundMaterial = new CANNON.Material("groundMaterial"); // 地面材质
        var wheelMaterial = new CANNON.Material("wheelMaterial");   // 车轮材质
        var wheelGroundContactMaterial = window.wheelGroundContactMaterial = new CANNON.ContactMaterial(wheelMaterial, groundMaterial, {
            friction: 0.3,
            restitution: 0,
            contactEquationStiffness: 1000
        });     // 接触处理

        // We must add the contact materials to the world
        world.addContactMaterial(wheelGroundContactMaterial);
    }

    {

        // 车架
        chassisBody = new CANNON.Body({
            mass: 1500,
            shape: new CANNON.Box(new CANNON.Vec3(4, 2, 1)),
        });
        chassisBody.position.set(0, 0, 10);
        chassisMesh = addVisual(chassisBody, new THREE.MeshLambertMaterial({ color: 0xf88b3e }));
        scene.add(chassisMesh);
        console.log(chassisMesh);

        chassisMesh.worldToLocal(camera.position);

        // 车轮参数
        var options = {
            radius: 1,
            directionLocal: new CANNON.Vec3(0, 0, -1),
            suspensionStiffness: 30,
            suspensionRestLength: 1,
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

        // Create the vehicle
        vehicle = new CANNON.RaycastVehicle({
            chassisBody: chassisBody,
        });

        options.chassisConnectionPointLocal.set(2, 2, 0);
        vehicle.addWheel(options);

        options.chassisConnectionPointLocal.set(2, -2, 0);
        vehicle.addWheel(options);

        options.chassisConnectionPointLocal.set(-2, 2, 0);
        vehicle.addWheel(options);

        options.chassisConnectionPointLocal.set(-2, -2, 0);
        vehicle.addWheel(options);

        vehicle.addToWorld(world);

        // 车轮mesh
        for (var i = 0; i < vehicle.wheelInfos.length; i++) {
            var wheel = vehicle.wheelInfos[i];  // 轮子参数
            var cylinderShape = new CANNON.Cylinder(wheel.radius, wheel.radius, wheel.radius / 2, 20);
            var wheelBody = new CANNON.Body({
                mass: 0,
                shape: cylinderShape,
            });
            // wheelBody.quaternion.setFromAxisAngle(new CANNON.Vec3(0, 1, 0), Math.PI / 2);
            wheelBody.type = CANNON.Body.KINEMATIC;    // 运动
            wheelBody.collisionFilterGroup = 0; // turn off collisions  碰撞过滤器组
            var q = new CANNON.Quaternion();
            q.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), Math.PI / 2);
            wheelBody.addShape(cylinderShape, new CANNON.Vec3(), q);
            wheelBodies.push(wheelBody);

            var wheelMesh = addVisual(wheelBody);
            wheelMeshes.push(wheelMesh);
            scene.add(wheelMesh);
            console.log(wheelMesh);

            world.addBody(wheelBody);
        }

        // Update wheels
        world.addEventListener('postStep', function () {
            for (var i = 0; i < vehicle.wheelInfos.length; i++) {
                vehicle.updateWheelTransform(i);
                var t = vehicle.wheelInfos[i].worldTransform;
                var wheelBody = wheelBodies[i];
                wheelBody.position.copy(t.position);
                wheelBody.quaternion.copy(t.quaternion);
            }
        });


        // plane
        planeBody = new CANNON.Body({
            mass: 0,
            shape: new CANNON.Box(new CANNON.Vec3(200, 200, 0.5)),
        });
        planeBody.position.set(0, 0, 0);
        world.addBody(planeBody);

        plane = addVisual(planeBody, new THREE.MeshLambertMaterial({ color: 0xefefef }));
        scene.add(plane);
    }

    // 事件处理
    document.onkeydown = handler;
    document.onkeyup = handler;

    var maxSteerVal = 0.5;
    var maxForce = 6000;
    var brakeForce = 100;
    function handler(event) {
        var up = (event.type == 'keyup');

        if (!up && event.type !== 'keydown') {
            return;
        }

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
}

function render() {
    requestAnimationFrame(render);
    renderer.render(scene, camera);

    updatePhysics();
    updateCam();
}

var pos;
function updatePhysics() {
    world.step(timeStep); // Copy coordinates from Cannon.js to Three.js

    chassisMesh.position.copy(chassisBody.position);
    chassisMesh.quaternion.copy(chassisBody.quaternion);
    // console.log(chassisMesh.rotation.z*180/Math.PI);

    for (var i = 0; i < wheelMeshes.length; i++) {
        wheelMeshes[i].position.copy(wheelBodies[i].position);
        wheelMeshes[i].quaternion.copy(wheelBodies[i].quaternion);
    }

    for (var i = 0; i < boxBodies.length; i++) {
        boxMeshes[i].position.copy(boxBodies[i].position);
        boxMeshes[i].quaternion.copy(boxBodies[i].quaternion);
    }

    redMesh.position.copy(redBody.position);
    redMesh.quaternion.copy(redBody.quaternion);
    // if (pos)
    //     camera.position.copy(pos);
    // pos = chassisMesh.position.add(chassisMesh.worldToLocal(camera.position));
    // console.log(pos);

    // camera.position.x = chassisMesh.position.x;
    // camera.position.y = chassisMesh.position.y+8;
    // camera.position.z = chassisMesh.position.z+5;
    // camera.lookAt(chassisMesh.position);

}

function updateCam() {
    camera.lookAt(chassisMesh.position);

    camera.position.x = chassisMesh.position.x + 15;
    camera.position.y = chassisMesh.position.y - 15;
    camera.position.z = chassisMesh.position.z + 20;

    // var r = chassisMesh.rotation.z;
    // camera.rotation.z = r + Math.PI;

    // var s = Math.sin(r + Math.PI);
    // var c = Math.cos(r + Math.PI);

    // camera.position.x = chassisMesh.position.x + 20 * c;
    // camera.position.y = chassisMesh.position.y + 20 * s;
    // camera.position.z = chassisMesh.position.z + 5;
}

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