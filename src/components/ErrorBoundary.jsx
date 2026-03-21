import React from 'react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    // We don't even need hasError state if we just reload
  }

  static getDerivedStateFromError() {
    // Note: getDerivedStateFromError must return state, so we return an empty object
    return {};
  }

  componentDidCatch(error, info) {
    console.error("React Caught Error, Attempting Auto-Recovery:", error, info);
    
    // Clear potentially corrupted storage (like the Supabase Auth token)
    localStorage.clear();
    
    // Automatically reload the page to cleanly reset the app state
    window.location.reload();
  }

  render() {
    // This will briefly render nothing while the page reloads instantly
    return this.props.children;
  }
}
