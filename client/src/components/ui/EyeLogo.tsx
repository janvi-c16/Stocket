'use client';
import { useEffect, useRef, useState } from 'react';

const EyeLogo = ({ size = 35 }: { size?: number }) => {
  const eyeContainerRef = useRef<HTMLDivElement>(null);
  const leftEyeRef = useRef<HTMLDivElement>(null);
  const rightEyeRef = useRef<HTMLDivElement>(null);
  const [isBlinking, setIsBlinking] = useState(false);
  const [hasCursor, setHasCursor] = useState(true);
  // track active element if needed in the future

  useEffect(() => {
    // Detect if device has cursor (non-touch device)
    const detectCursor = () => {
      // Check if device supports hover (typical for non-touch devices)
      const hasHover = window.matchMedia('(hover: hover)').matches;
      setHasCursor(hasHover);
    };

    // Run detection on mount
    detectCursor();

    // Listen for changes in media query (e.g., if user switches device mode)
    const mediaQuery = window.matchMedia('(hover: hover)');
    const handleMediaQueryChange = (e: MediaQueryListEvent) => {
      setHasCursor(e.matches);
    };

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleMediaQueryChange);
    }

    // Function to move eyes based on a target position
    const moveEyes = (targetX: number, targetY: number) => {
      const moveEye = (eye: HTMLDivElement | null, container: HTMLDivElement | null) => {
        if (!eye || !container) return;
        
        // Get container position relative to viewport
        const containerRect = container.getBoundingClientRect();
        
        // Calculate container center
        const containerCenterX = containerRect.left + containerRect.width / 2;
        const containerCenterY = containerRect.top + containerRect.height / 2;
        
        // Calculate vector from container center to target position
        const dx = targetX - containerCenterX;
        const dy = targetY - containerCenterY;
        
        // Calculate distance from container center to target
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // Maximum pixel movement (proportional to logo size)
        const maxOffset = size * 0.18;
        
        // Calculate movement with smooth damping based on distance
        // The further the cursor, the closer to max offset
        const damping = Math.min(distance / 300, 1);
        const angle = Math.atan2(dy, dx);
        const offset = maxOffset * damping;
        
        const x = Math.cos(angle) * offset;
        const y = Math.sin(angle) * offset;
        
        // Apply the movement
        eye.style.transform = `translate(${x}px, ${y}px)`;
      };

      moveEye(leftEyeRef.current, eyeContainerRef.current);
      moveEye(rightEyeRef.current, eyeContainerRef.current);
    };

    // Track mouse movement
    const handleMouseMove = (e: MouseEvent) => {
      // Only track mouse if no element is actively being edited
      // or if the mouse has moved significantly
      moveEyes(e.clientX, e.clientY);
    };

    // Track keyboard events and text inputs
    const handleKeyUp = () => {
      const target = document.activeElement as Element | null;
      
      if (target && (
          target.tagName === 'INPUT' || 
          target.tagName === 'TEXTAREA' || 
          (target as HTMLElement).contentEditable === 'true'
      )) {
        // Get caret position for the active text element
        let caretX = 0;
        let caretY = 0;
        
        // For contentEditable elements
        if ((target as HTMLElement).contentEditable === 'true') {
          const selection = window.getSelection();
          if (selection && selection.rangeCount > 0) {
            const range = selection.getRangeAt(0);
            const rect = range.getBoundingClientRect();
            caretX = rect.left;
            caretY = rect.top;
          }
        } 
        // For input and textarea elements
        else if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
          const inputElement = target as HTMLInputElement | HTMLTextAreaElement;
          const rect = inputElement.getBoundingClientRect();
          
          // Create a temporary element to measure text width
          const temp = document.createElement('div');
          temp.style.position = 'absolute';
          temp.style.visibility = 'hidden';
          temp.style.whiteSpace = 'pre';
          temp.style.font = window.getComputedStyle(inputElement).font;
          
          // For input elements, estimate caret position based on text content
          // This is an approximation as exact caret position is hard to get
          const textBeforeCaret = inputElement.value.substring(0, inputElement.selectionStart || 0);
          temp.textContent = textBeforeCaret;
          document.body.appendChild(temp);
          
          caretX = rect.left + temp.clientWidth;
          caretY = rect.top + rect.height / 2;
          
          document.body.removeChild(temp);
        }
        
        // Move eyes to the caret position
        moveEyes(caretX, caretY);
      }
    };

    // Reset eyes when no input is active
    const handleBlur = () => {
      // no-op after removing active element state
    };

    // Track focus changes to detect when inputs are activated
    const handleFocus = (e: FocusEvent) => {
      const target = e.target as Element;
      
      // Get position of the focused element
      if (target) {
        const rect = target.getBoundingClientRect();
        moveEyes(rect.left + rect.width / 2, rect.top + rect.height / 2);
      }
    };

    // Reset eye position for touch devices
    const resetEyePosition = () => {
      if (leftEyeRef.current) leftEyeRef.current.style.transform = 'translate(0px, 0px)';
      if (rightEyeRef.current) rightEyeRef.current.style.transform = 'translate(0px, 0px)';
    };

    // If touch device, reset eyes to center
    if (!hasCursor) {
      resetEyePosition();
    }

    // Track click positions to update eye position immediately
    const handleClick = (ev: MouseEvent) => {
      moveEyes(ev.clientX, ev.clientY);
    };

    // Add event listeners
    if (hasCursor) {
      window.addEventListener('mousemove', handleMouseMove);
    }
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('click', handleClick);
    document.addEventListener('focus', handleFocus, true);
    document.addEventListener('blur', handleBlur, true);
    
    // Random blinking intervals for more natural effect
    const getRandomBlinkInterval = () => Math.random() * 2000 + 2000; // Between 2-4 seconds
    
    let blinkTimeout: NodeJS.Timeout;
    const scheduleNextBlink = () => {
      blinkTimeout = setTimeout(() => {
        setIsBlinking(true);
        setTimeout(() => {
          setIsBlinking(false);
          scheduleNextBlink();
        }, 150);
      }, getRandomBlinkInterval());
    };
    
    scheduleNextBlink();

    return () => {
      // Clean up event listeners
      if (hasCursor) {
        window.removeEventListener('mousemove', handleMouseMove);
      }
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('click', handleClick);
      document.removeEventListener('focus', handleFocus, true);
      document.removeEventListener('blur', handleBlur, true);
      
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', handleMediaQueryChange);
      }
      clearTimeout(blinkTimeout);
    };
  }, [size, hasCursor]);

  // Calculate eye size proportional to the logo size
  const eyeWidth = Math.max(1, size * 0.08);
  const eyeHeight = isBlinking ? Math.max(1, size * 0.04) : Math.max(1, size * 0.15);

  return (
    <div 
      ref={eyeContainerRef}
      className="flex items-center justify-center bg-lime-500 rounded-full relative"
      style={{ width: `${size}px`, height: `${size}px` }}
    >
      {/* Left Eye */}
      <div className="absolute" style={{ 
        top: '45%', 
        left: '35%', 
        transform: 'translate(-50%, -50%)'
      }}>
        <div
          className="bg-black rounded-full transition-transform duration-75"
          ref={leftEyeRef}
          style={{ 
            width: `${eyeWidth}px`, 
            height: `${eyeHeight}px`,
            transition: isBlinking ? 'height 0.1s ease-out' : 'height 0.2s ease-in'
          }}
        />
      </div>
      
      {/* Right Eye */}
      <div className="absolute" style={{ 
        top: '45%', 
        right: '35%', 
        transform: 'translate(50%, -50%)'
      }}>
        <div
          className="bg-black rounded-full transition-transform duration-75"
          ref={rightEyeRef}
          style={{ 
            width: `${eyeWidth}px`, 
            height: `${eyeHeight}px`,
            transition: isBlinking ? 'height 0.1s ease-out' : 'height 0.2s ease-in'
          }}
        />
      </div>
    </div>
  );
};

export default EyeLogo;