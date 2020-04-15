window.addEventListener('DOMContentLoaded', () => {
    const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            const id = entry.target.getAttribute('id');
            if (entry.intersectionRatio > 0) {
                document.querySelector(`.table-of-contents li a[href="#${id}"]`).parentElement.classList.add('active-toc');
            } else {
                document.querySelector(`.table-of-contents li a[href="#${id}"]`).parentElement.classList.remove('active-toc');
            }
        });
    });

    // Track all sections that have an `id` applied
    document.querySelectorAll('h2[id], h3[id], h4[id], h5[id], h6[id]').forEach((section) => {
        observer.observe(section);
    });
});
