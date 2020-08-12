let container, scene, camera, renderer, controls, sphere, torusKnot;
let customMaterial, textureCube;
let gui;
let params = {
    color: 0xffffff,
    reflectivity: 1.0,
    bias: 1.0,
    power: 2.0
};



init();

function init() {
    initGUI();
    initBase();
    initObject();
    render();
}

function initGUI() {
    gui = new dat.GUI();
    //   gui.addColor(params, "color");
    gui.add(params, "reflectivity", 1.0, 10.0).step(0.1);
    gui.add(params, "bias", 0, 5);
    gui.add(params, "power", -10, 10);
}

function initBase() {
    container = document.getElementById("ThreeJS");

    // SCENE
    scene = new THREE.Scene();

    // CAMERA
    let SCREEN_WIDTH = window.innerWidth,
        SCREEN_HEIGHT = window.innerHeight;
    let VIEW_ANGLE = 45,
        ASPECT = SCREEN_WIDTH / SCREEN_HEIGHT,
        NEAR = 0.1,
        FAR = 2000;
    camera = new THREE.PerspectiveCamera(VIEW_ANGLE, ASPECT, NEAR, FAR);

    camera.position.set(80, 80, 80);
    camera.lookAt(scene.position);

    // RENDERER
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(SCREEN_WIDTH, SCREEN_HEIGHT);
    container.appendChild(renderer.domElement);

    //添加光源
    const pointLight = new THREE.PointLight(0xffffff, 0.5),
        ambientLight = new THREE.AmbientLight(0x0c0c0c);

    pointLight.position.set(0, 55, 50); //设置位置
    pointLight.castShadow = true;
    scene.add(pointLight);
    scene.add(ambientLight);

    // CONTROLS
    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    // controls.maxPolarAngle = 1.5;

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

    var cubeLoader = new THREE.CubeTextureLoader();
    cubeLoader.setPath('/images/arid/');

    textureCube = cubeLoader.load([
        'arid_ft.jpg', 'arid_bk.jpg',
        'arid_up.jpg', 'arid_dn.jpg',
        'arid_rt.jpg', 'arid_lf.jpg'
    ]);

    scene.background = textureCube;

    var material = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        envMap: textureCube
    });

    let uniforms = {
        reflectivity: { value: params.reflectivity },
        skyBox: { value: textureCube }
    }
    customMaterial = new THREE.ShaderMaterial({
        uniforms,
        vertexShader: document.getElementById("vertexShader").textContent,
        fragmentShader: document.getElementById("fragmentShader").textContent,
        side: THREE.FrontSide,
        //blending: THREE.AdditiveBlending,   // 混合
    });

    let torusKnotGeometry = new THREE.TorusKnotBufferGeometry(10, 3, 100, 32);
    torusKnot = new THREE.Mesh(torusKnotGeometry, customMaterial);
    torusKnot.position.x = 40;
    scene.add(torusKnot);
    // console.log(torusKnot);

    let geometry = new THREE.SphereGeometry(20, 60, 60);
    sphere = new THREE.Mesh(geometry, customMaterial);
    scene.add(sphere);
    // console.log(sphere);
}

function render() {
    controls.update();
    requestAnimationFrame(render);
    renderer.render(scene, camera);
    torusKnot.rotation.y += 0.01;
    //     customMaterial.uniforms.glowColor.value = new THREE.Color(params.color);
    customMaterial.uniforms.reflectivity.value = params.reflectivity;
    //     customMaterial.uniforms.b.value = params.bias;
    //     customMaterial.uniforms.p.value = params.power;
}