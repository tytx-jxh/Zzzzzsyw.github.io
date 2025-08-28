// 编辑器核心功能
class ContentEditor {
    constructor() {
        this.isEditing = false;
        this.currentElement = null;
        this.originalContent = '';
        this.data = {};
        this.editMode = false; // 将在init中根据配置设置
        this.toolbarVisible = true; // 工具栏可见性
        this.staticMode = true; // 静态模式标志，将在init中根据配置设置
        this.configMode = 'static'; // 配置文件中设置的模式
        this.init();
    }

    init() {
        // 从配置文件读取模式设置
        this.readModeFromConfig();

        // 根据配置模式决定是否加载localStorage数据
        if (!this.staticMode) {
            this.loadData();
        }

        this.bindEvents();
        this.setupToolbar();
        this.updateModeDisplay();

        // 只在编辑模式下显示编辑提示
        if (this.editMode) {
            this.showEditHints();
        }
    }

    // 从配置文件读取模式设置
    readModeFromConfig() {
        if (window.ConfigManager) {
            this.configMode = window.ConfigManager.getMode();
            this.staticMode = (this.configMode === 'static');
            this.editMode = (this.configMode === 'editable');

            console.log(`编辑器模式设置: ${this.configMode}, staticMode: ${this.staticMode}, editMode: ${this.editMode}`);
        }
    }

    // 由内容加载器调用，设置模式
    setModeFromConfig(mode) {
        this.configMode = mode;
        this.staticMode = (mode === 'static');
        this.editMode = (mode === 'editable');
        this.updateModeDisplay();

        // 根据模式显示或隐藏编辑提示和设置图片编辑器
        if (this.editMode) {
            this.showEditHints();
            this.setupImageEditors();
        } else {
            this.hideEditHints();
            this.removeImageEditors();
        }
    }

    // 加载保存的数据
    loadData() {
        const savedData = localStorage.getItem('website-content');
        if (savedData) {
            try {
                this.data = JSON.parse(savedData);
                this.applyData();
            } catch (e) {
                console.error('Failed to load saved data:', e);
            }
        }
    }

    // 应用数据到页面
    applyData() {
        Object.keys(this.data).forEach(key => {
            const element = document.querySelector(`[data-key="${key}"]`);
            if (element) {
                if (element.classList.contains('editable-image')) {
                    if (this.data[key]) {
                        element.style.backgroundImage = `url(${this.data[key]})`;
                        element.style.backgroundSize = 'cover';
                        element.style.backgroundPosition = 'center';
                        element.style.backgroundRepeat = 'no-repeat';
                        element.classList.add('has-custom-image');
                    }
                } else {
                    element.textContent = this.data[key];
                }
            }
        });
    }

    // 绑定事件
    bindEvents() {
        // 文本编辑事件
        document.querySelectorAll('.editable-text').forEach(element => {
            element.addEventListener('dblclick', (e) => {
                // 只在编辑模式下处理双击事件
                if (!this.editMode) return;
                e.preventDefault();
                e.stopPropagation();
                this.startTextEdit(element);
            });
        });

        // 图片编辑事件 - 只在编辑模式下设置
        if (this.editMode) {
            document.querySelectorAll('.editable-image').forEach(element => {
                this.setupImageEditor(element);
            });
        }

        // 全局点击事件
        document.addEventListener('click', (e) => {
            if (this.isEditing && !e.target.closest('.inline-editor')) {
                this.finishEdit();
            }
        });

        // 键盘事件
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isEditing) {
                this.cancelEdit();
            }
            if (e.key === 'Enter' && this.isEditing && !e.shiftKey) {
                if (this.currentElement.tagName !== 'TEXTAREA') {
                    e.preventDefault();
                    this.finishEdit();
                }
            }
        });
    }

    // 开始文本编辑
    startTextEdit(element) {
        // 只在编辑模式下允许编辑
        if (!this.editMode) {
            return;
        }

        if (this.isEditing) {
            this.finishEdit();
        }

        this.isEditing = true;
        this.currentElement = element;
        this.originalContent = element.textContent;

        element.classList.add('editing');
        
        const isMultiline = element.offsetHeight > 50 || element.textContent.length > 100;
        const input = document.createElement(isMultiline ? 'textarea' : 'input');
        
        if (isMultiline) {
            input.rows = Math.max(3, Math.ceil(element.textContent.length / 50));
        }
        
        input.value = element.textContent;
        input.className = 'inline-editor-input';
        
        // 复制样式
        const computedStyle = window.getComputedStyle(element);
        input.style.fontSize = computedStyle.fontSize;
        input.style.fontWeight = computedStyle.fontWeight;
        input.style.fontFamily = computedStyle.fontFamily;
        input.style.color = computedStyle.color;
        input.style.textAlign = computedStyle.textAlign;
        input.style.lineHeight = computedStyle.lineHeight;

        const wrapper = document.createElement('div');
        wrapper.className = 'inline-editor';
        wrapper.appendChild(input);

        element.style.display = 'none';
        element.parentNode.insertBefore(wrapper, element);

        input.focus();
        input.select();

        // 输入事件
        input.addEventListener('input', () => {
            this.autoResize(input);
        });

        this.autoResize(input);
    }

    // 自动调整输入框大小
    autoResize(input) {
        if (input.tagName === 'TEXTAREA') {
            input.style.height = 'auto';
            input.style.height = input.scrollHeight + 'px';
        }
    }

    // 完成编辑
    finishEdit() {
        if (!this.isEditing || !this.currentElement) return;

        const wrapper = this.currentElement.parentNode.querySelector('.inline-editor');
        if (!wrapper) return;

        const input = wrapper.querySelector('input, textarea');
        const newContent = input.value.trim();

        if (newContent !== this.originalContent) {
            this.currentElement.textContent = newContent;
            this.saveContent(this.currentElement.dataset.key, newContent);
            this.showSaveIndicator('已保存');
        }

        this.currentElement.style.display = '';
        this.currentElement.classList.remove('editing');
        wrapper.remove();

        this.isEditing = false;
        this.currentElement = null;
        this.originalContent = '';
    }

    // 取消编辑
    cancelEdit() {
        if (!this.isEditing || !this.currentElement) return;

        const wrapper = this.currentElement.parentNode.querySelector('.inline-editor');
        if (wrapper) {
            wrapper.remove();
        }

        this.currentElement.style.display = '';
        this.currentElement.classList.remove('editing');

        this.isEditing = false;
        this.currentElement = null;
        this.originalContent = '';
    }

    // 设置图片编辑器
    setupImageEditor(element) {
        // 避免重复添加
        if (element.querySelector('.image-upload-overlay')) {
            return;
        }

        const overlay = document.createElement('div');
        overlay.className = 'image-upload-overlay';
        overlay.innerHTML = `
            <div class="image-upload-text">
                📷<br>点击上传图片
            </div>
        `;

        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.className = 'image-upload-input';

        overlay.appendChild(input);
        element.appendChild(overlay);

        input.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                this.handleImageUpload(file, element);
            }
        });

        // 拖拽上传
        element.addEventListener('dragover', (e) => {
            e.preventDefault();
            element.classList.add('drag-over');
        });

        element.addEventListener('dragleave', () => {
            element.classList.remove('drag-over');
        });

        element.addEventListener('drop', (e) => {
            e.preventDefault();
            element.classList.remove('drag-over');
            
            const files = e.dataTransfer.files;
            if (files.length > 0 && files[0].type.startsWith('image/')) {
                this.handleImageUpload(files[0], element);
            }
        });
    }

    // 处理图片上传
    handleImageUpload(file, element) {
        // 只在编辑模式下允许上传
        if (!this.editMode) {
            return;
        }

        if (file.size > 5 * 1024 * 1024) { // 5MB限制
            this.showSaveIndicator('图片大小不能超过5MB', true);
            return;
        }

        // 显示加载状态
        element.classList.add('image-loading');

        const reader = new FileReader();
        reader.onload = (e) => {
            const imageUrl = e.target.result;
            element.style.backgroundImage = `url(${imageUrl})`;
            element.style.backgroundSize = 'cover';
            element.style.backgroundPosition = 'center';
            element.style.backgroundRepeat = 'no-repeat';

            // 添加自定义图片标记
            element.classList.add('has-custom-image');

            // 移除加载状态
            element.classList.remove('image-loading');

            this.saveContent(element.dataset.key, imageUrl);
            this.showSaveIndicator('图片已保存');
        };

        reader.onerror = () => {
            element.classList.remove('image-loading');
            this.showSaveIndicator('图片加载失败，请重试', true);
        };

        reader.readAsDataURL(file);
    }

    // 保存内容
    saveContent(key, value) {
        this.data[key] = value;
        localStorage.setItem('website-content', JSON.stringify(this.data));
        this.updateStorageInfo();
    }

    // 更新存储信息
    updateStorageInfo() {
        try {
            const dataStr = JSON.stringify(this.data);
            const sizeInBytes = new Blob([dataStr]).size;
            const sizeInMB = (sizeInBytes / (1024 * 1024)).toFixed(2);

            // 估算localStorage限制（通常5-10MB）
            const estimatedLimit = 5; // MB
            const usagePercent = ((sizeInBytes / (estimatedLimit * 1024 * 1024)) * 100).toFixed(1);

            // 更新工具栏显示
            const saveBtn = document.getElementById('save-btn');
            if (saveBtn) {
                saveBtn.title = `已使用存储: ${sizeInMB}MB (${usagePercent}%)`;
            }

            // 如果使用率超过80%，显示警告
            if (usagePercent > 80) {
                console.warn(`存储使用率较高: ${usagePercent}%，建议清理部分图片`);
            }
        } catch (e) {
            console.error('Failed to calculate storage info:', e);
        }
    }

    // 显示保存指示器
    showSaveIndicator(message, isError = false) {
        let indicator = document.querySelector('.save-indicator');
        if (!indicator) {
            indicator = document.createElement('div');
            indicator.className = 'save-indicator';
            document.body.appendChild(indicator);
        }

        indicator.textContent = message;
        indicator.className = `save-indicator ${isError ? 'error' : ''}`;
        
        // 强制重排以触发动画
        indicator.offsetHeight;
        indicator.classList.add('show');

        setTimeout(() => {
            indicator.classList.remove('show');
        }, 3000);
    }

    // 设置工具栏
    setupToolbar() {
        const toolbar = document.getElementById('edit-toolbar');
        const saveBtn = document.getElementById('save-btn');
        const resetBtn = document.getElementById('reset-btn');
        const exportBtn = document.getElementById('export-btn');
        const toggleModeBtn = document.getElementById('toggle-mode-btn');
        const toggleToolbarBtn = document.getElementById('toggle-toolbar-btn');

        // 根据配置决定是否显示工具栏
        if (window.ConfigManager && !window.ConfigManager.shouldShowToolbar()) {
            if (toolbar) {
                toolbar.style.display = 'none';
            }
            return; // 如果不应该显示工具栏，直接返回
        }

        saveBtn.addEventListener('click', () => {
            this.saveToFile();
        });

        resetBtn.addEventListener('click', () => {
            this.resetContent();
        });

        exportBtn.addEventListener('click', () => {
            this.exportContent();
        });

        // 添加配置导出按钮功能
        const configExportBtn = document.getElementById('config-export-btn');
        if (configExportBtn) {
            configExportBtn.addEventListener('click', () => {
                if (window.downloadConfig) {
                    window.downloadConfig();
                    this.showSaveIndicator('配置文件已导出');
                }
            });
        }

        // 添加存储信息显示
        this.updateStorageInfo();

        // 只有在允许模式切换时才绑定事件
        if (toggleModeBtn) {
            if (window.ConfigManager && window.ConfigManager.allowModeSwitch()) {
                toggleModeBtn.addEventListener('click', () => {
                    this.toggleEditMode();
                });
            } else {
                // 如果不允许切换模式，隐藏按钮或禁用
                toggleModeBtn.style.display = 'none';
            }
        }

        toggleToolbarBtn.addEventListener('click', () => {
            this.toggleToolbar();
        });

        // 悬浮显示工具栏按钮
        const showToolbarBtn = document.getElementById('show-toolbar-btn');
        if (showToolbarBtn) {
            showToolbarBtn.addEventListener('click', () => {
                this.toggleToolbar();
            });
        }
    }

    // 切换编辑模式
    toggleEditMode() {
        this.editMode = !this.editMode;

        // 如果切换到编辑模式，需要从localStorage加载数据
        if (this.editMode && this.staticMode) {
            this.staticMode = false;
            this.loadData();
            this.applyData();
            // 设置图片编辑器和编辑提示
            this.setupImageEditors();
            this.showEditHints();
            // 切换到编辑内容模式
            if (window.contentLoader) {
                window.contentLoader.switchToEditMode();
            }
        } else if (!this.editMode) {
            // 切换到静态模式
            this.staticMode = true;
            // 移除图片编辑器和编辑提示
            this.removeImageEditors();
            this.hideEditHints();
            if (window.contentLoader) {
                window.contentLoader.switchToStaticMode();
            }
        }

        this.updateModeDisplay();

        if (!this.editMode && this.isEditing) {
            this.finishEdit();
        }
    }

    // 更新模式显示
    updateModeDisplay() {
        const body = document.body;
        const toggleBtn = document.getElementById('toggle-mode-btn');
        const editElements = document.querySelectorAll('.editable-text, .editable-image');

        // 清除所有模式类
        body.classList.remove('editing-mode', 'display-mode', 'static-mode');

        if (this.editMode) {
            body.classList.add('editing-mode');
            if (toggleBtn) {
                toggleBtn.innerHTML = '📁 静态模式';
                toggleBtn.title = '切换到静态内容模式';
            }

            // 显示编辑提示
            editElements.forEach(element => {
                element.style.cursor = 'pointer';
                const hint = element.querySelector('.edit-hint');
                if (hint) {
                    hint.style.display = 'block';
                }
            });
        } else {
            // 静态模式或展示模式
            if (this.staticMode) {
                body.classList.add('static-mode');
                if (toggleBtn) {
                    toggleBtn.innerHTML = '✏️ 编辑模式';
                    toggleBtn.title = '切换到编辑模式（使用localStorage）';
                }
            } else {
                body.classList.add('display-mode');
                if (toggleBtn) {
                    toggleBtn.innerHTML = '👁️ 展示模式';
                    toggleBtn.title = '切换到展示模式';
                }
            }

            // 隐藏编辑提示
            editElements.forEach(element => {
                element.style.cursor = 'default';
                const hint = element.querySelector('.edit-hint');
                if (hint) {
                    hint.style.display = 'none';
                }
            });
        }
    }

    // 切换工具栏显示
    toggleToolbar() {
        this.toolbarVisible = !this.toolbarVisible;
        const toolbar = document.getElementById('edit-toolbar');
        const toggleBtn = document.getElementById('toggle-toolbar-btn');
        const showToolbarBtn = document.getElementById('show-toolbar-btn');

        if (this.toolbarVisible) {
            toolbar.style.transform = 'translateY(0)';
            toolbar.style.opacity = '0.9';
            toggleBtn.innerHTML = '⬇️';
            toggleBtn.title = '隐藏工具栏';
            showToolbarBtn.style.display = 'none';
        } else {
            toolbar.style.transform = 'translateY(100%)';
            toolbar.style.opacity = '0';
            toggleBtn.innerHTML = '⬆️';
            toggleBtn.title = '显示工具栏';
            showToolbarBtn.style.display = 'block';
        }
    }

    // 保存到文件
    saveToFile() {
        const dataStr = JSON.stringify(this.data, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(dataBlob);
        link.download = 'website-content.json';
        link.click();
        
        this.showSaveIndicator('内容已导出');
    }

    // 重置内容
    resetContent() {
        if (confirm('确定要重置所有内容吗？此操作不可撤销。')) {
            localStorage.removeItem('website-content');
            this.data = {};
            location.reload();
        }
    }

    // 导出内容
    exportContent() {
        const modal = this.createModal('导出内容', `
            <div class="modal-body">
                <p>选择导出格式：</p>
                <button class="modal-btn modal-btn-primary" onclick="editor.exportAsJSON()">JSON格式</button>
                <button class="modal-btn modal-btn-primary" onclick="editor.exportAsHTML()">HTML格式</button>
            </div>
        `);
        document.body.appendChild(modal);
        modal.classList.add('show');
    }

    // 导出为JSON
    exportAsJSON() {
        this.saveToFile();
        this.closeModal();
    }

    // 导出为HTML
    exportAsHTML() {
        const htmlContent = document.documentElement.outerHTML;
        const blob = new Blob([htmlContent], { type: 'text/html' });
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'website.html';
        link.click();
        
        this.showSaveIndicator('HTML已导出');
        this.closeModal();
    }

    // 创建模态框
    createModal(title, content) {
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3 class="modal-title">${title}</h3>
                    <button class="modal-close" onclick="editor.closeModal()">&times;</button>
                </div>
                ${content}
            </div>
        `;
        return modal;
    }

    // 关闭模态框
    closeModal() {
        const modal = document.querySelector('.modal');
        if (modal) {
            modal.classList.remove('show');
            setTimeout(() => modal.remove(), 300);
        }
    }

    // 显示编辑提示
    showEditHints() {
        document.querySelectorAll('.editable-text, .editable-image').forEach(element => {
            // 避免重复添加提示
            if (element.querySelector('.edit-hint')) {
                return;
            }

            const hint = document.createElement('div');
            hint.className = 'edit-hint';
            hint.textContent = element.classList.contains('editable-image') ? '点击上传图片' : '双击编辑文本';
            element.style.position = 'relative';
            element.appendChild(hint);
        });
    }

    // 隐藏编辑提示
    hideEditHints() {
        document.querySelectorAll('.edit-hint').forEach(hint => {
            hint.remove();
        });
    }

    // 设置所有图片编辑器
    setupImageEditors() {
        document.querySelectorAll('.editable-image').forEach(element => {
            this.setupImageEditor(element);
        });
    }

    // 移除所有图片编辑器
    removeImageEditors() {
        document.querySelectorAll('.image-upload-overlay').forEach(overlay => {
            overlay.remove();
        });
        document.querySelectorAll('.image-upload-input').forEach(input => {
            input.remove();
        });
    }
}

// 初始化编辑器
let editor;
document.addEventListener('DOMContentLoaded', () => {
    editor = new ContentEditor();
    // 不在这里设置body类，让编辑器根据配置自动设置
});
