
var initScene, render, renderer, scene, camera, controls, world;
let plane = {}, ball = {};
var origins = [], bowlings = [];
var timeStep = 1 / 60;

window.onload = initScene();

function initScene() {

    world = new CANNON.World();
    world.gravity.set(0, 0, -320);
    world.broadphase = new CANNON.NaiveBroadphase();
    world.solver.iterations = 10;
    world.allowSleep = true;


    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true; //Here is to tell renderer that we need shadows.
    document.getElementById('viewport').appendChild(renderer.domElement);

    scene = new THREE.Scene;

    camera = new THREE.PerspectiveCamera(
        75,
        window.innerWidth / window.innerHeight,
        1,
        5000
    );
    camera.position.set(200, 30, 40);
    // camera.position.set(0, -18, 20);
    camera.up.set(0, 0, 1);
    camera.lookAt(scene.position);
    scene.add(camera);

    //Add a light source
    let ambientLight = new THREE.AmbientLight(0x404040, 0.4); // soft white light
    let light = new THREE.PointLight(0xffffff, 1);
    light.position.set(-150, 160, 150);
    light.shadow.mapSize.height = 1024;
    light.shadow.mapSize.width = 1024;
    light.castShadow = true;
    scene.add(ambientLight);
    scene.add(light);

    // Physics Material
    let m01 = new CANNON.Material({
        friction: 0.08,
        restitution: 0.8,
    });
    let m02 = new CANNON.Material({
        friction: 0.02,
        restitution: 0.8,
    });


    //plane
    plane.body = new CANNON.Body({
        mass: 0,
        shape: new CANNON.Box(new CANNON.Vec3(300, 100, 0.5)),
        material: m01,
    });
    var ground_material = new THREE.MeshPhongMaterial({
        color: 0xffffff
    });
    plane.mesh = addVisual(plane.body, ground_material);
    plane.body.position.z = -0.5;
    world.addBody(plane.body);


    /*
     * add bowling
     */

    for (var i = 0; i < 4; i++) {
        for (let j = 0; j <= i; j++) {
            var bowling = {};

            bowling.body = new CANNON.Body({
                mass: 1,
                shape: new CANNON.Cylinder(2, 2, 12, 30),
                material: m02,
            });
            bowling.body.sleep();
            bowling.body.position.x = -6 * i;
            bowling.body.position.y = 3 * i - 6 * j;
            bowling.body.position.z = 6;
            bowling.mesh = addVisual(bowling.body);
            world.addBody(bowling.body);
            bowlings.push(bowling);

            let origin = {}
            origin.position = new CANNON.Vec3();
            origin.quaternion = new CANNON.Quaternion();
            origin.position.copy(bowling.body.position);
            origin.quaternion.copy(bowling.body.quaternion);
            origins.push(origin);

        }
    }

    /*
     * add ball
     */
    ball.body = new CANNON.Body({
        mass: 3,
        shape: new CANNON.Sphere(3, 30, 30),
        material: m02,
    });
    // ball.body.sleep();
    var ball_material = new THREE.MeshPhongMaterial({
        color: 0xfa0aff
    });
    ball.mesh = addVisual(ball.body, ball_material);
    ball.body.position.set(160, 0, 6);
    world.addBody(ball.body);


    var axesHelper = new THREE.AxesHelper(200);
    scene.add(axesHelper);

    //controller
    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxPolarAngle = 1.5;
    controls.update();

    //EventListener
    function handleClick(e) {
        console.log("Clicked!");
        // applyImpulse
        ball.body.wakeUp();
        ball.body.applyImpulse(new CANNON.Vec3(-500, 0, 0), ball.body.position);
    }

    function handleReset() {
        // console.log(origins)
        ball.body.position.set(160, 0, 10);
        ball.body.sleep();
        for (let i = 0; i < bowlings.length; i++) {
            // 复制源位置和源四元数值
            bowlings[i].body.position.copy(origins[i].position)
            bowlings[i].body.quaternion.copy(origins[i].quaternion);
            bowlings[i].body.sleep();
        }
        ball.body.wakeUp();
    }

    document.getElementById('start').addEventListener('click', handleClick);
    document.getElementById('reset').addEventListener('click', handleReset);

    /*
     * Events to fire upon window resizing.
    */
    window.addEventListener("resize", onWindowResize, false);
    function onWindowResize() {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    }

    render();
};

function updatePhysics() {
    world.step(timeStep);

    plane.mesh.position.copy(plane.body.position);
    plane.mesh.quaternion.copy(plane.body.quaternion);

    ball.mesh.position.copy(ball.body.position);
    ball.mesh.quaternion.copy(ball.body.quaternion);

    for (let i = 0; i < bowlings.length; i++) {
        bowlings[i].mesh.position.copy(bowlings[i].body.position);
        bowlings[i].mesh.quaternion.copy(bowlings[i].body.quaternion);
    }
}

function render() {
    updatePhysics();

    controls.update();

    renderer.render(scene, camera); // render the scene
    requestAnimationFrame(render);
};

function addVisual(body, material) {

    // Materials
    var material = material || new THREE.MeshPhongMaterial({
        color: 0xff0000
    });

    let shape = body.shapes[0];
    let mesh;

    switch (shape.type) {
        case CANNON.Shape.types.SPHERE:
            var sphere_geometry = new THREE.SphereGeometry(shape.radius, 30, 30);
            mesh = new THREE.Mesh(sphere_geometry, material);
            break;

        case CANNON.Shape.types.PARTICLE:
            mesh = new THREE.Mesh(this.particleGeo, this.particleMaterial);
            var s = this.settings;
            mesh.scale.set(s.particleSize, s.particleSize, s.particleSize);
            break;

        case CANNON.Shape.types.BOX:
            var box_geometry = new THREE.BoxGeometry(shape.halfExtents.x * 2,
                shape.halfExtents.y * 2,
                shape.halfExtents.z * 2);
            mesh = new THREE.Mesh(box_geometry, material);
            break;

        case CANNON.Shape.types.CONVEXPOLYHEDRON:
            var geo = new THREE.Geometry();

            // Add vertices
            for (var i = 0; i < shape.vertices.length; i++) {
                var v = shape.vertices[i];
                geo.vertices.push(new THREE.Vector3(v.x, v.y, v.z));
            }

            for (var i = 0; i < shape.faces.length; i++) {
                var face = shape.faces[i];

                // add triangles
                var a = face[0];
                for (var j = 1; j < face.length - 1; j++) {
                    var b = face[j];
                    var c = face[j + 1];
                    geo.faces.push(new THREE.Face3(a, b, c));
                }
            }
            geo.computeBoundingSphere();
            geo.computeFaceNormals();
            mesh = new THREE.Mesh(geo, material);
            break;

        case CANNON.Shape.types.TRIMESH:
            var geometry = new THREE.Geometry();

            var v0 = new CANNON.Vec3();
            var v1 = new CANNON.Vec3();
            var v2 = new CANNON.Vec3();
            for (var i = 0; i < shape.indices.length / 3; i++) {
                shape.getTriangleVertices(i, v0, v1, v2);
                geometry.vertices.push(
                    new THREE.Vector3(v0.x, v0.y, v0.z),
                    new THREE.Vector3(v1.x, v1.y, v1.z),
                    new THREE.Vector3(v2.x, v2.y, v2.z)
                );
                var j = geometry.vertices.length - 3;
                geometry.faces.push(new THREE.Face3(j, j + 1, j + 2));
            }
            geometry.computeBoundingSphere();
            geometry.computeFaceNormals();
            mesh = new THREE.Mesh(geometry, material);
            break;

        default:
            throw "Visual type not recognized: " + shape.type;
    }

    mesh.receiveShadow = true;
    mesh.castShadow = true;
    if (mesh.children) {
        for (var i = 0; i < mesh.children.length; i++) {
            mesh.children[i].castShadow = true;
            mesh.children[i].receiveShadow = true;
            if (mesh.children[i]) {
                for (var j = 0; j < mesh.children[i].length; j++) {
                    mesh.children[i].children[j].castShadow = true;
                    mesh.children[i].children[j].receiveShadow = true;
                }
            }
        }
    }

    mesh.receiveShadow = true;
    mesh.castShadow = true;

    scene.add(mesh);

    return mesh;
}


