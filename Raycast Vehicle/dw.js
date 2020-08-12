
class DW {
    constructor() {
        this.world = null;
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.control = null;
        this.raycaster = null;
        this.mouse = null;

        this.antialias = false;

        this.initWorld();
        this.initScene();
    }

    initWorld() {
        this.world = new CANNON.World();
        this.world.gravity.set(0, -10, 0);
    }

    initScene() {
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.renderer = new THREE.WebGLRenderer({
            // alpha:true,
            antialias: this.antialias
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        document.body.appendChild(this.renderer.domElement);

        this.control = new THREE.OrbitControls(this.camera, this.renderer.domElement);

        this.camera.position.set(0, 10, 10);

        //添加光源
        const pointLight = new THREE.PointLight(0xffffff),
            ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
        pointLight.position.set(50, 55, 50); //设置位置
        pointLight.castShadow = true;
        this.scene.add(pointLight, ambientLight);

        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMapSoft = true;

        this.scene.fog = new THREE.FogExp2(0x000000, 0.01);

        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
    }

    runRenderLoop() {
        requestAnimationFrame(runRenderLoop);

        this.world.step(timestep);

        // for (var i = objAry.length - 1; i >= 0; i--) {
        //     objAry[i].update();
        // }

        this.control.update();

        this.renderer.render(this.scene, this.camera);
    }
}