<script setup>
import { VuePDF, usePDF } from '@tato30/vue-pdf';
import SignService from '@/services/SignService';
import { ref } from 'vue';

const certificate = ref(0);
const pdfSource = ref(null);
const { pdf, pages } = usePDF(pdfSource);
const width = ref(0), height = ref(0), page = ref(1);

const signedFiles = ref([]);
const fileSigned = ref(false);
const formSubmitted = ref(false);
const selectedFiles = ref({});

const pdfFiles = ref([]);
const currentFile = ref(0), totalFiles = ref(0);
const email = ref('');

const stamps = ref([]);
const watermarkOptions = ref({
  rows: 4,
  columns: 4,
  color: '#23FFFF',
  rotation: 45,
  fontSize: 30,
});

function handleFileChange(event) {
  currentFile.value = 0;
  totalFiles.value = event.target.files.length;
  pdfFiles.value = event.target.files;

  const file = event.target.files[currentFile.value];
  if (file) {
    pdfSource.value = URL.createObjectURL(file);
    page.value = 1;
  }
}

function handleFileSize(value) {
  height.value = value.height;
  width.value = value.width;
}

function handleDragOver(event) {
  event.preventDefault();
}

function handleDrop(event) {
  event.preventDefault();
  currentFile.value = 0;
  totalFiles.value = event.dataTransfer.files.length;
  pdfFiles.value = event.dataTransfer.files;

  const file = event.dataTransfer.files[currentFile.value];
  if (file) {
    pdfSource.value = URL.createObjectURL(file);
    page.value = 1;
  }
}

function changeFile(index) {
  currentFile.value = index;
  const file = pdfFiles.value[currentFile.value];
  if (file) {
    pdfSource.value = URL.createObjectURL(file);
    page.value = 1;
  }
}

function addStamp() {
  let id = stamps.value.length + 1;
  do {
    id++;
  } while (stamps.value.some(stamp => stamp.id === id));

  const stamp = {
    id: id,
    style: {
      position: 'absolute',
    },
    width: 100,
    height: 100,
    x: width.value / 2,
    y: height.value / 2,
    page: page.value,
    file: currentFile.value,
  }
  stamps.value.push(stamp);
}

function submitForm() {
  formSubmitted.value = true;
}

async function signIt() {
  formSubmitted.value = false;
  const formatedStamps = [];
  stamps.value.forEach(stamp => {

    const invertedY = height.value - stamp.y - stamp.height;

    formatedStamps.push({
      x: stamp.x / width.value,
      y: invertedY / height.value,
      width: stamp.width / width.value,
      height: stamp.height / height.value,
      page: stamp.page,
      file: stamp.file,
    });
  });
 
  fileSigned.value = true;
  signedFiles.value = await SignService.create(
    pdfFiles.value,
    formatedStamps,
    certificate.value
  );

  selectedFiles.value = {};
  [...signedFiles.value].forEach(file => {
    selectedFiles.value[file.name] = { selected: true };
  });
}

async function sendToEmail() {
  const files = signedFiles.value.filter(file => selectedFiles.value[file.name].selected);
  await SignService.send(files, email.value);
}

function downloadIt() {
  const files = signedFiles.value.filter(file => selectedFiles.value[file.name].selected);
  files.forEach(file => {
    const url = window.URL.createObjectURL(
      new Blob([new Uint8Array(file.buffer.data)], { type: 'application/pdf' })
    );
    const link = document.createElement('a');
    link.href = url;
    link.download = `${file.name}`;
    document.body.appendChild(link);
    link.click();
  });
}
let dragOffsetX = 0;
let dragOffsetY = 0;

function dragStampStart(event, stamp) {
  dragOffsetX = event.offsetX;
  dragOffsetY = event.offsetY;
}

function dragStampOver(event) {
  event.preventDefault();
}

function dragStampEnd(event, stamp) {
  const container = event.target.closest('.p-0');
  const containerRect = container.getBoundingClientRect();
  const x = Math.max(0, Math.min(event.clientX - containerRect.left - dragOffsetX, containerRect.width - stamp.width));
  const y = Math.max(0, Math.min(event.clientY - containerRect.top - dragOffsetY, containerRect.height - stamp.height));
  stamp.x = x; stamp.y = y;
}

let resizing = null;

function resizeStart(event, stamp, direction) {
  event.preventDefault();
  event.stopPropagation();
  resizing = { stamp, direction, startX: event.clientX, startY: event.clientY, startWidth: stamp.width, startHeight: stamp.height, startXOffset: stamp.x, startYOffset: stamp.y };
  
  document.addEventListener('mousemove', resizeMove);
  document.addEventListener('mouseup', resizeEnd);
}

function resizeMove(event) {
  if (!resizing) return;
  
  const { stamp, direction, startX, startY, startWidth, startHeight, startXOffset, startYOffset } = resizing;
  const dx = event.clientX - startX;
  const dy = event.clientY - startY;
  if (direction.includes('right')) stamp.width = Math.max(startWidth + dx, 10);
  if (direction.includes('bottom')) stamp.height = Math.max(startHeight + dy, 10);
  if (direction.includes('left')) {
    stamp.width = Math.max(startWidth - dx, 10);
    stamp.x = Math.min(startXOffset + dx, startXOffset + startWidth - 10); 
  }
  if (direction.includes('top')) {
    stamp.height = Math.max(startHeight - dy, 10);
    stamp.y = Math.min(startYOffset + dy, startYOffset + startHeight - 10);
  }
}

function resizeEnd() {
  resizing = null;
  document.removeEventListener('mousemove', resizeMove);
  document.removeEventListener('mouseup', resizeEnd);
}
</script>

<script>
import { user } from '@/stores/user';

export default {
  name: 'SignerView',
  data() {
    return user;
  },
  async mounted() {
    while (!user.loaded) {
      await new Promise(resolve => setTimeout(resolve, 50));
    }
    if (!user.loggedIn) {
      this.$router.push('/');
    }
  },
}
</script>

<template>
  <div>
    <div v-if="!pdf">
      <h2>Sign document</h2>
      <p>Select PDF file(s) to apply signature</p>
      <div class="card card-body col-md-6">
        <div>
          <label for="file" class="form-label">Select your PDF file(s):</label>
          <input type="file" @change="handleFileChange" accept=".pdf" class="form-control" multiple />
        </div>

        <!-- ----or---- -->
        <div class="d-flex justify-content-center my-4">
          <hr class="w-100 my-3">
          <span class="px-2">
            (or)
          </span>
          <hr class="w-100 my-3">
        </div>
        
        <div class="border border-primary p-5 text-center" @dragover="handleDragOver" @drop="handleDrop">
          <p>Drag and drop your PDF file(s) here</p>
        </div>  
      </div>
    </div>
    <div v-else>
      <div class="row">
        <div class="col-md-6 col-12">
          <div class="p-0" style="position: relative; background-color: gray;">
            <VuePDF :pdf="pdf" :page="page" @loaded="handleFileSize" fit-parent
              watermark-text="Preview: document is not signed yet!" :watermark-options="watermarkOptions" />
            <div v-for="stamp in stamps.filter(stamp => stamp.page === page && stamp.file === currentFile)" :key="stamp.id">
              <div class="stamp"
                :style="{ width: `${stamp.width}px`, height: `${stamp.height}px`, left: `${stamp.x}px`, top: `${stamp.y}px`, position: 'absolute' }"
                draggable="true" @dragstart="dragStampStart($event, stamp)" @dragend="dragStampEnd($event, stamp)" @dragover="dragStampOver($event)">
                <div class="stamp-content">
                  <span class="stamp-text text-danger">
                    Signed by {{ user.profile.fullName }}
                    <br> at YYYY/MM/DD HH:MM:SS
                  </span>
                </div>
                <div class="resize-handle top-left" @mousedown="resizeStart($event, stamp, 'top-left')"></div>
                <div class="resize-handle top-right" @mousedown="resizeStart($event, stamp, 'top-right')"></div>
                <div class="resize-handle bottom-left" @mousedown="resizeStart($event, stamp, 'bottom-left')"></div>
                <div class="resize-handle bottom-right" @mousedown="resizeStart($event, stamp, 'bottom-right')"></div>
              </div>
            </div>
          </div>
        </div>
        <div class="col-md-6 col-12 px-5">
          <div class="card mb-4">
            <div class="card-header">
              <h5 class="card-title float-start">
                Files
                ({{ currentFile+1 }} of {{ totalFiles }})
              </h5>
            </div>
            <div class="card-body">
              <p class="text-center text-muted">
                {{ pdfFiles[currentFile].name }}
              </p>
              <div class="row">
                <div class="col-3">
                  <button class="btn btn-primary w-100" @click="changeFile(0)" :disabled="currentFile <= 0">First</button>
                </div>
                <div class="btn-group col-6" role="group">
                  <button type="button" class="btn btn-primary px-3" @click="changeFile(currentFile - 1)" :disabled="currentFile <= 0">&larr;</button>
                  <button type="button" class="btn btn-warning border-primary" disabled>{{ currentFile+1 }}</button>
                  <button type="button" class="btn btn-primary px-3" @click="changeFile(currentFile + 1)" :disabled="currentFile >= totalFiles - 1">&rarr;</button>
                </div>
                <div class="col-3">
                  <button class="btn btn-primary w-100" @click="changeFile(totalFiles - 1)" :disabled="currentFile >= totalFiles - 1">Last</button>
                </div>
              </div>
            </div>
          </div>
          <div class="card mb-4">
            <div class="card-header">
              <h5 class="card-title float-start">
                Pages
                ({{ page }} of {{ pages }})
              </h5>
            </div>
            <div class="card-body">
              <div class="row">
                <div class="col-3">
                  <button class="btn btn-primary w-100" @click="page = 1" :disabled="page <= 1">First</button>
                </div>
                <div class="btn-group col-6" role="group">
                  <button type="button" class="btn btn-primary px-3" @click="page--" :disabled="page <= 1">&larr;</button>
                  <button type="button" class="btn btn-warning border-primary" disabled>{{ page }}</button>
                  <button type="button" class="btn btn-primary px-3" @click="page++" :disabled="page >= pages">&rarr;</button>
                </div>
                <div class="col-3">
                  <button class="btn btn-primary w-100" @click="page = pages" :disabled="page >= pages">Last</button>
                </div>
              </div>
            </div>
          </div>

          <!-- add stamp -->
          <div class="d-flex justify-content-between">
            <button class="btn btn-primary" @click="addStamp">Add Stamp</button>
            <button class="btn btn-success ms-2" @click="submitForm">Sign document</button>
          </div>

          <div class="mt-3">
            <h5>Stamps on page {{ page }}</h5>
            <div v-for="stamp in stamps.filter(stamp => stamp.page === page && stamp.file === currentFile)">
              <div class="d-flex justify-content-between">
                <span>Stamp #{{ stamp.id }}</span>
                <button class="btn btn-sm btn-outline-danger p-0 px-1"
                  @click="stamps.splice(stamps.indexOf(stamp), 1)">Remove</button>
              </div>
              <div class="row ps-2">
                <span>Dimensions</span>
                <div class="col">
                  <span>Width:</span>
                  <input type="number" v-model="stamp.width" class="form-control d-inline-block p-0">
                  <input type="range" v-model="stamp.width" class="form-range" min="0" :max="width - stamp.x" step="1">
                </div>
                <div class="col">
                  <span>Height:</span>
                  <input type="number" v-model="stamp.height" class="form-control d-inline-block p-0">
                  <input type="range" v-model="stamp.height" class="form-range" min="0" :max="height - stamp.y" step="1">
                </div>
              </div>
              <div class="row ps-2">
                <span>Position</span>
                <div class="col">
                  <span>X:</span>
                  <input type="number" v-model="stamp.x" class="form-control d-inline-block p-0">
                  <input type="range" v-model="stamp.x" class="form-range" min="0" :max="width - stamp.width" step="1">
                </div>
                <div class="col">
                  <span>Y:</span>
                  <input type="number" v-model="stamp.y" class="form-control d-inline-block p-0">
                  <input type="range" v-model="stamp.y" class="form-range" min="0" :max="height - stamp.height" step="1">
                </div>
              </div>
              <hr>
            </div>
          </div>
        </div>
      </div>

      <!-- Modal -->
      <div v-if="fileSigned || formSubmitted"
        style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; background-color: rgba(0, 0, 0, 0.5); z-index: 1000; display: flex; justify-content: center; align-items: center;">
        <div class="card" v-if="formSubmitted">
          <div class="card-header">
            <h5 class="card-title float-start">Select a certificate</h5>
            <button type="button" class="btn-close float-end" aria-label="Close" @click="formSubmitted = false"></button>
          </div>
          <div class="card-body">
            <label for="certificate" class="form-label">Select a certificate</label>
            <select class="form-select" id="certificate" v-model="certificate">
              <option v-for="(certificate, index) in user.profile.certificates" :key="certificate" :value="index"
                style="text-transform: capitalize;">{{ certificate[0].toUpperCase() + certificate.slice(1) }}</option>
            </select>
            <button class="btn btn-success w-100 mt-3" @click="signIt">
              &check; Sign document
            </button>
          </div>
        </div>


        <div class="card" v-if="fileSigned">
          <div class="card-header">
            <h5 class="card-title float-start">Signed files</h5>
            <button type="button" class="btn-close float-end" aria-label="Close" @click="fileSigned = false"></button>
          </div>
          <div class="card-body">
            <p class="text-center fw-bold">Your document{{ signedFiles.length > 1 ? 's are' : ' is'}} ready!</p>
            <hr>
              <ul class="list-group">
                <li class="list-group-item" v-for="(file, index) in signedFiles">
                  <input type="checkbox" class="form-check-input me-1" :id="'file-' + index" :checked="selectedFiles[file.name].selected"
                    @change="selectedFiles[file.name].selected = !selectedFiles[file.name].selected">
                  <label class="form-check-label" :for="'file-' + index">{{ file.initialName }}</label>
                </li>
              </ul>
              <hr>
            <div class="row">
              <div class="col border-end">
                <p class="text-center">Send to an email</p>
                <div class="input-group mb-3">
                  <input type="email" class="form-control" placeholder="Email" v-model="email">
                  <button class="btn btn-success" @click="sendToEmail">Send</button>
                </div>
              </div>
              <div class="col">
                <p class="text-center">Download the file(s)</p>
                <button class="btn btn-primary w-100" @click="downloadIt">Download</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.stamp {
  background-color: gray;
}

.stamp-text {
  font-size: 10px;
  color: pink !important;
}

.resize-handle { width: 10px; height: 10px; background-color: red; position: absolute; z-index: 1; } .top-left { top: -5px; left: -5px; cursor: nwse-resize; } .top-right { top: -5px; right: -5px; cursor: nesw-resize; } .bottom-left { bottom: -5px; left: -5px; cursor: nesw-resize; } .bottom-right { bottom: -5px; right: -5px; cursor: nwse-resize; }
</style>