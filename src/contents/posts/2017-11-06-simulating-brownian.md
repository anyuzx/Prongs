---
title: "Simulating Brownian Dynamics (overdamped Langevin Dynamics) using LAMMPS"
date: 2017-11-06
excerpt: "Writing a overdamped Brownian Dynamics fix for LAMMPS. LAMMPS is a very powerful Molecular Dynamics simulation software I use in my daily research. In our research group, we mainly run Langevin Dynamics (LD) or Brownian Dynamics (BD) simulation. However, for some reason, LAMMPS doesn't provide a way to do Brownian Dynamics (BD) simulation. Both the LD and BD can be used to sample correct canonical ensemble, which sometimes also be called NVT ensemble"
categories:
  - research
tags:
  - LAMMPS
  - simulation
---

::: note
This article was originally posted on my old Wordpress blog [here](https://biophyenvpol.wordpress.com/2017/11/06/simulating-brownian-dynamics-overdamped-langevin-dynamics-using-lammps/).
:::

LAMMPS is a very powerful Molecular Dynamics simulation software I use in my daily research. In our research group, we mainly run Langevin Dynamics (LD) or Brownian Dynamics (BD) simulation. However, for some reason, LAMMPS doesn't provide a way to do Brownian Dynamics (BD) simulation. Both the LD and BD can be used to sample correct canonical ensemble, which sometimes also be called NVT ensemble.

The BD is the large friction limit of LD, where the inertia is neglected. Thus BD is also called overdamped Langevin Dynamics. It is very important to know the difference between LD and BD since these two terms seems be used indifferently by many people which is simply **not** correct.

The equation of motion of LD is,

$$
m \ddot{\mathbf{x}} = -\nabla U(\mathbf{x}) - m\gamma \dot{\mathbf{x}}+\mathbf{R}(t)
$$

where $m$ is the mass of the particle, $x$ is its position and $\gamma$ is the damping constant. $\mathbf{R}(t)$ is random force. The random force is subjected to fluctuation-dissipation theorem. $\langle \mathbf{R}(0)\cdot\mathbf{R}(t) \rangle = 2m\gamma\delta(t)/\beta$. $\gamma=\xi/m$ where $\xi$ is the drag coefficient. $\mathbf{R(t)}$ is nowhere differentiable, its integral is called *Wiener process*. Denote the wiener process associated with $ \mathbf{R}(t)$ as $\omega(t)$. It has the property $\omega(t+\Delta t)-\omega(t)=\sqrt{\Delta t}\theta$, $\theta$ is the Gaussian random variable of zero mean, variance of $2m\gamma/\beta$.


$$
\langle \theta \rangle = 0\quad\quad\langle \theta^{2}\rangle = 2m\gamma/\beta
$$


The fix `fix langevin` provided in `LAMMPS` is the numerical simulation of the above equation. `LAMMPS` uses a very simple integration scheme. It is the Velocity-Verlet algorithm where the force on a particle includes the friction drag term and the noise term. Since it is just a first order algorithm in terms of the random noise, it can not be used for large friction case. Thus the `langevin fix` in `LAMMPS` is mainly just used as a way to conserve the temperature (thermostat) in the simulation to sample the conformation space. However in many cases, we want to study the dynamics of our interested system realistically where friction is much larger than the inertia. We need to do BD simulation.

For a overdamped system, $\gamma=\xi/m$ is very large, let's take the limit $\gamma=\xi/m\to\infty$, the bath becomes infinitely dissipative (overdamped). Then we can neglect the left side of the equation of LD. Thus for BD, the equation of motion becomes

$$
\dot{\mathbf{x}}=-\frac{1}{\gamma m}\nabla U(\mathbf{x})+\frac{1}{\gamma m}\mathbf{R}(t)
$$

The first order integration scheme of the above equation is called *Euler-Maruyama* algorithm, given as

$$
\mathbf{x}(t+\Delta t)-\mathbf{x}(t)=-\frac{\Delta t}{m\gamma}\nabla U(\mathbf{x})+\sqrt{\frac{2\Delta t}{m\gamma\beta}}\omega(t)
$$

where $\omega(t)$ is the normal random variable with zero mean and unit variance. Since for BD, the velocities are not well defined anymore, only the positions are updated. The implementation of this scheme in `LAMMPS` is straightforward. Based on source codes `fix_langevin.cpp` and `fix_langevin.h` in the `LAMMPS`, I wrote a custom `fix` of BD myself. The core part of the code is the following. The whole code is [here](https://raw.githubusercontent.com/anyuzx/Lammps_brownian/master/fix_bd.cpp).

~~~cpp
...
void FixBD::initial_integrate(int vflag)
{
  double dtfm;
  double randf;

  // update x of atoms in group

  double **x = atom->x;
  double **f = atom->f;
  double *rmass = atom->rmass;
  double *mass = atom->mass;
  int *type = atom->type;
  int *mask = atom->mask;
  int nlocal = atom->nlocal;
  if (igroup == atom->firstgroup) nlocal = atom->nfirst;

  if (rmass) {
    for (int i = 0; i < nlocal; i++)
      if (mask[i] & groupbit) {
        dtfm = dtf / rmass[i];
        randf = sqrt(rmass[i]) * gfactor;
        x[i][0] += dtv * dtfm * (f[i][0]+randf*random->gaussian());
        x[i][1] += dtv * dtfm * (f[i][1]+randf*random->gaussian());
        x[i][2] += dtv * dtfm * (f[i][2]+randf*random->gaussian());
      }

  } else {
    for (int i = 0; i < nlocal; i++)
      if (mask[i] & groupbit) {
        dtfm = dtf / mass[type[i]];
        randf = sqrt(mass[type[i]]) * gfactor;
        x[i][0] += dtv * dtfm * (f[i][0]+randf*random->gaussian());
        x[i][1] += dtv * dtfm * (f[i][1]+randf*random->gaussian());
        x[i][2] += dtv * dtfm * (f[i][2]+randf*random->gaussian());
      }
  }
 }
...
~~~

As one can see, the implementation of the integration scheme is easy, shown above. `dtv` is the time step $\Delta t$ used. `dtfm` is $1/(\gamma m)$ and `randf` is $\sqrt{2m\gamma/(\Delta t\beta)}$.

The *Euler-Maruyama* scheme is a simple first order algorithm. Many studies has been done on higher order integration scheme allowing large time step being used. I also implemented a method shown in [this paper](https://academic.oup.com/amrx/article-abstract/2013/1/34/166771). The integration scheme called `BAOAB` is very simple, given as

$$
\mathbf{x}(t+\Delta t)-\mathbf{x}(t)=-\frac{\Delta t}{m\gamma}\nabla U(\mathbf{x})+\sqrt{\frac{\Delta t}{2m\gamma\beta}}(\omega(t+\Delta t)+\omega(t))
$$

The source code of this method can be downloaded [here](https://raw.githubusercontent.com/anyuzx/Lammps_brownian/master/fix_bd_baoab.cpp). In addition, feel free to fork my Github [repository](https://github.com/anyuzx/Lammps_brownian) for `fix bd` and `fix bd/baoab`. I have done some tests and have been using this code in my research for a while and haven't found problems. But please test the code yourself if you intend to use it and welcome any feedback if you find any problems.

::: note
To decide whether to use LD or BD in the simulation, one need to compare relevant timescales. Consider a free particle governed by the Langevin equation. Solving for the velocity autocorrelation function leads to, $\langle v(0)v(t)\rangle=(kT/m)e^{-\gamma t}$. This shows that the relaxation time for momentum is $\tau_m = 1/\gamma=m/\xi$. There is another timescale called Brownian timescale calculated by $\tau_{BD}=\sigma^2\xi/kT$ where $\sigma$ is the size of the particle. $\tau_{BD}$ is the timescale at which the particle diffuses about its own size. If $\tau_{BD}\gg \tau_m$ **and** if you are not interested at the dynamics on the timescale $\tau_m$, then one can use BD since the momentum can be safely integrated out. However, if these two timescales are comparable or $\tau_{BD}<\tau_m$, then only LD can be used because the momentum cannot be neglected in this case. To make the problem more complicated, there are more than just these two timescales in most of simulation cases, such as the relaxation time of bond vibration, etc... Fortunately, practically, comparing these two timescales is good enough for many cases.
:::
