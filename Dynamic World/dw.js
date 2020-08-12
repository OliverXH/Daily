/** 
 * three.js
 * 
 * OrbitControls
 * 
*/

let DW = {};

DW.Engine = (function () {

    function Engine(_canvas) {
        this.canvas = _canvas;
        this.world = null;
        this.timestep = 1 / 60;
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.controls = null;
        this.raycaster = null;
        this.mouse = null;

        this._frameHandler = null;
        this._activeRenderLoops = [];

        this.enabledPhysics = false;
        this.antialias = false;

        this._initWorld();
        this._initScene();

        window.addEventListener("resize", this.onWindowResize.bind(this), false);
    }

    Engine.prototype._initWorld = function () {
        this.world = new CANNON.World();
        this.world.gravity.set(0, 0, -10);
        this.world.broadphase = new CANNON.NaiveBroadphase();
        this.world.solver.iterations = 10;
        this.world.allowSleep = true;
    }

    Engine.prototype._initScene = function () {
        this.scene = new THREE.Scene();

        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 10000);
        this.camera.position.set(30, 60, 40);
        // this.camera.up.set(0, 0, 1);

        // RENDERER
        this.renderer = new THREE.WebGLRenderer({
            antialias: this.antialias,
            preserveDrawingBuffer: true
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setClearColor(0xeeeeee);
        // renderer.sortObjects = false;
        document.body.appendChild(this.renderer.domElement);

        this.control = new THREE.OrbitControls(this.camera, this.renderer.domElement);
        this.control.enableDamping = true;
        this.control.dampingFactor = 0.05;
        this.control.update();

        //添加光源
        const pointLight = new THREE.PointLight(0xffffff),
            ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
        pointLight.position.set(50, 55, 50); //设置位置
        pointLight.castShadow = true;
        this.scene.add(pointLight, ambientLight);

        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMapSoft = true;

        // this.scene.fog = new THREE.FogExp2(0x000000, 0.01);

        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
    }

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

        this.renderer.render(this.scene, this.camera);

        this.control.update();

        this.world.step(this.timestep);

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

