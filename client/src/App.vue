<script>
import { RouterLink, RouterView } from 'vue-router'
import { user, emptyProfile } from './stores/user';
import UserService from './services/UserService'

export default {
  name: 'App',
  components: {},

  data() {
    return user;
  },
  mounted() {
    this.checkLoggedIn();
  },
  methods: {
    async checkLoggedIn() {
      user.loaded = false;
      try {
        user.profile = await UserService.getProfile();
        user.loggedIn = user.profile ? true : false;
      } catch (error) {} finally {
        user.loaded = true;
      }
    },
    logout() {
      user.loaded = false;
      UserService.logout()
      .then(() => {
        user.profile = emptyProfile;
        user.loggedIn = false;
        this.$router.push('/');
      })
      .finally(() => {
        user.loaded = true
      });
    }
  },
}
</script>

<template>
  <header>
    <nav class="navbar navbar-expand-lg bg-body-tertiary">
      <div class="container-md">
        <RouterLink to="/" class="navbar-brand mb-0 h1">PDF-Signer</RouterLink>
        <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navContent" aria-controls="navContent" aria-expanded="false" aria-label="Toggle navigation">
          <span class="navbar-toggler-icon"></span>
        </button>
        <div class="collapse navbar-collapse" id="navContent">
          <div class="navbar-nav me-auto mb-2 mb-lg-0" v-if="loggedIn">
            <RouterLink to="/sign" class="nav-item nav-link">Sign Document</RouterLink>
            <RouterLink to="/admin" class="nav-item nav-link" v-if="profile.role === 'admin'">Admin</RouterLink>
          </div>
          <div class="navbar-nav ms-auto mb-2 mb-lg-0">
            <div class="nav-item dropdown" v-if="loggedIn">
              <RouterLink to="#" class="nav-link dropdown-toggle" id="navbarDropdown" role="button" data-bs-toggle="dropdown" aria-expanded="false">
                Account
              </RouterLink>
              <div class="dropdown-menu dropdown-menu-end" aria-labelledby="navbarDropdown">
                <RouterLink to="/profile" class="dropdown-item">Profile</RouterLink>
                <hr class="dropdown-divider">
                <button class="dropdown-item" @click="logout">Logout</button>
              </div>
            </div>
            <RouterLink to="/login" class="nav-item nav-link" v-else>Login</RouterLink>
          </div>
        </div>
      </div>
    </nav>
  </header>

  <div class="container-md mt-3">
    <RouterView />
  </div>
</template>

<style scoped>

</style>
