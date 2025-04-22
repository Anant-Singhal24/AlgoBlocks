import React, { useEffect } from "react";
import { DragDropContext as BeautifulDnDContext } from "react-beautiful-dnd";

// This wraps the react-beautiful-dnd DragDropContext with fixes for issues
const DragDropContext = ({ children, onDragEnd, ...restProps }) => {
  // Fix for React 18 StrictMode issue with react-beautiful-dnd
  useEffect(() => {
    // Hack to fix issues when DnD fails in React 18 strict mode
    // See: https://github.com/atlassian/react-beautiful-dnd/issues/2399
    const handleError = (e) => {
      if (
        e.message === "ResizeObserver loop limit exceeded" ||
        e.message.includes("ResizeObserver")
      ) {
        const resizeObserverErr = e;
        resizeObserverErr.stopImmediatePropagation();
      }
    };

    window.addEventListener("error", handleError);

    return () => {
      window.removeEventListener("error", handleError);
    };
  }, []);

  // Use object destructuring for props instead of defaultProps
  return (
    <BeautifulDnDContext onDragEnd={onDragEnd} {...restProps}>
      {children}
    </BeautifulDnDContext>
  );
};

export default DragDropContext;
