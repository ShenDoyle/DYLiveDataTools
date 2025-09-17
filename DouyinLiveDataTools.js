// ==UserScript==
// @name         蝶云科技抖音直播数据助手
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  云星空页面增加数据填写的智能提示功能，提升工作效率。
// @author       左立方
// @homepageURL  https://cbm.im/
// @match        *://*.douyin.com/*
// @match        http://crm.ynjdy.com:8888/*
// @grant        GM_addStyle
// @grant        GM_setClipboard
// @grant        GM_openInTab
// @grant        GM_setValue
// @grant        GM_getValue
// @require      https://cdn.bootcdn.net/ajax/libs/jquery/3.6.0/jquery.min.js
// ==/UserScript==

(function() {
    'use strict';

    // --- 0. 环境与页面判断 ---
    const reviewPageURL = 'https://anchor.douyin.com/anchor/review';
    const crmPageURL = 'http://crm.ynjdy.com:8888/';
    const isOnReviewPage = window.location.href.startsWith(reviewPageURL);
    const isOnCrmPage = window.location.href.startsWith(crmPageURL);

    // 如果不是目标页面，则不执行任何操作
    if (!isOnReviewPage && !isOnCrmPage) {
        return;
    }

    // --- 1. 创建全局悬浮小部件 (图标) ---
    const svgIcon = `<svg t="1757661749109" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg"><path d="M0 0m184.32 0l655.36 0q184.32 0 184.32 184.32l0 655.36q0 184.32-184.32 184.32l-655.36 0q-184.32 0-184.32-184.32l0-655.36q0-184.32 184.32-184.32Z" fill="#111111"></path><path d="M204.27776 670.59712a246.25152 246.25152 0 0 1 245.97504-245.97504v147.57888a98.49856 98.49856 0 0 0-98.38592 98.38592c0 48.34304 26.14272 100.352 83.54816 100.352 3.81952 0 93.55264-0.88064 93.55264-77.19936V134.35904h157.26592a133.31456 133.31456 0 0 0 133.12 132.99712l-0.13312 147.31264a273.152 273.152 0 0 1-142.62272-38.912l-0.06144 317.98272c0 146.00192-124.24192 224.77824-241.14176 224.77824-131.74784 0.03072-231.1168-106.56768-231.1168-247.92064z" fill="#FF4040"></path><path d="M164.92544 631.23456a246.25152 246.25152 0 0 1 245.97504-245.97504v147.57888a98.49856 98.49856 0 0 0-98.38592 98.38592c0 48.34304 26.14272 100.352 83.54816 100.352 3.81952 0 93.55264-0.88064 93.55264-77.19936V94.99648h157.26592a133.31456 133.31456 0 0 0 133.12 132.99712l-0.13312 147.31264a273.152 273.152 0 0 1-142.62272-38.912l-0.06144 317.98272c0 146.00192-124.24192 224.77824-241.14176 224.77824-131.74784 0.03072-231.1168-106.56768-231.1168-247.92064z" fill="#00F5FF"></path><path d="M410.91072 427.58144c-158.8224 20.15232-284.44672 222.72-154.112 405.00224 120.40192 98.47808 373.68832 41.20576 380.70272-171.85792l-0.17408-324.1472a280.7296 280.7296 0 0 0 142.88896 38.62528V261.2224a144.98816 144.98816 0 0 1-72.8064-54.82496 135.23968 135.23968 0 0 1-54.70208-72.45824h-123.66848l-0.08192 561.41824c-0.11264 78.46912-130.9696 106.41408-164.18816 30.2592-83.18976-39.77216-64.37888-190.9248 46.31552-192.57344z" fill="#FFFFFF"></path></svg>`;
    const encodedSvg = 'data:image/svg+xml;base64,' + btoa(svgIcon);

    const widgetContainer = document.createElement('div');
    widgetContainer.id = 'dk-widget-container';
    widgetContainer.style.backgroundImage = `url("${encodedSvg}")`;
    document.body.appendChild(widgetContainer);

    // --- 2. 样式与拖动逻辑 ---
    GM_addStyle(`
        :root{--dk-bg-color:rgba(242,242,247,0.85);--dk-border-color:rgba(0,0,0,0.1);--dk-text-primary:#1d1d1f;--dk-text-secondary:#6e6e73;--dk-blue-accent:#007aff;--dk-purple-accent:#5856d6;--dk-red-accent:#ff3b30;--dk-panel-width:360px}
        #dk-widget-container { position: fixed; z-index: 9999; width: 52px; height: 52px; background-color: #fff; background-size: cover; border-radius: 50%; cursor: grab; box-shadow: 0 8px 20px rgba(0,0,0,0.12); transition: transform 0.2s ease-in-out; }
        #dk-widget-container:hover { transform: scale(1.1); }
        #dk-widget-container:active { cursor: grabbing; transform: scale(0.95); }
        #dk-data-panel{position:fixed;top:150px;right:25px;width:var(--dk-panel-width);background-color:var(--dk-bg-color);backdrop-filter:blur(20px) saturate(180%);border:1px solid var(--dk-border-color);border-radius:18px;z-index:10000;box-shadow:0 10px 30px rgba(0,0,0,0.15);font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif;opacity:0;transform:translateY(20px);transition:opacity .3s ease-out,transform .3s ease-out;visibility:hidden}
        #dk-data-panel.visible{opacity:1;transform:translateY(0);visibility:visible}
        #dk-data-panel-header{padding:14px 20px;display:flex;justify-content:space-between;align-items:center;cursor:move;user-select:none;border-bottom:1px solid var(--dk-border-color)}
        .header-title{font-size:16px;font-weight:600;color:var(--dk-text-primary)}
        .header-buttons{display:flex;align-items:center;gap:12px;}
        #dk-data-panel-refresh,#dk-data-panel-close{width:24px;height:24px;border-radius:50%;cursor:pointer;position:relative;transition:background-color .2s,transform .3s; background-color:#ddd}
        #dk-data-panel-refresh:hover, #dk-data-panel-close:hover {background-color:#ccc}
        #dk-data-panel-refresh:active{transform:rotate(360deg)}
        #dk-data-panel-refresh::before{content:'↻';font-family:Arial,sans-serif;color:white;font-size:18px;font-weight:bold;position:absolute;top:50%;left:50%;transform:translate(-50%,-50%)}
        #dk-data-panel-close::before,#dk-data-panel-close::after{content:'';position:absolute;left:50%;top:50%;width:12px;height:1.5px;background-color:white;transform-origin:center}
        #dk-data-panel-close::before{transform:translate(-50%,-50%) rotate(45deg)}
        #dk-data-panel-close::after{transform:translate(-50%,-50%) rotate(-45deg)}
        #dk-data-panel-content{padding:8px 20px;max-height:450px;overflow-y:auto}
        .dk-data-row{display:flex;justify-content:space-between;align-items:center;padding:12px 0;border-bottom:1px solid var(--dk-border-color)}
        .dk-data-row:last-child{border-bottom:none}
        .dk-data-label{font-size:14px;color:var(--dk-text-secondary)}
        .dk-data-value-wrapper{display:flex;align-items:center}
        .dk-data-value{font-size:14px;font-weight:500;color:var(--dk-text-primary);margin-right:12px}
        .dk-copy-btn{padding:5px 10px;font-size:12px;cursor:pointer;border:1px solid rgba(0,0,0,0.1);border-radius:8px;background-color:rgba(255,255,255,0.7);color:var(--dk-blue-accent);transition:background-color .2s,color .2s}
        .dk-copy-btn:hover{background-color:var(--dk-blue-accent);color:white;border-color:transparent}
        #dk-data-panel-footer{padding:16px 20px;border-top:1px solid var(--dk-border-color); display: flex; flex-wrap: wrap; gap: 10px;}
        .dk-footer-btn { flex-basis: 100%; padding: 12px; font-size: 15px; font-weight: 600; cursor: pointer; border: none; border-radius: 12px; color: white; transition: background-color .2s,transform .1s; }
        #dk-copy-all-btn { background-color: var(--dk-blue-accent); }
        #dk-copy-all-btn:hover { background-color: #0071e3; }
        #dk-tooltip-toggle-btn { background-color: var(--dk-purple-accent); }
        #dk-tooltip-toggle-btn:hover { background-color: #4c4aa8; }
        #dk-tooltip-toggle-btn.active { background-color: var(--dk-red-accent); }
        .dk-footer-btn:active { transform:scale(.98); }
        #dk-follow-toolbar { position: absolute; z-index: 10002; background-color: rgba(28, 28, 30, 0.85); backdrop-filter: blur(10px); color: white; padding: 6px; border-radius: 10px; box-shadow: 0 6px 20px rgba(0,0,0,0.2); display: flex; flex-direction: column; gap: 6px; width: 300px; transition: opacity 0.2s, transform 0.2s; opacity: 0; transform: translateY(10px); }
        #dk-follow-toolbar.visible { opacity: 1; transform: translateY(0); }
        .dk-toolbar-main, .dk-toolbar-secondary { display: flex; flex-wrap: wrap; gap: 6px; }
        .dk-toolbar-btn { background-color: rgba(255, 255, 255, 0.15); border: none; color: white; padding: 6px 10px; border-radius: 6px; font-size: 12px; cursor: pointer; text-align: left; }
        .dk-toolbar-btn:hover { background-color: rgba(255, 255, 255, 0.3); }
        .dk-toolbar-label { font-weight: bold; }
        .dk-toolbar-value { opacity: 0.8; margin-left: 5px; }
        #dk-toolbar-toggle { width: 100%; background-color: rgba(100, 100, 100, 0.3); margin-top: 4px; }
        #dk-toolbar-toggle:hover { background-color: rgba(100, 100, 100, 0.5); }
    `);
    const savedPosition = JSON.parse(GM_getValue('widgetPosition', null));
    widgetContainer.style.top = savedPosition ? savedPosition.top : `${window.innerHeight - 80}px`;
    widgetContainer.style.left = savedPosition ? savedPosition.left : `${window.innerWidth - 80}px`;

    let isDragging = false, wasDragged = false;
    let offsetX, offsetY;
    widgetContainer.addEventListener('mousedown', (e) => { isDragging = true; wasDragged = false; offsetX = e.clientX - widgetContainer.offsetLeft; offsetY = e.clientY - widgetContainer.offsetTop; document.addEventListener('mousemove', onMouseMove); document.addEventListener('mouseup', onMouseUp); });
    function onMouseMove(e) { if (!isDragging) return; wasDragged = true; let newLeft = e.clientX - offsetX; let newTop = e.clientY - offsetY; const maxLeft = window.innerWidth - widgetContainer.offsetWidth; const maxTop = window.innerHeight - widgetContainer.offsetHeight; widgetContainer.style.left = `${Math.max(0, Math.min(newLeft, maxLeft))}px`; widgetContainer.style.top = `${Math.max(0, Math.min(newTop, maxTop))}px`; }
    function onMouseUp() { if (isDragging && wasDragged) { GM_setValue('widgetPosition', JSON.stringify({ top: widgetContainer.style.top, left: widgetContainer.style.left })); } isDragging = false; document.removeEventListener('mousemove', onMouseMove); document.removeEventListener('mouseup', onMouseUp); }

    // --- 3. 初始化面板和功能 ---
    const processDuration = (text) => { if (!text) return '0.0'; const minMatch = text.match(/(\d+)\s*分钟/); const secMatch = text.match(/(\d+)\s*秒/); const minutes = minMatch ? parseInt(minMatch[1], 10) : 0; const seconds = secMatch ? parseInt(secMatch[1], 10) : 0; if (minutes === 0 && seconds === 0) return '0.0'; const totalMinutes = minutes + (seconds / 60); return totalMinutes.toFixed(1); };
    const processPercentage = (text) => text ? text.replace('%', '').trim() : '0';
    const dataPaths = [ { label: '直播主题', xpath: '/html/body/div[1]/div/div[3]/div/div/div/div/div[2]/div/div/div/div/div[2]/div[1]/div/div[1]/div/div/div[1]' }, { label: '直播日期', xpath: '/html/body/div[1]/div/div[3]/div/div/div/div/div[2]/div/div/div/div/div[2]/div[1]/div/div[1]/div/div/div[2]/div[1]/span[2]', process: (text) => text ? text.split(' ')[0] : '未找到' }, { label: '直播时长', xpath: '/html/body/div[1]/div/div[3]/div/div/div/div/div[2]/div/div/div/div/div[2]/div[1]/div/div[1]/div/div/div[2]/div[3]/span[2]', process: processDuration }, { label: '观看人数', xpath: '/html/body/div[1]/div/div[3]/div/div/div/div/div[2]/div/div/div/div/div[2]/div[1]/div/div[2]/div[2]/div/div[2]/div[2]/div[2]/div[2]/div/div' }, { label: '平均在线', xpath: '/html/body/div[1]/div/div[3]/div/div/div/div/div[2]/div/div/div/div/div[2]/div[1]/div/div[2]/div[2]/div/div[2]/div[2]/div[4]/div[2]/div/div' }, { label: '最高在线', xpath: '/html/body/div[1]/div/div[3]/div/div/div/div/div[2]/div/div/div/div/div[2]/div[1]/div/div[2]/div[2]/div/div[2]/div[2]/div[5]/div[2]/div/div' }, { label: '平均停留时长', xpath: '/html/body/div[1]/div/div[3]/div/div/div/div/div[2]/div/div/div/div/div[2]/div[1]/div/div[2]/div[2]/div/div[3]/div[2]/div[1]/div[2]/div/div[1]' }, { label: '点赞数', xpath: '/html/body/div[1]/div/div[3]/div/div/div/div/div[2]/div/div/div/div/div[2]/div[1]/div/div[2]/div[2]/div/div[3]/div[2]/div[3]/div[2]/div/div' }, { label: '评论数', xpath: '/html/body/div[1]/div/div[3]/div/div/div/div/div[2]/div/div/div/div/div[2]/div[1]/div/div[2]/div[2]/div/div[3]/div[2]/div[2]/div[2]/div/div' }, { label: '分享转发数', xpath: '/html/body/div[1]/div/div[3]/div/div/div/div/div[2]/div/div/div/div/div[2]/div[1]/div/div[2]/div[2]/div/div[3]/div[2]/div[5]/div[2]/div/div' }, { label: '新增粉丝数', xpath: '/html/body/div[1]/div/div[3]/div/div/div/div/div[2]/div/div/div/div/div[2]/div[1]/div/div[2]/div[2]/div/div[3]/div[2]/div[4]/div[2]/div/div' }, { label: '流量-关注', xpath: '/html/body/div[1]/div/div[3]/div/div/div/div/div[2]/div/div/div/div/div[2]/div[3]/div[2]/div[1]/div[2]/div[1]/div[2]/div/div/div/div/div/div/div[2]/div[2]/div[2]', process: processPercentage }, { label: '流量-推荐', xpath: '/html/body/div[1]/div/div[3]/div/div/div/div/div[2]/div/div/div/div/div[2]/div[3]/div[2]/div[1]/div[2]/div[1]/div[2]/div/div/div/div/div/div/div[2]/div[1]/div[2]', process: processPercentage } ];
    const panelHTML = `<div id="dk-data-panel"><div id="dk-data-panel-header"><span class="header-title">直播数据助手</span><div class="header-buttons"><span id="dk-data-panel-refresh" title="刷新"></span><span id="dk-data-panel-close" title="关闭"></span></div></div><div id="dk-data-panel-content"></div><div id="dk-data-panel-footer"><button id="dk-copy-all-btn" class="dk-footer-btn">复制全部数据</button>${isOnCrmPage ? '<button id="dk-tooltip-toggle-btn" class="dk-footer-btn">启用智能提示</button>' : ''}</div></div>`;

    document.body.insertAdjacentHTML('beforeend', panelHTML);
    const panel = document.getElementById('dk-data-panel'),header = document.getElementById('dk-data-panel-header'),closeBtn = document.getElementById('dk-data-panel-close'),refreshBtn = document.getElementById('dk-data-panel-refresh'),contentDiv = document.getElementById('dk-data-panel-content'),copyAllBtn = document.getElementById('dk-copy-all-btn');
    const getValueByXpath = (xpath, defaultValue = '未找到') => { try { const e = document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue; return e ? e.textContent.trim() : defaultValue; } catch (e) { return defaultValue; } };
    let currentData = [];

    const renderPanel = (data) => {
        contentDiv.innerHTML = '';
        data.forEach(item => {
            const rowHTML = `<div class="dk-data-row"><span class="dk-data-label">${item.label}</span><div class="dk-data-value-wrapper"><span class="dk-data-value">${item.value}</span><button class="dk-copy-btn" data-value="${item.value}">复制</button></div></div>`;
            contentDiv.insertAdjacentHTML('beforeend', rowHTML);
        });
        contentDiv.querySelectorAll('.dk-copy-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                GM_setClipboard(btn.dataset.value, 'text');
                btn.textContent = '已复制!';
                setTimeout(() => { btn.textContent = '复制'; }, 1500);
            });
        });
    };

    const refreshData = () => {
        if (isOnReviewPage) {
            currentData = dataPaths.map(item => {
                const rawValue = getValueByXpath(item.xpath);
                const processedValue = item.process ? item.process(rawValue) : rawValue;
                return { label: item.label, value: processedValue };
            });
            GM_setValue('dyLiveData', JSON.stringify(currentData));
        } else {
            currentData = JSON.parse(GM_getValue('dyLiveData', '[]'));
        }
        renderPanel(currentData);
    };

    closeBtn.addEventListener('click', () => panel.classList.remove('visible'));
    refreshBtn.addEventListener('click', refreshData);
    copyAllBtn.addEventListener('click', () => {
        if (currentData.length > 0) {
            const allDataText = currentData.map(item => `${item.label}：${item.value}`).join('\n');
            GM_setClipboard(allDataText, 'text');
            copyAllBtn.textContent = '已全部复制!';
            setTimeout(() => { copyAllBtn.textContent = '复制全部数据'; }, 2000);
        }
    });

    if (isOnCrmPage) {
        const SmartTooltip = {
            tooltip: null, activeInput: null, dataMap: null,
            isSecondaryVisible: GM_getValue('tooltipFolded', false),
            coreMetrics: ['直播时长','观看人数','平均在线','最高在线','平均停留时长','点赞数','评论数','分享转发数','新增粉丝数','流量-关注','流量-推荐'],
            fieldIdentifierMap: { 'FNOTE,0': '直播主题', 'FDATE': '直播日期', 'FBCZXZB,1': '直播时长', 'FBCZXZB,2': '观看人数', 'FBCZXZB,4': '平均在线', 'FBCZXZB,5': '最高在线', 'FBCZXZB,6': '平均停留时长', 'FBCZXZB,7': '点赞数', 'FBCZXZB,8': '评论数', 'FBCZXZB,9': '分享转发数', 'FBCZXZB,10': '新增粉丝数', 'FBCZXZB,17': '流量-关注', 'FBCZXZB,18': '流量-推荐' },
            observer: null, isActive: false,
            init() {
                this.dataMap = new Map(JSON.parse(GM_getValue('dyLiveData', '[]')).map(i => [i.label, i.value]));
                this.observer = new MutationObserver(this.handleDomChange.bind(this));
                document.addEventListener('click', (e) => { if (this.tooltip && !this.tooltip.contains(e.target) && e.target !== this.activeInput) this.hide(); }, true);
                document.addEventListener('keydown', (e) => { if (e.key === 'Escape') this.hide(); });
            },
            activate() { this.isActive = true; this.observer.observe(document.body, { childList: true, subtree: true }); },
            deactivate() { this.isActive = false; this.observer.disconnect(); this.hide(); },
            handleDomChange(mutations) {
                if (!this.isActive) return;
                for (const mutation of mutations) {
                    if (mutation.addedNodes.length > 0) {
                        const inputElement = $(mutation.target).find('input.k-input, textarea.k-input').get(0);
                        if (inputElement && document.activeElement === inputElement) { this.show(inputElement); return; }
                    }
                }
            },
            identifyField(inputElement) {
                const $input = $(inputElement);
                const $editorContainer = $input.closest('div[data-field]');
                if ($editorContainer.length > 0) {
                    const field = $editorContainer.data('field'); const rowid = $editorContainer.data('rowid');
                    const key = rowid !== undefined ? `${field},${rowid}` : field;
                    if (this.fieldIdentifierMap[key]) return this.fieldIdentifierMap[key];
                }
                if ($input.attr('id') && $input.attr('id').includes('-FDATE-EDITOR')) return this.fieldIdentifierMap['FDATE'];
                const $parentCell = $input.closest('td');
                if ($parentCell.length > 0) {
                     const $span = $parentCell.find('span[data-field][data-rowid]');
                     if ($span.length > 0) {
                         const field = $span.data('field'); const rowid = $span.data('rowid');
                         const key = `${field},${rowid}`;
                         if (this.fieldIdentifierMap[key]) return this.fieldIdentifierMap[key];
                     }
                }
                return null;
            },
            createButton(label, value) {
                const btn = document.createElement('button');
                btn.className = 'dk-toolbar-btn';
                btn.innerHTML = `<span class="dk-toolbar-label">${label}:</span><span class="dk-toolbar-value">${value}</span>`;
                btn.onclick = (e) => { e.stopPropagation(); GM_setClipboard(value, 'text'); btn.innerHTML = `<span class="dk-toolbar-label">${label}:</span><span class="dk-toolbar-value" style="color: #34c759;">已复制!</span>`; setTimeout(() => this.hide(), 800); };
                return btn;
            },
            show(inputElement) {
                this.activeInput = inputElement;
                const matchedLabel = this.identifyField(inputElement);

                // 【核心逻辑】如果不是已知的核心或次要字段，则不显示
                if (!matchedLabel) { this.hide(); return; }

                if (!this.tooltip) { this.tooltip = document.createElement('div'); this.tooltip.id = 'dk-follow-toolbar'; document.body.appendChild(this.tooltip); }
                this.tooltip.innerHTML = '';
                const mainContent = document.createElement('div'); mainContent.className = 'dk-toolbar-main';
                const secondaryContent = document.createElement('div'); secondaryContent.className = 'dk-toolbar-secondary';
                secondaryContent.style.display = this.isSecondaryVisible ? 'flex' : 'none';

                let mainLabels = [], secondaryLabels = [];

                if (this.coreMetrics.includes(matchedLabel)) {
                    mainLabels.push(matchedLabel);
                    secondaryLabels = Array.from(this.dataMap.keys()).filter(label => label !== matchedLabel);
                } else { // 默认只显示直播主题和日期
                    mainLabels = ['直播主题', '直播日期'];
                    secondaryLabels = this.coreMetrics;
                }

                mainLabels.forEach(label => { if (this.dataMap.has(label) && this.dataMap.get(label) !== '未找到') mainContent.appendChild(this.createButton(label, this.dataMap.get(label))); });
                secondaryLabels.forEach(label => { if (this.dataMap.has(label) && this.dataMap.get(label) !== '未找到') secondaryContent.appendChild(this.createButton(label, this.dataMap.get(label))); });

                this.tooltip.appendChild(mainContent);
                if(secondaryContent.childElementCount > 0) {
                    this.tooltip.appendChild(secondaryContent);
                    const toggleBtn = document.createElement('button');
                    toggleBtn.id = 'dk-toolbar-toggle'; toggleBtn.className = 'dk-toolbar-btn';
                    toggleBtn.textContent = this.isSecondaryVisible ? `收起 ▲` : `显示其他 (${secondaryContent.childElementCount}) ▼`;
                    toggleBtn.onclick = (e) => { e.stopPropagation(); this.isSecondaryVisible = !this.isSecondaryVisible; GM_setValue('tooltipFolded', this.isSecondaryVisible); secondaryContent.style.display = this.isSecondaryVisible ? 'flex' : 'none'; toggleBtn.textContent = this.isSecondaryVisible ? `收起 ▲` : `显示其他 (${secondaryContent.childElementCount}) ▼`; };
                    this.tooltip.appendChild(toggleBtn);
                }

                if (mainContent.childElementCount === 0 && secondaryContent.childElementCount === 0) { this.hide(); return; }

                const rect = inputElement.getBoundingClientRect();
                const top = window.scrollY + rect.bottom + 5;
                const left = window.scrollX + rect.left;

                this.tooltip.style.top = `${top}px`;
                this.tooltip.style.left = `${left}px`;
                this.tooltip.classList.add('visible');
            },
            hide() { if (this.tooltip) this.tooltip.classList.remove('visible'); this.activeInput = null; }
        };

        const tooltipToggleBtn = document.getElementById('dk-tooltip-toggle-btn');
        SmartTooltip.init();
        tooltipToggleBtn.addEventListener('click', () => {
            if (SmartTooltip.isActive) {
                SmartTooltip.deactivate();
                tooltipToggleBtn.textContent = '启用智能提示';
                tooltipToggleBtn.classList.remove('active');
            } else {
                const storedData = GM_getValue('dyLiveData', '[]');
                if (storedData === '[]' || !storedData) { alert('没有找到缓存的直播数据，请先在抖音直播复盘页打开助手面板。'); return; }
                SmartTooltip.activate();
                tooltipToggleBtn.textContent = '禁用智能提示';
                tooltipToggleBtn.classList.add('active');
            }
        });
    }

    let isPanelDragging = false, panelOffsetX, panelOffsetY;
    header.addEventListener('mousedown', (e) => { isPanelDragging = true; panelOffsetX = e.clientX - panel.offsetLeft; panelOffsetY = e.clientY - panel.offsetTop; document.addEventListener('mousemove', onPanelMouseMove); document.addEventListener('mouseup', onPanelMouseUp); });
    function onPanelMouseMove(e) { if (!isPanelDragging) return; let newLeft = e.clientX - panelOffsetX; let newTop = e.clientY - panelOffsetY; panel.style.left = `${Math.max(0, Math.min(newLeft, window.innerWidth - panel.offsetWidth))}px`; panel.style.top = `${Math.max(0, Math.min(newTop, window.innerHeight - panel.offsetHeight))}px`; panel.style.right = 'auto'; panel.style.bottom = 'auto'; }
    function onPanelMouseUp() { isPanelDragging = false; document.removeEventListener('mousemove', onPanelMouseMove); document.removeEventListener('mouseup', onPanelMouseUp); }

    widgetContainer.addEventListener('click', (e) => {
        if (wasDragged) { e.stopPropagation(); return; }
        const isVisible = panel.classList.toggle('visible');
        if (isVisible) { refreshData(); }
    });
})();