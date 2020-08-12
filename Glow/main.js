let container, scene, camera, renderer, controls, sphere, torusKnot;

let gui;
let params = {
    color: 0xffffff,
    scale: -1.0,
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

function initGUI(){
	gui = new dat.GUI();
	gui.addColor(params, "color");
	gui.add(params, "scale",-2, 0);
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
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(SCREEN_WIDTH, SCREEN_HEIGHT);
    container.appendChild(renderer.domElement);

    //创建一个空间
    let loader = new THREE.TextureLoader();
    const texture = loader.load(
        "https://threejsfundamentals.org/threejs/resources/images/checker.png"
    );
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.magFilter = THREE.NearestFilter;
    const repeats = 40 / 2;
    texture.repeat.set(repeats, repeats);
    const areaGeometry = new THREE.BoxGeometry(260, 260, 260);
    const areaMaterial = new THREE.MeshPhongMaterial({
        map: texture,
        color: 0xaaaaaa,
        specular: 0xdddddd,
        shininess: 5,
        reflectivity: 2,
        side: THREE.BackSide,
    });
    const area = new THREE.Mesh(areaGeometry, areaMaterial);
    area.receiveShadow = true;
    scene.add(area);

    //添加光源
    const pointLight = new THREE.PointLight(0xffffff, 0.5),
        ambientLight = new THREE.AmbientLight(0x0c0c0c);

    pointLight.position.set(0, 55, 50); //设置位置
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
    let customMaterial = new THREE.ShaderMaterial({
        uniforms: {
            s: { type: "f", value: params.scale },
            b: { type: "f", value: params.bias },
            p: { type: "f", value: params.power },
            glowColor: { type: "c", value: new THREE.Color(params.color) }
        },
        vertexShader: document.getElementById("vertexShader").textContent,
        fragmentShader: document.getElementById("fragmentShader").textContent,
        side: THREE.FrontSide,
        blending: THREE.AdditiveBlending,
        transparent: true
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
    requestAnimationFrame(render);
    renderer.render(scene, camera);
    sphere.rotation.y += 0.01;
    sphere.material.uniforms.glowColor.value = new THREE.Color(params.color);
    sphere.material.uniforms.s.value = params.scale;
    sphere.material.uniforms.b.value = params.bias;
    sphere.material.uniforms.p.value = params.power;
}
