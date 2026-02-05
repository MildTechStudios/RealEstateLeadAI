import { useState, useCallback } from 'react';

/**
 * Custom hook to manage state history for Undo/Redo functionality
 * @param initialPresent The initial state
 * @returns Object containing state, setters, and history controls
 */
export function useHistory<T>(initialPresent: T) {
    const [history, setHistory] = useState<{
        past: T[];
        present: T;
        future: T[];
    }>({
        past: [],
        present: initialPresent,
        future: []
    });

    const canUndo = history.past.length > 0;
    const canRedo = history.future.length > 0;

    const undo = useCallback(() => {
        setHistory(currentState => {
            const { past, present, future } = currentState;
            if (past.length === 0) return currentState;

            const previous = past[past.length - 1];
            const newPast = past.slice(0, past.length - 1);

            return {
                past: newPast,
                present: previous,
                future: [present, ...future]
            };
        });
    }, []);

    const redo = useCallback(() => {
        setHistory(currentState => {
            const { past, present, future } = currentState;
            if (future.length === 0) return currentState;

            const next = future[0];
            const newFuture = future.slice(1);

            return {
                past: [...past, present],
                present: next,
                future: newFuture
            };
        });
    }, []);

    const set = useCallback((newPresent: T) => {
        setHistory(currentState => {
            const { past, present } = currentState;

            // Optional: Check for deep equality to avoid redundant history entries?
            // For now, we assume if set is called, it's a change.
            if (newPresent === present) return currentState;

            return {
                past: [...past, present],
                present: newPresent,
                future: [] // Clearing future is standard behavior on new change
            };
        });
    }, []);

    // Helper to reset history (e.g. on initial load or save)
    const reset = useCallback((newPresent: T) => {
        setHistory({
            past: [],
            present: newPresent,
            future: []
        });
    }, []);

    return {
        state: history.present,
        setState: set,
        undo,
        redo,
        canUndo,
        canRedo,
        history, // Exposed for debugging if needed
        reset
    };
}
