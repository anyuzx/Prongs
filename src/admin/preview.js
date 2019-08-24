import mdRender from '../_includes/js/mdRender.js';

const env = nunjucks.configure();

env.addFilter('mdFilter', mdRender.render)

const Preview = ({ entry, path, context }) => {
  const data = context(entry.get('data').toJS());
  const html = env.render(path, { ...data });
  return <div dangerouslySetInnerHTML={{ __html: html }}/>
}

const Post = ({ entry }) => {
  <Preview
    entry = {entry}
    path = "layouts/post.njk"
    context={({ title, date, tags, body }) => ({
      title,
      date,
      tags,
      content: mdFilter(body || ''),
    })}
  />
}

CMS.registerPreviewTemplate('posts', Post);
