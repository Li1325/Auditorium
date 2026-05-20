import * as THREE from 'three';

import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

import {GUI} from 'three/addons/libs/lil-gui.module.min.js';

import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';

import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';

import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';

const gui = new GUI();
gui.domElement.style.right = '0px';
gui.domElement.style.width = '240px';

// 用于存储加载成功后的GLB模型场景
let gltfScene = null;
let tableTop = null;

//基础场景初始化
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xf0f0f0);

const stage1 = new THREE.Mesh(new THREE.BoxGeometry(5, 0.5, 5), new THREE.MeshBasicMaterial({ opacity: 0, transparent: true }));
stage1.position.set(22,-4,-28); // 区域1坐标
scene.add(stage1);

// 射线检测虚拟区域
window.addEventListener('click', (e) => {
  mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
  raycaster.setFromCamera(mouse, camera);

  // 虚拟对象（传入数组）
  const intersects = raycaster.intersectObjects([stage1]);
  if (intersects.length > 0) {
    const clickedStage = intersects[0].object;
    if (clickedStage === stage1) {
      alert('点击到区域1：电子显示屏');
    }
  }
});

//透视相机
const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(40, 60, 75);

// 渲染器初始化
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);

// 初始化后期合成器（辉光效果）
let composer = null;
initPostProcessing();

// 启用轨道控制器（交互控制相机）
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true; //阻尼器
controls.dampingFactor = 0.05;
controls.maxPolarAngle = Math.PI / 2; // 限制垂直旋转角度

controls.enableKeys = false;
controls.enableRotate = true; //鼠标拖拽旋转
controls.enableZoom = true; //保留鼠标滚轮缩放

//光源及GUI交互
// 添加环境光
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
ambientLight.decay = 0;
scene.add(ambientLight);

//添加平行光
const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
directionalLight.position.set(5, 5, 5);
directionalLight.castShadow = true;
directionalLight.shadow.camera.left = -20;
directionalLight.shadow.camera.right = 20;
directionalLight.shadow.camera.top = 20;
directionalLight.shadow.camera.bottom = -20;
scene.add(directionalLight);

//添加点光源
const pointLight = new THREE.PointLight(0xffff00, 1);
pointLight.position.set(0, 3, 0);
pointLight.decay = 0;
pointLight.distance = 10;
pointLight.castShadow = true;
scene.add(pointLight);

//聚光灯
const spotLight = new THREE.SpotLight(0xffffff, 1);
spotLight.position.set(10, 20, 10);
spotLight.angle = Math.PI / 6;
spotLight.penumbra = 0.2;
spotLight.distance = 50;
spotLight.castShadow = true;
spotLight.shadow.mapSize.width = 1024;
spotLight.shadow.mapSize.height = 1024;
spotLight.shadow.camera.near = 1;
spotLight.shadow.camera.far = 30;
scene.add(spotLight);

// 灯光平滑移动动画
let isPointLightAnimating = false; // 光源动画是否运行
let animationFrameId = null; // 动画帧ID，用于停止动画
const pointLightMoveRange = 15; // 点光源左右移动的最大范围
const pointLightMoveSpeed = 0.08; // 动画移动速度，值越大越快
let animationProgress = 0;

// 定义灯光集合
const lights = {
  ambientLight: ambientLight, // 环境光
  directionalLight: directionalLight, // 平行光
  pointLight: pointLight, // 点光源
  spotLight: spotLight // 聚光灯
};

// 环境光GUI控制
const ambientLightFolder = gui.addFolder('环境光设置');
ambientLightFolder.open();
ambientLightFolder.add(lights.ambientLight, 'intensity', 0, 2.0).name('强度').step(0.1);

// 平行光GUI控制
const dirLightFolder = gui.addFolder('平行光设置');
dirLightFolder.open();
// 强度
dirLightFolder.add(lights.directionalLight, 'intensity', 0, 2.0).name('强度').step(0.1);
// 位置
const dirLightPos = {
  x: lights.directionalLight.position.x,
  y: lights.directionalLight.position.y,
  z: lights.directionalLight.position.z
};
dirLightFolder.add(dirLightPos, 'x', -50, 50).name('X位置').onChange(val => lights.directionalLight.position.x = val);
dirLightFolder.add(dirLightPos, 'y', -50, 50).name('Y位置').onChange(val => lights.directionalLight.position.y = val);
dirLightFolder.add(dirLightPos, 'z', -50, 50).name('Z位置').onChange(val => lights.directionalLight.position.z = val);
// 颜色
const dirLightColor = {
  color: lights.directionalLight.color.getHex()
};
dirLightFolder.addColor(dirLightColor, 'color').name('灯光颜色').onChange(val => lights.directionalLight.color.set(val));

// 点光源GUI控制
const pointLightFolder = gui.addFolder('点光源设置');
pointLightFolder.open();
// 强度
pointLightFolder.add(lights.pointLight, 'intensity', 0, 2.0).name('强度').step(0.1);
// 位置
const pointLightPos = {
  x: lights.pointLight.position.x,
  y: lights.pointLight.position.y,
  z: lights.pointLight.position.z
};
pointLightFolder.add(pointLightPos, 'x', -50, 50).name('X位置').onChange(val => lights.pointLight.position.x = val);
pointLightFolder.add(pointLightPos, 'y', -50, 50).name('Y位置').onChange(val => lights.pointLight.position.y = val);
pointLightFolder.add(pointLightPos, 'z', -50, 50).name('Z位置').onChange(val => lights.pointLight.position.z = val);
// 照射距离
pointLightFolder.add(lights.pointLight, 'distance', 0, 50).name('照射距离').step(1);
// 颜色
const pointLightColor = {
  color: lights.pointLight.color.getHex()
};
pointLightFolder.addColor(pointLightColor, 'color').name('灯光颜色').onChange(val => lights.pointLight.color.set(val));

// 创建聚光灯专属GUI分组
const spotLightFolder = gui.addFolder('聚光灯设置');
spotLightFolder.open(); // 默认展开分组

// 聚光灯：基础强度控制
spotLightFolder.add(lights.spotLight, 'intensity', 0, 2.0).name('强度').step(0.1);

// 聚光灯：独有属性控制
spotLightFolder.add(lights.spotLight, 'angle', 0, Math.PI / 2).name('照射角度').step(0.01).onChange(() => lights.spotLight.target.updateMatrixWorld());

spotLightFolder.add(lights.spotLight, 'penumbra', 0, 1.0).name('半影强度').step(0.05);

spotLightFolder.add(lights.spotLight, 'distance', 0, 100).name('照射距离').step(1);

// 聚光灯：位置控制
const spotLightPos = {
  x: lights.spotLight.position.x,
  y: lights.spotLight.position.y,
  z: lights.spotLight.position.z
};
spotLightFolder.add(spotLightPos, 'x', -50, 50).name('X位置').onChange(val => lights.spotLight.position.x = val);
spotLightFolder.add(spotLightPos, 'y', -50, 50).name('Y位置').onChange(val => lights.spotLight.position.y = val);
spotLightFolder.add(spotLightPos, 'z', -50, 50).name('Z位置').onChange(val => lights.spotLight.position.z = val);

// 聚光灯：颜色控制
const spotLightColor = {
  color: lights.spotLight.color.getHex()
};
spotLightFolder.addColor(spotLightColor, 'color').name('灯光颜色').onChange(val => lights.spotLight.color.set(val));
// 全景图作为场景背景（天空盒）
const textureLoader = new THREE.TextureLoader();
const skyTexture = textureLoader.load('sky-8.png'); 
skyTexture.mapping = THREE.EquirectangularReflectionMapping;
// 将全景图设为场景背景
scene.background = skyTexture;

//引入礼堂模型
const loader = new GLTFLoader();
loader.load(
  '44.glb',
  function (gltf) {
    gltf.scene.position.set(0, -5, 0);
    gltf.scene.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
    scene.add(gltf.scene);
    gltfScene = gltf.scene;
    console.log('GLB模型加载成功！', gltf.scene);
 }
);
// 指示灯
const spriteMat = new THREE.SpriteMaterial({ color: 0xff0000 });
const indicator = new THREE.Sprite(spriteMat);
indicator.position.set(30, -4, -24);// 舞台旁边
indicator.scale.set(0.3, 0.3, 1);
scene.add(indicator);

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


// 外部视角复位按钮
const outerReviewBtn = document.getElementById('outer-review');
if (outerReviewBtn) {
  outerReviewBtn.addEventListener('click', () => {
    isFirstPerson = false; // 复位时切换回第三人称
    document.body.style.cursor = 'default';
    controls.enableRotate = true;
    camera.position.set(30, 50, 70);
    controls.target.set(0, 0, 0);
    controls.update();
    
    // 退出内部视角，停止点光源动画
    isPointLightAnimating = false;
    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId); // 取消动画帧，停止循环
      animationFrameId = null;
    }
    // 外部视角时，隐藏开关灯按钮
    const lightToggleBtn = document.getElementById('light-toggle');
    if (lightToggleBtn) lightToggleBtn.style.display = 'none';
  });
} else {
  console.warn('外部视角复位按钮（outer-review）未找到，忽略该功能');
}

// 内部视角复位按钮
const innerReviewBtn = document.getElementById('inner-review');
if (innerReviewBtn) {
  innerReviewBtn.addEventListener('click', () => {
    isFirstPerson = false; // 复位时切换回第三人称
    document.body.style.cursor = 'default';
    controls.enableRotate = true;
    camera.position.set(24, 7, -13);
    controls.target.set(24, 0, -24);
    controls.update();

    // 进入内部视角，启动灯光动画
    if (!isPointLightAnimating) {
      isPointLightAnimating = true;
      // 启动动画循环，获取动画帧ID
      animationFrameId = requestAnimationFrame(pointLightMoveAnimation);
    }

    // 显示开关灯按钮
    const lightToggleBtn = document.getElementById('light-toggle');
    if (lightToggleBtn) lightToggleBtn.style.display = 'inline-block';
  });
} else {
  console.warn('内部视角复位按钮（inner-review）未找到，忽略该功能');
}

// 获取开关灯按钮
const lightToggleBtn = document.getElementById('light-toggle');
// 记录当前灯的状态（默认关灯）
let isLightOn = false;

if (!lightToggleBtn) {
  console.warn('开关灯按钮（light-toggle）未找到，忽略开关灯功能');
} else {
  // 内部视角复位时显示开关灯按钮
  if (innerReviewBtn) {
    innerReviewBtn.addEventListener('click', () => {
      lightToggleBtn.style.display = 'inline-block';
    });
  }

  // 外部视角复位时隐藏开关灯按钮
  if (outerReviewBtn) {
    outerReviewBtn.addEventListener('click', () => {
      lightToggleBtn.style.display = 'none';
    });
  }

  // 开关灯按钮
  lightToggleBtn.addEventListener('click', () => {
    if (isLightOn) {
      lights.ambientLight.intensity = 0;
      lightToggleBtn.textContent = '开灯';
    } else {
      lights.ambientLight.intensity = 2;
      lightToggleBtn.textContent = '关灯';
    }
    isLightOn = !isLightOn;
    ambientLightFolder.__controllers[0].updateDisplay();
  });
}


// 灯光动画
function pointLightMoveAnimation() {
  if (!lights || !lights.pointLight || !pointLightFolder) {
    isPointLightAnimating = false;
    return;
  }

  animationProgress += pointLightMoveSpeed;
  const targetX = Math.sin(animationProgress) * pointLightMoveRange;
  lights.pointLight.position.x = targetX;

  // 稳妥的索引访问，避免报错
  if (pointLightFolder && pointLightFolder.__controllers && pointLightFolder.__controllers.length > 1) {
    pointLightFolder.__controllers[1].updateDisplay();
  }

  if (isPointLightAnimating) {
    animationFrameId = requestAnimationFrame(pointLightMoveAnimation);
  }
}


// 基础交互与调试：实现“点击舞台显示名称”功能。
// 点击交互（射线检测）
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
window.addEventListener('click', (e) => {
    // 转换鼠标坐标为Three.js标准坐标
    mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);
    
    // 检测与舞台的交点
    const intersects = raycaster.intersectObject(tableTop);
    if (intersects.length > 0) {
        alert('舞台：电子显示屏');
    }
});

// 初始化后期处理（辉光效果）
function initPostProcessing() {
  composer = new EffectComposer(renderer);
  const renderPass = new RenderPass(scene, camera);
  composer.addPass(renderPass);

  // 辉光通道：增强指示灯效果
  const bloomPass = new UnrealBloomPass(
    new THREE.Vector2(window.innerWidth, window.innerHeight),
    0.2, // 强度
    0.4, // 半径
    0.3  // 阈值
  );
  composer.addPass(bloomPass);
}

// 动画启停
let isAnimating = true;
document.getElementById('toggle-animation').addEventListener('click', () => {
  isAnimating = !isAnimating;
  const btn = document.getElementById('toggle-animation');
  btn.textContent = isAnimating ? '暂停动画' : '启动动画';
  document.getElementById('status').textContent = isAnimating ? '运行中' : '已暂停';
});

//窗口大小自适应
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});
