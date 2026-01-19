"use client";
import React, { createContext, useContext, useState, useRef } from 'react';

const KeyboardContext = createContext();

export function KeyboardProvider({ children }) {
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [inputName, setInputName] = useState("default");
  const [keyboardLayout, setKeyboardLayout] = useState("default"); // New state for layout
  const keyboardRef = useRef(null);
  const activeInputRef = useRef(null); // Store reference to the actual DOM element

  const [isKeyboardEnabled, setIsKeyboardEnabled] = useState(false);

  const toggleKeyboardEnabled = () => {
    setIsKeyboardEnabled(prev => !prev);
    if (isKeyboardEnabled) { // if currently enabled, we are disabling, so close it
        closeKeyboard();
    }
  };

  const openKeyboard = (inputElement) => {
    if (!isKeyboardEnabled) return; // Prevent opening if disabled

    activeInputRef.current = inputElement;
    setInputValue(inputElement.value);
    setInputName(inputElement.name || "default");
    
    if (keyboardRef.current) {
      keyboardRef.current.setInput(inputElement.value);
    }
    
    // Determine layout based on input type
    const type = inputElement.type;
    const dataKeyboard = inputElement.getAttribute('data-keyboard');
    
    if (type === 'number' || type === 'tel' || dataKeyboard === 'numeric') {
        setKeyboardLayout("numeric");
    } else {
        setKeyboardLayout("default");
    }
    
    setIsKeyboardOpen(true);
  };

  const closeKeyboard = () => {
    setIsKeyboardOpen(false);
    activeInputRef.current = null;
  };

  const onKeyPress = (button) => {
    if (button === "{shift}" || button === "{lock}") {
        // Handle shift logic in component if needed, or simple toggle
    } else if (button === "{enter}") {
        closeKeyboard();
    }
  };

  const onChange = (input) => {
    setInputValue(input);
    if (activeInputRef.current) {
      const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;
      const nativeTextAreaValueSetter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, "value").set;
      
      const isTextArea = activeInputRef.current.tagName === 'TEXTAREA';
      const setter = isTextArea ? nativeTextAreaValueSetter : nativeInputValueSetter;
      
      if (setter) {
          setter.call(activeInputRef.current, input);
      } else {
          activeInputRef.current.value = input;
      }

      const event = new Event('input', { bubbles: true });
      activeInputRef.current.dispatchEvent(event);
    }
  };

  return (
    <KeyboardContext.Provider value={{ 
      isKeyboardOpen, 
      openKeyboard, 
      closeKeyboard, 
      inputValue, 
      setInputValue, 
      onChange,
      onKeyPress,
      inputName,
      keyboardRef,
      keyboardLayout,
      isKeyboardEnabled,
      toggleKeyboardEnabled
    }}>
      {children}
    </KeyboardContext.Provider>
  );
}

export function useKeyboard() {
  return useContext(KeyboardContext);
}
