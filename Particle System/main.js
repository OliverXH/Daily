

let stats, container, scene, camera, renderer, controls, sphere, torusKnot;
let points, particles = [];

const objLoader = new THREE.OBJLoader();
const textureLoader = new THREE.TextureLoader();

let clock = new THREE.Clock();
clock.start();

let gui;
let params = {
    color: 0xffffff,
    scale: -1.0,
    bias: 1.0,
    power: 2.0
};

let i = 0;

init();

function init() {
    // initGUI();
    initBase();
    initObject();
    render();
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

    container = document.getElementById("ThreeJS");

    stats = new Stats();
    container.appendChild(stats.dom);

    // SCENE
    scene = new THREE.Scene();

    // CAMERA
    camera = new THREE.PerspectiveCamera(
        45,
        window.innerWidth / window.innerHeight,
        0.1,
        5000
    );

    camera.position.set(4, 5, 10);
    camera.lookAt(scene.position);

    // RENDERER
    renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    container.appendChild(renderer.domElement);
    renderer.sortObjects = false;
    // renderer.shadowMap.enabled = true;


    //添加光源
    const pointLight = new THREE.PointLight(0xffffff),
        ambientLight = new THREE.AmbientLight(0xffffff, 0.4);

    pointLight.position.set(0, 55, 50); //设置位置
    pointLight.castShadow = true;
    scene.add(pointLight);
    scene.add(ambientLight);

    // CONTROLS
    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.movementSpeed = 100;  //镜头移速
    controls.lookSpeed = 0.125;  //视角改变速度
    controls.lookVertical = true;  //是否允许视角上下改变

    window.addEventListener("resize", onWindowResize, false);
    function onWindowResize() {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    }
}

function initObject() {

    scene.add(new THREE.ArrowHelper(new THREE.Vector3(0, 1, 0), new THREE.Vector3(0, 0, 0), 10, 0x00ff00));
    scene.add(new THREE.GridHelper(40));

    const texture = new THREE.TextureLoader().load("assert/particle.png");

    //

    let Duration = 5;
    let StartSpeed = 5;
    let StartSize = 1;
    let StartColor = new THREE.Color(0xff0000);

    let MaxParticles = 1000;

    function direction() {
        // cone
        let angle = 25;
        let radius = 1;
        let height = 2;

        let theta = 2 * Math.PI * Math.random();

        let px = radius * Math.cos(theta);
        let py = height;
        let pz = radius * Math.sin(theta);

        let _direction = new THREE.Vector3(px, py, pz);
        _direction.normalize();

        return _direction;
    }

    var scales = new Float32Array(4);

    let geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array([0, 0, 0]), 3));
    geometry.setAttribute('scale', new THREE.BufferAttribute(scales, 1.0));
    geometry.computeBoundingSphere();

    //
    let shaderMaterial = new THREE.ShaderMaterial({

        uniforms: {
            color: { value: new THREE.Color(0xffffff) },
        },
        vertexShader: document.getElementById('vertexshader').textContent,
        fragmentShader: document.getElementById('fragmentshader').textContent

    });

    let defaultMaterial = new THREE.PointsMaterial({
        size: StartSize,
        color: StartColor,
        map: texture,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthTest: false
    });

    points = new THREE.Points(geometry, shaderMaterial);
    scene.add(points);

    // for (let i = 1; i <= 30; i++) {
    //     let point = points.clone();
    //     scene.add(point);

    //     point.position.y = i;

    //     particles.push(point);
    // }

    //

}

function render() {

    let time = clock.getElapsedTime();

    points.position.y = 3 * Math.sin(time);

    stats.update();

    requestAnimationFrame(render);
    renderer.render(scene, camera);

}

