class KeyControls {
  constructor(roler) {
    this.forward = false;
    this.backward = false;
    this.left = false;
    this.right = false;
    this.up = false;
    this.down = false;
    this.roler = roler;
    this.setListener();
  }

  setListener() {
    console.log('control');
    window.addEventListener('keydown', (event) => {
      switch (event.keyCode) {
        case 87:
          this.forward = true;
          break;
        case 83:
          this.backward = true;
          break;
        case 65:
          this.left = true;
          break;
        case 68:
          this.right = true;
          break;
      }
    });

    window.addEventListener('keyup', (event) => {
      switch (event.keyCode) {
        case 87:
          this.forward = false;
          break;
        case 83:
          this.backward = false;
          break;
        case 65:
          this.left = false;
          break;
        case 68:
          this.right = false;
          break;
      }
    });
  }
}