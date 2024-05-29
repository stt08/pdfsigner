<script>
import UserService from '@/services/UserService';
import { user } from '@/stores/user';

export default {
  name: 'ProfileView',
  components: {},
  data() {
    return {
      user,
      inputs: {
        email: '',
        fullName: '',
        password: '',
      },
      locked: true,
      selectedUser: null,
    };
  },
  async mounted() {
    while (!user.loaded) {
      await new Promise(resolve => setTimeout(resolve, 50));
    }
    if (!user.loggedIn || user.profile.role !== 'admin') {
      this.$router.push('/');
    }

    this.selectedUser = await UserService.getUser( this.$route.params.id );
    this.locked = !this.selectedUser.password;
    this.inputs.email = this.selectedUser.email;
    this.inputs.fullName = this.selectedUser.fullName;
  },
  methods: {
    async update(field, data) {
      if (this.locked) {
        return;
      }
      UserService.updateUser( this.$route.params.id, field, data );
      this.selectedUser.fullName = this.inputs.fullName;
      this.selectedUser.email = this.inputs.email;
    },
    async removeProfile() {
      await UserService.deleteUser( this.$route.params.id );
      this.$router.push('/admin');
    },
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
      <div class="editable" v-if="locked">
        <h3 class="text-center m-0">
          <i class="fa fa-fw fa-lock text-muted"></i>
        </h3>
        <p class="text-center m-0">
          Microsoft OAuth account, data cannot be changed
        </p>
      </div>
      <div v-else>
        <h3 class="text-center m-0">Modify account</h3>
        <p class="text-center m-0">
          User: {{ selectedUser._id }}
        </p>
      </div>
      <hr class="w-75 mx-auto">
      <form v-if="selectedUser">
        <div class="mb-3">
          <label for="fullName" class="form-label">Full name</label>
          <div class="input-group">
            <input type="text" class="form-control" id="fullName" v-model="inputs.fullName" :disabled="locked">
            <button class="btn btn-outline-success" type="button" v-if="!locked" @click="update('fullName', inputs.fullName)">
              <i class="fa fa-fw fa-save"></i>
            </button>
          </div>
          <span class="text-danger fst-italic" v-if="inputs.fullName !== selectedUser.fullName">
            Click <i class="fa fa-fw fa-save text-success"></i> to save changes
          </span>
        </div>
        <div class="mb-3">
          <label for="email" class="form-label">Email / Username</label>
          <div class="input-group mb-3">
            <input type="text" class="form-control" id="email" v-model="inputs.email" :disabled="locked">
            <button class="btn btn-outline-success" type="button" v-if="!locked">
              <i class="fa fa-fw fa-save"></i>
            </button>
          </div>
          <span class="text-danger fst-italic" v-if="inputs.email !== selectedUser.email">
            Click <i class="fa fa-fw fa-save text-success"></i> to save changes
          </span>
        </div>
        <div class="mb-3" v-if="!locked">
          <label for="password" class="form-label">New password</label>
          <div class="input-group mb-3">
            <input type="password" class="form-control" id="password" v-model="inputs.password">
            <button class="btn btn-outline-success" type="button">
              <i class="fa fa-fw fa-save"></i>
            </button>
          </div>
          <span class="text-danger fst-italic" v-if="inputs.password !== ''">
            Click <i class="fa fa-fw fa-save text-success"></i> to save changes
          </span>
        </div>
        <div class="mb-3">
          <label for="role" class="form-label">Role</label>
          <select class="form-select" id="role">
            <option v-for="role in ['admin', 'user']" :value="role" :selected="role === selectedUser.role">
              {{ role }}
            </option>
          </select>
        </div>
        <hr class="w-75 mx-auto">
      </form>

      <button class="btn btn-danger w-100" @click="removeProfile">
        Remove profile
      </button>
    </div>
  </main>
</template>
