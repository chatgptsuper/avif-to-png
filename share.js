document.addEventListener('DOMContentLoaded', () => {
    // 获取所有分享按钮
    const shareButtons = document.querySelectorAll('.share-btn');
    
    // 为每个按钮添加点击事件
    shareButtons.forEach(button => {
        button.addEventListener('click', () => {
            const platform = button.getAttribute('data-platform');
            const currentUrl = encodeURIComponent(window.location.href);
            const title = encodeURIComponent(document.title);
            let shareUrl = '';
            
            // 根据平台构建分享链接
            switch(platform) {
                case 'facebook':
                    shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${currentUrl}`;
                    break;
                case 'twitter':
                    shareUrl = `https://twitter.com/intent/tweet?url=${currentUrl}&text=${title}`;
                    break;
                default:
                    return;
            }
            
            // 打开分享窗口
            window.open(shareUrl, '_blank', 'width=600,height=400');
        });
    });
    
    // 联系表单提交处理
    const contactForm = document.getElementById('contact-form');
    const successMessage = document.getElementById('success-message');
    
    if (contactForm) {
        contactForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            // 在实际应用中，这里应该有表单数据的处理和发送逻辑
            // 这里仅做演示，显示成功消息
            
            // 隐藏表单
            contactForm.style.display = 'none';
            
            // 显示成功消息
            successMessage.classList.remove('hidden');
        });
    }
});