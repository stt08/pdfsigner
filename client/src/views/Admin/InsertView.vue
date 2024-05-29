<script>
import UserService from '@/services/UserService';
import { user } from '@/stores/user';

export default {
  name: 'InsertView',
  components: {},
  data() {
    return {
      user,
      inputs: {
        email: '',
        fullName: '',
        password: '',
        role: 'user',
      },
    };
  },
  async mounted() {
    while (!user.loaded) {
      await new Promise(resolve => setTimeout(resolve, 50));
    }
    if (!user.loggedIn || user.profile.role !== 'admin') {
      this.$router.push('/');
    }
  },
  methods: {
    async create() {
      await UserService.createUser( this.inputs.email, this.inputs.fullName, this.inputs.password, this.inputs.role );
      this.$router.push('/admin');
    }
  },
}
</script>

<template>
  <main>
    <RouterLink to="/admin" class="btn btn-outline-primary">
      <i class="fa fa-fw fa-arrow-left"></i>
      Back
    </RouterLink>

    <div class="card card-body col-md-8 m-auto mt-4">
      <h3 class="text-center m-0">Create an account</h3>
      <p class="text-center m-0">
        Use this page to create a new account for a user.
        <br>
        It will use 'email:password' as a login method
      </p>

      <hr class="w-75 mx-auto">
      <form>
        <div class="mb-3">
          <label for="fullName" class="form-label">Full name</label>
          <div class="input-group">
            <input type="text" class="form-control" id="fullName" v-model="inputs.fullName" placeholder="John Doe">
          </div>
        </div>
        <div class="mb-3">
          <label for="email" class="form-label">Email / Username</label>
          <div class="input-group mb-3">
            <input type="text" class="form-control" id="email" v-model="inputs.email" placeholder="email@example.com">
          </div>
        </div>
        <div class="mb-3" v-if="!locked">
          <label for="password" class="form-label">New password</label>
          <div class="input-group mb-3">
            <input type="password" class="form-control" id="password" v-model="inputs.password" placeholder="*********">
          </div>
        </div>
        <div class="mb-3">
          <label for="role" class="form-label">Role</label>
          <select class="form-select" id="role">
            <option v-for="role in ['admin', 'user']" :value="role" :selected="role === inputs.role">
              {{ role }}
            </option>
          </select>
        </div>
        <div class="mb-3">
          <button type="submit" class="btn btn-success w-100" @click="create">Create</button>
        </div>
      </form>
    </div>
  </main>
</template>
