export default class NewPageDialog {
  constructor(props) {
    this.props = props;
  }

  toggleAnimate(x) {
    this.animate = x;
    d.update();
  }

  submit(event) {
    if (!event) return;
    if (event.submitter?.value !== 'page') return;
    event.preventDefault();
    let scope = state.ecstaz;
    let payload = this.resolveDialogPayload();
    let error = this.validate(payload);
    if (error) {
      scope.dialog.error = error;
      d.update();
      return;
    }
    scope.dialog.error = '';
    let dialog = event.target.closest('dialog');
    if (dialog) {
      dialog.returnDetail = [payload];
      dialog.close('page');
    }
  }

  nameInput(event) {
    this.handleInput('name', event);
  }

  pathInput(event) {
    this.handleInput('path', event);
  }

  handleInput(field, event) {
    let scope = state.ecstaz;
    let value = event?.target?.value || '';
    if (field === 'name') {
      scope.dialog.name = value;
      if (!scope.dialog.touchedPath) scope.dialog.path = this.slugify(value);
    }
    if (field === 'path') {
      scope.dialog.touchedPath = true;
      scope.dialog.path = this.normalizePath(value);
    }
    scope.dialog.error = '';
    d.update();
  }

  resolveDialogPayload() {
    let scope = state.ecstaz;
    let name = (scope.dialog.name || '').trim() || 'Untitled Page';
    let path = scope.dialog.path ? this.normalizePath(scope.dialog.path) : this.slugify(name);
    let key = `pages/${path}`;
    let route = this.pathToRoute(key);
    return { name, path, key, route };
  }

  validate(payload) {
    let scope = state.ecstaz;
    if (!payload.name) return 'Name is required';
    if (!payload.path) return 'Path is required';
    if (scope.data.pages[payload.key]) return 'Page already exists';
    return '';
  }

  slugify(value) {
    let lower = (value || '').toLowerCase();
    let cleaned = lower.replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    if (!cleaned) cleaned = 'new-page';
    return `${cleaned}.html`;
  }

  normalizePath(value) {
    let lower = (value || '').toLowerCase().replace(/^\/+/, '');
    lower = lower.replace(/\.html?$/, '');
    let parts = lower
      .split('/')
      .map(x => x.replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, ''))
      .filter(Boolean);
    let joined = parts.join('/');
    if (!joined) joined = 'new-page';
    return `${joined}.html`;
  }

  pathToRoute(key) {
    let clean = key.replace(/^pages\//, '');
    if (clean === 'index.html' || clean === 'index') return '/';
    return '/' + clean;
  }
}
