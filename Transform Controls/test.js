
//=====================//
//  TransformControls  //
//=====================//

let container, scene, mainCamera, followCamera, renderer, controls, transformControls;

let raycaster = new THREE.Raycaster();
let mouse = new THREE.Vector2();

let box;

// const fbxLoader = new THREE.FBXLoader();
// const gltfLoader = new THREE.GLTFLoader();
// const objLoader = new THREE.OBJLoader();
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

    // SCENE
    scene = new THREE.Scene();

    scene.add(new THREE.GridHelper(10, 10));

    // CAMERA
    mainCamera = new THREE.PerspectiveCamera(
        45,
        window.innerWidth / window.innerHeight,
        0.1,
        5000
    );

    mainCamera.position.set(4, 5, 10);
    // mainCamera.up.set(0, 0, 1);
    mainCamera.lookAt(scene.position);

    // RENDERER
    renderer = new THREE.WebGLRenderer();
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x353535);
    document.body.appendChild(renderer.domElement);
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

    transformControls = new THREE.TransformControls(mainCamera, renderer.domElement);
    transformControls.addEventListener('dragging-changed', function (event) {

        controls.enabled = !event.value;

    });
    scene.add(transformControls);

    /*
     *  Events to fire upon window resizing.
     */
    window.addEventListener("resize", onWindowResize, false);
    function onWindowResize() {
        mainCamera.aspect = window.innerWidth / window.innerHeight;
        mainCamera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    }
}

function initObject() {
    box = new THREE.Mesh(
        new THREE.BoxGeometry(2, 2, 2),
        new THREE.MeshPhongMaterial({
            // color: 0xffffff
            map: textureLoader.load("assert/green.png")
        })
    );
    scene.add(box);


    render();
}


// events

// object picking

function getIntersects(point, objects) {

    mouse.set((point.x * 2) - 1, - (point.y * 2) + 1);

    raycaster.setFromCamera(mouse, mainCamera);

    return raycaster.intersectObjects(objects);

}

var onDownPosition = new THREE.Vector2();
var onUpPosition = new THREE.Vector2();
var onDoubleClickPosition = new THREE.Vector2();

function getMousePosition(dom, x, y) {

    let rect = dom.getBoundingClientRect();

    let p_x = (x - rect.left) / rect.width,
        p_y = (y - rect.top) / rect.height;

    return new THREE.Vector2(p_x, p_y);

}

function handleClick() {

    if (onDownPosition.distanceTo(onUpPosition) === 0) {

        transformControls.detach();

        var intersects = getIntersects(onUpPosition, scene.children);

        //         console.log(scene);

        if (intersects.length > 0) {

            var object = intersects[0].object;

            transformControls.attach(object);

            // console.log(object);

        } else {

            console.log('null');

        }

        render();

    }

}

function onMouseDown(event) {

    // event.preventDefault();

    var array = getMousePosition(renderer.domElement, event.clientX, event.clientY);
    onDownPosition.fromArray(array);

    document.addEventListener('mouseup', onMouseUp, false);

}

function onMouseUp(event) {

    var array = getMousePosition(renderer.domElement, event.clientX, event.clientY);
    onUpPosition.fromArray(array);

    handleClick();

    document.removeEventListener('mouseup', onMouseUp, false);

}

function onTouchStart(event) {

    var touch = event.changedTouches[0];

    var array = getMousePosition(renderer.domElement, touch.clientX, touch.clientY);
    onDownPosition.fromArray(array);

    document.addEventListener('touchend', onTouchEnd, false);

}

function onTouchEnd(event) {

    var touch = event.changedTouches[0];

    var array = getMousePosition(renderer.domElement, touch.clientX, touch.clientY);
    onUpPosition.fromArray(array);

    handleClick();

    document.removeEventListener('touchend', onTouchEnd, false);

}


document.body.addEventListener('mousedown', onMouseDown, false);
document.body.addEventListener('touchstart', onTouchStart, false);

// controls need to be added *after* main logic,
// otherwise controls.enabled doesn't work.

window.addEventListener('keydown', function (event) {

    // console.log(event.keyCode);

    switch (event.keyCode) {
        case 84: // T
            transformControls.setMode("translate");
            break;

        case 82: // R
            transformControls.setMode("rotate");
            break;

        case 83: // S
            transformControls.setMode("scale");
            break;
    }
});

function render() {

    requestAnimationFrame(render);
    renderer.render(scene, mainCamera);

}