<script>
import UserService from '@/services/UserService';
import { user } from '@/stores/user';

export default {
  name: 'AdminListView',
  components: {},
  data() {
    return {
      user,
      users: []
    };
  },
  async mounted() {
    while (!user.loaded) {
      await new Promise(resolve => setTimeout(resolve, 50));
    }
    if (!user.loggedIn || user.profile.role !== 'admin') {
      this.$router.push('/');
    }

    this.users = await UserService.getUsers();
  },
  methods: {
    async addCertificate(event) {
      event.preventDefault();
      if (!this.certificateName || !this.certificateFile) {
        return;
      }
      return await SignService.addCertificate(this.certificateName, this.certificateFile);
    },
    async removeCertificate(index, name) {
      return await SignService.removeCertificate(index, name);
    }
  },
}
</script>

<template>
  <main v-if="user.loggedIn">
    <div>
      <div class="title mb-2 d-flex justify-content-start align-items-stretch gap-2">
        <h2 class="m-0">
          Registered Accounts
        </h2>
        <span class="badge bg-primary rounded-pill my-2">{{ users.length }}</span>
      </div>
      
      <RouterLink to="/admin/add" class="btn btn-success btn-sm mb-4">
        &plus; Add User
      </RouterLink>

      <div class="list-group">
        <a v-for="(u, index) in users" :key="u._id" class="list-group-item list-group-item-action" :href="'./admin/' + u._id">
          <div class="d-flex w-100 justify-content-between">
            <h5 class="mb-1">
              <i class="fa fa-fw fa-lock text-muted" v-if="!u.password"></i>
              {{ u.fullName }}
            </h5>
            <small>{{ u.role }}</small>
          </div>
          <p class="mb-1 text-muted">{{ u.email }}</p>
        </a>
      </div>
    </div>
  </main>
</template>
