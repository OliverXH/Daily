let canvas = document.getElementById('canvas');
let ctx = canvas.getContext('2d');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

function draw_background() {
    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
    let bg_img = new Image();

    bg_img.onload = function () {
        ctx.drawImage(bg_img, 0, 0, window.innerWidth, window.innerHeight);

        ctx.fillStyle = "#ffffff";
        ctx.fillRect(10, 10, 100, 100);
    };

    bg_img.src = 'res/img/bg_1.jpeg';

    drawImageCenter(window.innerWidth / 2, window.innerHeight - 60, 'res/img/play.png');


}

function drawImageCenter(x, y, src) {

    let img = new Image();

    img.onload = function () {
        let width = img.width / 4,
            height = img.height / 4;
        ctx.drawImage(img, x - width / 2, y - height / 2, width, height);
    };

    img.src = src;
}

window.addEventListener('mousemove', handleMouseMove);
window.addEventListener('resize', handleResize);
window.addEventListener('mousemove', handleMouseMove);

function handleMouseMove(e) {
    console.log(e)
    if (10 <= e.pageX && e.pageX <= 100 && 10 <= e.pageY && e.pageY <= 100)
        canvas.style.cursor = 'pointer';
    else
        canvas.style.cursor = 'default';
}

function handleResize() {
    // canvas.width = window.innerWidth;
    // canvas.height = window.innerHeight;
}

function render() {
    // ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

    draw_background();


    // requestAnimationFrame(render);
}

window.onload = render();
