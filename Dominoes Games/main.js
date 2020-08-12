
var initScene, render, renderer, scene, camera, world;
let plane = {}, controls;
var origins = [], walls = [];
var timeStep = 1 / 60;

window.onload = initScene();

function initScene() {

    world = new CANNON.World();
    world.gravity.set(0, 0, -320);
    world.broadphase = new CANNON.NaiveBroadphase();
    world.solver.iterations = 10;
    world.allowSleep = true;


    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true; //Here is to tell renderer that we need shadows.
    document.getElementById('viewport').appendChild(renderer.domElement);

    scene = new THREE.Scene;

    camera = new THREE.PerspectiveCamera(
        45,
        window.innerWidth / window.innerHeight,
        1,
        5000
    );
    camera.position.set(140, -30, 60);
    // camera.position.set(0, -18, 20);
    camera.up.set(0, 0, 1);
    camera.lookAt(scene.position);
    scene.add(camera);

    //Add a light source
    let ambientLight = new THREE.AmbientLight(0x404040, 0.4); // soft white light
    let light = new THREE.PointLight(0xffffff, 1);
    light.position.set(-150, 160, 150);
    light.shadow.mapSize.height = 1024;
    light.shadow.mapSize.width = 1024;
    light.castShadow = true;
    scene.add(ambientLight);
    scene.add(light);

    // Physics Material
    let m01 = new CANNON.Material({
        friction: 0.04,
        restitution: 0.2,
    });
    let m02 = new CANNON.Material({
        friction: 0.06,
        restitution: 0.8,
    });

    let m01_m02 = new CANNON.ContactMaterial(m01, m01, {
        friction: 0.3,
        restitution: 0.2,
    });

    // world.addContactMaterial(m01_m02);


    //plane
    plane.body = new CANNON.Body({
        mass: 0,
        shape: new CANNON.Box(new CANNON.Vec3(100, 100, 0.5)),
        material: m01,
    });
    var ground_material = new THREE.MeshPhongMaterial({
        color: 0xffffff
    });
    plane.mesh = addVisual(plane.body, ground_material);
    plane.body.position.z = -0.5;
    world.addBody(plane.body);


    //add wall
    var radius = 50;
    var angle = 0;

    for (var i = 0; i < 36; i++) {
        var wall = {};

        wall.body = new CANNON.Body({
            mass: 2,
            shape: new CANNON.Box(new CANNON.Vec3(3, 1, 6)),
            material: m02,
        });
        wall.body.sleep();
        wall.body.position.x = radius * Math.cos(angle);
        wall.body.position.y = radius * Math.sin(angle);
        wall.body.position.z = 6;
        wall.body.quaternion.setFromAxisAngle(new CANNON.Vec3(0, 0, 1), angle);
        wall.mesh = addVisual(wall.body);
        world.addBody(wall.body);
        walls.push(wall);

        let origin = {}
        origin.position = new CANNON.Vec3();
        origin.quaternion = new CANNON.Quaternion();
        origin.position.copy(wall.body.position);
        origin.quaternion.copy(wall.body.quaternion);
        origins.push(origin);

        angle += Math.PI / 18;
    }

    var axesHelper = new THREE.AxesHelper(200);
    scene.add(axesHelper);

    //controller
    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxPolarAngle = 1.5;
    controls.update();

    //EventListener
    function handleClick(e) {
        console.log("Clicked!");
        // applyImpulse
        walls[0].body.wakeUp();
        walls[0].body.applyImpulse(new CANNON.Vec3(0, 80, 0), walls[0].body.position);
    }

    function handleReset() {
        console.log(origins)
        for (let i = 0; i < walls.length; i++) {
            // 复制源位置和源四元数值
            walls[i].body.position.copy(origins[i].position)
            walls[i].body.quaternion.copy(origins[i].quaternion);
            walls[i].body.sleep();
        }
    }

    document.getElementById('start').addEventListener('click', handleClick);
    document.getElementById('reset').addEventListener('click', handleReset);

    /*
     * Events to fire upon window resizing.
    */
    window.addEventListener("resize", onWindowResize, false);
    function onWindowResize() {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    }

    render();
};

function updatePhysics() {
    world.step(timeStep);

    plane.mesh.position.copy(plane.body.position);
    plane.mesh.quaternion.copy(plane.body.quaternion);

    for (let i = 0; i < walls.length; i++) {
        walls[i].mesh.position.copy(walls[i].body.position);
        walls[i].mesh.quaternion.copy(walls[i].body.quaternion);
    }
}

function render() {
    updatePhysics();

    controls.update();

    renderer.render(scene, camera); // render the scene
    requestAnimationFrame(render);
};

function addVisual(body, material) {

    // Materials
    var material = material || new THREE.MeshPhongMaterial({
        color: 0xff0000
    });

    let shape = body.shapes[0];
    let box_geometry = new THREE.BoxGeometry(shape.halfExtents.x * 2, shape.halfExtents.y * 2, shape.halfExtents.z * 2);
    let mesh = new THREE.Mesh(box_geometry, material);

    mesh.receiveShadow = true;
    mesh.castShadow = true;

    scene.add(mesh);

    return mesh;
}


