/** 
 * used with golden-layout and w2ui
*/

import * as THREE from "../lib/jsm/three.module.js";
import { OrbitControls } from "../lib/jsm/OrbitControls.js";
import { TransformControls } from "../lib/jsm/TransformControls.js";
import * as dat from "../lib/jsm/dat.gui.module.js";

let DW = {};

DW.Engine = (function () {

    function Engine(canvas) {
        if (!canvas) {
            console.error("Canvas can't be finded!");
            return;
        }

        this.canvas = canvas;

        let options = {
            antialias: false,
            allowSleep: false,
            // gravity: new CANNON.Vec3(0, 0, -10),
            message: 'Select an object to start',
            save_as_picture: null
        }

        this.options = options;

        this.world = null;
        this.timestep = 1 / 60;
        this.environment = null;
        this.camera = null;
        this.renderer = null;
        this.control = null;
        this.raycaster = null;
        this.mouse = null;

        this._activeRenderLoops = [];

        this.antialias = false;

        // Engine._initWorld.bind(this)();
        Engine._initScene.bind(this)();
        Engine._initControl.bind(this)();
        Engine._initUI.bind(this)();
        Engine._initGUI.bind(this)();

        window.addEventListener("resize", this.onWindowResize.bind(this), false);
    }

    Engine._initWorld = function () {
        this.world = new CANNON.World();
        this.world.gravity.set(0, 0, -10);
        this.world.broadphase = new CANNON.NaiveBroadphase();
        this.world.solver.iterations = 10;
        this.world.allowSleep = this.options.allowSleep;
    };

    Engine._initScene = function () {
        this.environment = new THREE.Scene();
        // this.environment.fog = new THREE.FogExp2(0x000000, 0.01);

        this.scene = new THREE.Scene();
        this.environment.add(this.scene);

        // console.log(this.canvas.getBoundingClientRect());

        this.camera = new THREE.PerspectiveCamera(75, this.canvas.getBoundingClientRect().width / this.canvas.getBoundingClientRect().height, 0.1, 10000);
        this.camera.position.set(10, 15, 10);
        // this.camera.up.set(0, 0, 1);

        // RENDERER
        this.renderer = new THREE.WebGLRenderer({
            canvas: this.canvas,
            antialias: this.antialias,
            preserveDrawingBuffer: true
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setClearColor(0x9a9a9a);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMapSoft = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        // renderer.sortObjects = false;
        // document.body.appendChild(this.renderer.domElement);

        //添加辅助线
        let helper = new THREE.GridHelper(50, 50);
        // helper.rotateX(Math.PI / 2);
        // helper.material.opacity = 0.75;
        helper.material.transparent = true;
        this.environment.add(helper);

        //添加光源
        let hemiLight = new THREE.HemisphereLight(0xffffff, 0xffffff, 1.0);
        // refreshHemiIntensity();
        hemiLight.color.setHSL(0.59, 0.4, 0.6);
        hemiLight.groundColor.setHSL(0.095, 0.2, 0.75);
        hemiLight.position.set(0, 50, 0);
        this.environment.add(hemiLight);

        let directionLight = new THREE.DirectionalLight(0xffffff, 1);
        directionLight.position.set(-100, 100, 50);
        directionLight.castShadow = true;
        let d = 10;
        directionLight.shadow.camera.left = -d;
        directionLight.shadow.camera.right = d;
        directionLight.shadow.camera.top = d;
        directionLight.shadow.camera.bottom = -d;

        directionLight.shadow.camera.near = 2;
        directionLight.shadow.camera.far = 500;

        directionLight.shadow.mapSize.x = 1024;
        directionLight.shadow.mapSize.y = 1024;

        let sunTarget = new THREE.Object3D();
        directionLight.target = this.environment;

        this.environment.add(sunTarget, directionLight);

        let directionLightHelper = new THREE.DirectionalLightHelper(directionLight, 50);
        this.environment.add(directionLightHelper);

        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
    }

    Engine._initControl = function () {

        this.control = new OrbitControls(this.camera, this.renderer.domElement);
        // this.control.enableDamping = true;
        // this.control.dampingFactor = 0.05;
        // this.control.maxPolarAngle = 1.5;
        this.control.update();

        window.addEventListener('keydown', (event) => {
            // console.log(event);

            switch (event.keyCode) {
                case 110:
                    if (this.transformControls.object) {
                        let position = new THREE.Vector3();
                        position.copy(this.transformControls.object.position);
                        this.control.target = position;
                    }
                    break;
            }

        });

        this.transformControls = new TransformControls(this.camera, this.renderer.domElement);
        this.environment.add(this.transformControls);

        /**
         * Select Controls
        */
        // this.objectCollections = [];

        // this.scene.traverse((child) => {
        //     if (child.children.length == 0)
        //     this.objectCollections.push(child);
        // });

        (function (_canvas, _camera, _scene) {
            // const controls = new OrbitControls(_camera, _canvas);
            // console.log(_scene);

            const raycaster = new THREE.Raycaster();
            const mouse = new THREE.Vector2();

            let onDownPosition = new THREE.Vector2();
            let onUpPosition = new THREE.Vector2();

            let transformControls = this.transformControls;

            /** 
             * 更改模式
            */
            window.addEventListener('keydown', (event) => {
                // console.log(event.keyCode);
                switch (event.code) {
                    case "KeyT": // Translate
                        transformControls.setMode('translate');
                        break;
                    case "KeyR": // Rotate
                        transformControls.setMode('rotate');
                        break;
                    case "KeyS": // Rotate
                        transformControls.setMode('scale');
                        break;
                }
            });

            let box3Helper = new THREE.Box3Helper(new THREE.Box3(), 0xffff00);
            box3Helper.material.depthTest = false;
            box3Helper.material.transparent = true;
            box3Helper.visible = false;
            transformControls.box3Helper = box3Helper;

            transformControls.addEventListener('dragging-changed', (event) => {

                this.control.enabled = !event.value;    // 禁用 OrbitControls

            });
            transformControls.addEventListener('mouseDown', (event) => {

                if (transformControls.object.body) {

                    transformControls.object.body.sleep();

                    document.body.addEventListener('mousemove', handleMove);

                    transformControls.addEventListener('mouseUp', (event) => {

                        transformControls.object.body.wakeUp();

                        document.body.removeEventListener('mousemove', handleMove);

                    });
                }

            });


            function handleMove(event) {

                transformControls.object.body.position.copy(transformControls.object.position);
                transformControls.object.body.velocity.set(0, 0, 0);
                // transformControls.object.body.angularVelocity.set(0, 0, 0);
                // transformControls.object.body.quaternion.setFromAxisAngle(new CANNON.Vec3(0, 0, 1), 0);

            }

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
                    transformControls.box3Helper.visible = false;
                    if (transformControls.box3Helper.parent) {
                        transformControls.box3Helper.parent.remove(transformControls.box3Helper);
                    }

                    let objectCollections = [];

                    _scene.traverse((child) => {
                        if (child.children.length == 0)
                            objectCollections.push(child);
                    });

                    // console.log(objectCollections);


                    let intersects = getIntersects(onUpPosition, objectCollections);

                    if (intersects.length > 0) {

                        let object = intersects[0].object;
                        object.geometry.computeBoundingBox();

                        transformControls.attach(object);

                        transformControls.box3Helper.visible = true;
                        transformControls.box3Helper.box.copy(object.geometry.boundingBox);

                        object.add(transformControls.box3Helper);

                        // console.log(transformControls.box3Helper);
                    }

                }

            }
        }.bind(this))(this.renderer.domElement, this.camera, this.scene);

    }

    Engine._initUI = function () {

        /**
         * download button
         */

        this.options.save_as_picture = function () {
            let link = document.createElement("a");

            document.body.appendChild(link);

            let canvas = this.renderer.domElement;

            link.download = "myimage.png";
            link.href = canvas.toDataURL("image/png");

            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }.bind(this);

    }

    Engine._initGUI = function () {
        this.gui = new dat.GUI();

        this.settings = this.gui.addFolder('Settings');
        // let gravity = this.settings.addFolder('Gravity');
        // gravity.add(this.options.gravity, 'x');
        // gravity.add(this.options.gravity, 'y');
        // gravity.add(this.options.gravity, 'z');
        this.settings.add(this.options, 'allowSleep').onChange((enabled) => {
            if (enabled) {
                this.world.allowSleep = true;
            } else {
                this.world.allowSleep = false;
                console.log('false');
            }
        });

        this.settings.add(this.options, 'antialias').onChange((enabled) => {
            if (enabled) {

                // this.renderer = new THREE.WebGLRenderer({
                //     antialias: true,
                //     preserveDrawingBuffer: true
                // });

                console.log('true');
            } else {

                // this.renderer = new THREE.WebGLRenderer({
                //     antialias: false,
                //     preserveDrawingBuffer: true
                // });

                console.log('false');
            }

        });
        this.gui.add(this.options, 'message');
        this.gui.add(this.options, 'save_as_picture');

    }

    // Engine.prototype.enabledPhysics = function(gravity){

    // }

    Engine.prototype.stopRenderLoop = function (renderFunction) {
        if (!renderFunction) { // 停止全部
            this._activeRenderLoops = [];
            return;
        }
        var index = this._activeRenderLoops.indexOf(renderFunction);
        if (index >= 0) {
            this._activeRenderLoops.splice(index, 1);
        }
    };

    Engine.prototype._renderLoop = function () {

        this.renderer.render(this.environment, this.camera);

        this.control.update();

        // this.world.step(this.timestep);

        // this.scene.traverse((child) => {
        // if ((!this.transformControls.dragging || this.transformControls.object !== child) && child.body) {
        // child.position.copy(child.body.position);
        // child.quaternion.copy(child.body.quaternion);
        // }
        // });

        if (this._activeRenderLoops.length > 0) {

            for (var index = 0; index < this._activeRenderLoops.length; index++) {
                var renderFunction = this._activeRenderLoops[index];
                renderFunction();
            }

        }

        window.requestAnimationFrame(this._boundRenderFunction);

    };

    Engine.prototype.runRenderLoop = function (renderFunction) {
        if (this._activeRenderLoops.indexOf(renderFunction) !== -1) { // 若在 this._activeRenderLoops 中存在
            return;
        }
        if (renderFunction)
            this._activeRenderLoops.push(renderFunction);

        this._boundRenderFunction = this._renderLoop.bind(this);

        window.requestAnimationFrame(this._boundRenderFunction);
    };

    Engine.prototype.onWindowResize = function () {
        // console.log(this.canvas.getBoundingClientRect());
        this.camera.aspect = (this.canvas.getBoundingClientRect().width / this.canvas.getBoundingClientRect().height);
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    return Engine;


})();

export default DW;