/*
 * CF Monitor Lumina Theme
 * Server card image loader
 * Version: 1.0.0
 *
 * 功能：
 * 1. 根据服务器显示名称匹配图片
 * 2. 将图片显示为服务器卡片背景
 * 3. 不读取 Cookie、密码、Token 或接口数据
 * 4. 不拦截 fetch、WebSocket、表单和点击事件
 */

(function () {
  "use strict";

  if (window.__CF_LUMINA_IMAGE_LOADED__) {
    return;
  }

  window.__CF_LUMINA_IMAGE_LOADED__ = true;

  var observer = null;
  var refreshTimer = null;

  function getConfig() {
    return window.LUMINA_CONFIG || {};
  }

  function normalizeText(value) {
    return String(value || "")
      .replace(/\s+/g, " ")
      .trim()
      .toLowerCase();
  }

  function injectStyles() {
    if (document.getElementById("lumina-server-image-styles")) {
      return;
    }

    var style = document.createElement("style");
    style.id = "lumina-server-image-styles";

    style.textContent = [
      ".server-card.lumina-image-card,",
      ".host-card.lumina-image-card {",
      "  position: relative !important;",
      "  overflow: hidden !important;",
      "  isolation: isolate !important;",
      "}",

      ".lumina-card-image-background {",
      "  position: absolute !important;",
      "  inset: 0 !important;",
      "  z-index: 0 !important;",
      "  overflow: hidden !important;",
      "  pointer-events: none !important;",
      "  border-radius: inherit !important;",
      "}",

      ".lumina-card-image-background img {",
      "  display: block !important;",
      "  width: 100% !important;",
      "  height: 100% !important;",
      "  object-fit: var(--lumina-image-fit, cover) !important;",
      "  object-position: var(--lumina-image-position, center) !important;",
      "  opacity: var(--lumina-image-opacity, 0.20) !important;",
      "  transform: scale(1.025);",
      "  filter: saturate(0.92) contrast(0.96);",
      "}",

      ".lumina-card-image-background::after {",
      '  content: "" !important;',
      "  position: absolute !important;",
      "  inset: 0 !important;",
      "  background:",
      "    linear-gradient(",
      "      90deg,",
      "      rgba(11, 16, 32, 0.72) 0%,",
      "      rgba(11, 16, 32, 0.40) 45%,",
      "      rgba(11, 16, 32, 0.62) 100%",
      "    ),",
      "    linear-gradient(",
      "      180deg,",
      "      rgba(11, 16, 32, 0.18) 0%,",
      "      rgba(11, 16, 32, 0.56) 100%",
      "    ) !important;",
      "}",

      "body.light .lumina-card-image-background::after {",
      "  background:",
      "    linear-gradient(",
      "      90deg,",
      "      rgba(255, 255, 255, 0.75) 0%,",
      "      rgba(255, 255, 255, 0.46) 45%,",
      "      rgba(255, 255, 255, 0.68) 100%",
      "    ),",
      "    linear-gradient(",
      "      180deg,",
      "      rgba(255, 255, 255, 0.18) 0%,",
      "      rgba(255, 255, 255, 0.56) 100%",
      "    ) !important;",
      "}",

      ".server-card.lumina-image-card",
      "  > :not(.lumina-card-image-background),",
      ".host-card.lumina-image-card",
      "  > :not(.lumina-card-image-background) {",
      "  position: relative;",
      "  z-index: 1;",
      "}",

      ".lumina-card-image-banner {",
      "  position: relative !important;",
      "  z-index: 1 !important;",
      "  width: auto !important;",
      "  height: var(--lumina-image-height, 120px) !important;",
      "  margin: -20px -20px 14px !important;",
      "  overflow: hidden !important;",
      "  pointer-events: none !important;",
      "  border-bottom:",
      "    1px solid rgba(148, 163, 184, 0.16) !important;",
      "}",

      ".lumina-card-image-banner img {",
      "  display: block !important;",
      "  width: 100% !important;",
      "  height: 100% !important;",
      "  object-fit: var(--lumina-image-fit, cover) !important;",
      "  object-position: var(--lumina-image-position, center) !important;",
      "}",

      "@media (max-width: 768px) {",
      "  .lumina-card-image-banner {",
      "    margin: -16px -16px 12px !important;",
      "    height: min(var(--lumina-image-height, 110px), 110px) !important;",
      "  }",
      "}"
    ].join("\n");

    document.head.appendChild(style);
  }

  function createNameMap(serverImages) {
    var map = {};

    Object.keys(serverImages || {}).forEach(function (name) {
      map[normalizeText(name)] = {
        name: name,
        options: serverImages[name]
      };
    });

    return map;
  }

  function findServerName(card, nameMap) {
    var selectors = [
      ".server-name",
      ".host-name",
      ".server-name-link",
      "[data-server-name]",
      '[class*="server-name"]',
      '[class*="host-name"]'
    ];

    var candidates = card.querySelectorAll(selectors.join(","));
    var index;
    var normalized;

    for (index = 0; index < candidates.length; index += 1) {
      normalized = normalizeText(
        candidates[index].getAttribute("data-server-name") ||
        candidates[index].textContent
      );

      if (nameMap[normalized]) {
        return nameMap[normalized];
      }
    }

    /*
     * 兼容页面类名发生变化：
     * 只检查短文本元素，不读取表单内容和隐藏配置。
     */
    candidates = card.querySelectorAll(
      "a, strong, b, h1, h2, h3, h4, span"
    );

    for (index = 0; index < candidates.length; index += 1) {
      normalized = normalizeText(candidates[index].textContent);

      if (nameMap[normalized]) {
        return nameMap[normalized];
      }
    }

    return null;
  }

  function removeOldImage(card) {
    var oldImage = card.querySelector(
      ":scope > .lumina-card-image-background," +
      ":scope > .lumina-card-image-banner"
    );

    if (oldImage && oldImage.parentNode) {
      oldImage.parentNode.removeChild(oldImage);
    }

    card.classList.remove("lumina-image-card");
    card.removeAttribute("data-lumina-server-image");
  }

  function addBackgroundImage(card, serverName, options) {
    var layer = document.createElement("div");
    var image = document.createElement("img");

    layer.className = "lumina-card-image-background";

    image.alt = options.alt || serverName;
    image.loading = "lazy";
    image.decoding = "async";
    image.referrerPolicy = "no-referrer";
    image.src = options.src;

    image.addEventListener("error", function () {
      if (layer.parentNode) {
        layer.parentNode.removeChild(layer);
      }

      card.classList.remove("lumina-image-card");
      card.removeAttribute("data-lumina-server-image");
    });

    layer.appendChild(image);

    card.style.setProperty(
      "--lumina-image-fit",
      options.fit || "cover"
    );

    card.style.setProperty(
      "--lumina-image-position",
      options.position || "center"
    );

    card.style.setProperty(
      "--lumina-image-opacity",
      String(
        typeof options.opacity === "number"
          ? options.opacity
          : 0.22
      )
    );

    card.classList.add("lumina-image-card");
    card.setAttribute("data-lumina-server-image", serverName);
    card.insertBefore(layer, card.firstChild);
  }

  function addBannerImage(card, serverName, options, defaultImage) {
    var banner = document.createElement("div");
    var image = document.createElement("img");

    banner.className = "lumina-card-image-banner";

    image.alt = options.alt || serverName;
    image.loading = "lazy";
    image.decoding = "async";
    image.referrerPolicy = "no-referrer";
    image.src = options.src;

    image.addEventListener("error", function () {
      if (banner.parentNode) {
        banner.parentNode.removeChild(banner);
      }

      card.classList.remove("lumina-image-card");
      card.removeAttribute("data-lumina-server-image");
    });

    banner.appendChild(image);

    card.style.setProperty(
      "--lumina-image-height",
      String(
        options.height ||
        defaultImage.height ||
        120
      ) + "px"
    );

    card.style.setProperty(
      "--lumina-image-fit",
      options.fit ||
      defaultImage.fit ||
      "cover"
    );

    card.style.setProperty(
      "--lumina-image-position",
      options.position ||
      defaultImage.position ||
      "center"
    );

    card.classList.add("lumina-image-card");
    card.setAttribute("data-lumina-server-image", serverName);
    card.insertBefore(banner, card.firstChild);
  }

  function applyImageToCard(
    card,
    serverName,
    options,
    defaultImage
  ) {
    var currentName = card.getAttribute(
      "data-lumina-server-image"
    );

    var existingImage = card.querySelector(
      ":scope > .lumina-card-image-background," +
      ":scope > .lumina-card-image-banner"
    );

    if (currentName === serverName && existingImage) {
      return;
    }

    removeOldImage(card);

    if (!options || !options.src) {
      return;
    }

    /*
     * 默认使用 background：
     * 不增加卡片高度，不影响面板信息密度。
     *
     * 在 config.js 中添加：
     * mode: "banner"
     * 即可切换成顶部横幅图片。
     */
    if (options.mode === "banner") {
      addBannerImage(
        card,
        serverName,
        options,
        defaultImage
      );
    } else {
      addBackgroundImage(
        card,
        serverName,
        options
      );
    }
  }

  function refreshCards() {
    var config = getConfig();
    var serverImages = config.serverImages || {};
    var defaultImage = config.defaultImage || {};
    var nameMap = createNameMap(serverImages);

    if (!Object.keys(nameMap).length) {
      return;
    }

    var cards = document.querySelectorAll(
      ".server-card, .host-card"
    );

    cards.forEach(function (card) {
      var matched = findServerName(card, nameMap);

      if (!matched) {
        return;
      }

      applyImageToCard(
        card,
        matched.name,
        matched.options,
        defaultImage
      );
    });
  }

  function scheduleRefresh() {
    if (refreshTimer) {
      clearTimeout(refreshTimer);
    }

    refreshTimer = setTimeout(function () {
      refreshTimer = null;
      refreshCards();
    }, 120);
  }

  function startObserver() {
    var target = document.getElementById("app") || document.body;

    if (!target || !window.MutationObserver) {
      return;
    }

    if (observer) {
      observer.disconnect();
    }

    observer = new MutationObserver(function (changes) {
      var requiresRefresh = changes.some(function (change) {
        return (
          change.type === "childList" &&
          (
            change.addedNodes.length > 0 ||
            change.removedNodes.length > 0
          )
        );
      });

      if (requiresRefresh) {
        scheduleRefresh();
      }
    });

    observer.observe(target, {
      childList: true,
      subtree: true
    });
  }

  function init() {
    injectStyles();
    refreshCards();
    startObserver();

    window.addEventListener(
      "hashchange",
      scheduleRefresh
    );

    window.addEventListener(
      "popstate",
      scheduleRefresh
    );
  }

  if (document.readyState === "loading") {
    document.addEventListener(
      "DOMContentLoaded",
      init,
      { once: true }
    );
  } else {
    init();
  }
})();
