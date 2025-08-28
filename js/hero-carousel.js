// Hero轮播图功能
class HeroCarousel {
    constructor() {
        this.currentSlide = 0;
        this.slides = [];
        this.indicators = [];
        this.autoPlayInterval = null;
        this.autoPlayDelay = 5000; // 5秒自动切换
        this.isAutoPlaying = true;
        
        this.init();
    }

    init() {
        this.slides = document.querySelectorAll('.hero-slide');
        this.indicators = document.querySelectorAll('.indicator');
        this.prevButton = document.querySelector('.hero-carousel-prev');
        this.nextButton = document.querySelector('.hero-carousel-next');

        if (this.slides.length === 0) {
            console.warn('Hero Carousel: No slides found');
            return;
        }

        this.bindEvents();
        this.startAutoPlay();
        this.updateSlideCounter();
    }

    bindEvents() {
        // 前一张按钮
        if (this.prevButton) {
            this.prevButton.addEventListener('click', () => {
                this.prevSlide();
                this.resetAutoPlay();
            });
        }

        // 下一张按钮
        if (this.nextButton) {
            this.nextButton.addEventListener('click', () => {
                this.nextSlide();
                this.resetAutoPlay();
            });
        }

        // 指示器点击
        this.indicators.forEach((indicator, index) => {
            indicator.addEventListener('click', () => {
                this.goToSlide(index);
                this.resetAutoPlay();
            });
        });

        // 键盘事件
        document.addEventListener('keydown', (e) => {
            switch (e.key) {
                case 'ArrowLeft':
                    e.preventDefault();
                    this.prevSlide();
                    this.resetAutoPlay();
                    break;
                case 'ArrowRight':
                    e.preventDefault();
                    this.nextSlide();
                    this.resetAutoPlay();
                    break;
                case ' ': // 空格键暂停/播放
                    e.preventDefault();
                    this.toggleAutoPlay();
                    break;
            }
        });

        // 鼠标悬停暂停自动播放
        const carouselContainer = document.querySelector('.hero-carousel-container');
        if (carouselContainer) {
            carouselContainer.addEventListener('mouseenter', () => {
                this.pauseAutoPlay();
            });

            carouselContainer.addEventListener('mouseleave', () => {
                if (this.isAutoPlaying) {
                    this.startAutoPlay();
                }
            });
        }

        // 触摸事件
        let startX = 0;
        let startY = 0;
        let endX = 0;
        let endY = 0;

        carouselContainer.addEventListener('touchstart', (e) => {
            startX = e.touches[0].clientX;
            startY = e.touches[0].clientY;
        });

        carouselContainer.addEventListener('touchend', (e) => {
            endX = e.changedTouches[0].clientX;
            endY = e.changedTouches[0].clientY;
            
            const deltaX = endX - startX;
            const deltaY = endY - startY;
            
            // 只有水平滑动距离大于垂直滑动距离时才触发
            if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 50) {
                if (deltaX > 0) {
                    this.prevSlide();
                } else {
                    this.nextSlide();
                }
                this.resetAutoPlay();
            }
        });
    }

    goToSlide(index) {
        if (index < 0 || index >= this.slides.length) return;

        // 移除当前活动状态
        this.slides[this.currentSlide].classList.remove('active');
        this.indicators[this.currentSlide].classList.remove('active');

        // 设置新的活动状态
        this.currentSlide = index;
        this.slides[this.currentSlide].classList.add('active');
        this.indicators[this.currentSlide].classList.add('active');

        this.updateSlideCounter();
    }

    nextSlide() {
        const nextIndex = (this.currentSlide + 1) % this.slides.length;
        this.goToSlide(nextIndex);
    }

    prevSlide() {
        const prevIndex = (this.currentSlide - 1 + this.slides.length) % this.slides.length;
        this.goToSlide(prevIndex);
    }

    updateSlideCounter() {
        // 更新所有幻灯片的计数器
        this.slides.forEach((slide, index) => {
            const counter = slide.querySelector('.hero-slide-counter');
            if (counter) {
                counter.textContent = `${index + 1}/${this.slides.length}`;
            }
        });
    }

    startAutoPlay() {
        if (this.autoPlayInterval) {
            clearInterval(this.autoPlayInterval);
        }
        
        this.autoPlayInterval = setInterval(() => {
            this.nextSlide();
        }, this.autoPlayDelay);
    }

    pauseAutoPlay() {
        if (this.autoPlayInterval) {
            clearInterval(this.autoPlayInterval);
            this.autoPlayInterval = null;
        }
    }

    resetAutoPlay() {
        if (this.isAutoPlaying) {
            this.pauseAutoPlay();
            this.startAutoPlay();
        }
    }

    toggleAutoPlay() {
        this.isAutoPlaying = !this.isAutoPlaying;
        
        if (this.isAutoPlaying) {
            this.startAutoPlay();
        } else {
            this.pauseAutoPlay();
        }
    }

    destroy() {
        this.pauseAutoPlay();
        // 移除事件监听器等清理工作
    }
}

// 页面加载完成后初始化Hero轮播图
document.addEventListener('DOMContentLoaded', () => {
    const heroCarousel = new HeroCarousel();
    
    // 将实例暴露到全局，方便调试
    window.heroCarousel = heroCarousel;
});
