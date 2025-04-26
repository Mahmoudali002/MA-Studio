document.addEventListener('DOMContentLoaded', function () {
  // Main video transformation logic
  const mainVideoContainer = document.getElementById('mainVideoContainer');
  const overlayText = document.getElementById('overlayText');
  const centerSlot = document.getElementById('centerSlot');
  const scrollIndicator = document.querySelector('.scroll-indicator');
  const gridContainer = document.querySelector('.grid-container');
  const firstVideoSlot = gridContainer.querySelector('.video-slot:first-child');

  // Detect if mobile
  const isMobile = window.innerWidth <= 768;

  // Set target slot based on device
  let targetSlot = isMobile ? firstVideoSlot : centerSlot;

  // Handle video swap for mobile
  function handleVideoSwap() {
    const newIsMobile = window.innerWidth <= 768;
    const firstVideo = firstVideoSlot.querySelector('video');

    if (newIsMobile) {
      // On mobile: Move first video to center slot and hide original first video
      if (!firstVideoSlot._swapped) {
        if (firstVideo) {
          // Store original HTML
          firstVideoSlot._originalHTML = firstVideoSlot.innerHTML;
          centerSlot._originalHTML = centerSlot.innerHTML;

          // Clone the video to the center slot
          const videoClone = firstVideo.cloneNode(true);
          centerSlot.innerHTML = ''; // Clear center slot
          centerSlot.appendChild(videoClone);

          // Hide the content of the first slot (without removing it)
          // We'll use opacity to hide it while maintaining the element structure
          const firstSlotVideo = firstVideoSlot.querySelector('video');
          if (firstSlotVideo) {
            firstSlotVideo.style.opacity = '0';
          }

          firstVideoSlot._swapped = true;
        }
      }
    } else if (!newIsMobile && firstVideoSlot._swapped) {
      // Restore original content when returning to desktop
      if (firstVideoSlot._originalHTML) {
        firstVideoSlot.innerHTML = firstVideoSlot._originalHTML;
      }
      if (centerSlot._originalHTML) {
        centerSlot.innerHTML = centerSlot._originalHTML;
      }
      firstVideoSlot._swapped = false;
    }

    // Update target slot after potential swap
    targetSlot = newIsMobile ? firstVideoSlot : centerSlot;
  }

  // Function to calculate the dynamic total scroll distance
  function updateScrollDistance() {
    const targetRect = targetSlot.getBoundingClientRect();
    const targetCenterY = targetRect.top + targetRect.height / 2 + window.scrollY;
    const initialCenterY = window.innerHeight / 2;
    return targetCenterY - initialCenterY;
  }

  // Total scroll distance over which the transformation occurs
  let totalScrollDistance = updateScrollDistance();

  // Initial fullscreen geometry
  let initialWidth = window.innerWidth;
  let initialHeight = window.innerHeight;
  let initialCenter = { x: window.innerWidth / 2, y: window.innerHeight / 2 };

  // Flag to indicate if the video is locked into the grid
  let isLocked = false;

  function updateVideoGeometry() {
    const scrollY = window.scrollY;
    let progress = Math.min(scrollY / totalScrollDistance, 1);

    // Hide scroll indicator when user starts scrolling
    scrollIndicator.style.opacity = scrollY > 0 ? '0' : '1';

    if (progress < 1) {
      // Allow pointer events before locking
      mainVideoContainer.classList.remove('locked');
      mainVideoContainer.querySelector('.overlay').style.pointerEvents = 'auto';
      overlayText.style.pointerEvents = 'auto';

      if (isLocked) {
        mainVideoContainer.style.position = 'fixed';
        isLocked = false;
      }
      // Calculate target grid cell geometry (relative to the viewport)
      const targetRect = targetSlot.getBoundingClientRect();

      // Interpolate width and height
      const currentWidth = initialWidth + progress * (targetRect.width - initialWidth);
      const currentHeight = initialHeight + progress * (targetRect.height - initialHeight);

      // Calculate position to keep video centered
      const currentLeft = (window.innerWidth - currentWidth) / 2;
      const currentTop = (window.innerHeight - currentHeight) / 2;

      mainVideoContainer.style.width = currentWidth + 'px';
      mainVideoContainer.style.height = currentHeight + 'px';
      mainVideoContainer.style.left = currentLeft + 'px';
      mainVideoContainer.style.top = currentTop + 'px';

      // Fade overlay text and black filter out during transformation
      const fadeProgress = Math.pow(progress, 0.1);
      overlayText.style.opacity = 1 - fadeProgress;
      mainVideoContainer.querySelector('.overlay').style.opacity = 1 - progress;

      // Fade in the demo videos heading only after ~40% scroll
      const heading = document.querySelector('.demo-videos-heading');
      const headingProgress = Math.max(0, (progress - 0.4) / 0.6);
      heading.style.opacity = headingProgress;
    } else {
      // Lock the video in the grid cell when transformation is complete
      if (!isLocked) {
        const targetRect = targetSlot.getBoundingClientRect();
        const lockedLeft = targetRect.left + window.scrollX;
        const lockedTop = targetRect.top + window.scrollY;
        const lockedWidth = targetRect.width;
        const lockedHeight = targetRect.height;

        mainVideoContainer.style.position = 'absolute';
        mainVideoContainer.style.width = lockedWidth + 'px';
        mainVideoContainer.style.height = lockedHeight + 'px';
        mainVideoContainer.style.left = lockedLeft + 'px';
        mainVideoContainer.style.top = lockedTop + 'px';
        overlayText.style.opacity = 0;
        mainVideoContainer.querySelector('.overlay').style.opacity = 0;

        // Disable pointer events when locked
        mainVideoContainer.querySelector('.overlay').style.pointerEvents = 'none';
        overlayText.style.pointerEvents = 'none';
        mainVideoContainer.classList.add('locked');

        isLocked = true;
      }
    }
  }

  // Update the target slot and scroll distance on window resize
  window.addEventListener('resize', () => {
    handleVideoSwap();

    initialWidth = window.innerWidth;
    initialHeight = window.innerHeight;
    initialCenter = { x: window.innerWidth / 2, y: window.innerHeight / 2 };

    // Recalculate totalScrollDistance since element positions might have changed
    totalScrollDistance = updateScrollDistance();

    // If already locked, we need to reposition based on the new target slot
    if (isLocked) {
      const targetRect = targetSlot.getBoundingClientRect();
      const lockedLeft = targetRect.left + window.scrollX;
      const lockedTop = targetRect.top + window.scrollY;
      const lockedWidth = targetRect.width;
      const lockedHeight = targetRect.height;

      mainVideoContainer.style.width = lockedWidth + 'px';
      mainVideoContainer.style.height = lockedHeight + 'px';
      mainVideoContainer.style.left = lockedLeft + 'px';
      mainVideoContainer.style.top = lockedTop + 'px';
    } else {
      updateVideoGeometry();
    }
  });

  window.addEventListener('scroll', updateVideoGeometry);

  // Initialize video swap
  handleVideoSwap();

  // Initial setup
  updateVideoGeometry();

  // Modal functionality
  const videoModal = document.getElementById('videoModal');
  // Changed from const to let so we can reassign if needed
  let modalVideo = videoModal.querySelector('.modal-video');
  // Backup for restoring modalVideo if removed
  const modalVideoBackup = modalVideo.cloneNode(true);
  const modalImage = videoModal.querySelector('.modal-image');
  const modalClose = document.querySelector('.close-button');

  // Tab elements
  const tabs = document.querySelectorAll('.tab');
  const tabPanes = document.querySelectorAll('.tab-pane');

  // Function to switch tabs
  function switchTab(e) {
    const targetSelector = e.currentTarget.getAttribute('data-tab-target');

    // Remove 'active' class from all tabs and panes
    tabs.forEach(tab => tab.classList.remove('active'));
    tabPanes.forEach(pane => pane.classList.remove('active'));

    // Activate the clicked tab and its corresponding pane
    e.currentTarget.classList.add('active');
    const targetPane = document.querySelector(targetSelector);
    if (targetPane) targetPane.classList.add('active');
  }

  // Attach event listeners to each tab
  tabs.forEach(tab => {
    tab.addEventListener('click', switchTab);
  });

  // Modified click handler to support both video and img tags for popup
  document.addEventListener('click', function (e) {
    let media = e.target.closest('video') || e.target.closest('img');
    if (!media) {
      const slot = e.target.closest('.video-slot');
      if (slot) {
        media = slot.querySelector('video') || slot.querySelector('img');
      }
    }
    if (media && !media.classList.contains('modal-video')) {
      e.preventDefault();
      videoModal.style.display = 'flex';
      if (media.tagName.toLowerCase() === 'video') {
        // Video popup logic (unchanged)
        if (!videoModal.querySelector('.modal-video')) {
          const modalContent = videoModal.querySelector('.modal-content');
          modalVideo = modalVideoBackup.cloneNode(true);
          modalContent.insertBefore(modalVideo, modalImage);
        }
        modalVideo.src = media.src;
        modalVideo.style.display = 'block';
        modalImage.style.display = 'none';
        modalVideo.removeAttribute("controls");
        modalVideo.play();
      } else if (media.tagName.toLowerCase() === 'img') {
        // Image popup logic: show the image and hide the video element.
        modalImage.src = media.src;
        modalImage.style.display = 'block';
        modalVideo.style.display = 'none';
        modalVideo.src = ''; // Clear video source
      }
      // Set modal prompt texts
      const promptText = media.getAttribute('data-prompt') || "";
      const promptSummary = media.getAttribute('data-prompt-summary') || promptText;
      document.getElementById('modalPrompt').textContent = promptSummary;
      document.getElementById('modalPrompt2').textContent = promptText;
      
      // Ensure the "Story Summary" and "Full Prompt" tabs are reset
      tabs.forEach(tab => tab.classList.remove('active'));
      tabPanes.forEach(pane => pane.classList.remove('active'));
      tabs[0].classList.add('active');
      tabPanes[0].classList.add('active');
    }
  });

  // Close modal
  modalClose.addEventListener('click', function (e) {
    e.stopPropagation();
    videoModal.style.display = 'none';
    modalVideo.pause();
    modalVideo.style.display = 'none';
    modalImage.style.display = 'none';
  });

  // Close modal when clicking outside content
  videoModal.addEventListener('click', function (e) {
    if (e.target === videoModal) {
      videoModal.style.display = 'none';
      modalVideo.pause();
      modalVideo.style.display = 'none';
      modalImage.style.display = 'none';
    }
  });
});
