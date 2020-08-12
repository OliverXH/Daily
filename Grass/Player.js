// class Player {
//     constructor(optins) {
//         this.capsule = Capsule
//     }

//     update() {

//     }
// }

function Capsule(_height, _radius) {
    let height = _height || 10;
    let radius = _radius || 2;

    let _capsule = new THREE.Object3D();


    let material = new THREE.MeshLambertMaterial({ color: 0xffffff });

    let sphere_up = new THREE.Mesh(
        new THREE.SphereGeometry(radius, 30, 30),
        material
    );
    sphere_up.position.y = height - radius;

    let cylinder = new THREE.Mesh(
        new THREE.CylinderGeometry(radius, radius, height - 2 * radius, 30),
        material
    );
    cylinder.position.y = 0.5 * height;

    let sphere_down = sphere_up.clone();
    sphere_down.position.y = radius;

    _capsule.add(sphere_up);
    _capsule.add(cylinder);
    _capsule.add(sphere_down);

    return _capsule;
}