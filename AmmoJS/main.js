
import * as THREE from "../lib/three.module.js";
import { OrbitControls } from "../lib/OrbitControls.js";

// import DW from "./js/dw.module.js";

//variable declaration

//Ammojs Initialization
Ammo().then(function () {

    //code goes here
    console.log(Ammo);

    let physicsWorld, renderer, scene, camera, clock, control;

    let rigidBodies = [], tmpTrans;
    tmpTrans = new Ammo.btTransform();

    setupPhysicsWorld();
    initScene();
    createBlock();
    createBall();
    render();

    function setupPhysicsWorld() {

        let collisionConfiguration = new Ammo.btDefaultCollisionConfiguration(),
            dispatcher = new Ammo.btCollisionDispatcher(collisionConfiguration),
            overlappingPairCache = new Ammo.btDbvtBroadphase(),
            solver = new Ammo.btSequentialImpulseConstraintSolver();

        physicsWorld = new Ammo.btDiscreteDynamicsWorld(dispatcher, overlappingPairCache, solver, collisionConfiguration);
        physicsWorld.setGravity(new Ammo.btVector3(0, -10, 0));

    }

    function initScene() {

        //create clock for timing
        clock = new THREE.Clock();

        // RENDERER
        renderer = new THREE.WebGLRenderer({
            antialias: false,
            preserveDrawingBuffer: true
        });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setClearColor(0x787878);
        // renderer.sortObjects = false;
        document.body.appendChild(renderer.domElement);

        scene = new THREE.Scene();

        camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 10000);
        camera.position.set(30, 30, 40);
        camera.lookAt(scene.position);
        // camera.up.set(0, 0, 1);

        control = new OrbitControls(camera, renderer.domElement);
        control.enableDamping = true;
        control.dampingFactor = 0.05;
        control.update();

        //添加辅助线
        let helper = new THREE.GridHelper(400, 100);
        helper.rotateX(Math.PI / 2);
        // helper.material.opacity = 0.75;
        // helper.material.transparent = true;
        helper.rotateX(-Math.PI / 2);
        scene.add(helper);

        //添加光源
        let ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        let spotLight = new THREE.PointLight(0xffffff, 1);
        spotLight.position.set(20, 40, 50);
        scene.add(spotLight, ambientLight);

        let plane = new THREE.Mesh(
            new THREE.PlaneGeometry(1000, 1000),
            new THREE.MeshLambertMaterial({
                color: 0xffffff,
                // side: THREE.DoubleSide
            })
        );
        plane.receiveShadow = true;
        plane.rotateX(-Math.PI / 2);
        // scene.add(plane);

        window.addEventListener("resize", onWindowResize, false);

        function onWindowResize() {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
        }

    }

    function render() {

        let deltaTime = clock.getDelta();

        updatePhysics(deltaTime);
        // updatePhysics(1 / 60);

        control.update();

        renderer.render(scene, camera);

        requestAnimationFrame(render);

    }


    function createBlock() {

        let pos = { x: 0, y: 0, z: 0 };
        let scale = { x: 100, y: 1, z: 100 };
        let quat = { x: 0, y: 0, z: 0, w: 1 };
        let mass = 0;

        //threeJS Section
        let blockPlane = new THREE.Mesh(new THREE.BoxBufferGeometry(), new THREE.MeshPhongMaterial({ color: 0xa0afa4 }));

        blockPlane.position.set(pos.x, pos.y, pos.z);
        blockPlane.scale.set(scale.x, scale.y, scale.z);

        blockPlane.castShadow = true;
        blockPlane.receiveShadow = true;

        scene.add(blockPlane);


        //Ammojs Section
        let transform = new Ammo.btTransform();
        transform.setIdentity();
        transform.setOrigin(new Ammo.btVector3(pos.x, pos.y, pos.z));
        transform.setRotation(new Ammo.btQuaternion(quat.x, quat.y, quat.z, quat.w));
        let motionState = new Ammo.btDefaultMotionState(transform);

        let shape = new Ammo.btBoxShape(new Ammo.btVector3(scale.x * 0.5, scale.y * 0.5, scale.z * 0.5));
        shape.setMargin(0.05);

        let localInertia = new Ammo.btVector3(0, 0, 0);
        shape.calculateLocalInertia(mass, localInertia);

        let rbInfo = new Ammo.btRigidBodyConstructionInfo(mass, motionState, shape, localInertia);
        let body = new Ammo.btRigidBody(rbInfo);
        body.setRestitution(0.8);


        physicsWorld.addRigidBody(body);

    }

    function createBall() {

        let pos = { x: 0, y: 20, z: 0 };
        let radius = 2;
        let quat = { x: 0, y: 0, z: 0, w: 1 };
        let mass = 1;

        //threeJS Section
        let ball = new THREE.Mesh(new THREE.SphereBufferGeometry(radius, 30, 30), new THREE.MeshPhongMaterial({ color: 0xff0505 }));

        ball.position.set(pos.x, pos.y, pos.z);

        ball.castShadow = true;
        ball.receiveShadow = true;

        scene.add(ball);


        //Ammojs Section
        let transform = new Ammo.btTransform();
        transform.setIdentity();
        transform.setOrigin(new Ammo.btVector3(pos.x, pos.y, pos.z));
        transform.setRotation(new Ammo.btQuaternion(quat.x, quat.y, quat.z, quat.w));
        let motionState = new Ammo.btDefaultMotionState(transform);

        let colShape = new Ammo.btSphereShape(radius);
        colShape.setMargin(0.05);

        let localInertia = new Ammo.btVector3(0, 0, 0);
        colShape.calculateLocalInertia(mass, localInertia);

        let rbInfo = new Ammo.btRigidBodyConstructionInfo(mass, motionState, colShape, localInertia);
        let body = new Ammo.btRigidBody(rbInfo);
        body.setRestitution(0.8);

        physicsWorld.addRigidBody(body);

        ball.body = body;
        rigidBodies.push(ball);

        // let state = body.getMotionState();
        // console.log(state.getWorldTransform());
    }

    function updatePhysics(deltaTime) {

        // Step world
        physicsWorld.stepSimulation(deltaTime, 10);

        // Update rigid bodies
        for (let i = 0; i < rigidBodies.length; i++) {
            let objThree = rigidBodies[i];
            let objAmmo = objThree.userData.physicsBody;
            let ms = objAmmo.getMotionState();
            if (ms) {

                ms.getWorldTransform(tmpTrans);

                let p = tmpTrans.getOrigin();
                // console.log(p);
                let q = tmpTrans.getRotation();
                objThree.position.set(p.x(), p.y(), p.z());
                objThree.quaternion.set(q.x(), q.y(), q.z(), q.w());

            }
        }

    }


});
