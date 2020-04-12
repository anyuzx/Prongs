---
slug: optimizing-python-code-computing-pair-wise-distances-part-1
title: Optimizing python code for computations of pair-wise distances - Part I
date: 2019-09-30
excerpt: >-
    In this series of posts, using calculation of pair-wise distances under periodic boundary condition as an example, I show several different methods to optimize Python codes. The performances from different methods are benchmarked for comparison.
tags:
    - python
---

<a href="https://colab.research.google.com/gist/anyuzx/69b1c1f6671133a6ba8feed3cc2813cf/pdist_benchmark_pure_python.ipynb">
  <img src="https://colab.research.google.com/assets/colab-badge.svg" style="margin-left:unset;margin-right:unset;" alt="Open In Colab"/>
</a>

In this series of posts, several different Python implementations are provided to compute the pair-wise distances in a periodic boundary condition. The performances of each method are benchmarked for comparison. I will investigate the following methods.

::: note
**Article Series**

* Part I: Python implementation only using built-in libraries (you are here)

* Part II: [Numpy implementation](/posts/python-optimization-using-different-methods-part-2)

* Part III: [Numba and Cython implementation](/posts/python-optimization-using-different-methods-part-3)
:::

## Background

In molecular dynamics simulations or other simulations of similar types, one of the core computations is to compute the pair-wise distances between particles. Suppose we have $N$ particles in our system, the [time complexity](https://en.wikipedia.org/wiki/Time_complexity) of computing their pair-wise distances is $O(N^2)$. This is the best we can do when the whole set of pair-wise distances are needed. The good thing is that for actual simulation, in most the cases, we don't care about the distances if it is larger than some threshold. In such a case, the complexity can be greatly reduced to $O(N)$ using [neighbor list algorithm](https://en.wikipedia.org/wiki/Cell_lists).

In this post, I won't implement the neighbor list algorithm. I will assume that we do need all the distances to be computed.

If there is no [periodic boundary condition](https://en.wikipedia.org/wiki/Periodic_boundary_conditions), the computation of pair-wise distances can be directly calculated using the built-in Scipy function [`scipy.spatial.distance.pdist`](https://docs.scipy.org/doc/scipy/reference/generated/scipy.spatial.distance.pdist.html) which is pretty fast. However, with periodic boundary condition, we need to roll our own implementation. For a simple demonstration without losing generality, the simulation box is assumed to be *cubic* and has its lower left forward corner at the origin. Such set up would simplify the computation.

The [basic algorithm](https://en.wikipedia.org/wiki/Periodic_boundary_conditions) of calculating the distance under periodic boundary condition is the following,

$$\Delta = \sigma - \left[\sigma/L\right] * L$$

where $\sigma = x_i - x_j$ and $L$ is the length of the simulation box edge. $\left[\cdot\right]$ denote the nearest integer. $x_i$ and $x_j$ is the position of particle $i$ and $j$ at one dimension. This computes the distance between two particles along one dimension. The full distance would be the square root of the summation of $\Delta$ from all dimensions.

Basic setup:

* All codes shown are using Python version 3.7

* The number of particles is `n`

* The positions of all particles are stored in a list/array of the form `[[x1,y1,z1],[x2,y2,z2],...,[xN,yN,zN]]` where `xi` is the coordinates for particle `i`.

* The length of simulation box edge is `l`.

* We will use libraries and tools such as `numpy`, `itertools`, `math`, `numba`, `cython`.

## *Pure* Python Implementation

To clarify first, by *pure*, I mean that only built-in libraries of python are allowed. `numpy`, `scipy` or any other third-party libraries are not allowed. Let us first define a function to compute the distance between just two particles.

``` python
import math

def distance(p1, p2, l):
    """
    Computes the distance between two points, p1 and p2.

    p1/p2:python list with form [x1, y1, z1] and [x2, y2, z2] representing the cooridnate at that dimension
    l: the length of edge of box (cubic/square box)
    return: a number (distance)
    """
    dim = len(p1)
    D = [p1[i] - p2[i] for i in range(dim)]
    distance = math.sqrt(sum(map(lambda x: (x - round(x / l) * l) ** 2.0, D)))
    return distance
```

Now we can define the function to iterate over all possible pairs to give the full list of pair-wise distances,

``` python
def pdist(positions, l):
    """
    Compute the pair-wise distances between every possible pair of particles.

    positions: a python list in which each element is a a list of cooridnates
    l: the length of edge of box (cubic/square box)
    return: a condensed 1D list
    """
    n = len(positions)
    pdistances = []
    for i in range(n-1):
        for j in range(i+1, n):
            pdistances.append(distance(positions[i], positions[j], l))
    return pdistances
```

The function `pdist` returns a list containing distances of all pairs. Let's benchmark it!

``` python
import numpy as np
n = 100
positions = np.random.rand(n,3).tolist() // convert to python list

%timeit pdist(positions, 1.0)
14.8 ms ± 2.42 ms per loop (mean ± std. dev. of 7 runs, 10 loops each)
```

Such speed is sufficient if `n` is small. In the above example, we already utilize the built-in [`map`](https://docs.python.org/3.7/library/functions.html#map) function and [list comprehension](https://docs.python.org/3/tutorial/datastructures.html#list-comprehensions) to speed up the computation. Can we speed up our code further using only built-in libraries? It turns out that we can. Notice that in the function `pdist`, there is a nested loop. What that loop is doing is to iterate over all the combinations of particles. Luckily, the built-in module `itertools` provides a function [`combinations`](https://docs.python.org/3/library/itertools.html#itertools.combinations) to do just that. Given a list object `lst` or other iterable object, `itertools.combinations(lst, r=2)` generates a iterator of all unique pair-wise combination of elements from `lst` without duplicates. For instance `list(itertools.combinations([1,2,3], r=2))` will return `[(1,2),(1,3),(2,3)]`. Utilizing this function, we can rewrite the `pdist` function as the following,

``` python
def pdist_v2(positions, l):
    # itertools.combinations returns an iterator
    all_pairs = itertools.combinations(positions, r=2)
    return [math.sqrt(sum(map(lambda p1, p2: (p1 - p2 - round((p1 - p2) / l) * l) ** 2.0, *pair))) for pair in all_pairs]
```

* First, we use `itertool.combinations()` to return an iterator `all_pairs` of all possible combination of particles. `r=2` means that we only want pair-wise combinations (no triplets, etc)

* We loop over the `all_pairs` using list comprehension using `[do_something(pair) for pair in all_pairs]`.

* `item` is a tuple of coordinates of two particles, `([xi,yi,zi],[xj,yj,zj])`.

* We use `*pair` to [unpack the tuple object](https://www.geeksforgeeks.org/unpacking-a-tuple-in-python/) `pair` and then use `map` and lambda function to compute the square of distances along each dimension. `p1` and `p2` represents the coordinates of a pair of particles.

::: note
Rigorously speaking, `itertools.combinations` takes an *iterable* object as an argument and returns an *iterator*. I recommend to read [this article](https://nvie.com/posts/iterators-vs-generators/) and the official documentation to understand the concept of iterable/iterator/generator which is very important for advanced python programming.
:::

Now let's benchmark the `pdist_v2` and compare it to `pdist`. To make comparison systematically, I benchmark the performance for different values of `n` and plot the speed as the function of `n`. The result is the below,

![Benchmark: comparison between pdist and pdist_v2](/assets/images/posts/pdist_benchmark_1.svg)

If this is plotted on a log-log scale, one can readily see that both curves scale as $N^2$ which is expected.

## Conclusion

The `pdist_v2` implementation is about 38% faster than `pdist` version. I guess the take-home message from this result is that replacing explicit `for` loop with functions like `map` and `itertools` can boost the performance. However, one needs to make a strategic decision here, as the `pdist` version with the explicit loop is much more readable and easier to understand whereas `pdist_v2` requires a more or less advanced understanding of Python. Sometimes the readability and maintability of code are more important than its performance.

::: note
In the benchmark code above, we convert the numpy array of positions to python list. Since numpy array can be treated just like a python list (*but not vice versa*), we can instead directly provide numpy array as the argument in both `pdist` and `pdist_v2`. However, one can experiment a little bit to see that using numpy array directly actually *slow down* the computation a lot (about 5 times slower on my laptop). The message is that mixing numpy array with built-in functions such as `map` or `itertools` harms the performance. Instead, one should always try to use numpy native functions if possible when working with numpy array.
:::

---

In the next post, I will show how to use Numpy to do the same calculation but faster than the *pure* python implementation shown here.
