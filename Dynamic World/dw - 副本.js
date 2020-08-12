import * as THREE from "https://threejs.org/build/three.module.js";
import { OrbitControls } from "https://threejs.org/examples/jsm/controls/OrbitControls.js";

let DW = {};

DW.Engine = (function () {

    function Engine() {
        this.world = null;
        this.timestep = 1 / 60;
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.control = null;
        this.raycaster = null;
        this.mouse = null;

        this._frameHandler = null;
        this._activeRenderLoops = [];

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

        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.camera.position.set(30, 60, 40);
        this.camera.up.set(0, 0, 1);

        // RENDERER
        this.renderer = new THREE.WebGLRenderer({
            antialias: this.antialias
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setClearColor(0xffffff);
        // renderer.sortObjects = false;
        document.body.appendChild(this.renderer.domElement);

        this.control = new OrbitControls(this.camera, this.renderer.domElement);

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

        this.renderer.render(this.scene, this.camera);

        this.control.update();

        this.world.step(this.timestep);

        for (var index = 0; index < this._activeRenderLoops.length; index++) {
            var renderFunction = this._activeRenderLoops[index];
            renderFunction();
        }

        if (this._activeRenderLoops.length > 0) {
            this._frameHandler = this._queueNewFrame(this._boundRenderFunction);
        }

    };

    Engine.prototype.runRenderLoop = function (renderFunction) {
        if (this._activeRenderLoops.indexOf(renderFunction) !== -1) { // 若在 this._activeRenderLoops 中存在
            return;
        }
        this._activeRenderLoops.push(renderFunction);

        this._boundRenderFunction = this._renderLoop.bind(this);
        this._frameHandler = this._queueNewFrame(this._boundRenderFunction);
    };

    Engine.prototype._queueNewFrame = function (bindedRenderFunction) {
        window.requestAnimationFrame(bindedRenderFunction);
        return 0;
    };

    Engine.prototype.onWindowResize = function () {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    return Engine;

})();


/** 
 * 
 */
DW.BoxEmitter = (function () {

    function BoxEmitter() {
        this.direction = new THREE.Vector3(0, 1, 0);
        this.width = 1.0;   // x
        this.height = 1.0;  // y
        this.depth = 1.0;   // z
    }



    return BoxEmitter;

})();

/** 
 * 
*/
DW.Particle = (function () {

    function Particle() {
        this.position = new THREE.Vector3(0.0, 0.0, 0.0);
        this.setVelocity(0, 0);
        this.life = 0;
    };

    Particle.prototype = {
        setVelocity: function (dir, speed) {
            this.velocity = {
                x: dir.normalize().x * speed,
                y: dir.normalize().y * speed,
                z: dir.normalize().z * speed
            };
        }
    };

    return Particle;

})();

/** 
 * Points Render
*/
DW.PointsRender = (function(){

    function PointsRender(){

    }

    return PointsRender;
})();

/** 
 * Sprit Render
*/
DW.SpritRender = (function(){

    function SpritRender(){
        
    }

    return SpritRender;
})();

/** 
 * Mesh Render
*/
DW.MeshRender = (function(){

    function MeshRender(){
        
    }

    return MeshRender;
})();


function Obj3d(obj, shape, geometry) {
    this.shape = shape;
    this.geometry = geometry;
    this.body = new CANNON.Body({
        position: obj.position || {
            x: 0,
            y: 0,
            z: 0
        },
        mass: obj.mass || 0,
        shape: this.shape
    });
    this.mesh = new THREE.Mesh(this.geometry, obj.material || new THREE.MeshNormalMaterial({
        side: THREE.DoubleSide
    }));
    this.mesh.castShadow = true;
    this.mesh.receiveShadow = true;
    world.add(this.body);
    if (obj.parent) obj.parent.add(this.mesh);
    else scene.add(this.mesh);
    this.update = function () {
        this.mesh.position.copy(this.body.position);
        this.mesh.quaternion.copy(this.body.quaternion);
    }
    this.update();
    if (obj.mass) objAry.push(this);
    if (obj.name) this.mesh.name = obj.name;
}

function Sphere(obj) {
    this.shape = new CANNON.Sphere(obj.radius);
    this.geometry = new THREE.SphereGeometry(obj.radius, 64, 64);
    Obj3d.call(this, obj, this.shape, this.geometry);
}

function Box(obj) {
    this.shape = new CANNON.Box(new CANNON.Vec3(obj.size.x / 2, obj.size.y / 2, obj.size.z / 2));
    this.geometry = new THREE.BoxGeometry(obj.size.x, obj.size.y, obj.size.z);
    Obj3d.call(this, obj, this.shape, this.geometry);
}

function Plane(obj) {
    this.shape = new CANNON.Plane();
    this.geometry = new THREE.PlaneGeometry(obj.size.x, obj.size.y);
    Obj3d.call(this, obj, this.shape, this.geometry);
}

function Floor(obj) {
    obj.size = {
        x: 1000,
        y: 1000
    };
    obj.name = 'floor';
    Plane.call(this, obj);
    this.body.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 2);
    this.update();
}
// why? only use when .prototype was called
// Floor.prototype = Object.create(Plane.prototype);
// Floor.prototype.constructor = Floor;



export default DW;