var critical = require('critical')
var fg = require('fast-glob')

var htmlSources = fg.sync("dist/**/*.html")
console.log(htmlSources)

function startNewJob () {
  const source = htmlSources.pop()
  console.log(source)
  if (!source) {
    return Promise.resolve()
  }
  return critical.generate({
    css: ['dist/_includes/css/main.css', 'dist/_includes/css/atelier-forest-light.css'],
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
  .catch(err => {
    console.log("inline critical CSS for "+source+" failed!")
    console.log(err)
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
  .catch(error => {
    console.log(error)
  })
