// import * as THREE from 'https://threejs.org/build/three.module.js'

let textureLoader = new THREE.TextureLoader();

let Matcap = {};

function createMatCap(texture) {
    let vertexShader = `
        varying vec2 vUv;
        varying vec2 Point;

        void main()
        {
            vUv = uv;
            vec3 vNormal = ( mat3( modelViewMatrix ) * normal );
            vNormal = normalize(vNormal);

            Point.x = vNormal.x * 0.5 + 0.5;
            Point.y = vNormal.y * 0.5 + 0.5;
            
            gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

        }
    `;

    let fragmentShader = `
        uniform sampler2D Matcap;      // Matcap纹理

        varying vec2 vUv;   // 纹理坐标
        varying vec2 Point;

        void main(void){

            // texture2D()获取颜色值

            vec4 color = texture2D(Matcap, Point);

            gl_FragColor = color;
        }
    `;

    let Material = new THREE.ShaderMaterial({
        uniforms: {
            Matcap: { value: texture },
        },
        vertexShader,
        fragmentShader
    });

    return Material;
}

Matcap.Beige = createMatCap(textureLoader.load("matcaps/beige.png"));

Matcap.Black = createMatCap(textureLoader.load("matcaps/black.png"));

Matcap.Blue = createMatCap(textureLoader.load("matcaps/blue.png"));

Matcap.Brown = createMatCap(textureLoader.load("matcaps/brown.png"));

Matcap.EmeraldGreen = createMatCap(textureLoader.load("matcaps/emeraldGreen.png"));

Matcap.Gold = createMatCap(textureLoader.load("matcaps/gold.png"));

Matcap.Gold = createMatCap(textureLoader.load("matcaps/gold.png"));

Matcap.Gray = createMatCap(textureLoader.load("matcaps/gray.png"));

Matcap.Green = createMatCap(textureLoader.load("matcaps/green.png"));

Matcap.Metal = createMatCap(textureLoader.load("matcaps/metal_1.jpg"));

Matcap.Orange = createMatCap(textureLoader.load("matcaps/orange.png"));

Matcap.Purple = createMatCap(textureLoader.load("matcaps/purple.png"));

Matcap.Red = createMatCap(textureLoader.load("matcaps/red.png"));

Matcap.White = createMatCap(textureLoader.load("matcaps/white.png"));

Matcap.Yellow = createMatCap(textureLoader.load("matcaps/yellow.png"));