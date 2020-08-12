import * as THREE from "https://threejs.org/build/three.module.js";

/** 
 * Trimesh
*/

export default function addRigidBody(_mesh, _mass) {
    let rigidBody = null,
        mass = _mass || 0,
        mesh = null,
        geometry = null;

    if (_mesh.type == "Mesh") {
        mesh = _mesh;
        geometry = new THREE.Geometry().fromBufferGeometry(_mesh.geometry);
    } else {
        console.error("Type Error");
        return;
    }

    console.log(geometry);

    let scale = mesh.scale;

    rigidBody = new CANNON.Body({
        mass: mass
    });

    // let vertices = [], faces = [];

    // How to make a mesh with a single triangle
    // var vertices = [
    //     0, 0, 0, // vertex 0
    //     1, 0, 0, // vertex 1
    //     0, 1, 0  // vertex 2
    // ];
    // var indices = [
    //     0, 1, 2  // triangle 0
    // ];
    // var trimeshShape = new Trimesh(vertices, indices);

    // Add vertices

    for (let i = 0; i < geometry.faces.length; i++) {
        let vertex_a = geometry.faces[i].a;
        let vertex_b = geometry.faces[i].b;
        let vertex_c = geometry.faces[i].c;


        let vertices = [
            scale.x * geometry.vertices[vertex_a].x, scale.y * geometry.vertices[vertex_a].y, scale.z * geometry.vertices[vertex_a].z, // vertex 0
            scale.x * geometry.vertices[vertex_b].x, scale.y * geometry.vertices[vertex_b].y, scale.z * geometry.vertices[vertex_b].z, // vertex 1
            scale.x * geometry.vertices[vertex_c].x, scale.y * geometry.vertices[vertex_c].y, scale.z * geometry.vertices[vertex_c].z  // vertex 2
        ];

        let indices = [
            vertex_a, vertex_b, vertex_c  // triangle 0
        ];

        let trimeshShape = new CANNON.Trimesh(vertices, indices);

        rigidBody.addShape(trimeshShape);

        // let x = scale.x * geometry.vertices[i].x;
        // let y = scale.y * geometry.vertices[i].y;
        // let z = scale.z * geometry.vertices[i].z;

        // vertices.push(new CANNON.Vec3(x, y, z));
    }

    // for (let i = 0; i < geometry.faces.length; i++) {

    //     let a = geometry.faces[i].a;
    //     let b = geometry.faces[i].b;
    //     let c = geometry.faces[i].c;

    //     faces.push([a, b, c]);
    // }

    // console.log(vertices, faces);

    // shape = new CANNON.ConvexPolyhedron(vertices, faces);


    // rigidBody.position.copy(mesh.position);

    console.log(rigidBody);

    return rigidBody;
}