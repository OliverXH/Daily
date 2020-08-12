let container, scene, mainCamera, followCamera, renderer, controls;

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

    var controller = gui.add(fizzyText, 'maxSize', 0, 10);

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
    world.gravity.set(0, 0, 0);
    world.broadphase = new CANNON.NaiveBroadphase();
    world.solver.iterations = 10;
    world.defaultContactMaterial.friction = 5;

    // SCENE
    scene = new THREE.Scene();

    // CAMERA
    mainCamera = new THREE.PerspectiveCamera(
        45,
        window.innerWidth / window.innerHeight,
        0.1,
        5000
    );

    mainCamera.position.set(0, -40, 25);
    mainCamera.up.set(0, 0, 1);
    mainCamera.lookAt(scene.position);

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
    controls = new THREE.OrbitControls(mainCamera, renderer.domElement);

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
    world.addBody(planeBody);

    // PARTICLE
    const particleMesh = new THREE.Points(
        new THREE.SphereBufferGeometry(5, 30, 30),
        new THREE.PointsMaterial({ color: 0xffffff })
    );
    // scene.add(particleMesh);
    particleMesh.position.set(10, 0, 20);
    // console.log(particleMesh);

    // PLAYER
    let player = {
        mesh: null,
        body: null
    };
    objLoader.load("assert/Su47.obj", createPlayer);
    function createPlayer(obj) {

        console.log(obj);
        player.mesh = obj.children[0];
        player.mesh.material = new THREE.MeshPhongMaterial({
            color: 0xffffff,
            map: new THREE.TextureLoader().load("assert/Su47_Diffuse_hd.png"),
            normal: new THREE.TextureLoader().load("assert/Su47_Normal_hd.png")
        })
        player.mesh.castShadow = true;
        scene.add(obj);

        player.mesh.add(new THREE.AxesHelper(10))

        player.body = new CANNON.Body({
            mass: 10,
            shape: new CANNON.Box(new CANNON.Vec3(0.5, 2, 0.5))
        });
        player.body.position.set(0, 0, 10);
        world.addBody(player.body);

        player.body.linerDamping = 0.3;
        player.body.angularDamping = 0.5;

        // let keyControl = new Control(player.body);

        document.addEventListener('keydown', handler);
        document.addEventListener('keyup', handler);
    }

    followCamera = new THREE.PerspectiveCamera(
        45,
        window.innerWidth / window.innerHeight,
        0.1,
        5000
    );

    let engineForce = 300;
    let airForce = 100;

    function handler(event) {
        let down = (event.type !== 'keydown');
        let up = (event.type == 'keyup');

        // console.log(event.keyCode);

        // if (!up || !down) {
        //     return;
        // }

        switch (event.keyCode) {

            case 87: // forward
                console.log("87");
                // player.body.applyLocalForce(new CANNON.Vec3(0, 0, engineForce), new CANNON.Vec3(0, 0, 0));
                player.body.applyLocalForce(up ? new CANNON.Vec3(0, 0, 0) : new CANNON.Vec3(0, engineForce, 0), new CANNON.Vec3(0, 0, 0));
                break;

            case 83: // backward
                player.body.applyLocalForce(up ? new CANNON.Vec3(0, 0, 0) : new CANNON.Vec3(0, -engineForce, 0), new CANNON.Vec3(0, 0, 0));
                break;

            // case 65: // right
            case 68: // left
                player.body.applyLocalForce(up ? new CANNON.Vec3(0, 0, 0) : new CANNON.Vec3(0, 0, airForce), new CANNON.Vec3(-0.5, 0, 0));
                player.body.applyLocalForce(up ? new CANNON.Vec3(0, 0, 0) : new CANNON.Vec3(0, 0, -airForce), new CANNON.Vec3(0.5, 0, 0));
                break;

            // case 68: // left
            case 65: // right
                player.body.applyLocalForce(up ? new CANNON.Vec3(0, 0, 0) : new CANNON.Vec3(0, 0, -airForce), new CANNON.Vec3(-0.5, 0, 0));
                player.body.applyLocalForce(up ? new CANNON.Vec3(0, 0, 0) : new CANNON.Vec3(0, 0, airForce), new CANNON.Vec3(0.5, 0, 0));
                break;

        }
    }

    let camera = mainCamera;
    const button = document.getElementsByTagName('button')[0];
    button.onclick = () => {
        camera = camera == mainCamera ? followCamera : mainCamera;
    }

    let label = document.getElementById('speed');

    /*
	 * Events to fire upon window resizing.
	 */
    window.addEventListener("resize", onWindowResize, false);
    function onWindowResize() {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    }

    function render() {
        world.step(timeStep);

        if (player.mesh) {
            player.mesh.position.copy(player.body.position);
            player.mesh.quaternion.copy(player.body.quaternion);

            let newPosition = player.mesh.localToWorld(new THREE.Vector3(0, -2, 0.3));
            followCamera.position.lerp(new THREE.Vector3(newPosition.x, newPosition.y, player.mesh.position.z + 3), 1);
            followCamera.up.set(0, 0, 1);
            followCamera.lookAt(player.mesh.position.add(new THREE.Vector3(0, 0, 2)));

            label.innerHTML = `${Math.floor(player.body.velocity.y)}`;
        }


        requestAnimationFrame(render);
        renderer.render(scene, camera);
    }

    render();
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