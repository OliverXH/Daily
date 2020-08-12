
let objectGroups = [];

const objLoader = new THREE.OBJLoader();
const gltfLoader = new THREE.GLTFLoader();
const renderer = new THREE.WebGLRenderer({ preserveDrawingBuffer: true });
renderer.setClearColor(0x787878);
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

/**
 * download
 */
(function (_canvas) {

    let link = document.createElement("a");
    link.style.zIndex = "20";
    link.style.position = "absolute";
    link.style.top = "20px";
    link.style.left = "20px";
    let btn = document.createElement('button');
    btn.innerHTML = "Save as picture";
    btn.style.fontSize = "20px";
    link.appendChild(btn);
    document.body.appendChild(link);

    link.addEventListener('click', downLoad);

    function downLoad() {

        let canvas = _canvas;

        link.download = "myimage.png";
        link.href = canvas.toDataURL("image/png");

        console.log(link);

    }

})(renderer.domElement);

//创建场景
const scene = new THREE.Scene();

//添加辅助线
let helper = new THREE.GridHelper(400, 100);
// helper.material.opacity = 0.75;
helper.material.transparent = true;
scene.add(helper);

//添加光源
let ambientLight = new THREE.AmbientLight(0x404040, 0.5); // soft white light
let light = new THREE.SpotLight(0xf6f6e9, 0.8);
light.position.y = 25;
light.castShadow = true;
light.shadow.mapSize.height = 4096;
light.shadow.mapSize.width = 4096;
//light.castShadow = true ;
scene.add(ambientLight);
scene.add(light);

//添加相机
const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 2000);
camera.position.set(10, 10, 20);
camera.lookAt(scene.position);
scene.add(camera);

/**
 * Controls
*/
(function (_canvas, _camera, _objectArray) {
    const controls = new THREE.OrbitControls(_camera, _canvas);

    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    let onDownPosition = new THREE.Vector2();
    let onUpPosition = new THREE.Vector2();
    // let onDoubleClickPosition = new THREE.Vector2();

    const transformControls = new THREE.TransformControls(_camera, _canvas);
    scene.add(transformControls);
    transformControls.addEventListener('dragging-changed', (event) => {

        controls.enabled = !event.value;    // 禁用 OrbitControls

    });

    document.body.addEventListener('mousedown', onMouseDown, false);
    // document.body.addEventListener('touchstart', onTouchStart, false);

    function onMouseDown(event) {

        // event.preventDefault();

        onDownPosition = getMousePosition(_canvas, event.clientX, event.clientY);

        document.addEventListener('mouseup', onMouseUp, false);

    }

    function onMouseUp(event) {

        onUpPosition = getMousePosition(_canvas, event.clientX, event.clientY);

        handleClick();

        document.removeEventListener('mouseup', onMouseUp, false);

    }

    function getMousePosition(dom, x, y) {

        let rect = dom.getBoundingClientRect();

        let p_x = (x - rect.left) / rect.width,
            p_y = (y - rect.top) / rect.height;

        return new THREE.Vector2(p_x, p_y);

    }

    // object picking

    function getIntersects(point, objects) {

        mouse.set((point.x * 2) - 1, - (point.y * 2) + 1);

        raycaster.setFromCamera(mouse, _camera);

        return raycaster.intersectObjects(objects);

    }

    function handleClick() {

        if (onDownPosition.distanceTo(onUpPosition) === 0) {

            transformControls.detach();

            let intersects = getIntersects(onUpPosition, _objectArray);

            if (intersects.length > 0) {

                let object = intersects[0].object;

                // console.log(_objectArray);

                transformControls.attach(object);

            }

        }

    }
})(renderer.domElement, camera, objectGroups);


//添加物体
const sphere_geometry = new THREE.SphereGeometry(5, 30, 30);
const sphere_material = Matcap.Purple;
const sphere = new THREE.Mesh(sphere_geometry, sphere_material);
sphere.position.set(0, 0, 0);
sphere.castShadow = true;
scene.add(sphere);
objectGroups.push(sphere);

const box_geometry = new THREE.BoxGeometry(5, 5, 5);
const box_material = Matcap.Orange;
const box = new THREE.Mesh(box_geometry, box_material);
box.position.set(10, 0, 0);
box.castShadow = true;
scene.add(box);
objectGroups.push(box);

gltfLoader.load(
    // "Robots/Mesh/Phantom_LOD0.obj",
    "Robots/Mesh/scene.gltf",
    (obj) => {
        scene.add(obj.scene);

        console.log(obj.scene);

        let model;

        // 在对象以及后代中执行的回调函数。
        obj.scene.traverse((child) => {

            // console.log(child);

            if (child.children.length == 0) {
                // model = child.parent;
                // objectGroups.push(child);
            }

        });

        // console.log(model);

        // objectGroups.push(model);

        // obj.children[0].material = Matcap.Red;

        // obj.children[0].position.x = -10;
        // obj.children[0].position.y = -5;

        // scene.add(phantom);

        console.log(obj.scene);

        render();
    }
);

//添加平面
const planeGeometry = new THREE.PlaneGeometry(1000, 1000);
const planeMaterial = new THREE.MeshPhongMaterial({ color: 0xffffff, side: THREE.DoubleSide });
const plane = new THREE.Mesh(planeGeometry, planeMaterial);
plane.rotation.x = Math.PI * 0.5;
plane.position.set(0, 0, 0);
plane.receiveShadow = true;
// scene.add(plane);

window.addEventListener("resize", onWindowResize, false);
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

// let radius = Math.sqrt(camera.position.x * camera.position.x + camera.position.z * camera.position.z);
let radius = 20;
let theta = 0;

function render() {
    requestAnimationFrame(render);
    renderer.render(scene, camera);

    theta += 0.005;

    // camera.position.x = radius * Math.cos(theta);
    // camera.position.z = radius * Math.sin(theta);
    // camera.lookAt(scene.position);
}

        // render();