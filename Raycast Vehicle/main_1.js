let container, scene, world, camera, renderer, controls, sphere, sphereBody;

var Signal = signals.Signal;
let boxes = [];
// const fbxLoader = new THREE.FBXLoader();
const gltfLoader = new THREE.GLTFLoader();
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

window.onload = init();

function init() {
    // initGUI();
    initUI();
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
    // theme.play();

    container = document.getElementById("canvas");

    // WORLD
    world = new CANNON.World();
    world.gravity.set(0, 0, -20);
    world.broadphase = new CANNON.NaiveBroadphase();
    world.solver.iterations = 10;
    world.defaultContactMaterial.friction = 5;
    // world.allowSleep = true;

    // SCENE
    scene = new THREE.Scene();

    // HELPER
    scene.add(new THREE.AxesHelper(20));
    let grid = new THREE.GridHelper(500, 25);
    grid.rotateX(Math.PI / 2);
    scene.add(grid);

    // CAMERA
    mainCamera = new THREE.PerspectiveCamera(
        45,
        window.innerWidth / window.innerHeight,
        0.1,
        5000
    );

    mainCamera.position.set(30, 60, 40);
    mainCamera.up.set(0, 0, 1);
    mainCamera.lookAt(scene.position);

    // RENDERER
    renderer = new THREE.WebGLRenderer(/*{ antialias: true }*/);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0xffffff);
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

    /**
     * Map created by plane
     */
    // PLANE
    let texture = new THREE.TextureLoader().load("assert/Landscape.png");
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(50, 50);
    const plane_meah = new THREE.Mesh(
        new THREE.PlaneGeometry(1000, 1000),
        new THREE.MeshLambertMaterial({
            color: 0xffffff,
            map: texture,
            // side: THREE.DoubleSide
        })
    );
    plane_meah.receiveShadow = true;
    scene.add(plane_meah);

    // planeBody = new CANNON.Body({
    //     mass: 0,
    //     shape: new CANNON.Box(new CANNON.Vec3(500, 500, 1))
    // });
    // planeBody.position.set(0, 0, -1);
    // plane.position.copy(planeBody.position);
    // world.addBody(planeBody);

    /**
     * Map created by height field map
     */
    // let img = new Image();
    // img.onload = function () {

    //     let map = new HeightFieldMap(img, 500);

    //     world.add(map.body);
    //     scene.add(map.mesh);

    //     console.log(scene);

    // };
    // img.src = './assert/heightfield.png';

    /**
     * Map created by obj model
     */
    texture = new THREE.TextureLoader().load("./assert/sand.jpg");
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(50, 50);

    // objLoader.load(
    //     "assert/landscape.obj",
    //     (obj) => {
    //         console.log(obj.children);
    //         obj.rotateX(Math.PI / 2);

    // obj.children[0].material = new THREE.MeshLambertMaterial({
    //     color: 0xFFFFFF,
    //     map: texture
    // });

    // scene.add(obj);
    //     }
    // );

    // let land = new Signal();
    // land.add((_geometry) => {
    //     let plane_shape = addBody(_geometry);
    //     let plane_1 = new CANNON.Body({
    //         mass: 0,
    //         shape: plane_shape
    //     });
    //     world.addBody(plane_1);
    // });


    gltfLoader.load(
        "assert/slope.glb",
        (glb) => {
            console.log(glb.scene.children);

            let land = glb.scene;

            scene.add(land);

            land.children[0].material = new THREE.MeshLambertMaterial({
                color: 0xFFFFFF,
                map: texture
            });

            // land.children.forEach(mesh => {
            //     let rigid_body = addRigidBody(mesh);
            //     world.addBody(rigid_body);
            // });

            let rigid_body = addRigidBody(glb.scene.children[0]);
            world.addBody(rigid_body);

        }
    );

    let startBtn = document.createElement('div');
    document.body.appendChild(startBtn);
    startBtn.innerHTML = "start";
    startBtn.style.position = "absolute";
    startBtn.style.right = "20px";
    startBtn.style.bottom = "20px";
    startBtn.style.zIndex = "20";
    // document.body.appendChild(startBtn);
    console.log(startBtn.style);

    startBtn.onclick = function () {
        if (boxes.length > 0) {
            boxes.forEach(box => {
                box.body.position.set(100 * Math.random() - 50, 20 * Math.random() - 10, 10);
            });
        } else {

            for (let i = 0; i < 100; i++) {

                let box = {};
                box.body = new CANNON.Body({
                    mass: 1,
                    shape: new CANNON.Box(new CANNON.Vec3(0.5, 0.5, 0.5))
                });
                box.body.position.set(100 * Math.random() - 50, 20 * Math.random() - 10, 10);
                world.addBody(box.body);

                box.mesh = new THREE.Mesh(
                    new THREE.BoxGeometry(1, 1, 1),
                    new THREE.MeshLambertMaterial({ color: 0xff0000 })
                );
                scene.add(box.mesh);
                boxes.push(box);
            }
        }
    }

    // let vertices = [
    //     new CANNON.Vec3(100, 100, 0),
    //     new CANNON.Vec3(-100, 100, 0),
    //     new CANNON.Vec3(-100, -100, 0),
    //     new CANNON.Vec3(100, -100, 0),
    // ];

    // let faces = [
    //     [0, 1, 2],
    //     [2, 3, 0]
    // ];
    // let plane_shape = new CANNON.ConvexPolyhedron(vertices, faces);

    //======================================================================
    let plane = new CANNON.Body({
        mass: 0,
        shape: new CANNON.Plane()
        // shape: plane_shape
    });
    // plane.position.set(0, 0, -1);
    // plane.position.copy(planeBody.position);
    world.addBody(plane);


    //  Add a ramp
    var rampShape = new CANNON.Box(new CANNON.Vec3(20.0, 10.0, 0.05));
    var rampBody = new CANNON.Body({
        mass: 0,
        position: new CANNON.Vec3(100, 20.0, 3.5)
    });
    rampBody.addShape(rampShape);
    world.add(rampBody);
    rampBody.quaternion.setFromEuler(0, 0.2, 0.5 * Math.PI, 'ZYX');

    var geo = new THREE.BoxGeometry(40.0, 20.0, 0.1);
    var mesh = new THREE.Mesh(geo, new THREE.MeshLambertMaterial({
        color: 0x666666
    }));
    scene.add(mesh);
    mesh.position.copy(rampBody.position);
    mesh.quaternion.copy(rampBody.quaternion);

    // Another ramp
    rampBody = new CANNON.Body({
        mass: 0,
        position: new CANNON.Vec3(100, -20.0, 3.5)
    });
    rampBody.addShape(rampShape);
    world.add(rampBody);
    rampBody.quaternion.setFromEuler(0, 0.2, -0.5 * Math.PI, 'ZYX');

    mesh = new THREE.Mesh(geo, new THREE.MeshLambertMaterial({
        color: 0x666666
    }));
    scene.add(mesh);
    mesh.position.copy(rampBody.position);
    mesh.quaternion.copy(rampBody.quaternion);

    // console.log(world);
    let car = new Car(scene, world);
    // let ctrls = new CarControl(car);
    car.position.set(0, 0, 20);

    document.addEventListener('keydown', handler);
    document.addEventListener('keyup', handler);

    let engineForce = 300;
    let airForce = 100;

    let maxSteerVal = 0.4;
    let steerVal = 0;
    let maxForce = 4000;
    let brakeForce = 150;

    // console.log(THREE.MathUtils);

    function handler(event) {
        let down = (event.type !== 'keydown');
        let up = (event.type == 'keyup');

        // console.log(event.keyCode);

        car.vehicle.setBrake(0, 0);
        car.vehicle.setBrake(0, 1);
        car.vehicle.setBrake(0, 2);
        car.vehicle.setBrake(0, 3);

        switch (event.keyCode) {

            case 87: // forward
                if (up) {
                    car.vehicle.applyEngineForce(0, 2);
                    car.vehicle.applyEngineForce(0, 3);

                    // sound.fade(1, 0, 1000, engine_1.play());
                    engine_1.stop();
                } else {
                    car.vehicle.applyEngineForce(-maxForce, 2);
                    car.vehicle.applyEngineForce(-maxForce, 3);

                    if (!engine_1.playing()) {
                        engine_1.play();
                    };
                }
                break;

            case 83: // backward
                car.vehicle.applyEngineForce(up ? 0 : maxForce, 2);
                car.vehicle.applyEngineForce(up ? 0 : maxForce, 3);
                break;

            case 66: // b
                if (up) {
                    brake.stop();
                } else {
                    // vehicle.setBrake(brakeForce, 0);
                    // vehicle.setBrake(brakeForce, 1);
                    car.vehicle.setBrake(brakeForce, 2);
                    car.vehicle.setBrake(brakeForce, 3);
                    // console.log("brake");

                    if (car.chassisBody.velocity.length() <= 0.5) {
                        brake.stop();
                    } else if (!brake.playing()) {
                        brake.play();
                    };
                }
                break;

            case 82: // space
                if (up)
                    car.reset();
                break;

            case 65: // left
                if (up) {
                    // steerVal -= 0.08;
                    // steerVal = Math.max(0, steerVal);
                    steerVal = 0;
                } else {
                    // steerVal += 0.05;
                    steerVal = THREE.MathUtils.lerp(steerVal, maxSteerVal, 0.2);
                    // steerVal = Math.min(maxSteerVal, steerVal);
                }
                // console.log(steerVal);
                car.vehicle.setSteeringValue(steerVal, 0);
                car.vehicle.setSteeringValue(steerVal, 1);
                break;

            case 68: // right
                // steerVal += 0.01;
                if (up) {
                    // steerVal -= 0.08;
                    // steerVal = Math.max(0, steerVal);
                    steerVal = 0;
                } else {
                    // steerVal -= 0.05;
                    // steerVal = Math.max(-maxSteerVal, steerVal);
                    steerVal = THREE.MathUtils.lerp(steerVal, -maxSteerVal, 0.2);
                }
                // console.log(steerVal);
                car.vehicle.setSteeringValue(steerVal, 0);
                car.vehicle.setSteeringValue(steerVal, 1);

                break;

        }
    }


    let camera = mainCamera;
    const button = document.getElementsByTagName('button')[0];
    button.onclick = () => {
        camera = camera == mainCamera ? car.camera : mainCamera;
    }

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

        car.update();
        // car.ctrls.update();

        if (boxes.length > 0) {
            boxes.forEach(box => {
                box.mesh.position.copy(box.body.position);
                box.mesh.quaternion.copy(box.body.quaternion);
            });
        }

        requestAnimationFrame(render);
        renderer.render(scene, camera);
    }

    render();
}


