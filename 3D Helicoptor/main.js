let scene, camera, renderer;
let light, ambientLight;
let gridHelper;
let helicopter;
let controls, keyControl;
let objLoader, textureLoader;

window.onload = init();

function init() {
    scene = new THREE.Scene();

    camera = new THREE.PerspectiveCamera(
        70,
        window.innerWidth / window.innerHeight,
        1.0,
        5000
    );

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setClearColor(0xeeeeee);
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.getElementById('canvas').appendChild(renderer.domElement);

    light = new THREE.PointLight(0xffffff, 1);
    light.position.set(0, 50000, 10);
    scene.add(light);

    ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);

    gridHelper = new THREE.GridHelper(50, 10);
    scene.add(gridHelper);

    let sea = new THREE.Mesh(
        new THREE.PlaneGeometry(10000, 10000),
        new THREE.MeshPhongMaterial({ color: 0x1A5FC6 })
    );
    sea.rotation.x = -Math.PI / 2;
    scene.add(sea);

    // controls = new THREE.OrbitControls(camera, renderer.domElement);
    // controls.minDistance = 5;

    keyControl = new KeyControls();

    window.addEventListener("resize", onWindowResize, false);
    function onWindowResize() {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    }

    let speed = 0.8;
    let xDirection = 0,
        yDirection = 0;
    let deltaX = 0,
        deltaY = 0;
    let theta = 0,
        beta = 0;

    function Theta() {

        if (keyControl.forward) {
            theta = helicopter.rotation.y;
            // helicopter.position.x += speed * Math.cos(theta);
            beta = helicopter.children[0].rotation.y - Math.PI / 2;

            if (helicopter.children[0].rotation.y >= Math.PI / 12) {
                helicopter.children[0].rotation.y = Math.PI / 12;
            } else {
                helicopter.children[0].rotation.y += 0.005;
            }
        } else if (keyControl.backward) {
            theta = helicopter.rotation.y + Math.PI;
            // helicopter.position.x -= speed * Math.cos(theta);
            if (helicopter.children[0].rotation.y <= -Math.PI / 12) {
                helicopter.children[0].rotation.y = -Math.PI / 12;
            } else {
                helicopter.children[0].rotation.y -= 0.005;
            }

        } else {
            helicopter.children[0].rotation.y *= 0.90;
        }

        if (keyControl.left) {
            helicopter.rotation.y += 0.01;

            
            // if (helicopter.children[0].rotation.x <= -Math.PI / 12) {
            //     helicopter.children[0].rotation.x = -Math.PI / 12;
            // } else {
            //     helicopter.children[0].rotation.x -= 0.005;
            // }
        } else if (keyControl.right) {
            helicopter.rotation.y -= 0.01;

            // if (helicopter.children[0].rotation.x >= Math.PI / 12) {
            //     helicopter.children[0].rotation.x = Math.PI / 12;
            // } else {
            //     helicopter.children[0].rotation.x += 0.005;
            // }
        } else {
            yDirection = 0;

            // helicopter.children[0].rotation.x *= 0.9;
        }

    }

    objLoader = new THREE.OBJLoader();
    textureLoader = new THREE.TextureLoader();
    objLoader.load(
        'models/root_scene.obj',
        (obj) => {
            scene.add(obj);
            for (let i = 0; i < obj.children.length; i++) {
                obj.children[i].material = new THREE.MeshLambertMaterial({ color: 0xF27C0A });
            }
        }
    )
    objLoader.load(
        'models/VL_Prop_Chopper.obj',
        (obj) => {
            helicopter = obj;
            scene.add(obj);
            helicopter.position.y = 100;
            // let map = textureLoader.load('textures/Leech_diffuse.png'),
            //     emission = textureLoader.load('textures/Leech_emission.png'),
            //     normal = textureLoader.load('textures/Leech_normal.png');
            // helicopter.add(camera)
            helicopter.add(camera);
            camera.position.set(-20, 10, 0);
            camera.lookAt(helicopter.position);

            let axesHelper = new THREE.AxesHelper(10);
            obj.children[0].add(axesHelper);

            obj.children[0].material = new THREE.MeshLambertMaterial({ color: 0x555555 });
            obj.children[0].rotation.set(-Math.PI / 2, 0, Math.PI / 2);
            // obj.children[0].material.map = map;
            // obj.children[0].material.emissiveMap = emission;
            // obj.children[0].material.emissiveIntensity = 40;
            // obj.children[0].material.normalMap = normal;
            // obj.children[0].material.normalScale = new THREE.Vector2()
            // console.log("loaded");



            function render() {
                // controls.update();
                // camera.position.set(-20 + helicopter.position.x, 10 + helicopter.position.y, 0 + helicopter.position.z);
                // camera.lookAt(helicopter.position);

                Theta();

                if (keyControl.forward || keyControl.backward) {
                    speed = 0.8;
                } else {
                    speed = 0;
                }

                helicopter.position.x += speed * Math.cos(theta);
                helicopter.position.z -= speed * Math.sin(theta);

                requestAnimationFrame(render);
                renderer.render(scene, camera)
            }

            render();
        }
    );

}

