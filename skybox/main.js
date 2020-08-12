let scene, camera, renderer, controls;
let loader, texture;

init();
render();

function init() {
    scene = new THREE.Scene;

    camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 100);
    camera.position.set(-18, 30, 30);

    renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);

    document.body.appendChild(renderer.domElement);

    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.update();

    //background images
    loader = new THREE.CubeTextureLoader();
    loader.setPath("/images/arid/")
    texture = loader.load([
        'arid_ft.jpg', 'arid_bk.jpg',
        'arid_up.jpg', 'arid_dn.jpg',
        'arid_rt.jpg', 'arid_lf.jpg'
    ]);
    scene.background = texture;

    {
        const color = 0xFFFFFF;
        const intensity = 1;
        const light = new THREE.DirectionalLight(color, intensity);
        light.position.set(-80, 200, 400);
        scene.add(light);
    }

    {
        const geometry = new THREE.SphereGeometry(4, 40, 40);
        const material = new THREE.MeshBasicMaterial({
            color: 0xffffff,
            envMap: texture
        });
        const mesh = new THREE.Mesh(geometry, material);
        mesh.castShadow = true;
        scene.add(mesh);
    }

}

function render() {
    requestAnimationFrame(render);
    renderer.render(scene, camera);
}