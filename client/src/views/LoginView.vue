<script>
import UserService from '../services/UserService'
import { user } from '../stores/user';

export default {
  name: 'Login',
  components: {},

  data() {
    return {
      user,
      username: '',
      password: '',
      showErrors: false
    };
  },
  methods: {
    login(e) {
      e.preventDefault();

      UserService.login(
        this.username,
        this.password
      ).then(async data => {
        if (data.status == 200) {
          user.profile = await UserService.getProfile();
          user.loggedIn = user.profile ? true : false;
          this.showErrors = false;
          this.$router.push('/sign');
        } 
        else {
          this.showErrors = true;
        }
      });
    }
  },
}
</script>

<template>
  <main>
    <div class="card card-body col-8 m-auto mt-4">
      <h3 class="text-center m-0">Sign in</h3>
      <p class="text-center m-0">
        Login with your ELTE account to access the application.
      </p>

      <hr class="w-75 mx-auto">

      <a href="/api/oauth" class="btn btn-outline-primary w-100 d-flex justify-content-center align-items-center gap-1">
        <img src="https://learn.microsoft.com/en-us/entra/identity-platform/media/howto-add-branding-in-apps/ms-symbollockup_mssymbol_19.png" alt="Microsoft Logo" width="20" height="20">
        Sign in with Microsoft
      </a>
      <span class="text-muted text-end">using @inf.elte.hu account</span>

      <hr class="w-75 mx-auto">

      <form @submit="login">
        <div class="mb-3">
          <label for="username" class="form-label">Username</label>
          <input type="text" class="form-control" id="username" placeholder="abcdef" v-model="username">
        </div>
        <div class="mb-3">
          <label for="password" class="form-label">Password</label>
          <input type="password" class="form-control" id="password" placeholder="••••••••" v-model="password">
        </div>
        <p class="text-danger m-0" v-if="showErrors">
          Error: Invalid credentials!
        </p>
        <button type="submit" class="btn btn-primary">Submit</button>
      </form>
    </div>
  </main>
</template>
