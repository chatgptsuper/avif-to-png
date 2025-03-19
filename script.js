document.addEventListener('DOMContentLoaded', () => {
    // 获取DOM元素
    const dropZone = document.getElementById('drop-zone');
    const fileInput = document.getElementById('file-input');
    const browseButton = document.getElementById('browse-button');
    const processingArea = document.getElementById('processing-area');
    const resultArea = document.getElementById('result-area');
    const progressBar = document.getElementById('progress-bar');
    const statusText = document.getElementById('status-text');
    const conversionSummary = document.getElementById('conversion-summary');
    const totalSize = document.getElementById('total-size');
    const previewContainer = document.getElementById('preview-container');
    const resultsList = document.getElementById('results-list');
    const downloadAllBtn = document.getElementById('download-all-btn');
    const convertAnotherBtn = document.getElementById('convert-another-btn');
    
    // 存储转换结果
    let convertedFiles = [];
    let totalBytes = 0;
    
     // FAQ切换功能
     const faqToggles = document.querySelectorAll('.faq-toggle');
     faqToggles.forEach(toggle => {
         toggle.addEventListener('click', () => {
             const content = toggle.nextElementSibling;
             const icon = toggle.querySelector('i');
             
             content.classList.toggle('hidden');
             
             // 修正这里：添加旋转图标的逻辑
             if (content.classList.contains('hidden')) {
                 icon.style.transform = 'rotate(0deg)';
             } else {
                 icon.style.transform = 'rotate(180deg)';
             }
         });
     });
    
    // 文件拖放功能
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, preventDefaults, false);
    });
    
    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }
    
    ['dragenter', 'dragover'].forEach(eventName => {
        dropZone.addEventListener(eventName, () => {
            dropZone.classList.add('active');
        });
    });
    
    ['dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, () => {
            dropZone.classList.remove('active');
        });
    });
    
    dropZone.addEventListener('drop', handleDrop);
    browseButton.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', handleFileSelect);
    convertAnotherBtn.addEventListener('click', resetConverter);
    downloadAllBtn.addEventListener('click', downloadAllFiles);
    
    // 处理拖放的文件
    function handleDrop(e) {
        const dt = e.dataTransfer;
        const files = dt.files;
        
        if (files.length) {
            handleFiles(files);
        }
    }
    
    // 处理选择的文件
    function handleFileSelect(e) {
        const files = e.target.files;
        
        if (files.length) {
            handleFiles(files);
        }
    }
    
    // 处理文件
    // 添加错误处理函数
    function handleError(message) {
        const errorMessage = document.getElementById('error-message');
        const errorText = document.getElementById('error-text');
        
        if (errorMessage && errorText) {
            errorText.textContent = message;
            errorMessage.classList.remove('hidden');
            
            // 5秒后自动隐藏错误消息
            setTimeout(() => {
                errorMessage.classList.add('hidden');
            }, 5000);
        } else {
            console.error(message);
        }
    }
    
    // 改进文件处理函数
    function handleFiles(files) {
        // 过滤出AVIF文件并检查大小
        const validFiles = Array.from(files).filter(file => {
            // 检查文件类型
            const isAvif = file.type === 'image/avif' || file.name.toLowerCase().endsWith('.avif');
            
            // 检查文件大小 (限制为20MB)
            const isValidSize = file.size <= 20 * 1024 * 1024;
            
            if (!isAvif) {
                handleError(`"${file.name}" is not a valid AVIF file.`);
            }
            
            if (!isValidSize) {
                handleError(`"${file.name}" exceeds the 20MB size limit.`);
            }
            
            return isAvif && isValidSize;
        });
        
        if (validFiles.length === 0) {
            return;
        }
        
        // 继续处理有效文件
        // 重置转换结果
        convertedFiles = [];
        totalBytes = 0;
        resultsList.innerHTML = '';
        
        // 显示处理区域
        dropZone.classList.add('hidden');
        processingArea.classList.remove('hidden');
        
        // 更新状态文本
        statusText.textContent = `Processing 0/${validFiles.length} files...`;
        
        // 开始批量转换
        processBatch(validFiles);
    }
    
    // 批量处理文件
    function processBatch(files) {
        let completed = 0;
        const total = files.length;
        
        // 为每个文件创建一个转换任务
        files.forEach((file, index) => {
            setTimeout(() => {
                convertAVIFtoPNG(file, (result) => {
                    completed++;
                    
                    // 更新进度
                    const percent = Math.floor((completed / total) * 100);
                    updateProgress(percent);
                    statusText.textContent = `Processing ${completed}/${total} files...`;
                    
                    // 添加到结果列表
                    if (result) {
                        convertedFiles.push(result);
                        totalBytes += result.size;
                        addResultItem(result, completed === 1); // 第一个结果自动选中
                    }
                    
                    // 检查是否所有文件都已处理
                    if (completed === total) {
                        finishBatchProcessing();
                    }
                });
            }, index * 100); // 稍微错开处理时间，避免浏览器卡顿
        });
    }
    
    // 转换AVIF到PNG
    function convertAVIFtoPNG(file, callback) {
        const reader = new FileReader();
        
        reader.onload = function(e) {
            const img = new Image();
            
            img.onload = function() {
                // 创建canvas
                const canvas = document.createElement('canvas');
                canvas.width = img.width;
                canvas.height = img.height;
                
                // 绘制图像到canvas
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0);
                
                try {
                    // 转换为PNG
                    const pngDataUrl = canvas.toDataURL('image/png');
                    
                    // 准备结果对象
                    const filename = file.name.replace(/\.avif$/i, '.png');
                    const byteString = atob(pngDataUrl.split(',')[1]);
                    const fileSize = byteString.length;
                    
                    const result = {
                        originalName: file.name,
                        name: filename,
                        dataUrl: pngDataUrl,
                        size: fileSize,
                        width: img.width,
                        height: img.height
                    };
                    
                    callback(result);
                } catch (error) {
                    console.error('Error converting image:', error);
                    callback(null);
                }
            };
            
            img.onerror = function() {
                console.error('Failed to load image:', file.name);
                callback(null);
            };
            
            // 设置图像源
            img.src = e.target.result;
        };
        
        reader.onerror = function() {
            console.error('Error reading file:', file.name);
            callback(null);
        };
        
        // 读取文件
        reader.readAsDataURL(file);
    }
    
    // 添加结果项到列表
    function addResultItem(result, autoSelect) {
        const item = document.createElement('div');
        // 修改列表项样式，添加相对定位和溢出隐藏，确保边框能够完全显示
        item.className = 'flex items-center justify-between bg-white rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow relative overflow-visible';
        item.innerHTML = `
            <div class="flex items-center flex-1 min-w-0">
                <div class="w-10 h-10 bg-gray-100 rounded flex items-center justify-center mr-3 flex-shrink-0">
                    <i class="fas fa-file-image text-primary"></i>
                </div>
                <div class="truncate">
                    <p class="font-medium truncate">${result.name}</p>
                    <p class="text-xs text-gray-500">${formatFileSize(result.size)} · ${result.width}×${result.height}</p>
                </div>
            </div>
            <div class="flex space-x-2 ml-2">
                <button class="preview-btn text-gray-500 hover:text-primary p-2 rounded-full hover:bg-blue-50 transition-colors">
                    <i class="fas fa-eye"></i>
                </button>
                <button class="download-btn text-gray-500 hover:text-primary p-2 rounded-full hover:bg-blue-50 transition-colors">
                    <i class="fas fa-download"></i>
                </button>
            </div>
        `;
        
        // 添加到列表
        resultsList.appendChild(item);
        
        // 添加事件监听器
        const previewBtn = item.querySelector('.preview-btn');
        const downloadBtn = item.querySelector('.download-btn');
        
        previewBtn.addEventListener('click', () => {
            showPreview(result);
            
            // 移除其他项的选中状态
            document.querySelectorAll('#results-list > div').forEach(el => {
                el.classList.remove('ring-2', 'ring-primary', 'ring-offset-1', 'selected-item');
            });
            
            // 添加选中状态，使用自定义类名
            item.classList.add('ring-2', 'ring-primary', 'ring-offset-1', 'selected-item');
        });
        
        downloadBtn.addEventListener('click', () => {
            downloadFile(result);
        });
        
        // 自动选中
        if (autoSelect) {
            previewBtn.click();
        }
    }
    
    // 显示预览
    function showPreview(result) {
        previewContainer.innerHTML = `
            <img src="${result.dataUrl}" alt="${result.name}" class="max-w-full h-auto mx-auto rounded-lg">
            <div class="text-center mt-4">
                <p class="text-sm text-gray-500">${result.width} × ${result.height}</p>
            </div>
        `;
    }
    
    // 下载单个文件
    function downloadFile(result) {
        const link = document.createElement('a');
        link.href = result.dataUrl;
        link.download = result.name;
        link.click();
    }
    
    // 下载所有文件
    function downloadAllFiles() {
        if (convertedFiles.length === 0) return;
        
        if (convertedFiles.length === 1) {
            // 如果只有一个文件，直接下载
            downloadFile(convertedFiles[0]);
            return;
        }
        
        // 多个文件，使用JSZip打包下载
        if (typeof JSZip === 'undefined') {
            // 如果JSZip未加载，动态加载
            const script = document.createElement('script');
            script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js';
            script.onload = createAndDownloadZip;
            document.head.appendChild(script);
        } else {
            createAndDownloadZip();
        }
    }
    
    // 创建并下载ZIP文件
    function createAndDownloadZip() {
        const zip = new JSZip();
        let count = 0;
        
        // 添加下载按钮加载状态
        downloadAllBtn.disabled = true;
        downloadAllBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Creating ZIP...';
        
        // 添加所有文件到ZIP
        convertedFiles.forEach(file => {
            // 从dataURL中提取二进制数据
            const binary = atob(file.dataUrl.split(',')[1]);
            
            // 创建Uint8Array
            const array = new Uint8Array(binary.length);
            for (let i = 0; i < binary.length; i++) {
                array[i] = binary.charCodeAt(i);
            }
            
            // 添加到zip
            zip.file(file.name, array, {binary: true});
        });
        
        // 生成ZIP文件并下载
        zip.generateAsync({type: 'blob'}).then(function(content) {
            // 恢复下载按钮状态
            downloadAllBtn.disabled = false;
            downloadAllBtn.innerHTML = '<i class="fas fa-download mr-2"></i>Download All';
            
            // 创建下载链接
            const link = document.createElement('a');
            link.href = URL.createObjectURL(content);
            link.download = 'converted_images.zip';
            link.click();
            
            // 释放URL对象
            setTimeout(() => {
                URL.revokeObjectURL(link.href);
            }, 100);
        });
    }
    
    // 完成批量处理
    function finishBatchProcessing() {
        // 更新转换摘要
        const fileCount = convertedFiles.length;
        conversionSummary.textContent = `${fileCount} ${fileCount === 1 ? 'file' : 'files'} converted`;
        totalSize.textContent = `${formatFileSize(totalBytes)} total`;
        
        // 显示结果区域
        setTimeout(() => {
            processingArea.classList.add('hidden');
            resultArea.classList.remove('hidden');
        }, 500);
    }
    
    // 重置转换器
    function resetConverter() {
        resultArea.classList.add('hidden');
        dropZone.classList.remove('hidden');
        fileInput.value = '';
        progressBar.style.width = '0%';
        previewContainer.innerHTML = '<p class="text-center text-gray-500 py-4">Select an image to preview</p>';
    }
    
    // 更新进度条
    function updateProgress(percent) {
        progressBar.style.width = `${percent}%`;
    }
    
    // 格式化文件大小
    function formatFileSize(bytes) {
        if (bytes < 1024) {
            return bytes + ' bytes';
        } else if (bytes < 1024 * 1024) {
            return (bytes / 1024).toFixed(2) + ' KB';
        } else {
            return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
        }
    }
});