export default {
  profiles: (state) => state.profiles,
  selectedProfile: (state) => state.selectedProfile,
  loading: (state) => state.loading,
  error: (state) => state.error,
  filters: (state) => state.filters,
  hasSelectedProfile: (state) => !!state.selectedProfile && Object.keys(state.selectedProfile).length > 0
};
