// 内容加载器 - 负责从配置文件加载内容到页面
class ContentLoader {
    constructor() {
        // 从配置文件读取模式设置
        this.isStaticMode = true; // 临时默认值，会在init中更新
        this.init();
    }

    init() {
        // 等待DOM和配置文件都加载完成
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                this.loadContent();
            });
        } else {
            this.loadContent();
        }
    }

    // 加载所有内容
    loadContent() {
        console.log('开始加载内容...');

        // 检查配置是否已加载
        if ((typeof window.SITE_TEXT_CONFIG === 'undefined' && typeof window.SITE_CONFIG === 'undefined') || typeof window.IMAGE_CONFIG === 'undefined') {
            console.error('配置文件未正确加载，请检查text-config.js和config.js文件');
            return;
        }

        // 从配置文件读取模式设置
        const configuredMode = window.ConfigManager ? window.ConfigManager.getMode() : 'static';
        this.isStaticMode = (configuredMode === 'static');

        console.log(`当前模式: ${configuredMode}`);

        this.loadTextContent();
        this.loadImageContent();

        // 通知编辑器当前模式
        if (window.editor) {
            window.editor.setModeFromConfig(configuredMode);
        }

        console.log('内容加载完成');
    }

    // 加载文本内容
    loadTextContent() {
        // 获取所有可编辑文本元素
        const textElements = document.querySelectorAll('.editable-text[data-key]');
        
        textElements.forEach(element => {
            const key = element.dataset.key;
            const content = window.ConfigManager.getText(key);
            
            if (content) {
                // 支持HTML内容（如<br>标签）
                element.innerHTML = content;
                console.log(`加载文本内容: ${key} = ${content}`);
            } else {
                console.warn(`未找到文本内容: ${key}`);
            }
        });
    }

    // 加载图片内容
    loadImageContent() {
        // 获取所有可编辑图片元素
        const imageElements = document.querySelectorAll('.editable-image[data-key]');
        
        imageElements.forEach(element => {
            const key = element.dataset.key;
            const imagePath = window.ConfigManager.getImage(key);
            
            if (imagePath) {
                // 检查图片文件是否存在
                this.checkImageExists(imagePath).then(exists => {
                    if (exists) {
                        element.style.backgroundImage = `url(${imagePath})`;
                        element.style.backgroundSize = 'cover';
                        element.style.backgroundPosition = 'center';
                        element.style.backgroundRepeat = 'no-repeat';
                        element.classList.add('has-static-image');
                        console.log(`加载图片: ${key} = ${imagePath}`);
                    } else {
                        console.warn(`图片文件不存在: ${imagePath}`);
                        // 保持默认的渐变背景
                    }
                });
            } else {
                console.log(`使用默认背景: ${key}`);
                // 保持默认的渐变背景
            }
        });
    }

    // 检查图片文件是否存在
    checkImageExists(imagePath) {
        return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => resolve(true);
            img.onerror = () => resolve(false);
            img.src = imagePath;
        });
    }

    // 切换到编辑模式（从localStorage加载）
    switchToEditMode() {
        this.isStaticMode = false;
        console.log('切换到编辑模式，从localStorage加载内容');
        
        // 如果编辑器存在，让它重新加载数据
        if (window.editor && typeof window.editor.loadData === 'function') {
            window.editor.loadData();
            window.editor.applyData();
        }
    }

    // 切换到静态模式（从配置文件加载）
    switchToStaticMode() {
        this.isStaticMode = true;
        console.log('切换到静态模式，从配置文件加载内容');
        this.loadContent();
    }

    // 获取当前模式
    getCurrentMode() {
        return this.isStaticMode ? 'static' : 'edit';
    }

    // 重新加载内容
    reload() {
        if (this.isStaticMode) {
            this.loadContent();
        } else {
            this.switchToEditMode();
        }
    }

    // 导出当前内容为配置格式（用于更新config.js）
    exportCurrentContent() {
        const textConfig = {};
        const imageConfig = {};

        // 导出文本内容
        const textElements = document.querySelectorAll('.editable-text[data-key]');
        textElements.forEach(element => {
            const key = element.dataset.key;
            textConfig[key] = element.innerHTML;
        });

        // 导出图片路径
        const imageElements = document.querySelectorAll('.editable-image[data-key]');
        imageElements.forEach(element => {
            const key = element.dataset.key;
            const bgImage = element.style.backgroundImage;
            if (bgImage && bgImage !== 'none') {
                // 提取URL
                const match = bgImage.match(/url\(['"]?([^'"]+)['"]?\)/);
                if (match) {
                    imageConfig[key] = match[1];
                }
            }
        });

        return {
            text: textConfig,
            images: imageConfig
        };
    }

    // 生成新的配置文件内容
    generateConfigFile() {
        const currentContent = this.exportCurrentContent();
        const currentModeConfig = window.ConfigManager ? window.ConfigManager.getModeConfig() : { mode: 'static', showToolbar: true, allowModeSwitch: true };

        // 生成text-config.js文件内容
        let textConfigContent = `// 网站文本内容配置文件\n`;
        textConfigContent += `// 这个文件包含所有可编辑的文本内容\n\n`;
        textConfigContent += `window.SITE_TEXT_CONFIG = ${JSON.stringify(currentContent.text, null, 4)};\n`;

        // 生成config.js文件内容
        let configContent = `// 网站配置文件\n`;
        configContent += `// 这个文件包含模式配置和图片路径配置\n\n`;

        // 添加模式配置
        configContent += `// 网站模式配置\n`;
        configContent += `window.SITE_MODE_CONFIG = ${JSON.stringify(currentModeConfig, null, 4)};\n\n`;

        // 文本内容配置（从独立文件加载）
        configContent += `// 文本内容配置（从独立文件加载）\n`;
        configContent += `window.SITE_CONFIG = window.SITE_TEXT_CONFIG || {};\n\n`;

        configContent += `// 图片路径配置\n`;
        configContent += `window.IMAGE_CONFIG = ${JSON.stringify(currentContent.images, null, 4)};\n\n`;

        // 添加完整的ConfigManager
        configContent += `// 配置管理器\n`;
        configContent += `window.ConfigManager = {\n`;
        configContent += `    getModeConfig: function() { return window.SITE_MODE_CONFIG || { mode: 'static', showToolbar: true, allowModeSwitch: true }; },\n`;
        configContent += `    getMode: function() { return this.getModeConfig().mode || 'static'; },\n`;
        configContent += `    allowModeSwitch: function() { return this.getModeConfig().allowModeSwitch !== false; },\n`;
        configContent += `    shouldShowToolbar: function() { const config = this.getModeConfig(); return config.mode === 'editable' && config.showToolbar !== false; },\n`;
        configContent += `    getText: function(key) { return window.SITE_CONFIG[key] || ''; },\n`;
        configContent += `    getImage: function(key) { return window.IMAGE_CONFIG[key] || ''; },\n`;
        configContent += `    setText: function(key, value) { window.SITE_CONFIG[key] = value; },\n`;
        configContent += `    setImage: function(key, value) { window.IMAGE_CONFIG[key] = value; },\n`;
        configContent += `    exportConfig: function() { return { mode: window.SITE_MODE_CONFIG, text: window.SITE_TEXT_CONFIG || window.SITE_CONFIG, images: window.IMAGE_CONFIG }; }\n`;
        configContent += `};`;

        // 返回两个文件的内容
        return {
            textConfig: textConfigContent,
            mainConfig: configContent
        };
    }

    // 下载配置文件
    downloadConfigFile() {
        const configFiles = this.generateConfigFile();

        // 下载text-config.js
        const textBlob = new Blob([configFiles.textConfig], { type: 'text/javascript' });
        const textUrl = URL.createObjectURL(textBlob);

        const textLink = document.createElement('a');
        textLink.href = textUrl;
        textLink.download = 'text-config.js';
        textLink.click();

        URL.revokeObjectURL(textUrl);

        // 延迟下载config.js，避免同时下载
        setTimeout(() => {
            const configBlob = new Blob([configFiles.mainConfig], { type: 'text/javascript' });
            const configUrl = URL.createObjectURL(configBlob);

            const configLink = document.createElement('a');
            configLink.href = configUrl;
            configLink.download = 'config.js';
            configLink.click();

            URL.revokeObjectURL(configUrl);
        }, 500);

        console.log('配置文件已下载（text-config.js 和 config.js）');
    }
}

// 创建全局实例
window.contentLoader = new ContentLoader();

// 提供全局方法
window.loadStaticContent = function() {
    window.contentLoader.switchToStaticMode();
};

window.loadEditContent = function() {
    window.contentLoader.switchToEditMode();
};

window.exportConfig = function() {
    return window.contentLoader.exportCurrentContent();
};

window.downloadConfig = function() {
    window.contentLoader.downloadConfigFile();
};
