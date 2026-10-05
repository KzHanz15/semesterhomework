/* ===== 行星档案页：数据加载 / 搜索 / 筛选 / 排序 / 收藏 / 详情 ===== */
(function () {
  "use strict";

  // 通过 URL 参数可指定数据源，便于演示错误处理场景
  // 例：planets.html?src=broken  → 模拟网络失败；planets.html?src=empty → 模拟数据为空
  var params = new URLSearchParams(window.location.search);
  var srcMode = params.get("src") || "normal";
  var dataUrl = params.get("url") || "data/planets.json";

  var state = {
    all: [],
    keyword: "",
    type: "all",
    sort: "default",
    favorites: loadFavorites()
  };

  var els = {
    grid: document.getElementById("planet-grid"),
    empty: document.getElementById("empty-tip"),
    emptyText: document.getElementById("empty-text"),
    meta: document.getElementById("result-meta"),
    status: document.getElementById("status-box"),
    search: document.getElementById("search-input"),
    sort: document.getElementById("sort-select"),
    chips: document.querySelectorAll("#type-chips .chip"),
    mask: document.getElementById("modal-mask"),
    modalName: document.getElementById("modal-name"),
    modalEn: document.getElementById("modal-en"),
    modalDesc: document.getElementById("modal-desc"),
    modalTable: document.getElementById("modal-table"),
    modalClose: document.getElementById("modal-close")
  };

  /* ---------- 错误处理：三种场景 ---------- */
  function showStatus(type, msg) {
    els.status.className = "status-box show " + type;
    els.status.textContent = msg;
  }
  function clearStatus() { els.status.className = "status-box"; }

  // 1) 非法输入校验：名称过滤，超过 30 字或含非法字符时提示
  function validateKeyword(raw) {
    if (raw.length > 30) {
      showStatus("error", "输入内容过长（最多 30 个字符），请缩短后重试。");
      return null;
    }
    if (/[<>{}]/g.test(raw)) {
      showStatus("error", "输入包含非法字符 < > { }，请重新输入。");
      return null;
    }
    clearStatus();
    return raw.trim().toLowerCase();
  }

  // 2) 网络失败 / 数据为空处理
  function loadPlanets() {
    showStatus("warn", "正在加载行星数据…");
    fetch(dataUrl)
      .then(function (res) {
        if (!res.ok) throw new Error("HTTP " + res.status);
        return res.json();
      })
      .then(function (data) {
        if (!data || !Array.isArray(data.planets) || data.planets.length === 0) {
          showStatus("error", "数据源为空或格式不正确，请检查 JSON 文件结构。");
          render([]);
          return;
        }
        state.all = data.planets;
        clearStatus();
        render();
      })
      .catch(function (err) {
        console.error("加载数据失败：", err);
        showStatus("error", "数据加载失败：" + err.message + "。请检查网络连接后刷新页面重试。");
        render([]);
      });
  }

  /* ---------- 渲染 ---------- */
  function filtered() {
    var list = state.all.slice();
    if (state.type !== "all") list = list.filter(function (p) { return p.type === state.type; });
    if (state.keyword) {
      list = list.filter(function (p) {
        return p.name.toLowerCase().indexOf(state.keyword) !== -1 ||
               p.nameEn.toLowerCase().indexOf(state.keyword) !== -1;
      });
    }
    if (state.sort !== "default") {
      var key = state.sort;
      list.sort(function (a, b) { return b[key] - a[key]; });
    }
    return list;
  }

  function render(list) {
    if (!list) list = filtered();
    els.grid.innerHTML = "";
    if (list.length === 0) {
      els.empty.style.display = "block";
      els.emptyText.textContent =
        srcMode === "empty" ? "数据源为空，暂时没有可展示的行星。"
                            : (state.keyword ? "没有找到与「" + els.search.value + "」匹配的行星，换个关键词试试。" : "暂无数据。");
      els.meta.textContent = "";
      return;
    }
    els.empty.style.display = "none";
    els.meta.textContent = "共 " + list.length + " 颗行星（共 " + state.all.length + " 颗，已过滤 " + (state.all.length - list.length) + " 颗）";

    list.forEach(function (p) {
      var isFav = state.favorites.indexOf(String(p.id)) !== -1;
      var card = document.createElement("div");
      card.className = "planet-card";
      card.tabIndex = 0;
      card.innerHTML =
        '<button class="fav-btn' + (isFav ? " on" : "") + '" data-id="' + p.id + '" aria-label="收藏">' + (isFav ? "★" : "☆") + "</button>" +
        '<div class="planet-orb" style="background:radial-gradient(circle at 35% 35%, ' + p.color + ', rgba(0,0,0,0.4));"></div>' +
        "<h3>" + p.name + "</h3>" +
        '<div class="en">' + p.nameEn + "</div>" +
        '<div class="meta">直径 ' + p.diameter.toLocaleString() + " km<br>距日 " + p.distance + " 百万km</div>";
      card.addEventListener("click", function () { openModal(p); });
      els.grid.appendChild(card);
    });

    // 收藏按钮事件（阻止冒泡，避免触发卡片点击）
    els.grid.querySelectorAll(".fav-btn").forEach(function (btn) {
      btn.addEventListener("click", function (e) {
        e.stopPropagation();
        toggleFavorite(btn);
      });
    });
  }

  /* ---------- 收藏（localStorage） ---------- */
  function loadFavorites() {
    try {
      return JSON.parse(localStorage.getItem("starFavs")) || [];
    } catch (e) { return []; }
  }
  function saveFavorites() {
    localStorage.setItem("starFavs", JSON.stringify(state.favorites));
  }
  function toggleFavorite(btn) {
    var id = btn.getAttribute("data-id");
    var idx = state.favorites.indexOf(id);
    if (idx !== -1) { state.favorites.splice(idx, 1); btn.classList.remove("on"); btn.textContent = "☆"; }
    else { state.favorites.push(id); btn.classList.add("on"); btn.textContent = "★"; }
    saveFavorites();
    showStatus("success", idx !== -1 ? "已取消收藏。" : "收藏成功！收藏列表保存在本地浏览器中。");
    setTimeout(clearStatus, 2000);
  }

  /* ---------- 详情弹窗 ---------- */
  function openModal(p) {
    els.modalName.textContent = p.name;
    els.modalEn.textContent = p.nameEn + " · " + p.type;
    els.modalDesc.textContent = p.description;
    els.modalTable.innerHTML =
      "<tr><td>直径</td><td>" + p.diameter.toLocaleString() + " 公里</td></tr>" +
      "<tr><td>距日距离</td><td>" + p.distance + " 百万公里</td></tr>" +
      "<tr><td>公转周期</td><td>" + p.period.toLocaleString() + " 天</td></tr>" +
      "<tr><td>卫星数量</td><td>" + p.moons + " 颗</td></tr>" +
      "<tr><td>平均温度</td><td>" + p.temperature + " ℃</td></tr>" +
      "<tr><td>表面重力</td><td>" + p.gravity + " m/s²</td></tr>";
    els.mask.classList.add("open");
  }
  els.mask.addEventListener("click", function (e) { if (e.target === els.mask) closeModal(); });
  els.modalClose.addEventListener("click", closeModal);
  function closeModal() { els.mask.classList.remove("open"); }

  /* ---------- 事件绑定 ---------- */
  els.search.addEventListener("input", function () {
    var kw = validateKeyword(els.search.value);
    if (kw === null) { els.empty.style.display = "none"; els.grid.innerHTML = ""; els.meta.textContent = ""; return; }
    state.keyword = kw;
    render();
  });

  els.sort.addEventListener("change", function () {
    state.sort = els.sort.value;
    render();
  });

  els.chips.forEach(function (chip) {
    chip.addEventListener("click", function () {
      els.chips.forEach(function (c) { c.classList.remove("active"); });
      chip.classList.add("active");
      state.type = chip.getAttribute("data-type");
      render();
    });
  });

  /* ---------- 启动 ---------- */
  if (srcMode === "broken") {
    // 演示场景：请求一个不存在的地址，触发网络失败分支
    fetch("data/not-exist.json")
      .then(function (res) { if (!res.ok) throw new Error("HTTP " + res.status); return res.json(); })
      .catch(function (err) {
        console.error("加载数据失败：", err);
        showStatus("error", "数据加载失败：" + err.message + "。请检查网络连接后刷新页面重试。");
        render([]);
      });
  } else if (srcMode === "empty") {
    // 演示场景：加载空数据源，触发数据为空分支
    dataUrl = "data/empty.json";
    loadPlanets();
  } else {
    loadPlanets();
  }
})();
