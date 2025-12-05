export default class InsertImageDialog {
  constructor(props = {}) {
    this.props = props;
    this.init();
  }

  init() {
    this.animate = null;
    this.error = '';
    this.url = this.props.url || '';
    this.alt = this.props.alt || '';
    this.fileData = '';
    this.fileName = '';
    d.update?.();
  }

  toggleAnimate(value) {
    this.animate = value;
    d.update();
  }

  async selectFile() {
    try {
      let file = await selectFile('image/*');
      if (!file) return;
      let data = await this.readFile(file);
      this.fileData = data;
      this.fileName = file.name || 'image';
      this.url = '';
      this.error = '';
      d.update();
    } catch (err) {
      this.error = 'Unable to read file.';
      d.update();
    }
  }

  readFile(file) {
    return new Promise((resolve, reject) => {
      let reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });
  }

  urlInput(event) {
    this.url = event?.target?.value || '';
    if (this.url) {
      this.fileData = '';
      this.fileName = '';
    }
    this.error = '';
    d.update();
  }

  altInput(event) {
    this.alt = event?.target?.value || '';
    d.update();
  }

  submit(event) {
    if (!event) return;
    let action = event.submitter?.value;
    if (action !== 'insert') return;
    event.preventDefault();
    let src = this.fileData || (this.url || '').trim();
    if (!src) {
      this.error = 'Provide an image URL or choose a file.';
      d.update();
      return;
    }
    let detail = {
      src,
      alt: (this.alt || '').trim(),
      name: this.fileName,
    };
    let dialog = event.target.closest('dialog');
    if (dialog) {
      dialog.returnDetail = [detail];
      dialog.close('image');
    }
  }
}
