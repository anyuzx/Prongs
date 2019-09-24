---
slug: run-a-random-walker-in-your-website-using-pyodide
title: Run a random walker in your website using Pyodide
date: 2019-09-23
image:
  path: /assets/images/random-walker.svg
  description: a two-dimensional random walker trajectory
excerpt: Ever wondering is it possible embed scientific python codes and let user interact with it directly in your website? In this post, I demonstrate how to use **Pyodide** to execute python code inside the browser using an example of 2D random walker.
---

{% set randomWalkPyodide %}
  {% include "js/random-walk-pyodide.js" %}
{% endset %}

{% block head %}
  <script src="https://cdn.plot.ly/plotly-latest.min.js"></script>
{% endblock %}

::: note
Skip to the bottom of this page to see the [demonstration](#demonstration).
:::

Since I got this site running, I have been wanting to be able to embed some kind of interactive plot in my blog post. For instance, say I want the user to be able to perform some machine learning computations and then visualize the result. Currently, there are a few options to achieve this,

* **Pure Javascript solution**. Both computation and visualization are performed using javascript. This process can either happens on the server or in the browser.

* **Combination of python and javascript**
  * either the computation is done with python but happens on a server,
  * or the computation is done with python *directly* in the browser.
  * Any communication with DOM such as visualization is through javascript or API in python.

I have always been amazed by things people can do with javascript, such as [deep learning using javascript inside your browser](https://playground.tensorflow.org/#activation=tanh&batchSize=10&dataset=circle&regDataset=reg-plane&learningRate=0.03&regularizationRate=0&noise=0&networkShape=4,2&seed=0.20450&showTestData=false&discretize=false&percTrainData=50&x=true&y=true&xTimesY=false&xSquared=false&ySquared=false&cosX=false&sinX=false&cosY=false&sinY=false&collectStats=false&problem=classification&initZero=false&hideText=false). But I can't imagine javascript taking over python in scientific computing in near future. I, personally, am much more comfortable with python. Besides, the language has a much more mature scientific library ecosystem. To be able to use python to perform the computation part is essential, hence leaving us only with the second option, which is that python code runs either on a server or directly inside the browser. 


Using a server to perform computations means communication with the server. This can have some drawbacks,

* Depends on the usage, one may need to pay for the server.
* Communication overhead can cause delays in user interaction.

With my experience with [Binder](https://mybinder.org/), the second point can be a dealbreaker. The solution would be simple. Just eliminate the server step! However, since for a long time javascript is the only programming language the browser can interpret directly. No server means that we need to find some way to run python code in the browser directly. There are quite a [few options](https://pythontips.com/2019/05/22/running-python-in-the-browser/), such as [PyPy.js](http://pypyjs.org/). However it is not possible to use Numpy, Pandas and many other scientific/data analysis libraries in the browser until the [**Pyodide**](https://github.com/iodide-project/pyodide) project came out recently. Pyodide allows python code to run inside the browser through [**WebAssembly**](https://developer.mozilla.org/en-US/docs/WebAssembly). The best thing is that it allows one to use a few most popular scientific libraries including Numpy, Matplotlib, Pandas, Scipy and even Scikit-learn inside the browser! In fact, to my understanding, any python libraries in principle can be used through Pyodide. I am by no means expert on how Pyodide works. I suggest reading their [blog post](https://hacks.mozilla.org/2019/04/pyodide-bringing-the-scientific-python-stack-to-the-browser/) and checking out the project [github repository](https://github.com/iodide-project/pyodide).

I have been experimenting with Pyodide for a few days. In this post, I would like to give a proof-of-concept demonstration. Since I deal with random walks a lot in my research, I would like to make a simple random walk animation demonstration which

* allows users to specify the number of the steps
* calculate the random walk trajectory in the browser on the fly
* animate the generated trajectory of the random walk

In this example, I will use python code to generate the trajectory of a simple 2D random walker and use [plotly.js](https://plot.ly/javascript/) to handle the visualization.


## Python code for 2D random walker 
For demonstration purpose, the random walk in this example is simple,

* It is a two-dimensional walk
* At each step, the displacement along the $x$ and $y$ dimensions are independent and drawn from a gaussian distribution with mean zero and unit variance.
* The number of steps is specified beforehand

Here is the python code for generating such random walk,

::: note
The following code can be certainly rewritten in javascript, but the simplicity of python's syntax and its ecosystem of scientific libraries greatly lower the barrier of writing code for more complex computation compared to other languages (*this is just my opinion*).
:::

```python
# load numpy library 
import numpy as np

# function for generating random walk
# it takes the number of steps as only parameter
def walk(n):
    # check if the number of steps is an integer
    if int(n) != n:
        print('number of steps should be an integer')
        return None
    # the initial position is (0,0)
    xy_0 = np.array([0.0, 0.0])
    # generate displacements of each step
    dxdy = np.random.randn(int(n), 2)
    # cumulative sum displacement to get positions at each step
    xy = xy_0 + np.cumsum(dxdy, axis=0)
    # insert the initial position at the head of the array
    xy = np.vstack((xy_0, xy))
    # since javascript has no 2D array, it is better to
    # return the x-position and y-position, separately
    return xy[:,0], xy[:,1]
```

## Call our python function inside the browser

Now we would like to be able to call this python code in the browser on demand. The browser then does the calculation and get two arrays which contain the $x$ coordinates and $y$ coordinates. Then we can use plotly.js to animate the trajectory.

For better maintainability, I suggest to put python code in a [github gist](https://gist.github.com/anyuzx/ea4b6c8e831ff923640aeda185241d14) and fetch the content on the fly. It also has an extra benefit that it allows the modification of python code without rebuilding the site.

Before I continue, I would like to point out that one of the biggest problems of Pyodide is that it is very **large**. To use it, the browser needs to download about 24 Mb code and Numpy library needs another 8 Mb which leads to a total of 32 Mb download size. I want the user to download the Pyodide only when they want to. To achieve this, I dynamically load the Pyodide script only when the initialization button is clicked (see [demonstration](#demonstration) below).

The python code is called through

```js
gistFetchPromise.then(res => {pyodide.runPython(res)})
```

where `gistFetchPromise` is the promise object of fetching the gist content. Note that the python code needed to be parsed as a raw string. The `pyodide.runPython()` function is called to execute the python code. Once it is executed, all the python objects are available in the browser. The defined python function `walk` can be accessed through `pyodide.globals.walk`. Here is an example,

```js
// Here is the javascript code
// we assign the python function [walk] to javascript [walk]
let walk = pyodide.globals.walk;
// we can call the function [walk] in javascript
let [x,y] = walk(1000);
// now x and y have values of positions of our random walker
```

::: note
The communication between python and javascript is two-way, meaning that we can access javascript variables/objects/functions in python as well. This [notebook](https://iodide.io/notebooks/300/) has some examples.
:::

Once we get the calculated positions `x` and `y`, we can use plotly.js to plot the result. Fortunately, plotly.js provides a relative simple API for animation. One can also use [Bokeh](https://bokeh.pydata.org/en/latest/index.html), [D3](https://d3js.org/), or any other web visualization tool out there. It is even possible to do the visualization in python directly since Pyodide also work with Matplotlib. However, at this stage, I think it is more straight forward to use a javascript library to handle the visualization since it is designed to manipulate DOM (HTML) after all.

I don't want to make this post super long, thus I won't go into very details of the visualization part. The full javascript code we need to load in the page can be found [here](https://gist.github.com/anyuzx/d60d45e3202a081f79c39ed57e19fb28). The file includes the code for fetching gist, visualization using plotly.js, Pyodide code and event handlers for buttons.


## Demonstration
Here is the end product! Click the button `Initialize Pyodide` to download the Pyodide and load Numpy. Once the initialization is finished (*it can takes about 20 seconds or even longer with slow network*. Not good, I know ...), the button `Reset`, `Start` and `Pause` will become clickable and green. Then enter a step number (or use the default number 100) and hit `Start` button to watch the animation of a 2D random walker. Click `Pause` to pause the animation anytime and `Start` to resume. Click `Reset` button to reset the random walker.

::: note
Every time you hit `Reset` and `Start`, a new random walk trajectory is generated directly inside your browser. There is no server involved whatsoever!
:::

::: note
Since Pyodide uses WebAssembly, older browser cannot run the demonstration. You can [check](https://caniuse.com/#feat=wasm) whether your browser support WebAssembly. I recommend use latest version of desktop chrome and firefox for the best experience.
:::

<div class="flex flex-col sm:flex-row justify-center mb-4">
  <button id="initPyodide" class="border border-black p-1 rounded-sm mr-2 bg-yellow-300">Initialize Pyodide</button>
  <input id="stepNumber" type="number" value="100" placeholder="number of steps" class="border border-black p-1 rounded-sm mr-2">
  <button id="reset" disabled class="border border-black p-1 rounded-sm opacity-50 cursor-not-allowed mr-2">Reset</button>
  <button id="start" disabled class="border border-black p-1 rounded-sm opacity-50 cursor-not-allowed mr-2">Start</button>
  <button id="pause" disabled class="border border-black p-1 rounded-sm opacity-50 cursor-not-allowed mr-2">Pause</button>
</div>
<figure id="plot_div">
</figure>

---

### Further reading

* [Running Python in the Browser](https://pythontips.com/2019/05/22/running-python-in-the-browser/)
* [Python-in-the-browser technologies](http://stromberg.dnsalias.org/~strombrg/pybrowser/python-browser.html)
* [WebAssembly](https://developer.mozilla.org/en-US/docs/WebAssembly)
* [Python in Web Assembly with Pyodide](https://talkpython.fm/episodes/show/212/python-in-web-assembly-with-pyodide) (*This is a podcast*)
* [Pyodide documentation](https://pyodide.readthedocs.io/en/latest/)
* [Pyodide notebook demo](https://alpha.iodide.io/notebooks/300/)
* [Plotly.js animation examples](https://plot.ly/javascript/animations/)

<script>
  {{ randomWalkPyodide | safe }}
</script>