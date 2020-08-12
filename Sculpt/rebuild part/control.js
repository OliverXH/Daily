let Control = (function () {

    let Control = function (object, domElement) {

        if (domElement === undefined) {

            console.warn('THREE.FirstPersonControls: The second parameter "domElement" is now mandatory.');
            domElement = document;

        }

        this.object = object;
        this.domElement = domElement;


        this.mouseX = 0;
        this.mouseY = 0;

        this.mouseDownPos = {
            x: 0,
            y: 0
        }
        this.mouseMovePos = {
            x: 0,
            y: 0
        }
        this.mouseUpPos = {
            x: 0,
            y: 0
        }

        this.moveForward = false;
        this.moveBackward = false;
        this.moveLeft = false;
        this.moveRight = false;

        this.initEvent();

    }

    Control.prototype.initEvent = function () {

        this.domElement.removeEventListener('mousedown', Control.onMouseDown.bind(this), false);
        this.domElement.removeEventListener('mousemove', Control.onMouseMove.bind(this), false);
        this.domElement.removeEventListener('mouseup', Control.onMouseUp.bind(this), false);

        window.removeEventListener('keydown', Control.onKeyDown.bind(this), false);
        window.removeEventListener('keyup', Control.onKeyUp.bind(this), false);

    }

    Control.onMouseDown = function (event) {

        if (this.domElement !== document) {

            this.domElement.focus();

        }

        event.preventDefault();
        event.stopPropagation();

        if (this.activeLook) {

            switch (event.button) {

                case 0: this.moveForward = true; break;
                case 2: this.moveBackward = true; break;

            }

        }

        this.mouseDragOn = true;

    };

    Control.onMouseUp = function (event) {

        event.preventDefault();
        event.stopPropagation();

        if (this.activeLook) {

            switch (event.button) {

                case 0: this.moveForward = false; break;
                case 2: this.moveBackward = false; break;

            }

        }

        this.mouseDragOn = false;

    };

    Control.onMouseMove = function (event) {

        if (this.domElement === document) {

            this.mouseX = event.pageX - this.viewHalfX;
            this.mouseY = event.pageY - this.viewHalfY;

        } else {

            this.mouseX = event.pageX - this.domElement.offsetLeft - this.viewHalfX;
            this.mouseY = event.pageY - this.domElement.offsetTop - this.viewHalfY;

        }

    };

    Control.onKeyDown = function (event) {

        //event.preventDefault();

        switch (event.keyCode) {

            case 38: /*up*/
            case 87: /*W*/ this.moveForward = true; break;

            case 37: /*left*/
            case 65: /*A*/ this.moveLeft = true; break;

            case 40: /*down*/
            case 83: /*S*/ this.moveBackward = true; break;

            case 39: /*right*/
            case 68: /*D*/ this.moveRight = true; break;

            case 82: /*R*/ this.moveUp = true; break;
            case 70: /*F*/ this.moveDown = true; break;

        }

    };

    Control.onKeyUp = function (event) {

        switch (event.keyCode) {

            case 38: /*up*/
            case 87: /*W*/ this.moveForward = false; break;

            case 37: /*left*/
            case 65: /*A*/ this.moveLeft = false; break;

            case 40: /*down*/
            case 83: /*S*/ this.moveBackward = false; break;

            case 39: /*right*/
            case 68: /*D*/ this.moveRight = false; break;

            case 82: /*R*/ this.moveUp = false; break;
            case 70: /*F*/ this.moveDown = false; break;

        }

    };

    return Control;

})();