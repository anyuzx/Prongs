// https://github.com/developit/htm
// import htm from 'https://unpkg.com/htm?module'
import htm from 'htm'
const mdRender = require('../utilities/lib/mdRender.js')
//import mdRender from './util.js';
// 'h' here is short hand for React.createElement
const html = htm.bind(h)

var Post = createClass({
  render () {
    const entry = this.props.entry
    const title = entry.getIn(['data', 'title'], null)
    const body = entry.getIn(['data', 'body'], null)
    const bodyRendered = mdRender.render(body || '')

    return html`
    <body>
      <main>
        <article>
          <h1>${title}</h1>
          <div dangerouslySetInnerHTML=${{ __html: bodyRendered }}></div>
        </article>
      </main>
    </body>
    `
  }
})

CMS.registerPreviewTemplate('posts', Post)
