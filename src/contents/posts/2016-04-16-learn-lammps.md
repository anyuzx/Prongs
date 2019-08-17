---
title: "Understanding LAMMPS Source Codes: A Study Note"
date: 2016-04-16
excerpt: "Learn how to hack your LAMMPS codes. Lessons from studying source codes. This is a note about learning LAMMPS source codes. This note focuses on compute style of Lammps which is used to compute certain quantity during the simulation run. Of course you can as well compute these quantities in post-process, however it's usually faster to do it in the simulation since you can take advantage of the all the distance, forces, et al generated during the simulation instead of computing them again in post-process"
categories:
  - research
tags:
  - LAMMPS
  - c++
disableKatex: true
---


This is a note about learning `LAMMPS` source codes. This note focuses on compute style of `Lammps` which is used to compute certain quantity during the simulation run. Of course you can as well compute these quantities in post-process, however it's usually faster to do it in the simulation since you can take advantage of the all the distance, forces, et al generated during the simulation instead of computing them again in post-process. I will go through the `LAMMPS` source code `compute_gyration.h` and `compute_gyration.cpp`. I am not very familiar with `c++`, so I will also explain some language related details which is what I learn when studying the code. Hope this article can be helpful when someone want to modify or make their own `Lammps` compute style.

## `compute_gyration.h`

~~~ cpp
#ifdef COMPUTE_CLASS

ComputeStyle(gyration,ComputeGyration)

#else

#ifndef LMP_COMPUTE_GYRATION_H
#define LMP_COMPUTE_GYRATION_H

#include "compute.h"

namespace LAMMPS_NS {

class ComputeGyration : public Compute {
 public:
  ComputeGyration(class LAMMPS *, int, char **);
  ~ComputeGyration();
  void init();
  double compute_scalar();
  void compute_vector();

 private:
  double masstotal;
};

}

#endif
#endif
~~~

First part of this code

~~~ cpp
#ifdef COMPUTE_CLASS

ComputeStyle(gyration,ComputeGyration)

#else
~~~

is where this specific compute style is defined. If you want to write your own compute style, let's say [**intermediate scattering function**](https://en.wikipedia.org/wiki/Dynamic_structure_factor). Then we write like this

~~~ cpp
#ifdef COMPUTE_CLASS

ComputeStyle(isf,ComputeISF)  // ISF stands for intermediate scattering function

#else
~~~

-------

Move to the rest part. `#include "compute.h"` and `namespace LAMMPS_NS` is to include the base class and namespace. Nothing special is here, you need to have this in every specific compute style header file.

~~~ cpp
class ComputeGyration : public Compute {
 public:
  ComputeGyration(class LAMMPS *, int, char **);
  ~ComputeGyration();
  void init();
  double compute_scalar();
  void compute_vector();

 private:
  double masstotal;
~~~

You can see there is a overal structure in the above code `class A : public B`. This basically means that our derived class A will inherit all the public and protected member of class B. More details can be found [here](http://www.tutorialspoint.com/cplusplus/cpp_inheritance.htm), [here](http://stackoverflow.com/questions/374399/why-do-we-actually-need-private-or-protected-inheritance-in-c/374423#374423) and [here](http://stackoverflow.com/questions/860339/difference-between-private-public-and-protected-inheritance)

Next, we declare two types of member of our derived class, `public` and `private`. `public` is the member we want the other code can access to and `private` is the member which is only used in the derived class scope. Now let's look at the public class member. Note that there is no type declaration of class member `ComputeGyration` and `~ComputeGyration`. They are called [_Class Constructor_](http://www.tutorialspoint.com/cplusplus/cpp_constructor_destructor.htm) and [_Class Destructor_](http://www.tutorialspoint.com/cplusplus/cpp_constructor_destructor.htm). They are usually used to set up the initial values for certain member variables as we can see later in `compute_gyration.cpp`. Note that for some compute style such as `compute_msd.h`, the destructor is virtual, that is `virtual ~ComputeMSD` instead of just `~ComputeMSD`. This is because class `ComputeMSD` is also inherited by derive class `ComputeMSDNonGauss`. So you need to decalre the base destructor as being virtual. Look at this [page](http://stackoverflow.com/questions/461203/when-to-use-virtual-destructors) for more details. Now let's move forward.

~~~ cpp
  void init();
  double compute_scalar();
  void compute_vector();
~~~

here all the function `init`, `compute_scalar` and `compute_vector` all are the base class member which are already defined in `compute.h`. However they are all virtual functions, which means that they can be overrided in the derived class, here it is the `ComputeGyration`. [This](http://stackoverflow.com/questions/2391679/why-do-we-need-virtual-methods-in-c) and [this](http://nrecursions.blogspot.in/2015/06/so-why-do-we-need-virtual-functions.html) pages provide some basic explanations for the use of virtual functions. Here is a list shown in LAMMPS documentation of **some examples** of the virtual functions you can use in your derived class.

<figure class="align-center">
  <img src="https://ws4.sinaimg.cn/large/006tNc79ly1g30qx6pv6lj30uy0paq7y.jpg" width="480"/>
  <figcaption>Virtual function list of `compute.h`</figcaption>
</figure>

In our case, gyration computation will return a scalor and a vector, then we need `compute_scalar()` and `compute_vector()`. Private member `masstotal` is the quantity calculated locally which is only used within the class and not needed for the rest of the codes.

------

## `compute_gyration.cpp`

Now let's look at the `compute_gyration.cpp`.

~~~ cpp
#include <math.h>
#include "compute_gyration.h"
#include "update.h"
#include "atom.h"
#include "group.h"
#include "domain.h"
#include "error.h"
~~~

Here the necessary header files are include. The name of these header file is self-explanary. For instance, `updata.h` declare the functions to update the timestep, et al.

~~~ cpp
ComputeGyration::ComputeGyration(LAMMPS *lmp, int narg, char **arg) :
  Compute(lmp, narg, arg)
{
  if (narg != 3) error->all(FLERR,"Illegal compute gyration command");

  scalar_flag = vector_flag = 1;
  size_vector = 6;
  extscalar = 0;
  extvector = 0;

  vector = new double[6];
}
~~~

The above code define the what the constructor `ComputeGyration` actually does. `::` is called _scope operator_, it is used to specify that the function being defined is a member (in our case which is the constructor which has the same name as the its class) of the class `ComputeGyration` and not a regular non-member function. The structure `ComputeGyration : Compute()` is called a **Member Initializer List**. It initializes the member `Compute()` with the arguments `lmp, narg, arg`. `narg` is the number of arguments provided. `scalar_flag`, `vector_flag`, `size_vector`, `extscalar` and `extvector` all are the flags parameter defined in `Compute.h`. For instance, `scalar_flag = 1/0` indicates we will/won't use function `compute_scalar()` in our derived class. The meaning of each parameter is explained in `compute.h`. This line `vector = new double[6]` is to dynamically allocate the memory for array of length 6. Normally the syntax of **new** operator is such

~~~ cpp
double *vector = NULL;
vector = new double[6];
~~~

Here the line `double *vector = NULL` is actually in `compute.h` and `compute.cpp`. Where pointer `vector` is defined in `compute.h` and its value is set to `NULL` in `compute.cpp`.

~~~ cpp
ComputeGyration::~ComputeGyration()
{
  delete [] vector;
}
~~~

The above code speficy destructor that is what will be excuted when class `ComputeGyration` goes out of scope or is deleted. In this case, it delete the gyration tensor vector defined above. The syntax of **delete** operator for array is `delete [] vector`. For details of **new** and **delete** can be found [here](http://www.tutorialspoint.com/cplusplus/cpp_dynamic_memory.htm).

~~~ cpp
void ComputeGyration::init()
{
  masstotal = group->mass(igroup);
}
~~~

This part perform one time setup like initialization. Operator **->** is just a syntax sugar, `class->member` is equivalent with `(*class).member`. What `group->mass(igroup)` does is to call the member `mass()` function of class `group`, provided the group-ID, and return the total mass of this group. How value of `igroup` is set can be examined in `compute.cpp`. It's the second argument of compute style.

~~~ cpp
double ComputeGyration::compute_scalar()
{
  invoked_scalar = update->ntimestep;

  double xcm[3];
  group->xcm(igroup,masstotal,xcm);
  scalar = group->gyration(igroup,masstotal,xcm);
  return scalar;
}
~~~

`invoked_scalar` is defined in base class `Compute`. The value is the last timestep on which `compute_scalar()` was invoked. `ntimestep` is the member of class `update` which is the current timestep. `xcm` function of class `group` calculate the center-of-mass coords. The result will be stored in `xcm`. `gyration` function calculate the gyration of a group given the total mass and center of mass of the group. The total mass is calculated in `init()`. And in order for it to be accessed here, it is defined as private in `compute_gyration.h`. Notice that here there is no explicit code to calculte the gyration scalor because the member function which does this job is already defined in class `group`. So we just need to call it. However we also want to calculate the gyration tensor, we need to write a function to calculate it.

~~~ cpp
void ComputeGyration::compute_vector()
{
  invoked_vector = update->ntimestep;

  double xcm[3];
  group->xcm(igroup,masstotal,xcm);

  double **x = atom->x;
  int *mask = atom->mask;
  int *type = atom->type;
  imageint *image = atom->image;
  double *mass = atom->mass;
  double *rmass = atom->rmass;
  int nlocal = atom->nlocal;

  double dx,dy,dz,massone;
  double unwrap[3];

  double rg[6];
  rg[0] = rg[1] = rg[2] = rg[3] = rg[4] = rg[5] = 0.0;

  for (int i = 0; i < nlocal; i++)
    if (mask[i] & groupbit) {
      if (rmass) massone = rmass[i];
      else massone = mass[type[i]];

      domain->unmap(x[i],image[i],unwrap);
      dx = unwrap[0] - xcm[0];
      dy = unwrap[1] - xcm[1];
      dz = unwrap[2] - xcm[2];

      rg[0] += dx*dx * massone;
      rg[1] += dy*dy * massone;
      rg[2] += dz*dz * massone;
      rg[3] += dx*dy * massone;
      rg[4] += dx*dz * massone;
      rg[5] += dy*dz * massone;
    }
  MPI_Allreduce(rg,vector,6,MPI_DOUBLE,MPI_SUM,world);

  if (masstotal == 0.0) return;
  for (int i = 0; i < 6; i++) vector[i] = vector[i]/masstotal;
}
~~~

The above code do the actual computation of gyration tensor.

Here is the list of meaning of each variable

* `x`: 2D array of the position of atoms.
* `mask`: array of group information of each atom. `if (mask[i] & groupbit) ` check whether the atom is in the group on which we want to perform calculation.
* `type`: type of atom.
* `image`: image flags of atoms. For instance a value of 2 means add 2 box lengths to get the unwrapped coordinate.
* `mass`: mass of atoms.
* `rmass`: mass of atoms with finite-size (meaning that it can have rotational motion). Notice that mass of such particle is set by density and diameter, not directly by the mass. That's why they set two variables `rmass` and `mass`. To extract mass of atom `i`, use `rmass[i]` or `mass[type[i]]`.
* `nlocal`: number of atoms in one processor.

Look at this line `domain->unmap(x[i],image[i],unwrap)`, `domain.cpp` tells that function `unmap` return the unwrapped coordination of atoms in `unwrap`. The following several lines calculate the [gyration tensor](https://en.wikipedia.org/wiki/Gyration_tensor). The MPI code `MPI_Allreduce(rg,vector,6,MPI_DOUBLE,MPI_SUM,world)` sums all the six components of `rg` calculated by each processor, store the value in `vector` and then distribute `vector` to all the processors. Refer to this [article](http://mpitutorial.com/tutorials/mpi-reduce-and-allreduce/) for details.

Here are two good articles about understanding and hacking LAMMPS code.

* [A dissection of LAMMPS classes - A Guide for Beginner LAMMPS Hackers](https://sites.google.com/site/scienceuprising/code-packages/lammps/a-dissection-of-lammps-classes#TOC-The-Atom-Class)
* [How to Write Fix for LAMMPS](http://kirilllykov.github.io/blog/2012/10/13/writing-fixes-for-lammps/)
