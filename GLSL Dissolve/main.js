let container, scene, camera, renderer, controls, phantom, torusKnot;

let gui;
let params = {
    edgeColor: 0xd27b00,
    scale: 1,
    threshold: 0.0,
    edgeWidth: 0.02,
    edgeBrightness: 2.0
};



init();

function init() {
    initGUI();
    initBase();
    initObject();
    // render();
}

function initGUI() {
    gui = new dat.GUI();
    gui.addColor(params, "edgeColor");
    gui.add(params, "scale", 0.1, 1);
    gui.add(params, "threshold", 0.0, 1.0).step(0.01);
    gui.add(params, "edgeWidth", 0.0, 0.06).step(0.01);
    gui.add(params, "edgeBrightness", 0.0, 10.0).step(0.1);
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

    camera.position.set(40, 30, 30);
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
    // scene.add(area);

    //添加光源
    const pointLight = new THREE.PointLight(0xffffff, 0.5),
        ambientLight = new THREE.AmbientLight(0x0c0c0c);

    pointLight.position.set(40, 55, 50); //设置位置
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
    let textureLoader = new THREE.TextureLoader();
    let objLoader = new THREE.OBJLoader();

    let uniforms = {
        edgeColor: { value: new THREE.Color(params.edgeColor) },
        edgeWidth: { value: 0.02 },
        edgeBrightness: { value: 2.0 },
        threshold: { value: params.threshold },
        mainTex: { value: textureLoader.load("Robots/Texture2D/Phantom_diffuse.png") },
        noiseTex: { value: textureLoader.load("Robots/Texture2D/noise_2.png") }
    };
    let shaderMaterial = new THREE.ShaderMaterial({
        uniforms,
        vertexShader: document.getElementById("vertexShader").textContent,
        fragmentShader: document.getElementById("fragmentShader").textContent,
        side: THREE.FrontSide,
        // blending: THREE.AdditiveBlending,
        // transparent: true
    });
    let material = new THREE.MeshPhongMaterial({ color: 0xffffff });

    objLoader.load(
        "Robots/Mesh/Phantom_LOD0.obj",
        (obj) => {
            // scene.add(obj);

            let geometry = obj.children[0].geometry;

            phantom = new THREE.Mesh(geometry, shaderMaterial);
            scene.add(phantom);

            console.log(phantom);

            render();
        }
    );



}

function render() {
    phantom.scale.set(params.scale, params.scale, params.scale);
    phantom.material.uniforms.threshold.value = params.threshold;
    phantom.material.uniforms.edgeColor.value = new THREE.Color(params.edgeColor);
    phantom.material.uniforms.edgeWidth.value = params.edgeWidth;
    phantom.material.uniforms.edgeBrightness.value = params.edgeBrightness;

    requestAnimationFrame(render);
    renderer.render(scene, camera);
}
