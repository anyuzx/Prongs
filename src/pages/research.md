---
title: Research
layout: layouts/default.njk
permalink: /research/index.html
description: "Summary of my research projects"
---

::: note
### The problem of chromosome architecture

Nowadays, we know a great deal of the structure of DNA. However, as for the structure of chromosomes, there is still a lot more we don't know than what we do know. Due to the limitation of experimental techniques, it was very difficult to directly visualize the details of how these extremely long macromolecule organize inside the tight space of nucleus. Humans are inherently visual animals, if we cannot visualize something, we have little confident about our knowledge about it. 

Thanks to the recent advances of various experimental techniques, we start to learn more and more about chromosomes. Compared to just 10 years ago, we now can detect millions of millions of physical contacts between chromosome loci and construct a global view of chromosome organization from it, we can also directly look at individual loci moving around inside live cell nucleus in real time.

My main research interest is to look at this problem from a physicist point of view. I develope theoretical and computational models to study the structure and dynamics of chromosomes as well as its connection to the biological function.
:::

#### Copolymer Chromosome Model
Fingerprints of the three-dimensional organization of genomes have emerged using advances in Hi-C and imaging techniques. However, genome dynamics is poorly understood. Here, we create the chromosome copolymer model (CCM) by representing chromosomes as a copolymer with two epigenetic loci types corresponding to euchromatin and heterochromatin. Using novel clustering techniques, we establish quantitatively that the simulated contact maps and topologically associating domains (TADs) for chromosomes 5 and 10 and those inferred from Hi-C experiments are in good agreement. Chromatin exhibits glassy dynamics with coherent motion on micron scale. The broad distribution of the diffusion exponents of the individual loci, which quantitatively agrees with experiments, is suggestive of highly heterogeneous dynamics. This is reflected in the cell-to-cell variations in the contact maps. Chromosome organization is hierarchical, involving the formation of chromosome droplets (CDs) on genomic scale, coinciding with the TAD size, followed by coalescence of the CDs, reminiscent of Ostwald ripening.

**Publication**
* Shi, G., Liu, L., Hyeon, C., & Thirumalai, D. (2018). [Interphase human chromosome exhibits out of equilibrium glassy dynamics](https://www.nature.com/articles/s41467-018-05606-6). *Nature communications*, 9(1), 3161.


#### FISH-Hi-C Paradox
Hi-C experiments are used to infer the contact probabilities between loci separated by varying genome lengths. Contact probability should decrease as the spatial distance between two loci increases. However, studies comparing Hi-C and FISH data show that in some cases the distance between one pair of loci, with larger Hi-C readout, is paradoxically larger compared to another pair with a smaller value of the contact probability. Here, we show that the FISH-Hi-C paradox can be resolved using a theory based on a Generalized Rouse Model for Chromosomes (GRMC). The FISH-Hi-C paradox arises because the cell population is highly heterogeneous, which means that a given contact is present in only a fraction of cells. Insights from the GRMC is used to construct a theory, without any adjustable parameters, to extract the distribution of subpopulations from the FISH data, which quantitatively reproduces the Hi-C data. Our results show that heterogeneity is pervasive in genome organization at all length scales, reﬂecting large cell-to-cell variations.

**Publication**
* Shi, G., & Thirumalai, D. (2019). Conformational Heterogeneity in Human Interphase Chromosome Organization Reconciles the FISH and Hi-C Paradox. *Accepted by Nature Communication*. [bioRxiv preprint](https://www.biorxiv.org/content/10.1101/615120v3).

#### 3D Reconstruction of Chromosomes
The extensive conformational heterogeneity hinders our ability to infer the 3D structure of chromosomes from population-based Hi-C map. In this study, we proved that there exist a theoretical lower bound to spatial distance and contact probability by a simple power law relation. Hence the inverse engineering problem - inferring spatial organization from Hi-C map - can be solved in approximation in spite of the presence of heterogeneity. Using simulation, we show that the overall organization can be captured by constructing distance map from contact map justifying the use of the lower bound. Finally, by applying our method combined with various manifold embedding methods to experimental Hi-C data, we are able to visualize the averaged global 3D organization of single chromosome and also local structures such as Topological Associated Domains (TADs). In the end, we discuss the limitation of Hi-C map as an ensemble average measurement.

---

#### Multi-motor System
Molecular motors are proteins which consume ATP to perform work in the cell. They play important roles in many biological processes, such as RNA polymerase in translocating along DNA to transcribe gene, Kinesins or dyneins in carrying a vesicle along the microtube, Myosins in generating a muscle contraction. As much as what we know for a single motor, how do multiple motors work as a team is unclear. In fact, motors in vivo almost always work as teams, i,e a cargo is shared by multiple motors of the same kind or even different kind. In this study, we present a simple kinetic model for studying elastically coupled motor system. We find that multi-motors system is more efficient for transporting large cargo but less efficient for transporting small cargo compared to the single motor. The model presented in this study is general and easy to extend.
