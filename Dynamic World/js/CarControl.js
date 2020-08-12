"use strict";

/**
 *  Input state values
 */
class CarControl {
    constructor(_car) {
        this.car = _car;
        // console.log(_car);

        this.left = false;
        this.right = false;
        this.forward = false;
        this.backward = false;
        this.brake = false;
        // this.left = 0.0;
        // this.right = 0.0;
        this.accel = 0.0;
        this.ebrake = 0.0;
        this.reverse = 0.0;

        this.engineForce = 300;
        this.airForce = 100;

        this.maxSteerVal = 0.5;
        this.steerVal = 0;
        this.maxForce = 4000;
        this.brakeForce = 150;

        this.clock = new THREE.Clock();

        document.addEventListener('keydown', this.handler.bind(this));
        document.addEventListener('keyup', this.handler.bind(this));
    }

    handler(event) {
        // console.log(this.car);
        // let down = (event.type !== 'keydown');
        let up = (event.type == 'keyup');

        switch (event.keyCode) {

            // case 87: // forward
            //     this.forward = (up ? false : true);
            //     break;

            // case 83: // backward
            //     this.backward = (up ? false : true);
            //     break;

            case 87: // forward
                this.car.vehicle.applyEngineForce(up ? 0 : -this.maxForce, 2);
                this.car.vehicle.applyEngineForce(up ? 0 : -this.maxForce, 3);
                break;

            case 83: // backward
                this.car.vehicle.applyEngineForce(up ? 0 : this.maxForce, 2);
                this.car.vehicle.applyEngineForce(up ? 0 : this.maxForce, 3);
                break;

            case 66: // b
                // vehicle.setBrake(brakeForce, 0);
                // vehicle.setBrake(brakeForce, 1);
                this.car.vehicle.setBrake(this.brakeForce, 2);
                this.car.vehicle.setBrake(this.brakeForce, 3);
                console.log("brake");
                break;

            case 65: // left
                this.left = (up ? false : true);
                break;

            case 68: // right
                this.right = (up ? false : true);
                break;
        }
    }

    update() {
        let time = this.clock.getDelta();
        // console.log(time);


        if (this.left) {
            this.steer += this.maxSteer * (time * 1000 / 500);
            this.steer = Math.min(this.maxSteer, this.steer);
        }
        else if (this.right) {
            this.steer -= this.maxSteer * (time * 1000 / 500);
            this.steer = Math.max(-this.maxSteer, this.steer);
        }
        else {
            if (this.steer > 0) {
                this.steer -= this.maxSteer * (time * 1000 / 500);
                this.steer = Math.max(0, this.steer);
            }
            else if (this.steer < 0) {
                this.steer += this.maxSteer * (time * 1000 / 500);
                this.steer = Math.min(0, this.steer);
            }
        }

        this.car.vehicle.setSteeringValue(this.steer, 2);
        this.car.vehicle.setSteeringValue(this.steer, 3);
    }

};

