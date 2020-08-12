import * as THREE from 'https://threejs.org/build/three.module.js'

import shaderFragment from './shaders/fragment.glsl'
import shaderVertex from './shaders/vertex.glsl'

export default function()
{
    const uniforms = {
        ...THREE.UniformsLib.common,
        ...THREE.UniformsLib.bumpmap,
        ...THREE.UniformsLib.normalmap,
        ...THREE.UniformsLib.displacementmap,
        ...THREE.UniformsLib.fog,
        matcap: { value: null },
        uRevealProgress: { value: null },
        uIndirectDistanceAmplitude: { value: null },
        uIndirectDistanceStrength: { value: null },
        uIndirectDistancePower: { value: null },
        uIndirectAngleStrength: { value: null },
        uIndirectAngleOffset: { value: null },
        uIndirectAnglePower: { value: null },
        uIndirectColor: { value: null }
    }

    const extensions = {
        derivatives: false,
        fragDepth: false,
        drawBuffers: false,
        shaderTextureLOD: false
    }

    const defines = {
        MATCAP: ''
    }

    const material = new THREE.ShaderMaterial({
        wireframe: false,
        transparent: false,
        uniforms,
        extensions,
        defines,
        lights: false,
        vertexShader: shaderVertex,
        fragmentShader: shaderFragment
    })

    return material
}
