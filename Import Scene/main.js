
let renderer, scene, camera, world, controls;

window.onload = initScene();

function initScene() {

    world = new CANNON.World();
    world.gravity.set(0, 0, -320);
    world.broadphase = new CANNON.NaiveBroadphase();
    world.solver.iterations = 10;
    world.allowSleep = true;

    // renderer = new THREE.WebGLRenderer();
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true; //Here is to tell renderer that we need shadows.
    document.getElementById('viewport').appendChild(renderer.domElement);

    scene = new THREE.Scene;

    camera = new THREE.PerspectiveCamera(
        65,
        window.innerWidth / window.innerHeight,
        1,
        5000
    );
    camera.position.set(14, -13, 16);
    // camera.position.set(0, -18, 20);
    camera.up.set(0, 0, 1);
    camera.lookAt(scene.position);
    scene.add(camera);

    //Add a light source
    let ambientLight = new THREE.AmbientLight(0xffffff, 0.2); // soft white light
    let light = new THREE.PointLight(0xffffff, 1);
    light.position.set(0, 50, 40);
    light.shadow.mapSize.height = 1024;
    light.shadow.mapSize.width = 1024;
    light.castShadow = true;
    scene.add(ambientLight);
    scene.add(light);

    var axesHelper = new THREE.AxesHelper(70);
    scene.add(axesHelper);

    //controller
    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxPolarAngle = 1.5;
    controls.update();

    let plane = new THREE.Mesh(
        new THREE.PlaneGeometry(100, 100),
        new THREE.MeshLambertMaterial({ color: 0xffffff })
    );
    plane.receiveShadow = true;
    scene.add(plane);

    let box = new THREE.Mesh(
        new THREE.BoxGeometry(2, 2, 2),
        new THREE.MeshLambertMaterial({ color: 0xffffff })
    );
    box.castShadow = true;
    box.position.set(10, 0, 4);
    scene.add(box);

    const loader = new THREE.GLTFLoader();
    loader.load(
        'models/scene.glb',
        (gltf) => {

            gltf.scene.position.set(16, 20, 0);
            gltf.scene.rotation.x = Math.PI / 2;

            function cast_shadow(_parent) {
                for (let i = 0; i < _parent.children.length; i++) {
                    if (_parent.children[i].children.length) {
                        cast_shadow(_parent.children[i]);
                    } else {
                        _parent.children[i].castShadow = true;
                    }
                }
            }

            cast_shadow(gltf.scene);

            scene.add(gltf.scene);

            // console.log(gltf.scene.children);

        }
    );

    loader.load(
        'models/cactus_short.glb',
        (gltf) => {

            gltf.scene.children[0].position.set(0, 5, 0);
            gltf.scene.children[0].rotation.x = Math.PI / 2;
            
            function cast_shadow(_parent) {
                for (let i = 0; i < _parent.children.length; i++) {
                    if (_parent.children[i].children.length) {
                        cast_shadow(_parent.children[i]);
                    } else {
                        _parent.children[i].castShadow = true;
                    }
                }
            }

            cast_shadow(gltf.scene);

            scene.add(gltf.scene);

        }
    );

    loader.load(
        'models/fence_double.glb',
        (gltf) => {

            gltf.scene.children[0].position.set(0, 0, 0);
            gltf.scene.children[0].rotation.x = Math.PI / 2;
            
            function cast_shadow(_parent) {
                for (let i = 0; i < _parent.children.length; i++) {
                    if (_parent.children[i].children.length) {
                        cast_shadow(_parent.children[i]);
                    } else {
                        _parent.children[i].castShadow = true;
                    }
                }
            }

            cast_shadow(gltf.scene);

            scene.add(gltf.scene);

            render();
        }
    )

    /*
     * Events to fire upon window resizing.
    */
    window.addEventListener("resize", onWindowResize, false);
    function onWindowResize() {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    }


};

function render() {

    controls.update();

    renderer.render(scene, camera); // render the scene
    requestAnimationFrame(render);

};