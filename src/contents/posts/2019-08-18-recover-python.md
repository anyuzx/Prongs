---
title: How to recover the deleted function in jupyter notebook?
excerpt: Suppose you defined a function `myfunc` in jupyter notebook but deleted it by accident and don't want to rewrite it. You can use the following function to recover it.
tags:
  - python
  - jupyter notebook
---

Suppose you define a function `myfunc` in jupyter notebook but delete it by accident and don't want to rewrite it. You can use the following function to recover it,
```python
def rescue_code(function):
    import inspect
    get_ipython().set_next_input("".join(inspect.getsourcelines(function)[0]))
```

To recover, just do this
```python
rescue_code(myfunc)
```
