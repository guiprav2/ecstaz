let defaultBody = `<p class="text-neutral-400">Begin drafting in this monochrome workspace.</p>`;

export default class Ecstaz {
  state = {
    data: { pages: {}, order: [] },
    editable: false,
    initialized: false,
    ready: false,
    currentPath: '',
    activePage: null,
    pageList: [],
    flash: '',
    flashTimer: null,
    editor: null,
    editorEl: null,
    editorPageKey: '',
    tiptap: null,
    dialog: { name: '', path: '', error: '', touchedPath: false },
  };

  actions = {
    init: async () => {
      let scope = this.state;
      if (!scope.initialized) {
        await this.actions.hydrate();
        scope.initialized = true;
      }
      await this.actions.syncFromLocation();
    },

    hydrate: async () => {
      let scope = this.state;
      let raw = localStorage.getItem('ecz:data');
      let parsed = {};
      try {
        parsed = raw ? JSON.parse(raw) : {};
      } catch (err) {
        parsed = {};
      }
      if (!parsed || typeof parsed !== 'object') parsed = {};
      if (!parsed.pages || typeof parsed.pages !== 'object') parsed.pages = {};
      if (!Array.isArray(parsed.order)) parsed.order = Object.keys(parsed.pages);
      scope.data = parsed;
      if (!scope.data.order.length) scope.data.order = Object.keys(scope.data.pages);
      if (!Object.keys(scope.data.pages).length) {
        scope.data = this.actions.seed();
        localStorage.setItem('ecz:editable', 1);
      }
      this.actions.ensureRoutes();
      scope.editable = Boolean(Number(localStorage.getItem('ecz:editable') || 0));
    },

    seed: () => {
      let key = 'pages/index.html';
      let data = { pages: {}, order: [key] };
      data.pages[key] = {
        title: 'Monochrome Atlas',
        heading: 'Map a crisp statement',
        subheading: 'Use this atelier to sculpt your static site.',
        body: defaultBody,
        route: '/',
      };
      return data;
    },

    ensureRoutes: () => {
      let scope = this.state;
      for (let key of Object.keys(scope.data.pages)) {
        let page = scope.data.pages[key];
        if (!page) continue;
        if (!page.route) page.route = this.actions.pathToRoute(key);
        if (!page.body) page.body = defaultBody;
        if (typeof page.subheading !== 'string') page.subheading = '';
        if (!page.heading) page.heading = page.title;
      }
    },

    syncFromLocation: async () => {
      let scope = this.state;
      let path = this.actions.computePath();
      if (!scope.data.pages[path]) {
        let fallback = path.endsWith('.html') ? path.slice(0, -5) : `${path}.html`;
        if (scope.data.pages[fallback]) path = fallback;
        else path = scope.data.order[0] || 'pages/index.html';
      }
      scope.currentPath = path;
      await this.actions.ensurePageRecord(path);
      scope.activePage = scope.data.pages[path];
      scope.ready = true;
      this.actions.refreshPageList();
      this.actions.setDocumentTitle();
      await this.actions.ensureEditor();
    },

    computePath: () => {
      let pathname = location.pathname.replace(/^\/+/, '');
      let parts = pathname ? pathname.split('/') : [];
      if (parts[0] === 'preview') parts = parts.slice(3);
      if (!parts.length || !parts[0]) parts = ['index.html'];
      return 'pages/' + parts.join('/');
    },

    ensurePageRecord: async path => {
      let scope = this.state;
      if (scope.data.pages[path]) return;
      let title = this.actions.titleFromPath(path);
      scope.data.pages[path] = {
        title,
        heading: title,
        subheading: '',
        body: defaultBody,
        route: this.actions.pathToRoute(path),
      };
      if (!scope.data.order.includes(path)) scope.data.order.push(path);
      this.actions.persist();
    },

    titleFromPath: path => {
      let clean = path.replace('pages/', '').replace(/\.html$/, '');
      let parts = clean.split(/[-_/]+/).filter(Boolean);
      let words = parts.map(x => x.slice(0, 1).toUpperCase() + x.slice(1));
      return words.join(' ') || 'Untitled Page';
    },

    pathToRoute: key => {
      let clean = key.replace(/^pages\//, '');
      if (clean === 'index.html' || clean === 'index') return '/';
      return '/' + clean;
    },

    refreshPageList: () => {
      let scope = this.state;
      let list = [];
      for (let key of scope.data.order) {
        let page = scope.data.pages[key];
        if (!page) continue;
        list.push({ key, title: page.title, route: page.route || this.actions.pathToRoute(key) });
      }
      scope.pageList = list;
    },

    setDocumentTitle: () => {
      let scope = this.state;
      if (!scope.activePage) return;
      let title = `${scope.activePage.title} — ecstaz`;
      document.title = title;
    },

    persist: () => {
      let scope = this.state;
      localStorage.setItem('ecz:data', JSON.stringify(scope.data));
    },

    attachEditor: el => {
      let scope = this.state;
      scope.editorEl = el;
      this.actions.ensureEditor();
    },

    detachEditor: () => {
      this.actions.destroyEditor();
      this.state.editorEl = null;
    },

    ensureEditor: async () => {
      let scope = this.state;
      if (!scope.editorEl || !scope.activePage) return;
      await this.actions.ensureTiptap();
      if (scope.editor) {
        if (scope.editorPageKey !== scope.currentPath) {
          scope.editor.commands.setContent(scope.activePage.body || defaultBody, false);
          scope.editorPageKey = scope.currentPath;
        }
        scope.editor.setEditable(Boolean(scope.editable));
        return;
      }
      if (!scope.tiptap) return;
      let editor = new scope.tiptap.Editor({
        element: scope.editorEl,
        extensions: [
          scope.tiptap.StarterKit.configure({ heading: { levels: [2, 3, 4] } }),
          scope.tiptap.Placeholder.configure({ placeholder: 'Sketch the next iteration…' }),
        ],
        editable: Boolean(scope.editable),
        injectCSS: false,
        content: scope.activePage.body || defaultBody,
        editorProps: {
          attributes: {
            class: 'tiptap prose prose-invert max-w-none min-h-[320px] outline-none',
          },
        },
        onUpdate: () => this.actions.captureBody(),
      });
      scope.editor = editor;
      scope.editorPageKey = scope.currentPath;
      editor.on('selectionUpdate', () => d.update());
      editor.on('transaction', () => d.update());
    },

    ensureTiptap: async () => {
      let scope = this.state;
      if (scope.tiptap) return;
      let core = await import('https://esm.sh/@tiptap/core@2.1.11?bundle');
      let starter = await import('https://esm.sh/@tiptap/starter-kit@2.1.11?bundle');
      let placeholder = await import('https://esm.sh/@tiptap/extension-placeholder@2.1.11?bundle');
      scope.tiptap = {
        Editor: core.Editor,
        StarterKit: starter.default,
        Placeholder: placeholder.default,
      };
    },

    captureBody: () => {
      let scope = this.state;
      if (!scope.editor || !scope.activePage) return;
      scope.activePage.body = scope.editor.getHTML();
      this.actions.persist();
    },

    destroyEditor: () => {
      let scope = this.state;
      if (!scope.editor) return;
      scope.editor.destroy();
      scope.editor = null;
      scope.editorPageKey = '';
    },

    updateHeading: event => {
      let scope = this.state;
      if (!scope.editable || !scope.activePage) return;
      scope.activePage.heading = event?.target?.innerText || '';
    },

    updateSubheading: event => {
      let scope = this.state;
      if (!scope.editable || !scope.activePage) return;
      scope.activePage.subheading = event?.target?.innerText || '';
    },

    dialogInput: (field, event) => {
      let scope = this.state;
      let value = event?.target?.value || '';
      if (field === 'name') {
        scope.dialog.name = value;
        if (!scope.dialog.touchedPath) scope.dialog.path = this.actions.slugify(value);
      }
      if (field === 'path') {
        scope.dialog.touchedPath = true;
        scope.dialog.path = this.actions.normalizePath(value);
      }
      scope.dialog.error = '';
    },

    slugify: value => {
      let lower = (value || '').toLowerCase();
      let cleaned = lower.replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
      if (!cleaned) cleaned = 'new-page';
      return `${cleaned}.html`;
    },

    normalizePath: value => {
      let lower = (value || '').toLowerCase().replace(/^\/+/, '');
      lower = lower.replace(/\.html?$/, '');
      let parts = lower.split('/').map(x => x.replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')).filter(Boolean);
      let joined = parts.join('/');
      if (!joined) joined = 'new-page';
      return `${joined}.html`;
    },

    resolveDialogPayload: () => {
      let scope = this.state;
      let name = (scope.dialog.name || '').trim() || 'Untitled Page';
      let path = scope.dialog.path ? this.actions.normalizePath(scope.dialog.path) : this.actions.slugify(name);
      let key = `pages/${path}`;
      let route = this.actions.pathToRoute(key);
      return { name, path, key, route };
    },

    validateNewPage: payload => {
      if (!payload.name) return 'Name is required';
      if (!payload.path) return 'Path is required';
      if (this.state.data.pages[payload.key]) return 'Page already exists';
      return '';
    },

    dialogSubmit: (type, event) => {
      if (!event) return;
      if (type === 'confirm') {
        if (event.submitter?.value !== 'ok') return;
        event.preventDefault();
        let dialog = event.target.closest('dialog');
        dialog?.close('ok');
        return;
      }
      if (type !== 'newPage') return;
      if (event.submitter?.value !== 'page') return;
      event.preventDefault();
      let payload = this.actions.resolveDialogPayload();
      let error = this.actions.validateNewPage(payload);
      if (error) {
        this.state.dialog.error = error;
        return;
      }
      this.state.dialog.error = '';
      let dialog = event.target.closest('dialog');
      if (dialog) {
        dialog.returnDetail = [payload];
        dialog.close('page');
      }
    },

    requestCreatePage: async () => {
      let scope = this.state;
      if (!scope.editable) return;
      scope.dialog = { name: '', path: '', error: '', touchedPath: false };
      let [intent, detail] = await showModal('NewPageDialog');
      if (intent !== 'page' || !detail) return;
      this.actions.addPage(detail);
      history.pushState(null, '', detail.route);
      await this.actions.syncFromLocation();
    },

    addPage: detail => {
      let scope = this.state;
      let key = detail.key;
      let title = detail.name;
      scope.data.pages[key] = {
        title,
        heading: title,
        subheading: '',
        body: defaultBody,
        route: detail.route,
      };
      scope.data.order.push(key);
      this.actions.persist();
      this.actions.refreshPageList();
    },

    requestArchivePage: async () => {
      let scope = this.state;
      if (!scope.editable) return;
      if (scope.data.order.length <= 1) {
        this.actions.flash('Keep at least one page published.');
        return;
      }
      let [intent] = await showModal('ConfirmationDialog', { title: `Archive page?` });
      if (intent !== 'ok') return;
      await this.actions.removePage(scope.currentPath);
    },

    removePage: async key => {
      let scope = this.state;
      delete scope.data.pages[key];
      scope.data.order = scope.data.order.filter(x => x !== key);
      this.actions.persist();
      this.actions.refreshPageList();
      let fallback = scope.data.order[0] || 'pages/index.html';
      history.pushState(null, '', this.actions.pathToRoute(fallback));
      await this.actions.syncFromLocation();
    },

    flash: message => {
      let scope = this.state;
      if (scope.flashTimer) clearTimeout(scope.flashTimer);
      scope.flash = message;
      scope.flashTimer = setTimeout(() => {
        scope.flash = '';
        scope.flashTimer = null;
        d.update();
      }, 2200);
    },

    teardown: () => {
      let scope = this.state;
      this.actions.destroyEditor();
      scope.editorEl = null;
      scope.ready = false;
    },

    selectPage: async key => {
      let scope = this.state;
      let page = scope.data.pages[key];
      if (!page) return;
      let route = page.route || this.actions.pathToRoute(key);
      history.pushState(null, '', route);
      await this.actions.syncFromLocation();
    },

    command: cmd => {
      let scope = this.state;
      if (!scope.editable || !scope.editor) return;
      let chain = scope.editor.chain().focus();
      switch (cmd) {
        case 'paragraph':
          chain.setParagraph();
          break;
        case 'h2':
          chain.toggleHeading({ level: 2 });
          break;
        case 'h3':
          chain.toggleHeading({ level: 3 });
          break;
        case 'ul':
          chain.toggleBulletList();
          break;
        case 'ol':
          chain.toggleOrderedList();
          break;
        case 'quote':
          chain.toggleBlockquote();
          break;
        case 'code':
          chain.toggleCodeBlock();
          break;
        case 'bold':
          chain.toggleBold();
          break;
        case 'italic':
          chain.toggleItalic();
          break;
        default:
          return;
      }
      chain.run();
      d.update();
    },
  };
}
