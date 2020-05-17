var critical = require('critical')
var fg = require('fast-glob')

var htmlSources = fg.sync("dist/**/*.html")

function startNewJob () {
  const source = htmlSources.pop()
  if (!source) {
    return Promise.resolve()
  }
  return critical.generate({
    inline: true,
    src: source,
    target: {
      html: source
    }
  })
  .then(()=>{
    console.log("inline critical CSS for "+source+" succeed!")
    return startNewJob()
  })
}
/*
htmlSources.forEach(function(item){
  promises.push(critical.generate({
    inline: true,
    src: item,
    target: {
      html: item
    }
  }))
})
*/

Promise.all([
  startNewJob(),
  startNewJob(),
  startNewJob(),
  startNewJob(),
  startNewJob()
])
.then(()=>{
  console.log('all done!')
})
