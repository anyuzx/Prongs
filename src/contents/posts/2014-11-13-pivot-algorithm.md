---
title: "Pivot Algorithm For Generating Self-avoiding Chain, Using Python and Cython"
date: 2014-11-13
excerpt: "Pivot algorithm is best Monte Carlo algorithm known so far used for generating canonical ensemble of self-avoiding random walks (fixed number of steps). Originally it is for the random walk on a lattice, but it also can be modified for continuous random walk. Recently I encountered a problem where I need to generate self-avoiding chain configurations."
categories:
  - research
tags:
  - python
  - pivot algorithm
  - random walk
---

Pivot algorithm is best Monte Carlo algorithm known so far used for generating canonical ensemble of self-avoiding random walks (fixed number of steps). Originally it is for the random walk on a lattice, but it also can be modified for continuous random walk. Recently I encountered a problem where I need to generate self-avoiding chain configurations.

**Basically the most simple version of this algorithm breaks into following steps**:

1. Prepare an initial configuration of a $N$ steps walk on lattice (equivalent to a $N$ monomer chain)
2. Randomly pick a site along the chain as _**pivot site**_
3. Randomly pick a side (right to the _**pivot site**_ or left to it), the chain on this side is used for the next step.
4. Randomly apply a rotate operation on the part of the chain we choose at the above step.
5. After the rotation, check the overlap between the rotated part of the chain and the rest part of the chain. Accept the new configuration if there is no overlap and restart from 2th step. Reject the configuration and repeat from 2th step if there are overlaps.

> **Note**: For random walks on a 3D cubic lattice, there are only 9 distinct rotation operations.

--------

Some references on **Pivot algorithm**

* [Lal(1969)][^1]: The original paper of pivot algorithm.
* [Madras and Sokal(1988)][^2]: The most cited paper on this field. For the first time, they showed pivot algorithm is extrememly efficient contradicted to the intuition.
* [Clisby(2010)][^3]: The author developed a new more efficient inplementation of pivot algorithm and calculate the critical exponent $\nu$, which is also the _**Flory exponent**_ for polymer chain in bad solvent.

--------

## Python Implementation
The implement of this algorithm in `Python` is very straightforward. The raw file can be found here

~~~ python
import numpy as np
import timeit
from scipy.spatial.distance import cdist

# define a dot product function used for the rotate operation
def v_dot(a):return lambda b: np.dot(a,b)

class lattice_SAW:
    def __init__(self,N,l0):
        self.N = N
        self.l0 = l0
        # initial configuration. Usually we just use a straight chain as inital configuration
        self.init_state = np.dstack((np.arange(N),np.zeros(N),np.zeros(N)))[0]
        self.state = self.init_state.copy()

        # define a rotation matrix
        # 9 possible rotations: 3 axes * 3 possible rotate angles(90,180,270)
        self.rotate_matrix = np.array([[[1,0,0],[0,0,-1],[0,1,0]],[[1,0,0],[0,-1,0],[0,0,-1]]
        ,[[1,0,0],[0,0,1],[0,-1,0]],[[0,0,1],[0,1,0],[-1,0,0]]
        ,[[-1,0,0],[0,1,0],[0,0,-1]],[[0,0,-1],[0,1,0],[-1,0,0]]
        ,[[0,-1,0],[1,0,0],[0,0,1]],[[-1,0,0],[0,-1,0],[0,0,1]]
        ,[[0,1,0],[-1,0,0],[0,0,1]]])

    # define pivot algorithm process where t is the number of successful steps
    def walk(self,t):
        acpt = 0
        # while loop until the number of successful step up to t
        while acpt <= t:
            pick_pivot = np.random.randint(1,self.N-1) # pick a pivot site
            pick_side = np.random.choice([-1,1]) # pick a side

            if pick_side == 1:
                old_chain = self.state[0:pick_pivot+1]
                temp_chain = self.state[pick_pivot+1:]
            else:
                old_chain = self.state[pick_pivot:]
                temp_chain = self.state[0:pick_pivot]

            # pick a symmetry operator
            symtry_oprtr = self.rotate_matrix[np.random.randint(len(self.rotate_matrix))]
            # new chain after symmetry operator
            new_chain = np.apply_along_axis(v_dot(symtry_oprtr),1,temp_chain - self.state[pick_pivot]) + self.state[pick_pivot]

            # use cdist function of scipy package to calculate the pair-pair distance between old_chain and new_chain
            overlap = cdist(new_chain,old_chain)
            overlap = overlap.flatten()

            # determinte whether the new state is accepted or rejected
            if len(np.nonzero(overlap)[0]) != len(overlap):
                continue
            else:
                if pick_side == 1:
                    self.state = np.concatenate((old_chain,new_chain),axis=0)
                elif pick_side == -1:
                    self.state = np.concatenate((new_chain,old_chain),axis=0)
                    acpt += 1

        # place the center of mass of the chain on the origin
        self.state = self.l0*(self.state - np.int_(np.mean(self.state,axis=0)))

N = 100 # number of monomers(number of steps)
l0 = 1 # bond length(step length)
t = 1000 # number of pivot steps

chain = lattice_SAW(N,l0)

%timeit chain.walk(t)
~~~

~~~ bash
1 loops, best of 3: 2.61 s per loop
~~~

Above code performs a 100 monomer chain with 1000 successful pivot steps. However even with `numpy` and the built-in function `cdist` of `scipy`, the code is still too slow for large number of random walk steps. Of course, you can directly write `C`, `C++` or `Fortran` code to have the maximum speed. But for me, I would like to write any codes using `Python` in an ideal world.

---------------------------------------

## Cython Implementation

However world is never perfect. When comming to the loops, `Python` can be very slow. In many complex situations, even `numpy` and `scipy` is not that useful. For instance in this case, in order to determine the overlaps, we need to have a nested loop over two sets of sites (monomers). In the above code, I use built-in function `cdist` of `scipy` to do this, which is already highly optimized. But actually we don't have to complete the loops, because we can stop the search if we encounter one overlap. However I can't think of a `numpy` or `scipy` way to do this easily and efficiently because we have this conditional break feature. Here is where [Cython][^4] can be extrememly useful. `Cython` can _translate_ your `python` code in `C` and _translate_ your `C` or `C++` code into a `Python` module so you can `import` your `C` code into `Python`. To do that, first we just handwrite our **pivot algorithm** using plain `C++` code.

~~~ c
#include #include
using namespace std;
void c_lattice_SAW(double* chain, int N, double l0, int ve, int t){
... // pivot algorithm codes here
}
~~~

Name the file `c_lattice_SAW.cpp`. Here we define a function called `c_lattice_SAW`. Where `chain` is the array storing the coordinates of monomers, `N` is the number of monomers, `l0` is the bond length, `t` is the number of successful steps.
> * `C++11` library **random** is used here in order to use Mersenne twister RNG directly.

> * The `C++` code in this case is not a complete program. It doesn't have `main` function.

The whole `C++` code is not shown, because it is a bit long. Beside our plain `C` code, we also need a header file `c_lattice_SAW.h`.

~~~ c
void c_lattice_SAW(double* chain, int N, double l0, int ve, int t);
~~~

If you don't want to handwrite a `C` code, another way to use `Cython` is to write plain `Cython` program(much simpler and readable). But in that way, how to get high quality random numbers efficiently is a problem.Usually there are several ways to get random numbers in `Cython`

* Use Python module **random**.

> This method will be very slow if random number is generated in a big loop because generated C code must call a Python module everytime which is a lot of overhead time.

* Use `numpy` to generate many random numbers in advance.

> This will require large amount of memory and also in many cases, the total number of random numbers needed is not known before the computation.

* Use C function `rand()` from standard library `stdlib` in `Cython`

> `rand()` is not a very good RNG. In a scientific computation like Monte Carlo simulation, this is not good way to get random numbers.

* Wrap a good C-implemented RNG using Cython.

> This can be a good way. Currently I have found two ways to do this: 1. [Use numpy **randomkit**][^5] 2. [Use GSL library][^6]

* Handwrite `C` or `C++` code using **random** library or other external library and use `Cython` to wrap the code.

> This will give the optimal performance, but comes with more complicated and less readable code.

What I did in this post is the last method.

Now we need to make a `.pyx` file that will handle the C code in `Cython` and define a python function to use our C code. Give the `.pyx` a different name like `lattice_SAW.pyx`

~~~ python
import cython
import numpy as np
cimport numpy as np

cdef extern from "c_lattice_SAW.h":
void c_lattice_SAW(double* chain, int N, double l0, int ve, int t)

@cython.boundscheck(False)
@cython.wraparound(False)

def lattice_SAW(int N, double l0, int ve, int t):
    cdef np.ndarray[double,ndim = 1,mode="c"] chain = np.zeros(N*3)
    c_lattice_SAW(&chain[0],N,l0,ve,t)
    return chain
~~~

Compile our C code to generate a shared library which can be imported into `Python` as a module. To do that, we use `Python` `distutils` package. Make a file named `setup.py`.

~~~ python
from distutils.core import setup
from distutils.extension import Extension
from Cython.Distutils import build_ext

import numpy

setup(
cmdclass = {'build_ext':build_ext},
            ext_modules = [Extension("lattice_SAW",
            sources = ["lattice_SAW.pyx","c_lattice_SAW.cpp"],
            extra_compile_args=['-std=c++11','-stdlib=libc++'],
            language="c++",
            include_dirs = [numpy.get_include()])],
)
~~~

> **NOTE**: Instead of normal arguments, we also have `extra_compile_args` here. This is because in the `C++` code, we use library **random** which is new in `C++11`. On **MAC**, `-std=c++11` and `-stdlib=libc++` need to be added to tell the compilers to support `C++11` and use `libc++` as the standard library. On **Linux** system like **Ubuntu**, just `-std=c++11` is enough.
> **NOTE**: If `numpy` array is used in Cython, then the setting `include_dirs = [numpy.get_include()])]` need to be added

Then in terminal we do

Linux
~~~ bash
python setup.py build_ext --inplace
~~~
or Mac OS
~~~ bash
clang++ python setup.py build_ext --inplace
~~~
> **NOTE**: `clang++` tell the python use `clang` compiler not `gcc` because apparently the version of `gcc` shipped with **OS X** doesn't support `C++11`.

If the compilation goes successfully, then a `.so` library file is generated. Now we can import our module in `Python` in that working directory

~~~ python
import lattice_SAW
import numpy

%timeit lattice_SAW.lattice_SAW(100,1,1,1000)
~~~

~~~ bash
100 loops, best of 3: 5.97 ms per loop
~~~

That is 437 times faster than our normal *numpy/scipy* way!

[^1]: http://www.tandfonline.com/doi/abs/10.1080/00268976900100781#.VGLBSfldV8E
[^2]: http://link.springer.com/article/10.1007/BF01022990
[^3]: http://journals.aps.org/prl/abstract/10.1103/PhysRevLett.104.055702
[^4]: http://cython.org/
[^5]: https://groups.google.com/forum/#!msg/cython-users/9UGMi_b3tVo/7mNr87E3ZIAJ
[^6]: http://pyinsci.blogspot.com/2010/12/efficcient-mcmc-in-python.html
