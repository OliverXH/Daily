import * as THREE from "../lib/three.module.js";
import { OrbitControls } from "../lib/OrbitControls.js";
import { TransformControls } from "../lib/TransformControls.js";
import * as dat from "../lib/dat.gui.module.js";

let DW = {};

DW.Engine = (function () {

    function Engine() {
        let options = {
            antialias: false,
            allowSleep: false,
            gravity: new CANNON.Vec3(0, 0, -10),
            message: 'three.js',
            speed: 0.8,
            displayOutline: false,
            button: function () { console.log("Hello") },
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

        Engine._initWorld.bind(this)();
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
        this.scene = new THREE.Scene();
        this.environment.add(this.scene);

        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 10000);
        this.camera.position.set(30, 60, 40);
        this.camera.up.set(0, 0, 1);

        // RENDERER
        this.renderer = new THREE.WebGLRenderer({
            antialias: this.antialias,
            preserveDrawingBuffer: true
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setClearColor(0x787878);
        // renderer.sortObjects = false;
        document.body.appendChild(this.renderer.domElement);

        //添加辅助线
        let helper = new THREE.GridHelper(400, 100);
        helper.rotateX(Math.PI / 2);
        // helper.material.opacity = 0.75;
        helper.material.transparent = true;
        // this.environment.add(helper);

        //添加光源
        let ambientLight = new THREE.AmbientLight(0xffffff, 0.6); // soft white light
        let spotLight = new THREE.PointLight(0xffffff, 1);
        spotLight.position.set(20, 20, 50);
        // spotLight.castShadow = true;
        // spotLight.shadow.mapSize.height = 4096;
        // spotLight.shadow.mapSize.width = 4096;
        //spotLight.castShadow = true ;
        this.environment.add(spotLight, ambientLight);

        // const spotLightHelper = new THREE.SpotLightHelper(spotLight);
        // this.environment.add(spotLightHelper);

        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMapSoft = true;

        // this.environment.fog = new THREE.FogExp2(0x000000, 0.01);

        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
    }

    Engine._initControl = function () {

        this.control = new OrbitControls(this.camera, this.renderer.domElement);
        this.control.enableDamping = true;
        this.control.dampingFactor = 0.05;
        // this.control.maxPolarAngle = 1.5;
        this.control.update();

        window.addEventListener('keydown', (event) => {
            // console.log(event.keyCode);

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

                    let objectCollections = [];

                    _scene.traverse((child) => {
                        if (child.children.length == 0)
                            objectCollections.push(child);
                    });

                    // console.log(objectCollections);


                    let intersects = getIntersects(onUpPosition, objectCollections);

                    if (intersects.length > 0) {

                        let object = intersects[0].object;

                        // console.log(object);

                        transformControls.attach(object);

                    }

                }

            }
        }.bind(this))(this.renderer.domElement, this.camera, this.scene);

    }

    Engine._initUI = function () {

        /**
         * download button
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

                // console.log(link);

            }

        })(this.renderer.domElement);

    }

    Engine._initGUI = function () {
        const gui = new dat.GUI();

        let world = gui.addFolder('World');
        world.add(this.options.gravity, 'x');
        world.add(this.options, 'allowSleep').onChange((enabled) => {
            if (enabled) {
                this.world.allowSleep = true;
            } else {
                this.world.allowSleep = false;
                console.log('false');
            }
        });

        let scene = gui.addFolder('Scene');
        scene.add(this.options, 'antialias').onChange((enabled) => {
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
        gui.add(this.options, 'message');
        gui.add(this.options, 'speed', -5, 5);
        gui.add(this.options, 'displayOutline');
        gui.add(this.options, 'button');
        return;
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

        this.world.step(this.timestep);

        this.scene.traverse((child) => {
            if ((!this.transformControls.dragging || this.transformControls.object !== child) && child.body) {
                child.position.copy(child.body.position);
                child.quaternion.copy(child.body.quaternion);
            }
        });

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
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    return Engine;


})();

export default DW;