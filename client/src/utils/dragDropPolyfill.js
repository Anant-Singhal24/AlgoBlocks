// This is a simple polyfill for older browsers that don't support some
// modern drag and drop features required by react-beautiful-dnd

export const applyDragDropPolyfill = () => {
  // Add CSS rules for drag and drop
  const addDragStyles = () => {
    // Check if styles already exist
    if (document.getElementById("rbd-drag-styles")) return;

    const styleEl = document.createElement("style");
    styleEl.id = "rbd-drag-styles";
    styleEl.innerHTML = `
      .is-dragging [data-rbd-draggable-id] {
        transition: transform 0.2s;
      }
      
      .droppable-area-active {
        background-color: rgba(0, 120, 255, 0.05) !important;
        border-color: rgba(0, 120, 255, 0.2) !important;
      }
      
      [data-rbd-draggable-id].dragging {
        z-index: 9999 !important;
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1) !important;
      }
      
      [data-rbd-droppable-id] {
        transition: background-color 0.2s, border-color 0.2s;
      }
      
      /* Fix issues with drag preview on different browsers */
      [data-rbd-drag-handle-draggable-id] {
        cursor: grab !important;
      }
      
      [data-rbd-drag-handle-draggable-id]:active {
        cursor: grabbing !important;
      }
    `;
    document.head.appendChild(styleEl);
  };

  // Call the function to add styles
  addDragStyles();

  // Check if the browser supports passive events
  let supportsPassive = false;
  try {
    const opts = Object.defineProperty({}, "passive", {
      get: function () {
        supportsPassive = true;
        return true;
      },
    });
    window.addEventListener("testPassive", null, opts);
    window.removeEventListener("testPassive", null, opts);
  } catch (e) {
    // Do nothing
  }

  // Fix issues with touch devices - only add listener once
  if ("ontouchstart" in window) {
    const touchMoveHandler = function (e) {
      // Only check elements that exist in the DOM
      if (!e.target || !document.body.contains(e.target)) return;

      try {
        const targetEl = e.target;

        // Check if the element or its parent has a draggable attribute
        if (
          targetEl.hasAttribute &&
          (targetEl.hasAttribute("data-rbd-draggable-id") ||
            targetEl.hasAttribute("data-rbd-drag-handle-draggable-id") ||
            targetEl.closest("[data-rbd-draggable-id]") ||
            targetEl.closest("[data-rbd-drag-handle-draggable-id]"))
        ) {
          // Only prevent default if we're actually dragging
          if (document.querySelector(".is-dragging")) {
            e.preventDefault();
          }
        }
      } catch (err) {
        // Prevent errors if element is removed during drag
        console.error("Error in touchmove handler:", err);
      }
    };

    // Remove any existing listeners to prevent duplicates
    document.removeEventListener(
      "touchmove",
      touchMoveHandler,
      supportsPassive ? { passive: false } : false
    );

    // Add the event listener
    document.addEventListener(
      "touchmove",
      touchMoveHandler,
      supportsPassive ? { passive: false } : false
    );
  }
};

// Export a function to enhance dragging experience
export const addDragEnhancements = () => {
  // Simplified enhancement that doesn't interfere with React's synthetic events
  // We're only adding basic styles and not manipulating the DOM directly

  const addBasicEnhancements = () => {
    // Add necessary classes to ensure proper styling
    document.body.classList.add("drag-drop-enhanced");
  };

  addBasicEnhancements();
};
