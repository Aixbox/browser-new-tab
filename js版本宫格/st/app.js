const gridDemo = document.getElementById('gridDemo');

let currentHighlightedElement = null;
let mergeMode = false; // 是否处于合并模式
let mergePosition = null; // 'before' 或 'after'
let modalSortableInstance = null; // 弹窗中的 Sortable 实例

// 创建 Sortable 实例的通用函数
function createSortableInstance(element, isModal = false) {
	return new Sortable(element, {
		animation: 150,
		ghostClass: 'blue-background-class',
		dragClass: 'dragging-element',
		
		onMove: function(evt, originalEvent) {
			const draggedRect = evt.draggedRect;
			const relatedRect = evt.relatedRect;
			const related = evt.related;
			
			if (!related) {
				if (currentHighlightedElement) {
					currentHighlightedElement.classList.remove('merge-highlight');
					currentHighlightedElement = null;
				}
				mergeMode = false;
				return true;
			}
			
			const mouseX = originalEvent.clientX;
			const mouseY = originalEvent.clientY;
			
			const relatedLeft = relatedRect.left;
			const relatedRight = relatedRect.right;
			const relatedTop = relatedRect.top;
			const relatedBottom = relatedRect.bottom;
			const relatedWidth = relatedRect.width;
			const relatedCenter = relatedLeft + relatedWidth / 2;
			
			const draggedCenter = draggedRect.left + draggedRect.width / 2;
			const isTargetOnLeft = relatedCenter < draggedCenter;
			const isTargetOnRight = relatedCenter > draggedCenter;
			
			const leftZone = relatedLeft + relatedWidth * 0.33;
			const rightZone = relatedRight - relatedWidth * 0.33;
			
			const isMouseInLeftZone = mouseX < leftZone;
			const isMouseInRightZone = mouseX > rightZone;
			
			const distanceToLeft = Math.abs(mouseX - relatedLeft);
			const distanceToRight = Math.abs(mouseX - relatedRight);
			const distanceToTop = Math.abs(mouseY - relatedTop);
			const distanceToBottom = Math.abs(mouseY - relatedBottom);
			
			const edgeThreshold = 5;
			
			// 如果不是弹窗模式，处理高亮
			if (!isModal) {
				if (currentHighlightedElement && currentHighlightedElement !== related) {
					currentHighlightedElement.classList.remove('merge-highlight');
					currentHighlightedElement = null;
				}
			}
			
			if (isTargetOnLeft) {
				if (isMouseInLeftZone) {
					// 拖到左边缘：避让（交换）
					if (!isModal) {
						mergeMode = false;
						related.classList.remove('merge-highlight');
						currentHighlightedElement = null;
					}
					return -1;
				} else {
					// 拖到右边缘和中间
					if (isModal) {
						// 弹窗模式：只检查边缘，不合并
						const isNearRightEdge = distanceToRight < edgeThreshold;
						const isNearTopEdge = distanceToTop < edgeThreshold;
						const isNearBottomEdge = distanceToBottom < edgeThreshold;
						
						if (isNearRightEdge || isNearTopEdge || isNearBottomEdge) {
							return false; // 在边缘，不交换
						} else {
							return false; // 不在边缘，也不交换（不合并）
						}
					} else {
						// 外部模式：检查边缘，准备合并
						const isNearRightEdge = distanceToRight < edgeThreshold;
						const isNearTopEdge = distanceToTop < edgeThreshold;
						const isNearBottomEdge = distanceToBottom < edgeThreshold;
						
						if (isNearRightEdge || isNearTopEdge || isNearBottomEdge) {
							mergeMode = false;
							related.classList.remove('merge-highlight');
							currentHighlightedElement = null;
							return false;
						} else {
							mergeMode = true;
							mergePosition = 'after';
							related.classList.add('merge-highlight');
							currentHighlightedElement = related;
							return false;
						}
					}
				}
			} else if (isTargetOnRight) {
				if (isMouseInRightZone) {
					// 拖到右边缘：避让（交换）
					if (!isModal) {
						mergeMode = false;
						related.classList.remove('merge-highlight');
						currentHighlightedElement = null;
					}
					return 1;
				} else {
					// 拖到左边缘和中间
					if (isModal) {
						// 弹窗模式：只检查边缘，不合并
						const isNearLeftEdge = distanceToLeft < edgeThreshold;
						const isNearTopEdge = distanceToTop < edgeThreshold;
						const isNearBottomEdge = distanceToBottom < edgeThreshold;
						
						if (isNearLeftEdge || isNearTopEdge || isNearBottomEdge) {
							return false; // 在边缘，不交换
						} else {
							return false; // 不在边缘，也不交换（不合并）
						}
					} else {
						// 外部模式：检查边缘，准备合并
						const isNearLeftEdge = distanceToLeft < edgeThreshold;
						const isNearTopEdge = distanceToTop < edgeThreshold;
						const isNearBottomEdge = distanceToBottom < edgeThreshold;
						
						if (isNearLeftEdge || isNearTopEdge || isNearBottomEdge) {
							mergeMode = false;
							related.classList.remove('merge-highlight');
							currentHighlightedElement = null;
							return false;
						} else {
							mergeMode = true;
							mergePosition = 'before';
							related.classList.add('merge-highlight');
							currentHighlightedElement = related;
							return false;
						}
					}
				}
			}
			
			if (!isModal) {
				mergeMode = false;
			}
			return true;
		},
		
		onEnd: function(evt) {
			// 如果是弹窗模式，不执行合并逻辑
			if (isModal) {
				return;
			}
			
			if (currentHighlightedElement) {
				currentHighlightedElement.classList.remove('merge-highlight');
			}
			
			if (mergeMode && currentHighlightedElement) {
				const draggedElement = evt.item;
				const targetElement = currentHighlightedElement;
				
				const draggedText = draggedElement.textContent.trim();
				const targetText = targetElement.textContent.trim();
				
				// 合并内容
				if (mergePosition === 'before') {
					targetElement.textContent = draggedText + ' 、' + targetText;
				} else {
					targetElement.textContent = targetText + ' 、' + draggedText;
				}
				
				// 标记为文件夹
				targetElement.classList.add('folder');
				
				// 添加点击事件
				targetElement.onclick = function() {
					openFolderModal(targetElement);
				};
				
				draggedElement.remove();
			}
			
			mergeMode = false;
			mergePosition = null;
			currentHighlightedElement = null;
		}
	});
}

// 网格拖拽示例 - 自定义合并和交换逻辑
const sortableInstance = createSortableInstance(gridDemo, false);

// 为已存在的文件夹添加点击事件
function initializeFolderClicks() {
	const folders = gridDemo.querySelectorAll('.grid-square.folder');
	folders.forEach(folder => {
		folder.onclick = function() {
			openFolderModal(folder);
		};
	});
}

// 打开文件夹弹窗
function openFolderModal(folderElement) {
	const modal = document.getElementById('folderModal');
	const modalTitle = document.getElementById('modalTitle');
	const modalGrid = document.getElementById('modalGridDemo');
	
	// 设置标题
	const folderName = folderElement.textContent.trim();
	modalTitle.textContent = `文件夹: ${folderName}`;
	
	// 清空弹窗内容
	modalGrid.innerHTML = '';
	
	// 解析文件夹内容（按 、 分割）
	const items = folderName.split('、').map(item => item.trim());
	
	// 创建网格项
	items.forEach(item => {
		const gridSquare = document.createElement('div');
		gridSquare.className = 'grid-square';
		gridSquare.textContent = item;
		modalGrid.appendChild(gridSquare);
	});
	
	// 显示弹窗
	modal.style.display = 'flex';
	
	// 销毁旧的 Sortable 实例
	if (modalSortableInstance) {
		modalSortableInstance.destroy();
	}
	
	// 创建新的 Sortable 实例
	modalSortableInstance = createSortableInstance(modalGrid, true);
	
	// 保存对原始文件夹元素的引用
	modal.dataset.folderElement = Array.from(gridDemo.children).indexOf(folderElement);
}

// 关闭文件夹弹窗
function closeFolderModal() {
	const modal = document.getElementById('folderModal');
	const modalGrid = document.getElementById('modalGridDemo');
	const folderIndex = parseInt(modal.dataset.folderElement);
	
	// 获取弹窗中的所有项
	const items = Array.from(modalGrid.children).map(child => child.textContent.trim());
	
	// 更新原始文件夹元素
	if (!isNaN(folderIndex)) {
		const folderElement = gridDemo.children[folderIndex];
		if (folderElement) {
			folderElement.textContent = items.join(' 、');
			
			// 如果只剩一个项，移除文件夹样式
			if (items.length === 1) {
				folderElement.classList.remove('folder');
				folderElement.onclick = null;
			}
		}
	}
	
	// 隐藏弹窗
	modal.style.display = 'none';
	
	// 销毁 Sortable 实例
	if (modalSortableInstance) {
		modalSortableInstance.destroy();
		modalSortableInstance = null;
	}
}

// 点击弹窗外部关闭
document.getElementById('folderModal').addEventListener('click', function(e) {
	if (e.target === this) {
		closeFolderModal();
	}
});

// ESC 键关闭弹窗
document.addEventListener('keydown', function(e) {
	if (e.key === 'Escape') {
		const modal = document.getElementById('folderModal');
		if (modal.style.display === 'flex') {
			closeFolderModal();
		}
	}
});

// 初始化
initializeFolderClicks();
