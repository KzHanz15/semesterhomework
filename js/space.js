/* ===== 三维太阳系：Three.js 场景 ===== */
(function () {
  "use strict";

  var canvas = document.getElementById("three-scene");
  var infoBox = document.getElementById("space-info");
  var infoName = document.getElementById("space-name");
  var infoDetail = document.getElementById("space-detail");
  var legendBox = document.getElementById("legend");

  var PLANETS = [
    { name: "水星", radius: 0.5,  distance: 8,   speed: 4.15, color: 0xa9a9a9, detail: "距日 5790 万公里 · 直径 4879 km · 公转 88 天" },
    { name: "金星", radius: 0.9,  distance: 12,  speed: 1.62, color: 0xe8c468, detail: "距日 1.08 亿公里 · 直径 12104 km · 公转 225 天" },
    { name: "地球", radius: 1.0,  distance: 16,  speed: 1.0,  color: 0x4d8cd1, detail: "距日 1.50 亿公里 · 直径 12756 km · 公转 365 天" },
    { name: "火星", radius: 0.7,  distance: 20,  speed: 0.53, color: 0xc1440e, detail: "距日 2.28 亿公里 · 直径 6792 km · 公转 687 天" },
    { name: "木星", radius: 2.2,  distance: 26,  speed: 0.084, color: 0xd8a179, detail: "距日 7.79 亿公里 · 直径 142984 km · 公转 4333 天" },
    { name: "土星", radius: 1.8,  distance: 33,  speed: 0.034, color: 0xe0c080, detail: "距日 14.34 亿公里 · 直径 120536 km · 公转 10759 天" },
    { name: "天王星", radius: 1.3, distance: 40,  speed: 0.012, color: 0x7fd4d4, detail: "距日 28.73 亿公里 · 直径 51118 km · 公转 30687 天" },
    { name: "海王星", radius: 1.2, distance: 46,  speed: 0.006, color: 0x3f5ea8, detail: "距日 44.95 亿公里 · 直径 49528 km · 公转 60190 天" }
  ];

  var scene, camera, renderer, controls;
  var sun, planets = [], orbits = [], raycaster, mouse, clock;

  function init() {
    scene = new THREE.Scene();

    // 透视相机
    camera = new THREE.PerspectiveCamera(55, canvas.clientWidth / canvas.clientHeight, 0.1, 2000);
    camera.position.set(30, 34, 62);
    camera.lookAt(0, 0, 0);

    // 渲染器
    renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;

    // 轨道控制器：旋转 + 缩放
    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.minDistance = 8;
    controls.maxDistance = 200;

    // 灯光
    var ambient = new THREE.AmbientLight(0x404060, 0.9);
    scene.add(ambient);
    var sunLight = new THREE.PointLight(0xfff2cc, 2, 300);
    sunLight.position.set(0, 0, 0);
    scene.add(sunLight);
    var backLight = new THREE.DirectionalLight(0x6ea8ff, 0.35);
    backLight.position.set(-40, 20, -40);
    scene.add(backLight);

    // 星空粒子背景
    var starGeo = new THREE.BufferGeometry();
    var starCount = 2200;
    var positions = new Float32Array(starCount * 3);
    for (var i = 0; i < starCount * 3; i += 3) {
      positions[i] = (Math.random() - 0.5) * 900;
      positions[i + 1] = (Math.random() - 0.5) * 900;
      positions[i + 2] = (Math.random() - 0.5) * 900;
    }
    starGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    var stars = new THREE.Points(starGeo, new THREE.PointsMaterial({ color: 0xffffff, size: 0.5 }));
    scene.add(stars);

    // 太阳（发光球体 + 光晕）
    sun = new THREE.Mesh(
      new THREE.SphereGeometry(3.2, 48, 48),
      new THREE.MeshBasicMaterial({ color: 0xffc94d })
    );
    scene.add(sun);
    var glow = new THREE.Mesh(
      new THREE.SphereGeometry(3.9, 32, 32),
      new THREE.MeshBasicMaterial({ color: 0xff9d3f, transparent: true, opacity: 0.18 })
    );
    scene.add(glow);

    // 行星 + 轨道
    PLANETS.forEach(function (def) {
      var mesh = new THREE.Mesh(
        new THREE.SphereGeometry(def.radius, 32, 32),
        new THREE.MeshPhongMaterial({ color: def.color, shininess: 12 })
      );
      mesh.userData = def;
      scene.add(mesh);
      planets.push(mesh);

      // 土星环
      if (def.name === "土星") {
        var ring = new THREE.Mesh(
          new THREE.RingGeometry(2.5, 3.8, 64),
          new THREE.MeshBasicMaterial({ color: 0xd9c9a3, side: THREE.DoubleSide, transparent: true, opacity: 0.75 })
        );
        ring.rotation.x = Math.PI / 2.4;
        mesh.add(ring);
      }

      // 轨道线
      var orbit = new THREE.LineLoop(
        new THREE.BufferGeometry().setFromPoints(orbitPoints(def.distance)),
        new THREE.LineBasicMaterial({ color: 0x4a5a85, transparent: true, opacity: 0.5 })
      );
      scene.add(orbit);
      orbits.push(orbit);
    });

    // 点击交互：射线检测
    raycaster = new THREE.Raycaster();
    mouse = new THREE.Vector2();
    clock = new THREE.Clock();

    renderer.domElement.addEventListener("pointerdown", onPointerDown);

    // 图例
    legendBox.innerHTML = PLANETS.map(function (d) {
      return '<span><i style="background:#' + d.color.toString(16).padStart(6, "0") + '"></i>' + d.name + "</span>";
    }).join("");

    window.addEventListener("resize", onResize);
    animate();
  }

  function orbitPoints(r) {
    var pts = [];
    for (var i = 0; i <= 128; i++) {
      var a = (i / 128) * Math.PI * 2;
      pts.push(new THREE.Vector3(Math.cos(a) * r, 0, Math.sin(a) * r));
    }
    return pts;
  }

  function onPointerDown(event) {
    var rect = renderer.domElement.getBoundingClientRect();
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);
    var hits = raycaster.intersectObjects(planets);
    if (hits.length > 0) {
      showPlanetInfo(hits[0].object.userData);
    } else {
      infoBox.classList.remove("show");
    }
  }

  // 展示行星信息面板（点击行星与 ?focus= 深链接共用）
  function showPlanetInfo(def) {
    infoName.textContent = def.name;
    infoDetail.textContent = def.detail;
    infoBox.classList.add("show");
  }

  function onResize() {
    var w = canvas.clientWidth;
    var h = canvas.clientHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h, false);
  }

  function animate() {
    requestAnimationFrame(animate);
    var t = clock.getElapsedTime();

    // 行星公转
    planets.forEach(function (mesh) {
      var def = mesh.userData;
      var angle = t * def.speed * 0.6;
      mesh.position.set(Math.cos(angle) * def.distance, 0, Math.sin(angle) * def.distance);
      mesh.rotation.y += 0.01;
    });

    sun.rotation.y += 0.002;
    controls.update();
    renderer.render(scene, camera);
  }

  // 等页面完全加载后初始化，确保容器尺寸正确
  if (document.readyState === "complete") {
    init();
  } else {
    window.addEventListener("load", init);
  }

  // 深链接：?focus=行星名 自动展示对应行星信息
  var focusParam = new URLSearchParams(window.location.search).get("focus");
  if (focusParam) {
    window.addEventListener("load", function () {
      var target = PLANETS.filter(function (d) { return d.name === focusParam; })[0];
      if (target) setTimeout(function () { showPlanetInfo(target); }, 1200);
    });
  }
})();
