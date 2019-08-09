---
title: "Generating Random Walk Using Normal Modes"
date: 2017-11-17
excerpt: "Random walks generated in an alternative way and understanding Rouse model. Long time ago, I wrote about how to use Pivot algorithm to generate equilibrium conformations of a random walk, either self-avoiding or not. The volume exclusion of a self-avoiding chain make it non-trivial to generate conformations. Gaussian chain, on the other hand, is very easy and trivial to generate. In addition to the efficient pivot algorithm, in this article, I will show another interesting but non-straightforward method to generate gaussian chain conformations"
categories:
  - research
tags:
  - polymer
  - random walk
---


Long time ago, I [wrote](https://biophyenvpol.wordpress.com/2014/11/13/pivot-algorithm-of-self-avoiding-chain-using-python-and-cython/) about how to use Pivot algorithm to generate equilibrium conformations of a random walk, either self-avoiding or not. The volume exclusion of a self-avoiding chain make it non-trivial to generate conformations. Gaussian chain, on the other hand, is very easy and trivial to generate. In addition to the efficient pivot algorithm, in this article, I will show another interesting but non-straightforward method to generate gaussian chain conformations.

To illustrate this method which is used to generate _static_ conformations of a gaussian chain, we need first consider the dynamics of a such system. It is well known the dynamics of a gaussian/ideal chain can be modeled by the Brownian motion of beads connected along a chain, which is ensured to give correct equilibrium ensemble. The model is called "Rouse model", and very well studied. I strongly suggest the book [The Theory of Polymer Dynamics](https://www.goodreads.com/book/show/166512.The_Theory_of_Polymer_Dynamics) by Doi and Edwards to understand the method used here. I also found a useful material [here](http://padding.awardspace.com/polymerdynamics_Padding_part1.pdf). I will not go through the details of derivation of solution of Rouse model. To make it short, the motion of a gaussian chain is just linear combinations of a series of inifinite number of independent normal modes. Mathematically, that is,

$$
\mathbf{R}_{n}=\mathbf{X}_{0}+2\sum_{p=1}^{\infty}\mathbf{X}_{p}\cos\big(\frac{p\pi n}{N}\big)
$$

where $\mathbf{R}_{n}$ is the position of $n^{th}$ bead and $\mathbf{X}_{p}$ are the normal modes. $\mathbf{X}_{p}$ is the solution of langevin equation $\xi_{p}\frac{\partial}{\partial t}\mathbf{X}_{p}=-k_{p}\mathbf{X}_{p}+\mathbf{f}_{p}$. This is a special case of [Orstein-Uhlenbeck process](https://en.wikipedia.org/wiki/Ornstein–Uhlenbeck_process) and the equilibrium solution of this equation is just a normal distribution with mean $0$ and variance $k_{\mathrm{B}}T/k_{p}$.

$$
X_{p,\alpha}\sim \mathcal{N}(0,k_{\mathrm{B}}T/k_{p})\quad, \quad\alpha=x,y,z
$$

where $k_{p}=\frac{6\pi^{2}k_{\mathrm{B}}T}{N b^{2}}p^{2}$, $N$ is the number of beads or number of steps. $b$ is the kuhn length.

This suggests that we can first generate normal modes. Since the normal modes are independent with each other and they are just gaussian random number. It is very easy and straightforward to do. And then we just transform them to the actual position of beads using the first equation and we get the position of each beads, giving us the conformations. This may seems untrivial at first glance but should give us the correct result. To test this, let's implement the algorithm in python.

~~~ python
def generate_gaussian_chain(N, b, pmax):
    # N = number of beads
    # b = kuhn length
    # pmax = maximum p modes used in the summation

    # compute normal modes xpx, xpy and xpz
    xpx = np.asarray(map(lambda p: np.random.normal(scale = np.sqrt(N * b**2.0/(6 * np.pi**2.0 * p**2.0))), xrange(1, pmax+1)))
    xpy = np.asarray(map(lambda p: np.random.normal(scale = np.sqrt(N * b**2.0/(6 * np.pi**2.0 * p**2.0))), xrange(1, pmax+1)))
    xpz = np.asarray(map(lambda p: np.random.normal(scale = np.sqrt(N * b**2.0/(6 * np.pi**2.0 * p**2.0))), xrange(1, pmax+1)))

    # compute cosin terms
    cosarray = np.asarray(map(lambda p: np.cos(p * np.pi * np.arange(1, N+1)/N), xrange(1, pmax+1)))

    # transform normal modes to actual position of beads
    x = 2.0 * np.sum(np.resize(xpx, (len(xpx),1)) * cosarray, axis=0)
    y = 2.0 * np.sum(np.resize(xpy, (len(xpy),1)) * cosarray, axis=0)
    z = 2.0 * np.sum(np.resize(xpz, (len(xpz),1)) * cosarray, axis=0)
    return np.dstack((x,y,z))[0]
~~~

Note that there is a parameter called `pmax`. Although actual position is the linear combination of **inifinite** number of normal modes, numerically we must truncate this summation. `pmax` set the number of normal modes computed. Also in the above code, we use numpy broadcasting to make the code very consie and efficient. Let's use this code to generate three conformations with different values of `pmax` and plot them

~~~python
# N = 300
# b = 1.0
conf1 = generate_gaussian_chain(300, 1.0, 10) # pmax = 10
conf2 = generate_gaussian_chain(300, 1.0, 100) # pmax = 100
conf3 = generate_gaussian_chain(300, 1.0, 1000) # pmax = 1000

fig = plt.figure(figsize=(15,5))

# matplotlib codes here

plt.show()
~~~

![image1](https://i.imgur.com/4mxmVAY.png)

The three plots show the conformations with $p_{\mathrm{max}}=10$, $p_{\mathrm{max}}=100$ and $p_{\mathrm{max}}=1000$. $N=300$ and $b=1$. As clearly shown here, larger number of modes gives more correct result. The normal modes of small `p` corresponds the low frequency motion of the chain, thus with small `pmax`, we are only considering the low frequency modes. The conformation generated can be considered as some what **coarse-grained** representation of a gaussian chain. Larger the `pmax` is, more normal modes of higher frequency are included, leading to more detailed structure. The coarsing process can be vividly observed in the above figure from right to left (large `pmax` to small `pmax`). To test our conformations indeed are gaussian chain, we compute the mean end-to-end distance to test whether we get correct Flory scaling ($\langle R_{ee}^{2}\rangle = b^{2}N$).

<img src="https://i.imgur.com/vGmOBMF.png" width="480"/>

As shown in the above plot, we indeed get the correct scaling result, $\langle R_{ee}^{2}\rangle = b^{2}N$. When using this method, care should be taken setting the parameter `pmax`, which is the number of normal modes computed. This number should be large enough to ensure the correct result. Longer the chain is, the larger `pmax` should be set.
