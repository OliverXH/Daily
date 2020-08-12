/**
 * 
 */
let clock = new THREE.Clock();

var WIDTH = window.innerWidth;
var HEIGHT = window.innerHeight;

var renderer = new THREE.WebGLRenderer({
    alpha: true
});
renderer.setSize(WIDTH, HEIGHT);
document.body.appendChild(renderer.domElement);

var scene = new THREE.Scene();

var camera = new THREE.PerspectiveCamera(70, WIDTH / HEIGHT);
camera.position.set(5, 10, 10);
scene.add(camera);

let directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.position.set(30, 10, 50);
directionalLight.castShadow = true;
let d = 15
directionalLight.shadow.camera.left = -d;
directionalLight.shadow.camera.right = d;
directionalLight.shadow.camera.top = d;
directionalLight.shadow.camera.bottom = -d;
directionalLight.shadow.mapSize.x = 1024;
directionalLight.shadow.mapSize.y = 1024;
scene.add(directionalLight);

/**
 * controls
 */
const controls = new THREE.OrbitControls(camera, renderer.domElement);
// const controls = new THREE.FirstPersonControls(camera, renderer.domElement);
// controls.minDistance = 40;

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

let SIZE = 10,
    SEGMENTS = 256;

var planeGeometry = new THREE.PlaneGeometry(SIZE, SIZE, SEGMENTS, SEGMENTS);
planeGeometry.rotateX(-Math.PI / 2);
var plane = new THREE.Mesh(planeGeometry, null);
scene.add(plane);

// let gpuSculpt = new GPUSculpt({
//     mesh: plane,
// });

let gpuSkulpt = new SKULPT.GpuSkulpt({
    renderer: renderer,
    mesh: plane,
    size: SIZE,
    res: SEGMENTS,
});

// console.log(gpuSkulpt.__rttRenderTarget2);

let box = new THREE.Mesh(
    new THREE.PlaneGeometry(SIZE, SIZE, 1, 1),
    new THREE.MeshPhongMaterial({
        color: 0xffffff,
        // map: gpuSkulpt.getSculptDisplayTexture()
        map: gpuSkulpt.__rttRenderTarget2.texture
    })
);
box.rotateX(-Math.PI / 2);
box.position.x = SIZE;
scene.add(box);

/*
 * Events to fire upon window resizing.
 */
window.addEventListener("resize", onWindowResize, false);

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

/** 
 * setup sculpt infomation
 */
let rayCaster = new THREE.Raycaster(),
    mouse = new THREE.Vector2();

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
        // sculpt(intersectPoint);
        // console.log(intersectPoint);
        // isSculpting = true;
        if (intersectPoint)
            gpuSkulpt.sculpt(SKULPT.ADD, intersectPoint, options.amount);
    }
}

function onMouseMove(e) {
    if (sculpting) {

        let intersectPoint = getPosition(e);
        // showBrush(intersectPoint);
        // sculpt(intersectPoint);
        // console.log(intersectPoint);
        if (intersectPoint)
            gpuSkulpt.sculpt(SKULPT.ADD, intersectPoint, options.amount);

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
    mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;

    rayCaster.setFromCamera(mouse, camera);

    let intersectInfo = rayCaster.intersectObject(plane);

    //get intersection point
    if (intersectInfo && intersectInfo[0]) {
        // console.log(intersectInfo[0]);
        return intersectInfo[0].point;
    }

    return null;
}

function render() {
    controls.update();

    let dt = clock.getDelta();

    gpuSkulpt.update(dt);
    // renderer.setRenderTarget(null);
    renderer.render(scene, camera);

    requestAnimationFrame(render);
}
render();