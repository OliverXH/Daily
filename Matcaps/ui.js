function Vector2(_x, _y) {
    this.x = _x || 0;
    this.y = _y || 0;
}



function Panel(name) {
    let position = new Vector2(10, 60); // left, top

    let container = document.createElement('div');
    container.style.position = 'absolute';
    container.style.overflow = 'hidden';
    container.style.zIndex = '20';
    container.style.left = `${position.x}px`;
    container.style.top = `${position.y}px`;
    container.style.width = ' 300px';
    container.style.height = ' 400px';
    container.style.boxSizing = 'border-box';
    container.style.color = '#fff';
    container.style.userSelect = 'none';
    container.style.backgroundColor = 'rgba(17, 17, 17, 0.88)';
    container.style.zIndex = '30';
    container.style.border = '1px solid #333';

    let close = document.createElement("div");
    container.appendChild(close);
    close.style.position = 'absolute';
    close.style.top = '10px';
    close.style.right = '10px';
    close.style.width = '16px';
    close.style.height = '16px';
    close.style.cursor = 'pointer';
    close.style.zIndex = '99';

    let title = document.createElement("div");
    container.appendChild(title);
    title.innerHTML = name;
    title.style.cursor = 'move';
    // title.style.height = '40px';
    title.style.padding = '10px 30px 10px 10px';
    title.style.lineHeight = '20px';
    title.style.fontSize = '14px';
    title.style.userSelect = 'none';
    title.style.borderBottom = '1px solid #666';
    // title.style.marginTop = '-40px';
    title.style.backgroundColor = 'rgba(0,0,0,0.88)';
    title.style.whiteSpace = 'nowrap';
    title.style.overflow = 'hidden';
    title.style.textOverflow = 'ellipsis';

    let body = document.createElement("div");
    container.appendChild(body);
    body.style.paddingTop = '41px';
    body.style.width = '100%';
    body.style.height = '100%';
    body.style.overflow = 'hidden';

    let resize = document.createElement("div");
    container.appendChild(resize);


    let movePosition = new Vector2();
    let prePosition = new Vector2();
    let newPosition = new Vector2(position.x, position.y);

    title.addEventListener('mousedown', onMouseDown);
    document.addEventListener('mouseup', onMouseUp);

    function onMouseDown(event) {

        prePosition.x = event.clientX;
        prePosition.y = event.clientY;

        document.addEventListener('mousemove', onMouseMove);

    }

    function onMouseMove(event) {

        movePosition.x = event.clientX;
        movePosition.y = event.clientY;

        newPosition.x = newPosition.x + movePosition.x - prePosition.x;
        newPosition.y = newPosition.y + movePosition.y - prePosition.y;

        prePosition.x = movePosition.x;
        prePosition.y = movePosition.y;

        if (0 >= newPosition.x) {
            newPosition.x = 0;
        } else if (newPosition.x >= window.innerWidth - 300) {
            newPosition.x = window.innerWidth - 300;
        }

        if (0 >= newPosition.y) {
            newPosition.y = 0;
        } else if (newPosition.y >= window.innerHeight - 400) {
            newPosition.y = window.innerHeight - 400;
        }

        container.style.left = `${newPosition.x}px`;
        container.style.top = `${newPosition.y}px`;

    }

    function onMouseUp(event) {

        prePosition.x = newPosition.x;
        prePosition.y = newPosition.y;

        document.removeEventListener('mousemove', onMouseMove);

    }

    return container;
}

let container_1 = Panel('属性');

document.body.appendChild(container_1);