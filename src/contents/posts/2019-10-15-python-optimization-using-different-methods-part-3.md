---
slug: optimizing-python-code-computing-pair-wise-distances-part-3
title: Optimizing python code for computations of pair-wise distances - Part III
date: 2019-10-15
excerpt: >-
    This is part III of a series of three posts about optimizing python code. The particular example given is the computation of pair-wise distances under periodic boundary condition which is an essential part of molecular dynamics simulations. In this post, I show how to use Numpy to do the computation.
tags:
    - python
---

<a href="https://colab.research.google.com/drive/1U_-J6ZHPbRkWGz97sfJ9isDSfqHvGd91">
  <img src="https://colab.research.google.com/assets/colab-badge.svg" style="margin-left:unset;margin-right:unset;" alt="Open In Colab"/>
</a>

::: note
Skip to see the final [summary of benchmark results](#summing-up).
:::

This is Part III of a series of three posts. In Part I and II, I discussed pure python and numpy implementations of performing pair-wise distances under a periodic condition, respectively. In this post, I show how to use [Numba](http://numba.pydata.org/) and [Cython](https://cython.org/) to further speed up the python codes.

At some point, the optimized python codes are not *strictly* python codes anymore. For instance, in this post, using Cython, we can make our codes very efficient. However, strictly speaking, Cython is *not* Python. It is a superset of Python, which means that any Python code can be compiled as Cython code but not vice versa. To see the performance boost, one needs to write Cython codes. So what is stopping you to just write C++/C codes instead and be done with it? I believe there is always some balance between the performance of the codes and the effort you put into writing the codes. As I will show here, using Numba or writing Cython codes is straightforward if you are familiar with Python. Hence, I always prefer to optimize the Python codes rather than rewrite it in C/C++ because it is more cost-effective for me.

## Background

Just to reiterate, the computation is to calculate pair-wise distances between every pair of $N$ particles under periodic boundary condition. The positions of particles are stored in an array/list with form `[[x1,y1,z1],[x2,y2,z2],...,[xN,yN,zN]]`. The distance between two particles, $i$ and $j$ is calculated as the following,


$$
\Delta_{ij} = \sigma_{ij} - \left[ \sigma_{ij}/L \right] \cdot L
$$

where $\sigma_{ij}=x_i-x_j$ and $L$ is the length of the simulation box edge. $x_i$ and $x_j$ is the positions. For more information, please read [Part I](https://www.guangshi.io/posts/python-optimization-using-different-methods#background).

## Using Numba

> [Numba](http://numba.pydata.org/) is an open-source JIT compiler that translates a subset of Python and NumPy code into fast machine code.

Numba has existed for a few years. I remembered trying it a few years ago but didn't have a good experience with it. Now it is much more matured and very easy to use as I will show in this post.

### Serial Numba Implementation

On their website, it is stated that Numba can make Python codes as fast as C or Fortran. Numba also provides a way to parallelize the `for` loop. First, let's try to implement a serial version. Numba's official documentation recommends using Numpy with Numba. Following the suggestion, using the Numpy code demonstrated in [Part II](/posts/python-optimization-using-different-methods-part-2), I have the Numba version,

```python
import numba
from numba import jit

@jit(nopython=True, fastmath=True)
def pdist_numba_serial(positions, l):
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
        out = np.empty_like(D)
        D = D - np.round(D / l, 0, out) * l
        distance = np.sqrt(np.sum(np.power(D, 2.0), axis=1))
        idx_s = int((2 * n - i - 1) * i / 2.0)
        idx_e = int((2 * n - i - 2) * (i + 1) / 2.0)
        pdistances[idx_s:idx_e] = distance
    return pdistances
```

Using Numba is *almost* (see blue box below) as simple as adding the decorator `@jit(nopython=True, fastmath=True)` to our function.

::: note
Inside the function `pdist_numba_serial`, we basically copied the [codes](/posts/python-optimization-using-different-methods-part-2#naive-numpy-implementation) except the line `D = D - np.round(D / l)  * l` in the original code. Instead we need to use `np.round(D / l, 0, out)` which is pointed out [here](https://github.com/numba/numba/issues/2648)
:::

### Parallel Numba Implementation

`pdist_numba_serial` is a serial implementation. The nature of pair-wise distance computation allows us to parallelize the process by simplifying distributing pairs to multiple cores/threads. Fortunately, Numba does provide a very simple way to do that. The for loop in `pdist_numba_serial` can be parallelized using Numba by replacing `range` with `prange` and adding `parallel=True` to the decorator,

```python
from numba import prange

# add parallel=True to the decorator
@jit(nopython=True, fastmath=True, parallel=True)
def pdist_numba_parallel(positions, l):
    # determine the number of particles
    n = positions.shape[0]
    # create an empty array storing the computed distances
    pdistances = np.empty(int(n*(n-1)/2.0))
    # use prange here instead of range
    for i in prange(n-1):
        D = positions[i] - positions[i+1:]
        out = np.empty_like(D)
        D = D - np.round(D / l, 0, out) * l
        distance = np.sqrt(np.sum(np.power(D, 2.0), axis=1))
        idx_s = int((2 * n - i - 1) * i / 2.0)
        idx_e = int((2 * n - i - 2) * (i + 1) / 2.0)
        pdistances[idx_s:idx_e] = distance
    return pdistances
```

There are some caveats when using `prange` when race condition would occur. However for our case, there is no race condition since the distances calculations for pairs are independent with each other, i.e. there is no communication between cores/threads. For more information on parallelizing using Numba, refer to their [documentation](https://numba.pydata.org/numba-doc/dev/user/parallel.html).

**Benchmark**

Now let's benchmark the two versions of Numba implementations. The result is shown below,

![Speed Benchmark: comparison between pdist_numba_serial and pdist_numba_parallel](/assets/images/posts/pdist_numba_benchmark.svg)

Compared to the fastest Numpy implementation shown in [Part II](posts/python-optimization-using-different-methods-part-2), the serial Numba implementation provides more than three times of speedup. As one can see, the parallel version is about twice as fast as the serial version on my 2-cores laptop. I didn't test on the machines with more cores but I expect the speed up should scale linearly with the number of cores.

I am sure there are some more advanced techniques to make the Numba version even faster (using CUDA for instance). I would argue that the implementations above are the most cost-effective.

## Using Cython

As demonstrated above, Numba provides a very simple way to speed up the python codes with minimal effort. However, if we want to go further, it is probably better to use Cython.

Cython is basically a superset of Python. It allows Cython/Python codes to be compiled to C/C++ and then compiled to machine codes using C/C++ compiler. In the end, you have a C module you can import directly in Python.

Similar to the Numba versions, I show both serial and parallel versions of Cython implementations

### Serial Cython implementation

```python
%load_ext Cython # load Cython in Jupyter Notebook
%%cython --force --annotate

import cython
import numpy as np

from libc.math cimport sqrt
from libc.math cimport nearbyint

@cython.boundscheck(False)
@cython.wraparound(False)
@cython.cdivision(True) # Do not check division, may leads to 20% performance speedup
def pdist_cython_serial(double [:,:] positions not None, double l):
    cdef Py_ssize_t n = positions.shape[0]
    cdef Py_ssize_t ndim = positions.shape[1]
    
    pdistances = np.zeros(n * (n-1) // 2, dtype = np.float64)
    cdef double [:] pdistances_view = pdistances
    
    cdef double d, dd
    cdef Py_ssize_t i, j, k
    for i in range(n-1):
        for j in range(i+1, n):
            dd = 0.0
            for k in range(ndim):
                d = positions[i,k] - positions[j,k]
                d = d - nearbyint(d / l) * l
                dd += d * d
            pdistances_view[j - 1 + (2 * n - 3 - i) * i // 2] = sqrt(dd)
    
    return pdistances
```


**Some Remarks**

* Declare static types for variables using `cdef`. For instance, `cdef double d` declare that the variable `d` has a double/float type.

* Import `sqrt` and `nearbyint` from C library instead of using Python function. The general rule is that always try to use C functions directly whenever possible.

* `positions` is a Numpy array and declared using [Typed Memoryviews](https://cython.readthedocs.io/en/latest/src/userguide/memoryviews.html).

* Similar to `positions`, `pdistances_view` access the memory buffer of the numpy array `pdistances`. Value assignments of `pdistances` are achieved through `pdistances_view`.

* It is useful to use `%%cython --annotate` to display the analysis of Cython codes. In such a way, you can inspect the potential slowdown of the code. The analysis will highlight lines where Python interaction occurs. In this particular example, it is very important to keep the core part -- nested loop -- from Python interaction. For instance, if we don't use `sqrt` and `nearbyint` from `libc.math` but instead just use python's built-in `sqrt` and `round`, then you won't see much speedup since there is a lot of overhead in calling these python functions inside the loop.

### Parallel Cython Implementation

Similar to Numba, Cython also allows parallelization. The parallelization is achieved using OpenMP. First, to use OpenMP with Cython, we need to import needed modules,

```python
from cython.parallel import prange, parallel
```

Then, replace the `for i in range(n-1)` in the serial version with

```python
with nogil, parallel():
    for i in prange(n-1, schedule='dynamic'):
```

Everything else remains the same. Here I follow the [example](https://cython.readthedocs.io/en/latest/src/userguide/parallelism.html#cython.parallel.parallel) on Cython's official documentation.

::: note
`schedule='dynamic'` allows the iterations in the loop are distributed through threads as request. Other options include `static`, `guided`, etc. See [here](https://cython.readthedocs.io/en/latest/src/userguide/parallelism.html#cython.parallel.prange) for full documentation.
:::

::: note
I had some trouble compiling the parallel version directly in the Jupyter Notebook. Instead, it is compiled as a standalone module. The `.pyx` file and `setup.py` file can be found [here](https://gist.github.com/anyuzx/e8f8950ed6fcc901a80c65aec28aabba).
:::

**Benchmark**

The result of benchmarking `pdist_cython_serial` and `pdist_cython_parallel` is shown in the figure below,

![Speed Benchmark: comparison between pdist_cython_serial and pdist_cython_parallel](/assets/images/posts/pdist_cython_benchmark.svg)

As expected, the serial version is about half the speed of the parallel version on my 2-cores laptop. The serial version is more than two times faster than its counterpart using Numba.

## Summing up

In this serial of posts, using computations of pair-wise distance under periodic boundary condition as an example, I showed various ways to optimize the Python codes using built-in Python functions ([Part I](posts/python-optimization-using-different-methods)), NumPy ([Part II](posts/python-optimization-using-different-methods-part-2)), Numba and Cython ([Part III]()). The benchmark results from all of the functions tested are summarized in the table below,

|        Function       | Averaged Speed (ms) | Speedup |
|:---------------------:|:-------------------:|:-------:|
|         `pdist`         |         1270        |    1    |
|        `pdist_v2`       |         906         |   1.4   |
| `pdist_np_broadcasting` |         160         |   7.9   |
|     `pdist_np_naive`    |         110         |   11.5  |
|   `pdist_numba_serial`  |         20.7        |    61   |
|  `pdist_numba_parallel` |         12.6        |   101   |
|  `pdist_cython_serial`  |         5.84        |   217   |
| `pdist_cython_parallel` |         3.19        |   398   |

The time is measured when $N=1000$. The parallel versions are tested on a 2-cores machine.
