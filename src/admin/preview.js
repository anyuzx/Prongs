import mdRender from '../_includes/js/mdRender.js';
import htm from 'https://unpkg.com/htm?module'; //https://github.com/developit/htm

const html = htm.bind(h); //'h' here is short hand for React.createElement

var Post = createClass({
  render() {
    const entry = this.props.entry;
    const bodyRendered = mdRender.render(entry.getIn(["data", "body"]));

    return html`
      <main>
        <article>
          <h1>${entry.getIn(["data", "title"], null)}</h1>
          <div dangerouslySetInnerHTML=${{__html: bodyRendered}}></div>
          ${this.props.widgetFor("body")}
        </article>
      </main>
    `;
  }
});

CMS.registerPreviewTemplate('posts', Post);
