let renderer, scene, camera, world, controls;
let plane = {}, walls = [], dominos = [], white_ball = {}, balls = [];
let origins = [];
let timeStep = 1 / 60;

let alpha,
    beta,
    gamma;

let forceX,
    forceZ,
    speedX,
    speedY,
    maxSpeed = 50;

let speedA = false,
    speedD = false,
    speedS = false,
    speedW = false;

window.onload = initScene();

function initScene() {

    world = new CANNON.World();
    world.gravity.set(0, 0, -320);
    world.broadphase = new CANNON.NaiveBroadphase();
    world.solver.iterations = 10;
    world.allowSleep = true;

    // renderer = new THREE.WebGLRenderer();
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true; //Here is to tell renderer that we need shadows.
    document.getElementById('viewport').appendChild(renderer.domElement);

    scene = new THREE.Scene;

    camera = new THREE.PerspectiveCamera(
        65,
        window.innerWidth / window.innerHeight,
        1,
        5000
    );
    camera.position.set(140, -30, 60);
    // camera.position.set(0, -18, 20);
    camera.up.set(0, 0, 1);
    camera.lookAt(scene.position);
    scene.add(camera);

    //Add a light source
    let ambientLight = new THREE.AmbientLight(0x404040, 0.7); // soft white light
    let light = new THREE.PointLight(0xffffff, 1);
    light.position.set(-80, 100, 150);
    light.shadow.mapSize.height = 1024;
    light.shadow.mapSize.width = 1024;
    light.castShadow = true;
    scene.add(ambientLight);
    scene.add(light);

    var axesHelper = new THREE.AxesHelper(70);
    scene.add(axesHelper);

    drawImageCenter(window.width / 2, 300, 624, 246, 'res/img/play.png');

    function drawImageCenter(x, y, src) {
        let canvas = document.createElement('canvas');
        let ctx = canvas.getContext('2d');
        console.log(canvas);

        let img = new Image();
        img.src = src;
        let width = img.width,
            height = img.height;

        console.log(img);

        // ctx.clearRect();
        img.onload = function () {
            ctx.drawImage(img, x - width / 2, y - height / 2, width, height);
        };

    }


    // Physics Material
    let m01 = new CANNON.Material({ // plane
        friction: 0.2,
        restitution: 0.4,
    });
    let m02 = new CANNON.Material({ // wall
        friction: 0.4,
        restitution: 0.9,
    });
    let m03 = new CANNON.Material({ // ball
        friction: 0.06,
        restitution: 0.8,
    });

    /*
     * ==========plane==========================
     */
    plane.body = new CANNON.Body({
        mass: 0,
        shape: new CANNON.Box(new CANNON.Vec3(100, 100, 0.5)),
        material: m01,
    });
    var ground_material = new THREE.MeshLambertMaterial({
        color: 0xffffff
    });
    plane.mesh = addVisual(plane.body, ground_material);
    plane.body.position.z = -0.5;
    world.addBody(plane.body);

    plane.mesh.position.copy(plane.body.position);
    plane.mesh.quaternion.copy(plane.body.quaternion);


    /*
     * ==========walls==========================
     */
    let width = 200,
        depth = 4,
        height = 10;
    walls[0] = {};
    walls[0].body = new CANNON.Body({
        shape: new CANNON.Box(new CANNON.Vec3(width / 2, depth / 2, height / 2)),
        material: m01,
        mass: 0 // mass
    });
    walls[0].body.position.set(0, -(width - depth) / 2, height / 2);

    walls[1] = {};
    walls[1].body = new CANNON.Body({
        shape: new CANNON.Box(new CANNON.Vec3(width / 2, depth / 2, height / 2)),
        material: m01,
        mass: 0 // mass
    });
    walls[1].body.position.set(0, (width - depth) / 2, height / 2);


    walls[2] = {};
    walls[2].body = new CANNON.Body({
        shape: new CANNON.Box(new CANNON.Vec3(depth / 2, width / 2, height / 2)),
        material: m01,
        mass: 0 // mass
    });
    walls[2].body.position.set(-(width - depth) / 2, 0, height / 2);


    walls[3] = {};
    walls[3].body = new CANNON.Body({
        shape: new CANNON.Box(new CANNON.Vec3(depth / 2, width / 2, height / 2)),
        material: m01,
        mass: 0, // mass
    });
    walls[3].body.position.set((width - depth) / 2, 0, height / 2);

    for (let i = 0; i < walls.length; i++) {
        world.addBody(walls[i].body);
        walls[i].mesh = addVisual(walls[i].body, ground_material);
        walls[i].mesh.position.copy(walls[i].body.position);
        walls[i].mesh.quaternion.copy(walls[i].body.quaternion);
    }

    /*
     * ==============white ball==========================
     */
    white_ball.body = new CANNON.Body({
        shape: new CANNON.Sphere(3, 40, 40),
        material: m03,
        mass: 1,
    });
    white_ball.body.position.set(80, 0, 30);
    white_ball.mesh = addVisual(white_ball.body, new THREE.MeshLambertMaterial({
        color: 0x24ADF3
    }));
    world.addBody(white_ball.body);

    /*
     *  balls
     */

    for (var i = 0; i < 4; i++) {
        for (let j = 0; j <= i; j++) {
            var ball = {};

            ball.body = new CANNON.Body({
                mass: 1,
                shape: new CANNON.Sphere(3, 30, 30),
                material: m03,
            });
            ball.body.sleep();
            ball.body.position.x = -6 * i;
            ball.body.position.y = 3 * i - 6 * j;
            ball.body.position.z = 3;
            ball.mesh = addVisual(ball.body);
            world.addBody(ball.body);
            balls.push(ball);

            let origin = {}
            origin.position = new CANNON.Vec3();
            origin.quaternion = new CANNON.Quaternion();
            origin.position.copy(ball.body.position);
            origin.quaternion.copy(ball.body.quaternion);
            origins.push(origin);

        }
    }

    //controller
    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxPolarAngle = 1.5;
    controls.update();

    //EventListener
    function handleClick(e) {
        // console.log("Clicked!");
        // applyImpulse
        white_ball.body.wakeUp();
        white_ball.body.applyImpulse(new CANNON.Vec3(-500, 5, 0), white_ball.body.position);
    }

    function handleReset() {
        white_ball.body.sleep();
        white_ball.body.position.set(80, 0, 30);
        for (let i = 0; i < balls.length; i++) {
            // 复制源位置和源四元数值
            balls[i].body.position.copy(origins[i].position)
            balls[i].body.quaternion.copy(origins[i].quaternion);
            balls[i].body.sleep();
        }
        white_ball.body.wakeUp();
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

    white_ball.mesh.position.copy(white_ball.body.position);
    white_ball.mesh.quaternion.copy(white_ball.body.quaternion);

    for (let i = 0; i < balls.length; i++) {
        balls[i].mesh.position.copy(balls[i].body.position);
        balls[i].mesh.quaternion.copy(balls[i].body.quaternion);
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