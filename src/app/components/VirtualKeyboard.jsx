"use client";
import React, { useEffect } from 'react';
import Keyboard from 'react-simple-keyboard';
import 'react-simple-keyboard/build/css/index.css';
import { useKeyboard } from '../context/KeyboardContext';

const VirtualKeyboard = () => {
  const { isKeyboardOpen, openKeyboard, closeKeyboard, inputValue, onChange, onKeyPress, keyboardRef, keyboardLayout } = useKeyboard();

  useEffect(() => {
    const handleFocus = (e) => {
      const target = e.target;
      // Check if target is an input or textarea
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        // Ignore hidden, disabled, readonly, and checkbox/radio/submit/button types
        const ignoredTypes = ['hidden', 'checkbox', 'radio', 'submit', 'button', 'file', 'image', 'reset'];
        if (!ignoredTypes.includes(target.type) && !target.disabled && !target.readOnly) {
           console.log("Opening keyboard for", target);
           openKeyboard(target);
        }
      }
    };

    // Use focusin event which bubbles, allowing us to catch focus on inputs anywhere
    document.addEventListener('focusin', handleFocus);
    
    // Optional: Close keyboard when clicking outside inputs? 
    // For now, let's rely on the close button or manual close to avoid fighting with focus.
    
    return () => {
      document.removeEventListener('focusin', handleFocus);
    };
  }, [openKeyboard]);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (isKeyboardOpen) {
        // Check if click is inside the keyboard container
        const keyboardContainer = document.getElementById('virtual-keyboard-container');
        if (keyboardContainer && !keyboardContainer.contains(e.target)) {
            // Check if click is on an input (handled by focusin)
            if (e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
                closeKeyboard();
            }
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isKeyboardOpen, closeKeyboard]);

  // Klavye açıldığında input'u görünür yap
  useEffect(() => {
    const KEYBOARD_HEIGHT = 320; // Klavye yüksekliği (px)
    let paddedContainer = null;
    
    // Scroll edilebilir parent'ı bul
    const findScrollContainer = (element) => {
      let parent = element.parentElement;
      while (parent && parent !== document.body) {
        const style = window.getComputedStyle(parent);
        const overflowY = style.overflowY;
        const isScrollable = overflowY === 'auto' || overflowY === 'scroll';
        if (isScrollable) {
          return parent;
        }
        parent = parent.parentElement;
      }
      return document.body;
    };
    
    if (isKeyboardOpen) {
      // Klavyenin açılmasını bekle
      setTimeout(() => {
        const activeEl = document.activeElement;
        if (activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA')) {
          // Scroll container'ı bul
          const scrollContainer = findScrollContainer(activeEl);
          paddedContainer = scrollContainer;
          
          // Container'a klavye yüksekliği kadar padding ekle
          const currentPadding = parseInt(window.getComputedStyle(scrollContainer).paddingBottom) || 0;
          scrollContainer.style.paddingBottom = `${currentPadding + KEYBOARD_HEIGHT}px`;
          scrollContainer.dataset.keyboardPadded = 'true';
          scrollContainer.dataset.originalPadding = currentPadding.toString();
          
          // Padding eklendikten ve klavye açıldıktan sonra scroll yap
          setTimeout(() => {
            activeEl.scrollIntoView({ 
              behavior: 'smooth', 
              block: 'center'
            });
          }, 150); // Klavye animasyonu + padding için bekle
        }
      }, 100);
    } else {
      // Klavye kapandığında padding'i kaldır
      document.querySelectorAll('[data-keyboard-padded="true"]').forEach(container => {
        const originalPadding = container.dataset.originalPadding || '0';
        container.style.paddingBottom = `${originalPadding}px`;
        container.removeAttribute('data-keyboard-padded');
        container.removeAttribute('data-original-padding');
      });
    }
    
    return () => {
      // Cleanup
      document.querySelectorAll('[data-keyboard-padded="true"]').forEach(container => {
        const originalPadding = container.dataset.originalPadding || '0';
        container.style.paddingBottom = `${originalPadding}px`;
        container.removeAttribute('data-keyboard-padded');
        container.removeAttribute('data-original-padding');
      });
    };
  }, [isKeyboardOpen]);

  // Always render to allow animation, control visibility via CSS
  return (
    <div 
        id="virtual-keyboard-container"
        className={`fixed bottom-4 left-1/2 -translate-x-1/2 w-3/4 max-w-4xl z-[9999] transition-all duration-300 ease-in-out transform ${isKeyboardOpen ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0 pointer-events-none'}`}
    >
      <div className="bg-white/95 backdrop-blur-md shadow-2xl border border-gray-200 rounded-2xl p-3 pb-4">
          <div className="flex justify-between items-center mb-2 px-2">
            <div className="text-xs text-gray-400 font-medium uppercase tracking-wider">Virtual Keyboard</div>
            <button 
                onClick={closeKeyboard}
                className="bg-gray-100 hover:bg-gray-200 text-gray-600 px-3 py-1 rounded-full text-xs font-bold transition-colors"
            >
                Hide
            </button>
          </div>
          <Keyboard
            keyboardRef={r => (keyboardRef.current = r)}
            stateToIgnore={inputValue}
            onChange={onChange}
            onKeyPress={onKeyPress}
            inputName={"default"}
            layoutName={keyboardLayout === "numeric" ? "numeric" : "default"}
            layout={{
                default: [
                  "` 1 2 3 4 5 6 7 8 9 0 - = {bksp}",
                  "{tab} q w e r t y u i o p [ ] \\",
                  "{lock} a s d f g h j k l ; ' {enter}",
                  "{shift} z x c v b n m , . / {shift}",
                  ".com @ {space}"
                ],
                shift: [
                  "~ ! @ # $ % ^ & * ( ) _ + {bksp}",
                  "{tab} Q W E R T Y U I O P { } |",
                  "{lock} A S D F G H J K L : \" {enter}",
                  "{shift} Z X C V B N M < > ? {shift}",
                  ".com @ {space}"
                ],
                numeric: [
                  "1 2 3",
                  "4 5 6",
                  "7 8 9",
                  "0 {bksp} {enter}"
                ]
              }}
            display={{
                "{bksp}": "⌫",
                "{enter}": "↵ Enter",
                "{shift}": "⇧ Shift",
                "{tab}": "Tab",
                "{lock}": "Caps",
                "{space}": " ",
            }}
            theme={"hg-theme-default hg-layout-default myTheme"}
            buttonTheme={[
                {
                  class: "hg-red",
                  buttons: "{bksp}"
                }
            ]}
          />
          <style jsx global>{`
            .hg-theme-default {
                background-color: transparent !important;
            }
            .hg-button {
                border-radius: 8px !important;
                border-bottom: 2px solid #e5e7eb !important;
                font-weight: 500 !important;
                color: #374151 !important;
            }
            .hg-button:active {
                transform: translateY(1px);
                border-bottom: 1px solid #e5e7eb !important;
            }
            .hg-red {
                background: #fee2e2 !important;
                color: #ef4444 !important;
            }
          `}</style>
      </div>
    </div>
  );
};

export default VirtualKeyboard;
