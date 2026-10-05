/* ===== 公共脚本：导航折叠、页面激活态 ===== */
(function () {
  "use strict";

  // 移动端导航折叠
  var toggle = document.querySelector(".nav-toggle");
  var links = document.querySelector(".nav-links");
  if (toggle && links) {
    toggle.addEventListener("click", function () {
      links.classList.toggle("open");
    });
    links.addEventListener("click", function (e) {
      if (e.target.tagName === "A") links.classList.remove("open");
    });
  }

  // 高亮当前页面对应的导航项
  var current = window.location.pathname.split("/").pop() || "index.html";
  document.querySelectorAll(".nav-links a").forEach(function (a) {
    if (a.getAttribute("href") === current) a.classList.add("active");
  });
})();
