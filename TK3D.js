document.addEventListener('DOMContentLoaded', function() {
  // Kiểm tra phần tử container
  const container = document.getElementById('designer-container');
  if (!container) {
    console.error('Không tìm thấy designer-container!');
    window.showNotification('Lỗi: Không tìm thấy vùng thiết kế!', true);
    return;
  }

  // Kiểm tra thư viện Three.js
  if (!window.THREE) {
    window.showNotification('Lỗi: Thư viện Three.js không được tải!', true);
    return;
  }

  // Khởi tạo biến toàn cục
  let scene, camera, renderer, controls, raycaster, mouse;
  let selectedObject = null;
  let currentMode = 'move'; // 'move', 'rotate', 'scale'
  const objects = [];
  const history = [];
  let historyIndex = -1;
  let isDragging = false;
  let startMousePosition = new THREE.Vector2();
  let startObjectState = { position: null, rotation: null, scale: null };

  // Khởi tạo trình thiết kế
  function initDesigner() {
    showLoadingIndicator();
    
    // Tạo scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf5f5f5);
    
    // Thiết lập camera
    setupCamera();
    
    // Thiết lập renderer
    setupRenderer();
    
    // Thêm ánh sáng
    addLights();
    
    // Thêm sàn và lưới
    addFloorAndGrid();
    
    // Thiết lập controls
    setupControls();
    
    // Thiết lập raycasting
    raycaster = new THREE.Raycaster();
    mouse = new THREE.Vector2();
    
    // Thêm event listeners
    setupEventListeners();
    
    // Bắt đầu animation loop
    hideLoadingIndicator();
    animate();
    
    // Tải thiết kế đã lưu nếu có
    loadInitialDesign();
  }

  function showLoadingIndicator() {
    const spinner = document.createElement('div');
    spinner.textContent = 'Đang tải...';
    spinner.style.cssText = 'position:absolute; top:50%; left:50%; transform:translate(-50%,-50%); color:#1c8e52; font-size:18px; opacity:0; transition:opacity 0.5s;';
    container.appendChild(spinner);
    setTimeout(() => spinner.style.opacity = '1', 10);
    return spinner;
  }

  function hideLoadingIndicator(spinner) {
    setTimeout(() => {
      if (spinner && spinner.parentNode) {
        spinner.style.opacity = '0';
        setTimeout(() => spinner.remove(), 500);
      }
    }, 800);
  }

  function setupCamera() {
    camera = new THREE.PerspectiveCamera(75, container.clientWidth / container.clientHeight, 0.1, 1000);
    camera.position.set(0, 5, 10);
    camera.lookAt(0, 0, 0);
  }

  function setupRenderer() {
    renderer = new THREE.WebGLRenderer({ 
      antialias: true,
      powerPreference: "high-performance"
    });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(renderer.domElement);
  }

  function addLights() {
    // Ambient light
    const ambientLight = new THREE.AmbientLight(0x404040, 1.5);
    scene.add(ambientLight);
    
    // Directional light
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 10, 5);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 1024;
    directionalLight.shadow.mapSize.height = 1024;
    scene.add(directionalLight);
    
    // Hemisphere light
    const hemisphereLight = new THREE.HemisphereLight(0xffffbb, 0x080820, 0.5);
    scene.add(hemisphereLight);
  }

  function addFloorAndGrid() {
    // Sàn
    const floorGeometry = new THREE.PlaneGeometry(20, 20);
    const floorMaterial = new THREE.MeshStandardMaterial({ 
      color: 0xcccccc, 
      side: THREE.DoubleSide,
      roughness: 0.8,
      metalness: 0.2
    });
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = Math.PI / 2;
    floor.receiveShadow = true;
    floor.name = 'floor';
    scene.add(floor);
    
    // Lưới
    const grid = new THREE.GridHelper(20, 20, 0x888888, 0xcccccc);
    scene.add(grid);
  }

  function setupControls() {
    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.screenSpacePanning = false;
    controls.minDistance = 2;
    controls.maxDistance = 20;
    controls.maxPolarAngle = Math.PI / 2;
  }

  function setupEventListeners() {
    // Mouse events
    container.addEventListener('mousedown', onMouseDown);
    container.addEventListener('mousemove', onMouseMove);
    container.addEventListener('mouseup', onMouseUp);
    container.addEventListener('dblclick', onDoubleClick);
    
    // Touch events
    container.addEventListener('touchstart', onTouchStart, { passive: false });
    container.addEventListener('touchmove', onTouchMove, { passive: false });
    container.addEventListener('touchend', onTouchEnd);
    
    // Window events
    window.addEventListener('resize', onWindowResize);
    window.addEventListener('keydown', onKeyDown);
    
    // Button events
    document.getElementById('moveBtn')?.addEventListener('click', () => setMode('move'));
    document.getElementById('rotateBtn')?.addEventListener('click', () => setMode('rotate'));
    document.getElementById('scaleBtn')?.addEventListener('click', () => setMode('scale'));
    document.getElementById('deleteBtn')?.addEventListener('click', deleteSelectedObject);
    document.getElementById('helpBtn')?.addEventListener('click', toggleHelpModal);
    document.getElementById('saveBtn')?.addEventListener('click', saveDesign);
    document.getElementById('loadBtn')?.addEventListener('click', loadDesign);
    document.getElementById('exportBtn')?.addEventListener('click', exportImage);
    document.getElementById('resetBtn')?.addEventListener('click', resetDesign);
  }

  function animate() {
    requestAnimationFrame(animate);
    if (renderer.domElement.isConnected) {
      controls.update();
      renderer.render(scene, camera);
      updateStatusBar();
    }
  }

  function onWindowResize() {
    camera.aspect = container.clientWidth / container.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(container.clientWidth, container.clientHeight);
  }

  // ========== OBJECT INTERACTION FUNCTIONS ==========

  function onMouseDown(event) {
    event.preventDefault();
    calculateMousePosition(event);
    
    // Kiểm tra va chạm
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(objects);
    
    if (intersects.length > 0) {
      selectedObject = intersects[0].object;
      controls.enabled = false;
      isDragging = true;
      
      // Lưu trạng thái ban đầu cho undo/redo
      startMousePosition.copy(mouse);
      saveObjectStartState();
      saveHistoryState();
      
      // Highlight đối tượng được chọn
      highlightSelectedObject(true);
    } else {
      selectedObject = null;
      controls.enabled = true;
    }
  }

  function onMouseMove(event) {
    if (!isDragging || !selectedObject) return;
    event.preventDefault();
    
    calculateMousePosition(event);
    
    if (currentMode === 'move') {
      moveSelectedObject();
    } else if (currentMode === 'rotate') {
      rotateSelectedObject();
    } else if (currentMode === 'scale') {
      scaleSelectedObject();
    }
  }

  function onMouseUp() {
    if (isDragging && selectedObject) {
      // Lưu trạng thái cuối cùng vào history
      saveHistoryState();
    }
    
    isDragging = false;
    selectedObject = null;
    controls.enabled = true;
  }

  function onDoubleClick(event) {
    calculateMousePosition(event);
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObject(scene.getObjectByName('floor'));
    
    if (intersects.length > 0) {
      // Thêm đối tượng mới tại vị trí click
      const type = prompt("Nhập loại đối tượng (sofa/table/lamp):", "sofa");
      if (type && ['sofa', 'table', 'lamp'].includes(type)) {
        const id = Date.now();
        const name = prompt("Nhập tên đối tượng:", `${type}_${id}`);
        if (name) {
          window.addObject(type, id, name, null);
          const newObj = objects[objects.length - 1];
          newObj.position.copy(intersects[0].point);
          newObj.position.y = 0.5;
          saveHistoryState();
        }
      }
    }
  }

  // ========== TOUCH EVENT HANDLERS ==========

  function onTouchStart(event) {
    if (event.touches.length === 1) {
      const touch = event.touches[0];
      const mouseEvent = new MouseEvent('mousedown', {
        clientX: touch.clientX,
        clientY: touch.clientY
      });
      onMouseDown(mouseEvent);
      event.preventDefault();
    }
  }

  function onTouchMove(event) {
    if (event.touches.length === 1) {
      const touch = event.touches[0];
      const mouseEvent = new MouseEvent('mousemove', {
        clientX: touch.clientX,
        clientY: touch.clientY
      });
      onMouseMove(mouseEvent);
      event.preventDefault();
    }
  }

  function onTouchEnd(event) {
    if (event.touches.length === 0) {
      onMouseUp();
    }
  }

  // ========== KEYBOARD SHORTCUTS ==========

  function onKeyDown(event) {
    if (event.target.tagName === 'INPUT') return; // Bỏ qua nếu đang nhập liệu
    
    switch (event.key.toLowerCase()) {
      case 'm':
        setMode('move');
        break;
      case 'r':
        case 'x': // Phím tắt thay thế cho xoay
        case 'y':
        case 'z':
          setMode('rotate');
          break;
      case 's':
        setMode('scale');
        break;
      case 'delete':
      case 'backspace':
        deleteSelectedObject();
        break;
      case 'h':
        case '?':
          toggleHelpModal();
          break;
      case 'z':
        if (event.ctrlKey || event.metaKey) {
          event.shiftKey ? redo() : undo();
        }
        break;
      case 'y':
        if (event.ctrlKey || event.metaKey) {
          redo();
        }
        break;
    }
  }

  // ========== OBJECT MANIPULATION FUNCTIONS ==========

  function moveSelectedObject() {
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObject(scene.getObjectByName('floor'));
    
    if (intersects.length > 0) {
      selectedObject.position.copy(intersects[0].point);
      selectedObject.position.y = 0.5;
    }
  }

  function rotateSelectedObject() {
    const deltaX = mouse.x - startMousePosition.x;
    selectedObject.rotation.y = startObjectState.rotation.y + deltaX * Math.PI;
  }

  function scaleSelectedObject() {
    const deltaY = mouse.y - startMousePosition.y;
    const scaleFactor = 1 + deltaY * 2;
    selectedObject.scale.set(
      startObjectState.scale.x * scaleFactor,
      startObjectState.scale.y * scaleFactor,
      startObjectState.scale.z * scaleFactor
    );
  }

  function highlightSelectedObject(highlight) {
    if (!selectedObject) return;
    
    if (highlight) {
      selectedObject.material.emissive = new THREE.Color(0x1c8e52);
      selectedObject.material.emissiveIntensity = 0.5;
      selectedObject.material.needsUpdate = true;
    } else {
      selectedObject.material.emissive = new THREE.Color(0x000000);
      selectedObject.material.emissiveIntensity = 0;
      selectedObject.material.needsUpdate = true;
    }
  }

  // ========== MODE MANAGEMENT ==========

  function setMode(mode) {
    currentMode = mode;
    
    // Cập nhật UI
    document.querySelectorAll('#floatingToolbar button').forEach(btn => {
      btn.classList.remove('active');
    });
    
    const activeBtn = document.getElementById(`${mode}Btn`);
    if (activeBtn) activeBtn.classList.add('active');
    
    window.showNotification(`Chế độ: ${getModeName(mode)}`, false, 1000);
  }

  function getModeName(mode) {
    const modes = {
      'move': 'Di chuyển',
      'rotate': 'Xoay',
      'scale': 'Thay đổi kích thước'
    };
    return modes[mode] || mode;
  }

  // ========== OBJECT MANAGEMENT FUNCTIONS ==========

  window.addObject = function(type, id, name, image) {
    if (!['sofa', 'table', 'lamp', 'chair', 'cabinet'].includes(type)) {
      window.showNotification('Loại đối tượng không hợp lệ!', true, 2000);
      return null;
    }

    let geometry, material, mesh;
    const textureLoader = new THREE.TextureLoader();
    
    try {
      const texture = image ? textureLoader.load(image) : null;
      
      switch (type) {
        case 'sofa':
          geometry = new THREE.BoxGeometry(2, 1, 1);
          material = new THREE.MeshStandardMaterial({ 
            color: 0x8e8e93,
            roughness: 0.7,
            metalness: 0.1
          });
          if (texture) material.map = texture;
          break;
          
        case 'table':
          geometry = new THREE.BoxGeometry(1.5, 0.2, 1.5);
          material = new THREE.MeshStandardMaterial({ 
            color: 0x5e3b2e,
            roughness: 0.5,
            metalness: 0.3
          });
          if (texture) material.map = texture;
          break;
          
        case 'lamp':
          geometry = new THREE.CylinderGeometry(0.3, 0.3, 1.5, 32);
          material = new THREE.MeshStandardMaterial({ 
            color: 0xcdcdcd,
            roughness: 0.4,
            metalness: 0.7
          });
          if (texture) material.map = texture;
          break;
          
        case 'chair':
          geometry = new THREE.BoxGeometry(0.8, 1, 0.8);
          material = new THREE.MeshStandardMaterial({ 
            color: 0x4a6ea9,
            roughness: 0.6,
            metalness: 0.2
          });
          if (texture) material.map = texture;
          break;
          
        case 'cabinet':
          geometry = new THREE.BoxGeometry(1, 2, 0.5);
          material = new THREE.MeshStandardMaterial({ 
            color: 0x5e3b2e,
            roughness: 0.4,
            metalness: 0.1
          });
          if (texture) material.map = texture;
          break;
      }
      
      mesh = new THREE.Mesh(geometry, material);
      mesh.name = `${type}_${id}_${Date.now()}`;
      mesh.userData = { id, name, image, type };
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      mesh.position.set(0, 0.5, 0);
      
      scene.add(mesh);
      objects.push(mesh);
      
      window.showNotification(`Đã thêm ${name} vào thiết kế!`, false, 2000);
      return mesh;
      
    } catch (error) {
      console.error('Lỗi khi tạo đối tượng:', error);
      window.showNotification('Lỗi khi tạo đối tượng!', true, 2000);
      return null;
    }
  };

  window.deleteSelectedObject = function() {
    if (selectedObject) {
      const index = objects.indexOf(selectedObject);
      if (index > -1) {
        scene.remove(selectedObject);
        objects.splice(index, 1);
        saveHistoryState();
        window.showNotification('Đã xóa đối tượng!', false, 2000);
      }
      selectedObject = null;
      controls.enabled = true;
    } else {
      window.showNotification('Vui lòng chọn một đối tượng để xóa!', true, 2000);
    }
  };

  // ========== HISTORY MANAGEMENT ==========

  function saveHistoryState() {
    // Cắt bỏ các state sau current index (khi thực hiện thao tác mới sau undo)
    history.splice(historyIndex + 1);
    
    // Lưu trạng thái hiện tại
    const state = objects.map(obj => ({
      type: obj.userData.type,
      id: obj.userData.id,
      name: obj.userData.name,
      image: obj.userData.image,
      position: obj.position.clone(),
      rotation: obj.rotation.clone(),
      scale: obj.scale.clone()
    }));
    
    history.push(state);
    historyIndex = history.length - 1;
    
    // Giới hạn lịch sử để tránh tốn bộ nhớ
    if (history.length > 50) {
      history.shift();
      historyIndex--;
    }
  }

  function undo() {
    if (historyIndex <= 0) {
      window.showNotification('Không thể hoàn tác thêm!', true, 1500);
      return;
    }
    
    historyIndex--;
    restoreState(history[historyIndex]);
    window.showNotification('Đã hoàn tác', false, 1500);
  }

  function redo() {
    if (historyIndex >= history.length - 1) {
      window.showNotification('Không thể làm lại thêm!', true, 1500);
      return;
    }
    
    historyIndex++;
    restoreState(history[historyIndex]);
    window.showNotification('Đã làm lại', false, 1500);
  }

  function restoreState(state) {
    // Xóa tất cả đối tượng hiện có
    objects.forEach(obj => scene.remove(obj));
    objects.length = 0;
    
    // Tạo lại các đối tượng từ state
    state.forEach(item => {
      const obj = window.addObject(item.type, item.id, item.name, item.image);
      if (obj) {
        obj.position.copy(item.position);
        obj.rotation.copy(item.rotation);
        obj.scale.copy(item.scale);
      }
    });
  }

  // ========== DESIGN MANAGEMENT ==========

  window.saveDesign = function() {
    try {
      if (!window.localStorage) {
        throw new Error('Trình duyệt không hỗ trợ localStorage');
      }
      
      const design = objects.map(obj => ({
        type: obj.userData.type,
        id: obj.userData.id,
        name: obj.userData.name,
        image: obj.userData.image,
        position: obj.position.toArray(),
        rotation: obj.rotation.toArray(),
        scale: obj.scale.toArray()
      }));
      
      localStorage.setItem('userDesign', JSON.stringify(design));
      window.showNotification('Thiết kế đã được lưu!', false, 2000);
      return true;
      
    } catch (error) {
      console.error('Lỗi khi lưu thiết kế:', error);
      window.showNotification('Lỗi khi lưu thiết kế!', true, 2000);
      return false;
    }
  };

  window.loadDesign = function() {
    try {
      if (!window.localStorage) {
        throw new Error('Trình duyệt không hỗ trợ localStorage');
      }
      
      const savedDesign = JSON.parse(localStorage.getItem('userDesign')) || [];
      
      // Xóa các đối tượng hiện có
      objects.forEach(obj => scene.remove(obj));
      objects.length = 0;
      
      // Tạo lại các đối tượng từ thiết kế đã lưu
      savedDesign.forEach(item => {
        window.addObject(item.type, item.id, item.name, item.image);
        const obj = objects[objects.length - 1];
        if (obj) {
          obj.position.fromArray(item.position);
          obj.rotation.fromArray(item.rotation);
          obj.scale.fromArray(item.scale);
        }
      });
      
      window.showNotification('Đã tải thiết kế!', false, 2000);
      saveHistoryState();
      return true;
      
    } catch (error) {
      console.error('Lỗi khi tải thiết kế:', error);
      window.showNotification('Lỗi khi tải thiết kế!', true, 2000);
      return false;
    }
  };

  function loadInitialDesign() {
    try {
      const savedDesign = JSON.parse(localStorage.getItem('userDesign')) || [];
      if (savedDesign.length > 0) {
        loadDesign();
      }
    } catch (error) {
      console.error('Lỗi khi tải thiết kế ban đầu:', error);
    }
  }

  window.resetDesign = function() {
    if (confirm('Bạn có chắc muốn xóa toàn bộ thiết kế?')) {
      objects.forEach(obj => scene.remove(obj));
      objects.length = 0;
      saveHistoryState();
      window.showNotification('Đã xóa toàn bộ thiết kế!', false, 2000);
    }
  };

  // ========== UTILITY FUNCTIONS ==========

  function calculateMousePosition(event) {
    const rect = container.getBoundingClientRect();
    mouse.x = ((event.clientX - rect.left) / container.clientWidth) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / container.clientHeight) * 2 + 1;
  }

  function saveObjectStartState() {
    if (selectedObject) {
      startObjectState = {
        position: selectedObject.position.clone(),
        rotation: selectedObject.rotation.clone(),
        scale: selectedObject.scale.clone()
      };
    }
  }

  function updateStatusBar() {
    const statusBar = document.getElementById('statusBar');
    if (!statusBar) return;
    
    const statusMessage = document.getElementById('statusMessage');
    const objectCount = document.getElementById('objectCount');
    const coordinates = document.getElementById('coordinates');
    
    if (statusMessage) {
      statusMessage.textContent = selectedObject ? 
        `Đang chọn: ${selectedObject.userData.name}` : 
        'Sẵn sàng';
    }
    
    if (objectCount) {
      objectCount.textContent = `${objects.length} đối tượng`;
    }
    
    if (coordinates && selectedObject) {
      const pos = selectedObject.position;
      coordinates.textContent = `X: ${pos.x.toFixed(1)}, Y: ${pos.y.toFixed(1)}, Z: ${pos.z.toFixed(1)}`;
    } else if (coordinates) {
      coordinates.textContent = '';
    }
  }

  function toggleHelpModal() {
    const modal = document.getElementById('helpModal');
    if (modal) {
      modal.style.display = modal.style.display === 'flex' ? 'none' : 'flex';
    }
  }

  window.exportImage = function() {
    try {
      // Tạm thời vô hiệu hóa controls để chụp ảnh
      controls.enabled = false;
      
      // Render lại scene để đảm bảo mọi thứ được cập nhật
      renderer.render(scene, camera);
      
      // Tạo URL dữ liệu từ canvas
      const dataURL = renderer.domElement.toDataURL('image/png');
      
      // Tạo link tải xuống
      const link = document.createElement('a');
      link.href = dataURL;
      link.download = `litrada-design-${new Date().toISOString().slice(0,10)}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      window.showNotification('Đã xuất ảnh thiết kế!', false, 2000);
      controls.enabled = true;
      return true;
      
    } catch (error) {
      console.error('Lỗi khi xuất ảnh:', error);
      window.showNotification('Lỗi khi xuất ảnh!', true, 2000);
      controls.enabled = true;
      return false;
    }
  };

  // Khởi chạy trình thiết kế
  initDesigner();
});