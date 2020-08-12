function initUI() {
    let keyControl = document.createElement('div');
    keyControl.style.position = 'absolute';
    keyControl.style.bottom = "30px";
    keyControl.style.left = "30px";
    // keyControl.style.backgroundColor = "#ffffff";
    keyControl.style.zIndex = "10";
    keyControl.style.width = "136px";
    keyControl.style.height = "89px";
    keyControl.style.color = "#ffffff";
    keyControl.style.fontSize = "20px";
    keyControl.style.textAlign = "center";
    document.body.appendChild(keyControl);
    // console.log(keyControl.style);

    let up = document.createElement('div');
    up.style.position = 'absolute';
    up.style.top = "0";
    up.style.left = "47px";
    // up.style.backgroundColor = "#ff0000";
    up.style.width = "40px";
    up.style.height = "40px";
    up.style.border = "1px solid #ffffff";
    up.style.borderRadius = "3px";
    up.innerHTML = "W";
    up.style.lineHeight = "40px";
    keyControl.appendChild(up);
    // console.log(up.style);

    let left = document.createElement('div');
    left.style.position = 'absolute';
    left.style.bottom = "0";
    left.style.left = "0";
    // left.style.backgroundColor = "#ff0000";
    left.style.width = "40px";
    left.style.height = "40px";
    left.style.border = "1px solid #ffffff";
    left.style.borderRadius = "3px";
    left.innerHTML = "A";
    left.style.lineHeight = "40px";
    keyControl.appendChild(left);

    let down = document.createElement('div');
    down.style.position = 'absolute';
    down.style.bottom = "0";
    down.style.left = "47px";
    // down.style.backgroundColor = "#ff0000";
    down.style.width = "40px";
    down.style.height = "40px";
    down.style.border = "1px solid #ffffff";
    down.style.borderRadius = "3px";
    down.innerHTML = "S";
    down.style.lineHeight = "40px";
    keyControl.appendChild(down);

    let right = document.createElement('div');
    right.style.position = 'absolute';
    right.style.bottom = "0";
    right.style.right = "0";
    // right.style.backgroundColor = "#ff0000";
    right.style.width = "40px";
    right.style.height = "40px";
    right.style.border = "1px solid #ffffff";
    right.style.borderRadius = "3px";
    right.innerHTML = "D";
    right.style.lineHeight = "40px";
    keyControl.appendChild(right);
}