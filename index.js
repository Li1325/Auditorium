import * as THREE from 'three';

import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

import {GUI} from 'three/addons/libs/lil-gui.module.min.js';

const gui = new GUI();
gui.domElement.style.right = '0px';
gui.domElement.style.width = '240px';

// 用于存储加载成功后的GLB模型场景
let gltfScene = null;
let tableTop = null;

//基础场景初始化
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xf0f0f0);

//透视相机
const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(40, 60, 75);

// 渲染器初始化
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);


//窗口大小自适应
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});
