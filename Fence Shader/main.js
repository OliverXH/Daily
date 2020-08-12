import AreaFenceBufferGeometry from "./AreaFenceBufferGeometry.js";

var renderer, scene, camera, clock, controls;
let plane = {},
    ball = {},
    fence = {};

fence.depth = 0.5;
fence.offset = 0.5;

let gui;
let params = {
    color: 0xffffff,
    uTime: 0.0
};

window.onload = init();

function init() {
    initGUI();
    initScene();
    initObject();
}

function initGUI() {
    gui = new dat.GUI();
    gui.addColor(params, "color");
    gui.add(params, "uTime", 0.0, 1000.0);
}

function initScene() {

    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    // renderer.setClearColor(0xffffff);
    renderer.shadowMap.enabled = true; //Here is to tell renderer that we need shadows.
    document.getElementById('viewport').appendChild(renderer.domElement);

    scene = new THREE.Scene;

    camera = new THREE.PerspectiveCamera(
        45,
        window.innerWidth / window.innerHeight,
        1,
        5000
    );
    camera.position.set(4, -10, 4);
    // camera.position.set(0, -18, 20);
    camera.up.set(0, 0, 1);
    camera.lookAt(scene.position);
    // camera.lookAt(new THREE.Vector3(0, 0, 206));
    scene.add(camera);

    //Add a light source
    let ambientLight = new THREE.AmbientLight(0x404040, 1); // soft white light
    let light = new THREE.PointLight(0xffffff, 1);
    light.position.set(15, -16, 15);
    light.shadow.mapSize.height = 1024;
    light.shadow.mapSize.width = 1024;
    light.castShadow = true;
    scene.add(ambientLight);
    scene.add(light);

    clock = new THREE.Clock();
    clock.start();

    //controller
    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxPolarAngle = 1.6;
    controls.update();
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

    let axesHelper = new THREE.AxesHelper(30);
    // scene.add(axesHelper);

    let plane = new THREE.Mesh(
        new THREE.PlaneGeometry(2.35 * 2, 1.5 * 2),
        new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.7, side: THREE.DoubleSide })
    );
    // scene.add(plane);

    /*
     * 3D Text
     */
    let fontLoader = new THREE.FontLoader();
    // fontLoader.load("https://rawcdn.githack.com/mrdoob/three.js/df2b31f86dbc82b4d852896c3f85f1a15f4b9f42/examples/fonts/gentilis_regular.typeface.json", font => {

    let textOptions = {
        font: null,
        size: 0.5,
        height: 0.3,
        curveSegments: 12
    };
    fontLoader.load("https://xh-bucket01.oss-cn-shenzhen.aliyuncs.com/fonts/HYHeiFangW_Regular.json", font => {
        textOptions.font = font;

        // text geometry
        let textGeo = new THREE.TextGeometry("Made With Love By 木本", {
            font: textOptions.font,
            size: textOptions.size,
            height: textOptions.height,
            curveSegments: textOptions.curveSegments
            // bevelEnabled: true,
            // bevelThickness: 0.1,
            // // bevelSize: 8,
            // // bevelSegments: 5
        });

        let text = new THREE.Mesh(
            textGeo,
            new THREE.MeshLambertMaterial({ color: "#ddd" })
        );
        text.name = "text";
        text.castShadow = true;
        text.rotateX(Math.PI * 0.5);
        text.position.set(-4.5, 0, 0.2);
        console.log(text.geometry.parameters.text);

        scene.add(text);
    });

    /**
     *  Fence
     */
    fence.geometry = new AreaFenceBufferGeometry(10, 1.5 * 2, 0.5);

    // Material
    let areaFenceMaterial = new THREE.ShaderMaterial({
        uniforms: {
            uTime: { type: "f", value: null },
            uBorderAlpha: { type: "f", value: 0.5 },
            uStrikeAlpha: { type: "f", value: 0.25 }
        },
        vertexShader: document.getElementById("vertexShader").textContent,
        fragmentShader: document.getElementById("fragmentShader").textContent,
        wireframe: false,
        transparent: true,
        side: THREE.DoubleSide,
        depthTest: true,
        depthWrite: false,

    });
    // fence.material = new THREE.MeshBasicMaterial({ color: 0xD7502D, wireframe: false, side: THREE.DoubleSide, transparent: true, opacity: 0.5 });
    fence.material = areaFenceMaterial;

    // Mesh
    fence.mesh = new THREE.Mesh(fence.geometry, fence.material);
    // fence.mesh.position.z = 0.1;
    scene.add(fence.mesh);

    render();
};

function render() {
    // console.log(fence.material.uniforms.uTime.value);
    fence.material.uniforms.uTime.value = clock.getElapsedTime() * 1000;
    // fence.material.uniforms.uTime.value = params.uTime;

    controls.update();

    renderer.render(scene, camera); // render the scene
    requestAnimationFrame(render);
};