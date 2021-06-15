// dynamically load the script on demand
class ScriptLoader {
  constructor(script) {
    this.script = script;
    this.scriptElement = document.createElement('script');
    this.head = document.querySelector('head');
  }

  load () {
    return new Promise((resolve, reject) => {
      this.scriptElement.src = this.script;
      this.scriptElement.onload = e => resolve(e);
      this.scriptElement.onerror = e => reject(e);
      this.head.appendChild(this.scriptElement);
    });
  }
}

// async function to fetch the raw content of the gist
async function fetchGist () {
  const gistID = 'ea4b6c8e831ff923640aeda185241d14'
  const url = `https://api.github.com/gists/${gistID}`
  const fileName = "random_walk_2d.py"

  var rawContent = await fetch(url)
                          .then(res => res.json())
                          .then(data => {return data.files[fileName].content})

  return rawContent
}

// placehold plot
function placeholderPlot() {
  Plotly.newPlot(
    'plot_div',
    [{x:[0],y:[0],mode:'markers',type:'scatter',marker:{size: 30}}],
    {
      title: '2D Random Walk',
      xaxis: {
        title: 'x'
      },
      yaxis: {
        title: 'y'
      },
      autosize: true,
      margin: {
        l: 40,
        r: 40,
        b: 40,
        t: 40
      }
    }
  )
}

// initialize animation
function initPlot(x, y) {
  Plotly.react(
    'plot_div',
    [{x:[0],y:[0],mode:'markers',type: 'scatter',marker:{size:30}},{x:[0],y:[0],mode:'lines',type:'scatter'}],
    {
      title: '2D Random Walk',
      showlegend: false,
      xaxis: {
        title: 'x',
        range: [Math.min(...x) - 10, Math.max(...x) + 10]
      },
      yaxis: {
        title: 'y',
        range: [Math.min(...y) - 10, Math.max(...y) + 10]
      },
      autosize: true,
      margin: {
        l: 40,
        r: 40,
        b: 40,
        t: 40
      }
    }
  )
}

// start animation
function startAnimate(x, y) {
  traceHead = {
    x: x.slice(0,i).slice(-1),
    y: y.slice(0,i).slice(-1)
  };
  traceTail = {
    x: x.slice(0,i),
    y: y.slice(0,i)
  };
  if (i <= x.length) {
    Plotly.animate('plot_div',
    {
      data: [traceHead, traceTail]
    }
    ,{
      transition: {
        duration: 0
      },
      frame: {
        duration: 0,
        redraw: false
      }
    });
    requestID = requestAnimationFrame(function(){startAnimate(x,y)});
  };
  i = i + 1;
}

// reset the plot
function resetAnimate() {
  i = 0;
  reset = true;
  cancelAnimationFrame(requestID);
  placeholderPlot();
}

// pause the animation
function pauseAnimation() {
  cancelAnimationFrame(requestID);
}


// initialize pyodide
// load numpy package
// make buttonRunRandomWalk clickable
function initPyodide() {
  loadingIndicator.classList.add('mr-2', 'progressAnimate');
  loader.load()
    .then(e => {
      loadPyodide.then(() => {
        pyodide.loadPackage('numpy').then(() => {
          console.log("Numpy is now available");
          // reset styles of buttons
          loadingIndicator.classList.remove('mr-2', 'progressAnimate');
          buttonReset.removeAttribute('disabled');
          buttonStart.removeAttribute('disabled');
          buttonPause.removeAttribute('disabled');
          buttonReset.classList.remove('opacity-50','cursor-not-allowed');
          buttonStart.classList.remove('opacity-50','cursor-not-allowed');
          buttonPause.classList.remove('opacity-50','cursor-not-allowed');
          buttonReset.classList.add('bg-green-300');
          buttonStart.classList.add('bg-green-300');
          buttonPause.classList.add('bg-green-300');
        })
      })
    })
    .catch(e => {console.log(e)})
}

// this function return the promise of pyodide runPython function
function generateRandomWalk(stepNumber) {
  return gistFetchPromise
  .then(res => pyodide.runPython(res))
  .then(_ => {
    return pyodide.globals.walk(stepNumber);
  })
}

// this function execute the animation
function runRandomWalk(stepNumber) {
  // depends on whether reset button is pressed
  // if resetted, then generate a new random walk trajectory
  // otherwise resume the animation
  if (reset) {
    reset = false;
    randomWalkPromise = generateRandomWalk(stepNumber);
    randomWalkPromise.then(res => {
      var [x,y] = res;
      initPlot(x,y);
      startAnimate(x,y);
    })
  } else {
    randomWalkPromise.then(res=> {
      var [x,y] = res;
      startAnimate(x,y);
    })
  }
}

// create new loader object
const loader = new ScriptLoader('/_includes/js/pyodide.js')
// select buttons, loading indicator and input field
const buttonInitPyodide = document.querySelector("#initPyodide");
const loadingIndicator = document.querySelector('#loadingIndicator');
const inputStepNumber = document.querySelector("#stepNumber");
const buttonReset = document.querySelector("#reset");
const buttonStart = document.querySelector("#start");
const buttonPause = document.querySelector("#pause");

// add event listener
// button for initializing pyodide
buttonInitPyodide.addEventListener('click', initPyodide, {once: true});
// button for resetting the plot
buttonReset.addEventListener('click', resetAnimate);
// button for run python code and animation
// note that we need to use parseInt here since the input value is string
buttonStart.addEventListener('click', () => {runRandomWalk(parseInt(inputStepNumber.value))});
buttonPause.addEventListener('click', pauseAnimation);

// perform the gist fetching
let gistFetchPromise = fetchGist();

// placeholder plot
placeholderPlot();

var reset = true;
var i = 0;
var requestID;
var randomWalkPromise;
var traceTail;
var traceHead;
