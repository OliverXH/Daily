class Control {
    constructor(_player) {
        this.plyer = _player;
        this.engineForce = 100;
        this.airForce = 50;

        this.initEvent();
    }

    initEvent() {
        document.addEventListener('keydown', handler);
        document.addEventListener('keyup', handler);

        function handler(event) {
            let down = (event.type !== 'keydown');
            let up = (event.type == 'keyup');

            if (!up && !down) {
                return;
            }

            switch (event.keyCode) {

                case 87: // forward
                    this.plyer.applyLocalForce(up ? new CANNON.Vec3(0, 0, 0) : new CANNON.Vec3(0, this.engineForce, 0), new CANNON.Vec3(0, 0, 0));
                    break;

                case 83: // backward
                    this.plyer.applyLocalForce(up ? new CANNON.Vec3(0, 0, 0) : new CANNON.Vec3(0, -this.engineForce, 0), new CANNON.Vec3(0, 0, 0));
                    break;

                case 65: // right
                    this.plyer.applyLocalForce(up ? new CANNON.Vec3(0, 0, 0) : new CANNON.Vec3(0, 0, this.airForce), new CANNON.Vec3(-0.5, 0, 0));
                    this.plyer.applyLocalForce(up ? new CANNON.Vec3(0, 0, 0) : new CANNON.Vec3(0, 0, -this.airForce), new CANNON.Vec3(0.5, 0, 0));
                    break;

                case 68: // left
                    this.plyer.applyLocalForce(up ? new CANNON.Vec3(0, 0, 0) : new CANNON.Vec3(0, 0, -this.airForce), new CANNON.Vec3(-0.5, 0, 0));
                    this.plyer.applyLocalForce(up ? new CANNON.Vec3(0, 0, 0) : new CANNON.Vec3(0, 0, this.airForce), new CANNON.Vec3(0.5, 0, 0));
                    break;

            }
        }
    }
}