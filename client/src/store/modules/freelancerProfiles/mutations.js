export default {
  SET_LOADING(state, loading) {
    state.loading = loading;
  },

  SET_ERROR(state, error) {
    state.error = error;
  },

  SET_PROFILES(state, profiles) {
    state.profiles = profiles;
  },

  SET_SELECTED_PROFILE(state, profile) {
    state.selectedProfile = profile;
  },

  CLEAR_SELECTED_PROFILE(state) {
    state.selectedProfile = null;
  },

  /**
   * Critical PATCH-merge mutation - never replaces full objects
   * Preserves pictureFileId and attachments if not in patch
   */
  SET_SELECTED_PROFILE_PATCH(state, patch) {
    if (!state.selectedProfile) {
      state.selectedProfile = { ...patch };
      return;
    }
    
    state.selectedProfile = {
      ...state.selectedProfile,
      ...patch,
      // Preserve pictureFileId if not in patch
      pictureFileId: patch.pictureFileId ?? state.selectedProfile.pictureFileId,
      // Preserve attachments if not in patch
      attachments: patch.attachments ?? state.selectedProfile.attachments
    };
  },

  UPDATE_PROFILE_IN_LIST(state, updatedProfile) {
    const index = state.profiles.findIndex(
      p => (p._id || p.id) === (updatedProfile._id || updatedProfile.id)
    );
    if (index !== -1) {
      state.profiles[index] = { ...state.profiles[index], ...updatedProfile };
    }
  },

  REMOVE_PROFILE_FROM_LIST(state, profileId) {
    state.profiles = state.profiles.filter(
      p => (p._id || p.id) !== profileId
    );
  },

  SET_FILTERS(state, filters) {
    state.filters = { ...state.filters, ...filters };
  }
};
