---
title: FISH-Hi-C Paradox
permalink: false
date: 2019-08-14
image:
  path: /assets/images/project-heterogeneity-illustration.min.png
  pathThumbnail: /assets/images/project-heterogeneity-illustration.small.min.png
  description: Genomic Folding Landscape
---

Hi-C experiments infer the contact probabilities between loci separated by varying genome lengths. Contact probability should decrease as the spatial distance between two loci increases. However, studies comparing Hi-C and FISH data show that in some cases the distance between one pair of loci, with larger Hi-C readout, is paradoxically larger compared to another pair with a smaller value of the contact probability.

We proposed a theoretical framework based on Generalized Rouse Model to solve the FISH-Hi-C paradox, which revealed the heterogeneity of genome organization. The FISH-Hi-C paradox arises because the cell population is highly heterogeneous, which means that a given contact is present in only a fraction of cells. Using an exactly solvable model I constructed a theory, without any adjustable parameters, to extract the distribution of subpopulations from the FISH data, which quantitatively reproduces the Hi-C data.

We applied the theory to the latest experimental measurements and found that the heterogeneity is pervasive in genome organization at all length scales, reﬂecting large cell-to-cell variations.

### Publication

* **Shi, G.**, & Thirumalai, D. (2019). [Conformational Heterogeneity in Human Interphase Chromosome Organization Reconciles the FISH and Hi-C Paradox](https://www.nature.com/articles/s41467-019-11897-0). *Nature Communication*, 10(1), 3894.

### Resources

[Code](https://github.com/anyuzx/chromosome-heterogeneity-analysis)
