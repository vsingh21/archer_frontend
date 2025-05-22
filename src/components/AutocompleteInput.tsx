import React, { useState, useRef, useEffect, useCallback } from 'react';
import { PersonSuggestion } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const DEBOUNCE_DELAY = 250;

interface AutocompleteInputProps {
  id: string;
  placeholder: string;
  initialValue?: string;
  onValueChange: (value: string) => void;
  onValueConfirm: (value: string) => void;
  onFocusNext?: () => void;
  onSubmitSearch?: () => void;
  inputRef?: React.RefObject<HTMLInputElement>;
}

const AutocompleteInput = React.forwardRef<HTMLInputElement, AutocompleteInputProps>(
  ({ id, placeholder, initialValue = '', onValueChange, onValueConfirm, onFocusNext, onSubmitSearch, inputRef: forwardedRef }, ref) => {
    const [inputValue, setInputValue] = useState<string>(initialValue);
    const [suggestions, setSuggestions] = useState<PersonSuggestion[]>([]);
    const [showSuggestions, setShowSuggestions] = useState<boolean>(false);
    const [highlightedIndex, setHighlightedIndex] = useState<number>(-1);
    const [userTypedValue, setUserTypedValue] = useState<string>(initialValue);
    const [isLoading, setIsLoading] = useState<boolean>(false);

    const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const suggestionsRef = useRef<HTMLUListElement>(null);
    const abortControllerRef = useRef<AbortController | null>(null);

    const internalInputRef = useRef<HTMLInputElement>(null);
    const inputRef = forwardedRef || internalInputRef;

    const isAutofilling = useRef(false);
    const lastSearchQuery = useRef<string>('');

    const fetchSuggestions = useCallback(async (query: string) => {
      const trimmedQuery = query.trim();
      setHighlightedIndex(-1);
      
      if (!trimmedQuery || trimmedQuery === lastSearchQuery.current) {
        setSuggestions([]);
        setShowSuggestions(false);
        setIsLoading(false);
        return;
      }
      
      setIsLoading(true);
      lastSearchQuery.current = trimmedQuery;
      setShowSuggestions(true);
      
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      
      abortControllerRef.current = new AbortController();
      
      try {
        const response = await fetch(
          `${API_BASE_URL}/api/autocomplete?person=${encodeURIComponent(trimmedQuery)}`,
          { signal: abortControllerRef.current.signal }
        );
        
        if (!response.ok) throw new Error(`Status: ${response.status}`);
        
        const data = await response.json();
        const validData = Array.isArray(data) ? data : [];
        
        // Check if there's an exact match (case insensitive) and if so, highlight it automatically
        const queryLower = trimmedQuery.toLowerCase();
        const exactMatchIndex = validData.findIndex(
          item => item.toLowerCase() === queryLower
        );
        
        setSuggestions(validData);
        setShowSuggestions(validData.length > 0);
        
        // If we have an exact match, highlight it
        if (exactMatchIndex >= 0) {
          setHighlightedIndex(exactMatchIndex);
          setInputValue(validData[exactMatchIndex]);
        }
      } catch (error) {
        if (!(error instanceof DOMException && error.name === 'AbortError')) {
          console.error("Autocomplete fetch error:", error);
        }
        setSuggestions([]);
        setShowSuggestions(false);
      } finally {
        setIsLoading(false);
      }
    }, []);

    const setAutofilledValue = useCallback((value: string) => {
        isAutofilling.current = true;
        setInputValue(value);
        onValueChange(value);

        requestAnimationFrame(() => {
            isAutofilling.current = false;
        });
    }, [onValueChange]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (isAutofilling.current) {
          return;
      }
      const value = e.target.value;

      setInputValue(value);
      setUserTypedValue(value);
      onValueChange(value);
      setShowSuggestions(true);
      setHighlightedIndex(-1);

      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
      debounceTimeoutRef.current = setTimeout(() => {
        fetchSuggestions(value);
      }, DEBOUNCE_DELAY);
    };

    const handleSelectSuggestion = useCallback((selectedValue: string, isMouseClick = false) => {
        setAutofilledValue(selectedValue);
        setUserTypedValue(selectedValue);
        setShowSuggestions(false);
        setSuggestions([]);
        setHighlightedIndex(-1);
        if (debounceTimeoutRef.current) clearTimeout(debounceTimeoutRef.current);

        onValueConfirm(selectedValue);

        if (onFocusNext) {
            onFocusNext();
        } else if (onSubmitSearch && !isMouseClick) {
            onSubmitSearch();
        }
    }, [setAutofilledValue, onValueConfirm, onFocusNext, onSubmitSearch]);

    const scrollToSuggestion = (index: number) => {
      if (suggestionsRef.current && suggestionsRef.current.children[index]) {
        suggestionsRef.current.children[index].scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
        });
      }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      const hasSuggestions = showSuggestions && suggestions.length > 0;

      switch (e.key) {
        case 'ArrowDown':
        case 'Tab':
          if (hasSuggestions) {
            e.preventDefault();
            const nextIndex = (highlightedIndex + 1) % suggestions.length;
            setHighlightedIndex(nextIndex);
            setAutofilledValue(suggestions[nextIndex]);
            scrollToSuggestion(nextIndex);
          } else if (e.key === 'Tab' && onFocusNext) {
          } else if (e.key === 'Tab' && !onFocusNext && onSubmitSearch) {
          }
          break;

        case 'ArrowUp':
          if (hasSuggestions) {
            e.preventDefault();
            const nextIndex = highlightedIndex <= 0
              ? suggestions.length - 1
              : highlightedIndex - 1;
            setHighlightedIndex(nextIndex);
            setAutofilledValue(suggestions[nextIndex]);
            scrollToSuggestion(nextIndex);
          }
          break;

        case 'Enter':
          e.preventDefault();
          if (hasSuggestions && highlightedIndex !== -1) {
            handleSelectSuggestion(suggestions[highlightedIndex], false);
          } else {
            const currentValue = inputValue.trim();
            if (currentValue) {
               const exactMatch = suggestions.find(s => s.toLowerCase() === currentValue.toLowerCase());
               if (exactMatch) {
                  handleSelectSuggestion(exactMatch);
               } else {
                  setUserTypedValue(currentValue);
                  onValueConfirm(currentValue);
                  setShowSuggestions(false);
                  if (onFocusNext) {
                     onFocusNext();
                  } else if (onSubmitSearch) {
                     onSubmitSearch();
                  }
               }
            } else {
                if (onSubmitSearch) onSubmitSearch();
            }
          }
          break;

        case 'Escape':
          if (showSuggestions) {
              e.preventDefault();
              setShowSuggestions(false);
              setHighlightedIndex(-1);
              setAutofilledValue(userTypedValue);
          }
          break;

        default:
          break;
      }
    };

    const handleFocus = () => {
      if (inputValue.trim()) {
        fetchSuggestions(inputValue);
      }

      setShowSuggestions(!!inputValue.trim());
    };

    const handleMouseEnterSuggestion = (index: number) => {
      setHighlightedIndex(index);
    };

    const handleMouseLeaveSuggestions = () => {
      setHighlightedIndex(-1);
    };

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
          if (
            inputRef.current &&
            !inputRef.current.contains(event.target as Node) &&
            suggestionsRef.current &&
            !suggestionsRef.current.contains(event.target as Node)
          ) {
            if (showSuggestions) {
              setShowSuggestions(false);
              setHighlightedIndex(-1);
              setInputValue(prev => prev);
            }
          }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
          document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showSuggestions, inputRef, userTypedValue, setAutofilledValue]);

    useEffect(() => {
      return () => {
        if (debounceTimeoutRef.current) {
          clearTimeout(debounceTimeoutRef.current);
        }
        
        if (abortControllerRef.current) {
          abortControllerRef.current.abort();
        }
      };
    }, []);

    useEffect(() => {
        setInputValue(initialValue);
        setUserTypedValue(initialValue);
    }, [initialValue]);

    return (
      <div className="autocomplete-container">
        <input
          id={id}
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={handleFocus}
          placeholder={placeholder}
          className="search-input"
          required
          autoComplete="off"
          aria-autocomplete="list"
          aria-controls={`suggestions-list-${id}`}
          aria-expanded={showSuggestions && suggestions.length > 0}
          aria-activedescendant={highlightedIndex !== -1 ? `suggestion-${id}-${highlightedIndex}` : undefined}
        />
        {showSuggestions && suggestions.length > 0 && (
          <ul
            id={`suggestions-list-${id}`}
            ref={suggestionsRef}
            className="suggestions-dropdown"
            role="listbox"
            onMouseLeave={handleMouseLeaveSuggestions}
           >
            {suggestions.map((suggestion, idx) => (
              <li
                key={suggestion}
                id={`suggestion-${id}-${idx}`}
                role="option"
                aria-selected={idx === highlightedIndex}
                className={`suggestion-item ${idx === highlightedIndex ? 'highlighted' : ''}`}
                onMouseDown={(e) => {
                   e.preventDefault();
                   handleSelectSuggestion(suggestion, true);
                 }}
                onMouseEnter={() => handleMouseEnterSuggestion(idx)}
               >
                {suggestion}
              </li>
            ))}
          </ul>
        )}
        {isLoading && (
          <div className="loading-indicator" aria-live="polite">
            <span className="sr-only">Loading suggestions</span>
          </div>
        )}
      </div>
    );
  }
);

export default AutocompleteInput;