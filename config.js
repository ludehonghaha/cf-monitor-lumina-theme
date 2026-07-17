/*
 * CF Monitor Lumina Theme
 * 服务器卡片图片配置
 */

window.LUMINA_CONFIG = {
  version: "1.0.0",

  /*
   * 默认图片设置
   */
  defaultImage: {
    height: 120,
    fit: "cover",
    position: "center"
  },

  /*
   * 服务器名称必须与监控面板显示名称完全一致
   */
  serverImages: {
    "Akile-JP": {
      src: "https://cdn.jsdelivr.net/gh/ludehonghaha/cf-monitor-lumina-theme@main/assets/jp.jpg",
      alt: "Akile-JP",
      height: 120,
      fit: "cover",
      position: "center 45%"
    }
  }
};
