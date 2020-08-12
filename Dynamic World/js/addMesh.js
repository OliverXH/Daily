/**
 * Visualization
 */

function addMesh(body, _material) {
    let wireframe = this.settings.renderMode === "wireframe";
    let obj = new THREE.Object3D();
    let material = _material || new THREE.MeshLambertMaterial({ color: 0xff0000 });

    for (let l = 0; l < body.shapes.length; l++) {
        let shape = body.shapes[l];

        let mesh;

        switch (shape.type) {

            case CANNON.Shape.types.SPHERE:
                let sphere_geometry = new THREE.SphereGeometry(shape.radius, 8, 8);
                mesh = new THREE.Mesh(sphere_geometry, material);
                break;

            case CANNON.Shape.types.PARTICLE:
                mesh = new THREE.Mesh(this.particleGeo, this.particleMaterial);
                let s = this.settings;
                mesh.scale.set(s.particleSize, s.particleSize, s.particleSize);
                break;

            case CANNON.Shape.types.PLANE:
                let plane_geometry = new THREE.PlaneGeometry(10, 10, 4, 4);
                mesh = new THREE.Object3D();
                let submesh = new THREE.Object3D();
                let ground = new THREE.Mesh(plane_geometry, material);
                ground.scale.set(100, 100, 100);
                submesh.add(ground);

                ground.castShadow = true;
                ground.receiveShadow = true;

                mesh.add(submesh);
                break;

            case CANNON.Shape.types.BOX:
                let box_geometry = new THREE.BoxGeometry(shape.halfExtents.x * 2,
                    shape.halfExtents.y * 2,
                    shape.halfExtents.z * 2);
                mesh = new THREE.Mesh(box_geometry, material);
                break;

            case CANNON.Shape.types.CONVEXPOLYHEDRON:
                let geo = new THREE.Geometry();

                // Add vertices
                for (let i = 0; i < shape.vertices.length; i++) {
                    let v = shape.vertices[i];
                    geo.vertices.push(new THREE.Vector3(v.x, v.y, v.z));
                }

                for (let i = 0; i < shape.faces.length; i++) {
                    let face = shape.faces[i];

                    // add triangles
                    let a = face[0];
                    for (let j = 1; j < face.length - 1; j++) {
                        let b = face[j];
                        let c = face[j + 1];
                        geo.faces.push(new THREE.Face3(a, b, c));
                    }
                }
                geo.computeBoundingSphere();
                geo.computeFaceNormals();
                mesh = new THREE.Mesh(geo, material);
                break;

            case CANNON.Shape.types.HEIGHTFIELD:
                let geometry = new THREE.Geometry();

                let v0 = new CANNON.Vec3();
                let v1 = new CANNON.Vec3();
                let v2 = new CANNON.Vec3();
                for (let xi = 0; xi < shape.data.length - 1; xi++) {
                    for (let yi = 0; yi < shape.data[xi].length - 1; yi++) {
                        for (let k = 0; k < 2; k++) {
                            shape.getConvexTrianglePillar(xi, yi, k === 0);
                            v0.copy(shape.pillarConvex.vertices[0]);
                            v1.copy(shape.pillarConvex.vertices[1]);
                            v2.copy(shape.pillarConvex.vertices[2]);
                            v0.vadd(shape.pillarOffset, v0);
                            v1.vadd(shape.pillarOffset, v1);
                            v2.vadd(shape.pillarOffset, v2);
                            geometry.vertices.push(
                                new THREE.Vector3(v0.x, v0.y, v0.z),
                                new THREE.Vector3(v1.x, v1.y, v1.z),
                                new THREE.Vector3(v2.x, v2.y, v2.z)
                            );
                            let i = geometry.vertices.length - 3;
                            geometry.faces.push(new THREE.Face3(i, i + 1, i + 2));
                        }
                    }
                }
                geometry.computeBoundingSphere();
                geometry.computeFaceNormals();
                mesh = new THREE.Mesh(geometry, material);
                break;

            case CANNON.Shape.types.TRIMESH:
                let trimesh_geometry = new THREE.Geometry();

                // let v0 = new CANNON.Vec3();
                // let v1 = new CANNON.Vec3();
                // let v2 = new CANNON.Vec3();
                for (let i = 0; i < shape.indices.length / 3; i++) {
                    shape.getTriangleVertices(i, v0, v1, v2);
                    trimesh_geometry.vertices.push(
                        new THREE.Vector3(v0.x, v0.y, v0.z),
                        new THREE.Vector3(v1.x, v1.y, v1.z),
                        new THREE.Vector3(v2.x, v2.y, v2.z)
                    );
                    let j = trimesh_geometry.vertices.length - 3;
                    trimesh_geometry.faces.push(new THREE.Face3(j, j + 1, j + 2));
                }
                trimesh_geometry.computeBoundingSphere();
                trimesh_geometry.computeFaceNormals();
                mesh = new THREE.Mesh(trimesh_geometry, material);
                break;

            default:
                throw "Visual type not recognized: " + shape.type;
        }

        mesh.receiveShadow = true;
        mesh.castShadow = true;
        if (mesh.children) {
            for (let i = 0; i < mesh.children.length; i++) {
                mesh.children[i].castShadow = true;
                mesh.children[i].receiveShadow = true;
                if (mesh.children[i]) {
                    for (let j = 0; j < mesh.children[i].length; j++) {
                        mesh.children[i].children[j].castShadow = true;
                        mesh.children[i].children[j].receiveShadow = true;
                    }
                }
            }
        }

        let o = body.shapeOffsets[l];
        let q = body.shapeOrientations[l];
        mesh.position.set(o.x, o.y, o.z);
        mesh.quaternion.set(q.x, q.y, q.z, q.w);

        obj.add(mesh);
    }

    return obj;
};