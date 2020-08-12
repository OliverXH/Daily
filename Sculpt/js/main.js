// import * as THREE from "../lib/three.module.js";
import { OrbitControls } from "../lib/OrbitControls.js";

let renderer, scene, camera;

let rayCaster, mouse, gpuSkulpt;

let clock = new THREE.Clock();

init();

function init() {

    scene = new THREE.Scene();

    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 10000);
    camera.position.set(10, 8, 8);

    // RENDERER
    renderer = new THREE.WebGLRenderer({
        antialias: false,
        preserveDrawingBuffer: true
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0xbfd1e5);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;
    renderer.shadowMap.enabled = false;
    renderer.shadowMapSoft = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    // renderer.sortObjects = false;
    document.body.appendChild(renderer.domElement);

    let control = new OrbitControls(camera, renderer.domElement);
    control.enableDamping = true;
    control.dampingFactor = 0.05;
    // control.maxPolarAngle = 1.5;
    control.update();

    //添加辅助线
    let helper = new THREE.GridHelper(400, 100);
    helper.rotateX(Math.PI / 2);
    // helper.material.opacity = 0.75;
    helper.material.transparent = true;
    // scene.add(helper);

    //添加光源
    let hemiLight = new THREE.HemisphereLight(0xffffff, 0xffffff, 1.0);
    // refreshHemiIntensity();
    hemiLight.color.setHSL(0.59, 0.4, 0.6);
    hemiLight.groundColor.setHSL(0.095, 0.2, 0.75);
    hemiLight.position.set(0, 50, 0);
    scene.add(hemiLight);

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

    scene.add(new THREE.CameraHelper(directionalLight.shadow.camera));

    let directionalLightHelper = new THREE.DirectionalLightHelper(directionalLight, 50);
    scene.add(directionalLightHelper);

    // scene.fog = new THREE.FogExp2(0x000000, 0.01);

    rayCaster = new THREE.Raycaster();
    mouse = new THREE.Vector2();

    // window.addEventListener('resize', window_onResize, false);
    // window.addEventListener('keyup', window_onKeyUp, false);


    (function () {
        const size = 10;
        const segments = 256;

        const planeGeom = new THREE.PlaneGeometry(size, size, segments - 1, segments - 1);

        planeGeom.rotateX(-Math.PI / 2);

        let planeMesh = new THREE.Mesh(planeGeom, null);
        // 稍后使用SKULPT.GpuSkulpt时将指定自定义材质

        scene.add(planeMesh);

        //=========================

        gpuSkulpt = new SKULPT.GpuSkulpt({
            renderer: renderer,
            mesh: planeMesh,
            size: size,
            res: segments,
        });

        //=========================

        window.addEventListener('mousedown', onMouseDown, false);
        window.addEventListener('mousemove', onMouseMove, false);
        window.addEventListener('mouseup', onMouseUp, false);

        function onMouseDown(e) {
            if (e.ctrlKey) {
                let intersectPoint = getPosition(e);
                showBrush(intersectPoint);
                sculpt(intersectPoint)
            }
        }

        function onMouseMove(e) {
            if (e.ctrlKey) {
                let intersectPoint = getPosition(e);
                showBrush(intersectPoint);
                sculpt(intersectPoint)
            }
        }

        function onMouseUp(e) {
            gpuSkulpt.hideCursor();
        }

        function getPosition(e) {
            let rect = renderer.domElement.getBoundingClientRect();

            let p_x = (e.clientX - rect.left) / rect.width,
                p_y = (e.clientY - rect.top) / rect.height;

            mouse = new THREE.Vector2(p_x, p_y);

            // mouse.set((point.x * 2) - 1, - (point.y * 2) + 1);

            raycaster.setFromCamera(mouse, camera);

            let intersectInfo = raycaster.intersectObjects(objects);

            //get intersection point
            if (intersectInfo && intersectInfo[0]) {
                return intersectInfo[0].point;
            }

            return null;
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



        function sculpt(intersectPoint) {
            if (intersectPoint) {
                //do actual sculpting if clicked
                if (event.button === 0) {  //LMB
                    isSculpting = true;
                    gpuSkulpt.sculpt(SKULPT.ADD, intersectPoint, options.amount);
                } else if (event.button === 2) {  //RMB
                    isSculpting = true;
                    gpuSkulpt.sculpt(SKULPT.REMOVE, intersectPoint, options.amount);
                }
                mouseDownButton = event.button;
            }
        }

    })();

    render();
}

function render() {

    // renderer.clear();
    // gpuSkulpt.update(clock.getDelta());  // 必须在清除之后，渲染之前执行此操作
    renderer.render(scene, camera);

    requestAnimationFrame(render);
}