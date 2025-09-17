// ==UserScript==
// @name         蝶云科技抖音直播数据助手
// @namespace    http://tampermonkey.net/
// @version      V_0.1
// @description  为蝶云直播设计的浏览器助手。核心功能：1) 提供一个可自由拖动的全局快捷入口，一键直达直播数据复盘页。2) 在复盘页，智能提取直播核心数据并生成一个可自由拖动、风格现代的数据面板。3) 支持单项或全部数据的一键复制，大幅提升数据整理效率。
// @author       左立方
// @homepageURL  https://cbm.im/
// @match        *://*.douyin.com/*
// @grant        GM_addStyle
// @grant        GM_setClipboard
// @grant        GM_openInTab
// @grant        GM_setValue
// @grant        GM_getValue
// ==/UserScript==

(function() {
    'use strict';

    const reviewPageURL = 'https://anchor.douyin.com/anchor/review';
    const isOnReviewPage = window.location.href.startsWith(reviewPageURL);

    // --- 1. 创建全局悬浮小部件 (图标容器) ---
    const svgIcon = `<svg t="1757661749109" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg"><path d="M0 0m184.32 0l655.36 0q184.32 0 184.32 184.32l0 655.36q0 184.32-184.32 184.32l-655.36 0q-184.32 0-184.32-184.32l0-655.36q0-184.32 184.32-184.32Z" fill="#111111"></path><path d="M204.27776 670.59712a246.25152 246.25152 0 0 1 245.97504-245.97504v147.57888a98.49856 98.49856 0 0 0-98.38592 98.38592c0 48.34304 26.14272 100.352 83.54816 100.352 3.81952 0 93.55264-0.88064 93.55264-77.19936V134.35904h157.26592a133.31456 133.31456 0 0 0 133.12 132.99712l-0.13312 147.31264a273.152 273.152 0 0 1-142.62272-38.912l-0.06144 317.98272c0 146.00192-124.24192 224.77824-241.14176 224.77824-131.74784 0.03072-231.1168-106.56768-231.1168-247.92064z" fill="#FF4040"></path><path d="M164.92544 631.23456a246.25152 246.25152 0 0 1 245.97504-245.97504v147.57888a98.49856 98.49856 0 0 0-98.38592 98.38592c0 48.34304 26.14272 100.352 83.54816 100.352 3.81952 0 93.55264-0.88064 93.55264-77.19936V94.99648h157.26592a133.31456 133.31456 0 0 0 133.12 132.99712l-0.13312 147.31264a273.152 273.152 0 0 1-142.62272-38.912l-0.06144 317.98272c0 146.00192-124.24192 224.77824-241.14176 224.77824-131.74784 0.03072-231.1168-106.56768-231.1168-247.92064z" fill="#00F5FF"></path><path d="M410.91072 427.58144c-158.8224 20.15232-284.44672 222.72-154.112 405.00224 120.40192 98.47808 373.68832 41.20576 380.70272-171.85792l-0.17408-324.1472a280.7296 280.7296 0 0 0 142.88896 38.62528V261.2224a144.98816 144.98816 0 0 1-72.8064-54.82496 135.23968 135.23968 0 0 1-54.70208-72.45824h-123.66848l-0.08192 561.41824c-0.11264 78.46912-130.9696 106.41408-164.18816 30.2592-83.18976-39.77216-64.37888-190.9248 46.31552-192.57344z" fill="#FFFFFF"></path></svg>`;
    const encodedSvg = 'data:image/svg+xml;base64,' + btoa(svgIcon);

    const widgetContainer = document.createElement('div');
    widgetContainer.id = 'dk-widget-container';
    widgetContainer.style.backgroundImage = `url("${encodedSvg}")`;
    document.body.appendChild(widgetContainer);

    // --- 2. 添加样式 ---
    GM_addStyle(`
        #dk-widget-container {
            position: fixed;
            z-index: 9999;
            width: 52px;
            height: 52px;
            background-color: #fff;
            background-size: cover;
            border-radius: 50%;
            cursor: grab;
            box-shadow: 0 8px 20px rgba(0,0,0,0.12);
            transition: transform 0.2s ease-in-out;
        }
        #dk-widget-container:hover {
            transform: scale(1.1);
        }
        #dk-widget-container:active {
            cursor: grabbing;
        }
    `);

    // --- 3. 小部件拖动与定位 ---
    const savedPosition = JSON.parse(GM_getValue('widgetPosition', null));
    const initialTop = savedPosition ? savedPosition.top : (window.innerHeight - 80) + 'px';
    const initialLeft = savedPosition ? savedPosition.left : (window.innerWidth - 80) + 'px';
    widgetContainer.style.top = initialTop;
    widgetContainer.style.left = initialLeft;

    let isDragging = false, wasDragged = false;
    let offsetX, offsetY;

    widgetContainer.addEventListener('mousedown', (e) => {
        isDragging = true;
        wasDragged = false;
        offsetX = e.clientX - widgetContainer.offsetLeft;
        offsetY = e.clientY - widgetContainer.offsetTop;
        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
    });

    function onMouseMove(e) { if (!isDragging) return; wasDragged = true; let newLeft = e.clientX - offsetX; let newTop = e.clientY - offsetY; const maxLeft = window.innerWidth - widgetContainer.offsetWidth; const maxTop = window.innerHeight - widgetContainer.offsetHeight; widgetContainer.style.left = Math.max(0, Math.min(newLeft, maxLeft)) + 'px'; widgetContainer.style.top = Math.max(0, Math.min(newTop, maxTop)) + 'px'; }
    function onMouseUp() { if (isDragging && wasDragged) { GM_setValue('widgetPosition', JSON.stringify({ top: widgetContainer.style.top, left: widgetContainer.style.left })); } isDragging = false; document.removeEventListener('mousemove', onMouseMove); document.removeEventListener('mouseup', onMouseUp); }

    // --- 4. 点击功能逻辑 ---
    widgetContainer.addEventListener('click', (e) => {
        if (wasDragged) { e.stopPropagation(); return; }
        if (isOnReviewPage) {
            const panel = document.getElementById('dk-data-panel');
            if (panel) {
                const isVisible = panel.classList.toggle('visible');
                if (isVisible) { refreshData(); }
            }
        } else {
            GM_openInTab(reviewPageURL, { active: true });
        }
    });

    // --- 5. 如果在复盘页，则创建并管理数据面板 ---
    let refreshData = () => {};
    if (isOnReviewPage) {
        const dataPaths = [
            { label: '直播主题', xpath: '/html/body/div[1]/div/div[3]/div/div/div/div/div[2]/div/div/div/div/div[2]/div[1]/div/div[1]/div/div/div[1]' },
            {
                label: '直播时间',
                xpath: '/html/body/div[1]/div/div[3]/div/div/div/div/div[2]/div/div/div/div/div[2]/div[1]/div/div[1]/div/div/div[2]/div[1]/span[2]',
                process: (text) => text ? text.split(' ')[0] : '未找到' // 新增处理函数
            },
            { label: '直播时长', xpath: '/html/body/div[1]/div/div[3]/div/div/div/div/div[2]/div/div/div/div/div[2]/div[1]/div/div[1]/div/div/div[2]/div[3]/span[2]' },
            { label: '观看人数', xpath: '/html/body/div[1]/div/div[3]/div/div/div/div/div[2]/div/div/div/div/div[2]/div[1]/div/div[2]/div[2]/div/div[2]/div[2]/div[2]/div[2]/div/div' },
            { label: '平均在线', xpath: '/html/body/div[1]/div/div[3]/div/div/div/div/div[2]/div/div/div/div/div[2]/div[1]/div/div[2]/div[2]/div/div[2]/div[2]/div[4]/div[2]/div/div' },
            { label: '最高在线', xpath: '/html/body/div[1]/div/div[3]/div/div/div/div/div[2]/div/div/div/div/div[2]/div[1]/div/div[2]/div[2]/div/div[2]/div[2]/div[5]/div[2]/div/div' },
            { label: '平均停留时长', xpath: '/html/body/div[1]/div/div[3]/div/div/div/div/div[2]/div/div/div/div/div[2]/div[1]/div/div[2]/div[2]/div/div[3]/div[2]/div[1]/div[2]/div/div[1]' },
            { label: '点赞数', xpath: '/html/body/div[1]/div/div[3]/div/div/div/div/div[2]/div/div/div/div/div[2]/div[1]/div/div[2]/div[2]/div/div[3]/div[2]/div[3]/div[2]/div/div' },
            { label: '评论数', xpath: '/html/body/div[1]/div/div[3]/div/div/div/div/div[2]/div/div/div/div/div[2]/div[1]/div/div[2]/div[2]/div/div[3]/div[2]/div[2]/div[2]/div/div' },
            { label: '分享转发数', xpath: '/html/body/div[1]/div/div[3]/div/div/div/div/div[2]/div/div/div/div/div[2]/div[1]/div/div[2]/div[2]/div/div[3]/div[2]/div[5]/div[2]/div/div' },
            { label: '新增粉丝数', xpath: '/html/body/div[1]/div/div[3]/div/div/div/div/div[2]/div/div/div/div/div[2]/div[1]/div/div[2]/div[2]/div/div[3]/div[2]/div[4]/div[2]/div/div' },
            { label: '流量-关注', xpath: '/html/body/div[1]/div/div[3]/div/div/div/div/div[2]/div/div/div/div/div[2]/div[3]/div[2]/div[1]/div[2]/div[1]/div[2]/div/div/div/div/div/div/div[2]/div[2]/div[2]' },
            { label: '流量-推荐', xpath: '/html/body/div[1]/div/div[3]/div/div/div/div/div[2]/div/div/div/div/div[2]/div[3]/div[2]/div[1]/div[2]/div[1]/div[2]/div/div/div/div/div/div/div[2]/div[1]/div[2]' }
        ];

        const panelHTML = `<div id="dk-data-panel"><div id="dk-data-panel-header"><span class="header-title">直播数据分析</span><span id="dk-data-panel-close" title="关闭"></span></div><div id="dk-data-panel-content"></div><div id="dk-data-panel-footer"><button id="dk-copy-all-btn">复制全部数据</button></div></div>`;
        document.body.insertAdjacentHTML('beforeend', panelHTML);
        GM_addStyle(`:root{--dk-bg-color:rgba(242,242,247,0.85);--dk-border-color:rgba(0,0,0,0.1);--dk-text-primary:#1d1d1f;--dk-text-secondary:#6e6e73;--dk-blue-accent:#007aff;--dk-blue-hover:#0071e3;--dk-panel-width:360px}#dk-data-panel{position:fixed;top:150px;right:25px;width:var(--dk-panel-width);background-color:var(--dk-bg-color);backdrop-filter:blur(20px) saturate(180%);border:1px solid var(--dk-border-color);border-radius:18px;z-index:10000;box-shadow:0 10px 30px rgba(0,0,0,0.15);font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif;opacity:0;transform:translateY(20px);transition:opacity .3s ease-out,transform .3s ease-out;visibility:hidden}#dk-data-panel.visible{opacity:1;transform:translateY(0);visibility:visible}#dk-data-panel-header{padding:14px 20px;border-bottom:1px solid var(--dk-border-color);display:flex;justify-content:space-between;align-items:center;cursor:move;user-select:none}.header-title{font-size:16px;font-weight:600;color:var(--dk-text-primary)}#dk-data-panel-close{width:24px;height:24px;background-color:#ccc;border-radius:50%;cursor:pointer;position:relative;transition:background-color .2s}#dk-data-panel-close:hover{background-color:#bbb}#dk-data-panel-close::before,#dk-data-panel-close::after{content:'';position:absolute;left:50%;top:50%;width:12px;height:1.5px;background-color:white;transform-origin:center}#dk-data-panel-close::before{transform:translate(-50%,-50%) rotate(45deg)}#dk-data-panel-close::after{transform:translate(-50%,-50%) rotate(-45deg)}#dk-data-panel-content{padding:8px 20px;max-height:450px;overflow-y:auto}.dk-data-row{display:flex;justify-content:space-between;align-items:center;padding:12px 0;border-bottom:1px solid var(--dk-border-color)}.dk-data-row:last-child{border-bottom:none}.dk-data-label{font-size:14px;color:var(--dk-text-secondary)}.dk-data-value-wrapper{display:flex;align-items:center}.dk-data-value{font-size:14px;font-weight:500;color:var(--dk-text-primary);margin-right:12px}.dk-copy-btn{padding:5px 10px;font-size:12px;cursor:pointer;border:1px solid rgba(0,0,0,0.1);border-radius:8px;background-color:rgba(255,255,255,0.7);color:var(--dk-blue-accent);transition:background-color .2s,color .2s}.dk-copy-btn:hover{background-color:var(--dk-blue-accent);color:white;border-color:transparent}#dk-data-panel-footer{padding:16px 20px;border-top:1px solid var(--dk-border-color)}#dk-copy-all-btn{width:100%;padding:12px;font-size:15px;font-weight:600;cursor:pointer;border:none;border-radius:12px;background-color:var(--dk-blue-accent);color:white;transition:background-color .2s,transform .1s}#dk-copy-all-btn:hover{background-color:var(--dk-blue-hover)}#dk-copy-all-btn:active{transform:scale(.98)}`);

        const panel = document.getElementById('dk-data-panel'),header = document.getElementById('dk-data-panel-header'),closeBtn = document.getElementById('dk-data-panel-close'),contentDiv = document.getElementById('dk-data-panel-content'),copyAllBtn = document.getElementById('dk-copy-all-btn');
        const getValueByXpath = (xpath, defaultValue = '未找到') => { try { const element = document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue; return element ? element.textContent.trim() : defaultValue; } catch (e) { return defaultValue; } };

        closeBtn.addEventListener('click', () => panel.classList.remove('visible'));

        copyAllBtn.addEventListener('click', () => {
            const allDataText = dataPaths.map(item => {
                let rawValue = getValueByXpath(item.xpath);
                let processedValue = item.process ? item.process(rawValue) : rawValue;
                return `${item.label}：${processedValue}`;
            }).join('\n');
            GM_setClipboard(allDataText, 'text');
            copyAllBtn.textContent = '已全部复制!';
            setTimeout(() => { copyAllBtn.textContent = '复制全部数据'; }, 2000);
        });

        refreshData = function() {
            contentDiv.innerHTML = '';
            dataPaths.forEach(item => {
                let rawValue = getValueByXpath(item.xpath);
                let processedValue = item.process ? item.process(rawValue) : rawValue;
                const rowHTML = `<div class="dk-data-row"><span class="dk-data-label">${item.label}</span><div class="dk-data-value-wrapper"><span class="dk-data-value">${processedValue}</span><button class="dk-copy-btn" data-value="${processedValue}">复制</button></div></div>`;
                contentDiv.insertAdjacentHTML('beforeend', rowHTML);
            });
            contentDiv.querySelectorAll('.dk-copy-btn').forEach(btn => {
                btn.addEventListener('click', (e) => { e.stopPropagation(); GM_setClipboard(btn.dataset.value, 'text'); btn.textContent = '已复制!'; setTimeout(() => { btn.textContent = '复制'; }, 1500); });
            });
        };

        let isPanelDragging = false, panelOffsetX, panelOffsetY;
        header.addEventListener('mousedown', (e) => { isPanelDragging = true; panelOffsetX = e.clientX - panel.offsetLeft; panelOffsetY = e.clientY - panel.offsetTop; document.addEventListener('mousemove', onPanelMouseMove); document.addEventListener('mouseup', onPanelMouseUp); });
        function onPanelMouseMove(e) { if (!isPanelDragging) return; let newLeft = e.clientX - panelOffsetX; let newTop = e.clientY - panelOffsetY; const maxLeft = window.innerWidth - panel.offsetWidth; const maxTop = window.innerHeight - panel.offsetHeight; panel.style.left = Math.max(0, Math.min(newLeft, maxLeft)) + 'px'; panel.style.top = Math.max(0, Math.min(newTop, maxTop)) + 'px'; panel.style.right = 'auto'; panel.style.bottom = 'auto'; }
        function onPanelMouseUp() { isPanelDragging = false; document.removeEventListener('mousemove', onPanelMouseMove); document.removeEventListener('mouseup', onPanelMouseUp); }
    }
})();