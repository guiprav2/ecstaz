export default class Ecstaz {
  state = {
  	data: {},
    get editable() { return Boolean(localStorage.getItem('ecz:editable') || 0) },
    set editable(x) { localStorage.setItem('ecz:editable', x) },
  };
  actions = {
  	init: async () => {
      this.state.data = JSON.parse(localStorage.getItem('ecz:data') || '{}');
      if (!Object.keys(this.state.data).length) localStorage.setItem('ecz:editable', 1);
    },
    persist: () => localStorage.setItem('ecz:data', JSON.stringify(this.state.data)),
  };
}
