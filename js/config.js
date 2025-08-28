// 网站内容配置文件
// 这个文件包含所有可编辑的文本内容和图片路径配置

// 网站模式配置
window.SITE_MODE_CONFIG = {
    // 网站运行模式：'static' 或 'editable'
    // 'static' - 静态模式，内容从配置文件加载，隐藏编辑功能
    // 'editable' - 可编辑模式，显示编辑工具栏，支持实时编辑
    mode: 'static',

    // 是否显示工具栏（仅在editable模式下有效）
    showToolbar: true,

    // 是否允许用户切换模式（如果为false，用户无法通过界面切换模式）
    allowModeSwitch: true
};

// 文本内容配置（从独立文件加载）
window.SITE_CONFIG = window.SITE_TEXT_CONFIG || {};

// 图片路径配置
window.IMAGE_CONFIG = {
    // Hero轮播图背景（3张）
    'hero-slide-1-bg': 'images/hero/slide-1.jpg',
    'hero-slide-2-bg': 'images/hero/slide-2.jpg',
    'hero-slide-3-bg': 'images/hero/slide-3.jpg',

    // 统计区域背景
    'stats-bg': 'images/backgrounds/stats-bg.jpg',

    // 怎么能这么漂亮区域图片（4张）
    'beauty-1-image': 'images/beauty/beauty-1.jpg',
    'beauty-2-image': 'images/beauty/beauty-2.jpg',
    'beauty-3-image': 'images/beauty/beauty-3.jpg',
    'beauty-4-image': 'images/beauty/beauty-4.jpg',

    // 想对你说区域图片（3张）
    'message-1-image': 'images/messages/message-1.jpg',
    'message-2-image': 'images/messages/message-2.jpg',
    'message-3-image': 'images/messages/message-3.jpg',

    // 底部背景
    'footer-bg': 'images/backgrounds/footer-bg.jpg'
};

// 配置管理器
window.ConfigManager = {
    // 获取网站模式配置
    getModeConfig: function() {
        return window.SITE_MODE_CONFIG || { mode: 'static', showToolbar: true, allowModeSwitch: true };
    },

    // 获取当前模式
    getMode: function() {
        return this.getModeConfig().mode || 'static';
    },

    // 是否允许模式切换
    allowModeSwitch: function() {
        return this.getModeConfig().allowModeSwitch !== false;
    },

    // 是否显示工具栏
    shouldShowToolbar: function() {
        const config = this.getModeConfig();
        return config.mode === 'editable' && config.showToolbar !== false;
    },

    // 获取文本内容
    getText: function(key) {
        return window.SITE_TEXT_CONFIG[key] || window.SITE_CONFIG[key] || '';
    },

    // 获取图片路径
    getImage: function(key) {
        return window.IMAGE_CONFIG[key] || '';
    },

    // 设置文本内容（用于编辑模式）
    setText: function(key, value) {
        if (window.SITE_TEXT_CONFIG) {
            window.SITE_TEXT_CONFIG[key] = value;
        }
        window.SITE_CONFIG[key] = value;
    },

    // 设置图片路径（用于编辑模式）
    setImage: function(key, value) {
        window.IMAGE_CONFIG[key] = value;
    },

    // 导出配置（用于生成新的配置文件）
    exportConfig: function() {
        return {
            mode: window.SITE_MODE_CONFIG,
            text: window.SITE_TEXT_CONFIG || window.SITE_CONFIG,
            images: window.IMAGE_CONFIG
        };
    }
};
