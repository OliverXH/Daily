/**
 * Map
 */
class HeightFieldMap {
    constructor(img, size) {
        this.img = img;		// Image 对象

        this.size = size;

        // console.log(this);

        this.body = null;
        this.mesh = null;

        this.init();
    }

    init() {
        let x, y, p, a;

        let w = this.img.width,
            h = this.img.height,
            _canvas = document.createElement('canvas'),
            ctx = _canvas.getContext('2d');

        _canvas.width = w;
        _canvas.height = h;
        ctx.drawImage(this.img, 0, 0, w, h);

        this.hfTileSize = this.size / (w - 1);    // 间距，这个像素作为一个顶点

        //  And collect cannon heightfield data in these lets
        let data = [];
        let maxHeight = 35.0;
        let minHeight = 0.0;
        let totalHeight = maxHeight - minHeight;
		
		// ImageData ctx.getImageData(sx, sy, sw, sh);	返回一个ImageData对象
		// sx 将要被提取的图像数据矩形区域的左上角 x 坐标。
		// sy 将要被提取的图像数据矩形区域的左上角 y 坐标。
		// sw 将要被提取的图像数据矩形区域的宽度。
		// sh 将要被提取的图像数据矩形区域的高度。

        //  Do each height:
        for (let i = 0; i < h; ++i) {
            data.push([]);
            for (let j = 0; j < w; ++j) {
                p = ctx.getImageData(i, j, 1, 1).data;	// 一个一维数组，包含以 RGBA 顺序的数据，数据使用  0 至 255（包含）的整数表示。 
                a = (p[0] + p[1] + p[2]) / (255 + 255 + 255);
                let height = a * totalHeight + minHeight;

                data[i].push(height);
            }
        }

        let shape = new CANNON.Heightfield(data, {
            elementSize: this.hfTileSize //, minValue: 0.0, maxValue: maxHeight
        });
        this.body = new CANNON.Body({
            mass: 0
        });
        this.body.addShape(shape);

        let px = -w * shape.elementSize / 2;
        let py = -h * shape.elementSize / 2;

        this.body.position.set(px, py, 0);

        const texture = new THREE.TextureLoader().load("./assert/sand.jpg");
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set(50, 50);

        //  make the material
        let material = new THREE.MeshLambertMaterial({
            color: 0xFFFFFF,
            map: texture
        });

        this.mesh = this.makeTerrainMeshFromCShape(shape);

        this.mesh.position.copy(this.body.position);
        this.mesh.quaternion.copy(this.body.quaternion);

    }

    makeTerrainMeshFromCShape(shape) {
        //  build heightfield geometry
        let geometry = new THREE.Geometry();

        let v0 = new CANNON.Vec3();
        let v1 = new CANNON.Vec3();
        let v2 = new CANNON.Vec3();
        for (let xi = 0; xi < shape.data.length - 1; xi++) {
            for (let yi = 0; yi < shape.data[xi].length - 1; yi++) {
                for (let k = 0; k < 2; k++) {
                    shape.getConvexTrianglePillar(xi, yi, k === 0);
                    v0.copy(shape.pillarConvex.vertices[0]);
                    v1.copy(shape.pillarConvex.vertices[1]);
                    v2.copy(shape.pillarConvex.vertices[2]);
                    v0.vadd(shape.pillarOffset, v0);
                    v1.vadd(shape.pillarOffset, v1);
                    v2.vadd(shape.pillarOffset, v2);
                    geometry.vertices.push(
                        new THREE.Vector3(v0.x, v0.y, v0.z),
                        new THREE.Vector3(v1.x, v1.y, v1.z),
                        new THREE.Vector3(v2.x, v2.y, v2.z)
                    );
                    let i = geometry.vertices.length - 3;
                    geometry.faces.push(new THREE.Face3(i, i + 1, i + 2));
                }
            }
        }
        geometry.computeBoundingSphere();
        geometry.computeFaceNormals();

        // texture coordinates
        geometry.computeBoundingBox();
        let max = geometry.boundingBox.max,
            min = geometry.boundingBox.min;
        let txScale = 0.025;
        let offset = new THREE.Vector2(0 - min.x, 0 - min.y);
        let range = new THREE.Vector2((max.x - min.x) * txScale, (max.y - min.y) * txScale);
        let faces = geometry.faces;

        for (let i = 0, n = faces.length; i < n; ++i) {
            let v1 = geometry.vertices[faces[i].a],
                v2 = geometry.vertices[faces[i].b],
                v3 = geometry.vertices[faces[i].c];
            geometry.faceVertexUvs[0].push([
                new THREE.Vector2((v1.x + offset.x) / range.x, (v1.y + offset.y) / range.y),
                new THREE.Vector2((v2.x + offset.x) / range.x, (v2.y + offset.y) / range.y),
                new THREE.Vector2((v3.x + offset.x) / range.x, (v3.y + offset.y) / range.y)
            ]);
        }
        geometry.uvsNeedUpdate = true;

        const texture = new THREE.TextureLoader().load("./assert/sand.jpg");
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set(50, 50);

        //  make the mesh
        let mesh = new THREE.Mesh(
            geometry,
            new THREE.MeshLambertMaterial({
                color: 0xFFFFFF,
                map: texture
            })
        );

        return mesh;
    }

}