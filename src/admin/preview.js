import mdRender from '../_includes/js/mdRender.js';
//https://github.com/developit/htm
import htm from 'https://unpkg.com/htm?module';
//'h' here is short hand for React.createElement
const html = htm.bind(h);

var Post = createClass({
  render() {
    const entry = this.props.entry;
    const bodyRendered = mdRender.render(entry.getIn(["data", "body"]));

    return html`
    <body>
      <main>
        <article>
          <h1>${entry.getIn(["data", "title"], null)}</h1>
          <div dangerouslySetInnerHTML=${{__html: bodyRendered}}></div>
        </article>
      </main>
      <script src="https://unpkg.com/prismjs@1.17.1/components/prism-core.min.js"></script>
      <script src="https://unpkg.com/prismjs@1.17.1/plugins/autoloader/prism-autoloader.min.js"></script>
    </body>
    `;
  }
});

CMS.registerPreviewTemplate('posts', Post);
