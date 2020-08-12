function init(scene) {

    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 10000);
    camera.position.set(10, 8, 8);

    // RENDERER
    renderer = new THREE.WebGLRenderer({
        antialias: antialias,
        preserveDrawingBuffer: true
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0xbfd1e5);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;
    renderer.shadowMap.enabled = options.Shadows;
    renderer.shadowMapSoft = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    // renderer.sortObjects = false;
    document.body.appendChild(renderer.domElement);

    //添加辅助线
    let helper = new THREE.GridHelper(400, 100);
    helper.rotateX(Math.PI / 2);
    // helper.material.opacity = 0.75;
    helper.material.transparent = true;
    // environment.add(helper);

    //添加光源
    let hemiLight = new THREE.HemisphereLight(0xffffff, 0xffffff, 1.0);
    // refreshHemiIntensity();
    hemiLight.color.setHSL(0.59, 0.4, 0.6);
    hemiLight.groundColor.setHSL(0.095, 0.2, 0.75);
    hemiLight.position.set(0, 50, 0);
    environment.add(hemiLight);

    let directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(-100, 100, 50);
    directionalLight.castShadow = true;
    let d = 15
    directionalLight.shadow.camera.left = -d;
    directionalLight.shadow.camera.right = d;
    directionalLight.shadow.camera.top = d;
    directionalLight.shadow.camera.bottom = -d;

    directionalLight.shadow.camera.near = 2;
    directionalLight.shadow.camera.far = 500;

    directionalLight.shadow.mapSize.x = 2048;
    directionalLight.shadow.mapSize.y = 2048;

    let sunTarget = new THREE.Object3D();
    directionalLight.target = environment;
    environment.add(sunTarget, directionalLight);

    environment.add(new THREE.CameraHelper(directionalLight.shadow.camera));

    // let directionalLightHelper = new THREE.DirectionalLightHelper(directionalLight, 50);
    // environment.add(directionalLightHelper);

    // environment.fog = new THREE.FogExp2(0x000000, 0.01);

    raycaster = new THREE.Raycaster();
    mouse = new THREE.Vector2();
}