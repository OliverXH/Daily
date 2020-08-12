import * as THREE from "./lib/three.module.js";
import { OrbitControls } from "./lib/OrbitControls.js";
import { GLTFLoader } from "./lib/GLTFLoader.js"
import DW from "./js/dw.module.js";
// import addRigidBody from "./js/addRigidBody.js";
import addRigidBody from "./lib/src/addRigidBody.js";

const gltfLoader = new GLTFLoader();
const textureLoader = new THREE.TextureLoader();

let engine = new DW.Engine();
let scene = engine.scene;
let world = engine.world;
// world.allowSleep = false;

let gui = engine.gui;

//====================================================================================
//  Test 
//====================================================================================
let options = {
    Type: 'sphere',
    Start_and_Reset: function () {
        console.log(options.Type);
        start(options.Type);
    }
};

gui.add(options, 'Start_and_Reset');

let boxes = [];
boxes.length = 0;

gui.add(options, 'Type', { Sphere: 'sphere', Box: 'box' }).onChange((type) => {

    if (boxes.length > 0) {
        changed(type);
    }

    console.log(type);
});

function start(_type) {

    console.log('start');

    if (boxes.length > 0) {
        // console.log(initPosition);

        for (let i = 0; i < boxes.length; i++) {

            boxes[i].body.position.copy(boxes[i].initPosition);
            // boxes[i].body.position.set(boxes[i].initPosition.x, boxes[i].initPosition.y, boxes[i].initPosition.z);

            boxes[i].body.velocity.set(0, 0, 0);
            boxes[i].body.angularVelocity.set(0, 0, 0);
            boxes[i].body.quaternion.setFromAxisAngle(new CANNON.Vec3(0, 0, 1), 0);

        }
    } else {
        console.log('create', _type);

        let boxes_position = new THREE.Vector3(0, 0, 20);

        switch (_type) {
            case 'sphere':
                console.log('0');

                for (let i = 0; i < 1; i++) {
                    for (let j = 0; j < 10; j++) {
                        for (let k = 0; k < 10; k++) {
                            let sphere = createSphere(0.5, 1);

                            scene.add(sphere);
                            world.addBody(sphere.body);

                            sphere.initPosition = new CANNON.Vec3(boxes_position.x + 2 * k - 9.5, boxes_position.y + 2 * j - 9.5, boxes_position.z + 2 * i - 0.5);

                            sphere.body.position.copy(sphere.initPosition);

                            boxes.push(sphere);
                        }
                    }
                }
                break;

            case 'box':
                console.log('1');

                for (let i = 0; i < 1; i++) {
                    for (let j = 0; j < 10; j++) {
                        for (let k = 0; k < 10; k++) {
                            let box = createBox(1, 1);

                            scene.add(box);
                            world.addBody(box.body);

                            box.initPosition = new CANNON.Vec3(boxes_position.x + 2 * k - 9.5, boxes_position.y + 2 * j - 9.5, boxes_position.z + 2 * i - 0.5);

                            box.body.position.copy(box.initPosition);

                            boxes.push(box);
                        }
                    }
                }
                break;
        }

        function createSphere(_radius, _mass) {
            let mesh = new THREE.Mesh(
                new THREE.SphereGeometry(_radius, 30, 30),
                new THREE.MeshLambertMaterial({ color: 0xff0000 })
            );

            mesh.body = new CANNON.Body({
                mass: _mass,
                shape: new CANNON.Sphere(_radius)
            });

            return mesh;
        }

        function createBox(_edgeLength, _mass) {
            let mesh = new THREE.Mesh(
                new THREE.BoxGeometry(_edgeLength, _edgeLength, _edgeLength),
                new THREE.MeshLambertMaterial({ color: 0xff0000 })
            );

            mesh.body = new CANNON.Body({
                mass: _mass,
                shape: new CANNON.Box(new CANNON.Vec3(0.5 * _edgeLength, 0.5 * _edgeLength, 0.5 * _edgeLength))
            });

            return mesh;
        }
    }
}

function changed(_type) {
    switch (_type) {
        case 'sphere':
            boxes.forEach((sphere) => {
                sphere.geometry = new THREE.SphereGeometry(0.5, 30, 30)
                sphere.body.shapes.length = 0;
                sphere.body.addShape(new CANNON.Sphere(0.5));
            });
            break;

        case 'box':
            boxes.forEach((box) => {
                box.geometry = new THREE.BoxGeometry(1, 1, 1);
                box.body.shapes.length = 0;
                box.body.addShape(new CANNON.Box(new CANNON.Vec3(0.5, 0.5, 0.5)));
            });
            break;
    }
}
//======================================================================

let texture = textureLoader.load("assert/Landscape.png");
texture.wrapS = THREE.RepeatWrapping;
texture.wrapT = THREE.RepeatWrapping;
texture.repeat.set(50, 50);
let plane = new THREE.Mesh(
    new THREE.PlaneGeometry(1000, 1000),
    new THREE.MeshLambertMaterial({
        color: 0xffffff,
        map: texture,
        // side: THREE.DoubleSide
    })
);
plane.receiveShadow = true;
scene.add(plane);

plane.body = new CANNON.Body({
    mass: 0,
    shape: new CANNON.Plane()
});
plane.body.position.set(0, 0, -3);
plane.position.copy(plane.body.position);
world.addBody(plane.body);

//======================================================================

//  Add a ramp
let geo = new THREE.BoxGeometry(40.0, 20.0, 0.1);
let rampMesh = new THREE.Mesh(geo, new THREE.MeshLambertMaterial({
    color: 0x666666
}));
scene.add(rampMesh);

let rampShape = new CANNON.Box(new CANNON.Vec3(20.0, 10.0, 0.05));
rampMesh.body = new CANNON.Body({
    mass: 0,
    position: new CANNON.Vec3(0, 20.0, 3.5)
});
rampMesh.body.addShape(rampShape);
world.add(rampMesh.body);
rampMesh.body.quaternion.setFromEuler(0, 0.2, 0.5 * Math.PI, 'ZYX');

rampMesh.position.copy(rampMesh.body.position);
rampMesh.quaternion.copy(rampMesh.body.quaternion);

// Another ramp
rampMesh = new THREE.Mesh(geo, new THREE.MeshLambertMaterial({
    color: 0x666666
}));
scene.add(rampMesh);

rampMesh.body = new CANNON.Body({
    mass: 0,
    position: new CANNON.Vec3(0, -20.0, 3.5)
});
rampMesh.body.addShape(rampShape);
world.add(rampMesh.body);
rampMesh.body.quaternion.setFromEuler(0, 0.2, -0.5 * Math.PI, 'ZYX');

rampMesh.position.copy(rampMesh.body.position);
rampMesh.quaternion.copy(rampMesh.body.quaternion);



//======================================
//  TriMesh Shape
//======================================
let planeTri = new THREE.Mesh(
    new THREE.PlaneGeometry(10, 10),
    new THREE.MeshLambertMaterial({
        color: 0xffffff,
        side: THREE.DoubleSide
    })
);
// scene.add(planeTri);

let vertices = [
    // new CANNON.Vec3(0, 0, 0), // vertex 0
    // new CANNON.Vec3(10, 0, 0), // vertex 1
    // new CANNON.Vec3(0, 10, 0)  // vertex 2

    0, 0, 0,
    10, 0, 0,
    10, 10, 0,
    0, 10, 0
];
let indices = [
    // [0, 1, 2]  // triangle 0

    0, 1, 2,
    1, 2, 3
];
let trimeshShape = new CANNON.Trimesh(vertices, indices);
// let trimeshShape = new CANNON.ConvexPolyhedron(vertices, indices);


planeTri.body = new CANNON.Body({
    mass: 2,
    shape: trimeshShape
});
// trimeshBody.position.set(-5, -5, 5);
// world.addBody(planeTri.body);
console.log(planeTri.body);

//======================================================================

gltfLoader.load(
    "assert/slope.glb",
    (glb) => {
        console.log(glb.scene.children);

        // glb.scene.children[0].material.side = THREE.BackSide;

        glb.scene.children[0].position.set(0, 0, 0);

        scene.add(glb.scene);

        // land.children[0].material = new THREE.MeshLambertMaterial({
        //     color: 0xFFFFFF,
        //     map: texture
        // });

        // land.children.forEach(mesh => {
        //     let rigid_body = addRigidBody(mesh);
        //     world.addBody(rigid_body);
        // });

        glb.scene.children[0].body = addRigidBody(glb.scene.children[0], 20);
        world.addBody(glb.scene.children[0].body);

    }
);

engine.runRenderLoop();



btTransform(Rotation, Translation)
