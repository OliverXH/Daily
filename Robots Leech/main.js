let scene, camera, renderer;
let light, ambientLight;
let gridHelper;
let controls;
let objLoader, textureLoader;

window.onload = init();

function init() {
    scene = new THREE.Scene();

    camera = new THREE.PerspectiveCamera(
        70,
        window.innerWidth / window.innerHeight,
        1.0,
        5000
    ); camera.position.set(0, 20, 40);
    camera.lookAt(scene.position);

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setClearColor(0xeeeeee);
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.getElementById('canvas').appendChild(renderer.domElement);

    light = new THREE.PointLight(0xffffff, 1);
    light.position.set(0, 30, 10);
    scene.add(light);

    ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);

    gridHelper = new THREE.GridHelper(50, 10);
    scene.add(gridHelper);

    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.minDistance = 5;

    window.addEventListener("resize", onWindowResize, false);
    function onWindowResize() {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    }

    objLoader = new THREE.OBJLoader();
    textureLoader = new THREE.TextureLoader();
    objLoader.load(
        'Leech.obj',
        (obj) => {
            scene.add(obj);
            let map = textureLoader.load('textures/Leech_diffuse.png'),
                emission = textureLoader.load('textures/Leech_emission.png'),
                normal = textureLoader.load('textures/Leech_normal.png');

            obj.children[0].material.map = map;
            obj.children[0].material.emissiveMap = emission;
            obj.children[0].material.emissiveIntensity = 40;
            obj.children[0].material.normalMap = normal;
            // obj.children[0].material.normalScale = new THREE.Vector2()
            // console.log("loaded");
			
			render();
        }
    );

}

function render() {
    controls.update();

    requestAnimationFrame(render);
    renderer.render(scene, camera)
}