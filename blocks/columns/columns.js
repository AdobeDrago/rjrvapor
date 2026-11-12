export default function decorate(block) {
  const cols = [...block.firstElementChild.children];
  block.classList.add(`columns-${cols.length}-cols`);

  // setup image columns
  [...block.children].forEach((row) => {
    [...row.children].forEach((col) => {
      const pic = col.querySelector('picture');
      if (pic) {
        const picWrapper = pic.closest('div');
        if (picWrapper && picWrapper.children.length === 1) {
          // picture is only content in column
          picWrapper.classList.add('columns-img-col');
        }
      }
    });
  });

  // image-with-content: everything after the heading sits in an accented, indented body
  if (block.classList.contains('image-with-content')) {
    block.querySelectorAll(':scope > div > div:not(.columns-img-col)').forEach((col) => {
      const heading = col.querySelector(':scope > h1, :scope > h2, :scope > h3');
      const rest = [...col.children].filter((el) => el !== heading);
      if (!rest.length) return;
      const body = document.createElement('div');
      body.className = 'image-with-content-body';
      const inner = document.createElement('div');
      inner.append(...rest);
      body.append(inner);
      col.append(body);
    });
  }
}
