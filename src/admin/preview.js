//import mdRender from '../_includes/js/mdRender.js';
import htm from 'https://unpkg.com/htm?module'; //https://github.com/developit/htm

const html = htm.bind(h); //'h' here is short hand for React.createElement

var Post = createClass({
  render() {
    const entry = this.props.entry;

    return html`
      <main>
        <article>
          <h1>${entry.getIn(["data", "title"], null)}</h1>
          ${entry.getIn(["data", "body"])}
          ${this.props.widgetFor("body")}
        </article>
      </main>
    `;
  }
});

CMS.registerPreviewTemplate('posts', Post);
