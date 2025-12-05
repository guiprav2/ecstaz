let defaultBody = `<p class="text-neutral-400">Begin drafting in this monochrome workspace.</p>`;
let paletteSections = [
  {
    id: 'ai',
    title: 'AI',
    items: [
      {
        id: 'ai-continue',
        label: 'Continue Writing',
        description: 'Let AI take the next step.',
        icon: 'nf-md-auto_fix',
        kind: 'ai',
        payload: 'continue',
      },
      {
        id: 'ai-ask',
        label: 'Ask AI',
        description: 'Brainstorm ideas with a prompt.',
        icon: 'nf-md-forum',
        kind: 'ai',
        payload: 'ask',
      },
    ],
  },
  {
    id: 'style',
    title: 'Style',
    items: [
      {
        id: 'style-text',
        label: 'Text',
        description: 'Plain paragraph styling.',
        icon: 'nf-md-format_paragraph',
        kind: 'command',
        payload: 'paragraph',
        activeKey: 'paragraph',
      },
      {
        id: 'style-h2',
        label: 'Heading 2',
        description: 'Medium heading size.',
        icon: 'nf-md-format_header_2',
        kind: 'command',
        payload: 'h2',
        activeKey: 'heading',
        activeAttrs: { level: 2 },
      },
      {
        id: 'style-h3',
        label: 'Heading 3',
        description: 'Compact heading.',
        icon: 'nf-md-format_header_3',
        kind: 'command',
        payload: 'h3',
        activeKey: 'heading',
        activeAttrs: { level: 3 },
      },
    ],
  },
  {
    id: 'list',
    title: 'Lists & Blocks',
    items: [
      {
        id: 'list-bullet',
        label: 'Bulleted List',
        description: 'Great for loose ideas.',
        icon: 'nf-md-format_list_bulleted',
        kind: 'command',
        payload: 'ul',
        activeKey: 'bulletList',
      },
      {
        id: 'list-numbered',
        label: 'Numbered List',
        description: 'Structure ordered steps.',
        icon: 'nf-md-format_list_numbered',
        kind: 'command',
        payload: 'ol',
        activeKey: 'orderedList',
      },
      {
        id: 'list-quote',
        label: 'Quote',
        description: 'Call attention to a pull quote.',
        icon: 'nf-md-format_quote_close',
        kind: 'command',
        payload: 'quote',
        activeKey: 'blockquote',
      },
      {
        id: 'list-code',
        label: 'Code',
        description: 'Drop in multi-line code.',
        icon: 'nf-md-code_tags',
        kind: 'command',
        payload: 'code',
        activeKey: 'codeBlock',
      },
    ],
  },
  {
    id: 'layout',
    title: 'Layouts & Embeds',
    items: [
      {
        id: 'layout-grid',
        label: 'CSS Grid',
        description: 'Insert a configurable column grid.',
        icon: 'nf-md-grid_large',
        kind: 'command',
        payload: 'grid',
      },
      {
        id: 'layout-hr',
        label: 'Separator',
        description: 'Divide sections with a clean rule.',
        icon: 'nf-md-minus',
        kind: 'command',
        payload: 'hr',
      },
      {
        id: 'layout-image',
        label: 'Image',
        description: 'Insert an image from URL or file.',
        icon: 'nf-md-image',
        kind: 'command',
        payload: 'image',
      },
      {
        id: 'layout-table',
        label: 'Table',
        description: 'Insert a 3×3 table.',
        icon: 'nf-md-table_large',
        kind: 'command',
        payload: 'table',
      },
      {
        id: 'layout-html',
        label: 'Custom HTML',
        description: 'Edit raw markup with inline preview.',
        icon: 'nf-md-code_braces',
        kind: 'command',
        payload: 'customHtml',
      },
    ],
  },
  {
    id: 'inline',
    title: 'Inline',
    items: [
      {
        id: 'inline-bold',
        label: 'Bold',
        description: 'Emphasize key words.',
        icon: 'nf-md-format_bold',
        kind: 'command',
        payload: 'bold',
        activeKey: 'bold',
      },
      {
        id: 'inline-italic',
        label: 'Italic',
        description: 'Softer emphasis.',
        icon: 'nf-md-format_italic',
        kind: 'command',
        payload: 'italic',
        activeKey: 'italic',
      },
    ],
  },
];

export default class Ecstaz {
  state = {
    data: { pages: {}, order: [] },
    editable: false,
    initialized: false,
    ready: false,
    currentPath: '',
    activePage: null,
    titleDraft: '',
    siteTitle: 'ECSTAZ',
    siteTitleDraft: 'ECSTAZ',
    pageList: [],
    flash: '',
    flashTimer: null,
    editor: null,
    editorEl: null,
    commandPaletteEl: null,
    paletteHostEl: null,
    editorPageKey: '',
    tiptap: null,
    dialog: { name: '', path: '', error: '', touchedPath: false },
    paletteSections,
    paletteLookup: {},
    paletteLookupBuilt: false,
    filteredPalette: [],
    commandFilter: '',
    commandPalette: { active: false, top: 0, left: 0, anchorPos: null },
    gridUi: { active: false, pos: null, cols: 0, gap: 1.5, widths: [], entries: [], left: 0, top: 0 },
    gridPanelEl: null,
    formatBar: { visible: false, left: 0, top: 0 },
    formatBarLocked: false,
    formatBarEl: null,
  };

  actions = {
    init: async () => {
      let scope = this.state;
      if (!scope.initialized) {
        await this.actions.hydrate();
        scope.initialized = true;
      }
      this.actions.preparePalette();
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
      if (typeof scope.data.siteTitle === 'string' && scope.data.siteTitle.trim()) scope.siteTitle = scope.data.siteTitle;
      scope.siteTitleDraft = scope.siteTitle;
    },

    preparePalette: () => {
      let scope = this.state;
      if (scope.paletteLookupBuilt) return;
      let lookup = {};
      for (let section of scope.paletteSections) {
        if (!section || !Array.isArray(section.items)) continue;
        for (let item of section.items) {
          lookup[item.id] = item;
        }
      }
      scope.paletteLookup = lookup;
      scope.paletteLookupBuilt = true;
      this.actions.applyPaletteFilter();
    },

    applyPaletteFilter: override => {
      let scope = this.state;
      let base = typeof override === 'string' ? override : scope.commandFilter;
      if (typeof override === 'string') scope.commandFilter = override;
      let term = (base || '').toLowerCase().trim();
      let filtered = [];
      for (let section of scope.paletteSections) {
        if (!section || !Array.isArray(section.items)) continue;
        let items = [];
        for (let item of section.items) {
          let haystack = `${item.label || ''} ${item.description || ''}`.toLowerCase();
          if (term && !haystack.includes(term)) continue;
          items.push(item);
        }
        if (items.length) filtered.push({ id: section.id, title: section.title, items });
      }
      scope.filteredPalette = filtered;
    },

    updateCommandFilter: event => {
      let value = event?.target?.value || '';
      this.actions.applyPaletteFilter(value);
    },

    resetCommandFilter: () => {
      this.actions.applyPaletteFilter('');
    },

    evaluateCommandPalette: () => {
      let scope = this.state;
      let editor = scope.editor;
      if (!editor || !scope.editable) {
        this.actions.closeCommandPalette({ focusEditor: false });
        return;
      }
      let selection = editor.state.selection;
      if (scope.commandPalette.active) {
        let anchor = scope.commandPalette.anchorPos;
        if (!selection.empty || typeof anchor !== 'number' || selection.from !== anchor) {
          this.actions.closeCommandPalette({ focusEditor: false });
          return;
        }
        this.actions.positionCommandPalette();
        return;
      }
      if (!selection.empty) {
        this.actions.closeCommandPalette({ focusEditor: false });
        return;
      }
      let $from = selection.$from;
      let parent = $from?.parent;
      if (!parent || parent.type?.name !== 'paragraph') {
        this.actions.closeCommandPalette({ focusEditor: false });
        return;
      }
      let text = parent.textContent || '';
      let atStart = $from.parentOffset === 1;
      if (text !== '/' || !atStart) {
        this.actions.closeCommandPalette({ focusEditor: false });
        return;
      }
      let from = Math.max(selection.from - 1, 0);
      let to = selection.from;
      this.actions.openCommandPalette({ from, to });
    },

    openCommandPalette: range => {
      let scope = this.state;
      if (!scope.editor || scope.commandPalette.active) return;
      let from = typeof range?.from === 'number' ? range.from : 0;
      let to = typeof range?.to === 'number' ? range.to : from;
      if (to < from) [from, to] = [to, from];
      scope.commandPalette = {
        active: true,
        top: 0,
        left: 0,
        anchorPos: from,
      };
      scope.editor
        .chain()
        .focus()
        .deleteRange({ from, to })
        .setTextSelection(from)
        .run();
      this.actions.resetCommandFilter();
      this.actions.positionCommandPalette();
    },

    closeCommandPalette: options => {
      let scope = this.state;
      if (!scope.commandPalette.active) return;
      scope.commandPalette = { active: false, top: 0, left: 0, anchorPos: null };
      this.actions.resetCommandFilter();
      if (options?.focusEditor && scope.editor) {
        setTimeout(() => {
          scope.editor?.commands?.focus?.();
        }, 0);
      }
    },

    positionCommandPalette: () => {
      let scope = this.state;
      if (!scope.editor || !scope.commandPalette.active) return;
      let anchor = scope.commandPalette.anchorPos;
      if (typeof anchor !== 'number') return;
      try {
        let coords = scope.editor.view.coordsAtPos(anchor);
        let host = scope.paletteHostEl?.getBoundingClientRect();
        if (!coords || !host) return;
        scope.commandPalette.top = coords.top - host.top;
        scope.commandPalette.left = coords.left - host.left;
      } catch (err) {
        // ignore positioning errors
      }
    },

    attachPaletteHost: el => {
      this.state.paletteHostEl = el;
      this.actions.positionCommandPalette();
      this.actions.syncInteractivePanels();
      this.actions.positionFormatBar();
    },

    detachPaletteHost: () => {
      this.state.paletteHostEl = null;
      this.actions.closeCommandPalette({ focusEditor: false });
      this.state.formatBar = { visible: false, left: 0, top: 0 };
    },

    attachCommandPaletteEl: el => {
      let scope = this.state;
      scope.commandPaletteEl = el;
      d.el(el, {
        style: {
          left: () => `${scope.commandPalette.left}px`,
          top: () => `${scope.commandPalette.top}px`,
        },
      });
      this.actions.positionCommandPalette();
    },

    detachCommandPaletteEl: () => {
      this.state.commandPaletteEl = null;
    },

    attachGridPanelEl: el => {
      let scope = this.state;
      scope.gridPanelEl = el;
      d.el(el, {
        style: {
          left: () => `${scope.gridUi.left}px`,
          top: () => `${scope.gridUi.top}px`,
        },
      });
    },

    detachGridPanelEl: () => {
      this.state.gridPanelEl = null;
    },

    attachFormatBarEl: el => {
      let scope = this.state;
      scope.formatBarEl = el;
      d.el(el, {
        style: {
          left: () => `${scope.formatBar.left}px`,
          top: () => `${scope.formatBar.top}px`,
        },
      });
      this.actions.positionFormatBar();
    },

    detachFormatBarEl: () => {
      this.state.formatBarEl = null;
    },

    formatBarPointerDown: event => {
      let scope = this.state;
      if (!scope.editable || !scope.formatBarEl || !scope.paletteHostEl) return;
      event?.preventDefault();
      event?.stopPropagation();
      scope.editor?.commands?.focus?.();
      let host = scope.paletteHostEl.getBoundingClientRect();
      let width = scope.formatBarEl.offsetWidth || 0;
      let height = scope.formatBarEl.offsetHeight || 0;
      let startX = event.clientX;
      let startY = event.clientY;
      let startLeft = scope.formatBar.left;
      let startTop = scope.formatBar.top;
      scope.formatBarLocked = true;
      let handleMove = e => {
        e.preventDefault();
        let dx = e.clientX - startX;
        let dy = e.clientY - startY;
        let left = startLeft + dx;
        let top = startTop + dy;
        let viewportWidth = window.innerWidth || host.width;
        let viewportHeight = window.innerHeight || host.height;
        let minLeft = -host.left + 8;
        let maxLeft = viewportWidth - host.left - width - 8;
        let minTop = -host.top - height;
        let maxTop = viewportHeight - host.top - height - 8;
        if (left < minLeft) left = minLeft;
        if (left > maxLeft) left = maxLeft;
        if (top < minTop) top = minTop;
        if (top > maxTop) top = maxTop;
        scope.formatBar = { ...scope.formatBar, left, top, visible: true };
        d.update();
      };
      let handleUp = () => {
        window.removeEventListener('pointermove', handleMove);
        window.removeEventListener('pointerup', handleUp);
        scope.formatBarLocked = false;
        d.update();
      };
      window.addEventListener('pointermove', handleMove);
      window.addEventListener('pointerup', handleUp);
    },

    formatBarKeep: event => {
      event?.preventDefault();
      event?.stopPropagation();
      this.state.editor?.commands?.focus?.();
    },

    commandFilterInputAttach: el => {
      requestAnimationFrame(() => el?.focus());
    },

    commandFilterInputDetach: () => {},

    commandFilterKeydown: event => {
      if (!event) return;
      if (event.key === 'Escape') {
        event.preventDefault();
        this.actions.closeCommandPalette({ focusEditor: true });
        return;
      }
      if (event.key === 'Backspace' && !(event.target?.value || '').length) {
        event.preventDefault();
        this.actions.closeCommandPalette({ focusEditor: true });
        return;
      }
      if (event.key === 'Enter') {
        event.preventDefault();
        let first = this.state.filteredPalette?.[0]?.items?.[0];
        if (first) this.actions.paletteSelect(first.id);
      }
    },

    seed: () => {
      let key = 'pages/index.html';
      let data = { pages: {}, order: [key], siteTitle: 'ECSTAZ' };
      data.pages[key] = {
        title: 'Monochrome Atlas',
        heading: '',
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
        if (typeof page.heading !== 'string') page.heading = '';
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
      scope.titleDraft = scope.activePage.title;
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
        heading: '',
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
        this.actions.evaluateCommandPalette();
        this.actions.positionFormatBar();
        this.actions.syncInteractivePanels();
        return;
      }
      if (!scope.tiptap) return;
      let editor = new scope.tiptap.Editor({
        element: scope.editorEl,
        extensions: [
          scope.tiptap.StarterKit.configure({ heading: { levels: [1, 2, 3, 4] } }),
          scope.tiptap.Placeholder.configure({ placeholder: 'Sketch the next iteration…' }),
          scope.tiptap.Table.configure({ resizable: true, allowTableNodeSelection: true }),
          scope.tiptap.TableRow,
          scope.tiptap.TableHeader,
          scope.tiptap.TableCell,
          scope.tiptap.Image,
          scope.tiptap.GridColumn,
          scope.tiptap.GridBlock,
          scope.tiptap.HtmlBlock,
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
      let handleEditorChange = () => {
        this.actions.evaluateCommandPalette();
        this.actions.positionFormatBar();
        this.actions.syncInteractivePanels();
        d.update();
      };
      editor.on('selectionUpdate', handleEditorChange);
      editor.on('transaction', handleEditorChange);
      editor.on('blur', () => {
        if (this.state.formatBarLocked) return;
        this.state.formatBar = { ...this.state.formatBar, visible: false };
        d.update();
      });
      this.actions.evaluateCommandPalette();
      this.actions.positionFormatBar();
      this.actions.syncInteractivePanels();
    },

    ensureTiptap: async () => {
      let scope = this.state;
      if (scope.tiptap) return;
      let core = await import('https://esm.sh/@tiptap/core@2.1.11?bundle');
      let starter = await import('https://esm.sh/@tiptap/starter-kit@2.1.11?bundle');
      let placeholder = await import('https://esm.sh/@tiptap/extension-placeholder@2.1.11?bundle');
      let image = await import('https://esm.sh/@tiptap/extension-image@2.1.11?bundle');
      let table = await import('https://esm.sh/@tiptap/extension-table@2.1.11?bundle');
      let tableRow = await import('https://esm.sh/@tiptap/extension-table-row@2.1.11?bundle');
      let tableCell = await import('https://esm.sh/@tiptap/extension-table-cell@2.1.11?bundle');
      let tableHeader = await import('https://esm.sh/@tiptap/extension-table-header@2.1.11?bundle');
      let { Node, mergeAttributes } = core;

      let encodeHtmlAttr = value => {
        try {
          return encodeURIComponent(value || '');
        } catch (err) {
          return value || '';
        }
      };
      let decodeHtmlAttr = value => {
        try {
          return decodeURIComponent(value || '');
        } catch (err) {
          return value || '';
        }
      };

      let GridColumn = Node.create({
        name: 'gridColumn',
        group: 'block',
        content: 'block+',
        defining: true,
        isolating: true,
        addAttributes() {
          return {
            colSpan: { default: 1 },
            rowSpan: { default: 1 },
          };
        },
        parseHTML() {
          return [
            {
              tag: 'div[data-grid-column]',
              getAttrs: dom => ({
                colSpan: Number(dom.getAttribute('data-colspan')) || 1,
                rowSpan: Number(dom.getAttribute('data-rowspan')) || 1,
              }),
            },
          ];
        },
        renderHTML({ HTMLAttributes }) {
          let { colSpan, rowSpan, ...rest } = HTMLAttributes;
          let spanX = colSpan || 1;
          let spanY = rowSpan || 1;
          let baseStyle = rest.style ? rest.style + ';' : '';
          return [
            'div',
            mergeAttributes(rest, {
              'data-grid-column': '',
              'data-colspan': spanX,
              'data-rowspan': spanY,
              class: 'wf-grid-column prose rounded-2xl bg-neutral-900/50 p-4 space-y-3 min-h-[120px]',
              style: `${baseStyle}grid-column: span ${spanX}; grid-row: span ${spanY};`,
            }),
            0,
          ];
        },
        addKeyboardShortcuts() {
          let handleDelete = () => {
            let editor = this.editor;
            let { state } = editor;
            let { selection } = state;
            if (!selection.empty) return false;
            let { $from } = selection;
              let schema = state.schema;
              let columnDepth = null;
              let blockDepth = null;
              for (let depth = $from.depth; depth >= 0; depth--) {
                let node = $from.node(depth);
                if (!columnDepth && node.type.name === 'gridColumn') columnDepth = depth;
                if (!blockDepth && node.type.name === 'gridBlock') blockDepth = depth;
              }
              if (columnDepth == null || blockDepth == null) return false;
              let parent = $from.parent;
              if (parent.textContent.length || $from.parentOffset !== 0) return false;
              let gridBlock = $from.node(blockDepth);
              let gridColumn = $from.node(columnDepth);
              let columnHasContent = false;
              gridColumn.descendants(child => {
                if (child.isText && child.text && child.text.trim().length) {
                  columnHasContent = true;
                  return false;
                }
                if (child.isAtom && !child.isText) {
                  columnHasContent = true;
                  return false;
                }
                return undefined;
              });
              if (columnHasContent) return false;
              let blockPos = blockDepth === 0 ? 0 : $from.before(blockDepth);
              let columnPos = columnDepth === 0 ? 0 : $from.before(columnDepth);
              let columnIndex = $from.index(blockDepth);
              let tr = state.tr;
              if (gridBlock.childCount <= 1) {
                tr.delete(blockPos, blockPos + gridBlock.nodeSize);
                tr.insert(blockPos, schema.nodes.paragraph.create());
                editor.view.dispatch(tr);
                return true;
              }
              tr.delete(columnPos, columnPos + gridColumn.nodeSize);
              let mappedBlockPos = tr.mapping.map(blockPos);
              let parseWidths = (raw, count) => {
                let values = typeof raw === 'string' && raw.length ? raw.split('|') : [];
                let list = [];
                for (let i = 0; i < count; i++) list.push((values[i] || '1fr').trim() || '1fr');
                return list;
              };
              let serializeWidths = arr => arr.map(x => (x || '1fr').trim() || '1fr').join('|');
              let widths = parseWidths(gridBlock.attrs.widths, gridBlock.childCount).filter((_, idx) => idx !== columnIndex);
              tr.setNodeMarkup(mappedBlockPos, undefined, {
                ...gridBlock.attrs,
                cols: gridBlock.childCount - 1,
                widths: serializeWidths(widths),
              });
            editor.view.dispatch(tr);
            return true;
          };
          return {
            Backspace: handleDelete,
            'Mod-Backspace': handleDelete,
          };
        },
      });

      let GridBlock = Node.create({
        name: 'gridBlock',
        group: 'block',
        content: 'gridColumn+',
        defining: true,
        addAttributes() {
          return {
            cols: { default: 2 },
            gap: { default: 1.5 },
            widths: { default: '' },
          };
        },
        parseHTML() {
          return [
            {
              tag: 'section[data-grid-block]',
              getAttrs: dom => {
                let cols = Number(dom.getAttribute('data-cols'));
                let gap = Number(dom.getAttribute('data-gap'));
                return {
                  cols: Number.isFinite(cols) ? cols : 2,
                  gap: Number.isFinite(gap) ? gap : 1.5,
                  widths: dom.getAttribute('data-widths') || '',
                };
              },
            },
          ];
        },
        renderHTML({ HTMLAttributes }) {
          let attrs = { ...HTMLAttributes };
          let cols = Number(attrs.cols) || 2;
          let gap = Number(attrs.gap) || 1.5;
          let widths = attrs.widths || '';
          delete attrs.cols;
          delete attrs.gap;
          delete attrs.widths;
          let templateParts = (widths || '').split('|').map(x => x.trim()).filter(Boolean);
          let template = templateParts.length
            ? templateParts.slice(0, cols).map(x => x || '1fr').join(' ')
            : `repeat(${cols}, minmax(0, 1fr))`;
          let style = `${attrs.style ? attrs.style + ';' : ''}--wf-grid-template:${template};--wf-grid-gap:${gap}rem;`;
          return [
            'section',
            mergeAttributes(attrs, {
              'data-grid-block': '',
              'data-cols': cols,
              'data-gap': gap,
              'data-widths': templateParts.join('|'),
              class: 'wf-grid-block not-prose border border-neutral-800 rounded-3xl bg-neutral-950/60 p-5 space-y-4',
              style,
            }),
            ['div', { class: 'wf-grid-inner grid', style: 'grid-template-columns: var(--wf-grid-template); gap: var(--wf-grid-gap);' }, 0],
          ];
        },
      });

      let HtmlBlock = Node.create({
        name: 'htmlBlock',
        group: 'block',
        atom: true,
        draggable: false,
        addAttributes() {
          return {
            html: {
              default: '<p class="text-neutral-500">Start crafting custom HTML…</p>',
            },
          };
        },
        parseHTML() {
          return [
            {
              tag: 'div[data-html-block]',
              getAttrs: dom => {
                let raw = dom.getAttribute('data-html') || '';
                return { html: raw ? decodeHtmlAttr(raw) : dom.innerHTML || '' };
              },
            },
          ];
        },
        renderHTML({ HTMLAttributes }) {
          let attrs = { ...HTMLAttributes };
          let html = attrs.html || '';
          delete attrs.html;
          return [
            'div',
            mergeAttributes(attrs, {
              'data-html-block': '',
              'data-html': encodeHtmlAttr(html),
              class: 'wf-html-block block',
            }),
          ];
        },
        addNodeView() {
          return ({ node, getPos, editor }) => {
            let dom = document.createElement('div');
            dom.setAttribute('data-html-block', '');
            dom.className = 'wf-html-block block';
            dom.contentEditable = 'false';

            let preview = document.createElement('div');
            preview.className = 'wf-html-preview';
            dom.append(preview);

            let editorShell = document.createElement('div');
            editorShell.className = 'wf-html-editor hidden border border-neutral-800 rounded-3xl bg-neutral-950/95 p-4 space-y-4 shadow-2xl';
            let header = document.createElement('div');
            header.className = 'flex items-center justify-between text-[11px] uppercase tracking-[0.35em] text-neutral-500';
            header.innerHTML = '<span>Custom HTML</span>';
            let doneBtn = document.createElement('button');
            doneBtn.type = 'button';
            doneBtn.className = 'px-3 py-1.5 rounded-full border border-neutral-800 text-[10px] tracking-[0.25em] uppercase text-neutral-300 hover:border-neutral-200 hover:text-neutral-50 transition-colors';
            doneBtn.textContent = 'Done';
            header.appendChild(doneBtn);

            let textarea = document.createElement('textarea');
            textarea.className = 'w-full bg-transparent text-neutral-100 text-sm font-mono leading-relaxed min-h-[200px] outline-none resize-vertical border border-neutral-800 rounded-2xl p-4 bg-neutral-900/60';
            textarea.spellcheck = false;
            textarea.value = node.attrs.html || '';

            editorShell.append(header, textarea);
            dom.append(editorShell);

            let editing = false;
            let renderPreview = () => {
              try {
                preview.innerHTML = textarea.value.trim() || '<p class="text-neutral-500">Drop HTML markup…</p>';
              } catch (err) {
                preview.textContent = textarea.value;
              }
            };
            renderPreview();

            let applyHtml = () => {
              let html = textarea.value.trim();
              let transaction = editor.state.tr.setNodeMarkup(getPos(), undefined, { ...node.attrs, html });
              editor.view.dispatch(transaction);
              renderPreview();
            };

            let updateMode = () => {
              if (editing) {
                preview.classList.add('hidden');
                editorShell.classList.remove('hidden');
              } else {
                preview.classList.remove('hidden');
                editorShell.classList.add('hidden');
              }
            };
            updateMode();

            let openEditor = () => {
              if (editing) return;
              editing = true;
              updateMode();
              requestAnimationFrame(() => textarea.focus());
            };

            let closeEditor = () => {
              if (!editing) return;
              editing = false;
              updateMode();
            };

            dom.addEventListener('click', ev => {
              if (!editing) {
                ev.preventDefault();
                ev.stopPropagation();
                openEditor();
              }
            });

            doneBtn.addEventListener('click', ev => {
              ev.stopPropagation();
              applyHtml();
              closeEditor();
            });

            textarea.addEventListener(
              'keydown',
              ev => {
                ev.stopPropagation();
              },
              true,
            );

            textarea.addEventListener('keydown', ev => {
              ev.stopPropagation();
              if ((ev.metaKey || ev.ctrlKey) && ev.key === 'Enter') {
                ev.preventDefault();
                applyHtml();
                closeEditor();
              }
              if (ev.key === 'Escape') {
                ev.preventDefault();
                closeEditor();
                return;
              }
            });

            return {
              dom,
              update(updatedNode) {
                if (updatedNode.type.name !== node.type.name) return false;
                node = updatedNode;
                textarea.value = node.attrs.html || '';
                if (!editing) renderPreview();
                return true;
              },
              stopEvent: event => {
                if (editorShell.contains(event.target) || textarea === event.target || preview === event.target || event.target === doneBtn) {
                  return true;
                }
                return false;
              },
              ignoreMutation: () => true,
            };
          };
        },
      });

      scope.tiptap = {
        Editor: core.Editor,
        StarterKit: starter.default,
        Placeholder: placeholder.default,
        Image: image.default,
        Table: table.default,
        TableRow: tableRow.default,
        TableCell: tableCell.default,
        TableHeader: tableHeader.default,
        GridBlock,
        GridColumn,
        HtmlBlock,
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
      this.actions.closeCommandPalette({ focusEditor: false });
      scope.editor.destroy();
      scope.editor = null;
      scope.editorPageKey = '';
      scope.formatBar = { visible: false, left: 0, top: 0 };
      scope.formatBarLocked = false;
    },

    updateHeading: event => {
      let scope = this.state;
      if (!scope.editable || !scope.activePage) return;
      let value = event?.target?.value ?? event?.target?.innerText ?? '';
      scope.activePage.heading = value;
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

    titleInput: event => {
      let scope = this.state;
      if (!scope.editable || !scope.activePage) return;
      scope.titleDraft = event?.target?.value ?? '';
    },

    titleInputFocus: event => {
      let scope = this.state;
      if (!scope.activePage) return;
      scope.titleDraft = scope.activePage.title;
      if (event?.target) event.target.value = scope.titleDraft;
    },

    titleInputBlur: event => {
      let scope = this.state;
      if (!scope.editable || !scope.activePage) return;
      let value = (scope.titleDraft || '').trim();
      if (!value) {
        scope.titleDraft = scope.activePage.title;
        if (event?.target) event.target.value = scope.titleDraft;
        return;
      }
      if (value === scope.activePage.title) return;
      scope.activePage.title = value;
      this.actions.refreshPageList();
      this.actions.persist();
    },

    siteTitleInput: event => {
      if (!this.state.editable) return;
      this.state.siteTitleDraft = event?.target?.value ?? '';
    },

    siteTitleFocus: event => {
      if (event?.target) event.target.value = this.state.siteTitle;
      this.state.siteTitleDraft = this.state.siteTitle;
    },

    siteTitleBlur: event => {
      if (!this.state.editable) return;
      let value = (this.state.siteTitleDraft || '').trim();
      if (!value) {
        this.state.siteTitleDraft = this.state.siteTitle;
        if (event?.target) event.target.value = this.state.siteTitle;
        return;
      }
      if (value === this.state.siteTitle) return;
      this.state.siteTitle = value;
      this.state.siteTitleDraft = value;
      this.state.data.siteTitle = value;
      this.actions.persist();
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
        heading: '',
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

    paletteSelect: id => {
      let scope = this.state;
      if (!scope.editable) return;
      let item = scope.paletteLookup[id];
      if (!item) return;
      if (item.kind === 'command') {
        this.actions.command(item.payload);
        this.actions.closeCommandPalette({ focusEditor: true });
        return;
      }
      if (item.kind === 'ai') {
        let message = item.payload === 'continue' ? 'AI drafting coming soon.' : 'Ask AI will arrive shortly.';
        this.actions.flash(message);
        this.actions.closeCommandPalette({ focusEditor: true });
      }
    },

    insertGridBlock: () => {
      let scope = this.state;
      if (!scope.editable || !scope.editor) return;
      let payload = this.actions.createGridNode(2);
      scope.editor.chain().focus().insertContent(payload).run();
      this.actions.syncInteractivePanels();
      d.update();
    },

    insertTable: () => {
      let scope = this.state;
      if (!scope.editable || !scope.editor) return;
      scope.editor
        .chain()
        .focus()
        .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
        .run();
      d.update();
    },

    createGridNode: cols => {
      let safeCols = Math.min(Math.max(Math.round(Number(cols) || 1), 1), 4);
      let columns = [];
      for (let i = 0; i < safeCols; i++) {
        columns.push({
          type: 'gridColumn',
          attrs: { colSpan: 1, rowSpan: 1 },
          content: [
            {
              type: 'paragraph',
              content: [{ type: 'text', text: `Column ${i + 1} — start writing here.` }],
            },
          ],
        });
      }
      return {
        type: 'gridBlock',
        attrs: { cols: safeCols, gap: 1.5, widths: '' },
        content: columns,
      };
    },

    insertCustomHtmlBlock: () => {
      let scope = this.state;
      if (!scope.editable || !scope.editor) return;
      let sample = '<section class="space-y-2"><h3 class="uppercase tracking-[0.35em] text-[12px] text-neutral-400">Custom Block</h3><p class="text-neutral-100">Replace this HTML with your own markup.</p></section>';
      scope.editor
        .chain()
        .focus()
        .insertContent({ type: 'htmlBlock', attrs: { html: sample } })
        .run();
    },

    insertImage: async () => {
      let scope = this.state;
      if (!scope.editable || !scope.editor) return;
      let input = prompt('Paste image URL or leave blank to choose a file:', '');
      let src = (input || '').trim();
      if (!src) {
        try {
          let file = await selectFile('image/*');
          if (!file) return;
          let reader = new FileReader();
          reader.onload = () => {
            let result = reader.result;
            if (!result) return;
            scope.editor.chain().focus().setImage({ src: result }).run();
          };
          reader.readAsDataURL(file);
        } catch (err) {
          this.actions.flash('Unable to load image.');
        }
        return;
      }
      scope.editor.chain().focus().setImage({ src }).run();
    },

    syncInteractivePanels: () => {
      let detail = this.actions.findActiveGridBlock();
      if (!detail) {
        this.state.gridUi = { active: false, pos: null, cols: 0, gap: 1.5, widths: [], entries: [], left: 0, top: 0 };
        return;
      }
      let widths = this.actions.parseGridWidths(detail.node.attrs.widths, detail.node.childCount);
      let left = 0;
      let top = 0;
      let host = this.state.paletteHostEl?.getBoundingClientRect();
      if (this.state.editor && host) {
        try {
          let dom = this.state.editor.view.nodeDOM(detail.pos);
          if (dom?.getBoundingClientRect) {
            let rect = dom.getBoundingClientRect();
            left = rect.left - host.left;
            top = rect.bottom - host.top + 12;
          }
        } catch (err) {
          left = 0;
          top = 0;
        }
      }
      let entries = widths.map((width, idx) => {
        let child = detail.node.child(idx);
        return {
          width,
          idx,
          colSpan: child.attrs.colSpan || 1,
          rowSpan: child.attrs.rowSpan || 1,
        };
      });
      this.state.gridUi = {
        active: true,
        pos: detail.pos,
        cols: detail.node.childCount,
        gap: Number(detail.node.attrs.gap) || 1.5,
        widths,
        entries,
        left,
        top,
      };
    },

    findActiveGridBlock: () => {
      let editor = this.state.editor;
      if (!editor) return null;
      let { $from } = editor.state.selection;
      for (let depth = $from.depth; depth >= 0; depth--) {
        let node = $from.node(depth);
        if (node.type?.name === 'gridBlock') {
          let pos = depth === 0 ? 0 : $from.before(depth);
          return { node, pos };
        }
      }
      return null;
    },

    parseGridWidths: (raw, count) => {
      let values = typeof raw === 'string' && raw.length ? raw.split('|') : [];
      let list = [];
      for (let i = 0; i < count; i++) {
        list.push((values[i] || '1fr').trim() || '1fr');
      }
      return list;
    },

    serializeGridWidths: arr => arr.map(x => (x || '1fr').trim() || '1fr').join('|'),

    withGridNode: handler => {
      let scope = this.state;
      if (!scope.editor) return;
      let pos = scope.gridUi?.pos;
      if (typeof pos !== 'number') return;
      scope.editor
        .chain()
        .focus()
        .command(({ state, tr }) => {
          let node = state.doc.nodeAt(pos);
          if (!node || node.type.name !== 'gridBlock') return false;
          return handler({ state, tr, node, pos });
        })
        .run();
    },

    gridSetColumns: value => {
      let count = Math.min(Math.max(Math.round(Number(value) || 1), 1), 4);
      this.actions.withGridNode(({ state, tr, node, pos }) => {
        let columnType = state.schema.nodes.gridColumn;
        let paragraphType = state.schema.nodes.paragraph;
        if (!columnType || !paragraphType) return false;
        let widths = this.actions.parseGridWidths(node.attrs.widths, Math.max(node.childCount, count));
        if (count > node.childCount) {
          let insertPos = pos + node.nodeSize - 1;
          for (let i = node.childCount; i < count; i++) {
            let paragraph = paragraphType.create({}, state.schema.text(`Column ${i + 1}`));
            let column = columnType.create({ colSpan: 1, rowSpan: 1 }, paragraph);
            tr.insert(insertPos, column);
            insertPos += column.nodeSize;
            widths[i] = '1fr';
          }
        } else if (count < node.childCount) {
          let deletePos = pos + node.nodeSize - 1;
          for (let i = node.childCount; i > count; i--) {
            let child = node.child(i - 1);
            deletePos -= child.nodeSize;
            tr.delete(deletePos, deletePos + child.nodeSize);
          }
        }
        let attrs = {
          ...node.attrs,
          cols: count,
          widths: this.actions.serializeGridWidths(widths.slice(0, count)),
        };
        tr.setNodeMarkup(pos, undefined, attrs);
        return true;
      });
      this.actions.syncInteractivePanels();
      d.update();
    },

    gridSetGap: value => {
      let gap = Math.min(Math.max(Number(value) || 1.5, 0.25), 6);
      this.actions.withGridNode(({ tr, node, pos }) => {
        tr.setNodeMarkup(pos, undefined, { ...node.attrs, gap });
        return true;
      });
      this.actions.syncInteractivePanels();
      d.update();
    },

    gridSetColumnWidth: (index, raw) => {
      let idx = Number(index);
      if (!Number.isFinite(idx)) return;
      this.actions.withGridNode(({ tr, node, pos }) => {
        if (idx < 0 || idx >= node.childCount) return false;
        let widths = this.actions.parseGridWidths(node.attrs.widths, node.childCount);
        widths[idx] = (raw || '').trim() || '1fr';
        tr.setNodeMarkup(pos, undefined, { ...node.attrs, widths: this.actions.serializeGridWidths(widths) });
        return true;
      });
      this.actions.syncInteractivePanels();
      d.update();
    },

    gridSetColumnSpan: (index, value) => {
      let idx = Number(index);
      if (!Number.isFinite(idx)) return;
      let span = Math.min(Math.max(Math.round(Number(value) || 1), 1), 4);
      this.actions.withGridNode(({ tr, node, pos }) => {
        if (idx < 0 || idx >= node.childCount) return false;
        let offset = pos + 1;
        for (let i = 0; i < node.childCount; i++) {
          let child = node.child(i);
          if (i === idx) {
            tr.setNodeMarkup(offset, undefined, { ...child.attrs, colSpan: span });
            break;
          }
          offset += child.nodeSize;
        }
        return true;
      });
      this.actions.syncInteractivePanels();
      d.update();
    },

    gridSetRowSpan: (index, value) => {
      let idx = Number(index);
      if (!Number.isFinite(idx)) return;
      let span = Math.min(Math.max(Math.round(Number(value) || 1), 1), 4);
      this.actions.withGridNode(({ tr, node, pos }) => {
        if (idx < 0 || idx >= node.childCount) return false;
        let offset = pos + 1;
        for (let i = 0; i < node.childCount; i++) {
          let child = node.child(i);
          if (i === idx) {
            tr.setNodeMarkup(offset, undefined, { ...child.attrs, rowSpan: span });
            break;
          }
          offset += child.nodeSize;
        }
        return true;
      });
      this.actions.syncInteractivePanels();
      d.update();
    },

    gridUiChangeCols: event => {
      let value = event?.target?.value ?? event;
      this.actions.gridSetColumns(value);
    },

    gridUiChangeGap: event => {
      let value = event?.target?.value ?? event;
      this.actions.gridSetGap(value);
    },

    gridUiChangeWidth: (index, event) => {
      let value = event?.target?.value ?? event;
      this.actions.gridSetColumnWidth(index, value);
    },

    gridUiChangeColSpan: (index, event) => {
      let value = event?.target?.value ?? event;
      this.actions.gridSetColumnSpan(index, value);
    },

    gridUiChangeRowSpan: (index, event) => {
      let value = event?.target?.value ?? event;
      this.actions.gridSetRowSpan(index, value);
    },

    bindGridInput: (field, el) => {
      if (!el || !field) return;
      d.el(el, {
        value: () => {
          let panel = this.state.gridUi || {};
          let val = panel[field];
          return typeof val === 'number' ? String(val) : val ?? '';
        },
      });
    },

    bindGridWidthInput: (index, el) => {
      if (!el) return;
      d.el(el, {
        value: () => {
          let widths = this.state.gridUi?.widths || [];
          return widths[index] ?? '';
        },
      });
    },

    positionFormatBar: () => {
      let scope = this.state;
      if (!scope.editable || !scope.editor || !scope.paletteHostEl) {
        scope.formatBar = { visible: false, left: 0, top: 0 };
        return;
      }
      if (!scope.editor.view.hasFocus()) {
        scope.formatBar = { visible: false, left: 0, top: 0 };
        return;
      }
      let host = scope.paletteHostEl.getBoundingClientRect();
      if (scope.formatBarLocked) return;
      try {
        let left = host.width / 2;
        let width = scope.formatBarEl?.offsetWidth || 0;
        if (width) {
          left -= width / 2;
          let maxLeft = host.width - width;
          if (maxLeft < 0) maxLeft = 0;
          if (left < 0) left = 0;
          if (left > maxLeft) left = maxLeft;
        }
        let top = -64;
        scope.formatBar = { visible: true, left, top };
      } catch (err) {
        scope.formatBar = { visible: false, left: 0, top: 0 };
      }
    },

    command: cmd => {
      let scope = this.state;
      if (!scope.editable || !scope.editor) return;
      let chain = scope.editor.chain().focus();
      switch (cmd) {
        case 'h1':
          chain.toggleHeading({ level: 1 });
          break;
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
        case 'grid':
          chain.run();
          this.actions.insertGridBlock();
          d.update();
          return;
        case 'table':
          chain.run();
          this.actions.insertTable();
          d.update();
          return;
        case 'hr':
          chain.setHorizontalRule();
          break;
        case 'image':
          this.actions.insertImage();
          d.update();
          return;
        case 'customHtml':
          chain.run();
          this.actions.insertCustomHtmlBlock();
          d.update();
          return;
        default:
          return;
      }
      chain.run();
      d.update();
    },
  };
}
