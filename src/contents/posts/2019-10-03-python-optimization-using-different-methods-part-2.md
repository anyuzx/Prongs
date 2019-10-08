---
slug: optimizing-python-code-computing-pair-wise-distances-part-2
title: Optimizing python code for computations of pair-wise distances - Part II
date: 2019-10-08
excerpt: >-
    This is part II of a series of three posts about optimizing python code. The particular example given is the computation of pair-wise distances under periodic boundary condition which is an essential part of molecular dynamics simulations. In this post, I show how to use Numpy to do the computation.
tags:
    - python
---

<a href="https://colab.research.google.com/drive/13UebfR7OBscub3HfKTIrAK87n7811L9q#scrollTo=PoRnx0QLIeva">
  <img src="https://colab.research.google.com/assets/colab-badge.svg" style="margin-left:unset;margin-right:unset;" alt="Open In Colab"/>
</a>

::: note
[Part I](/posts/python-optimization-using-different-methods): *Pure* Python implementation
:::

This is part II of series of three posts on optimizing python code. Using an example of computing pair-wise distances under periodic boundary conditions, I will explore several ways to optimize the python codes, including pure python implementation without any third-party libraries, Numpy implementation, and implementation using Numba or Cython.

In this post, I show how to use [Numpy](https://numpy.org/) to do the computation. I will demonstrate two different implementations.

## Background

Just to reiterate, the computation is to calculate pair-wise distances between every pair of $N$ particles under periodic boundary condition. The positions of particles are stored in an array/list with form `[[x1,y1,z1],[x2,y2,z2],...,[xN,yN,zN]]`. The distance between two particles, $i$ and $j$ is calculated as the following,


$$
\Delta_{ij} = \sigma_{ij} - \left[ \sigma_{ij}/L \right] \cdot L
$$

where $\sigma_{ij}=x_i-x_j$ and $L$ is the length of the simulation box edge. $x_i$ and $x_j$ is the positions. For more information, you read up in [Part I](https://www.guangshi.io/posts/python-optimization-using-different-methods#background).

## *Naive* Numpy Implementation

By *naive*, what I meant is that we simply treat numpy array like a normal python list and utilize some basic numpy functions to compute quantity such as summation, mean, power, etc. To get to the point, the codes are the following,

```python
def pdist_np_naive(positions, l):
    """
    Compute the pair-wise distances between every possible pair of particles.

    positions: a numpy array with form np.array([[x1,y1,z1],[x2,y2,z2],...,[xN,yN,zN]])
    l: the length of edge of box (cubic/square box)
    return: a condensed 1D list
    """
    # determine the number of particles
    n = positions.shape[0]
    # create an empty array storing the computed distances
    pdistances = np.empty(int(n*(n-1)/2.0))
    for i in range(n-1):
        D = positions[i] - positions[i+1:]
        D = D - np.round(D / l)  * l
        distance = np.sqrt(np.sum(np.power(D, 2.0), axis=1))
        idx_s = int((2 * n - i - 1) * i / 2.0)
        idx_e = int((2 * n - i - 2) * (i + 1) / 2.0)
        pdistances[idx_s:idx_e] = distance
    return pdistances
```

**Benchmark**

```python
n = 100
positions = np.random.rand(n,2)
%timeit pdist_np_naive(positions,1.0)
2.7 ms ± 376 µs per loop (mean ± std. dev. of 7 runs, 100 loops each)
```

The performance is not bad. This is roughly 4 times speedup compared to the *pure* python implementation shown in Part I (*might not be as fast as what one would expect since the python code shown in the previous post is already well-optimized*). Is there any way we can speed up the calculation? We know that `for` loops can be very slow in python. Hence, eliminating the `for` loop in the example above might be the correct direction. It turns out that we can achieve this by fully utilizing the broadcasting feature of numpy.

## Numpy implementation using broadcasting

To get rid of the loops in the codes above, we need to find some numpy native way to do the same thing. One typical method is to use the [**broadcasting**](https://docs.scipy.org/doc/numpy/user/basics.broadcasting.html). Consider the following example,

```python
a = np.array([1,2,3])
b = 4
a + b
>>> array([5,6,7])
```

This is a simpler example of broadcasting. The underlying operation, in this case, is a loop over the element of `a` and add value of `b` to it. Instead of writing the loop ourselves, you can simply do `a+b` and numpy will do the rest. The term "broadcasting" is in the sense that `b` is stretched to be the same dimension of `a` and then element-by-element arithmetic operations are taken. Because the broadcasting is implemented in C under the hood, it is much faster than writing `for` loop explicitly.

The nature of pair-wise distance computation requires double nested loops which iterate over every possible pair of particles. It turns out that such a task can also be done using broadcasting. Again, I recommend reading their [official documentation](https://docs.scipy.org/doc/numpy/user/theory.broadcasting.html#array-broadcasting-in-numpy) on broadcasting. The *example 4* on that page is a nested loop. Look at the example, shown below

```python
import numpy as np
a = np.array([0.0,10.0,20.0,30.0])
b = np.array([1.0,2.0,3.0])
a[:, np.newaxis] + b
>>> array([[  1.,  2.,  3.],
           [ 11., 12., 13.],
           [ 21., 22., 23.],
           [ 31., 32., 33.]])
```

Notice that the `+` operation is applied on every possible pair of elements from `a` and `b`. It is equvanlently to the codes below,

```python
a = np.array([0.0,10.0,20.0,30.0])
b = np.array([1.0,2.0,3.0])
c = np.empty((len(a), len(b)))
for i in range(len(a)):
    for j in range(len(b)):
        c[i,j] = a[i] + b[j]
```

The broadcasting is much simpler regarding the syntax and faster in many cases (*but not all*) compared to explicit loops. Let's look at another example shown below,

```python
a = np.array([[1,2,3],[-2,-3,-4],[3,4,5],[5,6,7],[7,6,5]])
diff = a[:, np.newaxis] - a
print('shape of array [a]:', a.shape)
print('Shape of array [diff]:', diff.shape)
>>> shape of array [a]: (5,3)
>>> shape of array [diff]: (5,5,3)
```

Array `a`, with shape `(5,3)`, represents 5 particles with coordinates on three dimensions. If we want to compute the differences between each particle on each dimension, `a[:, np.newaxis] - a` does the job. Quantity `a[:, np.newaxis] - a` has a shape `(5,5,3)` whose first and second dimension is the particle indices and the third dimension is spatial.

Following this path, we reach the final code to compute the pair-wise distances under periodic boundary condition,

```python
def pdist_np_broadcasting(positions, l):
    """
    Compute the pair-wise distances between every possible pair of particles.

    postions: numpy array storing the positions of each particle. Shape: (nxdim)
    l: edge size of simulation box
    return: nxn distance matrix
    """
    D = positions[:, np.newaxis] - positions # D is a nxnxdim matrix/array
    D = D - np.around(D / l) * l
    # unlike the pdist_np_naive above, pdistances here is a distance matrix with shape nxn
    pdistances = np.sqrt(np.sum(np.power(D, 2.0), axis=2))
    return pdistances
```

**Benchmark**

```python
n = 100
positions = np.random.rand(n,2)
%timeit pdist_np_broadcasting(positions, 1.0)
>>> 1.43 ms ± 649 µs per loop (mean ± std. dev. of 7 runs, 100 loops each)
```

This is about twice as fast as the *naive* numpy implementation.

::: note
`pdist_np_broadcasting` returns an array with shape `(n,n)` which can be considered as a distance matrix whose element `[i,j]` is the distances between particle `i` and `j`. As you can see, this matrix is symmetric and hence contains duplicated information. There are probably better ways than what shown here to *only* compute the upper triangle of the matrix instead of a full one.
:::

Now let's make a final systematic comparison between `pdsit_np_naive` and `pdist_np_broadcasting`. I benchmark the performance for different values of `n` and plot the speed as the function of `n`. The result is shown in the figure below,

![Speed Benchmark: comparison between pdist_np_naive and pdist_np_broadcasting](/assets/images/posts/pdist_benchmark_2.svg)

The result is surprising. The broadcasting version is faster *only* when the data size is smaller than 200. For large data set, the *naive* implementation turns out to be faster. What is going on? After googling a little bit, I found these StackOverflow questions [1](https://stackoverflow.com/questions/49632993/why-python-broadcasting-in-the-example-below-is-slower-than-a-simple-loop), [2](https://stackoverflow.com/questions/49112552/vectorized-string-operations-in-numpy-why-are-they-rather-slow/49134333#49134333), [3](https://stackoverflow.com/questions/31536504/memory-growth-with-broadcast-operations-in-numpy). It turns out that the problem may lie in memory usage and access. Using the [`memory-profiler`](https://pypi.org/project/memory-profiler/), I can compare the memory usage from the two versions as a function of `n` (see the figure below). The result shows that `pdist_np_broadcasting` uses much more memory than `pdist_np_naive`, which could explain the differences in speed.

![Memory Usage: comparison between pdist_np_naive and pdist_np_broadcasting](/assets/images/posts/pdist_numpy_memory_usage.svg)

The origin of the difference in memory usage is that for the `pdist_np_naive` version, the computation is splitted into individual iteractions of the `for` loop. Whereas the `pdist_np_broadcasting` performs the computation in one single batch. `pdist_np_naive` executes `D = positions[i] - positions[i+1:]` inside the loop and every single iteration only creates an array of `D` of size smaller than `n`. On the other hand, `D = positions[:, np.newaxis] - positions` and `D = D - np.around(D / l) * l` in `pdist_np_broadcasting` create several temporary array of size `n*n`.

## Summing up

First, both of numpy implementations shown here lead to several times of speed up comparing to the *pure* python implementation. When working with numerical computation, use Numpy usually will give better performance. One of the counterexamples would be appending to a list/array where python's `append` is *much* faster than numpy's `append`.

Many online tutorials and posts recommend using the numpy's broadcasting feature whenever possible. This is a largely correct statement. However, the example given here shows that the details of the implementation of broadcasting matters. On numpy's official documentation, it states

> There are also cases where broadcasting is a bad idea because it leads to inefficient use of memory that slows computation

`pdist_np_broadcasting` is one of the examples where broadcasting might hurt performance. I guess the take-home message is that do not neglect space complexity (memory requirement) if you are trying to optimize the codes and numpy's broadcasting is not always a good idea.

---

In the next post, I will show how to use [Numba](http://numba.pydata.org/) and [Cython](https://cython.org/) to boost the computation speed even more.
