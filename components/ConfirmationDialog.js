export default class ConfirmationDialog {
  constructor(props) {
    this.props = props;
  }

  toggleAnimate(x) {
    this.animate = x;
    d.update();
  }

  submit(event) {
    if (!event) return;
    if (event.submitter?.value !== 'ok') return;
    event.preventDefault();
    let dialog = event.target.closest('dialog');
    dialog?.close('ok');
  }
}
