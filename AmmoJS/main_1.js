
import * as THREE from "./lib/three.module.js";
// import { OrbitControls } from "../lib/OrbitControls.js";
import { GLTFLoader } from "./lib/GLTFLoader.js";
import DW from "./js/dw.module.js";

//letiable declaration

//Ammojs Initialization
Ammo().then(function () {

    //code goes here
    // console.log(DW);

    const gltfLoader = new GLTFLoader();
    const textureLoader = new THREE.TextureLoader();

    let engine = new DW.Engine();
    let ammoJS = new DW.AmmoJSPlugin();
    let scene = engine.scene;
    let world = engine.world;

    let gui = engine.gui;

    initGUI();

    createBox();
    createSphere();
    createCylinder();

    let texture = textureLoader.load("assert/grid.png");
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(20, 20);
    let plane = new THREE.Mesh(
        new THREE.PlaneGeometry(20, 20),
        new THREE.MeshLambertMaterial({
            color: 0xffffff,
            map: texture,
            // side: THREE.DoubleSide
        })
    );
    plane.receiveShadow = true;
    scene.add(plane);

    plane.rotateX(-Math.PI / 2);

    plane.body = ammoJS.generatePhysicsBody(plane, { type: 'rigid', mass: 0 });

    world.addRigidBody(plane.body);

    gltfLoader.load(
        "assert/world.glb",
        (glb) => {
            console.log(glb);

            let model = glb.scene;

            console.log(model);

            // glb.scene.children[0].material.side = THREE.BackSide;

            // glb.scene.children[0].position.set(30, 4, 0);
            // glb.scene.children[0].rotateX(-Math.PI / 2);

            // glb.scene.children[0].geometry.type = 'ConvexHull';

            scene.add(model);

            // model.body = ammoJS.generatePhysicsBody(model, { type: 'rigid', mass: 20, restitution: 0.8 });
            // world.addRigidBody(model.body);

        },
        (event) => {
            console.log('loading...');
        }
    );

    function initGUI() {
        let options = {
            Box: createBox,
            Sphere: createSphere,
            Cylinder: createCylinder,
        }

        let add = gui.addFolder('Add');
        add.add(options, 'Box');
        add.add(options, 'Sphere');
        add.add(options, 'Cylinder');
    }

    function createBox() {

        //threeJS Section
        let blockPlane = new THREE.Mesh(new THREE.BoxBufferGeometry(1, 1, 1), new THREE.MeshPhongMaterial({ color: 0xa0afa4 }));

        blockPlane.position.set(0, 2, 0);

        // blockPlane.rotateX(Math.PI / 24);

        // blockPlane.castShadow = true;
        // blockPlane.receiveShadow = true;

        scene.add(blockPlane);

        // console.log(blockPlane);

        //Ammojs Section

        let body = ammoJS.generatePhysicsBody(blockPlane, { type: 'rigid', mass: 5, friction: 0.2 });

        blockPlane.body = body;

        world.addRigidBody(body);

    }


    function createSphere() {

        //threeJS Section
        let ball = new THREE.Mesh(new THREE.SphereBufferGeometry(0.2, 30, 30), new THREE.MeshPhongMaterial({ color: 0xff0505 }));

        ball.position.set(0, 3, 0);

        // ball.castShadow = true;
        // ball.receiveShadow = true;

        scene.add(ball);
        // console.log(ball);

        //Ammojs Section

        let body = ammoJS.generatePhysicsBody(ball, { type: 'rigid', mass: 6, restitution: 0.8 });

        world.addRigidBody(body);

        ball.body = body;
    }

    function createCylinder() {
        let cylinder = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.5, 30), new THREE.MeshPhongMaterial({ color: 0xf2f505 }));

        cylinder.position.set(1, 5, 0);
        cylinder.rotateX(Math.PI / 2);

        scene.add(cylinder);

        // cylinder.castShadow = true;
        // cylinder.receiveShadow = true;

        cylinder.body = ammoJS.generatePhysicsBody(cylinder, { type: 'rigid', mass: 6 });

        world.addRigidBody(cylinder.body);
    }

    engine.runRenderLoop();

});
