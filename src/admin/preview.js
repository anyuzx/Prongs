import mdRender from './util.js';
//https://github.com/developit/htm
import htm from 'https://unpkg.com/htm?module';
//'h' here is short hand for React.createElement
const html = htm.bind(h);

var Post = createClass({
  render() {
    const entry = this.props.entry;

    try {
      const bodyRendered = mdRender.render(entry.getIn(["data", "body"]));
    } catch (err) {
      const bodyRendered = '';
    }

    return html`
    <body>
      <main>
        <article>
          <h1>${entry.getIn(["data", "title"], null)}</h1>
          <div dangerouslySetInnerHTML=${{__html: bodyRendered}}></div>
        </article>
      </main>
    </body>
    `;
  }
});

CMS.registerPreviewTemplate('posts', Post);
