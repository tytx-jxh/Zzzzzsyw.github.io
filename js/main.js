// 主要功能和交互
document.addEventListener('DOMContentLoaded', function () {
    // 初始化所有功能
    initNavigation();
    initAnimations();
    initScrollEffects();
    initResponsiveFeatures();
    initHeroSection();
    initMessageImageClicks();

});

// 导航功能
function initNavigation() {
    const navbar = document.querySelector('.navbar');
    const navLinks = document.querySelectorAll('.nav-menu a');

    // 滚动时导航栏效果
    window.addEventListener('scroll', () => {
        if (window.scrollY > 100) {
            navbar.style.background = 'rgba(255, 255, 255, 0.98)';
            navbar.style.boxShadow = '0 2px 20px rgba(0, 0, 0, 0.15)';
        } else {
            navbar.style.background = 'rgba(255, 255, 255, 0.95)';
            navbar.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.1)';
        }
    });

    // 平滑滚动到锚点
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = link.getAttribute('href');
            const targetSection = document.querySelector(targetId);

            if (targetSection) {
                const offsetTop = targetSection.offsetTop - 80; // 考虑导航栏高度
                window.scrollTo({
                    top: offsetTop,
                    behavior: 'smooth'
                });
            }
        });
    });

    // 移动端菜单切换
    const navBrand = document.querySelector('.nav-brand');
    const navMenu = document.querySelector('.nav-menu');

    navBrand.addEventListener('click', () => {
        navMenu.classList.toggle('active');
    });
}

// 动画效果
function initAnimations() {
    // 创建观察器用于滚动动画
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('fade-in-up');

                // 为统计数字添加计数动画
                if (entry.target.classList.contains('stat-item')) {
                    animateNumber(entry.target.querySelector('.stat-number'));
                }
            }
        });
    }, observerOptions);

    // 观察需要动画的元素
    const animatedElements = document.querySelectorAll(`
        .stat-item,
        .timeline-item,
        .future-card,
        .message-card,
        .content-column
    `);

    animatedElements.forEach(el => observer.observe(el));
}

// 数字计数动画
function animateNumber(element) {
    const finalNumber = parseInt(element.textContent);
    const duration = 2000; // 2秒
    const startTime = performance.now();

    function updateNumber(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);

        // 使用缓动函数
        const easeOutQuart = 1 - Math.pow(1 - progress, 4);
        const currentNumber = Math.floor(finalNumber * easeOutQuart);

        element.textContent = currentNumber;

        if (progress < 1) {
            requestAnimationFrame(updateNumber);
        } else {
            element.textContent = finalNumber;
        }
    }

    requestAnimationFrame(updateNumber);
}

// 滚动效果
function initScrollEffects() {
    let ticking = false;

    function updateScrollEffects() {
        const scrolled = window.pageYOffset;
        const rate = scrolled * -0.5;

        // 视差效果
        const heroBackground = document.querySelector('.hero-background');
        if (heroBackground) {
            heroBackground.style.transform = `translateY(${rate}px)`;
        }

        ticking = false;
    }

    function requestTick() {
        if (!ticking) {
            requestAnimationFrame(updateScrollEffects);
            ticking = true;
        }
    }

    window.addEventListener('scroll', requestTick);
}

// 响应式功能
function initResponsiveFeatures() {
    // 检测设备类型
    const isMobile = window.innerWidth <= 768;

    if (isMobile) {
        // 移动端特定功能
        initMobileFeatures();
    }

    // 窗口大小改变时重新检测
    window.addEventListener('resize', debounce(() => {
        const newIsMobile = window.innerWidth <= 768;
        if (newIsMobile !== isMobile) {
            location.reload(); // 简单的响应式处理
        }
    }, 250));
}

// 移动端功能
function initMobileFeatures() {
    // 触摸滑动效果
    let startY = 0;
    let currentY = 0;

    document.addEventListener('touchstart', (e) => {
        startY = e.touches[0].clientY;
    });

    document.addEventListener('touchmove', (e) => {
        currentY = e.touches[0].clientY;
        const diff = startY - currentY;

        // 可以在这里添加滑动效果
    });
}

// Hero区域功能
function initHeroSection() {
    const heroButton = document.querySelector('.hero-button');

    if (heroButton) {
        heroButton.addEventListener('click', () => {
            // 滚动到统计区域
            const statsSection = document.querySelector('.stats-section');
            if (statsSection) {
                statsSection.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    }

    // 动态背景效果
    createFloatingElements();
}

// 创建浮动元素
function createFloatingElements() {
    const heroSection = document.querySelector('.hero-section');
    if (!heroSection) return;

    for (let i = 0; i < 20; i++) {
        const element = document.createElement('div');
        element.className = 'floating-element';
        element.style.cssText = `
            position: absolute;
            width: ${Math.random() * 10 + 5}px;
            height: ${Math.random() * 10 + 5}px;
            background: rgba(255, 255, 255, 0.1);
            border-radius: 50%;
            left: ${Math.random() * 100}%;
            top: ${Math.random() * 100}%;
            animation: float ${Math.random() * 10 + 10}s infinite linear;
            pointer-events: none;
        `;
        heroSection.appendChild(element);
    }

    // 添加浮动动画CSS
    if (!document.querySelector('#floating-animation')) {
        const style = document.createElement('style');
        style.id = 'floating-animation';
        style.textContent = `
            @keyframes float {
                0% {
                    transform: translateY(100vh) rotate(0deg);
                    opacity: 0;
                }
                10% {
                    opacity: 1;
                }
                90% {
                    opacity: 1;
                }
                100% {
                    transform: translateY(-100px) rotate(360deg);
                    opacity: 0;
                }
            }
        `;
        document.head.appendChild(style);
    }
}

// 工具函数
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// 节流函数
function throttle(func, limit) {
    let inThrottle;
    return function () {
        const args = arguments;
        const context = this;
        if (!inThrottle) {
            func.apply(context, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

// 平滑滚动polyfill
if (!('scrollBehavior' in document.documentElement.style)) {
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/gh/iamdustan/smoothscroll@master/src/smoothscroll.js';
    document.head.appendChild(script);
}

// 图片懒加载
function initLazyLoading() {
    const images = document.querySelectorAll('img[data-src]');

    const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                img.src = img.dataset.src;
                img.classList.remove('lazy');
                imageObserver.unobserve(img);
            }
        });
    });

    images.forEach(img => imageObserver.observe(img));
}

// 性能监控
function initPerformanceMonitoring() {
    // 页面加载时间
    window.addEventListener('load', () => {
        const loadTime = performance.now();
        console.log(`页面加载时间: ${loadTime.toFixed(2)}ms`);

        // 可以发送到分析服务
        if (loadTime > 3000) {
            console.warn('页面加载时间较长，建议优化');
        }
    });
}

// 错误处理
window.addEventListener('error', (e) => {
    console.error('页面错误:', e.error);
    // 可以发送错误报告到服务器
});



// 滚动到关于我们区域
function scrollToAbout() {
    const aboutSection = document.querySelector('#about');
    if (aboutSection) {
        // 动态获取导航栏高度
        const navbar = document.querySelector('.navbar');
        const navbarHeight = navbar ? navbar.offsetHeight : 80;
        const offsetTop = aboutSection.offsetTop - navbarHeight - 20; // 额外留20px间距

        window.scrollTo({
            top: offsetTop,
            behavior: 'smooth'
        });
    }
}

// 初始化消息图片点击功能
function initMessageImageClicks() {
    // 为"想对你说"区域的图片添加点击事件
    const messageImages = [
        { selector: '[data-key="message-1-image"]', url: 'message1.html' },
        { selector: '[data-key="message-2-image"]', url: 'message2.html' },
        { selector: '[data-key="message-3-image"]', url: 'message3.html' }
    ];

    messageImages.forEach(item => {
        const imageElement = document.querySelector(item.selector);
        if (imageElement) {
            // 添加点击样式
            imageElement.style.cursor = 'pointer';
            imageElement.style.transition = 'transform 0.3s ease, box-shadow 0.3s ease';

            // 添加悬停效果
            imageElement.addEventListener('mouseenter', () => {
                imageElement.style.transform = 'scale(1.05)';
                imageElement.style.boxShadow = '0 8px 25px rgba(0, 0, 0, 0.15)';
            });

            imageElement.addEventListener('mouseleave', () => {
                imageElement.style.transform = 'scale(1)';
                imageElement.style.boxShadow = 'none';
            });

            // 添加点击事件
            imageElement.addEventListener('click', () => {
                // 添加点击动画
                imageElement.style.transform = 'scale(0.95)';
                setTimeout(() => {
                    imageElement.style.transform = 'scale(1)';
                    // 跳转到对应页面
                    window.location.href = item.url;
                }, 150);
            });
        }
    });
}

// 初始化其他功能
document.addEventListener('DOMContentLoaded', () => {
    initLazyLoading();
    initPerformanceMonitoring();
});
