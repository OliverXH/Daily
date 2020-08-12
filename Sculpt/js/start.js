import { OrbitControls } from "../lib/OrbitControls.js";

let scene, camera, renderer, controls;

let size = 10,
    segments = 256;

let terrainGeom, terrainMesh;
let groundPlaneMesh, visMaterial, visMesh;
let gpuSkulpt;

let options = {
    // terrainImage: terrainImages[Object.keys(terrainImages)[0]],
    // terrainShowImage: false,
    // terrainMidGreyIsLowest: true,
    // terrainPreBlur: terrainImageSettings[Object.keys(terrainImageSettings)[0]].preblur,
    // terrainHeight: terrainImageSettings[Object.keys(terrainImageSettings)[0]].height,
    sculptSize: 1.5,
    sculptAmount: 0.04,
    sculptClearSculpts: function () {
        gpuSkulpt.clear();
    },
    renderingShadows: true,
    renderingShadowCasters: false,
    displaySculptTexture: false
};

let rayCaster = new THREE.Raycaster(),
    mouse = new THREE.Vector2();

// const fbxLoader = new THREE.FBXLoader();
// const gltfLoader = new THREE.GLTFLoader();
// const objLoader = new THREE.OBJLoader();
const textureLoader = new THREE.TextureLoader();

let clock = new THREE.Clock();

init();

function init() {
    initScene();
    initObject();
}

function initScene() {

    // SCENE
    scene = new THREE.Scene();

    // CAMERA
    camera = new THREE.PerspectiveCamera(
        45,
        window.innerWidth / window.innerHeight,
        0.1,
        5000
    );
    camera.position.set(10, 20, 25);
    camera.lookAt(scene.position);

    // RENDERER
    renderer = new THREE.WebGLRenderer(/*{ antialias: true }*/);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0xbfd1e5);
    document.body.appendChild(renderer.domElement);
    // renderer.shadowMap.enabled = true;

    //添加光源
    const pointLight = new THREE.PointLight(0xffffff),
        ambientLight = new THREE.AmbientLight(0xffffff, 0.4);

    pointLight.position.set(50, 55, 50); //设置位置
    pointLight.castShadow = true;
    scene.add(pointLight);
    scene.add(ambientLight);

    let directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(30, 10, 50);
    directionalLight.castShadow = true;
    let d = 15
    directionalLight.shadow.camera.left = -d;
    directionalLight.shadow.camera.right = d;
    directionalLight.shadow.camera.top = d;
    directionalLight.shadow.camera.bottom = -d;

    directionalLight.shadow.camera.near = 2;
    directionalLight.shadow.camera.far = 500;

    directionalLight.shadow.mapSize.x = 1024;
    directionalLight.shadow.mapSize.y = 1024;

    // scene.add(new THREE.CameraHelper(directionalLight.shadow.camera));

    let directionalLightHelper = new THREE.DirectionalLightHelper(directionalLight, 50);
    scene.add(directionalLightHelper);

    // CONTROLS
    controls = new OrbitControls(camera, renderer.domElement);

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

    //create plane for reference and for intersection test
    var groundPlaneGeom = new THREE.PlaneGeometry(size, size, 1, 1);  //much faster for intersection test when there are no divisions
    groundPlaneGeom.rotateX(-Math.PI / 2);
    var groundPlaneMaterial = new THREE.MeshPhongMaterial();
    // materials.push(groundPlaneMaterial);
    groundPlaneMesh = new THREE.Mesh(groundPlaneGeom, groundPlaneMaterial);
    groundPlaneMesh.castShadow = true;
    groundPlaneMesh.receiveShadow = true;
    groundPlaneMesh.visible = false;
    scene.add(groundPlaneMesh);

    let cube = new THREE.Mesh(
        new THREE.BoxGeometry(1, 1, 1),
        new THREE.MeshPhongMaterial({ color: 0xa0ff00 })
    );
    cube.position.y = 1;
    scene.add(cube);

    let planeGeo = new THREE.PlaneGeometry(size, size, segments, segments);
    planeGeo.rotateX(-Math.PI / 2);
    let plane = new THREE.Mesh(
        planeGeo,
        new THREE.MeshPhongMaterial({ color: 0xa03a56 })
    );
    scene.add(plane);

    setUpSkulpt();
    render();
}

function setUpSkulpt() {

    //create a terrain mesh for sculpting
    terrainGeom = new THREE.PlaneGeometry(size, size, segments - 1, segments - 1);
    terrainGeom.rotateX(-Math.PI / 2);;
    terrainMesh = new THREE.Mesh(terrainGeom, null);
    terrainMesh.castShadow = true;
    terrainMesh.receiveShadow = true;
    scene.add(terrainMesh);

    //create a GpuSkulpt
    gpuSkulpt = new SKULPT.GpuSkulpt({
        renderer: renderer,
        mesh: terrainMesh,
        size: size,
        res: segments,
    });

    let sculpting = false;

    window.addEventListener('keydown', (event) => {
        // console.log(event.keyCode);
        if (event.keyCode == 83) {

            sculpting = true;
            controls.enabled = false;

        }
    });
    window.addEventListener('keyup', (event) => {
        // console.log(event.keyCode);
        if (event.keyCode == 83) {

            sculpting = false;
            controls.enabled = true;

        }
    });

    document.addEventListener('mousedown', onMouseDown, false);

    function onMouseDown(e) {

        document.addEventListener('mousemove', onMouseMove, false);
        document.addEventListener('mouseup', onMouseUp, false);

        if (sculpting) {

            let intersectPoint = getPosition(e);
            // showBrush(intersectPoint);
            sculpt(intersectPoint);
            // console.log(intersectPoint);
        }
    }

    function onMouseMove(e) {
        if (sculpting) {

            let intersectPoint = getPosition(e);
            // showBrush(intersectPoint);
            sculpt(intersectPoint);
            // console.log(intersectPoint);
        }
    }

    function onMouseUp(e) {
        // gpuSkulpt.hideCursor();

        document.removeEventListener('mousemove', onMouseMove, false);
        document.removeEventListener('mouseup', onMouseUp, false);
    }

    function getPosition(e) {

        // 将鼠标位置归一化为设备坐标。x 和 y 方向的取值范围是 (-1 to +1)
        mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
        mouse.y = - (e.clientY / window.innerHeight) * 2 + 1;

        rayCaster.setFromCamera(mouse, camera);

        let intersectInfo = rayCaster.intersectObject(groundPlaneMesh);

        //get intersection point
        if (intersectInfo && intersectInfo[0]) {
            console.log(intersectInfo);
            return intersectInfo[0].point;
        }

        return null;
    }

    function sculpt(intersectPoint) {
        if (intersectPoint) {
            //do actual sculpting if clicked
            if (event.button === 0) {  //LMB
                // isSculpting = true;
                gpuSkulpt.sculpt(SKULPT.ADD, intersectPoint, options.amount);
            } else if (event.button === 2) {  //RMB
                // isSculpting = true;
                gpuSkulpt.sculpt(SKULPT.REMOVE, intersectPoint, options.amount);
            }
        }
    }

    function showBrush(intersectPoint) {
        if (intersectPoint) {
            //show cursor at intersection point
            gpuSkulpt.updateCursor(intersectPoint);
            gpuSkulpt.showCursor();
        } else {
            //cursor is out of terrain, so hide it, otherwise it will remain at the edge
            gpuSkulpt.hideCursor();
        }
    }
}

function render() {

    let dt = clock.getDelta();
    // console.log(plane.position);

    // renderer.autoClear = false;

    // renderer.clear();
    gpuSkulpt.update(dt);
    renderer.render(scene, camera);

    requestAnimationFrame(render);
}