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



// 启用轨道控制器（交互控制相机）
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true; //阻尼器
controls.dampingFactor = 0.05;
controls.maxPolarAngle = Math.PI / 2; // 限制垂直旋转角度

controls.enableKeys = false;
controls.enableRotate = true; //鼠标拖拽旋转
controls.enableZoom = true; //保留鼠标滚轮缩放


// 第一人称视角（键盘控制）
let isFirstPerson = false;
const moveSpeed = 0.5; // 移动速度
const rotateSpeed = 0.01; // 旋转速度
let mouseX = 0, mouseY = 0;

// 键盘控制移动
document.addEventListener('keydown', (e) => {
    if (e.key === 'p') {
        isFirstPerson = !isFirstPerson;

    if (isFirstPerson) {
        controls.enableRotate = false;
        mouseX = e.clientX;
        mouseY = e.clientY;
        // 隐藏鼠标光标
        document.body.style.cursor = 'none';
        } else {
            // 切换回第三人称时，恢复鼠标光标
            document.body.style.cursor = 'default';
        }
        
        console.log(isFirstPerson ? '已切换为第一人称视角（鼠标可拖动旋转）' : '已切换为第三人称视角');
        return;
    }
    
    if (!isFirstPerson) return;
    const moveDir = camera.getWorldDirection(new THREE.Vector3()).setY(0).normalize();
    //W键前进 S键后退 A键左键向左旋转 D键左键向右旋转 
    switch(e.key) {
        case 'w': camera.position.addScaledVector(camera.getWorldDirection(new THREE.Vector3()).setY(0).normalize(), moveSpeed); break;
        case 's': camera.position.addScaledVector(camera.getWorldDirection(new THREE.Vector3()).setY(0).normalize(), -moveSpeed); break;
        case 'a': camera.position.addScaledVector(camera.getWorldDirection(new THREE.Vector3()).setY(0).normalize().cross(camera.up).negate(), moveSpeed); break;
        case 'd': camera.position.addScaledVector(camera.getWorldDirection(new THREE.Vector3()).setY(0).normalize().cross(camera.up), moveSpeed); break;
        // 添加空格上升、Shift下降
        case ' ': camera.position.y += moveSpeed; break;
        case 'Shift': camera.position.y -= moveSpeed; break;
    }
});

// 鼠标控制视角旋转
document.addEventListener('mousemove', (e) => {
    if (!isFirstPerson) return;
    const deltaX = e.clientX - mouseX;
    const deltaY = e.clientY - mouseY;
    camera.rotation.y -= deltaX * rotateSpeed;
    camera.rotation.x -= deltaY * rotateSpeed;
    camera.rotation.x = Math.max(-Math.PI/2, Math.min(Math.PI/2, camera.rotation.x)); // 限制上下旋转角度
    mouseX = e.clientX;
    mouseY = e.clientY;
});

//窗口大小自适应
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});
