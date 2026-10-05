/* ===== 数据可视化页：ECharts 柱状图 / 饼图 / 雷达图 ===== */
(function () {
  "use strict";

  var statusBox = document.getElementById("status-box");
  var charts = [];

  function showError(msg) {
    statusBox.className = "status-box show error";
    statusBox.textContent = msg;
  }

  function loadData() {
    fetch("data/planets.json")
      .then(function (res) {
        if (!res.ok) throw new Error("HTTP " + res.status);
        return res.json();
      })
      .then(function (data) {
        if (!data || !Array.isArray(data.planets) || data.planets.length === 0) {
          showError("数据加载失败：数据源为空。");
          return;
        }
        buildCharts(data.planets);
      })
      .catch(function (err) {
        console.error(err);
        showError("数据加载失败：" + err.message + "。");
      });
  }

  function buildCharts(planets) {
    var names = planets.map(function (p) { return p.name; });

    // 柱状图：直径
    var bar = echarts.init(document.getElementById("chart-bar"));
    bar.setOption({
      backgroundColor: "transparent",
      tooltip: { trigger: "axis", axisPointer: { type: "shadow" } },
      grid: { left: 60, right: 24, top: 30, bottom: 40 },
      xAxis: {
        type: "category",
        data: names,
        axisLabel: { color: "#9aa5c4" },
        axisLine: { lineStyle: { color: "rgba(255,255,255,0.2)" } }
      },
      yAxis: {
        type: "value",
        name: "直径 (km)",
        nameTextStyle: { color: "#9aa5c4" },
        axisLabel: { color: "#9aa5c4" },
        splitLine: { lineStyle: { color: "rgba(255,255,255,0.08)" } }
      },
      series: [{
        name: "直径",
        type: "bar",
        barWidth: "55%",
        data: planets.map(function (p) {
          return { value: p.diameter, itemStyle: { color: p.color } };
        }),
        label: { show: true, position: "top", color: "#e8ecf8", fontSize: 10 }
      }]
    });
    charts.push(bar);

    // 饼图：类型分布
    var typeCount = {};
    planets.forEach(function (p) { typeCount[p.type] = (typeCount[p.type] || 0) + 1; });
    var pieData = Object.keys(typeCount).map(function (k) { return { name: k, value: typeCount[k] }; });
    var pie = echarts.init(document.getElementById("chart-pie"));
    pie.setOption({
      backgroundColor: "transparent",
      tooltip: { trigger: "item", formatter: "{b}：{c} 颗（{d}%）" },
      legend: {
        bottom: 0,
        textStyle: { color: "#9aa5c4" }
      },
      series: [{
        name: "行星类型",
        type: "pie",
        radius: ["42%", "68%"],
        center: ["50%", "45%"],
        label: { color: "#e8ecf8" },
        data: pieData,
        color: ["#4d8cd1", "#e0a04a", "#7fd4d4"]
      }]
    });
    charts.push(pie);

    // 雷达图：地/火/木 五维归一化对比
    var targets = planets.filter(function (p) { return ["地球", "火星", "木星"].indexOf(p.name) !== -1; });
    var indicators = [
      { name: "直径", max: 150000 },
      { name: "距日距离", max: 5000 },
      { name: "平均温度(取绝对值)", max: 300 },
      { name: "表面重力", max: 30 },
      { name: "卫星数", max: 150 }
    ];
    var radar = echarts.init(document.getElementById("chart-radar"));
    radar.setOption({
      backgroundColor: "transparent",
      tooltip: {},
      legend: { top: 0, textStyle: { color: "#9aa5c4" } },
      radar: {
        indicator: indicators,
        axisName: { color: "#9aa5c4" },
        splitLine: { lineStyle: { color: "rgba(255,255,255,0.15)" } },
        splitArea: { areaStyle: { color: ["rgba(110,168,255,0.03)", "rgba(110,168,255,0.06)"] } },
        axisLine: { lineStyle: { color: "rgba(255,255,255,0.2)" } }
      },
      series: [{
        type: "radar",
        data: targets.map(function (p) {
          return {
            name: p.name,
            value: [p.diameter, p.distance, Math.abs(p.temperature), p.gravity, p.moons],
            areaStyle: { opacity: 0.2 }
          };
        }),
        color: ["#4d8cd1", "#c1440e", "#d8a179"]
      }]
    });
    charts.push(radar);

    // 自适应窗口
    window.addEventListener("resize", function () { charts.forEach(function (c) { c.resize(); }); });
  }

  loadData();
})();
