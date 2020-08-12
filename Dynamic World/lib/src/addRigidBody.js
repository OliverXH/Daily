import * as THREE from "../three.module.js";

/** 
 * Convex
*/

export default function addRigidBody(_mesh, _mass) {
    let shape, rigidBody, mass, mesh, geometry;

    if (_mesh.type == "Mesh") {
        mesh = _mesh;
        geometry = new THREE.Geometry().fromBufferGeometry(_mesh.geometry);
    } else {
        console.error("Type Error");
        return;
    }

    // console.log(geometry);

    let scale = mesh.scale;

    mass = _mass || 0;

    let vertices = [], faces = [];

    // Add vertices
    for (let i = 0; i < geometry.vertices.length; i++) {

        let x = scale.x * geometry.vertices[i].x;
        let y = scale.y * geometry.vertices[i].y;
        let z = scale.z * geometry.vertices[i].z;

        vertices.push(new CANNON.Vec3(x, y, z));
    }

    for (let i = 0; i < geometry.faces.length; i++) {

        let a = geometry.faces[i].a;
        let b = geometry.faces[i].b;
        let c = geometry.faces[i].c;

        faces.push([a, b, c]);
    }

    // console.log(vertices, faces);

    shape = new CANNON.ConvexPolyhedron(vertices, faces);

    rigidBody = new CANNON.Body({
        mass: mass,
        shape: shape
    });
    // rigidBody.position.copy(mesh.position);

    // console.log(rigidBody);

    return rigidBody;
}