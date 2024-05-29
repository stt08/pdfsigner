<script>
import { user } from '../stores/user';
import SignService from '@/services/SignService';
import UserService from '@/services/UserService';

export default {
  name: 'ProfileView',
  components: {},
  data() {
    return {
      user,
      locked: true,
      certificateFile: null,
      certificateName: '',
      inputs: {
        fullName: '',
        email: '',
        password: '',
      }
    };
  },
  async mounted() {
    while (!user.loaded) {
      await new Promise(resolve => setTimeout(resolve, 50));
    }
    if (!user.loggedIn) {
      this.$router.push('/');
    }

    this.locked = !user.profile.hasPassword;
    this.inputs.fullName = user.profile.fullName;
    this.inputs.email = user.profile.email;
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
    },
    async removeProfile() {
      return await UserService.deleteMe();
    },
    async update(field, data) {
      if (this.locked) {
        return;
      }
      UserService.updateMe( field, data );
      this.user.profile.fullName = this.inputs.fullName;
      this.user.profile.email = this.inputs.email;
    },
  },
}
</script>

<template>
  <main>
    <div class="card card-body col-md-8 m-auto mt-4">
      <h3 class="text-center m-0">Profile</h3>
      <p class="text-center m-0">
        Here you can view your profile.
      </p>

      <hr class="w-75 mx-auto">

      <form>
        <div class="mb-3">
          <span class="text-muted float-end fst-italic" v-if="locked">*cannot be changed</span>
          <label for="fullName" class="form-label">Full name</label>
          <div class="input-group">
            <input type="text" class="form-control" id="fullName" v-model="inputs.fullName" :disabled="locked">
            <button class="btn btn-outline-success" type="button" v-if="!locked" @click="update('fullName', inputs.fullName)">
              <i class="fa fa-fw fa-save"></i>
            </button>
          </div>
          <span class="text-danger fst-italic" v-if="inputs.fullName !== user.profile.fullName">
            Click <i class="fa fa-fw fa-save text-success"></i> to save changes
          </span>
        </div>

        <div class="mb-3">
          <span class="text-muted float-end fst-italic" v-if="locked">*cannot be changed</span>
          <label for="email" class="form-label">Email / Username</label>
          <div class="input-group mb-3">
            <input type="text" class="form-control" id="email" v-model="inputs.email" :disabled="locked">
            <button class="btn btn-outline-success" type="button" v-if="!locked">
              <i class="fa fa-fw fa-save"></i>
            </button>
          </div>
          <span class="text-danger fst-italic" v-if="inputs.email !== user.profile.email">
            Click <i class="fa fa-fw fa-save text-success"></i> to save changes
          </span>
        </div>

        <div class="mb-3">
          <label for="certificates" class="form-label">Certificates</label>
          <ul class="list-group">
            <li class="list-group-item" v-for="(certificate, index) in user.profile.certificates" :key="index">
              <span class="text-muted">{{ certificate }}</span>
              <span class="float-end" v-if="index > 0">
                <button class="btn btn-danger btn-sm" @click="removeCertificate(index, certificate)">Remove</button>
              </span>
            </li>
          </ul>
        </div>
        <div class="mb-3">
          <button class="btn btn-primary w-100" type="button" data-bs-toggle="collapse" data-bs-target="#collapseExample" aria-expanded="false" aria-controls="collapseExample">
            &plus; Add certificate
          </button>
          <div class="collapse mt-1" id="collapseExample">
            <div class="card card-body bg-primary-subtle">
              <div class="mb-3">
                <label for="certificateFile" class="form-label">Accepted certificates: (.p12)</label>
                <input type="file" class="form-control" id="certificateFile" accept=".p12" v-on:change="certificateFile = $event.target.files[0]">
              </div>
              <div class="mb-3">
                <label for="certificateName" class="form-label">Certificate name</label>
                <input type="text" class="form-control" id="certificateName" placeholder="Example: Organization / Personal" v-model="certificateName">
              </div>
              <button class="btn btn-success w-100" @click="addCertificate">Save</button>
            </div>
          </div>
        </div>
        <hr class="w-75 mx-auto">
        <p class="text-muted text-center">
          *for accounts that are managed by the administrators of an organization*
        </p>
      </form>

      <button class="btn btn-danger w-100" @click="removeProfile">
        Remove profile
      </button>
    </div>
  </main>
</template>
