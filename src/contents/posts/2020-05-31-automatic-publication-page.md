---
slug: automatic-publication-page
title: Automatic publication page
date: 2020-06-01
disableKatex: true
excerpt: "A note on how I generate publication page programmatically"
tags:
    - javascript
---

I have a [publication](/publication/) page where my publications are displayed. Since I don't have many publications currently, it is pretty easy to just manually list each publication in a markdown or directly in HTML. However, it can become tedious and error-prone once there is a large number of publications.  And what if I want to manipulate how to display them? The process can become labor intense. So I do it automatically. Here is how I do it.

::: note
The example shown here is written in JavaScript, but the codes should be easily rewritten in Python as well.
:::

## Get bibliographic metadata from DOI

To make the process as automatic as possible, I use DOI as a single entry point. Each publication has a unique DOI associated with it and it can be used to get the information of the publication. For instance, https://www.doi2bib.org/ can give you a BibTeX entry from a DOI (I use this site a lot). The BibTeX entry contains information like title, authors, journal, year, etc which I would like to populate into the HTML. 

Suppose I store an array of DOI in a file called `DOI.json`. What I would like to have is to loop through the list, find the bibliographic metadata of each DOI, and return the results in a readable format (preferably `JSON`). To do this, first I need to have a method to generate bibliographic metadata programmatically.

### DOI Content Negotiation

Fortunately, doi.org provides a nice content negotiation [API](https://citation.crosscite.org/docs.html) to query metadata associated with a DOI. Following the documentation, it is pretty straightforward to write the core logic to do it,

```js
// function to query the bibliographic metadata
async function getBib(doi) {
  const respose = await axios({
    url: "https://doi.org/" + doi,
    headers: {
      Accept: "application/vnd.citationstyles.csl+json",
    },
  });
  return response.data;
}
```

::: note
I use `vnd.citationstyles.csl+json` so that the result is in [CSL JSON](https://github.com/citation-style-language/schema) format because it is simple to work with. There are [many other](https://citation.crosscite.org/docs.html) types supported as well. For instance, you can get a BibTeX entry using `application/x-bibtex` instead of `application/vnd.citationstyles.csl+json`.
:::


## Incorporate into the site

Now, I can get the data I want using the method described above. How to use it to generate the HTML page? This would vary depending on what tools one uses to generate the site. 

I am using [11ty](https://www.11ty.dev/) to build my site. One of the many good things I like about it is that it allows me to use the data pretty straightforward. The supported [JavaScript Data Files](https://www.11ty.dev/docs/data-js/) allow me to simply write the query logic and 11ty will automatically pick up the data, and make it available in the template.

```js
const doiList = require("./DOI.json");

module.exports = function () {
  return Promise.all(doiList.map(getBib));
};
```

The code lives inside `getBib.js` file inside the `_data` directory. During the build, the bibliographic metadata retrieved through the content negotiation API will be available in the template under the `getBib` key. The value is an array whose elements are the bibliographic data for each DOI stored in `DOI.json`. For instance, if I want to display the title of the first publication, I can simply access it under `getBib[0].title`

---

It is fun to do this small coding exercise. I learned a little bit about [DOI](https://en.wikipedia.org/wiki/DOI) along the way. For example, I have always wondered why clicking a link like https://doi.org/10.1103/PhysRev.108.171 will take me to the publisher's site. I now know it is achieved by the so-called [DOI resolver](https://www.doi.org/factsheets/DOIProxy.html).

Many other things can be done here. For instance, it would be nice to retrieve all publications from a single [ORCID](https://orcid.org/) identifier. This way, I don't even have to have a file storing the DOIs. My guess is it can be done through their [API](https://support.orcid.org/hc/en-us/articles/360006897174).

I also found several packages/modules related to what I am doing here. I end up not using these tools because my goal is pretty simple to achieve. But check them out below if you are interested.

---

## Other Resources
- [citeproc-js](https://github.com/Juris-M/citeproc-js)
- [citation-js](https://github.com/citation-js)
- [citeproc-py](https://github.com/brechtm/citeproc-py)
- [pandoc-citeproc](https://github.com/jgm/pandoc-citeproc)
