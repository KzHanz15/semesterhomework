/* ===== 首页：今日观星提示 ===== */
(function () {
  "use strict";

  var tipEl = document.getElementById("tip-content");
  if (!tipEl) return;

  function tipOfToday() {
    var now = new Date();
    var month = now.getMonth() + 1;
    var date = now.getDate();
    if ((month === 10 || month === 11) && (date >= 20 || date <= 20)) {
      return "十月底至十一月初，木星进入观测佳期，天黑后于东方天空可见，亮度远超群星，建议使用双筒望远镜观测。";
    }
    if (month >= 4 && month <= 8) {
      return "夏季银河壮美，朝南方向可见天蝎座与人马座，用肉眼即可辨认银河最亮的核心区域。";
    }
    if (month >= 1 && month <= 3 || month === 12) {
      return "冬季是观测金星与猎户座的最佳时节，金星在日落后的西方天空明亮夺目。";
    }
    return "今夜云量较少时，建议前往光污染较弱的郊区，等待约 20 分钟让眼睛适应黑暗后仰望星空。";
  }

  tipEl.textContent = tipOfToday();
})();
