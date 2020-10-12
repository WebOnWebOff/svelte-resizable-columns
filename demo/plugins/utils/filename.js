export default (id) =>
  id
    .split('\\')
    .pop()
    .split('.')
    .shift();
