import * as THREE from "./lib/three.module.js";
import { GLTFLoader } from "./lib/GLTFLoader.js"
import DW from "./js/dw.module.js";
import addRigidBody from "./js/addRigidBody.js";

const gltfLoader = new GLTFLoader();
const textureLoader = new THREE.TextureLoader();

let engine = new DW.Engine();
let scene = engine.scene;
let world = engine.world;
// world.allowSleep = false;

let startBtn = document.getElementsByTagName("button")[0];

let boxes = [];

startBtn.onclick = function () {
    if (boxes.length > 0) {
        // console.log(initPosition);

        for (let i = 0; i < boxes.length; i++) {

            boxes[i].body.position.copy(boxes[i].initPosition);

            boxes[i].body.velocity.set(0, 0, 0);
            boxes[i].body.angularVelocity.set(0, 0, 0);
            boxes[i].body.quaternion.setFromAxisAngle(new CANNON.Vec3(0, 0, 1), 0);

        }
    } else {

        let boxes_position = new THREE.Vector3(0, 0, 20);

        for (let i = 0; i < 1; i++) {
            for (let j = 0; j < 10; j++) {
                for (let k = 0; k < 10; k++) {
                    let box;

                    box = new THREE.Mesh(
                        // new THREE.BoxGeometry(1, 1, 1),
                        new THREE.SphereGeometry(0.5, 30, 30),
                        new THREE.MeshLambertMaterial({ color: 0xff0000 })
                    );
                    scene.add(box);

                    box.body = new CANNON.Body({
                        mass: 4,
                        // shape: new CANNON.Box(new CANNON.Vec3(0.5, 0.5, 0.5))
                        shape: new CANNON.Sphere(0.5)
                    });
                    box.initPosition = new CANNON.Vec3(boxes_position.x + 2 * k - 9.5, boxes_position.y + 2 * j - 9.5, boxes_position.z + 2 * i - 0.5);

                    box.body.position.copy(box.initPosition);

                    world.addBody(box.body);

                    boxes.push(box);
                }
            }
        }
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


//======================================================================

gltfLoader.load(
    "assert/slope.glb",
    (glb) => {
        // console.log(glb.scene.children);

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
