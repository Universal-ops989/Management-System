import { createStore } from 'vuex';
import jobProfiles from './modules/jobProfiles';
import freelancerProfiles from './modules/freelancerProfiles';
import personalProfiles from './modules/personalProfiles';
import auth from './modules/auth';

export default createStore({
  modules: {
    jobProfiles,
    freelancerProfiles,
    personalProfiles,
    auth
  }
});
