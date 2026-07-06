// Global UI State Management
window.AppState = {
  activePropertyId: localStorage.getItem('pg_active_property_id') || 'all',
  
  setActivePropertyId: function(id) {
    this.activePropertyId = id;
    localStorage.setItem('pg_active_property_id', id);
    // Dispatch custom event to let listeners know the property has changed
    const event = new CustomEvent('propertyChanged', { detail: id });
    window.dispatchEvent(event);
  },

  getActivePropertyId: function() {
    return this.activePropertyId;
  }
};
