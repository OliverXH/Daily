let container, scene, mainCamera, followCamera, renderer, controls;

let box;
let sparks = [], distances = [], origins = [];

let j = 0;

// const fbxLoader = new THREE.FBXLoader();
// const gltfLoader = new THREE.GLTFLoader();
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

let theta = 0;
let m = new THREE.Matrix4();

init();

function init() {
    // initGUI();
    initBase();
    initObject();
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
    container = document.getElementById("canvas");

    // SCENE
    scene = new THREE.Scene();

    // CAMERA
    mainCamera = new THREE.PerspectiveCamera(
        45,
        window.innerWidth / window.innerHeight,
        0.1,
        5000
    );

    mainCamera.position.set(4, 10, 25);
    // mainCamera.up.set(0, 0, 1);
    mainCamera.lookAt(scene.position);

    // RENDERER
    renderer = new THREE.WebGLRenderer(/*{ antialias: true }*/);
    renderer.setSize(window.innerWidth, window.innerHeight);
    container.appendChild(renderer.domElement);
    renderer.sortObjects = false;
    // renderer.shadowMap.enabled = true;

    //添加光源
    const pointLight = new THREE.PointLight(0xffffff),
        ambientLight = new THREE.AmbientLight(0xffffff, 0.4);

    pointLight.position.set(50, 55, 50); //设置位置
    pointLight.castShadow = true;
    scene.add(pointLight);
    scene.add(ambientLight);

    // CONTROLS
    controls = new THREE.OrbitControls(mainCamera, renderer.domElement);

    /*
	 * Events to fire upon window resizing.
	 */
    window.addEventListener("resize", onWindowResize, false);
    function onWindowResize() {
        mainCamera.aspect = window.innerWidth / window.innerHeight;
        mainCamera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    }
}

function initObject() {
    scene.add(new THREE.AxesHelper(1));
    // scene.add(new THREE.GridHelper(10));

    box = new THREE.Mesh(
        new THREE.BoxGeometry(2, 2, 2),
        new THREE.MeshPhongMaterial({
            color: 0x519ABA
        })
    );
    // scene.add(box);

    class Spark {
        constructor() {
            this.spark = null;
            this.origin = new THREE.Vector3();
            this.init();
        }

        init() {
            this.spark = new THREE.Mesh(
                new THREE.PlaneGeometry(0.03, 1),
                new THREE.MeshBasicMaterial({
                    color: 0x059DFF,
                    side: THREE.DoubleSide,
                    transparent: true,
                    opacity: 1
                })
            );

            scene.add(this.spark);

            this.distance = 5 + 3 * Math.random();

            this.direction = new THREE.Vector3(2 * Math.random() - 1, 2 * Math.random() - 1, 2 * Math.random() - 1);
            this.direction.normalize();

            this.position = this.direction.multiplyScalar(this.distance);
            this.spark.position.copy(this.position);
            this.origin.copy(this.position);

            let up = new THREE.Vector3(0, 1, 0);
            this.theta = up.angleTo(this.direction);
            this.normal = up.cross(this.direction);
            this.normal.normalize();

            this.spark.setRotationFromMatrix(rotateMatrix(this.theta, this.normal));

            this.delta = this.direction.multiplyScalar(0.04);
        }

        update() {

            this.spark.position.x -= this.delta.x;
            this.spark.position.y -= this.delta.y;
            this.spark.position.z -= this.delta.z;

            this.spark.material.opacity -= 0.08 * Math.random();

            if (this.spark.material.opacity <= 0) {
                this.spark.position.copy(this.origin);
                this.spark.material.opacity = 1;
            }
        }
    }

    for (let i = 0; i < 50; i++) {
        let spark = new Spark();

        sparks.push(spark);
    }

    console.log(origins);

    render();
}

function rotateMatrix(theta, normal) {

    let A = new THREE.Matrix4();
    A.set(
        Math.cos(theta) + normal.x * normal.x * (1 - Math.cos(theta)), -normal.z * Math.sin(theta) + normal.x * normal.y * (1 - Math.cos(theta)), normal.y * Math.sin(theta) + normal.x * normal.z * (1 - Math.cos(theta)), 0,
        normal.z * Math.sin(theta) + normal.x * normal.y * (1 - Math.cos(theta)), Math.cos(theta) + normal.y * normal.y * (1 - Math.cos(theta)), -normal.x * Math.sin(theta) + normal.y * normal.z * (1 - Math.cos(theta)), 0,
        -normal.y * Math.sin(theta) + normal.x * normal.z * (1 - Math.cos(theta)), normal.x * Math.sin(theta) + normal.y * normal.z * (1 - Math.cos(theta)), Math.cos(theta) + normal.z * normal.z * (1 - Math.cos(theta)), 0,
        0, 0, 0, 1
    );

    return A;
}



function render() {

    // box.setRotationFromMatrix(m);

    for (let i = 0; i < sparks.length; i++) {
        sparks[i].update();
    }

    let frame = requestAnimationFrame(render);
    renderer.render(scene, mainCamera);

    // console.log(sparks[2].spark.position);

    // j++;
    // if (j > 100) {
    //     cancelAnimationFrame(frame);
    // }


}


