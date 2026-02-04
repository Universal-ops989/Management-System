import * as profileService from '../../../services/freelancerProfiles';

export default {
  async fetchProfiles({ commit, state }) {
    commit('SET_LOADING', true);
    commit('SET_ERROR', null);
    
    try {
      const filters = { limit: 1000, ...state.filters };
      const response = await profileService.fetchFreelancerProfiles(filters);
      
      if (response.ok && response.data) {
        commit('SET_PROFILES', response.data.profiles || []);
        return { ok: true, data: response.data };
      } else {
        const error = response.message || 'Failed to load profiles';
        commit('SET_ERROR', error);
        return { ok: false, message: error };
      }
    } catch (err) {
      const error = err.response?.data?.message || 'Failed to load profiles';
      commit('SET_ERROR', error);
      return { ok: false, message: error };
    } finally {
      commit('SET_LOADING', false);
    }
  },

  async fetchProfile({ commit }, profileId) {
    commit('SET_LOADING', true);
    commit('SET_ERROR', null);
    
    try {
      const response = await profileService.getFreelancerProfile(profileId);
      
      if (response.ok && response.data && response.data.profile) {
        commit('SET_SELECTED_PROFILE', response.data.profile);
        return { ok: true, data: response.data };
      } else {
        const error = response.message || 'Failed to load profile';
        commit('SET_ERROR', error);
        return { ok: false, message: error };
      }
    } catch (err) {
      const error = err.response?.data?.message || 'Failed to load profile';
      commit('SET_ERROR', error);
      return { ok: false, message: error };
    } finally {
      commit('SET_LOADING', false);
    }
  },

  async createProfile({ commit, dispatch }, profileData) {
    commit('SET_LOADING', true);
    commit('SET_ERROR', null);
    
    try {
      const response = await profileService.createFreelancerProfile(profileData);
      
      if (response.ok && response.data && response.data.profile) {
        // Reload profiles list
        await dispatch('fetchProfiles');
        return { ok: true, data: response.data };
      } else {
        const error = response.message || 'Failed to create profile';
        commit('SET_ERROR', error);
        return { ok: false, message: error };
      }
    } catch (err) {
      const error = err.response?.data?.message || 'Failed to create profile';
      commit('SET_ERROR', error);
      return { ok: false, message: error };
    } finally {
      commit('SET_LOADING', false);
    }
  },

  async updateProfile({ commit, state }, { profileId, profileData }) {
    commit('SET_LOADING', true);
    commit('SET_ERROR', null);
    
    try {
      const response = await profileService.updateFreelancerProfile(profileId, profileData);
      
      if (response.ok) {
        const updatedProfile = response.data.profile || response.data.data?.profile;
        
        // Update in list
        if (updatedProfile) {
          commit('UPDATE_PROFILE_IN_LIST', updatedProfile);
        }
        
        // Update selected profile if it's the same one
        if (state.selectedProfile && 
            (state.selectedProfile._id || state.selectedProfile.id) === profileId) {
          commit('SET_SELECTED_PROFILE_PATCH', updatedProfile || profileData);
        }
        
        return { ok: true, data: response.data };
      } else {
        const error = response.message || 'Failed to update profile';
        commit('SET_ERROR', error);
        return { ok: false, message: error };
      }
    } catch (err) {
      const error = err.response?.data?.message || 'Failed to update profile';
      commit('SET_ERROR', error);
      return { ok: false, message: error };
    } finally {
      commit('SET_LOADING', false);
    }
  },

  async deleteProfile({ commit, state }, profileId) {
    commit('SET_LOADING', true);
    commit('SET_ERROR', null);
    
    try {
      const response = await profileService.deleteFreelancerProfile(profileId);
      
      if (response.ok) {
        // Remove from list
        commit('REMOVE_PROFILE_FROM_LIST', profileId);
        
        // Clear selected if it was the deleted one
        if (state.selectedProfile && 
            (state.selectedProfile._id || state.selectedProfile.id) === profileId) {
          commit('CLEAR_SELECTED_PROFILE');
        }
        
        return { ok: true };
      } else {
        const error = response.message || 'Failed to delete profile';
        commit('SET_ERROR', error);
        return { ok: false, message: error };
      }
    } catch (err) {
      const error = err.response?.data?.message || 'Failed to delete profile';
      commit('SET_ERROR', error);
      return { ok: false, message: error };
    } finally {
      commit('SET_LOADING', false);
    }
  },

  async uploadProfilePicture({ commit, state }, { profileId, pictureFile }) {
    commit('SET_LOADING', true);
    commit('SET_ERROR', null);
    
    try {
      const response = await profileService.uploadProfilePicture(profileId, pictureFile);
      
      if (response.ok) {
        const updatedProfile = response.data.profile || response.data.data?.profile;
        
        // Use PATCH-merge mutation to preserve attachments
        if (updatedProfile) {
          commit('SET_SELECTED_PROFILE_PATCH', updatedProfile);
          commit('UPDATE_PROFILE_IN_LIST', updatedProfile);
        }
        
        return { ok: true, data: response.data };
      } else {
        const error = response.message || 'Failed to upload picture';
        commit('SET_ERROR', error);
        return { ok: false, message: error };
      }
    } catch (err) {
      const error = err.response?.data?.message || 'Failed to upload picture';
      commit('SET_ERROR', error);
      return { ok: false, message: error };
    } finally {
      commit('SET_LOADING', false);
    }
  },

  async uploadAttachments({ commit, state }, { profileId, files }) {
    commit('SET_LOADING', true);
    commit('SET_ERROR', null);
    
    try {
      // Use multi-file upload if multiple files, otherwise single
      const response = files.length > 1
        ? await profileService.uploadAttachments(profileId, files)
        : await profileService.uploadAttachment(profileId, files[0]);
      
      if (response.ok) {
        const updatedProfile = response.data.profile || response.data.data?.profile;
        
        // Use PATCH-merge mutation to preserve pictureFileId
        if (updatedProfile) {
          commit('SET_SELECTED_PROFILE_PATCH', updatedProfile);
          commit('UPDATE_PROFILE_IN_LIST', updatedProfile);
        }
        
        return { ok: true, data: response.data };
      } else {
        const error = response.message || 'Failed to upload attachments';
        commit('SET_ERROR', error);
        return { ok: false, message: error };
      }
    } catch (err) {
      const error = err.response?.data?.message || 'Failed to upload attachments';
      commit('SET_ERROR', error);
      return { ok: false, message: error };
    } finally {
      commit('SET_LOADING', false);
    }
  },

  async deleteAttachment({ commit, state }, { profileId, fileId }) {
    commit('SET_LOADING', true);
    commit('SET_ERROR', null);
    
    try {
      const response = await profileService.deleteAttachment(profileId, fileId);
      
      if (response.ok) {
        const updatedProfile = response.data.profile || response.data.data?.profile;
        
        // Use PATCH-merge mutation to preserve pictureFileId
        if (updatedProfile) {
          commit('SET_SELECTED_PROFILE_PATCH', updatedProfile);
          commit('UPDATE_PROFILE_IN_LIST', updatedProfile);
        }
        
        return { ok: true, data: response.data };
      } else {
        const error = response.message || 'Failed to delete attachment';
        commit('SET_ERROR', error);
        return { ok: false, message: error };
      }
    } catch (err) {
      const error = err.response?.data?.message || 'Failed to delete attachment';
      commit('SET_ERROR', error);
      return { ok: false, message: error };
    } finally {
      commit('SET_LOADING', false);
    }
  },

  setFilters({ commit }, filters) {
    commit('SET_FILTERS', filters);
  },

  selectProfile({ commit }, profile) {
    commit('SET_SELECTED_PROFILE', profile);
  },

  clearSelectedProfile({ commit }) {
    commit('CLEAR_SELECTED_PROFILE');
  }
};
