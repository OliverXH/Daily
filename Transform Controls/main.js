
//=====================//
//  TransformControls  //
//=====================//

import * as THREE from 'https://threejs.org/build/three.module.js';

import { OrbitControls } from 'https://threejs.org/examples/jsm/controls/OrbitControls.js';
import { TransformControls } from 'https://threejs.org/examples/jsm/controls/TransformControls.js';

var cameraPersp, cameraOrtho, currentCamera;
var scene, renderer, control, orbit;

const textureLoader = new THREE.TextureLoader();

init();
render();

function init() {

    renderer = new THREE.WebGLRenderer();
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x353535);
    document.body.appendChild(renderer.domElement);

    const aspect = window.innerWidth / window.innerHeight;

    cameraPersp = new THREE.PerspectiveCamera(50, aspect, 0.01, 30000);
    cameraOrtho = new THREE.OrthographicCamera(- 600 * aspect, 600 * aspect, 600, - 600, 0.01, 30000);
    currentCamera = cameraPersp;

    currentCamera.position.set(1000, 500, 1000);
    currentCamera.lookAt(0, 200, 0);

    scene = new THREE.Scene();
    scene.add(new THREE.GridHelper(1000, 10));

    /**
     *  添加光源
     */
    const pointLight = new THREE.PointLight(0xffffff),
        ambientLight = new THREE.AmbientLight(0xffffff, 0.4);

    pointLight.position.set(500, 550, 500); //设置位置
    pointLight.castShadow = true;
    scene.add(pointLight);
    scene.add(ambientLight);

    /**
     * 物体
     */
    var geometry = new THREE.BoxBufferGeometry(200, 200, 200);
    var material = new THREE.MeshPhongMaterial({ map: textureLoader.load("assert/red.png"), transparent: false });
    var mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    /**
     * OrbitControls
     */
    orbit = new OrbitControls(currentCamera, renderer.domElement);
    orbit.update();
    orbit.addEventListener('change', render);

    /**
     * TransformControls
     */
    control = new TransformControls(currentCamera, renderer.domElement);
    control.addEventListener('change', render);

    control.addEventListener('dragging-changed', function (event) {

        orbit.enabled = !event.value;

    });

    control.attach(mesh);
    scene.add(control);

    window.addEventListener('resize', onWindowResize, false);

    window.addEventListener('keydown', function (event) {

        // console.log(event.keyCode);

        switch (event.keyCode) {

            case 81: // Q
                control.setSpace(control.space === "local" ? "world" : "local");
                break;

            case 16: // Shift
                control.setTranslationSnap(100);
                control.setRotationSnap(THREE.MathUtils.degToRad(15));
                control.setScaleSnap(0.25);
                break;

            case 84: // T
                control.setMode("translate");
                break;

            case 82: // R
                control.setMode("rotate");
                break;

            case 83: // S
                control.setMode("scale");
                break;

            case 67: // C
                const position = currentCamera.position.clone();

                currentCamera = currentCamera.isPerspectiveCamera ? cameraOrtho : cameraPersp;
                currentCamera.position.copy(position);

                orbit.object = currentCamera;
                control.camera = currentCamera;

                currentCamera.lookAt(orbit.target.x, orbit.target.y, orbit.target.z);
                onWindowResize();
                break;

            case 86: // V
                const randomFoV = Math.random() + 0.1;
                const randomZoom = Math.random() + 0.1;

                cameraPersp.fov = randomFoV * 160;
                cameraOrtho.bottom = - randomFoV * 500;
                cameraOrtho.top = randomFoV * 500;

                cameraPersp.zoom = randomZoom * 5;
                cameraOrtho.zoom = randomZoom * 5;
                onWindowResize();
                break;

            case 187:
            case 107: // +, =, num+
                control.setSize(control.size + 0.1);
                break;

            case 189:
            case 109: // -, _, num-
                control.setSize(Math.max(control.size - 0.1, 0.1));
                break;

            case 88: // X
                control.showX = !control.showX;
                break;

            case 89: // Y
                control.showY = !control.showY;
                break;

            case 90: // Z
                control.showZ = !control.showZ;
                break;

            case 32: // Spacebar
                control.enabled = !control.enabled;
                break;

        }

    });

    window.addEventListener('keyup', function (event) {

        switch (event.keyCode) {

            case 16: // Shift
                control.setTranslationSnap(null);
                control.setRotationSnap(null);
                control.setScaleSnap(null);
                break;

        }

    });

}

function onWindowResize() {

    const aspect = window.innerWidth / window.innerHeight;

    cameraPersp.aspect = aspect;
    cameraPersp.updateProjectionMatrix();

    cameraOrtho.left = cameraOrtho.bottom * aspect;
    cameraOrtho.right = cameraOrtho.top * aspect;
    cameraOrtho.updateProjectionMatrix();

    renderer.setSize(window.innerWidth, window.innerHeight);

    render();

}

function render() {

    renderer.render(scene, currentCamera);

}