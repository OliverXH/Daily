let container, scene, camera, renderer, controls, sphere, torusKnot;

const fbxLoader = new THREE.FBXLoader();
const gltfLoader = new THREE.GLTFLoader();
const objLoader = new THREE.OBJLoader();
const textureLoader = new THREE.TextureLoader();

let clock = new THREE.Clock();

let gui;
let params = {
    color: 0xffffff,
    scale: -1.0,
    bias: 1.0,
    power: 2.0
};



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

    var controller = gui.add(fizzyText, 'maxSize', 0, 10);

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

    // SCENE
    scene = new THREE.Scene();

    // CAMERA
    camera = new THREE.PerspectiveCamera(
        45,
        window.innerWidth / window.innerHeight,
        0.1,
        5000
    );

    camera.position.set(0, 20, 25);
    camera.lookAt(scene.position);

    // RENDERER
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
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
    // controls = new PointerLockControls( camera, document.body );
    // controls.enabled = true;
    // controls.lookSpeed = 0.02; //鼠标移动查看的速度
    // controls.movementSpeed = 10; //相机移动速度
    // controls.noFly = false;
    // controls.constrainVertical = true; //约束垂直
    // controls.verticalMin = 1.0;
    // controls.verticalMax = 2.0;
    // controls.lon = 0; //进入初始视角x轴的角度
    // controls.lat = 0; //初始视角进入后y轴的角度

    controls.movementSpeed = 100;  //镜头移速
    controls.lookSpeed = 0.125;  //视角改变速度
    controls.lookVertical = true;  //是否允许视角上下改变

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

    // PLANE
    const texture = new THREE.TextureLoader().load("assert/Landscape.png");
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(4, 4);
    const plane = new THREE.Mesh(
        new THREE.PlaneGeometry(100, 100, 25),
        new THREE.MeshLambertMaterial({
            color: 0xffffff,
            map: texture,
            side: THREE.DoubleSide
        })
    );
    plane.rotateX(-Math.PI / 2);
    plane.receiveShadow = true;
    scene.add(plane);

    // PLAYER
    // let player = Capsule();
    // scene.add(player);

    gltfLoader.load(
        'car.glb',
        (glb) => {
            console.log(glb);

            scene.add(glb.scene);

            let material = new THREE.MeshLambertMaterial({
                color: 0x841D5B
            })

            let body = glb.scene.children[0];
            let wheel_fl = glb.scene.children[1];
            let wheel_fr = glb.scene.children[2];
            let wheel_rl = glb.scene.children[3];
            let wheel_rr = glb.scene.children[4];

            body.material = material;
        }
    )

    // GRASS
    /*
    objLoader.load(
        'grass.obj',
        (obj) => {
            // console.log(obj);

            let grass = new THREE.Mesh(
                obj.children[0].geometry,
                new THREE.MeshPhongMaterial({
                    alphaTest: 0.5,
                    map: textureLoader.load('assert/albedoa.png'),
                    normalMap: textureLoader.load('assert/normal.png'),
                    // transparent: true,
                    side: THREE.DoubleSide,
                    // depthTest: false
                    // depthWrite: false
                })
            );
            // scene.add(grass);
            // obj.children[0].castShadow = true;

            // for (let i = 0; i < 20; i++) {
            for (let j = 0; j < 200; j++) {
                let _grass = grass.clone()
                scene.add(_grass);
                _grass.rotateY(2 * Math.PI * Math.random())
                _grass.position.set(20 * Math.random() - 10, 0, 20 * Math.random() - 10);
            }
            // }
        }
    );
    */

    let uniforms = {
        s: { type: "f", value: params.scale },
        b: { type: "f", value: params.bias },
        p: { type: "f", value: params.power },
        glowColor: { type: "c", value: new THREE.Color(params.color) }
    };

    let shaderMaterial = new THREE.ShaderMaterial({
        uniforms,
        // vertexShader: document.getElementById("vertexShader").textContent,
        // fragmentShader: document.getElementById("fragmentShader").textContent,
        side: THREE.FrontSide,
        blending: THREE.AdditiveBlending,
        transparent: true
    });

}

function render() {
    // controls.update(clock.getDelta());

    requestAnimationFrame(render);
    renderer.render(scene, camera);
}